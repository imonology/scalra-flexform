

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
	html += '<table style="margin:0;"><tr><td colspan="2">' + original_name + '</td></tr><tr><td>'
	html += '<audio src="/web/images/'+record+'" controls="controls"></audio>';
	html += '</td>';
	html += '<td><button onclick="remove_img( \''+dom_id+'\' ,\''+record+'\', \'record\')">刪除</button></td>';
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

var remove_img = function(dom_id, id, type) {

	document.getElementById(id).remove();
	if (!type) {
		var files = document.getElementById(dom_id).value.split(",");
		files.splice(files.indexOf(id), 1);
		document.getElementById(dom_id).value = files;
	} else if (type === 'record') {
		var files = JSON.parse(document.getElementById(dom_id).value);
		var index = -1;
		for (var i = 0 ; i < files.length ; i++)
			if (files[i].filename === id) {
				index = i;
				break;
			}
		if (index != -1)
			files.splice(index, 1);
		document.getElementById(dom_id).value = JSON.stringify(files);
	} else {
		console.log('error');
	}
	
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
	if (!records)
		return '';
	// var records = records.split(",");
	
	var records = JSON.parse(records);
	
	// for(var i in records) {
	for(var i = 0 ; i < records.length ; i++) {
		html += '<div >';
		// html += '<audio src="/web/images/'+records[i]+'" controls="controls"></audio>';
		
		html += '<table style="margin:0;"><tr><td colspan="2">' + records[i].filetitle + '</td></tr><tr><td>'
		html += '<audio src="/web/images/'+records[i].filename+'" controls="controls"></audio>';
		html += '</td>';
		html += '</tr></table>';
		
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
		if (document.getElementById(dom_id).value.length === 0)
			var files = [];
		else
			var files = JSON.parse(document.getElementById(dom_id).value);
		for (var i in record_filenames)
			files.push({filetitle: original_filenames[i], filename: record_filenames[i]});

		document.getElementById(dom_id).value = JSON.stringify(files);

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



function uploadFile(num, dom_id, onDone, accepted_extensions, upload_id, form_name, field_id) {
	// form_name, field_id用來查詢上傳數量限制
	// SR.API.CHECK_UPLOAD_LIMIT_NUM({form_name: form_name, field_id: field_id}, function (err, result) {
	if (form_name) {
		SR.API.CHECK_UPLOAD_LIMIT_NUM({form_name: form_name, field_id: field_id}, function (err, result) {
			if (err) {
				console.log(err);
				return ;
			}
			doUploadFile(result, dom_id, onDone, accepted_extensions, upload_id);
		});
	} else 
		doUploadFile(num, dom_id, onDone, accepted_extensions, upload_id);

} // function uploadFile()

function doUploadFile(num, dom_id, onDone, accepted_extensions, upload_id){
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
}

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

function array_to_flexform_table(arr_data, para = {}) {
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

function flexform_show_table(flexform_values, show_lines, para = {}) {
	// para.colStyle = [{ cssKey: cssValue }]
	para.colStyle = para.colStyle || [];
	// para.hideTitle = true || false
	para.hideTitle = para.hideTitle || false
	var html = '';
	var table_para = {};
	table_para.data_num = flexform_values.data.length;
	html += '<table id="flexform-table'+flexform_table_num+'"  border="1" class="customTable" style="table-layout: fixed;">';
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

		let style = '';
		if (para.colStyle[i]) {
			if (!para.colStyle[i].width) {
				para.colStyle[i].width = `${width}%`
			}

			style = obj2inlineCSS(para.colStyle[i]);
		} else {
			style = `width: ${width}%`;
		}

		html += `<th style="${style}" class="text-center">${content}</th>`;
		count ++;
	}
	html += '</tr>';
	
	for (var i in flexform_values.data) {
		if (show_lines)
			html += '<tr '+(i>show_lines-1?'style="display: none;"':'')+'>';
		for (var j in flexform_values.field) 
			html += `<td style="${obj2inlineCSS(para.colStyle[j])}">` + (typeof(flexform_values.data[i][ flexform_values.field[j].key ])==='undefined'?'':flexform_values.data[i][ flexform_values.field[j].key ]) + '</td>';
		html += '</tr>';
	}
	
	
	html += '</table>';
	if (show_lines) {
		table_para.show_lines = show_lines
		html += '<button id="btnShowMore" onclick="flexform_table_show_more(this, \''+flexform_table_num+'\')">Show more '+(flexform_values.data.length - show_lines - 1)+' row</button>';
	}
	flexform_table_num++;
	flexform_tables_para.push(table_para);
	return html;
} // function flexform_show_table()

function obj2inlineCSS(obj) {
	if (!obj) return '';

	return Object.keys(obj).reduce((result, key) => {
		return result + `${key}: ${obj[key]}; `;
	}, '');
}

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
var create_table = function (form, hide, write, td_style, show) {
	console.log('print form');
	console.log(form);
	
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
			if (value) {
				var save_value = value[fields[i].id];
			} else
				var save_value = '';
			
			// check if the field is hidden or specified as 'hide'
			if (!fields[i].show || hide.indexOf(fields[i].id) !== (-1)) {
				continue;				
			}
			
			// begin a row of data
			if (show)
				html += '<tr '+ (show.indexOf(fields[i].id)!== -1? ' style="" data-can-hide="n" ' : 'style="display: none;"  data-can-hide="y"') +' >';
			else
				html += '<tr>';
			
			// display field name
			
			html += '<td style="'+(td_style?td_style[0]:'')+'">' + fields[i].name + (fields[i].must ? '*' : '') +  '</td>';
			
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
						html += '<input type="file" name="upload" id="inputRecord-'+save_id+'" multiple="multiple">';
						html += '<button class="btn btn-primary" onClick="uploadFile( \''+num+'\' , \''+save_id+'\', onRecordUploaded, \''+['mp3']+'\', \'inputRecord-'+save_id+'\', \''+form.name+'\', \''+fields[i].id+'\' )">Upload</button>';
						html += '<input type="hidden" value="" id="' + save_id + '">';

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
						html += '<button class="btn btn-primary" onClick="uploadFile( \''+num+'\' , \''+save_id+'\', onPhotoUploaded, undefined, undefined, \''+form.name+'\', \''+fields[i].id+'\' )">Upload</button>';
						html += '<input type="hidden" value="" id="' + save_id + '">';

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
						html += value[fields[i].id];
					}
					html += '</textarea>';					
					break;
					
				case 'date':
					if (write) {
						html += '<input type="text" id="'+save_id+'" value="'+save_value+'">';
						date_pickers.push(save_id);	
					} else {
						html += value[fields[i].id];
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
							SR.API.QUERY_AUTOCOMPLETE({form_name: form_name, key_id: key_id, value_id: value_id,  field_id: fields[i].id, multiple: multiple}, function (err, result) {
								if (err) {
									console.log(err);	
								}
								var ans = [];
								// console.log('找到的r_form');
								// console.log(r_form);
								console.log('multiple型別');
								console.log(typeof(result.multiple));
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
									if (!haveSame(ans, r_form.data.values[r_id][result.key_id]))
										ans.push(r_form.data.values[r_id][result.key_id] + (result.value_id?'('+r_form.data.values[r_id][result.value_id]+')': ''  ) );
								
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
						html += value[fields[i].id];
					}				
					break;
				case 'choice':
					if (write) {
						var options = fields[i].option.split(',');

						html += '<select id="'+ save_id + '">';
						for (var j=0; j < options.length; j++) {

							html += '<option value="' + options[j] + '" '+(save_value!==''&&options[j]===save_value?'selected="true"':'')+'  >' + options[j] + '</option>';
						}
						html += '</select>';
					} else {
						html += value[fields[i].id];
					}
					break;
				case 'lock':
					if (write) {
						var lock_value = getParameterByName(fields[i].id);
						var value_list = lock_value.split(',');
						if (save_value)
							value_list = [save_value];
						html += '<select id="' + save_id + '">';
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
						html += '<input type="text" id="' + save_id +'">';					
					} else {
						html += value[fields[i].id];
					}
					break;
			}
			
			html += '</td>'
			html += '</tr>';

		}
		if (show)
			html += '<tr  ><td colspan="2"><button class="btn btn-primary" onClick="show_detail(this)">檢視細節</button></td></tr>';
		html += '</table>';
		if (write)
			html += '<button class="btn btn-primary" onClick="check_upload(\''+form.name+'\', \''+hide+'\' '+(record_id?', \''+record_id+ '\'':'')+' )">'+(value?'確定修改':'確定送出')+'</button>';
		
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

function show_detail(btn){
	console.log('檢查')
	console.log(btn)
	console.log(btn.innerHTML);
	var lock ;
	if (btn.innerHTML === '檢視細節') {
		lock = false;
		btn.innerHTML = '隱藏細節';
	} else {
		lock = true;
		btn.innerHTML = '檢視細節';
	} 
    var parent = btn.parentNode.parentNode.parentNode; 
	
	var all_tr = parent.childNodes; // Find all other <tr>
	
	for (var i = 0 ; i < all_tr.length ; i++)
		if (all_tr[i].getAttribute('data-can-hide') === 'y')
			if (lock)
				all_tr[i].style.display = "none";
			else
				all_tr[i].style.display = "";
}


// 如果有upload_record_id，則是修改，若沒有則是新增
function check_upload(form_name, hide, upload_record_id) {
	SR.API.GET_FORM_FIELDS({name: form_name}, function (err, result_field) {
		if (err)
			return onDone(err);
		
		hide =hide.split(",");
		
		for (var i in result_field.fields) {
			// 檢查必填欄位
			var dom = document.getElementById(result_field.fields[i].id)
			if (result_field.fields[i].must === true && result_field.fields[i].show === true) {
				var is_hide = false;
				for (var t in hide)
					if (hide[t] === result_field.fields[i].id) is_hide = true;
				if (!is_hide && dom.value === '') {
						alert(result_field.fields[i].name + ' 為必填欄位');
						dom.focus();
						return;
				}
			}
				
			
			// 檢查上傳數量
			if (result_field.fields[i].num) {
				var upload_id = dom.value.split(",");
				var use_num = upload_id.length -1;
				if (use_num > result_field.fields[i].num) {
					alert(result_field.fields[i].name + ' 數量不可超過 ' + result_field.fields[i].num + ' 個!');
					return ;
				}
			}
		}
		console.log('叫哪邊')
		upload();
	});
	
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
var l_xlsx;

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
				result.filelist = list;
				
				// perform local display
				showExcel(result, upload_id, f);
			});
		},
		error: function (jqXHR) {
			console.error(jqXHR);
		}
	});
}


