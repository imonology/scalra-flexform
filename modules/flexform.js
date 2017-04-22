/*
	flexform module - a module to support flexible, variable field size/type system
	
	history:
		2016-10-01		refactored from /handler.js of BW-TC project
		2016-12-29		convert into a scalra module


*/
var moment = require('moment');

var l_name = 'FlexForm';

LOG.warn('FlexForm is being loaded as a module...', l_name);

// define form model
var l_form;
var l_dbForm = 'FlexForm';

var l_models = {};
l_models[l_dbForm] = {
	id:			'*string',
	name:		'string',
	key_field:	'string',
	data: 		'object', 	// 欄位名稱 & 欄位資料
};

// module object
var l_module = exports.module = {};

// a pool for all message handlers
var l_handlers = exports.handlers = {};
var l_checkers = exports.checkers = {};

// module init
l_module.start = function (config, onDone) {
	LOG.warn('FlexForm module started...', l_name);
	
	SR.DS.init({models: l_models}, function (err, ref) {
		if (err) {
			LOG.error(err, l_name);	
		}
		
		l_form = ref[l_dbForm];
		
		UTIL.safeCall(onDone);
	});
}

// module shutdown
l_module.stop = function (onDone) {
	UTIL.safeCall(onDone);
}

// register this module
SR.Module.add('FlexForm', l_module);

/*
id:			'string',
name:		'string',
key_field:	'string',
fields: 	'object', // 欄位名稱
data:  		'object', // 欄位資料
*/

SR.API.add('CREATE_FORM', {
	name:		'string',
	key_field:	'+string',
	fields: 	'object', // 欄位名稱
}, function (args, onDone) {
	
	var form = {
		id: UTIL.createUUID(),
		name: args.name,
		key_field: args.key_field || '',
		data: {
			fields: args.fields,
			values: {}
		}
	};

	//LOG.warn(form);

	if (!l_form) {
		return onDone('l_form not init, cannot add');
	}
		
	l_form.add(form, function (err, result) {
		if (err) {
			return onDone(err);	
		}
		LOG.warn('CREATE_FORM [' + args.name + '] success');
		onDone(null, {id: form.id});
	});
});

SR.API.add('UPDATE_FORM', {
	form_id:	'string',		// form id
	values:		'+object',		// data to be stored
	value_array: '+array',		// an array of values
	record_id:	'+string'		// optional id to assoicate the values being stored with another record
}, function (args, onDone) {

	// get form
	if (l_form.hasOwnProperty(args.form_id) === false) {
		return onDone('form id invalid: ' + args.form_id);
	}

	var form = l_form[args.form_id];
	var values = form.data.values;
	
	// set of record_id stored, to be returned
	var record_ids = [];
	
	// check if just one set of values or multiples
	var value_array = args.value_array || [];
	if (args.values)
		value_array.push(args.values);
	
	LOG.warn('value_array:');
	LOG.warn(value_array);

	var keymap = undefined;
	if (typeof form.key_field === 'string' && form.key_field !== '') {
		keymap = SR.State.get(form.name + 'Map');
	}
		
	// store each with unique record_id
	for (var i=0; i < value_array.length; i++) {

		var record_id = UTIL.createToken();
		
		// check for existing record_id
		if (value_array[i]['_record_id']) {
			record_id = value_array[i]['_record_id'];
			delete value_array[i]['_record_id'];
			LOG.warn('updateing existing record [' + record_id + ']');
		}
		
		if (!values[record_id]) {
			values[record_id] = {};
		}

		// TODO: no type check is performed? (for example, input is string but should expect number)
		for (var key in value_array[i]) {
			values[record_id][key] = value_array[i][key];
		}
		
		// add new record to key-value map
		if (keymap) {
			keymap[values[record_id][form.key_field]] = values[record_id];
		}	
		
		// check whether to store optional associated record_id
		if (args.record_id) {
			values[record_id]['record_id'] = args.record_id;
			LOG.warn('values after storing record_id:');
			LOG.warn(values[record_id]);
		}
		
		record_ids.push(record_id);
	}

	form.sync(function (err) {
		if (err) {
			return onDone('save to DB error: ' + err);	
		}

		onDone(null, {form_id: args.form_id, record_ids: record_ids});
	});	
});

