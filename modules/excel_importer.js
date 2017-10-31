
/*
	excel_importer module 
	
	import EXCEL files into a FlexForm
	it'll read an uploaded excel file and returned specified columns

	history:
		2017-01-02		converted from the excel_reader in BW-TC project

	dependency:
		FlexForm		
*/

var l_name = 'ExcelImporter';

// module object
var l_module = exports.module = {};

// a pool for all message handlers
var l_handlers = exports.handlers = {};
var l_checkers = exports.checkers = {};

// module init
l_module.start = function (config, onDone) {
	UTIL.safeCall(onDone);
}

// module shutdown
l_module.stop = function (onDone) {
	UTIL.safeCall(onDone);
}

// register this module
SR.Module.add('ExcelImporter', l_module);

//
// API 
//

var xlsx = require('node-xlsx'); 

SR.API.add('WRITE_XLSX', {
	// filename:		'string',			
	columns:		'+array',	
	data:			'+array'
}, function (args, onDone) {
	var filanema = UTIL.createToken() + '.xlsx';
	var file_path = SR.path.resolve(SR.Settings.UPLOAD_PATH, filanema);
 	if (args.columns) {
		var buffer = xlsx.build([
		{
		  name:'sheet1',
		  data:args.columns
		}
		]);
	} else if (args.data)
		var buffer = xlsx.build(args.data);
	else 
		return onDone(null, '錯誤');
	SR.fs.writeFileSync(file_path, buffer, {'flag':'w'});
	return onDone(null, filanema);
});


SR.API.add('TEST_READ_XLSX', {
	filename:		'string',							
}, function (args, onDone) {
	var file_path = SR.path.resolve(SR.Settings.UPLOAD_PATH, args.filename);
	var excelObj = xlsx.parse(file_path);
	return onDone(null, excelObj);
});

SR.API.add('READ_XLSX', {
	path:		'string',			// path to excel file
	columns:	'array',			// an array of strings of columns to be selected
	required:	'+array'			// an array of strings of fields that must contain data to consider valid
}, function (args, onDone) {

	var fields = args.columns;
	var required = args.required || [];
	
	LOG.warn('fields to import: ' + fields, l_name);
	LOG.warn('fields required to have: ' + required, l_name);
	
	LOG.warn('reading excel:' + args.path, l_name);
	var parsed = xlsx.parse(args.path);
			
	var obj = parsed[0];
	LOG.warn('names: ' + obj['name'], l_name);

	var rows = obj['data'];
	
	// try to track matching column names first
	LOG.warn('try to identify which row contains matching column names...', l_name);	
	var mapping = {};	
	var r = 0;
	for (var r=0; r < rows.length; r++) {
		var col_names = rows[r];
		
		for (var i=0; i < fields.length; i++) {
			var name = fields[i];
			var idx = col_names.indexOf(name);
			
			if (idx !== (-1)) {
				mapping[name] = idx;
			} else {
				// if full matching is not found, try partial matching
				for (var j=0; j < col_names.length; j++) {
					if (col_names[j].startsWith(name)) {
						name = col_names[j];
						fields[i] = name;
						mapping[name] = j;
						break;
					}
				}
			}
			if (mapping.hasOwnProperty(name) === false) {
				break;
			}
		}

		if (i === fields.length) {
			break;	
		} else {
			// if not all fields are found, continue to next row
			mapping = {};
		}
	}
	
	// if not all fields are found, return error
	if (r === rows.length || Object.keys(mapping).length !== fields.length) {
		return onDone('not all required fields are found in data source');	
	}
	
	LOG.warn(mapping);
	
	// remove first row of column names
	rows.splice(0, (r+1));
	
	var table = [];
	
	// purge unnecessary fields in return values, also order things in order desired
	for (var i=0; i < rows.length; i++) {
		var row = rows[i];
		var new_row = [];
		for (var j=0; j < fields.length; j++) {
			var name = fields[j];
			var index = mapping[name];
			var value = row[index];
			//LOG.sys('name: ' + name + ' index: ' + index + ' value: ' + value);
			// check if this is a required field
			if (required.indexOf(name) !== (-1) && (value === '' || typeof value === 'undefined'))
				break;

			// NOTE: we remove any leading or trailing white spaces
			if (typeof value === 'string')
				value = value.trim();
			
			new_row.push(value);
		}
		
		// store only valid rows
		if (new_row.length === fields.length)
			table.push(new_row);
	}
	
	onDone(null, {table: table, column_map: mapping});
});


