

$(function(){
  
/* Attach login handler */
$('.contactUs').on('click', function(e){
	
	e.preventDefault();
	
	/* Popup an alert with the form */
	$.jAlert({
		'title': '<i class="fa fa-envelope"></i> Contact Us',
		'content': '<form><label>Name</label><input class="required" type="text" name="name"><label>Email</label><input class="required" type="email" name="email"><label>Message</label><textarea class="required" name="msg"></textarea></form>',
    'theme': 'blue',
    'autofocus': 'input[name="name"]',
    'btns':
     [
       {
        'text': 'Send',
        'theme': 'green',
        'closeAlert': false,
        'onClick': function(e, btn){
          var alert = btn.parents('.jAlert'),
              form = alert.find('form'),
              error = false;
          
          form.find('.required').each(function(){
            var field = $(this),
                val = field.val();
            
            if( typeof val == 'undefined' || val == '' )
            {
              error = field.prev('label').text() + ' is required.';
            }
          }); 
          
          if( error )
          {
            errorAlert(error);
            return false;
          }
          
          //send form.serialize() to server and send message
          
          successAlert('Successfully sent!');
          alert.closeAlert();
        }
      },
      {
        'text': 'Cancel'
      }
    ],
    'onOpen': function(alert){
      alert.find('form').on('submit', function(e){
          e.preventDefault();
          return false;
      });
    }
	});	
});
  	
// test button
//$('.contactUs').click();
});


// ref: http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function get_img_num() {
	var imgs = document.getElementsByClassName('imgDiv');
	return imgs.length;
}

var create_img_dev = function(dom_id, img){
	var html = '';
	if (img.length === 0)
		return html;
	html += '<div class="imgDiv" id="'+img+'">';
	html += '<img width="250" height="250" src="/web/images/'+img+'"  onclick="open_new_tab(\'/web/images/'+img+'\')" />';
	html += '<i class="fa fa-times" aria-hidden="true" onclick="remove_img( \''+dom_id+'\' ,\''+img+'\')"></i>';
	html += '</div>';
	return html;
}

var open_new_tab = function(url){
	window.open(
	  url,
	  '_blank' // <- This is what makes it open in a new window.
	);
}

var remove_img = function(dom_id, id) {
	document.getElementById(id).remove();
	var files = document.getElementById(dom_id).value.split(",");
	files.splice(files.indexOf(id), 1);
	document.getElementById(dom_id).value = files;
	get_img_num();
}


var add_img = function(dom_id, img) {
	document.getElementById('show_upload_img').innerHTML += create_img_dev(dom_id , img);
}

var show_imgs = function(imgs) {
	var html = '';
	var imgs = imgs.split(",");
	console.log('show imgs');
	console.log(imgs);
	for(var i in imgs) {
		if (imgs[i].length === 0)
			continue;
		html += '<img width="250" src="/web/images/'+imgs[i]+'" />';
	}
	return html;
	// show_upload_img
}

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

function read_txt(file_type_id, button_id, onDone, dom_id) {
	console.log('file_type_id = ' + file_type_id) ;
	document.getElementById(button_id).addEventListener("click", function() {
		var reader = new FileReader();
		reader.addEventListener('load', function() {
			if (dom_id)
				return onDone(null, this.result, dom_id);
			else
				return onDone(null, this.result);
		});
		var encode = document.getElementById(dom_id+'-encode').value;
		// console.log('最後的encode = ' + encode);
		reader.readAsText(document.querySelector('#' + file_type_id).files[0], encode);
		// if (document.getElementById('rf-encoding').value === 'big5')
		// 	reader.readAsText(document.querySelector('#' + file_type_id).files[0], 'big5');
		// else
		// 	reader.readAsText(document.querySelector('#' + file_type_id).files[0]);
		
	});
}

