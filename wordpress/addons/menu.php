<?php
/**
 * @file
 * Menu Addon
 */

/**
 * Jarvis Filters
 * @return array
 */
add_filter('jarvis_filters', function ( $filters ) {
	return array_merge($filters, array(
		'menu' => 'Menu items'
	));
});

/**
 * Jarvis Instant
 * @param array $context
 * @return array
 */
add_filter('jarvis_instant', function ( $results, $context ) {
	return $results; // Menu items will be added via JavaScript
}, 10, 2);

/**
 * Jarvis Search
 * @param string $q
 * @param array $context
 * @return array
 */
add_filter('jarvis_search', function ( $results, $q, $context ) {
	// Search only when filter is all, or filter is menu
	if ( !empty($context['filter']) && $context['filter'] !== 'menu' ) return $results;

	return $results; // Nothing new
}, 10, 3);

// Add our menu-crawling JS
add_action('wp_enqueue_scripts', '_jarvis_menu_script');
add_action('admin_enqueue_scripts', '_jarvis_menu_script');

function _jarvis_menu_script( ) {
	wp_register_script('jarvis-menu', plugins_url('js/jarvis-menu.js', dirname(__FILE__)), array('jquery', 'jarvis'), '1.0');
	wp_localize_script('jarvis-menu', 'jarvis_menu', array(
		'separator' => ' » ',
	));
	wp_enqueue_script('jarvis-menu');
}