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


function uploadFile(account, onDone) {
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
					filename: filename
				}, function (err, result) {
					if (err) {
						console.error(err);
						return alert(err);
					}
					
					//console.log(result);
					onDone(null);
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
