// ------------------------------------------ View 用 Start ------------------------------------------------
var create_table_v4 = function (form, para) {
	var hide = para.hide;
	var write = para.write;
	var td_style = para.td_style;
	var show = para.show;
	var del = para.del;
	var customized = para.customized;

	var hide = (hide ? hide : []);
	if (!td_style)
		td_style =  ['width:20%;','text-align:left;'];
	var html = '';
	
	var fields = form.data.fields;

	function c_table(fields, value, record_id) {
		if (!write&& !value)
			return '';
		var html = '';
		html += '<table border="1" class="customTable" style="margin:0">';
		for (var i in fields) {
			
			if (record_id)
				var save_id = record_id + '-' + fields[i].id;
			else
				var save_id = fields[i].id;
			if (value && value[fields[i].id]) {
				var save_value = value[fields[i].id];
			} else
				var save_value = '';
			if (fields[i].default_value)
				save_value = fields[i].default_value;
				// console.log('有default_value' + fields[i].default_value)
			// check if the field is hidden or specified as 'hide'
			if (!fields[i].show || hide.indexOf(fields[i].id) !== (-1)) {
				continue;				
			}
			
			if (customized) {
				var col_f = fields[i].col_f;
				var col_v = fields[i].col_v;
				var br = fields[i].br;
			} else {
				var col_f = 1;
				var col_v = 1;
				var br = true;
			}
			
			// console.log(fields[i].name + ' col_f = ' + col_f + ' col_v = ' + col_v + ' br = ' + br);
			// begin a row of data
			if (show) {
				html += '<tr '+ (show.indexOf(fields[i].id)!== -1 && !fields[i].show_partial ? ' style="" data-can-hide="n" ' : 'style="display: none;"  data-can-hide="y" ') ;
				// if (fields[i].show_partial)
				// 	html += 'data-total_value="'+value[fields[i].id]+'" ';
				html += ' >';
			}
			// else
				// html += '<tr>';
			
			if (fields[i].type === 'line') {
				html += '<tr><td colspan="'+(col_f + col_v)+'"><hr></td>';
			} else {
				// display field name
				html += '<td style="'+(td_style?td_style[0]:'')+' ; vertical-align:middle;" colspan="'+col_f+'">' + fields[i].name + (fields[i].must ? '*' : '') +  ' </td>';
				// show field content
				html += '<td style="'+(td_style?td_style[1]:'')+'" colspan="'+col_v+'">';

				switch (fields[i].type) {
					// FIXME: should make 'upload' not just for pics but files in general
					case 'record':
						if (write) {
							// var record_id = '<%= UTIL.createToken() %>';
							// set upload item limit
							var num = (fields[i].num ? fields[i].num : 5);
							html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' role="form" id="frmUploadRecord">';
							html += '<input type="hidden" name="toPreserveFileName" value="true" checked>';
							html += '<input type="file" name="upload" id="inputRecord-'+save_id+'" multiple="multiple">';
							html += '<button class="btn btn-primary" onClick="uploadFile( \''+num+'\' , \''+save_id+'\', onRecordUploaded, \''+['mp3']+'\', \'inputRecord-'+save_id+'\', \''+form.name+'\', \''+fields[i].id+'\' )">Upload</button>';

							if (save_value.length !== 0) {
								var new_value = save_value.replace(/\"/g, "'");
								// console.log(new_value.replace(/\"/g, "'"));
							} else{
								var new_value = '';
							}

							console.log('new_value')
							console.log(new_value);

							html += '<input type="hidden" value="'+new_value+'" id="' + save_id + '">';
							console.log('save_value = ')
							console.log(save_value )
							html += '<div id="'+save_id+'-show_upload_record">';
							if (save_value.length !== 0) {
								var files = JSON.parse(save_value);
								for (var i in files) 
									html += create_record_dev(save_id , files[i].filename, files[i].filetitle);
							}
							html += '</div>';

							html += '</form>';
						} else {
							html += '<div id="uploaded_record">';
							html += show_record(value[fields[i].id]);
							html += '</div>';	
						}
						break;
					case 'upload': // 照片
						if (write) {
							var image_id = '<%= UTIL.createToken() %>';

							// set upload item limit
							var num = (fields[i].num ? fields[i].num : 5);

							html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' role="form" id="frmUploadFile">';
							html += '<input type="hidden" name="toPreserveFileName" value="true" checked>';
							html += '<input type="file" name="upload" id="upload_file" multiple="multiple">';
							html += '<button class="btn btn-primary" onClick="uploadFile( \''+num+'\' , \''+save_id+'\', onPhotoUploaded, undefined, undefined, \''+form.name+'\', \''+fields[i].id+'\' )">Upload</button>';
							html += '<input type="hidden" value="'+save_value.replace(/"/g, '&quot;')+'" id="' + save_id + '">';

							html += '<div id="'+save_id+'-show_upload_img">';
							console.log(save_value);
							if (save_value.length !== 0) {
								var files = JSON.parse( save_value );
								for (var i in files) 
									html += create_img_dev(save_id, files[i].image, files[i].text);
							}
							html += '</div>';

							html += '</form>';				
						} else {
							html += '<div id="uploaded_photo">';
							// 舊的顯示:無文字說明
							/*
							if (value[fields[i].id])
								html += show_imgs(value[fields[i].id]);
							*/
							if (value[fields[i].id] !== undefined && value[fields[i].id].length !== 0) {
								var data = JSON.parse( value[fields[i].id] );
								for (var i in data)
									html += show_imgs(data[i]);
							}
							html += '</div>';						
						}
						break;

					case 'textarea':
						if (write ) {
							// html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' role="form" id="frmUploadTxt">';
							// html += '<input type="hidden" id="'+save_id+'-encode" value="">';
							// html += '<input type="file" id="inputTxt-'+save_id+'">';
							// html += '<button id="txtBtn-'+textarea_id.length+'" onClick="uploadFile( \'1\' , \''+save_id+'\', onTxtUploaded, \''+['txt']+'\', \'inputTxt-'+save_id+'\')">上傳文字檔</button>';
							// html += '</form>';					
							html += '<br>';
							// textarea_id.push(save_id);
							html += '<textarea rows="3" cols="20" id="'+save_id+'"  style="resize: none;">';
							html += save_value;
						} else {
							html += '<textarea rows="3" cols="20" readonly="readonly"  style="resize: none;">';
							html += save_value;
						}
						html += '</textarea>';					
						break;

					case 'date':
						if (write && ! fields[i].default_value) {
							html += `<input type="date" id="${save_id}" value="${save_value}"`;
							if (fields[i].max !== undefined) {
								html += ` max=${fields[i].max}`;
							}
							if (fields[i].min !== undefined) {
								html += ` min=${fields[i].min}`;
							}
							html += `>`;
							// html += '<input type="date" id="'+save_id+'" value="'+save_value+'">';
							// date_pickers.push(save_id);	
						} else {
							html += new Date(save_value).toDateString();
						}
						break;

						case 'datetime':
						if (write && ! fields[i].default_value) {
							html += `<input type="date" id="${save_id}" value="${save_value}"`;
							if (fields[i].max !== undefined) {
								html += ` max=${fields[i].max}`;
							}
							if (fields[i].min !== undefined) {
								html += ` min=${fields[i].min}`;
							}
							html += `>`;
						} else {
							html += save_value;
						}
						break;

					case 'number':
						console.log('number...')
						console.log(fields[i])
						if (write && ! fields[i].default_value) {
							html += `<input type="number" id="${save_id}"`;
							if (save_value !== '') {
								html += ` value="${save_value}"`;
							} else {
								html += ` value="${fields[i].init_value}"`;
							}
							if (fields[i].max !== undefined) {
								html += ` max=${fields[i].max}`;
							}
							if (fields[i].min !== undefined) {
								html += ` min=${fields[i].min}`;
							}
							html += `>`;
						} else {
							html += save_value;
						}
						break;

					case 'autocomplete': 
						if (write) {
							html += '<input type="text" id="' + save_id + '" value="'+save_value+'">';
							$( function() {

								if (fields[i].autocomplete_setting) {
									var form_name = fields[i].autocomplete_setting.form_name;
									var key_id = fields[i].autocomplete_setting.key_id;
									var value_id = fields[i].autocomplete_setting.value_id;
									var multiple = fields[i].autocomplete_setting.multiple;
								} else {
									var form_name = form.name;
									var key_id = fields[i].id;
									var multiple = false;
								}
								// console.log('用的form_name');
								// console.log(form_name);
								// console.log(key_id);
								var para = {form_name: form_name, key_id: key_id, field_id: fields[i].id, multiple: multiple};
								if (value_id)
									para.value_id = value_id;
								SR.API.QUERY_AUTOCOMPLETE(para, function (err, result) {
									if (err) {
										console.log(err);	
									}
									var ans = [];
									// console.log('找到的r_form');
									// console.log(r_form);
									var r_form = result.form;
									function haveSame(arr, str) {
										for (var i in arr)
											if (arr[i] === str)
												return true;
										return false;
									}
									console.log('顯示');
									console.log(result);
									for (var r_id in r_form.data.values)
										if (!haveSame(ans, r_form.data.values[r_id][result.key_id])) {
											ans.push(r_form.data.values[r_id][result.key_id] + (result.value_id?'('+r_form.data.values[r_id][result.value_id]+')': ''  ) );
										}

									if (result.multiple) {
										function split( val ) {
											return val.split( /,\s*/ );
										}
										function extractLast( term ) {
											return split( term ).pop();
										}

										$( "#" + result.field_id ).autocomplete({
											source: function( request, response ) {
											  // delegate back to autocomplete, but extract the last term
											  response( $.ui.autocomplete.filter(
												ans, extractLast( request.term ) ) );
											},
											select: function( event, ui ) {
												var terms = split( this.value );
												// remove the current input
												terms.pop();
												// add the selected item
												terms.push( ui.item.value );
												// add placeholder to get the comma-and-space at the end
												terms.push( "" );
												this.value = terms.join( ", " );
												return false;
											},
											lookup: function (query, done) {
												// ajax call one
												// ajax call two
												// combine results
												// var results = { suggestions: [ ... ] }
												done(results);
											}
										});
									} else {
										$( "#" + result.field_id ).autocomplete({
											source: ans
										});
									}
								});	
							});							
						} else {
							html += save_value;
						}				
						break;
					case 'tag': 
						if (write) {
							html += '<input type="text" class="tags" id="' + save_id +'" value="'+save_value+'">';
						} else {
							html += save_value;
						}
						break;
					case 'choice':
						if (write) {
							// console.log('fields[i] = ')
							// console.log(fields[i])
							if (typeof(fields[i].option) === 'object')
								var options = fields[i].option;
							else if (typeof(fields[i].option) !== 'undefined')
								var options = fields[i].option.split(',');

							html += '<select id="'+ save_id + '">';
							if (options === undefined) {
								html += '';
							} else if ( Array.isArray(options) ) {
								for (var j=0; j < options.length; j++) {

									html += '<option value="' + options[j] + '" '+(save_value!==''&&options[j]===save_value?'selected="true"':'')+'  >' + options[j] + '</option>';
								}
							} else {
								for (let op_key in options) {
									html += `<option value="${op_key}" ${(save_value!==''&&op_key===save_value?'selected="true"':'')} >${options[op_key]}</option>`;
								}
							}
							html += '</select>';
						} else {
							if (fields[i].option !== undefined && fields[i].option[save_value] !== undefined) {
								html += fields[i].option[save_value]; // 帶入對應的值
							} else {
								html += save_value;
							}
						}
						break;
					case 'lock':
						if (write) {
							// console.log('fields[i] = ')
							// console.log(fields[i])
							if (typeof(fields[i].option) === 'object')
								var options = fields[i].option;
							else if (typeof(fields[i].option) !== 'undefined')
								var options = fields[i].option.split(',');

							html += '<select id="'+ save_id + '" disabled="disabled">';
							if (options === undefined) {
								html += '';
							} else if ( Array.isArray(options) ) {
								for (var j=0; j < options.length; j++) {

									html += '<option value="' + options[j] + '" '+(save_value!==''&&options[j]===save_value?'selected="true"':'')+'  >' + options[j] + '</option>';
								}
							} else {
								for (let op_key in options) {
									html += `<option value="${op_key}" ${(save_value!==''&&op_key===save_value?'selected="true"':'')} >${options[op_key]}</option>`;
								}
							}
							html += '</select>';
						} else {
							if (fields[i].option !== undefined && fields[i].option[save_value] !== undefined) {
								html += fields[i].option[save_value]; // 帶入對應的值
							} else {
								html += save_value;
							}
						}
						break;
					case 'password':
						if (write) {
							html += '<input type="password" id="' + save_id +'" value="'+save_value+'">';					
						} else {
							html += save_value;
						}
						break;
					case 'boolean':
						if (write) {
							html += '<input id="'+save_id+'" type="checkbox" class="checkbox-billable" '+((typeof(save_value) === 'boolean' && save_value )?'checked':'')+' /><label> </label>';
						} else {
							html += save_value ? '是' : '否'
						}
						break;
					case 'timestamp':
						if (write && ! fields[i].default_value) {
							html += '<input type="text" id="'+save_id+'" value="'+save_value+'">';
							date_pickers.push(save_id);	
						} else {
							html += save_value ? '是' : '否'
						}
						break;
					case 'print': // 單純印出
						break;
					default:
						if (write && ! fields[i].default_value) {
							html += '<input type="text" id="' + save_id +'" value="'+save_value+'">';					
						} else {
							html += save_value;
						}
						break;
				}

				html += '</td>'
			}
			
			if (br) {
				html += '</tr>';
			}
			if (show && !write && fields[i].show_partial) {
				html += '<tr data-partial="y">';
				html += '<td style="'+(td_style?td_style[0]:'')+' ; vertical-align:middle;" >' + fields[i].name + (fields[i].must ? '*' : '') +  ' </td>';

				// show field content
				html += '<td style="'+(td_style?td_style[1]:'')+'">';

				html += value[fields[i].id].substring(0, 12);
				if (value[fields[i].id].length > 12)
					html += '...';
				html += '</td></tr>';
				continue;
			}
			
		}
		if (show)
			html += '<tr  ><td colspan="2"><button class="btn btn-primary" onClick="show_detail(this)">檢視細節</button></td></tr>';
		html += '</table>';
		form_data = form.data;
		form_data['name'] = form.name;
		if (write)
			html += '<button class="btn btn-primary" onClick="check_upload(\''+hide+'\' '+(record_id?', \''+record_id+ '\'':'')+' )">'+(value?'確定修改':'確定送出')+'</button>';
		if (del)
			html += '<button class="btn btn-primary" onClick="delete_field(\''+form.name+'\', \''+record_id+'\')" >刪除</button>';
		return html;
	}
	
	// show all valid records in the form.data.values
	for (var record_id in form.data.values) {
		var value = form.data.values[record_id];
		html += c_table(fields, value, record_id);
	}

	if (Object.keys(form.data.values).length === 0)
		html += c_table(fields);	

	
	return html;
}

function default_upload_v4(field, record_id, values) {
	var para = {form_name: field.name, values: values};
	if (record_id)
		para.record_id = record_id;
	SR.API.UPDATE_FIELD(para, function (err, result) {
		if (err) {
			console.error(err);
			alert(err);
			return;
		}
		console.log('success');
		if (window.upload_callback) // check custom funciton
			upload_callback(result, values);
	});
}

// ------------------------------------------ View 用 End ------------------------------------------------

// ------------------------------------------ List 用 Start ------------------------------------------------

function flexform_show_table_v4(flexform_values, pa) {
	var para = pa || {};
	// para.colStyle = [{ cssKey: cssValue }]
	para.colStyle = para.colStyle || [];
	// para.hideTitle = true || false
	para.hideTitle = para.hideTitle || false;
	para.selected_columns = para.selected_columns || false;
	para.selected_rows = para.selected_rows || false;
	// para.tableName = ''
	para.tableName = para.tableName || null;
	para.show_lines = para.show_lines || null;
	form_name = flexform_values.form_name || null;

	var html = '';
	var table_para = {};
	table_para.data_num = flexform_values.data.length;
	html += `<table id="flexform-table${flexform_table_num}"  border="1" ;
			class="customTable ${para.selected_rows || para.selected_columns ? 'table-selected' : ''}" ;
			style="table-layout: fixed;" ${(para.tableName ? + 'data-tablename="' + para.tableName + '"' : '' ) } 
			data-flexform_table_num="${flexform_table_num}"
			${form_name ? 'data-form_name="'+form_name+'"' : '' }
			${para.selected_columns ? 'data-selected_columns="true"' : '' }
			${para.selected_rows ? 'data-selected_rows="true"' : '' }>`;
	
	// field
	if (!!para.hideTitle) {
		html += '<tr style="display: none;"></tr><tr style="display: none;">';
	} else {
		html += '<tr>';
	}
	var count = 0;
	var width = 1.0 / flexform_values.field.length * 100;
	// console.log('寬度');
	// console.log(width);
	for (var i in flexform_values.field) {
		var content = '';
		// WAIT FIX: switch_sort_up_down只witch顯示的內容，儲存的data都沒有被修改
		content += '<li  class="drop-down-menu" onClick="javascript:click_field_name(\''+count+'\', this)" value="-1">';
		if (flexform_values.field[i].value)
			content += flexform_values.field[i].value;
		else
			content += flexform_values.field[i].key;
		content += '  <i class="" aria-hidden="true"></i>';
		content += '</li>';

		let style = '';
		if (para.colStyle[i]) {
			if (!para.colStyle[i].width) {
				para.colStyle[i].width = width;
			}

			style = obj2inlineCSS(para.colStyle[i]);
		} else {
			style = 'width: ' + width + '%';
		}

		html += '<th style="' + style+ '" class="text-center" '+(flexform_values.field[i].id !== undefined ? 'data-fieldname="' + flexform_values.field[i].id + '"': '')+'>' + content + '</th>';
		count ++;
	}
	html += '</tr>';
	
	for (var i in flexform_values.data) {
		html += `<tr `;
		if (para.show_lines) {
			html += ` ${i>show_lines-1?'style="display: none;"':''} `;
		}
		html += `data-recordid="${flexform_values.data[i].record_id}"
				onclick="selected_rows(this)"
				>`;

		for (var j in flexform_values.field) 
			html += '<td style="' + obj2inlineCSS(para.colStyle[j]) + '">' + (typeof(flexform_values.data[i][ flexform_values.field[j].key ])==='undefined'?'':flexform_values.data[i][ flexform_values.field[j].key ]) + '</td>';
		html += '</tr>';
	}
	
	
	html += '</table>';
	if (para.show_lines) {
		table_para.show_lines = para.show_lines
		html += '<button id="btnShowMore" onclick="flexform_table_show_more(this, \''+flexform_table_num+'\')">Show more '+(flexform_values.data.length - para.show_lines - 1)+' row</button>';
	}
	flexform_table_num++;
	flexform_tables_para.push(table_para);
	return html;
} // function flexform_show_table()

function hasClass(obj, cls) {  
    return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));  
}  

