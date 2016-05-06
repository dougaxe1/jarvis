<?php
/**
 * @file
 * Post Addon
 */

/**
 * Jarvis Filters
 * @return array
 */
add_filter('jarvis_filters', function ( $filters ) {
	// @todo - Automatic filters for each post type?
	return array_merge($filters, array(
		'post' => 'Posts'
	));
});

/**
 * Jarvis Instant
 * @param array $context
 * @return array
 */
add_filter('jarvis_instant', function ( $results, $context ) {
	// @todo - 5 most recently edited posts by this user?
	return $results; // Nothing instant
}, 10, 2);

/**
 * Jarvis Search
 * @param string $q
 * @param array $context
 * @return array
 */
add_filter('jarvis_search', function ( $results, $q, $context ) {
	global $wpdb;
	// Search only when filter is all, or filter is post
	if ( !empty($context['filter']) && $context['filter'] !== 'post' ) return $results;

	$post_types = _jarvis_post_types(); // User friendly labels

	// Split words on whitespace
	$q_words = preg_split('/\s+/', $q, null, PREG_SPLIT_NO_EMPTY);
	$q_words_escaped = array_map('preg_quote', $q_words);
	$q_words_full = array();
	$q_words_start = array();
	$q_words_contain = array();

	// Query parameters
	$params = array();
	foreach ($q_words_escaped as $i => $q_word_escaped) {
		$q_words_full[] = '[[:<:]]' . $q_word_escaped . '[[:>:]]';
		$q_words_start[] = '[[:<:]]' . $q_word_escaped;
		$q_words_contain[] = $q_word_escaped;
	}

	// Sort by relevance of search phrase related to title, key and description
	$relevance = "0"; // Initial value
	foreach ( $q_words as $i => $q_word ) {
		// Keyword matches
		$relevance .= " + if(p.post_name REGEXP %s, 10, 0)";
		$relevance .= " + if(p.post_name REGEXP %s, 10, 0)";
		$relevance .= " + if(p.post_title REGEXP %s, 3, 0)";
		$relevance .= " + if(p.post_title REGEXP %s, 3, 0)";
		$relevance .= " + if(p.post_content REGEXP %s, 1, 0)";
		$relevance .= " + if(p.post_content REGEXP %s, 1, 0)";
		array_push($params, $q_words_full[$i], $q_words_start[$i], $q_words_full[$i], $q_words_start[$i], $q_words_full[$i], $q_words_start[$i]);
	}
	$relevance .= " as 'jarvis_sort' \n";

	// Filter by post type
	$where = "p.post_type IN (" . implode(',', array_fill(0, count($post_types), '%s')) . ") AND ";
	foreach ( array_keys($post_types) as $post_type ) {
		array_push($params, $post_type);
	}
	// Search for matching titles, slug, content, or id
	$where .= "(";
	// Only need to search id if a single numeric word
	if ( count($q_words) === 1 && is_numeric($q) ) {
		$where .= "p.ID = %s OR \n";
		array_push($params, $q);
	}
	$where .= "(1 = 1";
	foreach ( $q_words as $i => $q_word ) {
		$where .= " AND (";
		$where .= " p.post_name REGEXP %s";
		$where .= " OR p.post_title REGEXP %s";
		$where .= " OR p.post_content REGEXP %s";
		$where .= ") \n";
		array_push($params, $q_words_contain[$i], $q_words_contain[$i], $q_words_contain[$i]);
	}
	$where .= ")) \n";

	$query = "SELECT DISTINCT \n" . 
			"	p.ID AS 'id', \n" . 
			"	p.post_type AS 'type', \n" . 
			"	p.post_title AS 'title', \n" . 
			"	p.post_name AS 'slug', \n" .
			"	p.post_content as 'content', \n" .
				$relevance .
			"FROM \n" . 
			"	$wpdb->posts p \n" . 
			"WHERE \n" .
			"	p.post_status NOT IN ('revision', 'auto-draft') AND \n" .
				$where . 
			"ORDER BY \n" .
			"	jarvis_sort DESC, \n" . // Jarvis match best to worst
			"	LENGTH(LOWER(p.post_title)), \n" . // Title length shortest to longest
			"	p.post_modified_gmt DESC \n" . // Updated most recently to oldest
			"LIMIT 20";

	$prepared_query = $wpdb->prepare($query, $params);
	$db_results = $wpdb->get_results($prepared_query);

	foreach ( $db_results as $post ) {
		$results[] = array(
			'id' => $post->id,
			'title' => $post->title,
			'key' => $post->slug,
			'abstract' => wp_trim_words($post->content, 50, '...'),
			'type' => 'post',
			'label' => $post_types[$post->type],
			'actions' => array(
				array(
					'title' => 'Edit',
					'url' => admin_url('post.php?post=' . $post->id . '&action=edit')
				),
				array(
					'title' => 'View',
					'url' => get_permalink($post->id)
				)
			)
		);
	}

	return $results;
}, 10, 3);

/**
 * Internal function to get post types
 * @return array
 */
function _jarvis_post_types( ) {
	$types = array();
	$post_types = get_post_types(array(
			'show_ui' => true
	), 'objects');
	foreach ( $post_types as $post_type => $post ) {
		$types[$post_type] = $post->label;
	}
	return $types;
}