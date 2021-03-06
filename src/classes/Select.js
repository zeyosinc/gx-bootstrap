/**
 * @class gx.bootstrap.Select
 * @description Creates a dynamic select box, which dynamically loads the contents from a remote URL
 * @extends gx.ui.Container
 *
 * @param  {element|string}  display         The display element
 * @param  {object}          options
 *
 * @option {string}          height          Default: auto
 * @option {string}          selectionPrefix An optional prefix displayed in front of the selected value
 * @option {string}          icon            The glyphikon icon (default: chevron-down)
 * @option (string)          resetable       If set, add an additional list option to reset the selection (e.g. "Select all")
 * @option {string}          textboxClass    Additional textbox class
 * @option {array}           data            Default data
 * @option {string|function} elementIndex    The ID format (default key is "ID"; specify function to overwrite)
 * @option {string|function} elementLabel    Element label or alternative list format (Default returns a:"elem.name")
 * @option {string|function} elementSelect   The label for selected elements or alternative format function
 * @option {object}          elementDefault  Represents a default element, e.g. for "empty" selections
 * @option {string|int}      value           Specifies the default/preset value or simple lists
 *
 * @event show     When the selection list is shown
 * @event hide     When the selection list is hidden
 * @event select   When an element is selected
 * @event noselect When no element is selected
 *
 */
