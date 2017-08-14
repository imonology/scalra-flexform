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

function uploadFile(new_file_name, onDone) {
	var upload_url = (window.location.protocol + '//' + window.location.hostname + ':' + basePort);
	var formData = new FormData($("#frmUploadFile")[0]);
	var fullPath = document.getElementById('upload_file').value;
	var filename;
	
	console.log(formData);
	
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

	var filename_extension = filename.split(".")[1].toLowerCase()
	if ( !(filename_extension === 'jpg') ) {
		alert("請上傳 .jpg 的檔案");
		return;
	}
	

	$.ajax({
		url: upload_url + '/upload',
		type: 'POST',
		data: formData,
		async: false,
		cache: false,
		contentType: false,
		processData: false,
		success: function (data) {

			if (data.message === 'success') {
				$("#spanMessage").html("Upload success!");
				console.log('upload success, data:');
				console.log(data.upload);
				
				SR.API.UPLOAD_IMAGE({
					filename: filename,
					new_filename: new_file_name
				}, function (err, result) {
					if (err) {
						console.error(err);
						return alert(err);
					}
					
					//console.log(result);
					onDone(null, new_file_name);
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
