/*
	flexform module - a module to support flexible, variable field size/type system

	history:
		2016-10-01		refactored from /handler.js of BW-TC project
		2016-12-29		convert into a scalra module


*/
var moment = require('moment');
var isUtf8 = require('is-utf8');
var iconv = require('iconv-lite');

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

var l_formHistory = {};
var l_dbFormHistory = 'FlexFormHistory';



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
			};
		}

		fome_models[l_dbFormHistory] = {
			id: 			'*string',
			form: 			'string',
			field: 			'string',
			record_id: 		'string',
			value: 			'string',
			datetime: 		'string'
		};

		LOG.warn('目前DB內有 ' + count + ' 個form');
		LOG.warn(fome_models)
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

					// LOG.warn( l_form_values[form_id]);

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
					// LOG.warn(l_form[form_id].data.values);

					// l_form[form_id].data.values = ref[form_name];

					// l_form[form_id].add = ref[form_name].add;
					// l_form[form_id].f_remove = ref[form_name].remove;
					// l_form[form_id].size = ref[form_name].size;
				}

				l_formHistory = ref[l_dbFormHistory];

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
	field_data:		'object',
	_default: 		'object',
	_lock: 			'array',
}, function (args, onDone) {
	var data = args.field_data;

	let count = 0;
	let done_count = 0;
	// 00: function 設定
	let custom_edit = () => {
		// 先算出有幾個需要改
		count = 0;
		for (var i in data.fields) {
			var field = data.fields[i];
			if (data.fields[i].setting)
				count ++;
		}
		if (count === 0) {
			set_default_lock();
		}
		// 修改資料
		done_count = 0;
		for (var i in data.fields) {
			if (data.fields[i].setting) {
				var setting = data.fields[i].setting;
				if ( SR.API.FLEX_FORM_SETTING_FUNCTION ) {
					SR.API.FLEX_FORM_SETTING_FUNCTION({setting: setting, field:data.fields[i]}, function (err, result_field) {
						data.fields[i] = result_field;
						done_count++;
						LOG.warn(count);
						LOG.warn(done_count);
						if (done_count === count) {
							set_default_lock();
						}
					});
				} else {
					set_default_lock();
				}

			}
		}
	}

	let change_pointer = (field, onD) => {
		if ( field.pointer !== undefined ) {
			if (field.pointer.form === undefined || field.pointer.field === undefined) {
				onD('pointer need form or field');
			}
			SR.API.QUERY_FORM({
				name: field.pointer.form
			}, function (err, form) {
				let option = { };
				option[''] = 'Please choice';
				for (let record_id in form.data.values) {
					if (form.data.values[record_id][field.pointer.field] !== undefined) {
						option[record_id] = form.data.values[record_id][field.pointer.field];
					}
				}
				field.option = option;
				field.type = 'choice'
				onD(null, field);
			});
		} else {
			onD(null, field);
		}
	}

	let set_default_lock = () => {
		// 處理default和lock
		let [_default, _lock] = [args._default, args._lock];
		if (_default) {
			for (let key in _default) {
				for (let field of data.fields) {
					if (field.id === key) {
						field.default_value = _default[key];
					}
				}
			}
		}
		if (_lock) {
			for (let lock_id of _lock) {
				for (let field of data.fields) {
					if (field.id === lock_id) {
						field.type = 'lock';
					}
				}	
			}
		}
		return onDone(null, data);
	}

	// 01: 主流程
	count = 0;
	done_count = 0;
	for (let field of data.fields) {
		LOG.warn(field)
		if (field.type === undefined) {
			return onDone('field need type!!!');
		}
		if (field.type === 'pointer') {
			count++;
		}
	}
	if (count === 0) {
		custom_edit();
	} else {
		for (let i in data.fields) {
			if (data.fields[i].type === 'pointer') {
				change_pointer(data.fields[i], (err, result_field) => {
					data.fields[i] = result_field;
					done_count++;
					if (done_count === count) {
						custom_edit();
					}
				});
			}	
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
	path:			'+string',
	return_data:	'+boolean'		// whether to return the read data
}, function (args, onDone) {

	var filepath = "";
	if(args.path)
		filepath = args.path;
	else
		filepath = SR.path.join(SR.Settings.UPLOAD_PATH, args.filename);
	SR.fs.exists(filepath, function (exists) {

		if (!exists) {
			return onDone('file not exist!');
		}
		// LOG.warn('開始檢測');
		var data = SR.fs.readFileSync(filepath);
		var utf8 = isUtf8(data);
		// LOG.warn(utf8);
		if (args.return_data === true) {
			// see if we need to re-read for utf8 content
			if (utf8) {
				data = SR.fs.readFileSync(filepath, {encoding: 'utf8'});
			} else {
				data = iconv.decode(data, 'Big5');
			}
		} else {
			data = undefined;
		}

		return onDone(null, {utf8:utf8, data:data});
	});
});

// ++++++++++++++++++++++++++++++++++群組用++++++++++++++++++++++++++++++++++
SR.API.add('QUERY_ALL_LIST', {
	_login: true,
	form_name: 'string',
	field: 'string',
}, function (args, onDone, extra) {
	// if (extra && extra.session._user.account !== 'admin')
	// 	return onDone(null, {result:0, desc: '你沒有權限這麼做'});
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

SR.API.add('GET_ACCOUNT', {
	_login: 	true,
}, function (args, onDone, extra) {
	if (!extra)
		return onDone('only can use in client');
	return onDone(null, {account: extra.session._user.account});
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
		// LOG.warn(form);
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
				return LOG.error(err, form_name);
			}

			LOG.warn('INIT FORM成功');
			LOG.warn('l_form[form.id]');
			// LOG.warn(l_form[form.id]);


			l_form[form.id].data.values = {};
			l_form[form.id].add = ref[form_name].add;
			l_form[form.id].remove = ref[form_name].remove;
			l_form[form.id].size = ref[form_name].size;

			l_form_values[form.id] = ref[form_name];

			onDone(null, {id: form.id});
		});

	});

});

