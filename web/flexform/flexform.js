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
	html += '<img width="250" src="/web/images/'+img+'" />';
	html += '<i class="fa fa-times" aria-hidden="true" onclick="remove_img( \''+dom_id+'\' ,\''+img+'\')"></i>';
	html += '</div>';
	return html;
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
	for(var i in imgs)
		html += '<img width="250" src="/web/images/'+imgs[i]+'" />';
	return html;
	// show_upload_img
}

function uploadFile(num, dom_id, onDone, accepted_extensions) {
	var upload_url = (window.location.protocol + '//' + window.location.hostname + ':' + basePort);
	var formData = new FormData($("#frmUploadFile")[0]);
	var fullPath = document.getElementById('upload_file').value;
	var filename;
	// console.log('傳入的 ' + dom_id);

	var upload_num = $("#upload_file")[0].files.length;
	if (get_img_num() + upload_num > num ){
		alert('Over the limit number of files. Limit numbers is ' + num + '!');
		return;
	}

	// set default accepted file extensions
	if (accepted_extensions instanceof Array === false) {
		accepted_extensions = ['jpg', 'png', 'gif'];
	}
	
	if (fullPath) {
		var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
		filename = fullPath.substring(startIndex);
		if (filename.indexOf('\\') === 0 || filename.indexOf('/') === 0) {
			filename = filename.substring(1);
		}
		console.log(filename);
	}
	if (!filename || typeof(filename) !== 'string' || filename.length < 6) {
		alert("invalid filename");
		return;
	}

	var arr = filename.split(".");
	var filename_extension = arr[arr.length-1].toLowerCase();
	
	if (accepted_extensions.indexOf(filename_extension) === (-1)) {
		alert("allowed files types are: " + accepted_extensions);
		return;
	}
	
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
				console.log('upload success, data:');
				console.log(data.upload);
				
				SR.API.UPLOAD_IMAGE({
					filename: filenames,

				}, function (err, result) {
					if (err) {
						console.error(err);
						return alert(err);
					}

					onDone(null, result, dom_id);
					//window.location.reload();
				});
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

function array_to_flexform_table(arr_data) {
	var flexform_table = {};
	flexform_table.field = [];
	flexform_table.data = [];
	for (var i in arr_data[0])
		flexform_table.field.push({key: arr_data[0][i], value: arr_data[0][i]});
	
	for (var i in arr_data) {
		if (i === '0') continue;
		var temp_data = {};
		for (var j in arr_data[i]) 
			temp_data[flexform_table.field[j].key] = arr_data[i][j];
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

var create_table2 = function(form, hide, write) {
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
			else if (fields[i].type === 'textarea') 
				html += '<textarea rows="3" cols="20" ' + (write?'id="'+fields[i].id+'"':'readonly="readonly"' )+ '>';
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
					
					// html += '<div id="uploaded_photo"><img id="show_image" width="250" src="")" ></div>'
				} else if (fields[i].type === 'date') {
					html += '<input type="text" value="" id="'+fields[i].id+'">';
					date_pickers.push(fields[i].id);
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