// read an excel file from upload directory into a parsed array
SR.API.add('READ_XLSX_DATA', {
	filename:		'+string',
	data:			'+string'
}, function (args, onDone) {
	
	var parsed = undefined;
	
	if (args.filename) {
		var filepath = SR.path.resolve(SR.Settings.UPLOAD_PATH, args.filename);
		parsed = xlsx.parse(filepath);	
	} else if (args.data) {
		parsed = xlsx.parse(args.data);
	}
	if (!parsed)
		return onDone('cannot parse!')
	else
		return onDone(null, parsed);
});


// NOTE: this should be called AFTER the file has been successfully uploaded
// format is in the form of (* indicates a required field, and will prompt error and import fail if no data exist)
/*
{'讀取卡號': 'RFID_id', 
 '學員代號': '*member_id', 
 '姓名': 'basic.name', 
 '班級': 'class_info.name', 
 '上課身分': 'class_info.type'}
*/

// read an excel file into flexform
SR.API.add('IMPORT_EXCEL', {
	filename:	'string',		// name of the uploaded excel file
	format:		'object',		// format from field name to object field mapping
	form_name:	'string',		// name of form to import data into
}, function (args, onDone) {

	// get access to all forms
	var	l_form = SR.State.get('FlexFormMap');
	
	var form = undefined;
	for (var id in l_form) {
		if (l_form[id].name === args.form_name) {
			form = l_form[id];
			break;
		}
	}
	if (!form) {
		return onDone('form [' + args.form_name + '] cannot be found.');	
	}
	
	// load field mapping 
	var filepath = SR.path.resolve(SR.Settings.UPLOAD_PATH, args.filename);
	var fields = Object.keys(args.format);
	var keys = [];
	for (var key in args.format) {
		keys.push(args.format[key]);	
	}
	
	LOG.warn('keys:');
	LOG.warn(keys);
	
	// extract required field
	var required = [];
	var key_field = undefined;
	var key_index = (-1);

	for (var i = 0; i < keys.length; i++) {
		
		if (keys[i].charAt(0) === '*') {
			keys[i] = keys[i].substring(1);
			key_field = keys[i];
			key_index = i;
		} else if (keys[i].charAt(0) === '+') {
			keys[i] = keys[i].substring(1);
			continue;
		}
		required.push(fields[i]);
	}
	var para = {path: filepath, columns: fields, required: required};
	LOG.warn('calling READ_XLSX with para:');
	LOG.warn(para);
	
	SR.API.READ_XLSX(para, function (err, result) {
		if (err) {
			return onDone(err);	
		}
		
		var table = result.table;
		LOG.warn('rows of table: ' + table.length);

		// if there's a keyfield, build mapping from key value to record_id
		var value2id = {};
		if (key_field) {
			LOG.warn('key_field: ' + key_field);
			//LOG.warn('form');
			//LOG.warn(form);
			
			for (var id in form.data.values) {
				//LOG.warn('record id [' + id + ']');
				LOG.warn(form.data.values[id]);
				
				if (form.data.values[id].hasOwnProperty(key_field) && form.data.values[id][key_field] !== '') {
					value2id[form.data.values[id][key_field]] = id;
				}
			}
		}
		LOG.warn('value2id:');
		LOG.warn(value2id);

		// start import the data into form
		var errmsg = [];
		var done_count = 0;
		
		for (var i=0; i < table.length; i++) {
			LOG.warn(table[i]);

			var record_id = undefined;
			// check if there's existing record (same key value)
			if (value2id[table[i][key_index]]) {
				record_id = value2id[table[i][key_index]];
			}
				
			// fill in data
			var values = {};
			for (var j=0; j < keys.length; j++) {
				values[keys[j]] = table[i][j];
			}						

			// update to form/DB
			// TODO: add to DB not one by one but by batch
			// NOTE: if record_id exists then it'll be a replace of existing data, otherwise a new record is created
			SR.API.UPDATE_FIELD({
				form_id: form.id,
				record_id: record_id,
				values:	values
			}, function (err, result) {
				done_count++;
				
				if (err) {
					LOG.error(err);	
					errmsg.push(err);
				}

				// check if done
				if (done_count === table.length) {
					onDone(errmsg.length === 0 ? null : errmsg);
				}
			});				
		}
	});
});