// update values for certain fields (record_id optional)
SR.API.add('UPDATE_FIELD', {
	form_id: 	'+string',		// form id
	form_name:	'+string',		// form name
	record_id: 	'+string',		// unique record id, if not exist, then it's same as UPDATE_FORM
	values: 	'object',		// data to be stored
}, function (args, onDone) {

	if (!args.form_id && !args.form_name)
		return onDone('values not found for form_id or form_name ');
	
	var form = undefined;
	
	// get form
	if (args.form_name) { // by name
		for (var form_id in l_form) {
			if (l_form[form_id].name === args.form_name)  {
				form = l_form[form_id];
				break;
			}
		}
		if (!form) {
			return onDone('form name invalid: ' + args.form_name);
		}
	} else { // by id
		if (l_form.hasOwnProperty(args.form_id) === false) {
			return onDone('form id invalid: ' + args.form_id);
		}

		form = l_form[args.form_id];
	}
	
	LOG.warn('values to update:');
	LOG.warn(args.values);
	var values_map = form.data.values;
	
	// check if this is new record
	if (!args.record_id) {
		args.record_id = UTIL.createToken();
		values_map[args.record_id] = {};
	}
	
	if (values_map.hasOwnProperty(args.record_id) === false) {
		return onDone('values not found for record id [' + args.record_id + ']');	
	}

	var err_msg = [];

	// perform type check for numbers (make sure 'number' type are all numbers and not 'strings')			
	var fields = form.data.fields;
	for (var j=0; j < fields.length; j++) {
		if (fields[j].type === 'number' && args.values.hasOwnProperty(fields[j].id)) {
			LOG.warn(fields[j].id + ' try convert to number...');
			try {
				var num = parseInt(args.values[fields[j].id]);
				LOG.warn(num + ' type: ' + typeof num);
				
				if (isNaN(num)) {
					LOG.warn(args.values[fields[j].id] + ' is not a number, ignore it');
					args.values[fields[j].id] = undefined;
				} else {
					args.values[fields[j].id] = num;	
				}
			} catch (e) {
				err_msg.push(e);	
			}
		}
	}
	
	// check if convert error exists
	if (err_msg.length > 0) {
		return onDone('input data number type cannot be converted', err_msg);
	}
			
	// override all data for fields with same key (but leave others)
	for (var key in args.values) {
		if (typeof args.values[key] !== 'undefined') {
			values_map[args.record_id][key] = args.values[key];
		}
	}
	
	// record to form map if form's 'key_field' exists
	if (typeof form.key_field === 'string' && form.key_field !== '') {
		var keymap = SR.State.get(form.name + 'Map');
		keymap[values_map[args.record_id][form.key_field]] = values_map[args.record_id];	
	}
	
	//LOG.warn('final data to sync:');
	//LOG.warn(values_map[args.record_id]);

	form.sync(function (err) {
		if (err) {
			return onDone('save to DB error: ' + err);
		}
		onDone(null, {desc:'form [' + args.form_id + '] record [' + args.record_id + '] updated', record_id:args.record_id});
	});
});

// allow string to check if it begins with something
// ref: http://stackoverflow.com/questions/1767246/javascript-check-if-string-begins-with-something
String.prototype.startsWith = function (needle) {
    return(this.indexOf(needle) == 0);
};

// get a form content based on name or id
var l_get = function (id, name) {
	
	// check para availability
	if (typeof id !== 'string' && typeof name !== 'string') {
		return undefined;
	}
	
	var form = undefined;
	
	if (id && l_form.hasOwnProperty(id)) {
		form = l_form[args.id];	
	} else if (name) {
		// search via name
		for (var id in l_form) {
			if (l_form[id].name === name) {
				form = l_form[id];
				break;
			}
		}
	}	
	
	return form;
}

// get form fields only given a form name or id
SR.API.add('GET_FORM_FIELDS', {
	id:		'+string',			// form id
	name:	'+string',			// form name
}, function (args, onDone) {

	var form = l_get(args.id, args.name);	

	// no valid form found
	if (!form) {
		return onDone('no form can be found by id [' + args.id + '] or name [' + args.name + ']');
	}

	onDone(null, {id: form.id, name: form.name, fields: form.data.fields});	
});	