function showExcel(xlsx, id, f) {
	
	document.getElementById('show_table').innerHTML = flexform_show_table(xlsx.data);
	
	// TOFIX: what does this do?
	//f.outerHTML=f.outerHTML.replace(/value=\w/g,'');

	// keep refernece to be uploaded later
	l_xlsx = xlsx;
	
	if (xlsx.errlist.length > 0) {
		alert(xlsx.errlist);		
	}
	else {
		document.getElementById('show_table').innerHTML += '<input type="button" value="Continue Upload" onclick="submit_excel_import(\''+ id +'\')">';
	}
}

function submit_excel_import(id) {
	if (typeof l_excel_upload_para.onConfirm === 'function') {
		l_excel_upload_para.onConfirm(l_xlsx.data, id, l_xlsx.filelist);
	} else {
		console.error('no onConfirm callback provided when excel import is confirmed!');
	}
}

function has_str(arr, str){
	return (arr.indexOf(str) > (-1));
}

function btn_search(){
	location.href = 'statistics?search=' + document.getElementById('search').value;
}

function onSearchKeyPress (event) {
	if (event.keyCode === 13) {
		btn_search();
	}
}

function statistics_flexform(form, filter, category, onDone, show) {
	// show: 避免一次顯示太多資料，在這邊定義初始時要顯示哪些資料
	var html = '';
	var search = '';

	
	if (getParameterByName('search'))
		search = getParameterByName('search');

	var para = {already_form: form};
	
	if (search.length !== 0) {
		var partial = {};
		for (var i in filter)
			partial[filter[i]] = search;
		para.query_partial = partial;
	}
	console.log('para = ');
	console.log(para);
	SR.API.QUERY_FORM(para, function (err, o_form) {
		if (err) {
			return console.log('joint form error!');		
		}
		// console.log('印出form')
		// console.log(form)
		var values = o_form.data.values;

		// 左邊
		html += '<div style="float: left;width: 20%;">';

		for (var i in category) 
			for (var j in o_form.data.fields) 
				if (o_form.data.fields[j].id === category[i]) {
					html += '<h1 style="text-align:left;">'+o_form.data.fields[j].name+'</h1>'
					
						
						
					html += '<ul class="nostyle">';
					html += '<li style="text-align:left;" class="nostyle" onclick="statistics_choice_category()"   >';
					html += '<i class="fa fa-chevron-right" aria-hidden="true"></i>';
					html += '所有 ('+Object.keys(o_form.data.values).length+')';
					html += '</li>';
					if (o_form.data.fields[j].option){
						var options =  o_form.data.fields[j].option.split(',');
					} else {
						var options = [];
						for (var record_id in values)
							options.push(values[record_id][category[i]]);
						options = Array.from( new Set(options) );
					}
						
					for (var k in options){
						var num = 0;
						for (var record_id in values)
							if (values[record_id][category[i]] === options[k])
								num++;
						html += '<li style="text-align:left;" class="nostyle2" data-num="'+num+'"  onclick="statistics_choice_category()"  >';
						
						html += '<i class="fa fa-chevron-right" aria-hidden="true" ></i>';
						html += '<input type="checkbox" name="category" data-type="'+category[i]+'" value="'+options[k]+'" >';
						html += '<label >';
						html += options[k];
						html += ' (' + num + ')';
						html += '</label>';
						html += '</li>';
					}
					html += '</ul>';

					html += '<br>';
				}
		
		html += '</div>';

		// 右邊
		html += '<div style="float: left;width: 80%;">';
		html += '<table><tr>';
		html += '<td><input type="text" id="search" value="'+search+'" onkeypress="return onSearchKeyPress(event);"></td>';
		html += '<td width="20%"><button type="button" onclick="javascript:btn_search();">搜尋</button></td>';
		html += '</tr></table>';

		o_form.data.values = null;

		for (var record_id in values) {
			html += '<div class="statistics" name="form_data" ';
			for (i in category)
				html += 'data-category-'+category[i] +'="'+values[record_id][category[i]]+'" ';

			html += 'style="border-width:1px;border-style:dashed;border-color:white;padding:3px;"  >';
			o_form.data.values = {};
			o_form.data.values[record_id] = values[record_id];
			html += create_table(o_form, ['lng', 'lat', 'datetime'], false, ['width:20%;','text-align:left;'], show);
			html += '</div>';
			// html += '<br>';
		}

		html += '</div>';
		
		return onDone(null, html);
	});
}

function statistics_choice_category() {
	// 找出目前checkbox勾選哪些
	var all_choice = {};
	var categorys = document.getElementsByName('category');
	for (var i in categorys) 
		if (categorys[i].checked) {
			if (!all_choice[categorys[i].getAttribute('data-type')])
				all_choice[categorys[i].getAttribute('data-type')] = [];
			all_choice[categorys[i].getAttribute('data-type')].push(categorys[i].value);
		}
	// 篩選
	var datas = document.getElementsByName('form_data');
	for (var i = 0 ; i < datas.length ; i++) {
		datas[i].style.display = "block";
		for (var key in all_choice) 
			if (all_choice[key].indexOf(datas[i].getAttribute('data-category-' + key)) === -1)
				datas[i].style.display = "none";
	}
	
}

function enable_checkbox() {
	$('input[type=checkbox]+label').click(function(){
		$(this).prev().prop('checked', !$(this).prev().is(':checked'));
	});;
}






