(function ( $, Handlebars, jarvis ) {

	var trim = function( str ) {
		return ( String.prototype.trim ) ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	};
	var caretPos = function( input ) {
		// Loosely based on http://stackoverflow.com/a/12239830
		return 'selectionStart' in input ? input.selectionStart : Math.abs(document.selection.createRange().moveStart('character', -input.value.length));
	}

	// Add methods
	$.extend(jarvis, {

		result_suggestion: Handlebars.compile(
			'<div class="jarvis-result {{type}}">' +
				'<div class="jarvis-result-title">{{title}}</div>' +
				'<div class="jarvis-result-key">{{key}}</div>' +
				'<div class="jarvis-result-abstract">{{abstract}}</div>' +
				'<div class="jarvis-result-meta">' +
					'<div class="jarvis-result-label">{{label}}</div>' +
					'<ul class="jarvis-result-actions">' +
						'{{#each actions}}' +
						'<li class="jarvis-result-action"><a href="{{url}}">{{title}}</a></li>' +
						'{{/each}}' +
					'</ul>' +
				'</div>' +
			'</div>'
		),
		filter_suggestion: Handlebars.compile(
			'<div class="jarvis-result {{filter}}">' +
				'<div class="jarvis-result-title">!{{filter}}</div>' +
				'<div class="jarvis-result-description">{{title}}</div>' +
			'</div>'
		),
		filter_regexp: /!([a-z0-9]*)$/i, // Match the end of the string
		
		/**
		 * Init Jarvis
		 */
		init: function ( ) {
			var self = this; // closure reference to instance

			this.$ = {
				document: $(document),
				body: $('body'),
				modal: $('<div id="jarvis-modal" />'),
				filter: $('<span id="jarvis-filter" />'),
				search: $('<input id="jarvis-search" type="search" />'),
				overlay: $('<div id="jarvis-overlay" />')
			};

			// Add search box to modal
			this.$.modal
				.append(this.$.filter)
				.append(this.$.search);

			// Append modal and overlay to body (display: none)
			this.$.body
				.append(this.$.modal.hide())
				.append(this.$.overlay.hide());

			// Capture keydown events
			// We capture keydown instead of keypress or keyup to short-circut Firefox "quick search"
			this.$.document.on('keydown.jarvis', function ( e ) {
				var target = e.target;
				var tag = target.tagName;
				var keycode = e.keyCode;
				
				// Ignore selects, textareas and content editable
				if ( tag === 'SELECT' || tag === 'TEXTAREA' || target.contentEditable === 'true' ) {
					return;
				}

				// Ignore modified keydown
				if ( e.altkey || e.ctrlKey || e.metaKey || e.shiftKey ) {
					return;
				}

				// Escape key press
				if ( self.isOpen && keycode === 27 ) { 
					self.close(e);
					return;
				}

				// Enter Press
				if ( self.isOpen && tag === 'INPUT' && keycode === 13 ) { 
					self.selectFirst();
					e.preventDefault();
					return;
				}

				// Undo filter on backspace
				if ( self.isOpen && tag === 'INPUT' && keycode === 8 && caretPos(target) === 0 && self.getFilter() ) {
					self.undoFilter();
					e.preventDefault();
					return;
				}

				// Ignore non-Jarvis inputs
				if ( tag === 'INPUT' ) {
					return;
				}

				// Jarvis hotkey
				if ( !self.isOpen && keycode === self.settings.keycode ) {
					e.preventDefault();
					self.open(e);
					return;
				}
			});

			// Close Jarvis when clicking out
			this.$.overlay.on('click.jarvis', function ( e ) {
				self.close(e);
			});

			// Undo filter when clicked
			this.$.filter.on('click.jarvis', function ( e ) {
				self.undoFilter();
			});

			// Init typeahead
			this.$.search.typeahead({
				hint: false,
				highlight: true,
				autoselect: true,
				autocomplete: true
			},
			{
				// Instant
				source: this.instantResults.bind(this),
				async: true, // Prevent from blocking
				name: 'instant',
				limit: 40,
				display: this.resultDisplay.bind(this),
				templates: {
					suggestion: this.result_suggestion
				}
			},
			{
				// Search
				source: this.searchResults.bind(this),
				async: true,
				name: 'search',
				limit: 60,
				display: this.resultDisplay.bind(this),
				templates: {
					suggestion: this.result_suggestion
				}
			},
			{
				// Filter
				source: this.filterResults.bind(this),
				async: false,
				name: 'filter',
				limit: 100,
				display: this.resultDisplay.bind(this),
				templates: {
					suggestion: this.filter_suggestion
				}
			});

			// Typeahead events

			// Prevent closure on click away
			this.$.search.on('typeahead:closed.jarvis', function ( e ) {
				$(this).focus(); // Prevent closure
			});

			// Control item selection behavior
			this.$.search.on('typeahead:selected.jarvis', function ( e, item ) {
				
				if ( item.filter ) {
					// Filter Selected

					// Set Filter
					self.setFilter(item.filter);
					// Clean Query and Reset
					self.setQuery(self.cleanQuery(self.getQuery()));
				
				} else if ( item.actions && item.actions.length === 1 ) {
					// Result selected with only one action

					// Go to the action
					self.go(item.actions[0].url);
				
				} else {
					// Result selected with multiple options
					
					// @todo - Cycle through options

				}

				// Stop selection
				e.preventDefault();
				return false;
			});

			this.$.search.on('typeahead:rendered.jarvis', function ( e, name, items ) {
				// @todo - move cursor to first item
			});
		},

		/**
		 * Safe method of retrieving the current filter
		 * @return string|false
		 */
		getFilter: function ( ) {
			return this.context.filter;
		},

		/**
		 * Sets a filter
		 * @param string filter
		 */
		setFilter: function ( filter ) {
			// Assumes filter has been validated
			this.context.filter = filter;

			if ( filter ) {
				this.$.filter.text('!' + filter);
			} else {
				this.$.filter.text('');
			}
		},

		undoFilter: function ( ) {
			var filter = this.getFilter();
			var query = trim(this.getQuery());
			this.setFilter(false);
			if ( filter ) {
				query = query.length ? query + ' ' : ''; // Add trailing space
				this.setQuery(query + '!' + filter);
			}
		},

		/**
		 * Safe method of retrieving the current query string
		 * @return string
		 */
		getQuery: function ( ) {
			return this.$.search.typeahead('val');
		},

		/**
		 * Sets the query string
		 * If the query has changed, this triggers a search
		 * @param string query
		 */
		setQuery: function ( query ) {
			this.$.search.typeahead('val', query).focus();
		},

		/**
		 * Clean query of any filters
		 * @param string query
		 * @return string
		 */
		cleanQuery: function ( query ) {
			// Remove filter from the query
			query = trim(query.replace(this.filter_regexp, ''));

			return query;
		},

		/**
		 * Typeahead Instant Results
		 */
		instantResults: function ( query, syncResults, asyncResults ) {
			// Only allow 1 concurrent request
			if ( this.instantResultsRequest ) {
				clearTimeout(this.instantResultsRequest);
			}

			if ( query.match(this.filter_regexp) ) {
				return;
			}

			this.instantResultsRequest = setTimeout(function ( ) { // Non-blocking
				// Perform filter on instant results
				var results = this.filter(jarvis.instant, query, this.context.filter);
				// Sort results
				results = this.sort(results, query);

				asyncResults(results);
			}.bind(this), 10);
		},

		/**
		 * Typeahead Search Results
		 */
		searchResults: function ( query, syncResults, asyncResults ) {
			// Only allow 1 concurrent request
			if ( this.searchResultsRequest ) {
				this.searchResultsRequest.abort();
			}

			if ( query.match(this.filter_regexp) ) {
				return;
			}

			this.searchResultsRequest = $.ajax({
				cache: true,
				context: this,
				dataType: 'json',
				global: false, // Prevent global handlers from mucking with our request
				type: 'GET',
				url: this.settings.search.url,
				data: $.extend({}, this.settings.search.data, {
					query: query, 
					context: JSON.stringify(this.context)
				})
			}).done(function ( results ) {
				// Sort results
				results = this.sort(results.data, query);

				asyncResults(results);
			}).always(function ( ) {
				// @todo - Hide spinner
			});
		},

		/**
		 * Typeahead Filter Results
		 */
		filterResults: function ( query, syncResults ) {
			var filter_match = query.match(this.filter_regexp);

			if ( ! filter_match ) {
				return;
			}

			var filter = filter_match[1], // Filter is in either the beginning of the query, or the end
				filter_regexp = new RegExp(filter, 'i'), // Case insensitive
				results = []
			;

			// Perform a basic "contains" search for filters
			for ( var key in this.settings.filters ) {
				if ( ! this.settings.filters.hasOwnProperty(key) ) continue;
				if ( key.match(filter_regexp) ) {
					results.push({
						filter: key,
						title: this.settings.filters[key]
					});
				}
			}

			syncResults(results);
		},

		/**
		 * Typeahead Result Display
		 * Selected result display
		 */
		resultDisplay: function ( result ) {
			return this.getQuery(); // Do not change query
		},

		selectFirst: function ( ) {
			var $selectable = this.$.modal.find('.jarvis-result').eq(0);
			if ( $selectable.length ) {
				this.$.search.typeahead('select', $selectable);
			}
		},

		/**
		 * Resize
		 * @param event e
		 */
		resize: function ( e ) {
			// @todo - Do we need this or can we center with CSS?
		},

		/**
		 * Open
		 * @param event e
		 */
		open: function ( e ) {
			this.isOpen = true;
			this.$.overlay.show();
			this.$.modal.show();
			// Focus and select the search box text
			this.$.search.typeahead('open').select();
		},

		/**
		 * Close
		 * @param event e
		 */
		close: function ( e ) {
			this.$.search.blur(); // @todo - Do we still need this?
			this.$.modal.hide();
			this.$.overlay.hide();
			this.isOpen = false;
		},

		/**
		 * Execute action by visiting the URL
		 * @param string url
		 */
		go: function ( url ) {
			window.location.href = url;
		},

		/**
		 * Perform a Jarvis filter on items
		 * @param array items
		 * @param string q
		 * @param string filter
		 * @return array
		 */
		filter: function ( items, q, filter ) {
			// @todo - Benchmark!
			var results = [];
			var i, j;

			var q_words = q.replace(/^\s+|\s+$/g, '').split(/\s+/g); // Trim and split
			var q_words_count = q_words.length;
			var q_words_contain = [];
			
			// Create regexes for search terms
			(function ( ) {
				var q_word_escaped, q_word_contain;
				for ( i = 0; i < q_words_count; i++ ) {
					// Escape word
					q_word_escaped = q_words[i].replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); // Escape any special characters @link http://stackoverflow.com/a/6969486

					q_word_contain = new RegExp(q_word_escaped, 'i'); // Convert to case insensitive search regex
					q_words_contain.push(q_word_contain);
				};
			})();
			
			// Match items and filter
			(function ( ) {
				var item;
				for ( j = 0; j < items.length; j++ ) {
					item = items[j]; // No copy needed

					// Match filter
					if ( filter && filter !== item.type ) continue;

					// Items must match ALL words
					var matches = false;
					for ( i = 0; i < q_words_count; i++ ) {
						matches = item.key.match(q_words_contain[i])
									|| item.title.match(q_words_contain[i])
									|| item.abstract.match(q_words_contain[i])
						;
						if ( ! matches ) break;
					}
					if ( ! matches ) continue;

					// Add to array
					results.push(item);
				}
			})();

			return results;
		},

		/**
		 * Perform a Jarvis sort on items
		 * @param array items
		 * @param string q
		 * @return array
		 */
		sort: function ( items, q ) {
			// @todo - Benchmark!
			var results = [];
			var i, j;

			var q_words = q.replace(/^\s+|\s+$/g, '').split(/\s+/g); // Trim and split
			var q_words_count = q_words.length;
			var q_words_full = [];
			var q_words_start = [];
			
			// Create regexes for search terms
			(function ( ) {
				var boundry = '[^a-z0-9_]*'; // RegExp Word boundry
				var q_word_escaped, q_word_full, q_word_start;
				for ( i = 0; i < q_words_count; i++ ) {
					// Escape word
					q_word_escaped = q_words[i].replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); // Escape any special characters @link http://stackoverflow.com/a/6969486

					q_word_full = new RegExp(boundry + q_word_escaped + boundry, 'i'); // Convert to case insensitive search regex
					q_words_full.push(q_word_full);

					q_word_start = new RegExp(boundry + q_word_escaped, 'i'); // Convert to case insensitive search regex
					q_words_start.push(q_word_start);
				};
			})();
			
			// Assign Relevance
			(function ( ) {
				var item;
				for ( j = 0; j < items.length; j++ ) {
					// We want a copy because we are modifying the object
					item = JSON.parse(JSON.stringify(items[j])); // @todo - Copy?

					// Items are assigned a relevance
					var sort = 0;
					// +!! converts matches to a numeric 1 or 0
					for ( i = 0; i < q_words_count; i++ ) {
						sort += (item.key ? +!!item.key.match(q_words_full[i]) * 1 : 0)
								+ (item.title ? +!!item.title.match(q_words_full[i]) * 1 : 0)
								+ (item.abstract ? +!!item.abstract.match(q_words_full[i]) * 1 : 0);
						sort += (item.key ? +!!item.key.match(q_words_start[i]) * 1 : 0)
								+ (item.title ? +!!item.title.match(q_words_start[i]) * 1 : 0)
								+ (item.abstract ? +!!item.abstract.match(q_words_start[i]) * 1 : 0);
					}
					item.sort = sort; // Sorting key

					// Add to array
					results.push(item);
				}
			})();
			
			// Sort items
			results.sort(function( a, b ) {
				if (a.sort === b.sort && a.title.length === b.title.length) {
					return 0; // Absolute tie
				} else if ( a.sort === b.sort ) {
					return a.title.length > b.title.length ? 1 : -1; // Greater is lower
				}
				return a.sort > b.sort ? -1 : 1; // Greater is higher
			});

			return results;
		}
	});

	$(function ( ) {
		jarvis.init();
	});
})(jQuery, Handlebars, jarvis || {});