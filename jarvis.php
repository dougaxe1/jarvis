<?php
/**
 * @file Abstract Jarvis
 */

abstract class Jarvis {

	/**
	 * Singleton instance
	 */
	private static $instance = false;

	/**
	 * Singleton
	 */
	public static function instance ( ) {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

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
	 * Collections
	 * @var array of JarvisCollection indexed by name
	 */
	protected $collections = array();

	/**
	 * Init Jarvis
	 */
	protected function __construct ( ) {
		// Set debug from platform constant

		// Check available
		if ( ! $this->is_available() ) {
			return;
		}
		
		// Load settings

		// Load collections
	}

	/**
	 * [is_available description]
	 * @return bool
	 */
	public function is_available ( ) {
		// User logged in
		// User permissions
		return true;
	}

	/**
	 * Add
	 * @return bool Success
	 */
	public function add ( $collection ) {
		// Check for valid collection
		if ( ! is_a($collection, 'JarvisCollection') || empty($collection->name) ) {
			if ( $this->debug ) throw new Exception(sprintf('Collection of type "%s" is empty or invalid', is_object($collection) ? get_class($collection) : gettype($collection)));
			return false;
		}

		// Check for existence
		if ( array_key_exists($collection->name, $this->collections) ) {
			if ( $this->debug ) throw new Exception(sprintf('Collection "%s" already added', $collection->name));
			return false;
		}

		// Add to array
		$this->collections[$collection->name] = $collection;

		return true;
	}

	/**
	 * Remove
	 * @return bool Success
	 */
	public function remove ( $name ) {
		// Check for existence
		if ( ! array_key_exists($name, $this->collections) ) {
			if ( $this->debug ) throw new Exception(sprintf('Collection with name "%s" does not exist', $name));
			return false;
		}

		// Remove from array
		unset($this->collections[$name]);

		return true;
	}

	/**
	 * Setup Jarvis
	 */
	public function setup ( ) {
		static $setup = false;
		if ( $setup ) return;
		$setup = true;

		if ( ! $this->is_available() ) {
			return;
		}

		// Load settings
		// Load instant items
		// Inject JS
		// Inject CSS
		// Set up menu icons
	}

	/**
	 * Perform Search
	 */
	public function search ( ) {
		if ( ! $this->is_available() ) {
			return;
		}

		// Handle search term
		// Output results
	}
}