gx.bootstrap.Select = new Class({
	gx: 'gx.bootstrap.Select',
	Extends: gx.ui.Container,
	options: {
		'height'         : 'auto',
		'allowEmpty'     : false,
		'selectionLabel' : false,
		'icon'           : 'chevron-down',
		'resetable'      : false,
		'textboxClass'   : false,
		'data'           : null,
		'elementIndex'   : 'ID',
		'elementLabel'   : 'name',
		'elementSelect'  : 'name',
		'elementDefault' : null,
		'value'          : null,
		/* Messages */
		'msg'            : {
			'noSelection': 'No Selection'
		}
	},
	_closed    : true,
	_selected  : null,
	_currentElem: null,
	_running   : false,

	initialize: function (display, options) {
		var root = this;
		try {
			this.parent(display, options);

			this._display.root.addClass('gx-bootstrap-select');

			this._display.textbox = new Element('input', {
				'type'       : 'text',
				'class'      : 'form-control',
				'placeholder': '('+this.getMessage('noSelection')+')'
			});
			if (this.options.textboxClass)
				this._display.textbox.addClass(this.options.textboxClass);

			this._display.dropdown = new Element('ul', {
				'class': 'dropdown-menu',
				'styles': {
					'max-height': this.options.height
				}
			});

			this._display.icon = new Element('span', {'class': 'glyphicon glyphicon-'+this.options.icon});

			this._display.root.adopt([
				this._display.icon,
				this._display.textbox,
				this._display.dropdown
			]);

			// Initialize keyboard controls
			this.fxScoll = new Fx.Scroll(this._display.dropdown, {
				offset: {
					y: -100
				}
			});
			this._display.textbox.addEvents({
				'click': function () {
					this.show();
				}.bind(this),
				'focus': function () {
					this.show();
				}.bind(this),
				'blur': function () {
					this.hide.delay(300, root);
				}.bind(this),
				'keypress': function (event) {
					if ( event.key == 'tab' )
						return;
					if ( event.key == 'up' || event.key == 'down' ) {
						event.preventDefault();
						return;
					}
					if ( this.search == null )
						event.preventDefault(); // Do nothing for simple select boxes
				}.bind(this),
				'keydown': function (event) {
					if ( event.key == 'tab' )
						return;
					if ( event.key == 'up' || event.key == 'down' ) {
						event.preventDefault();
						return;
					}
					if ( this.search == null )
						event.preventDefault(); // Do nothing for simple select boxes
				}.bind(this),
				'keyup': function (event) {
					if ( event.key == 'tab' )
						return;

					if ( event.key == 'esc' ) {
						this.hide();
					} else if ( event.key == 'up' || event.key == 'down' ) {
						event.preventDefault();

						// this.show();

						var li;
						if (this._currentElem == null) {
							if(event.key == 'down')
								li = this._display.dropdown.getFirst(':not(.hidden)');
							else
								li = this._display.dropdown.getLast(':not(.hidden)');
						} else {
							if(event.key == 'down') {
								li = this._currentElem.getNext(':not(.hidden)');
								if (li == null && this._currentElem == this._display.dropdown.getLast(':not(.hidden)'))
									li = this._display.dropdown.getFirst(':not(.hidden)');
							} else {
								li = this._currentElem.getPrevious(':not(.hidden)');
								if (li == null && this._currentElem == this._display.dropdown.getFirst(':not(.hidden)'))
									li = this._display.dropdown.getLast(':not(.hidden)');
							}
						}

						if (li != null) {
							if (this._currentElem != null)
								this._currentElem.removeClass('selected');
							this._currentElem = li;
							this._currentElem.addClass('selected');
							this.fxScoll.toElement(this._currentElem);
						}

						return;
					} else if ( event.key == 'enter' ) {
						if (this._currentElem != null) {
							var a = this._currentElem.getElement('a');
							if (a != null)
								a.fireEvent('click');
						}

						return;
					}

					if ( this.search != null ) {
						// this.show();
						this.search();
					} else
						event.preventDefault(); // Do nothing for simple select boxes
				}.bind(this)
			});

			if (gx.util.isFunction(this.options.elementIndex))
				this.getId = this.options.elementIndex.bind(this);

			if (gx.util.isFunction(this.options.elementLabel))
				this.getLink = this.options.elementLabel.bind(this);

			if (gx.util.isFunction(this.options.elementSelect))
				this.showSelection = this.options.elementSelect.bind(this);

			if (gx.util.isArray(this.options.data))
				this.setData(this.options.data);

			if (this.options.value != null && gx.util.isString(this.options.elementIndex)) {
				this.options.data.each(function(entry) {
					if (entry[this.options.elementIndex] == this.options.value)
						this.set(entry, true);
				}.bind(this));
			}
		} catch(e) {
			e.message = 'gx.bootstrap.Select->initialize: ' + e.message;
			throw e;
		}
	},

	/**
	 * @method set
	 * @description Sets the selected element
	 * @param {object} selection The element to select
	 * @param {bool} noEvents Do not throw events
	 * @returns Returns this instance (for method chaining).
	 * @type gx.bootstrap.Select
	 */
	set: function (selection, noEvents) {
		this._selected = selection;

		// This conforms to vanilla js reading value like input.value.
		this.value = this.getId();

		return this.update(noEvents != false);
	},

	/**
	 * @method update
	 * @description Updates the select box according to its state of selection
	 * @param {bool} noEvents Do not throw events
	 * @returns Returns this instance (for method chaining).
	 * @type gx.bootstrap.Select
	 */
	update: function (noEvents) {
		if (noEvents == null || !noEvents)
			this.fireEvent(this._selected == null ? 'noselect' : 'select', this._selected);

		this.showSelection(this._selected);
		this.hide();

		return this;
	},

	showSelection: function() {
		this._display.textbox.set('value', this.getSelectionDisplayValue());
	},

	getSelectionDisplayValue: function() {
		return this._selected == null ? '' : this._selected[this.options.elementSelect];
	},

	/**
	 * @method getID
	 * @description Returns the ID of the selected element
	 */
	getId: function (elem) {
		if (elem != null)
			return elem[this.options.elementIndex];

		if (this._selected != null)
			return this._selected[this.options.elementIndex];

		return null;
	},

	/**
	 * Returns the element's link
	 *
	 * @param  {object} elem
	 * @return {element}
	 */
	getLink: function(elem) {
		return new Element('a', {'html': elem[this.options.elementLabel]});
	},

	/**
	 * @method setData
	 * @description Builds a list of links from the provided array
	 * @param {array} list The provided array
	 * @returns Returns this instance (for method chaining).
	 * @type gx.bootstrap.Select
	 */
	setData: function (list) {
		var root = this;
		try {
			this._display.dropdown.empty();
			this._currentElem = null;

			if (this.options.resetable) {
				this._display.dropdown.adopt(__({'tag': 'li', 'child':
					{'tag': 'a', 'class': 'reset', 'html': this.options.resetable, 'onClick': function() {
						this.set();
					}.bind(this)}
				}));
			}

			var addCLink = function (link, el) {
				link.addEvent('click', function () {
					root.set(el);
				});
			};

			if ( this.options.elementDefault != null )
				list = [this.options.elementDefault].append(list);

			var len = list.length;

			for ( i = 0 ; i < len ; i++ ) {
				if (list[i] == null)
					continue;

				var li = new Element('li');
				var a = this.getLink(list[i]);

				li.store('data', list[i]);
				li.store('key', i);
				this._display.dropdown.adopt(li.adopt(a));
				addCLink(a, list[i]);
			}
		} catch(e) {
			e.message = 'gx.bootstrap.Select->setData: ' + e.message;
			throw e;
		}

		return this;
	},

	/**
	 * @method show
	 * @description Shows the select box
	 * @returns Returns this instance (for method chaining).
	 * @type gx.bootstrap.Select
	 */
	show: function () {
		if ( this._display.textbox.disabled )
			return this;

		this._display.root.addClass('open');
		this._display.textbox.focus();

		this.fireEvent('show');
		return this;
	},

	/**
	 * @method hide
	 * @description Hides the select box
	 * @returns Returns this instance (for method chaining).
	 * @type gx.bootstrap.Select
	 */
	hide: function () {
		if (!this.isOpen())
			return this;

		this._display.root.removeClass('open');
		this.clearCursor();

		this.fireEvent('hide');
		return this.update();
	},

	/**
	 * @method isOpen
	 * @description Returns if the list box is open
	 * @return {bool}
	 */
	isOpen: function() {
		return this._display.root.hasClass('open');
	},

	/**
	 * @method getValue
	 * @description Alias for getID
	 */
	getValue: function () {
		return this.getId();
	},

	/**
	 * @method getSelected
	 * @description Returns the selected element
	 */
	getSelected: function () {
		return this._selected;
	},

	/**
	 * @method clearCursor
	 * @description Removes the current list selection
	 */
	clearCursor: function() {
		if (this._currentElem == null)
			return;

		this._currentElem.removeClass('selected');
		this._currentElem = null;
	},

	/**
	 * @method reset
	 * @description Resets the selection
	 * @param {bool} noEvents Do not throw events
	 * @returns Returns this instance (for method chaining).
	 * @type gx.bootstrap.Select
	 */
	reset: function (noEvents) {
		return this.set(null, noEvents);
	},

	/**
	 * @method enable
	 * @description Enables the text box
	 * @returns Returns this instance (for method chaining).
	 * @type gx.bootstrap.Select
	 */
	enable: function () {
		this._display.textbox.erase('disabled');
		return this;
	},

	/**
	 * @method disable
	 * @description Disables the text box
	 * @returns Returns this instance (for method chaining).
	 * @type gx.bootstrap.Select
	 */
	disable: function () {
		this._display.textbox.set('disabled', true);
		return this;
	},

	toElement: function() {
		return this._display.root;
	}
});