SR.API.add('LOG_FORM_HISTORY', {
	form:		'string', // form name
	record_id: 	'string',
	values: 	'object'
}, function (args, onDone) {
	const datetime = new moment().format('YYYY-MM-DD HH:mm');
	if (Object.keys(args.values).length === 0) {
		LOG.warn('不用紀錄')
		return onDone(null);
	}
	let new_log = [];
	for (let field in args.values) {
		if (field === 'sync') {
			continue;
		}
		new_log.push({
			id: UTIL.createToken(),
			form: args.form,
			field,
			record_id: args.record_id,
			value: args.values[field],
			datetime
		});
	}

	let addHistory = (n, onD) => {
		l_formHistory.add(new_log[n], function (err, result) {
			if (err) {
				return onD(err);
			}
			return onD(null);
		});
	}


	let run_count = 0;
	let logOnDone = (err) => {
		if (err) {
			return onDone(err);
		}
		run_count++;
		if (run_count === new_log.length) {
			return onDone(null);
		}
	}

	for (let i in new_log) {
		addHistory(i, logOnDone);
	}

});

SR.API.add('UPDATE_FORM_HISTORY', {
	record_id: 	'string',
	values: 	'object'
}, function (args, onDone) {
	let record_id = args.record_id;
	if (l_formHistory[record_id] === undefined) {
		return onDone('This record_id is not exist.')
	}
	let values = args.values;
	for (let key in values) {
		// 限制可以改的欄位
		if (key !== 'form' && key !== 'field' && key !== 'record_id' && key !== 'value' && key !== 'datetime') {
			delete values[key];
		}
	}
	Object.assign(l_formHistory[record_id], values);
	l_formHistory[record_id].sync(function (err) {
		return onDone(err);
	});
});

SR.API.add('DELETE_FORM_HISTORY', {
	record_id: 	'string',
}, function (args, onDone) {
	let record_id = args.record_id;
	if (l_formHistory[record_id] === undefined) {
		return onDone('This record_id is not exist.')
	}
	delete l_formHistory[record_id]

	l_formHistory.remove({id:record_id}, function(err, result){
		if (err) {
			return onDone(err);
		}

		onDone(null, 'delete success' );
	});
});

