# scalra-flexform
A flexible form module for Scalra framework

The following code can initialize a FlexForm:

```js
var l_devices = undefined;

SR.API.INIT_FORM({
	name: 'DeviceInfo',
	fields: [
		{id: '*name',	name: 'Name',		type: 'string', desc: 'Your device name', 	must: true, show: true},
		{id: 'id', 		name: 'Device ID',	type: 'string', desc: '', 					must: true, show: false},			
		{id: 'type',	name: 'Type',		type: 'choice', desc: '', 					must: true, show: false, option: ['router', 'switch']},				
		{id: 'IP',		name: 'IP', 		type: 'string', desc: 'ex. 192.168.33.46', 	must: true, show: true},
		{id: 'port',	name: 'Port', 		type: 'number', desc: '', 					must: true, show: true}
	]
}, function (err, ref) {
	if (err) {
		return LOG.error(err);
	}

	l_devices = ref['DeviceInfo'];

	// show loaded devices from DB
	LOG.warn('l_devices');
	LOG.warn(l_devices);
});
```

Then we can access and modify form data simply using variables in the following way:

```js
var l_form = SR.State.get('FlexFormMap');

// perform a post action after the form content is updated
// where 'args' contains the client-side arguments sent to server 
// here we try to assign a system-generated unique device ID for each device record just submitted
SR.API.after('UPDATE_FORM', function (args, output, onDone) {

	if (l_form.hasOwnProperty(args.form_id) === false) {
		return onDone();
	}
	
	var form = l_form[args.form_id];
	
	switch (form.name) {
		case 'DeviceInfo':
			
			var record_ids = output.result.record_ids;
			if (!record_ids)
				break;
			
			// NOTE: form.data contains both sub-fields 'fields' and 'values',
			// storing the form's format and actual data, respectively
			var values = form.data.values;
			
			// find records just adde
			for (var record_id in values) {
				if (record_ids.indexOf(record_id) >= 0) {
					var record = values[record_id];
					record.id = UTIL.createUUID();
				}
			}
			// write back to DB
			form.sync(function (err) {
				if (err) {
					LOG.error(err);
					return onDone(err);
				}
				return onDone();
			})
			return;
			
		default:
			break;					 
	}	
	onDone();
})

```

Queries to the form can also be performed: 
(this example finds a form data matching a given account name, and returns how many accounts match that name)

```js

// returns whether a givn user of certain type
SR.API.add('CHECK_USER_DATA',{
	account: 	'string',
	_login: 	true				// this API requires login to function
}, function (args, onDone) {
	
	var para = {
		name: 'Member',
		query: {account: args.account}
	};

	SR.API.QUERY_FORM(para, function (err, form) {
		if (err) {
			return LOG.error('no form can be found');		
		}
		
		var matched_records = form.data.values;
		return onDone(null, Object.keys(matched_records).length);
	});	
});

```