function addClass(obj, cls) {  
    if (!this.hasClass(obj, cls)) obj.className += " " + cls;  
}  
  
function removeClass(obj, cls) {  
    if (hasClass(obj, cls)) {  
        var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');  
        obj.className = obj.className.replace(reg, ' ');  
    }  
}  

function click_field_name(cell_num, obj) {
	const f_table = obj.parentNode.parentNode.parentNode.parentNode;
	const table_num = f_table.dataset.flexform_table_num;
	const [selected_columns, selected_rows] = [f_table.dataset.selected_columns, f_table.dataset.selected_rows];
	if (selected_columns !== undefined) {
		const th = obj.parentNode;
		if (hasClass(th, 'bg-success')) {
			removeClass(th, 'bg-success');
		} else {
			addClass(th, 'bg-success');
		}
	} else {
		for (var i = 0 ; i < f_table.rows[0].cells.length ; i++) {
			// f_table.rows[0].cells[i].children[0].value = -1;
			if (f_table.rows[0].cells[i].children[0] !== obj)
				f_table.rows[0].cells[i].children[0].value = -1;
			f_table.rows[0].cells[i].children[0].children[0].className = '';
		}
		
		if (obj.value === -1)
			obj.value = 0
		if (obj.value ===1) {
			obj.value = 0;
			obj.children[0].className = 'fa fa-caret-square-o-up';
			flexform_sort_table(table_num, cell_num, 'SmallToBig');
		} else {
			obj.value = 1;
			obj.children[0].className = 'fa fa-caret-square-o-down';
			flexform_sort_table(table_num, cell_num, 'BigToSmall');
		}
	}
}

