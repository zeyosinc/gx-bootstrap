Gx Bootstrap Components
=======================

Gx is an extensible component library built on MooTools. The ZeyOS module includes various components for building add-on for Bootstrap.


Demos
-----

All demos from the `./docs/demos/` directory and be viewed on our [Demo page](http://gx.zeyon.net/bootstrap/)


Components
----------

### gx.bootstrap.Select ###

Creates a dynamic select box, which dynamically loads the contents from a remote URL

```js
(function () {
	var SelectPrio = new gx.bootstrap.SelectPrio();

	var SelectFilter = new gx.bootstrap.SelectFilter();
	(new Request({url: './data/select.json', onSuccess: function(json) {
		SelectFilter.setData(JSON.decode(json));
	}})).send();

	var SelectDyn = new gx.bootstrap.SelectDyn(null, {
		'url': window.location.href.substring(0, window.location.href.lastIndexOf("/")+1) + 'data/select.php',
		'onRequestSuccess': function(json) {
			this.setData(JSON.decode(json));
		}
	});

	// Demo Injection
	$(document.body).adopt(__({'children': [
		{'tag': 'h5', 'html': 'gx.bootstrap.Select'},
		{'class': 'pad-10', 'children': [
			{'tag': 'label', 'html': 'Selection demo:'},
			{'class': 'pad-5', 'child': SelectPrio},
			{'class': 'pad-5', 'child': SelectFilter},
			{'class': 'pad-5', 'child': SelectDyn}
		]},
		{'class': 'p-10 bg-E', 'children': {
			btnSelectValue : {'tag': 'button', 'class': 'btn btn-primary', 'html': 'Get selection', 'onClick': function() {
				alert(JSON.encode(SelectFilter.getSelected()));
			}},
			btnSelectReset : {'tag': 'button', 'class': 'btn btn-default', 'html': 'Reset', 'onClick': function() {
				SelectFilter.set();
			}}
		}}
	]}));
})();

```

### gx.bootstrap.Table ###

Generates a table

```js
(function() {
    var data = [
        {'customername': 'HyperFlyer', 'customernum': '1003', 'lastmodified': '1220454105'},
        {'customername': 'InScreen Design', 'customernum': '1004', 'lastmodified': '1220454283'},
        {'customername': 'GlobalSpin Travel Agency', 'customernum': '1005', 'lastmodified': '1220454466'},
        {'customername': 'nTronic AG', 'customernum': '1001', 'lastmodified': '1220453517'},
        {'customername': 'CleanTexx', 'customernum': '1002', 'lastmodified': '1220454105'}
    ];
    var Table = new gx.bootstrap.Table(null, {
        'cols': [
            {'label': 'Name', 'id': 'customername'},
            {'label': 'Number', 'id': 'customernum', 'text-align': 'right'},
            {'label': 'Last change', 'id': 'lastmodified'}
        ],
        'structure': function(row) {
            return [
                row.customername,
                row.customernum,
                new Date(row.lastmodified * 1000).format('%d.%m.%Y %H:%M')
            ];
        },
        'data': data,
        'scroll': true,
        'selectable': true,
        'onClick': function(row) {
            console.log(row.customernum);
        },
        'onFilter': function(col, mode) {
            alert(col.id + ': ' + mode);
        }
    });

    // Demo Injection
    $(document.body).adopt(__({'children': [
        {'tag': 'h5', 'html': 'gx.bootstrap.Table'},
        {'class': 'b-1', 'child': Table.display()},
        {'class': 'p-10 bg-E', 'children': {
            btnTableEmpty : {'tag': 'button', 'class': 'm_r-5', 'html': 'Empty', 'onClick': function() {
                Table.empty();
            }},
            btnTableSet : {'tag': 'button', 'class': 'm_r-5', 'html': 'Set data', 'onClick': function() {
                Table.setData(data);
            }},
            btnAddData : {'tag': 'button', 'class': 'm_r-5', 'html': 'Add data', 'onClick': function() {
                var temp = Array.clone(data);
                temp.push({'customername': 'Another One', 'customernum': '1003943295792836012345719837632809467', 'lastmodified': '1220454105'});
                Table.setData(temp);
            }},
            btnGetSelection : {'tag': 'button', 'html': 'Get selection', 'onClick': function() {
                console.log(Table.getSelection());
            }}
        }}
    ]}));
})();

```

Usage
-----

Compile using [Grunt](http://gruntjs.com/)


Credits
-------

Gx has been actively development for a couple of years now. Contributors are

 * Peter-Christoph Haider (Lead Developer)
 * Sebastian Glonner
 * Hoang Nguyen

Gx is a project by [Zeyon](http://www.zeyon.net)