/**
 * @class gx.bootstrap.SelectPrio
 * @description Creates a priority select box
 * @extends gx.bootstrap.Select
 */
gx.bootstrap.SelectPrio = new Class({
	gx: 'gx.bootstrap.SelectPrio',
	Extends: gx.bootstrap.Select,
	options: {
		elementIndex: 'value',
		data: [
			{'value': 0, 'color': '#008000', 'symbol': '■□□□□', 'label': 'lowest'},
			{'value': 1, 'color': '#ffc000', 'symbol': '■■□□□', 'label': 'low'},
			{'value': 2, 'color': '#ff8000', 'symbol': '■■■□□', 'label': 'medium'},
			{'value': 3, 'color': '#ff4000', 'symbol': '■■■■□', 'label': 'high'},
			{'value': 4, 'color': '#c00000', 'symbol': '■■■■■', 'label': 'highest'}
		],
		msg: {
			'lowest' : 'Lowest',
			'low'    : 'Low',
			'medium' : 'Medium',
			'high'   : 'High',
			'highest': 'Highest'
		},
		value: 0
	},

	showSelection: function() {
		this._display.textbox.set('value', this._selected == null ? '' : this._selected.symbol + ' | ' + this.getMessage(this._selected.label));
	},

	getLink: function(elem) {
		return new Element('a', {'html': elem.symbol + ' | ' + this.getMessage(elem.label), 'styles': {'color': elem.color}});
	}
});

