/*
	flexform module - a module to support flexible, variable field size/type system
	
	history:
		2016-10-01		refactored from /handler.js of BW-TC project
		2016-12-29		convert into a scalra module

	
*/
var moment = require('moment');
var isUtf8 = require('is-utf8');


var l_name = 'FlexForm';

LOG.warn('FlexForm is being loaded as a module...', l_name);

// define form model
var l_form;
var l_form_values = {};
var l_dbForm = 'FlexForm';

var l_models = {};
l_models[l_dbForm] = {
	id:			'*string',
	flexform_version:	'string',
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
		
		// 以下為 flexform 2.0 的記憶體配置
		var fome_models = {};
		
		var count = 0;
		for (record_id in l_form) {
			if (l_form[record_id].name === '' || !l_form[record_id].flexform_version || l_form[record_id].flexform_version !== '2.0')
				continue;
			count++;
			form_name = 'FlexForm:' + l_form[record_id].name;
			fome_models[form_name] = {
				id:				'*string',
				values:			'object' 	// 欄位資料
			}
		}
		
		
		LOG.warn('目前DB內有 ' + count + ' 個form');
		if (count !== 0 ) {
			SR.DS.init({models: fome_models}, function (err, ref) {
				if (err) {
					LOG.error(err, l_name);	
				}
				for (form_id in l_form) {
					if (l_form[form_id].name === '' || !l_form[form_id].flexform_version || l_form[form_id].flexform_version !== '2.0')
						continue;
					form_name = 'FlexForm:' + l_form[form_id].name;
					l_form_values[form_id] = ref[form_name];

					LOG.warn( l_form_values[form_id]);

					l_form[form_id].data.values = {};
					l_form[form_id].add = l_form_values[form_id].add;
					l_form[form_id].remove = l_form_values[form_id].remove;
					l_form[form_id].size = l_form_values[form_id].size;

					for (record_id in l_form_values[form_id]) {
						if (typeof(l_form_values[form_id][record_id]) === 'object') {
							l_form[form_id].data.values[record_id] = l_form_values[form_id][record_id].values;
							l_form[form_id].data.values[record_id].sync = l_form_values[form_id][record_id].sync;
						}
					}

					LOG.warn('form: ' + l_form[form_id].name );
					LOG.warn(l_form[form_id].data.values);

					// l_form[form_id].data.values = ref[form_name];

					// l_form[form_id].add = ref[form_name].add;
					// l_form[form_id].f_remove = ref[form_name].remove;
					// l_form[form_id].size = ref[form_name].size;

				}

				UTIL.safeCall(onDone);
			});
		} else
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

SR.API.add('CHECK_UPLOAD_LIMIT_NUM', {
	form_name:		'string',
	field_id:		'string'
}, function (args, onDone) {
	SR.API.GET_FORM_FIELDS({name: args.form_name}, function (err, result_field) {
		if (err)
			return onDone(err);
		
		for (var i in result_field.fields)
			if (result_field.fields[i].id === args.field_id)
				return onDone(null, result_field.fields[i].num);
		
		return onDone('查無資訊');
	});
});

SR.API.add('TRANSLATE_FORM_FIELDS', {
	field_data:		'object'
}, function (args, onDone) {
	var data = args.field_data;
	// 先算出有幾個需要改
	var count = 0;
	for (var i in data.fields) {
		var field = data.fields[i];
		if (data.fields[i].setting) 
			count ++;
	}
	if (count === 0)
		return onDone(null, data);
	// 修改資料
	var done_count = 0;
	for (var i in data.fields) {
		if (data.fields[i].setting) {
			var setting = data.fields[i].setting;
			SR.API.FLEX_FORM_SETTING_FUNCTION({setting: setting, field:data.fields[i]}, function (err, result_field) {
				data.fields[i] = result_field;
				done_count++;
				LOG.warn(count);
				LOG.warn(done_count);
				if (done_count === count)
					onDone(null, data);	
			});

		}
	}
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
	
	SR.API.QUERY_FORM(args, function (err, form) {
		if (err) {
			return onDone(err);	
		}
		
		// return only the form's client returnable info
		onDone(null, {id: form.id, name: form.name, key_field: form.key_field, data: form.data});
	});
});

// ------------------------------------ flexform2 -----------------------------------------------
// also returns the data read with optional flag
SR.API.add('IS_UTF8', {
	filename:		'string',
	return_data:	'+boolean'		// whether to return the read data
}, function (args, onDone) {
	
	var filepath = SR.path.join(SR.Settings.UPLOAD_PATH, args.filename);
	SR.fs.exists(filepath, function (exists) {
		
		if (!exists) {
			return onDone('file not exist!');
		}
		
		var data = SR.fs.readFileSync(filepath);
		var utf8 = isUtf8(data);
		
		if (args.return_data === true) {
			// see if we need to re-read for utf8 content
			if (utf8) {
				data = SR.fs.readFileSync(filepath, {encoding: 'utf8'});
			}
		} else {
			data = undefined;
		}
		
		return onDone(null, utf8, data);
	});
});

// ++++++++++++++++++++++++++++++++++群組用++++++++++++++++++++++++++++++++++
SR.API.add('QUERY_ALL_LIST', {
	_login: true,
	form_name: 'string',
	field: 'string',
}, function (args, onDone, extra) {
	if (extra && extra.session._user.account !== 'admin')
		return onDone(null, {result:0, desc: '你沒有權限這麼做'});
	var list = [];

	SR.API.QUERY_FORM({name: args.form_name}, function (err, form) {
		if (args.field) {
			var have = false;
			for (var i in form.data.fields)
				if (form.data.fields[i].id === args.field)
					have = true;
			if (!have)
				return onDone(null, 'no this field');
		}
		
		for (record_id in form.data.values) 
			if (typeof(form.data.values[record_id]) === 'object') {
				var temp = {key_field: form.data.values[record_id][form.key_field]};
				if (args.field)
					temp['field'] = form.data.values[record_id][args.field];
				list.push(temp);
			}
		return onDone(null, {result:1, list: list});
	});
});

SR.API.add('QUERY_GROUP_MEMBER_LIST', {
	_login: 	true,
	group_id:	'string',
	group_name:	'string'
}, function (args, onDone, extra) {
	if ( extra && extra.session._user.account !== 'admin' )
		return onDone(null, {result:0, desc: '你沒有權限這麼做'});
	form_name = args.group_id;

	var para = {name: form_name};
	para.query = {name: args.group_name};
	// para.show = ['account', 'name', 'address', 'sex', 'tel', 'intro'];
	
	SR.API.QUERY_FORM(para, function (err, form) {
		if (err) {
			LOG.error('no form can be found');
			return onDone(err);
		}
		
		if (Object.keys(form.data.values).length === 0)
			return onDone(null, {result:0, desc: 'no this group'});
		var gm_list = form.data.values[Object.keys(form.data.values)[0]].gm_list;
		
		onDone(null, {result:1, gm_list: gm_list});
	});
});

SR.API.add('createOrModifyGroup', {//新增Group內容
	_login: true,
	group_id:	'string',
	old_group:	'+string',
	group:		'string',
	users:		'array'
}, function (args, onDone, extra) {
	
	SR.API.INIT_FORM({
		name: args.group_id,
		fields: [		
			{id: '*name', name: 'Name', type: 'string', desc: 'Your group name', must: true, show: true, option: undefined},
			{id: 'gm_list', name: 'Group Member List', type: 'string', desc: '', must: false, show: true, option: undefined},
		]
	}, function (err, ref) {
		if (err) {
			return onDone('init form error');
		}
	
		var para = {
			name: args.group_id,
			query:{ name: args.group }
		};
		SR.API.QUERY_FORM(para, function (err, result) {
			var account = extra.session._user.account;
			var count = 0;
			for (record_id in result.data.values) count ++;

			if (!args.old_group && count !== 0) {
				return onDone(null, {result:0, desc:'此group已經被定義過'});
			} else {
				if (args.old_group) {
					if (args.old_group !== args.group && count !== 0)
						return onDone(null, {result:0, desc:'此group已經被定義過'});
					SR.API.QUERY_FORM({name: args.group_id,query:{ name: args.old_group }}, function (err, result2) {
						var old_record_id = Object.keys(result2.data.values)[0];
						value = {}
						value.id = result2.data.values[old_record_id].id
						value.name = args.group;
						value.account = account;
						value.gm_list = args.users;
						SR.API.UPDATE_FIELD({
							form_name: args.group_id,
							record_id:	old_record_id,
							values: value 
						}, function (err, result) {
							if (err) {
								LOG.warn(err);
							}

							return onDone(null, {result:1, desc: '修改成功' });
						});
					});
				} else {
					value = {}
					value.id = UTIL.createToken();
					value.name = args.group;
					value.account = account;
					value.gm_list = args.users;
					SR.API.UPDATE_FIELD({
						form_name: args.group_id,
						values: value 
					}, function (err, result) {
						if (err) {
							LOG.warn(err);
						}

						return onDone(null, {result:1, desc: '創建成功' });
					})
				}
			}	
		});

		return onDone();
	});
});

// 查詢GROUP
SR.API.add('QUERY_GROUP_BY_PARTIAL',{
	group_id:	'string',
	value: 		'string',
}, function (args, onDone) {
	var para;
	var form_name;

	form_name = args.group_id;

	para = {name: form_name};
	para.query_partial = {name: args.value};
	// para.show = ['account', 'name', 'address', 'sex', 'tel', 'intro'];
	
	SR.API.QUERY_FORM(para, function (err, form) {
		if (err) {
			LOG.error('no form can be found');

			return onDone(err);
		}
		
		LOG.warn('查詢部分符合之群組');
		LOG.warn(form);
		onDone(null, form.data.values);
	});
});

// ----------------------------------群組用----------------------------------

SR.API.add('CREATE_FORM', {
	name:		'string',
	key_field:	'+string',
	fields: 	'object', // 欄位名稱
}, function (args, onDone) {
	LOG.warn('使用CREATE_FORM');
	var form = {
		id: UTIL.createUUID(),
		flexform_version: '2.0',
		name: args.name,
		key_field: args.key_field || '',
		data: {
			fields: args.fields
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
		
		LOG.warn('create new DB');

		var form_name = 'FlexForm:' + args.name;
		var form_models = {};
		form_models[form_name] = {
			id:				'*string',
			values:			'object' 	// 欄位資料
		};

		SR.DS.init({models: form_models}, function (err, ref) {
			if (err) {
				LOG.error(err, form_name);	
			}
			LOG.warn('INIT FORM成功');
			LOG.warn('l_form[form.id]');
			LOG.warn(l_form[form.id]);
			
			
			l_form[form.id].data.values = {};
			l_form[form.id].add = ref[form_name].add;
			l_form[form.id].remove = ref[form_name].remove;
			l_form[form.id].size = ref[form_name].size;
			
			l_form_values[form.id] = ref[form_name];
			
			onDone(null, {id: form.id});
		});
		
	});

});

SR.API.add('QUERY_FORM', {
	id:		'+string',			// form id
	name:	'+string',			// form name
	query:	'+object',			// optional query finding exact matches
	query_partial: '+object',	// query for any value partially matching the specified query keys' values
	overlap: '+object',			// find records if intervals between 'period' overlaps with [start, end] interval  
	show:	'+array',			// only show specific fields
	show_unchecked: '+object',	// only show if specified checkboxes are unchecked
	start_date:	'+string',		// 當query裡面有date，且需要設定搜尋範圍時。此時query只能使用一個date key
	end_date:	'+string',
	select_time:	'+object'   // 當query裡面有date，且需要設定搜尋範圍時。 ex:{"date":{"start":"2017-05-05"}}
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
		if (typeof(full_values[id]) !== 'object')
			continue;

		var record = full_values[id];
		var matched = true;
		
		// ignore rows where the fields do not match
		if (args.query || args.select_time) {
			
			
			for (var key in args.select_time) {
				if (fields[key] && fields[key].type === 'date') {
					LOG.warn('key: ' + key);
					LOG.warn('compare record: ' + record[key] + ' with query: ' + args.select_time[key]); 
					if (args.select_time[key].start && args.select_time[key].end) {
						LOG.warn('compare '+ record[key]+ ' start: ' + args.select_time[key].start + ' end: ' + args.select_time[key].end );
						if (record[key] < args.select_time[key].start || record[key] > args.select_time[key].end) {
							matched = false;
							break;
						}
					}
				}
			}
			
			
			var nonmatch_count = 0;
			var match_count = 0;
			for (var key in args.query) {
				var compare = args.query[key];
				// skip invalid query keys (that are not field names)
				if (fields.hasOwnProperty(key) === false) {
					LOG.warn('key [' + key + '] does not exist in fields records');
					continue;
				}
						
				// partial match for 'date' type
				if (fields[key].type === 'date') {
					LOG.warn('key: ' + key);
					LOG.warn('compare record: ' + record[key] + ' with query: ' + compare); 
					
					if (args.start_date && args.end_date) {
						LOG.warn('compare '+ record[key]+ ' start: ' + args.start_date + ' end: ' + args.end_date );
						if (record[key] < args.start_date || record[key] > args.end_date) {
							matched = false;
							break;
						}
					}
					else if (record[key].startsWith(compare) === false) {
						matched = false;
						break;
					}
					
					LOG.warn('match: ' + matched);
				}
				// exact match check for other data types
				else if (typeof compare === 'string' && compare.charAt(0) === '-') {
					nonmatch_count++;
					
					var query_value = compare.substring(1);
					//LOG.warn('query_value:' + query_value);
					
					if (record[key] === query_value) {
						match_count++;
					}
				}
				else {
					if (typeof(compare) === 'object') {
						LOG.warn('[' + key + '] compare: ' + record[key] + ' with ' + compare);
						var have_matched = false;
						for (var temp in compare)
							if (record[key] === compare[temp]) {
								have_matched = true;
								break;
							}
						if (!have_matched) {
							matched = false;
							break;
						}
							
					} else {
						LOG.warn('[' + key + '] compare: ' + record[key] + ' with ' + compare);
						if (record[key] !== compare) {
							matched = false;
							break;
						}
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

SR.API.add('JOINT_FORM', {
	original_form_para:	'object',
	joint_form_para:	'object',
	link_key:			'string',
	joint_form_key:		'+string',
}, function (args, onDone) {
	SR.API.QUERY_FORM(args.original_form_para, function (err, o_form) {
		if (err)
			return onDone(err);
		SR.API.QUERY_FORM(args.joint_form_para, function (err, j_form) {
			if (err)
				return onDone(err);
			var para = {
				original_form: o_form,
				joint_form: j_form,
				link_key: args.link_key
			}
			if (args.joint_form_key)
				para.joint_form_key = args.joint_form_key;
			
			SR.API.JOINT_FORM_FUNCTION(para, function (err, r_form) {
				if (err)
					return onDone(err);
				return onDone(null, r_form);
			});
		});
	});
});

SR.API.add('JOINT_FORM_FUNCTION', {
	original_form:	'object',
	joint_form:		'object',
	link_key:		'string',
	joint_form_key:	'+string',
	joint_value:	'+array'
}, function (args, onDone) {
	var o_form = JSON.parse(JSON.stringify(args.original_form));
	var form2 = JSON.parse(JSON.stringify(args.joint_form));
	// var o_form = Object.assign({}, args.original_form);
	// var form2 = Object.assign({}, args.joint_form);
	if (args.joint_form_key)
		var joint_form_key = args.joint_form_key;
	else
		var joint_form_key = args.link_key;
	var keys = [];
	for (var i in form2.data.fields)
		if (form2.data.fields[i].id !== joint_form_key) {
			keys.push(form2.data.fields[i].id)
			o_form.data.fields.push(form2.data.fields[i]);
		}

	for (var record_id in o_form.data.values){
		for (var record_id2 in form2.data.values) {

			if (form2.data.values[record_id2][joint_form_key] === o_form.data.values[record_id][args.link_key])
				for (var i in keys) {
					if (args.joint_value && args.joint_value.indexOf(keys[i])=== -1 )
						continue;
					if (!o_form.data.values[record_id][keys[i]]) // do not cover original data
						o_form.data.values[record_id][keys[i]] = form2.data.values[record_id2][keys[i]]
				}
		}

	}
	onDone(null, o_form);

});

SR.API.add('DELETE_FIELD', {
	form_id: 	'+string',		// form id
	form_name:	'+string',		// form name
	record_id: 	'string'		// 要刪除的資料的record_id
}, function (args, onDone) {
	var form = l_get(args.form_id, args.form_name);
	
	if (!form.data.values[args.record_id])
		return onDone(null, ('沒有record_id為 ' + args.record_id + ' 的資料'));
	
	LOG.warn('清掉 記憶體內的 data');
	delete form.data.values[args.record_id];
	LOG.warn('清除完畢');
	form.remove({id:args.record_id}, function(err, result){
		if (err) {
			return onDone(err); 
		}
		
		onDone(null, '從 form ' + form.name + ' 中刪除 record_id = ' + args.record_id + ' test' );
	});
});

// helpers to check for int or float
function isInt(n){
    return Number(n) === n && n % 1 === 0;
}

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}

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
				args.form_id = form_id;
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
	// var values_map = form.data.values;
	var values_map = {};
	if (args.record_id) {
		if (form.data.values.hasOwnProperty(args.record_id) === false)
			return onDone('values not found for record id [' + args.record_id + ']');	
		values_map = form.data.values[args.record_id];
	}
		
	
	// check if this is new record
	if (!args.record_id) {
		new_record_id = UTIL.createToken();
		// values_map[args.record_id] = {};
	}
	
	// if (values_map.hasOwnProperty(args.record_id) === false) {
	// 	return onDone('values not found for record id [' + args.record_id + ']');	
	// }

	var err_msg = [];

	// perform type check for numbers (make sure 'number' type are all numbers and not 'strings')			
	var fields = form.data.fields;
	for (var j=0; j < fields.length; j++) {
		if (fields[j].type === 'number' && args.values.hasOwnProperty(fields[j].id)) {
			LOG.warn(fields[j].id + ' try convert to number...');
			try {
				var num = parseFloat(args.values[fields[j].id]);
				
				if (isFloat(num) || isInt(num)) {
					args.values[fields[j].id] = num;						
				} else {
					LOG.warn(num + ' is not a number, ignore it');
					args.values[fields[j].id] = undefined;					
				}
				LOG.warn(num + ' type: ' + typeof num);
				
			} catch (e) {
				err_msg.push(e);	
			}
		}
	}
	// LOG.warn('找BUG 0');
	// check if convert error exists
	if (err_msg.length > 0) {
		return onDone('input data number type cannot be converted', err_msg);
	}
	
	// LOG.warn('找BUG 1');
	// override all data for fields with same key (but leave others)
	for (var key in args.values) {
		if (typeof args.values[key] !== 'undefined') {
			// values_map[args.record_id][key] = args.values[key];
			values_map[key] = args.values[key];
		}
	}
	// LOG.warn('找BUG 2');
	// record to form map if form's 'key_field' exists
	/*
	if (typeof form.key_field === 'string' && form.key_field !== '') {
		var keymap = SR.State.get(form.name + 'Map');
		// keymap[values_map[args.record_id][form.key_field]] = values_map[args.record_id];	
		keymap[values_map[form.key_field]] = values_map;	
	}
	*/
	// LOG.warn('找BUG 3');
	//LOG.warn('final data to sync:');
	//LOG.warn(values_map[args.record_id]);
	
	// LOG.warn('values_map = ');
	// LOG.warn(values_map);
	
	if (!args.record_id) {
		LOG.warn('使用new_record_id');
		args.new_record_id = new_record_id;
	}
	
	for (var j in form.data.fields) {
		if (typeof(form.data.fields[j].default)!=='undefined') {
			// LOG.warn(form.data.fields[j].id + '為default');
			if (!values_map[form.data.fields[j].id]) {
				values_map[form.data.fields[j].id] = form.data.fields[j].default;
				// LOG.warn('新增default');
			}

		}
		if (!args.record_id && !values_map[form.data.fields[j].id]) {
			// var today=new Date();
			var today2 = new moment();
			// .format('YYYY-MM-DD HH:mm')
			if (form.data.fields[j].type === 'date' )
				values_map[form.data.fields[j].id] = today2.format('YYYY-MM-DD');
				// values_map[form.data.fields[j].id] = today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate();
			else if (form.data.fields[j].type === 'datetime' )
				values_map[form.data.fields[j].id] = today2.format('YYYY-MM-DD HH:mm');
				// values_map[form.data.fields[j].id] = today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate() + ' ' + today.getHours()+':'+today.getMinutes();
		}
		
		if (form.data.fields[j].type === 'email') {
			// LOG.warn('印出email');
			// LOG.warn(values_map[form.data.fields[j].id])
			// LOG.warn(values_map.account);
			// _ACCOUNT_SETDATA
			SR.API._ACCOUNT_SETDATA({
				account:		values_map.account,
				data:			{email: values_map[form.data.fields[j].id]}
			}, function (err) {
				LOG.warn('set 成功');
			});
		}
		
		
	}
	
	
	l_add_form({form:form, values_map:values_map, para:args}, function(err, result){
		onDone(null, {desc:'form [' + args.form_id + '] record [' + (args.record_id)?args.record_id:new_record_id + '] updated', record_id:(args.record_id)?args.record_id:new_record_id});
	});
});

var multivalues_record_id = [];

SR.API.add('UPDATE_FORM_WITH_MULTIVALUES',{
	form_array:	'array',
} , function (args, onDone) {
	var jq = SR.JobQueue.createQueue();
	multivalues_record_id = [];
	for (var i in args.form_array)
		jq.add(l_add_update_filed( args.form_array[i] ));

	jq.run(function (err) {
		return onDone(null,{record_ids: multivalues_record_id,desc:'update successed!'});
	});
});

var l_add_update_filed = function (para) {
	return function (onD) {
		SR.API.UPDATE_FIELD(para, function(err, result){
			if (err){
				LOG.warn(err);
				return onD(err);
			}
			multivalues_record_id.push(result.record_id);
			onD();
		});
	}
}

// helper
var l_add = function (para) {

	return function (onD) {
		l_add_form(para, onD);
	}
}

var l_add_form = function( para, onDone ) {
	if (para.para.record_id) {
		LOG.warn('使用record_id');                           
		if (para.form.data.values.hasOwnProperty(para.para.record_id) === false)
			return onDone('values not found for record id [' + para.para.record_id + ']');
		
		for (key in para.values_map){
			LOG.warn('存的key ' + key);
			LOG.warn(para.form.data.values[para.para.record_id][key] + ' 設成 ' + para.values_map[key]);
			l_form_values[para.form.id][para.para.record_id].values[key] = para.values_map[key];
		}

		l_form_values[para.form.id][para.para.record_id].values.sync(function (err) {
			if (err) {
				return onDone('save to DB error: ' + err);
			}
			LOG.warn('存進DB')
			return onDone(null);
		});
	} else {
		LOG.warn('使用new_record_id');
		//LOG.warn(para.form.data.values);
		
		para.form.add({id:para.para.new_record_id, values:para.values_map}, function (err, result) {
			if (err) {
				return onDone(err);	
			}
			
			para.form.data.values[para.para.new_record_id] = l_form_values[para.para.form_id][para.para.new_record_id].values;
			para.form.data.values[para.para.new_record_id].sync = l_form_values[para.para.form_id][para.para.new_record_id].sync;
			
			//LOG.warn(para.form.data.values);
			return onDone(null);

		});
	}
}

var clone = function(obj) {
	var new_obj = {};
	for (key in obj) 
		new_obj[key] = obj[key];
	return new_obj;
} // clone()


SR.API.add('UPDATE_FORM', {
	form_id:	'+string',		// form id
	form_name:	'+string',		// form name
	values:		'+object',		// data to be stored
	value_array: '+array',		// an array of values
	record_id:	'+string'		// optional id to assoicate the values being stored with another record
}, function (args, onDone) {

	if (!args.form_id && !args.form_name)
		return onDone('values not found for form_id or form_name ');
	
	var form = undefined;
	
	// get form
	if (args.form_name) { // by name
		for (var form_id in l_form) {
			if (l_form[form_id].name === args.form_name)  {
				form = l_form[form_id];
				args.form_id = form_id;
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
	
	var values = form.data.values;
	
	// set of record_id stored, to be returned
	var record_ids = [];
	
	// check if just one set of values or multiples
	var value_array = args.value_array || [];
	if (args.values)
		value_array.push(args.values);
	
	//LOG.warn('value_array:');
	//LOG.warn(value_array);

	var keymap = undefined;
	if (typeof form.key_field === 'string' && form.key_field !== '') {
		keymap = SR.State.get(form.name + 'Map');
	}
	
	var parent_record_id = args.record_id;
	delete args['record_id'];
	var jq = SR.JobQueue.createQueue();
	// store each with unique record_id
	for (var i=0; i < value_array.length; i++) {

		var record_id = UTIL.createToken();
		LOG.warn('record_id = ------------');
		LOG.warn(record_id);
		// check for existing record_id
		var have_record_id = false;
		if (value_array[i]['_record_id']) {
			record_id = value_array[i]['_record_id'];
			delete value_array[i]['_record_id'];
			LOG.warn('updateing existing record [' + record_id + ']');
			have_record_id = true;
		}
		
		// if (!values[record_id]) {
		// 	values[record_id] = {};
		// }

		// TODO: no type check is performed? (for example, input is string but should expect number)
		// for (var key in value_array[i]) {
		// 	values[record_id][key] = value_array[i][key];
		// }
		
		// add new record to key-value map
		// if (keymap) {
		// 	keymap[values[record_id][form.key_field]] = value_array[i];
		// }	
		
		// check whether to store optional associated record_id
		if (parent_record_id) {
			value_array[i]['record_id'] = parent_record_id;
			LOG.warn('values after storing record_id:');
			LOG.warn(value_array[i]);
		} 
		
		var new_para = clone(args);
		if (have_record_id)
			new_para.record_id = record_id;
		else
			new_para.new_record_id = record_id;
		
		
		// LOG.warn('測試default用');
		// LOG.warn(value_array[i]);
		// LOG.warn(form.data.fields);
		for (var j in form.data.fields) {
			if (typeof(form.data.fields[j].default)!=='undefined') {
				LOG.warn(form.data.fields[j].id + '為default');
				if (!value_array[i][form.data.fields[j].id]) {
					value_array[i][form.data.fields[j].id] = form.data.fields[j].default;
					// LOG.warn('新增default');
				}
			}
			if (!value_array[i][form.data.fields[j].id]) {
				// var today=new Date();
				var today2 = new moment();
				if (form.data.fields[j].type === 'date' )
					value_array[i][form.data.fields[j].id] = today2.format('YYYY-MM-DD');
					// value_array[i][form.data.fields[j].id] = today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate();
				else if (form.data.fields[j].type === 'datetime' )
					value_array[i][form.data.fields[j].id] = today2.format('YYYY-MM-DD HH:mm');
					// value_array[i][form.data.fields[j].id] = today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate() + ' ' + today.getHours()+':'+today.getMinutes();
			}
			if (form.data.fields[j].type === 'email') {
				// LOG.warn('印出email');
				// LOG.warn(value_array[i][form.data.fields[j].id])
				// LOG.warn(value_array[i].account);
				// _ACCOUNT_SETDATA
				SR.API._ACCOUNT_SETDATA({
					account:		value_array[i].account,
					data:			{email: value_array[i][form.data.fields[j].id]}
				}, function (err) {
					LOG.warn('set 成功');
				});
			}
		}

		// 將修改的內容寫到記憶體內
		if (have_record_id)
			for (var key in value_array[i])
				form.data.values[record_id][key] = value_array[i][key];
		
		jq.add(l_add({form:form, values_map:value_array[i], para:new_para}));
		
		record_ids.push(record_id);
	}

	jq.run(function (err) {
		onDone(null, {form_id: args.form_id, record_ids: record_ids});
	});
	
// 	form.sync(function (err) {
// 		if (err) {
// 			return onDone('save to DB error: ' + err);	
// 		}

// 		onDone(null, {form_id: args.form_id, record_ids: record_ids});
// 	});	
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
			
			LOG.warn('existing form [' + args.name + '] found, loading it...', l_name);
			
			// update field info
			// form.data.fields = args.fields;
			// do not update lock_para
			for (var i in args.fields) {
				if (args.fields[i].lock_para) {
					for (var key in args.fields[i]) 
						if (args.fields[i].lock_para.indexOf(key) === -1) 
							form.data.fields[i][key] = args.fields[i][key];
				} else
					form.data.fields[i] = args.fields[i];
			}
			
			
			
			form.key_field = key_field;			
			
			var temp_values = form.data.values;
			
			// 避免修改到lobby: FlexForm內的資料，沒有這處理會新增values
			form.data.values = null;
			delete form.data.values;
			
			form.sync(function (err) {
				if (err) {
					return onDone(err);
				}
				// 在記憶體中加回values
				form.data.values = {};
				form.data.values = temp_values;
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

// helper
var l_rename = function (para) {

	return function (onD) {
		l_do_rename(para, onD);
	}
}

var l_do_rename = function( para, onDone ) {
	var pdb_path = SR.path.join(SR.Settings.UPLOAD_PATH, para.file_name);
	var new_name_path = SR.path.join(SR.Settings.UPLOAD_PATH, para.new_file);
	var pdb_new_path = SR.path.join(SR.Settings.PROJECT_PATH, 'web', 'images', para.new_file);
	SR.fs.rename(pdb_path, new_name_path, (err) => {
		if (err) {
			return onDone(err);
		}
		SR.fs.stat(new_name_path, (err, stats) => {
			if (err) {
				return onDone(err);
			}
			LOG.warn('rename success: ' + para.new_file);
			
			// copy to downloadable public path
			var source = SR.fs.createReadStream(new_name_path);
			var dest = SR.fs.createWriteStream(pdb_new_path);
			source.pipe(dest);

			source.on('end', function() { 
				/* copied */ 
				onDone(null);
			});

			source.on('error', function(err) { 
				/* error */ 
				LOG.error(err);
				onDone(err);
			});
			
		});
	});
	
}


// 上傳照片
SR.API.add('UPLOAD_IMAGE', {
	filename:		'array',		// name of the uploaded image file
}, function (args, onDone, extra) {
	if (!extra) {
		LOG.error('cannot called at server');
		return onDone('cannot called at server');
	}

	// find file extension
	
	var jq = SR.JobQueue.createQueue();
	var new_file_names = [];
	for (var i in args.filename) {
		var arr = args.filename[i].split(".");
		var file_ext = arr[arr.length-1]; // 副檔名
		var new_file = UTIL.createToken() + '.' + file_ext.toLowerCase();
		new_file_names.push(new_file);
		jq.add(l_rename({new_file: new_file, file_name: args.filename[i]}));
	}
	
	jq.run(function (err) {
		return onDone(null, new_file_names);
	});
	
// 	// for (var i in )
// 	var arr = args.filename.split(".");
// 	var file_ext = arr[arr.length-1]; // 副檔名
		
// 	// var new_file = (args.new_filename ? args.new_filename : extra.session._user.account) + '.' + file_ext.toLowerCase();
// 	var new_file = UTIL.createToken() + '.' + file_ext.toLowerCase();
// //	if (!args.new_filename)
// //		var account = extra.session._user.account;
// //	else
// //		var account = args.new_filename;
	
// 	var pdb_path = SR.path.join(SR.Settings.UPLOAD_PATH, args.filename);
// 	var new_name_path = SR.path.join(SR.Settings.UPLOAD_PATH, new_file);
// 	var pdb_new_path = SR.path.join(SR.Settings.PROJECT_PATH, 'web', 'images', new_file);
	
// 	LOG.warn(pdb_path);
	
// 	// rename uploaded file name
// 	SR.fs.rename(pdb_path, new_name_path, (err) => {
// 		if (err) {
// 			return onDone(err);
// 		}
// 		SR.fs.stat(new_name_path, (err, stats) => {
// 			if (err) {
// 				return onDone(err);
// 			}
// 			LOG.warn('rename success: ' + new_file);
// 		});
// 	});
	
// 	// copy to downloadable public path
// 	var source = SR.fs.createReadStream(new_name_path);
// 	var dest = SR.fs.createWriteStream(pdb_new_path);
// 	source.pipe(dest);
	
// 	source.on('end', function() { 
// 		/* copied */ 
// 		onDone(null, new_file);
// 	});
	
// 	source.on('error', function(err) { 
// 		/* error */ 
// 		LOG.error(err);
// 		onDone(err);
// 	});
	
});

//
//	excel / csv processing
//

function CSVToArray( strData, strDelimiter ){
	// Check to see if the delimiter is defined. If not,
	// then default to comma.
	strDelimiter = (strDelimiter || ",");

	// Create a regular expression to parse the CSV values.
	var objPattern = new RegExp(
		(
			// Delimiters.
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

			// Quoted fields.
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

			// Standard fields.
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);


	// Create an array to hold our data. Give the array
	// a default empty first row.
	var arrData = [[]];

	// Create an array to hold our individual pattern
	// matching groups.
	var arrMatches = null;


	// Keep looping over the regular expression matches
	// until we can no longer find a match.
	while (arrMatches = objPattern.exec( strData )){

		// Get the delimiter that was found.
		var strMatchedDelimiter = arrMatches[ 1 ];

		// Check to see if the given delimiter has a length
		// (is not the start of string) and if it matches
		// field delimiter. If id does not, then we know
		// that this delimiter is a row delimiter.
		if (
			strMatchedDelimiter.length &&
			strMatchedDelimiter !== strDelimiter
			){

			// Since we have reached a new row of data,
			// add an empty row to our data array.
			arrData.push( [] );

		}

		var strMatchedValue;

		// Now that we have our delimiter out of the way,
		// let's check to see which kind of value we
		// captured (quoted or unquoted).
		if (arrMatches[ 2 ]){

			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
			strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),
				"\""
				);

		} else {

			// We found a non-quoted value.
			strMatchedValue = arrMatches[ 3 ];

		}


		// Now that we have our value string, let's add
		// it to the data array.
		arrData[ arrData.length - 1 ].push( strMatchedValue );
	}

	// Return the parsed data.
	return( arrData );
}

function has_str(arr, str) {
	return (arr.indexOf(str) > (-1));
}

SR.API.add('Array_To_Flexform_Table', {
	arr_data:		'array',
	para:			'+object'
}, function (args, onDone) {
	var arr_data = args.arr_data;
	var para = args.para;
	
	var flexform_table = {};
	flexform_table.field = [];
	flexform_table.data = [];

	// first row is field names, record it
	// NOTE: index is also recorded
	for (var i in arr_data[0]) {
		if (!arr_data[0][i] || arr_data[0][i] === '') {
			continue;
		}
		flexform_table.field.push({key: arr_data[0][i], value: arr_data[0][i], index: i});
	}

	// total number of valid fields
	var total_field_size = flexform_table.field.length;

	// console.log('arr_data:');
	// console.log(arr_data);

	if (!para)
		var invalidContent = [];
	else
		var invalidContent = para.invalidContent || [];

	for (var i=1; i < arr_data.length; i++) {

		var temp_data = {};
		var empty_fields = 0;
		// we only copy valid fields
		for (var j in flexform_table.field) {
			var key = flexform_table.field[j].key;
			var index = flexform_table.field[j].index;

			temp_data[key] = arr_data[i][index];
			if (!temp_data[key] || temp_data[key] === '')
				empty_fields++;
		}

		// check if all required fields exist
		var missing_required = false;
		if (para && typeof para.required_fields === 'object') {
			for (var j in para.required_fields) {
				var content = temp_data[para.required_fields[j]];
				if (!content || content === '' || has_str(invalidContent, content)) {
					missing_required = true;
					break;
				}
			}
		}

		// skip entirely empty rows, or if 'ensure_valid' is specified and there's missing data
		if (empty_fields === total_field_size || missing_required === true) {
			continue;
		}

		flexform_table.data.push(temp_data);
	}

	return onDone(null, flexform_table);
	
});

function array_to_flexform_table(arr_data, para) {
	var flexform_table = {};
	flexform_table.field = [];
	flexform_table.data = [];

	// first row is field names, record it
	// NOTE: index is also recorded
	for (var i in arr_data[0]) {
		if (!arr_data[0][i] || arr_data[0][i] === '') {
			continue;
		}
		flexform_table.field.push({key: arr_data[0][i], value: arr_data[0][i], index: i});
	}

	// total number of valid fields
	var total_field_size = flexform_table.field.length;

	// console.log('arr_data:');
	// console.log(arr_data);

	if (!para)
		var invalidContent = [];
	else
		var invalidContent = para.invalidContent || [];

	for (var i=1; i < arr_data.length; i++) {

		var temp_data = {};
		var empty_fields = 0;
		// we only copy valid fields
		for (var j in flexform_table.field) {
			var key = flexform_table.field[j].key;
			var index = flexform_table.field[j].index;

			temp_data[key] = arr_data[i][index];
			if (!temp_data[key] || temp_data[key] === '')
				empty_fields++;
		}

		// check if all required fields exist
		var missing_required = false;
		if (para && typeof para.required_fields === 'object') {
			for (var j in para.required_fields) {
				var content = temp_data[para.required_fields[j]];
				if (!content || content === '' || has_str(invalidContent, content)) {
					missing_required = true;
					break;
				}
			}
		}

		// skip entirely empty rows, or if 'ensure_valid' is specified and there's missing data
		if (empty_fields === total_field_size || missing_required === true) {
			continue;
		}

		flexform_table.data.push(temp_data);
	}

	return flexform_table;
}

function extract_excel_fields(arr_data, para, onDone, warn_empty, key_field) {
	
	var import_fields = para.import_fields;
	
	LOG.warn('how many rows starts: ' + arr_data.length, l_name);
	
	var field_index = {};
	
	// find field row
	for (var i=0; i < arr_data.length; i++){
		
		for (var j in import_fields)
			if (has_str(arr_data[i], import_fields[j])) {
				field_index[import_fields[j]] = i;				
			}
		
		// check if we've found all fields
		if (Object.keys(field_index).length === import_fields.length) {
			LOG.warn('field row found at: ' + i, l_name);
			LOG.warn(arr_data[i], l_name);
			break;
		}
	}
	
	// check if did not find field row
	if (i === arr_data.length) {
		return onDone('field row cannot be found! ' + import_fields);
	}

	// remove irrelevant top rows
	arr_data = arr_data.slice(i);
	
	// remove empty bottom rows
	for (var i=0; i < arr_data.length - 1; i++) {
		if (!arr_data[i]) {
			arr_data = arr_data.slice(0, i);
			break;
		}
	}

	// convert to flexform format	
	SR.API.Array_To_Flexform_Table({
		arr_data:		arr_data,
		para:			para
	}, function (err, xlsx_data) {
	
		// remove unused fields
		/*
		for (var i = xlsx_data.field.length - 1; i >= 0 ; i -- ) {

			var have = false;
			for (var j in import_fields)
				if (xlsx_data.field[i].value === import_fields[j])
					have = true;
			if (!have) 
				delete xlsx_data.field[i];
		}
		*/

		// keep only needed fields
		var selected = {
			field: [],
			data: []
		};

		for (var i=0; i < import_fields.length; i++) {
			selected.field.push({key: import_fields[i]});
		}
		for (var i=0; i < xlsx_data.data.length; i++) {
			var row = {};
			for (var j=0; j < import_fields.length; j++) {
				var field_name = import_fields[j];
				row[field_name] = xlsx_data.data[i][field_name];
			}
			selected.data.push(row);
		}

		// check for data correctness
		var errlist = [];

		// check for empty fields and warn
		for (var i in selected.field) {
			for (var j in selected.data) {
				if (!selected.data[j][selected.field[i].key] && warn_empty === true) {
					errlist.push('Record #' + (parseInt(j)+1) + ' has empty field [' + selected.field[i].key + ']');
				}			
			}		
		} 

		// check for redundent keys
		if (typeof key_field === 'string') {
			for (var j in selected.data) {
				for (var i in selected.data) {
					if (j === i) 
						continue;

					if (selected.data[i][key_field] === selected.data[j][key_field]) {
						errlist.push('[key redundent] ' + key_field + ' record #' + (parseInt(j)+1) + ' and #' + (parseInt(i)+1));
						break;
					}
				}
			}
		}

		// return extracted results
		selected.errlist = errlist;
		onDone(null, selected);
	});
}


SR.API.add('PROCESS_UPLOADED_EXCEL', {
	list:	'array',		// list of uploaded file names
	para:	'object'
}, function (args, onDone) {
		
	// process a single file	
	var processFile = function (file_name, onD) {
		
		// perform file conversion first
		SR.API.IS_UTF8({
			filename:		file_name,
			return_data:	true
		}, function (err, is_utf8, data) {
					   
			if (err) {
				return onD(err); 
			}

			var ext = SR.path.extname(file_name).substring(1);
			LOG.warn('filename: ' + file_name + ' isUTF8: ' + is_utf8 + ' ext: ' + ext, l_name);

			// NOTE: data returned here should be read with proper encoding
			if (ext === 'csv') {
				// for CSV text
				var array = CSVToArray(data);
				
				// what does this do?
				if (array[array.length-1] == "")
					array.splice(array.length-1, 1);
				
				onD(null, array);
			} else {
				// for excel files
				SR.API.READ_XLSX_DATA({
					filename:		file_name,
					//data:			data
				}, function (err, parsed) {
					if (err) {
						return onD(err); 
					}
					//LOG.warn(parsed);
					onD(null, parsed[0].data);
				});
			};
		});			
	}
	
	var processed_count = 0;
	var errlist = [];
	var combined_xlsx = {
		field: [],				// fields to extract					(eg. ['VOC', 'VOC-1', 'VOC-2'])
		data:  []				// data rows of the extracted fields	(eg. ['some comment', 'type1', 'type2'])
	};

	var checkDone = function () {
		// check done
		if (processed_count === args.list.length) {
			onDone(null, {data: combined_xlsx, errlist: errlist})
		}		
	}
	
	for (var i=0; i < args.list.length; i++) {
			
		var filename = args.list[i];
		processFile(filename, function (err, array) {

			processed_count++;
		
			if (err) {
				LOG.error(err, l_name);
				checkDone();
				return;
			}
			
			// process to extract field name and data
			extract_excel_fields(array, args.para, function (err, result) {
				
				if (err) {
					LOG.error(err, l_name);
					errlist.push(err);
				} else {
					// combine into a single array
					if (combined_xlsx.field.length === 0) {
						combined_xlsx.field = result.field;
					} else {
						// TODO: check extracted field consistency
					}

					combined_xlsx.data = combined_xlsx.data.concat(result.data);
					errlist = errlist.concat(result.errlist);					
				}
				
				checkDone();
			});
		});	
	}
})

SR.API.add('QUERY_AUTOCOMPLETE', {
	form_name:		'string',
	key_id:			'string',
	value_id:		'+string',
	field_id:		'string',
	multiple:		'boolean'
}, function (args, onDone) {
	SR.API.QUERY_FORM({name: args.form_name}, function (err, r_form) {
		if (err) {
			return onDone(err);
		}
		var result = {form: r_form, key_id:args.key_id, field_id: args.field_id, multiple: args.multiple};
		if (args.value_id)
			result['value_id'] = args.value_id;
		return onDone(null, result);
	});
});



SR.Callback.onStart(function () {
	// make sure /web/images directory exists
	UTIL.validatePath(SR.path.join(SR.Settings.PROJECT_PATH, 'web', 'images'));
})
