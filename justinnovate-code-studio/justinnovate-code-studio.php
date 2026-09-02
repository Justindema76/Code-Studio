<?php
/**
 * Plugin Name: Justinnovate Code Studio
 * Description: A lightweight, block-based page builder with a custom full-screen canvas editor. Starts with a Banner (hero slider) element.
 * Version: 0.3.18
 * Author: Justin DeMatteis
 * Text Domain: jcs
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'JCS_VERSION', '0.3.18' );
define( 'JCS_PLUGIN_FILE', __FILE__ );
define( 'JCS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JCS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once JCS_PLUGIN_DIR . 'includes/class-jcs-cpt.php';
require_once JCS_PLUGIN_DIR . 'includes/class-jcs-rest.php';
require_once JCS_PLUGIN_DIR . 'includes/class-jcs-editor.php';
require_once JCS_PLUGIN_DIR . 'includes/class-jcs-render.php';
require_once JCS_PLUGIN_DIR . 'includes/class-jcs-settings.php';
require_once JCS_PLUGIN_DIR . 'includes/class-jcs-frontend.php';
require_once JCS_PLUGIN_DIR . 'includes/class-jcs-block.php';

/**
 * Core bootstrap. Everything else hooks off of these classes.
 */
final class JCS_Plugin {

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		JCS_CPT::instance();
		JCS_REST::instance();
		JCS_Editor::instance();
		JCS_Frontend::instance();
		JCS_Settings::instance();
		JCS_Block::instance();

		register_activation_hook( JCS_PLUGIN_FILE, array( $this, 'on_activate' ) );
	}

	public function on_activate() {
		// WordPress stores the data; Code Studio itself is a standalone front-end route.
		JCS_CPT::instance()->register_post_type();
		flush_rewrite_rules();
	}
}

JCS_Plugin::instance();
