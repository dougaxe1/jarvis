(function ( $, jarvis, jarvis_menu ) {
	var self = this;
	// Icons cache
	self.icons = [];
	
	// Init instant results (if empty)
	jarvis.instant = jarvis.instant || [];
	
	// remove child span element counts from section name
	var sanitize = function(elem) {
		return $(elem).clone().find('span').remove().end().text();
	};
	// Trim leading and trailing whitespace from string
	var trim = function(str) {
		return (String.prototype.trim) ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	};

	$(function ( ) {
		// Scrape WordPress menu for sidebar links
		$('#adminmenu a').each(function(i, elem) {
			var prefix, section, title, slug, icon, entry;

			section = $(this).closest('.menu-top');
			prefix = trim(sanitize(section.find('a > .wp-menu-name')));
			title = trim(sanitize(this));

			if (prefix !== '' && prefix !== title) {
				title = prefix + jarvis_menu.separator + title;
			}

			// Get section icon by calculating live background image and position
			icon = (function() {
				var bg = section.find('.wp-menu-image')[0],
					img = section.find('.wp-menu-image img')[0],
					styles,
					classes;

				if (bg && bg.className.indexOf('dashicons-before') > -1) {
					classes = bg.className.split(' ');
					classes.splice($.inArray('wp-menu-image', classes), 1);
					classes.splice($.inArray('dashicons-before', classes), 1);
					return {
						type: 'dashicon',
						icon: classes[0]
					};
				} else if (img) {
					// icon is image (plugin based)
					return {
						type: 'image',
						icon: 'background-image:url(' + img.src + ');background-position:center'
					};
				} else if (bg) {
					// icon is background image, possibly sprite (thus the background-position calculation);
					styles = (window.getComputedStyle) ? window.getComputedStyle(bg, false) : bg.currentStyle;
					if (typeof styles.backgroundPosition === 'string') { //
						return {
							type: 'image',
							icon: 'background-image:' + styles.backgroundImage + ';background-position:' + styles.backgroundPosition
						};
					} else {
						return {
							type: 'image',
							icon: 'background-image:' + styles.backgroundImage + ';background-position-x:'+ styles.backgroundPositionX +';background-position-y:'+ styles.backgroundPositionY
						};
					}
				} else {
					return null;
				}
			})();

			// store reference in icons object to match later with types from server
			self.icons[prefix.toLowerCase()] = icon;

			entry = {
				id: null, // @todo - Is searching menu items by ID useful?
				title: trim(title),
				key: this.href,
				abstract: '',
				type: 'menu',
				label: 'Menu Item',
				actions: [
					{
						title: 'Visit', 
						url: this.href
					}
				]
			};

			if (icon) {
				entry.icontype = icon.type;
				switch(icon.type) {
					case 'dashicon':
						entry.iconclass = 'dashicons-before '+ icon.icon;
						entry.image = '';
					break;
					case 'image':
						entry.iconclass = 'image-icon';
						entry.image = icon.icon;
					break;
				}
			}

			jarvis.instant.push(entry);
		});
	});
})(jQuery, jarvis || {}, jarvis_menu || {});