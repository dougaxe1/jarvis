<?php
/*
Plugin Name:	Jarvis
Description:	Jarvis is your administration assistant, putting WordPress at your fingertips.
Version:		1.0-alpha
*/

class Jarvis {

	/**
	 * Debug will throw exceptions on incorrect behavior
	 * @var bool
	 */
	protected $debug = false;

	/**
	 * Settings
	 * @var array of key => val
	 */
	protected $settings = array();

	/**
	 * Singleton instance
	 */
	private static $instance = false;

	/**
	 * Singleton
	 */
	public static function instance( ) {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct( ) {
		global $wp_version;
		
		$this->debug = defined('WP_DEBUG') && WP_DEBUG;

		// Settings
		$this->settings = array(
			'debug' => $this->debug,
			'hotkey' => '/',
			'keycode' => 191, // JavaScript keycode equivelent
			'search' => array( // Endpoint
				'url' => admin_url( 'admin-ajax.php', 'relative' ),
				'data' => array('action' => 'jarvis-search'),
			),
			'dashicons' => version_compare( $wp_version, '3.8', '>=' ) ? true : false
		);

		add_action('init', array($this, 'init'));
		add_action('wp_enqueue_scripts', array($this, 'setup'));
		add_action('admin_enqueue_scripts', array($this, 'setup'));
		add_action('admin_bar_menu', array($this, 'admin_bar'));
		add_action('wp_ajax_jarvis-search', array($this, 'search'), 1);
	}

	public function install( ) {
		// @todo Custom capabilities beyond "edit_posts"
	}

	/**
	 * Is Jarvis Available?
	 * @return bool
	 */
	public function is_available( ) {
		return is_user_logged_in() && current_user_can('edit_posts');
	}

	/**
	 * Initialize
	 *
	 * @init
	 */
	public function init( ) {
		if ( !$this->is_available() ) return;

		/**
		 * Core Addons
		 * @var array
		 */
		$core_addons = apply_filters('jarvis_core_addons', array('post', 'menu'));
		foreach ( $core_addons as $core_addon ) {
			$path = __DIR__ . '/addons/' . $core_addon . '.php';
			if ( file_exists($path) )
				require_once $path;
		}

		/**
		 * Filter Jarvis Filters
		 * @var array
		 */
		$this->settings['filters'] = apply_filters('jarvis_filters', array());
	}

	/**
	 * Setup
	 *
	 * @wp_enqueue_scripts
	 */
	public function setup( ) {
		if ( !$this->is_available() ) return;

		//
		// CSS
		//
		wp_enqueue_style('jarvis', plugins_url('css/jarvis.css', __FILE__));

		//
		// JavaScript
		//

		// Libraries
		if ( $this->debug ) {
			wp_enqueue_script('typeahead', plugins_url('vendor/typeahead.jquery.js', __FILE__), array('jquery'), '0.11.1');
			wp_enqueue_script('handlebars', plugins_url('vendor/handlebars.min.js', __FILE__), null, '3.0.3');
		} else {
			wp_enqueue_script('typeahead', plugins_url('vendor/typeahead.jquery.min.js', __FILE__), array('jquery'), '0.11.1');
			wp_enqueue_script('handlebars', plugins_url('vendor/handlebars.min.js', __FILE__), null, '3.0.3');
		}
		
		
		// Jarvis JS
		wp_register_script('jarvis', plugins_url('js/jarvis.js', __FILE__), array('typeahead', 'handlebars'), '1.0');
		wp_localize_script('jarvis', 'jarvis', array(
			'settings' => $this->settings, // Jarvis settings
			'context' => $this->create_context(array('ajax' => true)), // AJAX context
			'instant' => $this->instant() // Instant results
		));
		wp_enqueue_script('jarvis');
	}

	/**
	 * Add Jarvis to the menu bar as a search icon
	 *
	 * @admin_bar_menu
	 */
	public function admin_bar( $admin_bar ) {
		if ( !$this->is_available() ) return;

		$className = ($this->settings['dashicons'] === true) ? 'dashicon' : 'image';

		$admin_bar->add_menu(array(
			'id' => 'jarvis_menubar_icon',
			'title' => '<span>Jarvis Search</span>',
			'href' => '#jarvis',
			'meta' => array(
				'title' => 'Invoke Jarvis',
				'class' => $className
			),
			'parent' => 'top-secondary'
		));
	}

	/**
	 * Create context
	 * @param array $context Initial context values
	 * @return array
	 */
	protected function create_context( array $context = array() ) {
		$default = array(
			'instant' => false,
			'ajax' => false,
			'filter' => false,
			'path' => add_query_arg( null, null ),
			'admin' => is_admin(),
			'post' => get_the_ID()
		);
		$context = array_merge($default, $context);

		/**
		 * Filter Jarvis Context
		 * @var array
		 */
		$context = apply_filters('jarvis_context', $context);

		return $context;
	}

	/**
	 * Instant
	 * @return array
	 */
	protected function instant( ) {
		$instant_context = $this->create_context(array('instant' => true));
		$results = array();
		
		/**
		 * Filter instant results
		 * @var array
		 */
		$results = apply_filters('jarvis_instant', array(), $instant_context);

		/**
		 * Filters all instant results
		 * @var array
		 */
		$results = apply_filters('jarvis_instant_results', $results, $instant_context);

		return $results;
	}

	/**
	 * Search
	 */
	public function search( ) {
		if ( !$this->is_available() ) return wp_send_json_error();

		$query = !empty( $_REQUEST['query'] ) ? trim( $_REQUEST['query'] ) : '';
		$ajax_context = !empty( $_REQUEST['context'] ) && is_array( json_decode( stripslashes( $_REQUEST['context'] ), true ) ) ? json_decode( stripslashes( $_REQUEST['context'] ), true ) : array();
		$results = array();

		if ( strlen($query) > 0 ) {
			$ajax_context = $this->create_context($ajax_context);

			/**
			 * Filter results
			 * @var array
			 */
			$results = apply_filters('jarvis_search', $results, $query, $ajax_context);
		}

		/**
		 * Filters all results
		 * @var array
		 */
		$results = apply_filters('jarvis_search_results', $results, $query, $ajax_context);

		// Send response
		wp_send_json_success($results);
	}
}

Jarvis::instance();

