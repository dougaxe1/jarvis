<?php
/**
 * @file Collection Interface 
 */

interface JarvisCollection {
	/**
	 * Collection Name
	 * @var string
	 */
	public $name;

	/**
	 * Collection Aliases (will be prefixed with "!")
	 * @return array
	 */
	public function alias();

	/**
	 * Instant results 
	 * @param array $context
	 * @return array
	 */
	public function instant($context);

	/**
	 * Search Results
	 * @param string $term
	 * @param array $context
	 * @return array
	 */
	public function search($term, $context);
}