function selected_rows(tr) {
	if (hasClass(tr, 'table-success')) {
		removeClass(tr, 'table-success');
		removeClass(tr, 'text-dark');
	} else {
		addClass(tr, 'table-success');
		addClass(tr, 'text-dark');
	}
}

function get_selected_rows() {
	let results = [];
	let tables = $('table');
	for (let i = 0 ; i < tables.length ; i++) {
		let table = tables[i];
		if (table.dataset.selected_rows !== undefined) {
			let result = {
				id: table.id,
				form: '',
				selected_rows: []
			};
			if (table.dataset.form_name !== undefined) {
				result.form = table.dataset.form_name;
			}
			let trs = table.childNodes[0].childNodes;
			for (let tr of trs) {
				if (hasClass(tr, 'table-success')) {
					if (tr.dataset.recordid !== undefined) {
						result.selected_rows.push(tr.dataset.recordid);
					}
				}
			}
			results.push(result);
		}
	}
	return results;
}

function get_selected_columns() {
	let results = [];
	let tables = $('table');
	for (let i = 0 ; i < tables.length ; i++) {
		let table = tables[i];
		
		if (table.dataset.selected_columns !== undefined) {
			let result = {
				id: table.id,
				form: '',
				selected_columns: []
			};
			if (table.dataset.form_name !== undefined) {
				result.form = table.dataset.form_name;
			}
			
			let ths = table.childNodes[0].childNodes[0].childNodes;
			for (let th of ths) {
				if (hasClass(th, 'bg-success')) {
					if (th.dataset.fieldname !== undefined) {
						result.selected_columns.push(th.dataset.fieldname);
					}
				}
			}
			results.push(result);
		}
	}
	return results;
}
// ------------------------------------------ List 用 End ------------------------------------------------