function uploadFile(num, dom_id, onDone, accepted_extensions, upload_id) {
	var upload_url = (window.location.protocol + '//' + window.location.hostname + ':' + basePort);
	if (upload_id) {
		var formData = new FormData();
		formData.append('toPreserveFileName', "false");
		formData.append('firstOption', "file");
		formData.append('upload', document.getElementById(upload_id).files[0]);
	} else
		var formData = new FormData($("#frmUploadFile")[0]);
	console.log('formData = ');
	console.log(formData);
	var filename;
	// console.log('傳入的 ' + dom_id);
	console.log('upload_id = ' + upload_id);
	if (upload_id) {
		var fullPath = document.getElementById(upload_id).value;
		var upload_num = $("#"+upload_id)[0].files.length;
	} else {
		var fullPath = document.getElementById('upload_file').value;
		var upload_num = $("#upload_file")[0].files.length;
	}
	if ((!accepted_extensions?get_img_num(): 0) + upload_num > num ){
		alert('Over the limit number of files. Limit numbers is ' + num + '!');
		return;
	}
	
	if (!accepted_extensions)
		var check = false;
	else
		var check = true;
	if (accepted_extensions)
		accepted_extensions = accepted_extensions.split(",");
	
	if (accepted_extensions)
		console.log(typeof(accepted_extensions) + '  ' + accepted_extensions);
	// set default accepted file extensions
	if (accepted_extensions instanceof Array === false) {
		accepted_extensions = ['jpg', 'png', 'gif'];
	}
	console.log('fullPath = ' + fullPath);
	if (fullPath) {
		var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
		filename = fullPath.substring(startIndex);
		if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
			filename = filename.substring(1);
		}
		console.log(filename);
	}
	console.log('filename = ' + filename);
	if (!filename || typeof(filename) !== 'string' || filename.length < 6) {
		console.log('test invalid');
		console.log(filename);
		alert("invalid filename");
		return;
	}

	var arr = filename.split(".");
	var filename_extension = arr[arr.length-1].toLowerCase();
	
	if (accepted_extensions.indexOf(filename_extension) === (-1)) {
		alert("allowed files types are: " + accepted_extensions);
		return;
	}
	
	console.log(upload_url + '/upload');

	$.ajax({
		url: upload_url + '/upload',
		type: 'POST',
		data: formData,
//		async: false,
//		cache: false,
		contentType: false,
		processData: false,
		success: function (data) {
			
			// console.log('數量');
			// console.log(data.upload.length);
			var filenames = [];
			for (var i in data.upload)
				filenames.push(data.upload[i].name);
			if (data.message === 'success') {
				$("#spanMessage").html("Upload success!");
				// console.log('upload success, data:');
				// console.log(data.upload);
				
				if (check) {
					SR.API.IS_UTF8({filename: filename}, function (err2, result) {
						if (err2) {
							console.log(err2)
							return;
						}
						if (typeof(result)==='undefined'){
							console.log('文件不存在');
							return;
						}
						// console.log(result);
						if(result)
							document.getElementById(dom_id+'-encode').value = 'utf-8';
						else
							document.getElementById(dom_id+'-encode').value = 'big5';
						
						var reader = new FileReader();
						reader.addEventListener('load', function() {
							document.getElementById(dom_id).value = this.result;
							if (dom_id)
								return onDone(null, this.result, dom_id);
							else
								return onDone(null, this.result);
						});
						if (result)
							var encode = 'utf-8';
						else
							var encode = 'big5';
						
						console.log('encode = ' + encode);
						
						reader.readAsText(document.querySelector('#inputTxt-' + dom_id).files[0], encode);
						
						
						return onDone(null, filename);
					});
				} else {
					SR.API.UPLOAD_IMAGE({
						filename: filenames,

					}, function (err, result) {
						if (err) {
							console.error(err);
							return alert(err);
						}

						return onDone(null, result, dom_id);
						//window.location.reload();
					});
				}
			} else {
				$("#spanMessage").html("Upload failed");
				onDone('upload failed');
				return;
			}
		},
		error: function() {
			$("#spanMessage").html("failure to connect to server");
		}
	});
} // function uploadFile()

