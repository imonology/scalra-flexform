var upload_record_id = [];
var create_table_v3 = function (form, para) {
	var hide = para.hide;
	// console.log('hide = ');
	// console.log(hide)
	var write = para.write;
	var td_style = para.td_style;
	var show = para.show;
	var del = para.del;
	var lock = para.lock || [];
	var customized = para.customized;
	if (typeof(para.id_num) === 'undefined')
		var id_num = '';
	else
		var id_num = para.id_num;
	var hide = (hide ? hide : []);
	if (!td_style)
		td_style =  ['width:15%;','text-align:left;'];
	var html = '';
	
	var fields = form.data.fields;
	
	function check_lock(id, lock) {
		for(var i in lock){
			if (lock[i] === id)
				return true;
		}
		return false;
	}

	function c_table(fields, value, record_id) {
		if (!write&& !value)
			return '';
		var html = '';
		html += '<table border="1" class="customTable" style="margin:0">';
		if (record_id)
			upload_record_id.push(record_id);
		for (var i in fields) {

			var is_lock = check_lock(fields[i].id, lock);

			if (record_id) {
				var save_id = record_id + '-' + fields[i].id;
			} else
				var save_id = fields[i].id;
			save_id += id_num;
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

				html += '<td  '+(fields[i].type === 'print'? 'class="print"' : '')+' style="'+(td_style?td_style[0]:'')+' ; vertical-align:middle;" colspan="'+col_f+'">' + fields[i].name + (fields[i].must ? '' : '') +  ' </td>';
				// show field content
				html += '<td style="'+(td_style?td_style[1]:'')+'" colspan="'+col_v+'">';

				switch (fields[i].type) {
					// FIXME: should make 'upload' not just for pics but files in general
					case 'record':
						if (write && !is_lock) {
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
						if (write && !is_lock) {
							var image_id = '<%= UTIL.createToken() %>';

							// set upload item limit
							var num = (fields[i].num ? fields[i].num : 5);

							html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' role="form" id="frmUploadFile">';
							html += '<input type="hidden" name="toPreserveFileName" value="true" checked>';
							html += '<input type="file" name="upload" id="upload_file" multiple="multiple">';
							html += '<button class="btn btn-primary" onClick="uploadFile( \''+num+'\' , \''+save_id+'\', onPhotoUploaded, undefined, undefined, \''+form.name+'\', \''+fields[i].id+'\' )">Upload</button>';
							html += '<input type="hidden" value="'+save_value+'" id="' + save_id + '">';

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
							if (value[fields[i].id].length !== 0) {
								var data = JSON.parse( value[fields[i].id] );
								for (var i in data)
									html += show_imgs(data[i]);
							}
							html += '</div>';						
						}
						break;

					case 'textarea':
						if (write  && !is_lock) {
							html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' role="form" id="frmUploadTxt">';
							html += '<input type="hidden" id="'+save_id+'-encode" value="">';
							html += '<input type="file" id="inputTxt-'+save_id+'">';
							html += '<button id="txtBtn-'+textarea_id.length+'" onClick="uploadFile( \'1\' , \''+save_id+'\', onTxtUploaded, \''+['txt']+'\', \'inputTxt-'+save_id+'\')">上傳文字檔</button>';
							html += '</form>';					
							html += '<br>';
							textarea_id.push(save_id);
							html += '<textarea rows="3" cols="20" id="'+save_id+'">';
							html += save_value;
						} else {
							html += '<textarea rows="3" cols="20" readonly="readonly">';
							html += save_value;
						}
						html += '</textarea>';					
						break;

					case 'date':
						if (write && ! fields[i].default_value  && !is_lock) {
							html += '<input type="date" id="'+save_id+'" value="'+save_value+'" placeholder="年-月-日">';
							date_pickers.push(save_id);	
						} else {
							html += save_value;
						}
						break;

					case 'autocomplete': 
						if (write  && !is_lock) {
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
						if (write && !is_lock) {
							html += '<input type="text" class="tags" id="' + save_id +'" value="'+save_value+'">';
						} else {
							html += save_value;
						}
						break;
					case 'choice':
						if (write && !is_lock) {
							// console.log('fields[i] = ')
							// console.log(fields[i])
							if (typeof(fields[i].option) === 'object') 
								var options = fields[i].option;
							else if (typeof(fields[i].option) !== 'undefined')
								var options = fields[i].option.split(',');
							else
								var options = [];
							html += '<select id="'+ save_id + '">';
							for (var j in options) {
								html += '<option value="' ;
								if (Array.isArray(options))
									html += options[j];
								else 
									html += j;
								html += '" '+(save_value!==''&&options[j]===save_value?'selected="true"':'')+'  >' + options[j] + '</option>';
							}
							html += '</select>';
						} else {
							html += save_value;
						}
						break;
					case 'multichoice': 
						let selections;
						let showErr = err => (console.error(err))
						if (Array.isArray(fields[i].option)) {
							selections = fields[i].option;
							let name = fields[i].id;
							selections.forEach(selection => {
								if (!selection.label || !selection.value) {
									showErr("Option error: option should be like option: [{label: 'Nike', value: 'nike'}, {label: 'adidas', value: 'adidas'}]");
								} else {
									let chekcboxId = name + selection.value;
									let checked = save_value.indexOf(selection.value) > 0;
									html += '<div class="checkbox item">'
									html += '<input type="checkbox" name="' + save_id + '" id="' + chekcboxId + '" value="' + selection.value + '" ' + (checked ? 'checked' : '') + '>';
									html += '<label for="' + chekcboxId + '">' + selection.label + '</label>'
									html += '</div>'
								}
							})
						} else {
							showErr("params error: Missing option, should be like option: [{label: 'Nike', value: 'nike'},{label: 'adidas', value: 'adidas'}]");
						}
						break;
					case 'lock':
						if (write) {
							var lock_value = getParameterByName(fields[i].id);
							// console.log(fields[i].id)
							// console.log(lock_value)
							if (lock_value)
								var value_list = lock_value.split(',');
							else
								value_list = [];
							if (save_value)
								value_list = [save_value];
							html += '<select id="' + save_id + '">';
							var lock_show = getParameterByName(fields[i].id + '-show')
							if (lock_show)
								lock_show = lock_show.split(',');
							else
								lock_show = value_list;

							// var lock_show = lock_show.split(',');
							for (var j=0; j < value_list.length; j++) {	
								html += '<option value="' + value_list[j] + '" >' + lock_show[j] + '</option>';
							}
							html += '</select>';
						} else {

							html += save_value;
						}
						break;
					case 'password':
						if (write && !is_lock) {
							html += '<input type="password" id="' + save_id +'" value="'+save_value+'">';					
						} else {
							html += save_value;
						}
						break;
					case 'boolean':
						if (write && !is_lock) {
							html += `<input id=${save_id} type="checkbox" class="checkbox-billable" checked=${save_value} /><label> </label>`
						} else {
							html += save_value ? '是' : '否'
						}
						break;
					// case 'timestamp':
					// 	html += moment(save_value).format('YYYY-MM-DD HH:mm');
					// 	break;
					case 'print': // 單純印出
						break;
					case 'address':
						if (save_value === '') {
							var postal_code = '';
							var address = '';
						} else {
							var postal_code = save_value.postal_code;
							var address = save_value.address;
						}
						if (write && ! fields[i].default_value  && !is_lock) {
							// html += '<input type="text" id="' + save_id +'" value="'+save_value+'">';					
							html += '<input type="text" id="'+save_id+'_postal_code" style="float: left;width: 10%;margin-left: 9px;" placeholder="郵遞區號" value="'+postal_code+'">';
							html += '<input type="text" id="'+save_id+'_address" style="float: left;width: 85%;margin-left: 9px;" value="'+address+'">';
						} else {
							// 待修改

							html += save_value;
						}
						break;
					case 'radio':
						if (write && ! fields[i].default_value && !is_lock) {	
							if (typeof(fields[i].option) === 'object')
								var options = fields[i].option;
							else if (typeof(fields[i].option) !== 'undefined')
								var options = fields[i].option.split(',');
							for (var j in options) {
								html += '<label><input name="'+save_id+'" type="radio" value="'+options[j]+'" '+(save_value === options[j] ? 'checked' : '')+'>'+options[j]+'</label>';
							}

						} else {
							// 待修改
							html += save_value;
						}
						break;
					case 'null':
						html += save_value;
						break;
					default: // type = string or others
						if (write && ! fields[i].default_value && !is_lock) {
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
		// if (write)
		// 	html += '<button class="btn btn-primary" onClick="check_upload(\''+hide+'\' '+(record_id?', \''+record_id+ '\'':'')+' )">'+(value?'確定修改':'送出')+'</button>';
		// if (del)
		// 	html += '<button class="btn btn-primary" onClick="delete_field(\''+form.name+'\', \''+record_id+'\')" >刪除</button>';
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

function flexform_show_table_v3(flexform_values, pa) {
	// console.log('flexform_values = ');
	// console.log(flexform_values);
	
	var para = pa || {};
	// para.colStyle = [{ cssKey: cssValue }]
	para.colStyle = para.colStyle || [];
	// para.hideTitle = true || false
	para.hideTitle = para.hideTitle || false;
	// para.tableName = ''
	para.tableName = para.tableName || null;
	var hide = para.hide;
	var show = para.show;
	var page_entries = para.page_entries;
	var html = '';
	var table_para = {};
	table_para.data_num = flexform_values.data.length;
	html += '<table id="flexform-table' + flexform_table_num + '"  border="1" class="list_table" style="table-layout: fixed;" ' + (para.tableName ? + 'data-tablename="' + para.tableName + '"' : '' ) + '>';
	// html += `<table id="flexform-table${flexform_table_num}"  border="1" class="customTable" style="table-layout: fixed;" ${para.tableName ? `data-tablename="${para.tableName}"` : ''}>`;
	// field
	if (!!para.hideTitle) {
		html += '<tr style="display: none;"></tr><tr style="display: none;">';
	} else {
		html += '<tr>';
	}
	// for (var i in flexform_values.field) 
	// 	html += '<th  onClick="javascript:flexform_sort_table(\''+flexform_table_num+'\',\''+i+'\')" >' + flexform_values.field[i].value + '</th>';
	var count = 0;
	var width = 1.0 / flexform_values.field.length * 100;
	// console.log('寬度');
	// console.log(width);
	if ( typeof(show) !== 'undefined' ) { // 依照show重新排序顯示位置和顯示名稱
		var new_field = [];
		for (var i in show) {
			for (var j in flexform_values.field) {
				if (show[i].id === flexform_values.field[j].id) {
					flexform_values.field[j].value = show[i].name;
					new_field.push(flexform_values.field[j]);
				}
			}
		}
		flexform_values.field = new_field;
	}
	
	function check_continue(field) { // 檢查該欄位是否要顯示
		if (field.type === 'line' || field.type === 'print')
			return true;
		for (var j in hide) 
			if ( field.id === hide[j] ) 
				return true;
	}

	
	for (var i in flexform_values.field) {
		if ( check_continue(flexform_values.field[i]) ) 
			continue;
		var content = '';
		content += '<li  class="drop-down-menu" onClick="javascript:switch_sort_up_down(\''+flexform_table_num+'\',\''+count+'\', this)" value="-1">';
		if (flexform_values.field[i].value)
			content += flexform_values.field[i].value;
		else
			content += flexform_values.field[i].key;
		content += '  <i class="" aria-hidden="true"></i>';
		// content += '<ul>'
		// content += '<li onClick="javascript:flexform_sort_table(\''+flexform_table_num+'\',\''+count+'\', \'BigToSmall\')">由大到小排序</li>'
		// content += '<li onClick="javascript:flexform_sort_table(\''+flexform_table_num+'\',\''+count+'\', \'SmallToBig\')">由小到大排序</li>'
		// content += '</ul>'
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

		// html += `<th style="${style}" class="text-center">${content}</th>`;
		html += '<th style="' + style+ '" class="text-center">' + content + '</th>';
		count ++;
	}
	html += '</tr>';

	var page = page_entries.page;
	var entries = page_entries.entries;
	for (var i in flexform_values.data) {
		if (typeof(page_entries) !== 'undefined') {
			if (i < (page-1)*entries || i >= page*entries ) // 依照page和entires顯示指定頁面
				continue;
		}
		if (para.show_lines) {
			// html += `<tr ${i>show_lines-1?'style="display: none;"':''} data-recordid="${flexform_values.data[i].record_id}">`;
			html += '<tr ' + ( i>para.show_lines-1?'style="display: none;"':'') +  'data-recordid="' + flexform_values.data[i].record_id + '">';
		} else {
			// html += `<tr data-recordid="${flexform_values.data[i].record_id}">`;
			html += '<tr data-recordid="' + flexform_values.data[i].record_id + '">';
		}

		for (var j in flexform_values.field) {
			if ( check_continue(flexform_values.field[j]) )
				continue;
			html += '<td style="' + obj2inlineCSS(para.colStyle[j]) + '">' + (typeof(flexform_values.data[i][ flexform_values.field[j].key ])==='undefined'?'':flexform_values.data[i][ flexform_values.field[j].key ]) + '</td>';
		}
			// html += `<td style="${obj2inlineCSS(para.colStyle[j])}">` + (typeof(flexform_values.data[i][ flexform_values.field[j].key ])==='undefined'?'':flexform_values.data[i][ flexform_values.field[j].key ]) + '</td>';
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

// 如果有upload_record_id，則是修改，若沒有則是新增
function check_upload_v3() {

	// console.log('upload');
	// console.log(forms[use_page]);
	console.log('add_forms');
	console.log(add_forms)
	var hide = [];
	var err_message = '';
	var f_dom = undefined;
	var values = {};

	function check(result_field, para) {
		var add_num = para.add_num;
		var form_name = para.form_name;
		var default_value = para.default_value;
		var u_record_id = para.upload_record_id;

		var value = {};
		for (var i in result_field.fields) {
			var use_id = result_field.fields[i].id;
			var o_id = result_field.fields[i].id;
			if (typeof(add_num) !== 'undefined') 
				use_id += add_num;
			// 檢查必填欄位

			if (typeof(u_record_id)!== 'undefined' && u_record_id !== '')
				use_id = u_record_id + '-' + use_id;
			
			if (result_field.fields[i].type === 'address') {
				var address_id = use_id + '_address';
				var use_id = use_id+ '_postal_code';
			}
			// if (typeof(u_record_id)!== 'undefined')
			// 	dom_id = u_record_id + '-' + dom_id;
			// console.log('dom_id = ')
			// console.log(dom_id)

			var dom = document.getElementById(use_id);

			var is_hide = false;
			for (var t in hide) 
				if (hide[t] === result_field.fields[i].id) is_hide = true;
			if (is_hide)
				continue;

			if (!dom) {
				if (result_field.fields[i].type === 'radio') {
					console.log(use_id)
					if (!$("input[name="+use_id+"]:checked").val()) {
						if (result_field.fields[i].must === true && result_field.fields[i].show === true) {
							err_message += result_field.fields[i].name + ' 為必填欄位\n';
						}
					} else {
						
						value[o_id] = $("input[name="+use_id+"]:checked").val();
					}
					continue;
				}
				// get checkboxes' value to array
				else if (result_field.fields[i].type === 'multichoice') {
					let valuearray = [...document.querySelectorAll('input[name=' + use_id + ']:checked')].map((c) => c.value);
					value[o_id] = valuearray;
					continue;
				} else {
					continue;
				}
			}

			if (result_field.fields[i].must === true && result_field.fields[i].show === true) {
				// if (result_field.fields[i].type === 'address')
				// 	console.log('有一個address')
				// console.log(result_field.fields[i].type)
				if (!is_hide) {
					if (dom.value === '') {
						err_message += result_field.fields[i].name + ' 為必填欄位\n';
						// alert(result_field.fields[i].name + ' 為必填欄位');
						if (!f_dom)
							f_dom = dom;
							// dom.focus();
						// return;
					} else if (result_field.fields[i].type === 'address') {
						var dom2 = document.getElementById(address_id);
						if (dom2.value === ''){
							err_message += result_field.fields[i].name + ' 為必填欄位\n';
							if (!f_dom)
								f_dom = dom2;
						}
					}
				}
			}
			if (result_field.fields[i].show === true) {
				if (result_field.fields[i].type === 'address') {

					var dom2 = document.getElementById(address_id);
					if ( isNaN(dom.value) )
						err_message += result_field.fields[i].name + '的郵遞區號需為數字 \n';
					else if (dom.value.length !== 3 && dom.value.length !==0)
						err_message += '請輸入3碼的郵遞區號 \n';
					
					value[o_id] = {postal_code: dom.value, address: dom2.value};
				} else {
					value[o_id] = dom.value;
				}
			}
			if (result_field.fields[i].type === 'email' && dom.value !== '') {
				if (!l_validateEmail(dom.value)){
					err_message += result_field.fields[i].name + ' 格式錯誤，需為E-mail格式!\n';
					if (!f_dom)
						f_dom = dom;
				}
			} 
			if (result_field.fields[i].type === 'account' && dom.value !== '') {
				if (!l_validateAccount(dom.value)) {
					err_message += result_field.fields[i].name + ' 格式錯誤\n';
					if (!f_dom)
						f_dom = dom;
				}
			}

			
			// 檢查上傳數量
			if (result_field.fields[i].num) {
				var upload_id = dom.value.split(",");
				var use_num = upload_id.length -1;
				if (use_num > result_field.fields[i].num) {
					err_message += result_field.fields[i].name + ' 數量不可超過 ' + result_field.fields[i].num + ' 個!\n';
					// alert(result_field.fields[i].name + ' 數量不可超過 ' + result_field.fields[i].num + ' 個!');
					// return ;
				}
			}
		}
		
		if (typeof(default_value) !== 'undefined') 
			for (var id in default_value)
				value[id] = default_value[id];
		values[form_name].push(value);
	}
	var check_num = 0;
	for (var form_num in forms[use_page]) {
		var form = forms[use_page][form_num];
		values[form.name] = [];

		if (form.name === para[use_page].form_query.name)
			var default_value = para[use_page].default_value;
		else {
			for (var k in para[use_page].related_form) {
				if (form.name === para[use_page].related_form[k].form_query.name)
					var default_value = para[use_page].related_form[k].default_value;
			}
		}

		check(form.data, {form_name: form.name, default_value: default_value, upload_record_id: upload_record_id[check_num]});
		check_num++;

		if (form_num !== '0') {
			for (var add_num in add_forms[parseInt(form_num) -1]) {
				console.log('add_num = ' + add_num)
				check(form.data, {add_num: add_forms[parseInt(form_num) -1][add_num], form_name: form.name, default_value: default_value, upload_record_id: upload_record_id[check_num]});
				check_num++;
			}
		}
	}
	
	if (err_message.length !== 0) {
		alert(err_message);
		if (f_dom)
			f_dom.focus();
		return;
	}
	
	if (window.flexform_v3_before_upload) 
		flexform_v3_before_upload(values);
	else
		default_upload_v3(values);
}

function default_upload_v3(values) {
	console.log('uploading');
	console.log(values);
	var main_form = forms[use_page][0].name;
	console.log(main_form)
	var main_para = {form_name: main_form, values: values[main_form][0]};
	
	if (upload_record_id.length !== 0)
		main_para.record_id = upload_record_id[0];
	console.log('main_para')
	console.log(main_para);
	var all_result = {};
	SR.API.UPDATE_FIELD(main_para, function (err, result) {
		if (err) {
			console.error(err);
			alert(err);
			return;
		}
		all_result[main_para.form_name] = {};
		all_result[main_para.form_name][result.record_id] = main_para.values;
		var pointer_id = result.record_id;
		var total_p = [];
		var k = 1;
		for (var i in para[use_page].related_form){
			var form_name = para[use_page].related_form[i].form_query.name;
			var pointer = para[use_page].related_form[i].pointer;
			
			for (var j in values[form_name]){
				var p = {form_name: form_name, values: values[form_name][j] };
				if (upload_record_id.length > k) {
					if (upload_record_id[k] !== '')
						p.record_id = upload_record_id[k]
					k++;
				}
				p.values[pointer] = pointer_id;
				p.return_values = true;
				total_p.push(p);
			}
		}
		
		var max_num = total_p.length;
		var run_num = 0;
		if (max_num === 0)
			onDoneFunction(all_result);

		for (var i in total_p) {
			console.log(total_p[i]);
			SR.API.UPDATE_FIELD(total_p[i], function (err, result) {
				if (err) {
					console.error(err);
					alert(err);
					return;
				}
				if (!all_result[result.form_name])
					all_result[result.form_name] = {};
				all_result[result.form_name][result.record_id] = result.values;
				run_num++;
				if (run_num === max_num) {
					onDoneFunction(all_result);
				}
			});
		}

		function onDoneFunction(result) {
			if (window.flexform_v3_upload_onDone) {
				flexform_v3_upload_onDone(result);
			} else {
				alert('上傳成功');
				window.location.reload();
			}
		}
	});
}
