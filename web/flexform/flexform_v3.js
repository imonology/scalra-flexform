var create_table_v3 = function (form, para) {
	var hide = para.hide;
	var write = para.write;
	var td_style = para.td_style;
	var show = para.show;
	var del = para.del;
	var customized = para.customized;

	var hide = (hide ? hide : []);
	if (!td_style)
		td_style =  ['width:15%;','text-align:left;'];
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
	
				html += '<td  '+(fields[i].type === 'print'? 'class="print"' : '')+' style="'+(td_style?td_style[0]:'')+' ; vertical-align:middle;" colspan="'+col_f+'">' + fields[i].name + (fields[i].must ? '' : '') +  ' </td>';
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
						if (write ) {
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
						if (write && ! fields[i].default_value) {
							html += '<input type="text" id="'+save_id+'" value="'+save_value+'" placeholder="年-月-日">';
							date_pickers.push(save_id);	
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
							for (var j=0; j < options.length; j++) {

								html += '<option value="' + options[j] + '" '+(save_value!==''&&options[j]===save_value?'selected="true"':'')+'  >' + options[j] + '</option>';
							}
							html += '</select>';
						} else {
							html += save_value;
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
						if (write) {
							html += '<input type="password" id="' + save_id +'" value="'+save_value+'">';					
						} else {
							html += save_value;
						}
						break;
					case 'boolean':
						if (write) {
							html += `<input id=${save_id} type="checkbox" class="checkbox-billable" checked=${save_value} /><label> </label>`
						} else {
							html += save_value ? '是' : '否'
						}
						break;
					case 'timestamp':
						html += moment(save_value).format('YYYY-MM-DD HH:mm');
						break;
					case 'print': // 單純印出
						break;
					case 'address':
						if (write && ! fields[i].default_value) {
							// html += '<input type="text" id="' + save_id +'" value="'+save_value+'">';					
							html += '<input type="text" id="'+save_id+'_postal_code" style="float: left;width: 10%;margin-left: 9px;" placeholder="郵遞區號">';
							html += '<input type="text" id="'+save_id+'_address" style="float: left;width: 85%;margin-left: 9px;">';
						} else {
							// 待修改
							html += save_value;
						}
						break;
					case 'radio':
						if (write && ! fields[i].default_value) {	
							if (typeof(fields[i].option) === 'object')
								var options = fields[i].option;
							else if (typeof(fields[i].option) !== 'undefined')
								var options = fields[i].option.split(',');
							for (var j in options) {
								html += '<label><input name="'+save_id+'" type="radio" value="'+options[j]+'" >'+options[j]+'</label>';
							}

						} else {
							// 待修改
							html += save_value;
						}
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