var flexform_table_num = 0;
var flexform_tables_para = [];

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
	
	console.log('arr_data:');
	console.log(arr_data);
	
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
		if (typeof para.required_fields === 'object') {
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

function flexform_to_flexform_table(form) {
	var flexform_table = {};
	flexform_table.field = [];
	flexform_table.data = [];
	for (var i in form.data.fields)
		flexform_table.field.push({key: form.data.fields[i].id, value: form.data.fields[i].name});
	for (var record_id in form.data.values) {
		var temp_data = {};
		for (var i in flexform_table.field) 
			temp_data[flexform_table.field[i].key] = form.data.values[record_id][flexform_table.field[i].key];
		temp_data['record_id'] = record_id;
		flexform_table.data.push(temp_data);
	}
	return flexform_table;
}

function flexform_show_table(flexform_values, show_lines) {
	var html = '';
	var table_para = {};
	table_para.data_num = flexform_values.data.length;
	html += '<table id="flexform-table'+flexform_table_num+'"  border="1" class="customTable">';
	// field
	html += '<tr>';
	// for (var i in flexform_values.field) 
	// 	html += '<th  onClick="javascript:flexform_sort_table(\''+flexform_table_num+'\',\''+i+'\')" >' + flexform_values.field[i].value + '</th>';
	for (var i in flexform_values.field) {
		var content = '';
		content += '<li  class="drop-down-menu">';
		content += flexform_values.field[i].value;
		content += '  <i class="fa fa-caret-square-o-down" aria-hidden="true"></i>';
		content += '<ul>'
		content += '<li onClick="javascript:flexform_sort_table(\''+flexform_table_num+'\',\''+i+'\', \'BigToSmall\')">由大到小排序</li>'
		content += '<li onClick="javascript:flexform_sort_table(\''+flexform_table_num+'\',\''+i+'\', \'SmallToBig\')">由小到大排序</li>'
		content += '</ul>'
		content += '</li>';
		html += '<th>' + content + '</th>';
	}
	html += '</tr>';
	
	for (var i in flexform_values.data) {
		if (show_lines)
			html += '<tr '+(i>show_lines-1?'style="display: none;"':'')+'>';
		for (var j in flexform_values.field) 
			html += '<td>' + (typeof(flexform_values.data[i][ flexform_values.field[j].key ])==='undefined'?'':flexform_values.data[i][ flexform_values.field[j].key ]) + '</td>';
		html += '</tr>';
	}
	
	
	html += '</table>';
	if (show_lines) {
		table_para.show_lines = show_lines
		html += '<button onclick="flexform_table_show_more(this, \''+flexform_table_num+'\')">Show more '+(flexform_values.data.length - show_lines - 1)+' row</button>';
	}
	flexform_table_num++;
	flexform_tables_para.push(table_para);
	return html;
} // function flexform_show_table()

function flexform_table_show_more(btn, table_num) {
	var f_table = document.getElementById('flexform-table' + table_num);
	var show_lines = flexform_tables_para[parseInt(table_num)].show_lines;
	if (btn.innerHTML !== 'Show less') {
		btn.innerHTML = 'Show less';
		for ( var i = show_lines+1 ; i < f_table.rows.length ; i++)
			f_table.rows[i].style.display = '';
	} else {
		btn.innerHTML = 'Show more '+( flexform_tables_para[parseInt(table_num)].data_num - flexform_tables_para[parseInt(table_num)].show_lines - 1)+' row';
		for ( var i = show_lines+1 ; i < f_table.rows.length ; i++)
			f_table.rows[i].style.display = 'none';
	}
	
} // flexform_table_show_more()

function flexform_sort_table(table_num, cell_num, type) {
	var f_table = document.getElementById('flexform-table' + table_num);
	cell_num = parseInt(cell_num);
	var is_num = true;
	for (var i = 1 ; i < f_table.rows.length ; i++)
		if(isNaN(f_table.rows[i].cells[cell_num].innerHTML))
			is_num = false;

	for (var i = 1 ; i < f_table.rows.length ; i++)
		for (var j = i+1 ; j < f_table.rows.length ; j++) {
			if (type === 'SmallToBig') {
				if (is_num && parseInt(f_table.rows[j].cells[cell_num].innerHTML) < parseInt(f_table.rows[i].cells[cell_num].innerHTML) ) 
					flexform_change_row(f_table, i, j);
				else if (!is_num && f_table.rows[j].cells[cell_num].innerHTML < f_table.rows[i].cells[cell_num].innerHTML)
					flexform_change_row(f_table, i, j);	
			} else {
				if (is_num && parseInt(f_table.rows[j].cells[cell_num].innerHTML) > parseInt(f_table.rows[i].cells[cell_num].innerHTML) ) 
					flexform_change_row(f_table, i, j);
				else if (!is_num && f_table.rows[j].cells[cell_num].innerHTML > f_table.rows[i].cells[cell_num].innerHTML)
					flexform_change_row(f_table, i, j);	
			}
		}
			
	// console.log( document.getElementById('flexform-table' + flexform_table_num).rows[1].cells[0].innerHTML);
} // flexform_sort_table()

function flexform_change_row(f_table, i, j) {
	for ( var k = 0 ; k < f_table.rows[j].cells.length ; k++ ) {
		var temp = f_table.rows[j].cells[k].innerHTML;
		f_table.rows[j].cells[k].innerHTML = f_table.rows[i].cells[k].innerHTML;
		f_table.rows[i].cells[k].innerHTML = temp;
	}
} // flexform_change_row()

var create_table = function(form, hide, write) {
	console.log('print form');
	console.log(form);
	var html = '';
	html += '<table border="1" class="customTable">';
	var fields = form.data.fields;
	function c_table(fields, value) {
		var html = '';
		for (var i in fields) {
			if (!fields[i].show) continue;
			if (hide.indexOf(fields[i].id) !== -1) 
				continue;
			html += '<tr>';
			html += '<td>' + fields[i].name + '</td>';
			html += '<td>';
			if (fields[i].type === 'upload') 
				;
			else if (fields[i].type === 'textarea') {
				if (write){
					html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' role="form" id="frmUploadTxt">';
					html += '<input type="hidden" id="'+fields[i].id+'-encode" value="">';
					html += '<input type="file" id="inputTxt-'+fields[i].id+'">';
					html += '<button id="txtBtn-'+textarea_id.length+'" onClick="uploadFile( \'1\' , \''+fields[i].id+'\', onTxtUploaded, \''+['txt']+'\', \'inputTxt-'+fields[i].id+'\')">上傳文字檔</button>';
					html += '</form>';
					// html += '<select id="rf-encoding">';
					// html += '<option value="big5">Big-5</option>';
					// html += '<option value="utf8">UTF-8</option>';
					// html += '</select>';
					
					html += '<br>';
					textarea_id.push(fields[i].id);
					html += '<textarea rows="3" cols="20" id="'+fields[i].id+'">';
				} else{
					html += '<textarea rows="3" cols="20" readonly="readonly">';
				}
				// html += '<textarea rows="3" cols="20" ' + (write?'id="'+fields[i].id+'"':'readonly="readonly"' )+ '>';
			}
			if (write) {
				if (fields[i].type === 'upload') {
					var image_id = '<%=UTIL.createToken()%>';
					if (fields[i].num)
						var num = fields[i].num;
					else
						var num = 5;
					
					html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' role="form" id="frmUploadFile">';
					html += '<input type="hidden" name="toPreserveFileName" value="true" checked>';
					html += '<input type="file" name="upload" multiple="multiple" id="upload_file">';
					html += '<button class="btn btn-primary" onClick="uploadFile( \''+num+'\' , \''+fields[i].id+'\', onPhotoUploaded)">Upload</button>';
					html += '<input type="hidden" value="" id="' + fields[i].id + '">';
					
					html += '<div id="show_upload_img"></div>';
					html += '</form>';
					// html += '<div id="uploaded_photo"><img id="show_image" width="250" src="")" ></div>'
				} else if (fields[i].type === 'date') {
					html += '<input type="text" value="" id="'+fields[i].id+'">';
					date_pickers.push(fields[i].id);
					
				} else if (fields[i].type === 'autocomplete') {
					html += '<input type="text" id="' + fields[i].id + '" >';
					$( function() {
						var key_id = fields[i].id;
						SR.API.QUERY_FORM({name: form.name}, function (err, r_form) {
							if (err) {
								console.log(err);	
							}
							var ans = [];
							function haveSame(arr, str){
								for (var i in arr)
									if (arr[i] === str)
										return true;
								return false;
							}
							for (var r_id in r_form.data.values)
								if (!haveSame(ans, r_form.data.values[r_id][key_id]))
									ans.push(r_form.data.values[r_id][key_id]);
							$( "#" + key_id ).autocomplete({
							  source: ans
							});
						});	
					});
				} else
					html += (fields[i].type !== 'textarea'?'<input type="text" id="'+fields[i].id+'">':'');
			} else {
				if (fields[i].type === 'upload') {
					html += '<div id="uploaded_photo">';
					html += show_imgs(value[fields[i].id]);
					html += '</div>';
				} else
					html += value[fields[i].id];
			}
			if (fields[i].type === 'textarea') html += '</textarea>';
			
			
			
			html += '</td>'
			html += '</tr>';
		} 
			
		return html;
	}
	if (write)
		html += c_table(fields);
	else {
		for (var record_id in form.data.values) {
			var value = form.data.values[record_id];
			html += c_table(fields, value);
		}
	}
	html += '</table>'
	if (write)
		html += '<button class="btn btn-primary" onClick="upload()">確定送出</button>';
	return html;
}

function upload_table2(form_name, fields, onDone) {
	
	var values = {};
	for ( var i in fields) 
		if (document.getElementById(fields[i].id))
			values[fields[i].id] = document.getElementById(fields[i].id).value;
	
	values.p_record_id = Object.keys(form.data.values)[0];
	values.account = '<%=login.account%>';
	values.class_id = class_id;
	var arg = {
		form_name: form_name,
		values: values
	};

	SR.API.UPDATE_FIELD(arg, function (err, result) {
		if (err)
			return onDone(err );
		return onDone(null);
	});
	
}

//
// Excel Upload
//

// parameters for excel upload
/* sample:
	do_upload_excel({
		id: 				0, 
		hint: 				'上傳 Excel 匯入資料，需有 "VOC"、"VOC分類-1"、"VOC分類-2"、"VOC分類-3" 等欄位',
		required_fields: 	['VOC', 'VOC分類-1'],
		import_fields:		['VOC', 'VOC分類-1', 'VOC分類-2', 'VOC分類-3']
	});
*/
var l_excel_upload_para = {};

// imported data
var l_xlsx_data;

function do_upload_excel(para) {
	document.getElementById('upload_excel_area').innerHTML = get_upload_excel(para);
}

function get_upload_excel(para) {
	
	if (typeof para === 'object')
		l_excel_upload_para = para;
	else 
		l_excel_upload_para.id = para;
	
	console.log('para');
	console.log(l_excel_upload_para);
	
	var id = l_excel_upload_para.id;
	var hint = l_excel_upload_para.hint;
	
	var html = '';	
	if (typeof hint === 'string')
		html += '<p>' + hint + '</p>';
	html += '<input type="file" id="uploader" onchange="upload_excel(\'' + id + '\')">';
	// html += '<select id="rf-encoding-excel">';
	// html += '<option value="big5">Big-5</option>';
	// html += '<option value="utf8">UTF-8</option>';
	// html += '</select>';
	html += '<div id="show_table"> </div>';
	return html;
}

function upload_excel(upload_id) {
	console.log('call upload_excel');
	
	var f = document.getElementById('uploader');
	console.log(f.files[0]);
	if (f.files && f.files[0]) {
		var file = f.files[0];
		var fileType = file['type'];
		
		var arr = file['name'].split('.');
		var fileExt = arr[arr.length-1].toLowerCase();
			
		// csv
		// application/vnd.ms-excel
		console.log('fileType: ' + fileType);
		console.log('fileExt: ' + fileExt);
		
		//var csvType = ["application/vnd.ms-excel"];
		//var validTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
		var validExtensions = ['csv', 'xls', 'xlsx'];
		
		if ($.inArray(fileExt, validExtensions) < 0) {
			alert('unsupported file type: ' + fileExt);
			return;
		}
				
		var upload_url = (window.location.protocol + '//' + window.location.hostname + ':' + basePort);
		var formData= new FormData();
		formData.append('toPreserveFileName', "false");
		formData.append('firstOption', "file");
		formData.append('upload', file);

		$.ajax({
			url: upload_url + '/upload',
			type: 'POST',
			data: formData,
			async: false,
			cache: false,
			contentType: false,
			processData: false,
			success: function (data) {
				console.log('upload success!');
				console.log(data);
				var filename = data.upload[0].name;

				console.log('filename: ' + filename + ' fileType: ' + fileType + ' fileExt: ' + fileExt);

				// perform file conversion first
				SR.API.IS_UTF8({
					filename:		filename,
				}, function (err, is_utf8) {
					if (err) {
						return console.error(err);
					}
					console.log('isUTF8: ' + is_utf8);
					
					var reader = new FileReader();
					
					reader.addEventListener('load', function () {
						
						// after conversion
						//if (fileType !== 'application/vnd.ms-excel'){
						if (fileExt === 'csv') {
							// for CSV text
							var data = CSVToArray(this.result);
							if (data[data.length-1] == "")
								data.splice(data.length-1, 1);
							return excel_done([{data: data}], upload_id, f);
						} else {
							// for excel files
							SR.API.READ_XLSX_DATA({
								filename:		filename,
							}, function (err, data) {
								if (err) {
									return console.error(err);							
								}

								console.log(data);
								return excel_done(data, upload_id, f);
							});
						};						
					});

					console.log('to read:');
					console.dir(f.files[0]);

					if (!is_utf8)
						reader.readAsText(f.files[0], 'big5');
					else
						reader.readAsText(f.files[0]);
				});
			},
			error: function (jqXHR) {
				console.log(jqXHR);
			}
		});
	}
}

function excel_done(data, id, f, warn_empty, key_field){
	// 只取限制的欄位
	var limit = l_excel_upload_para.import_fields;
	var arr_data = data[0].data;
	
	console.log(arr_data);
	console.log('how many rows starts: ' + arr_data.length);
	
	// 偵測是否有符合
	for (var i=0; i < arr_data.length; i++){
		var match_num = 0;
		console.log('src: ' + arr_data[i] + ' fields: ' + limit);
		
		for (var j in limit)
			if (has_str(arr_data[i], limit[j])) 
				match_num++;
		
		//console.log('match: ' + match_num + ' limit.length: ' + limit.length);
		if (match_num === limit.length) {
			console.log('total match found!')
			console.log(arr_data[i]);
			break;
		}
	}
	
	console.log('which row found: ' + i); 
	// check if did not find field row
	if (i === arr_data.length) {
		var err_message = 'field row cannot be found! ' + limit;
		console.error(err_message);
		alert(err_message);
		return;
	}

	// remove irrelevant top rows
	arr_data = arr_data.slice(i);
	//console.log(arr_data);
	
	// remove empty bottom rows
	for (var i=0; i < arr_data.length - 1; i++) {
		if (!arr_data[i]) {
			arr_data = arr_data.slice(0, i);
			break;
		}
	}
	//for (var i = arr_data.length - 1; i >= 0 ; i--)
	//	if (!arr_data[i])
	//		arr_data = arr_data.slice(parseInt(i)+1);
	
	// convert to html	
	l_xlsx_data = array_to_flexform_table(arr_data, l_excel_upload_para);
	
	for (var i = l_xlsx_data.field.length - 1 ; i >= 0 ; i -- ) {

		var have = false;
		for (var j in limit)
			if (l_xlsx_data.field[i].value === limit[j])
				have = true;
		if (!have) 
			delete l_xlsx_data.field[i];
	}

	document.getElementById('show_table').innerHTML = flexform_show_table(l_xlsx_data);
	
	// check for data correctness
	var err_message = '';
	
	// check for empty fields and warn
	for (var i in l_xlsx_data.field) {
		for (var j in l_xlsx_data.data) {
			if (!l_xlsx_data.data[j][l_xlsx_data.field[i].key] && warn_empty === true) {
				err_message += 'Record #' + (parseInt(j)+1) + ' has empty field [' + l_xlsx_data.field[i].key + ']\n';
			}			
		}		
	} 

	// check for redundent keys
	if (typeof key_field === 'string') {
		for (var j in l_xlsx_data.data) {
			for (var i in l_xlsx_data.data) {
				if (j === i) 
					continue;

				if (l_xlsx_data.data[i][key_field] === l_xlsx_data.data[j][key_field]) {
					err_message += '[key redundent] ' + key_field + ' record #' + (parseInt(j)+1) + ' and #' + (parseInt(i)+1) + '\n';
					break;
				}
			}
		}		
	}
		
	f.outerHTML=f.outerHTML.replace(/value=\w/g,'');
	
	if (err_message !== '')
		alert(err_message);
	else {
		document.getElementById('show_table').innerHTML += '<input type="button" value="Confirm Import" onclick="submit_excel_import(\''+ id +'\')">';
	}
}

function submit_excel_import(id) {
	if (typeof l_excel_upload_para.onConfirm === 'function') {
		l_excel_upload_para.onConfirm(l_xlsx_data, id);
	} else {
		console.error('no onConfirm callback provided when excel import is confirmed!');
	}
}

function has_str(arr, str){
	return (arr.indexOf(str) > (-1));
}