/**
 * @class gx.bootstrap.SelectFilter
 * @description Creates a filterable search list
 * @extends gx.bootstrap.Select
 *
 * @param  {element|string}  display         The display element
 * @param  {object}          options
 *
 * @option {string}          height          Default: 200px
 * @option {string}          selectionPrefix An optional prefix displayed in front of the selected value
 * @option {string}          icon            The glyphikon icon (default: chevron-down)
 * @option (string)          resetable       If set, add an additional list option to reset the selection (e.g. "Select all")
 * @option {string}          textboxClass    Additional textbox class
 * @option {array}           data            Default data
 * @option {string|function} elementIndex    The ID format (default key is "ID"; specify function to overwrite)
 * @option {string|function} elementLabel    Element label or alternative list format (Default returns a:"elem.name")
 * @option {string|function} elementSelect   The label for selected elements or alternative format function
 * @option {object}          elementDefault  Represents a default element, e.g. for "empty" selections
 * @option {string|int}      value           Specifies the default/preset value or simple lists
 * @option {array}           searchfields    List of searchable object fields inside
 *
 */
gx.bootstrap.SelectFilter = new Class({
	gx: 'gx.bootstrap.SelectFilter',
	Extends: gx.bootstrap.Select,
	options: {
		'height'      : '200px',
		'searchfields': ['name']
	},
	_lastSearch: null,

	initialize: function (display, options) {
		var root = this;
		try {
			this.addEvent('show', function() {
                this._display.textbox.set('value', this._lastSearch);
				this.search();
			}.bind(this));
            this.addEvent('hide', function() {
                this._display.textbox.erase('value');
            }.bind(this));

			this.parent(display, options);
		} catch(e) {
			e.message = 'gx.bootstrap.SelectFilter->initialize: ' + e.message;
			throw e;
		}
	},

	/**
	 * @method search
	 * @description Initiates a search request
	 * @returns Returns this instance (for method chaining).
	 */
	search: function () {
		try {
			var query = this._display.textbox.get('value');
			if (this._lastSearch == query)
				return;

			var selectionDisplayValue = this.getSelectionDisplayValue();
			if ( this._selected && query == selectionDisplayValue )
				return;

			this.clearCursor();
			this._lastSearch = query;
			this._searchQuery(query);

		} catch(e) {
			e.message = 'gx.bootstrap.SelectFilter->search: ' + e.message;
			throw e;
		}
	},

	/**
	 * @method search
	 * @description Performs a search
	 * @returns Returns this instance (for method chaining).
	 */
	_searchQuery: function (query) {
		try {
			this._display.dropdown.getElements('li').each(function(li) {
				var data = li.retrieve('data', {});
				this.options.searchfields.each(function(field) {
					if (query == '') {
						li.removeClass('hidden');
						return;
					}
					switch (typeOf(data[field])) {
						case 'number':
							data[field] = data[field].toString();
						case 'string':
							if (data[field].test(query, 'i')) {
								li.removeClass('hidden');
								return;
							}
					}
					li.addClass('hidden');
				}.bind(this));
			}.bind(this));
		} catch(e) {
			e.message = 'gx.bootstrap.SelectFilter->_searchQuery: ' + e.message;
			throw e;
		}
	},

	/**
	 * @method showLoader
	 * @description Show the loader icon
	 * @return gx.bootstrap.SelectDyn
	 */
	showLoader: function() {
		this._display.icon.set('class', 'glyphicon glyphicon-refresh');
		return this;
	},

	/**
	 * @method hideLoader
	 * @description Hide the loader icon and restore the default icon
	 * @return gx.bootstrap.SelectDyn
	 */
	hideLoader: function() {
		this._display.icon.set('class', 'glyphicon glyphicon-'+this.options.icon);
	}
});

/**
 * @class gx.bootstrap.SelectDyn
 * @description Creates a dynamic select box with searchable conent
 * @extends gx.bootstrap.Select
 *
 * @param  {element|string}  display         The display element
 * @param  {object}          options
 *
 * @option {string}          height          Default: 200px
 * @option {string}          selectionPrefix An optional prefix displayed in front of the selected value
 * @option {string}          icon            The glyphikon icon (default: chevron-down)
 * @option (string)          resetable       If set, add an additional list option to reset the selection (e.g. "Select all")
 * @option {string}          textboxClass    Additional textbox class
 * @option {array}           data            Default data
 * @option {string|function} elementIndex    The ID format (default key is "ID"; specify function to overwrite)
 * @option {string|function} elementLabel    Element label or alternative list format (Default returns a:"elem.name")
 * @option {string|function} elementSelect   The label for selected elements or alternative format function
 * @option {object}          elementDefault  Represents a default element, e.g. for "empty" selections
 * @option {string|int}      value           Specifies the default/preset value or simple lists
 * @option {string}          url             The request URL
 * @option {string}          method          The request method (default: GET)
 * @option {string|function} queryParam      The query paramter or a function that returns the request data object (e.g. {search: QUERY, entity: ...})
 * @option {object}          requestData     Default request data
 *
 * @event show     When the selection list is shown
 * @event hide     When the selection list is hidden
 * @event select   When an element is selected
 * @event noselect When no element is selected
 *
 */
