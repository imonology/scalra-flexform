

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

function get_record_num() {
	var records = document.getElementsByClassName('recordDiv');
	return records.length;
}

var create_img_dev = function(dom_id, img){
	var html = '';
	if (img.length === 0)
		return html;
	html += '<div class="imgDiv" id="'+img+'">';
	html += '<img class="fix-img" src="/web/images/'+img+'"  onclick="open_new_tab(\'/web/images/'+img+'\')" />';
	html += '<i class="fa fa-times" aria-hidden="true" onclick="remove_img( \''+dom_id+'\' ,\''+img+'\')"></i>';
	html += '</div>';
	return html;
}

var create_record_dev = function(dom_id, record, original_name){
	var html = '';
	if (record.length === 0)
		return html;
	html += '<div class="recordDiv" id="'+record+'">';
	html += '<table><tr><td colspan="2">' + original_name + '</td></tr><tr><td>'
	html += '<audio src="/web/images/'+record+'" controls="controls"></audio>';
	html += '</td>';
	html += '<td><button onclick="remove_img( \''+dom_id+'\' ,\''+record+'\')">刪除</button></td>';
	html += '</tr></table>';
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

var add_record = function(dom_id, record, original_name) {
	document.getElementById('show_upload_record').innerHTML += create_record_dev(dom_id , record, original_name);
}


var show_imgs = function(imgs) {
	var html = '';
	var imgs = imgs.split(",");
	console.log('show imgs');
	console.log(imgs);

	for(var i in imgs) {
		if (imgs[i].length === 0)
			continue;
		html += '<div class="thumbnail-item">';
		html += '<a href="#"><img class="fix-img" src="/web/images/'+imgs[i]+'"  onclick="open_new_tab(\'/web/images/'+imgs[i]+'\')" /></a>';
		html += '<div class="tooltip">';
		html += '<img class="big-fix-img" src="/web/images/'+imgs[i]+'" alt=""/>';
		html += '<span class="overlay"></span>';
		html += '</div>';
		html += '</div>';
	}
	return html;
	// show_upload_img
}

var show_record = function(records) {
	var html = '';
	console.log(records);
	var records = records.split(",");
	console.log('show records');
	console.log(records);

	for(var i in records) {
		if (records[i].length === 0)
			continue;
		html += '<div >';

		html += '<audio src="/web/images/'+records[i]+'" controls="controls"></audio>';

		html += '</div>';
	}
	return html;
	// show_upload_img
}

var do_tooltip = function() {
	console.log('執行do_tooltip');
    $(document).ready(function () {   
           
        // Get all the thumbnail   
        $('div.thumbnail-item').mouseenter(function(e) {   
   
            // Calculate the position of the image tooltip   
            x = e.pageX - $(this).offset().left;   
            y = e.pageY - $(this).offset().top;   
   
            // Set the z-index of the current item,    
            // make sure it's greater than the rest of thumbnail items   
            // Set the position and display the image tooltip   
            $(this).css('z-index','15')  
            .children("div.tooltip")  
            .css({'top': y + 10,'left': x + 20,'display':'block'});  
              
        }).mousemove(function(e) {  
              
            // Calculate the position of the image tooltip            
            x = e.pageX - $(this).offset().left;  
            y = e.pageY - $(this).offset().top;  
              
            // This line causes the tooltip will follow the mouse pointer  
            $(this).children("div.tooltip").css({'top': y + 10,'left': x + 20});  
              
        }).mouseleave(function() {  
              
            // Reset the z-index and hide the image tooltip   
            $(this).css('z-index','1')   
            .children("div.tooltip")   
            .animate({"opacity": "hide"}, "fast");   
        });   
   
    }); 
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


var onPhotoUploaded = function (err, image_filenames, dom_id) {
	if (!err) {
		var files = document.getElementById(dom_id).value.split(",");
		document.getElementById(dom_id).value = image_filenames.concat(files);
		for (var i in image_filenames)
			add_img(dom_id , image_filenames[i]);
	}
}

var onRecordUploaded = function(err, record_filenames, dom_id, original_filenames) {
	if (!err) {
		console.log('已上傳錄音檔');
		var files = document.getElementById(dom_id).value.split(",");
		document.getElementById(dom_id).value = record_filenames.concat(files);
		console.log(record_filenames);
		for (var i in record_filenames)
			add_record(dom_id , record_filenames[i], original_filenames[i]);
	}
}

var onTxtUploaded  = function(err, fname){
	if (!err){

// 		SR.API.IS_UTF8({filename: fname}, function (err2, result) {
// 			if (err2) {
// 				console.log(err2)
// 				return;
// 			}
// 			if (typeof(result)==='undefined'){
// 				console.log('文件不存在');
// 				return;
// 			}
// 			console.log(result);
// 			console.log(fname + ' 上傳成功');
// 			console.log('success');
// 		});
	}
}



function uploadFile(num, dom_id, onDone, accepted_extensions, upload_id) {
	var type = '';
	if (!accepted_extensions) {
		type = 'img';
		var formData = new FormData($("#frmUploadFile")[0]);	
	} else if (accepted_extensions.indexOf('txt') !== -1) {
		type = 'txt';
		var formData = new FormData();
		formData.append('toPreserveFileName', "false");
		formData.append('firstOption', "file");
		formData.append('upload', document.getElementById(upload_id).files[0]);
	} else if (accepted_extensions.indexOf('mp3') !== -1) {
		type = 'record';
		var formData = new FormData($("#frmUploadRecord")[0]);	
	}
	var upload_url = (window.location.protocol + '//' + window.location.hostname + ':' + basePort);
	
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
	
	if (type === 'img')
		var plus_num = get_img_num();
	else if (type === 'record')
		var plus_num = get_record_num();
	else 
		var plus_num = 0;
	if (plus_num + upload_num > num ){
		alert('Over file upload limit: ' + num + '!');
		return;
	}
	
	// if (!accepted_extensions)
	// 	var check = false;
	// else if (accepted_extensions[0] === 'wma')
	// 	var check = false;
	// else
	// 	var check = true;
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
				console.log(filenames);
				if (type === 'txt') {
					SR.API.IS_UTF8({filename: filenames[0]}, function (err2, result) {
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
				} else if (type === 'img') {
					// console.log('準備上傳的檔案');
					// console.log(filenames);
					SR.API.UPLOAD_IMAGE({ // 目前只做修改名稱
						filename: filenames,

					}, function (err, result) {
						if (err) {
							console.error(err);
							return alert(err);
						}

						return onDone(null, result, dom_id);
						//window.location.reload();
					});
				} else if (type === 'record') {
					// console.log('準備上傳的檔案');
					// console.log(filenames);
					SR.API.UPLOAD_IMAGE({ // 目前只做修改名稱
						filename: filenames,

					}, function (err, result) {
						if (err) {
							console.error(err);
							return alert(err);
						}

						return onDone(null, result, dom_id, filenames);
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

function flexform_table_add_field(insert_num, flexform_table, field, datas) { // flexform_table_add_field(0, flex_form, {key:'new_f', value: '新的欄位'}, ['a','b'])
	// insert_num: 插入的位置
	// flexform_table: 需插入的flexform_table
	// field: 插入的欄位，須包含key和value
	// datas: 寫入原先已有的data，需和現在data數量相同的array
	if (datas.length !== flexform_table.data.length)
		return flexform_table;
	flexform_table.field.splice(insert_num, 0, field);
	for (var i in datas)
		flexform_table.data[i][field.key] = datas[i];
	return flexform_table;
}

function switch_sort_up_down(table_num, cell_num, obj) {
	var f_table = document.getElementById('flexform-table' + table_num);
	// console.log(f_table.rows[0].cells);
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

function flexform_show_table(flexform_values, show_lines) {
	var html = '';
	var table_para = {};
	table_para.data_num = flexform_values.data.length;
	html += '<table id="flexform-table'+flexform_table_num+'"  border="1" class="customTable">';
	// field
	html += '<tr>';
	// for (var i in flexform_values.field) 
	// 	html += '<th  onClick="javascript:flexform_sort_table(\''+flexform_table_num+'\',\''+i+'\')" >' + flexform_values.field[i].value + '</th>';
	var count = 0;
	var width = 1.0 / flexform_values.field.length * 100;
	console.log('寬度');
	console.log(width);
	for (var i in flexform_values.field) {
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
		html += '<th width="'+width+'%">' + content + '</th>';
		count ++;
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
	// console.log('cell_num');
	// console.log(cell_num);
	// console.log('show f_table');
	// console.log(f_table.rows[1].cells);
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

// create a table with upload form
// 'form': form field & data to be displayed
// 
var create_table = function (form, hide, write, td_style) {
	console.log('print form');
	console.log(form);
	
	var html = '';
	html += '<table border="1" class="customTable">';
	var fields = form.data.fields;
	
	function c_table(fields, value) {
		var html = '';
		for (var i in fields) {
			
			// check if the field is hidden or specified as 'hide'
			if (!fields[i].show || hide.indexOf(fields[i].id) !== (-1)) {
				continue;				
			}
			
			// begin a row of data
			html += '<tr>';
			
			// display field name
			
			html += '<td style="'+(td_style?td_style[0]:'')+'">' + fields[i].name + '</td>';
			
			// show field content
			html += '<td style="'+(td_style?td_style[1]:'')+'">';
			
			switch (fields[i].type) {
				// FIXME: should make 'upload' not just for pics but files in general
				case 'record':
					if (write) {
						// var record_id = '<%= UTIL.createToken() %>';
						// set upload item limit
						var num = (fields[i].num ? fields[i].num : 5);
						html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' role="form" id="frmUploadRecord">';
						html += '<input type="hidden" name="toPreserveFileName" value="true" checked>';
						html += '<input type="file" name="upload" id="inputRecord-'+fields[i].id+'" multiple="multiple">';
						html += '<button class="btn btn-primary" onClick="uploadFile( \''+num+'\' , \''+fields[i].id+'\', onRecordUploaded, \''+['mp3']+'\', \'inputRecord-'+fields[i].id+'\' )">Upload</button>';
						html += '<input type="hidden" value="" id="' + fields[i].id + '">';

						html += '<div id="show_upload_record"></div>';
						html += '</form>';
					} else {
						html += '<div id="uploaded_record">';
						html += show_record(value[fields[i].id]);
						html += '</div>';	
					}
					break;
				case 'upload':
					if (write) {
						var image_id = '<%= UTIL.createToken() %>';
						
						// set upload item limit
						var num = (fields[i].num ? fields[i].num : 5);

						html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' role="form" id="frmUploadFile">';
						html += '<input type="hidden" name="toPreserveFileName" value="true" checked>';
						html += '<input type="file" name="upload" id="upload_file" multiple="multiple">';
						html += '<button class="btn btn-primary" onClick="uploadFile( \''+num+'\' , \''+fields[i].id+'\', onPhotoUploaded)">Upload</button>';
						html += '<input type="hidden" value="" id="' + fields[i].id + '">';

						html += '<div id="show_upload_img"></div>';
						html += '</form>';				
					} else {
						html += '<div id="uploaded_photo">';
						html += show_imgs(value[fields[i].id]);
						html += '</div>';						
					}
					break;

				case 'textarea':
					if (write) {
						html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' role="form" id="frmUploadTxt">';
						html += '<input type="hidden" id="'+fields[i].id+'-encode" value="">';
						html += '<input type="file" id="inputTxt-'+fields[i].id+'">';
						html += '<button id="txtBtn-'+textarea_id.length+'" onClick="uploadFile( \'1\' , \''+fields[i].id+'\', onTxtUploaded, \''+['txt']+'\', \'inputTxt-'+fields[i].id+'\')">上傳文字檔</button>';
						html += '</form>';					
						html += '<br>';
						textarea_id.push(fields[i].id);
						html += '<textarea rows="3" cols="20" id="'+fields[i].id+'">';
					} else {
						html += '<textarea rows="3" cols="20" readonly="readonly">';
						html += value[fields[i].id];
					}
					html += '</textarea>';					
					break;
					
				case 'date':
					if (write) {
						html += '<input type="text" value="" id="'+fields[i].id+'">';
						date_pickers.push(fields[i].id);						
					} else {
						html += value[fields[i].id];
					}
					break;
					
				case 'autocomplete': 
					if (write) {
						html += '<input type="text" id="' + fields[i].id + '" >';
						$( function() {
							var key_id = fields[i].id;
							SR.API.QUERY_FORM({name: form.name}, function (err, r_form) {
								if (err) {
									console.log(err);	
								}
								var ans = [];
								function haveSame(arr, str) {
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
					} else {
						html += value[fields[i].id];
					}				
					break;
				case 'choice':
					if (write) {
						var options = fields[i].option.split(',');

						html += '<select id="'+ fields[i].id + '">';
						for (var j=0; j < options.length; j++) {

							html += '<option value="' + options[j] + '" >' + options[j] + '</option>';
						}
						html += '</select>';
					} else {
						html += value[fields[i].id];
					}
					break;
				case 'lock':
					if (write) {
						var value = getParameterByName(fields[i].id);
						var value_list = value.split(',');

						html += '<select id="' + fields[i].id + '">';
						for (var j=0; j < value_list.length; j++) {	
							html += '<option value="' + value_list[j] + '" >' + value_list[j] + '</option>';
						}
						html += '</select>';
					} else {
						html += value[fields[i].id];
					}
					break;
				default:
					if (write) {
						html += '<input type="text" id="' + fields[i].id +'">';					
					} else {
						html += value[fields[i].id];
					}
					break;
			}
			
			html += '</td>'
			html += '</tr>';
		} 
			
		return html;
	}
	
	if (write) {
		html += c_table(fields);		
	}
	else {
		// show all valid records in the form.data.values
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
	
	html += '<form enctype="multipart/form-data" method="post" action=\'javascript:;\' id="frmUploadFile">';
	html += '<input type="hidden" name="toPreserveFileName" value="true" checked>';
	html += '<input type="file" name="upload" id="uploader" multiple="multiple" onchange="upload_excel(\'' + id + '\')">';
	//html += '<button class="btn btn-primary" onClick="uploadFile( \''+num+'\' , \''+fields[i].id+'\', onPhotoUploaded)">Upload</button>';
	//html += '<input type="hidden" value="" id="' + fields[i].id + '">';
	//html += '<div id="show_upload_img"></div>';
	html += '</form>';				

	// original one-liner
	//html += '<input type="file" id="uploader" multiple="multiple" onchange="upload_excel(\'' + id + '\')">';
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
	if (!f.files) {
		alert('no valid files!');
		return;
	}

	console.log(f.files);

	// check if file extensions are valid
	var filelist = f.files;
	var fileInfo = {};
	var validExtensions = ['csv', 'xls', 'xlsx'];

	for (var i=0; i < filelist.length; i++) {

		var file = f.files[i];
		var filename = file['name'];
		var type = file['type'];
		var arr = filename.split('.');
		var ext = arr[arr.length-1].toLowerCase();
		console.log('file: ' + filename + ' type: ' + type + ' ext: ' + ext);

		if ($.inArray(ext, validExtensions) < 0) {
			alert('unsupported file extension: ' + ext);
			return;
		}
		
		// store for later
		fileInfo[filename] = {
			type:	type,
			ext: 	ext 
		}
	}

	// prepare for upload
	var upload_url = (window.location.protocol + '//' + window.location.hostname + ':' + basePort);
	//var formData = new FormData();
	//formData.append('toPreserveFileName', "true");
	//formData.append('firstOption', "file");
	//formData.append('upload', f.files);
	
	// for multiple files
	var formData = new FormData($("#frmUploadFile")[0]);	
	
	$.ajax({
		url: upload_url + '/upload',
		type: 'POST',
		data: formData,
		//async: false,
		//cache: false,
		contentType: false,
		processData: false,
		success: function (data) {
			console.log('upload ' + data.upload.length + ' file(s) success!');
			console.log(data);

			// get filenames of uploaded files
			var list = [];
			for (var i=0; i < data.upload.length; i++) {
				list.push(data.upload[i].name);
			}
				
			SR.API.PROCESS_UPLOADED_EXCEL({list: list, para: l_excel_upload_para}, function (err, result) {
				if (err) {
					return alert(err);
				}
				console.log(result);
				
				// perform local display
				showExcel(result.data, result.errlist, upload_id, f);
			});			
		},
		error: function (jqXHR) {
			console.error(jqXHR);
		}
	});
}


function showExcel(xlsx_data, errlist, id, f) {
	document.getElementById('show_table').innerHTML = flexform_show_table(xlsx_data);
	
	// TOFIX: what does this do?
	//f.outerHTML=f.outerHTML.replace(/value=\w/g,'');

	// keep refernece to be uploaded later
	l_xlsx_data = xlsx_data;
	
	if (errlist.length > 0)
		alert(errlist);
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