// get only the fields and values of a queried form
SR.API.add('GET_FORM', {
	id:		'+string',			// form id
	name:	'+string',			// form name
	query:	'+object',			// optional query finding exact matches
	overlap: '+object',			// find records if intervals between 'period' overlaps with [start, end] interval  
	show:	'+array',			// only show specific fields
	show_unchecked: '+object'	// only show if specified checkboxes are unchecked
}, function (args, onDone) {

	//LOG.warn('GET_FORM args:');
	//LOG.warn(args);
	
	SR.API.QUERY_FORM(args, function (err, form) {
		if (err) {
			return onDone(err);	
		}
		
		// return only the form's client returnable info
		onDone(null, {id: form.id, name: form.name, key_field: form.key_field, data: form.data});
	});
});

// query content of a particular form based on form id or form name
SR.API.add('QUERY_FORM', {
	id:		'+string',			// form id
	name:	'+string',			// form name
	query:	'+object',			// optional query finding exact matches
	query_partial: '+object',	// query for any value partially matching the specified query keys' values
	overlap: '+object',			// find records if intervals between 'period' overlaps with [start, end] interval  
	show:	'+array',			// only show specific fields
	show_unchecked: '+object',	// only show if specified checkboxes are unchecked
	start_date:	'+string',		// 當query裡面有date，且需要設定搜尋範圍時。此時query只能使用一個date key
	end_date:	'+string'
}, function (args, onDone) {
	var form = l_get(args.id, args.name);	

	// no valid form found
	if (!form) {
		return onDone('no form can be found by id [' + args.id + '] or name [' + args.name + ']');
	}
	
	delete args['id'];
	delete args['name'];
		
	// check whether to perform conditional query or limit fields to display
	if (Object.keys(args).length === 0) {
		return onDone(null, form);
	}

	// produce custom form content	
	var full_form = form;
	form = {};
	
	// copy string fields first
	for (var name in full_form) {
		if (typeof full_form[name] === 'string')
			form[name] = full_form[name];
	}
	form.data = {
		fields: [],
		values: {}
	};
	
	var full_fields = full_form.data.fields;
	var full_values = full_form.data.values;
	
	// check which fields will be shown (if 'show' parameter is supplied)
	if (args.show) {
		// preserve to-show fields, also in that order
		// NOTE: so field ordering in args.show may not match that in full_fields
		for (var i=0; i < full_fields.length; i++) {
			var idx = args.show.indexOf(full_fields[i].id);
			if (idx !== (-1)) {
				form.data.fields[idx] = full_fields[i];	
			}
		}

		delete args['show'];
		
	} else {
		form.data.fields = full_fields;	
	}
	
	// if no query conditions are specified, simply return current data 
	//LOG.warn('check for query conditions:');
	//LOG.warn(args);
	
	if (Object.keys(args).length === 0) {
		form.data.values = full_values;
		return onDone(null, form);
	}
		
	// build mapping from field_id to info
	var fields = {};
	for (var i=0; i < full_fields.length; i++) {
		fields[full_fields[i].id] = full_fields[i];			
	}
	
	// TODO: need to fix these logic (seems too complicated)
	// go over each row of data, and copy only matching values
	for (var id in full_values) {
		var record = full_values[id];
		var matched = true;
		
		// ignore rows where the fields do not match
		if (args.query) {
			var nonmatch_count = 0;
			var match_count = 0;
						
			for (var key in args.query) {
				
				// skip invalid query keys (that are not field names)
				if (fields.hasOwnProperty(key) === false) {
					LOG.warn('key [' + key + '] does not exist in fields records');
					continue;
				}
						
				// partial match for 'date' type
				if (fields[key].type === 'date') {
					LOG.warn('key: ' + key);
					LOG.warn('compare record: ' + record[key] + ' with query: ' + args.query[key]); 
					
					if (args.start_date && args.end_date) {
						LOG.warn('compare '+ record[key]+ ' start: ' + args.start_date + ' end: ' + args.end_date );
						if( record[key] < args.start_date || record[key] > args.end_date ) {
							matched = false;
							break;
						}
					}
					else if (record[key].startsWith(args.query[key]) === false) {
						matched = false;
						break;
					}
					
					LOG.warn('match: ' + matched);
				}
				// exact match check for other data types
				else if (typeof args.query[key] === 'string' && args.query[key].charAt(0) === '-') {
					nonmatch_count++;
					
					var query_value = args.query[key].substring(1);
					//LOG.warn('query_value:' + query_value);
					
					if (record[key] === query_value) {
						match_count++;
					}
				}
				else {
					LOG.warn('[' + key + '] compare: ' + record[key] + ' with ' + args.query[key]);
					if (record[key] !== args.query[key]) {
						matched = false;
						break;
					}
				}
			}
			
			if (nonmatch_count > 0 && nonmatch_count === match_count) {
				matched = false;	
			}
		}

		// query for any value partially matching the specified query keys' values
		if (args.query_partial) {
			var non_matched = 0;
			for (var key in args.query_partial) {
				if (typeof record[key] === 'string' && 
					record[key].indexOf(args.query_partial[key]) === (-1)) {
					non_matched++;
				}
			}
			// non of the fields have partial matches at all
			if (non_matched === Object.keys(args.query_partial).length) {
				matched = false;
			}
		}
		
		// also ignore rows for specified checkboxes already checked
		if (args.show_unchecked) {
			//LOG.warn('checking if these fields are yet checked: ');
			//LOG.warn(args.show_unchecked);
			
			var checked_count = 0;
			
			for (var i=0; i < args.show_unchecked.length; i++) {
				if (record[args.show_unchecked[i]] === true) {
					checked_count++;
				}
			}
			
			if (matched === true && checked_count === args.show_unchecked.length) {
				matched = false;
			}
		}
		
		// check if specified period overlaps a period in record
		// overlap example: {start: start, end: end, period: ['depart_time', 'return_time']};
		// see: http://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap
		if (args.overlap) {
			LOG.warn('args.overlap:', l_name);
			LOG.warn(args.overlap, l_name);
			
			try {
				var startA = moment(record[args.overlap.period[0]]).toDate().getTime();
				var endA = moment(record[args.overlap.period[1]]).toDate().getTime();
				var startB = moment(args.overlap.start).toDate().getTime();
				var endB = moment(args.overlap.end).toDate().getTime();
								
				// do not show if there's no overlap
				if (!((startA <= endB) && (endA >= startB))) {
					matched = false;
				} else {
					//LOG.warn('period overlaps');					
					//LOG.warn('periodA: ' + startA + '~' + endA);
					//LOG.warn('periodB: ' + startB + '~' + endB);										
				}
				
			} catch (e) {
				LOG.error(e);	
			}
		}
	
		// will keep/return this row only if fully matched
		if (matched) {
			form.data.values[id] = record;	
		}
	}		

	// not used?
	for (i in form.data.fields){
		if (form.data.fields[i].sorting) {
			LOG.warn('sorting: ' + form.data.fields[i].name);
			var id = form.data.fields[i].id;
			datas = form.data;
			LOG.warn(datas);
		}
	}
	
	onDone(null, form);
});