SR.API.add('QUERY_FORM_HISTORY', {
	name: 			'string',
	field: 			'+string',
	record_id: 		'+string'
}, (args, onDone) => {
	let result = [];
	for (let record_id in l_formHistory) {
		let choice = true;
		if ( l_formHistory[record_id].form !== args.name) {
			choice = false;
		}
		if (args.field !== undefined && l_formHistory[record_id].field !== args.field) {
			choice = false;
		}
		if (args.record_id !== undefined && l_formHistory[record_id].record_id !== args.record_id) {
			choice = false;
		}
		if (choice) {
			result.push(l_formHistory[record_id]);
		}
	}
	return onDone(null, result);
});

SR.API.add('QUERY_FORM', {
	id:		'+string',			// form id
	name:	'+string',			// form name
	already_form:	'+object',	//
	query:	'+object',			// optional query finding exact matches
	query_partial: '+object',	// query for any value partially matching the specified query keys' values
	query_time:	'+object',
	overlap: '+object',			// find records if intervals between 'period' overlaps with [start, end] interval
	show:	'+array',			// only show specific fields
	show_unchecked: '+object',	// only show if specified checkboxes are unchecked
	start_date:	'+string',		// 當query裡面有date，且需要設定搜尋範圍時。此時query只能使用一個date key
	end_date:	'+string',
	record_id:	'+string',		// query for specific record_id
	select_time:	'+object'   // 當query裡面有date，且需要設定搜尋範圍時。 ex:{"date":{"start":"2017-05-05"}}
}, function (args, onDone) {
	LOG.warn('QUERY_FORM');

	if (args.already_form) {
		var form = args.already_form;
	} else {
		var form = l_get(args.id, args.name);
	}

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
		if (typeof full_form[name] === 'string') {
			form[name] = full_form[name];
		}
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
		if (typeof(full_values[id]) !== 'object') {
			continue;
		}

		var record = full_values[id];
		var matched = true;

		if (args.record_id && args.record_id != id) {
			continue;
		}
		// ignore rows where the fields do not match

		if (args.query || args.select_time) {
			for (var key in args.select_time) {
				if (fields[key] && fields[key].type === 'date') {
					// LOG.warn('key: ' + key);
					// LOG.warn('compare record: ' + record[key] + ' with query: ' + args.select_time[key]);
					if (args.select_time[key].start && args.select_time[key].end) {
						// LOG.warn('compare '+ record[key]+ ' start: ' + args.select_time[key].start + ' end: ' + args.select_time[key].end );
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
				if (fields[key].type === 'date' || fields[key].type === 'datetime' ) {
					LOG.warn('key: ' + key);
					LOG.warn('compare record: ' + record[key] + ' with query: ' + compare);

					if (args.start_date && args.end_date) {
						LOG.warn('compare '+ record[key]+ ' start: ' + args.start_date + ' end: ' + args.end_date );
						var current = Date.parse(record[key]);
						if (current < Date.parse( args.start_date ) || current > Date.parse( args.end_date ) ) {
							matched = false;
							break;
						}
					} else if (record[key].startsWith(compare) === false) {
						matched = false;
						break;
					}

					LOG.warn('match: ' + matched);
				} else if (typeof compare === 'string' && compare.charAt(0) === '-') {
				// exact match check for other data types
					nonmatch_count++;

					var query_value = compare.substring(1);
					//LOG.warn('query_value:' + query_value);

					if (record[key] === query_value) {
						match_count++;
					}
				} else if (Array.isArray(compare)) {
					// field which exist in query array
					if (compare.includes(record[key])) {
						match_count++;
					}
				} else {
					if (typeof(compare) === 'object') {
						LOG.warn('[' + key + '] compare: ' + record[key] + ' with ' + compare);
						var have_matched = false;
						for (var temp in compare) {
							if (record[key] === compare[temp]) {
								have_matched = true;
								break;
							}
						}

						if (!have_matched) {
							matched = false;
							break;
						}

					} else {
						// LOG.warn('[' + key + '] compare: ' + record[key] + ' with ' + compare);
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
				if ( typeof record[key] === 'string') {
					if (fields.hasOwnProperty(key) === true && fields[key].type === 'tag') {
						var temp = record[key].split(",");
						var have = false;
						for (var t in temp) {
							if (temp[t] === args.query_partial[key]) {
								have = true;
							}
						}

						if (!have) {
							non_matched++;
						}
					} else {
						if (record[key].indexOf(args.query_partial[key]) === (-1)) {
							non_matched++;
						}
					}
				}
			}
			// non of the fields have partial matches at all
			if (non_matched === Object.keys(args.query_partial).length) {
				matched = false;
			}
		}

		if (args.query_time) {
			// LOG.warn('進到query_time');
			for (var key in args.query_time) {
				var start = args.query_time[key].start;
				var end = args.query_time[key].end;
				var current = Date.parse(record[key]);
				if (current < Date.parse( start ) || current > Date.parse( end ) ) {
					matched = false;
					break;
				}
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

		// LOG.warn('最後判斷match')
		// LOG.warn(matched)
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

SR.API.add('JOIN_FORM', {
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

			SR.API.JOIN_FORM_FUNCTION(para, function (err, r_form) {
				if (err)
					return onDone(err);
				return onDone(null, r_form);
			});
		});
	});
});

SR.API.add('JOIN_FORM_FUNCTION', {
	original_form:	'object',
	joint_form:		'object',
	link_key:		'string',
	joint_form_key:	'+string',
	joint_value:	'+array'
}, function (args, onDone) {
	// o_form = UTIL.clone(args.original_form);
	// form2 = UTIL.clone(args.joint_form);
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
	LOG.warn('keys = ')
	LOG.warn(keys);
	if (args.link_key === 'record_id') {
		for (var record_id2 in form2.data.values) {
			if ( o_form.data.values[ form2.data.values[record_id2][joint_form_key] ] ){
				LOG.warn('有')
				for (var i in keys) {
					if (args.joint_value && args.joint_value.indexOf(keys[i])=== -1 )
						continue;
					if (!o_form.data.values[ form2.data.values[record_id2][joint_form_key] ][keys[i]]) // do not cover original data
						o_form.data.values[ form2.data.values[record_id2][joint_form_key] ][keys[i]] = form2.data.values[record_id2][keys[i]];
				}
			} else {
				LOG.warn('沒有')
				LOG.warn(form2.data.values[record_id2][joint_form_key])
			}
		}
	} else {
		for (var record_id in o_form.data.values){
			for (var record_id2 in form2.data.values) {
				if (form2.data.values[record_id2][joint_form_key] === o_form.data.values[record_id][args.link_key])
					for (var i in keys) {
						if (args.joint_value && args.joint_value.indexOf(keys[i])=== -1 )
							continue;
						if (!o_form.data.values[record_id][keys[i]]) // do not cover original data
							o_form.data.values[record_id][keys[i]] = form2.data.values[record_id2][keys[i]];
					}
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

SR.API.add('DELETE_FIELD_LIST', {
	delete_list: 	'object'
}, function (args, onDone) {
	var jq = SR.JobQueue.createQueue();
	var l_do_delete_field = function (para) {
		return function (onD) {
			SR.API.DELETE_FIELD(para, function(err, result){
				if (err){
					LOG.warn(err);
					return onD(err);
				}
				onD();
			});
		}
	}
	for (var form_name in args.delete_list) {
		for (var i in args.delete_list[form_name]) {
			jq.add(l_do_delete_field( { form_name: form_name, record_id: args.delete_list[form_name][i] } ));
		}
	}
	jq.run(function (err) {
		return onDone(null);
	});
	// return onDone(null);
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
	return_values:	'+boolean'
}, function (args, onDone, extra) {

	if (!args.form_id && !args.form_name)
		return onDone('values not found for form_id or form_name ');

	var form = undefined;
	var update_form_name = '';
	// get form
	if (args.form_name) { // by name
		update_form_name = args.form_name;
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
		update_form_name = l_form[args.form_id].name;
		if (l_form.hasOwnProperty(args.form_id) === false) {
			return onDone('form id invalid: ' + args.form_id);
		}

		form = l_form[args.form_id];
	}
	LOG.warn('values to update:');
	LOG.warn(args.values);
	// var values_map = form.data.values;
	var values_map = {};
	if (args.record_id) { // 修改資料
		if (form.data.values.hasOwnProperty(args.record_id) === false)
			return onDone('values not found for record id [' + args.record_id + ']');
		values_map = form.data.values[args.record_id];
	} else { // 新增資料
		if (extra && extra.session && extra.session._user && extra.session._user.account)
			if (typeof(args.values['account']) === 'undefined')
				args.values['account'] = extra.session._user.account;
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
	let change_values = {};
	for (var key in args.values) {
		if (typeof args.values[key] !== 'undefined') {
			// values_map[args.record_id][key] = args.values[key];
			if (values_map[key] === undefined) {
				change_values[key] = args.values[key];
			} else if (values_map[key] !== args.values[key]) {
				change_values[key] = args.values[key];
			}
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
				change_values[form.data.fields[j].id] = form.data.fields[j].default;
				// LOG.warn('新增default');
			}

		}
		if (!args.record_id && !values_map[form.data.fields[j].id]) {
			// var today=new Date();
			var today2 = new moment();
			// .format('YYYY-MM-DD HH:mm')
			LOG.warn(form.data.fields[j].option)
			// if ( !(!!form.data.fields[j].option && typeof(form.data.fields[j].option.auto_date) !== 'undefined' && !form.data.fields[j].option.auto_date) ) {
			if (form.data.fields[j].option !== undefined && form.data.fields[j].option.auto_date !== undefined && form.data.fields[j].option.auto_date) {
				let log_time = '';
				if (form.data.fields[j].type === 'date' ) {
					log_time = today2.format('YYYY-MM-DD');
					values_map[form.data.fields[j].id] = log_time;
					change_values[form.data.fields[j].id] = log_time;
				} else if (form.data.fields[j].type === 'datetime' ) {
					log_time = today2.format('YYYY-MM-DD HH:mm');
					values_map[form.data.fields[j].id] = log_time;
					change_values[form.data.fields[j].id] = log_time;
				}
			}
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

	l_add_form({form: form, values_map: values_map, para: args, change_values}, function (err, result) {
		if (err) {
			return onDone('l_add_form failed');
		}

		if (typeof new_record_id !== 'undefined'
		    && typeof result !== 'undefined'
		    && typeof result.id !== 'undefined'
		    && new_record_id !== result.id) {
			new_record_id = result.id;
		}

		var result_para = {
			desc: 'form [' + args.form_id + '] record [' + (args.record_id) ? args.record_id : new_record_id + '] updated',
			record_id:(args.record_id) ? args.record_id : new_record_id
		};

		if (!!args.return_values && args.return_values) {
			result_para.values = values_map;
			result_para.form_name = update_form_name;
		}
		onDone(null, result_para);
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

var l_add_form = function (para, onDone) {
	LOG.warn('para的form');
	// LOG.warn(para.form.data.fields);
	// 篩選掉不用紀錄的changes
	let change_values = {};
	for (let i in para.form.data.fields) {
		if (para.change_values[para.form.data.fields[i].id] !== undefined) {
			if (para.form.data.fields[i].log_history !== undefined &&
				para.form.data.fields[i].log_history === true) {
				change_values[para.form.data.fields[i].id] = para.change_values[para.form.data.fields[i].id];
			}
		}
	}
	LOG.warn(para.change_values)
	LOG.warn(change_values)
	
	if (para.para.record_id) {
		LOG.warn('使用record_id ' + para.para.record_id);
		if (para.form.data.values.hasOwnProperty(para.para.record_id) === false)
			return onDone('values not found for record id [' + para.para.record_id + ']');

		for (key in para.values_map) {
			// LOG.warn('存的key ' + key);
			// LOG.warn(para.form.data.values[para.para.record_id][key] + ' 設成 ' + para.values_map[key]);
			l_form_values[para.form.id][para.para.record_id].values[key] = para.values_map[key];
		}
		// LOG.warn('準備sync');
		l_form_values[para.form.id][para.para.record_id].values.sync(function (err) {
			if (err) {
				LOG.warn('存入error');
				return onDone('save to DB error: ' + err);
			}
			// LOG.warn('存進DB')
			if (change_values !== undefined) {
				SR.API.LOG_FORM_HISTORY({
					form: l_form[para.para.form_id].name,
					record_id: para.para.record_id,
					values: change_values
				}, (err, re) => {
					return onDone(null);
				});
			} else {
				return onDone(null);
			}
		});
	} else {
		// LOG.warn('使用new_record_id');
		// LOG.warn(para.para.new_record_id);
		// LOG.warn(new Date().toISOString());
		para.form.add({id: para.para.new_record_id, values: para.values_map, create_time: new Date().toISOString()}, function (err, result) {
			if (err) {
				return onDone(err);
			}

			// 以實際上 DB 儲存的 id 為主
			if (para.para.new_record_id !== result.id) {
				para.para.new_record_id = result.id;
			}

			if (typeof(l_form_values[para.para.form_id][para.para.new_record_id]) !== 'undefined') {
				para.form.data.values[para.para.new_record_id] = l_form_values[para.para.form_id][para.para.new_record_id].values;
				para.form.data.values[para.para.new_record_id].sync = l_form_values[para.para.form_id][para.para.new_record_id].sync;
				//LOG.warn(para.form.data.values);
				if (change_values !== undefined) {
					SR.API.LOG_FORM_HISTORY({
						form: l_form[para.para.form_id].name,
						record_id: para.para.new_record_id,
						values: change_values
					}, (err, re) => {
						return onDone(null, result);
					});
				} else {
					return onDone(null, result);
				}
			} else {
				LOG.warn(l_form_values);
				LOG.warn(para.para.form_id);
				LOG.warn(para.para.new_record_id);
				return onDone('l_form_values[para.para.form_id][para.para.new_record_id] undefined');
			}
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


	for (var j in form.data.fields) {
		var id = form.data.fields[j].id;
		if (typeof(form.data.fields[j].unit)!=='undefined' ) {
			if (form.data.fields[j].unit) {
				for (var temp_record_id in form.data.values)
					for (var i=0; i < value_array.length; i++) {
						if (form.data.values[temp_record_id][id] === value_array[i][id] && (typeof(value_array[i]['_record_id']) === 'undefined' || value_array[i]['_record_id'] !== temp_record_id))
							return onDone({error_type: 'unique', message: id });
					}
			}
		}
	}

	let change_values_array = [];
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
				if ( !(typeof(form.data.fields[j].option) !== 'undefined' && typeof(form.data.fields[j].option.auto_date) !== 'undefined' && !form.data.fields[j].option.auto_date) ) {
					if (form.data.fields[j].type === 'date' )
						value_array[i][form.data.fields[j].id] = today2.format('YYYY-MM-DD');
						// value_array[i][form.data.fields[j].id] = today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate();
					else if (form.data.fields[j].type === 'datetime' )
						value_array[i][form.data.fields[j].id] = today2.format('YYYY-MM-DD HH:mm');
						// value_array[i][form.data.fields[j].id] = today.getFullYear() + '/' + (today.getMonth()+1) + '/' + today.getDate() + ' ' + today.getHours()+':'+today.getMinutes();
				}
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
		change_values_array.push({});
		// 將修改的內容寫到記憶體內
		if (have_record_id) { // edit data
			for (var key in value_array[i]) {
				if (form.data.values[record_id][key] !== value_array[i][key]) {
					change_values_array[i][key] = value_array[i][key];
				}
				form.data.values[record_id][key] = value_array[i][key];
			}
		} else {
			// new data
			change_values_array[i] = value_array[i];
		}

		jq.add(l_add({form:form, values_map:value_array[i], para:new_para, change_values: change_values_array[i]}));

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
	fields:	'array',
	values: '+array'
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
			if (args.values && args.values.length > 0) {
				for (let i =0 ; i < args.values.length; i++) {
					SR.API.UPDATE_FIELD({
						form_name: args.name,
						values: args.values[i]
					}, (err, result) => {
						if (err) {
							LOG.error(err);
							return onDone(err);
						}
					})
				}
				return onDone(null, ref);
			} else
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
			// LOG.warn(arr_data[i], l_name);
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
		}, function (err, result) {

			if (err) {
				return onD(err);
			}

			var is_utf8 = result.is_utf8;
			var data = result.data;
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

SR.API.add('flexform_to_flexform_table', {
	_direct: 	true,
	form:		'object',
	opt:		'+object',
}, function (args, onDone) {
	var option = args.opt || {};
	var form = args.form;
	// Object.assign({}, {
	// 	sortDesc: null, // key in object should be sorted
	// 	sortAsc: null // key in object should be sorted
	// }, option);
	option['sortDesc'] = null;
	option['sortAsc'] = null;

	var flexform_table = {};
	flexform_table.field = [];
	flexform_table.data = [];
	for (var i in form.data.fields) {
		var t = JSON.parse(JSON.stringify(form.data.fields[i]));
		// var t = SR.clone(form.data.fields[i]);
		t['key'] = form.data.fields[i].id;
		t['value'] = form.data.fields[i].name;
		flexform_table.field.push(t);
		// flexform_table.field.push(Object.assign({}, form.data.fields[i], { key: form.data.fields[i].id, value: form.data.fields[i].name }));
	}
	for (var record_id in form.data.values) {
		var temp_data = {};
		for (var i in flexform_table.field)
			temp_data[flexform_table.field[i].key] = form.data.values[record_id][flexform_table.field[i].key];
		temp_data['record_id'] = record_id;
		flexform_table.data.push(temp_data);
	}

	if (!!option.sortDesc) {
		flexform_table.data.sort(function(a, b) {a[option.sortDesc] > b[option.sortDesc] ? 1 : -1});
	}

	if (!!option.sortAsc) {
		flexform_table.data.sort(function(a, b){ a[option.sortAsc] < b[option.sortAsc] ? 1 : -1});
	}

	flexform_table.form_name = form.name;
	return flexform_table;
});

SR.API.add('flexform_table_add_field', { // flexform_table_add_field(0, flex_form, {key:'new_f', value: '新的欄位'}, ['a','b'])
	_direct: 			true,
	insert_num:			'int',
	flexform_table:		'object',
	field:				'object',
	datas:				'array'
}, function (args, onDone) {
	// insert_num: 插入的位置
	// flexform_table: 需插入的flexform_table
	// field: 插入的欄位，須包含key和value
	// datas: 寫入原先已有的data，需和現在data數量相同的array
	var insert_num = args.insert_num;
	var flexform_table = args.flexform_table;
	var field = args.field;
	var datas = args.datas;

	if (datas.length !== flexform_table.data.length)
		return flexform_table;
	flexform_table.field.splice(insert_num, 0, field);
	for (var i in datas)
		flexform_table.data[i][field.key] = datas[i];
	return flexform_table;
});

SR.API.add('substitute_value', {
	_direct: 			true,
	target_form:		'string',
	target:				'string',
	target_value:		'string',
	value:				'array'
}, function (args, onDone) {
	var form = l_get(args.id, args.target_form);
	var new_value = []
	for (var i in args.value)
		for (var record_id in form.data.values)
			if (args.value[i] === form.data.values[record_id][args.target]) {
				args.value[i] = form.data.values[record_id][args.target_value];
				new_value.push(form.data.values[record_id][args.target_value]);
				break;
			}
	return new_value;
});

SR.API.add('getMoment', {
	_direct: 	true,
}, function (args, onDone) {
	return moment;
});

SR.API.add('transformFieldNameByLanguageFile', {
	_direct: 	true,
	form: 		'object',
	language: 	'object'
}, function (args, onDone) {
	let [form, language] = [args.form, args.language];
	let form_name = form.name;
	let names = language.flexform[form_name];
	// 依照language檔案命名
	for (let field of form.data.fields) {
		field.name = ( names !== undefined ? names[field.id] : field.name || field.id );
	}
	return form;
});
let transform_field_name = (form_name, form) => {

}

SR.Callback.onStart(function () {
	// make sure /web/images directory exists
	UTIL.validatePath(SR.path.join(SR.Settings.PROJECT_PATH, 'web', 'images'));
})