gx.bootstrap.SelectDyn = new Class({
	gx: 'gx.bootstrap.SelectDyn',
	Extends: gx.bootstrap.SelectFilter,
	options: {
		'url': './',
		'method': 'GET',
		'queryParam': 'query',
		'parseDefault': false,
		'requestData': {},
		'requestHeader': {},
	},
	_requestChain:[],
	_firstLoad: false,

	initialize: function (display, options) {
		var root = this;
		try {
			if (options.onRequestSuccess == null)
				this.options.parseDefault = true;


			this.addEvent('show', function() {
				if (this._firstLoad)
					return;

				this.search();
				this._firstLoad = true;
			}.bind(this));

			this.parent(display, options);

			if (gx.util.isFunction(this.options.queryParam))
				this.getRequetData = this.options.queryParam.bind(this);

			if (this.options.parseDefault) {
				this.addEvent('requestSuccess', function(json) {
					var r = gx.util.parseResult(json);
					this.setData(gx.util.isArray(r) ? r : []);
				}.bind(this))
			}
		} catch(e) {
			e.message = 'gx.bootstrap.SelectDyn->initialize: ' + e.message;
			throw e;
		}
	},

	getRequetData: function(query, data) {
		data[this.options.queryParam] = query;
		return data;
	},

	_searchQuery: function(query) {
		var r = new Request({
			'method'   : this.options.method,
			'url'      : this.options.url,
			'data'     : this.getRequetData(query, Object.clone(this.options.requestData)),
			'header'   : this.options.requestHeader,
			'onRequest': function() {
				this.showLoader();
			}.bind(this),
			'onComplete': function() {
				this.hideLoader();
				var next = this._requestChain.pop();
				if (next != null && next != r) {
					this._requestChain = []; // Reset the chain, only execute the next request
					next.send();
				}
			}.bind(this),
			'onSuccess': function (json) {
				this.fireEvent('requestSuccess', json);
			}.bind(this),
			'onFailure': function () {
				this.fireEvent('requestFailure');
			}.bind(this)
		});
		this._requestChain.push(r);

		if (this._requestChain.length == 1)
			r.send();
	}
});


gx.bootstrap.SelectDynREST = new Class({
	gx: 'gx.bootstrap.SelectDyn',
	Extends: gx.bootstrap.SelectFilter,
	options: {
		'entity': '',
		'requestData': {},
		'limit': 50,
	},
	_requestChain:[],
	_firstLoad: false,

	data: null,

	initialize: function (display, options) {
		if (options.onRequestSuccess == null)
			this.options.parseDefault = true;


		this.addEvent('show', function() {
			if (this._firstLoad)
				return;

			this.search();
			this._firstLoad = true;
		}.bind(this));

		this.parent(display, options);
	},

	_searchQuery: function(searchText) {
		this.showLoader();

		gx.zeyosREST.Factory.getRESTmodel()
			.listQuery(this.options.entity)
			.limit(this.options.limit)
			.search(searchText)
			.run()
			.then(function(res) {
				this.hideLoader();
				this.data = res.result;
				this.setData(res.result);

			}.bind(this))
			.catch(function(e) {
				this.hideLoader();
				throw e;
			}.bind(this));
	},

	setEntityId: function(id) {
		var item;
		if ( this.data ) {
			item = this.data.findBy('ID', id);
		}

		if ( item ) {
			this.set(item);
			return Promise.resolve();
		}

		if ( !id )
			return Promise.resolve();

		this.showLoader();
		return gx.zeyosREST.Factory.getRESTmodel()
			.itemQuery(this.options.entity, id)
			.run()
			.then(function(res) {
				this.hideLoader();
				if ( res && typeOf(res.result) ) {
					this.set(res.result);
				}

			}.bind(this))
			.catch(function(e) {
				this.hideLoader();
				throw e;
			}.bind(this));
	}
});