SR.API.add('INIT_FORM', {
	name:	'string',
	fields:	'array'
}, function (args, onDone) {

	var map = SR.State.get(args.name + 'Map');
	var ref = {};

	// identify key_field, if any
	var key_field = "";
	for (var i=0; i < args.fields.length; i++) {
		if (args.fields[i].id.charAt(0) === '*') {
			key_field = args.fields[i].id = args.fields[i].id.substring(1);
			LOG.warn('[' + args.name + '] form has key_field: ' + key_field);
		}
	}	
	
	SR.API.QUERY_FORM({name: args.name}, function (err, form) {
		if (!err) {
			
			// update field info
			form.data.fields = args.fields;
			form.key_field = key_field;			
			
			form.sync(function (err) {
				if (err) {
					return onDone(err);
				}
				
				// re-build key_field based mapping
				if (form.key_field && form.key_field !== '') {
					var values = form.data.values;
					for (var id in values) {
						map[values[id][form.key_field]] = values[id];
					}
				}
				ref[args.name] = map;
				
				return onDone(null, ref);
			})
			
			// NOTE: return here in needed as sync above won't return immediately
			return;
		}
		
		LOG.warn('form [' + args.name + '] does not exist, create one...');
				
		SR.API.CREATE_FORM({
			name:		args.name,
			fields: 	args.fields,
			key_field:	key_field
		}, function (err) {
			if (err) {
				LOG.error(err);
				return onDone(err);
			}
			ref[args.name] = map;	
			onDone(null, ref);
		});
	});	
});


