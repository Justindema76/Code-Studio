<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The insertion point inside the normal WordPress editor. This block is
 * intentionally dumb: pick a banner, done. All the actual design work
 * happens in the custom canvas (JCS_Editor); this is just a dynamic block
 * whose render_callback hands off to JCS_Render.
 */
class JCS_Block {

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'register_block' ) );
	}

	public function register_block() {
		wp_register_script(
			'jcs-block-editor',
			JCS_PLUGIN_URL . 'block/index.js',
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-api-fetch', 'wp-server-side-render' ),
			JCS_VERSION,
			true
		);

		register_block_type(
			'jcs/banner',
			array(
				'editor_script'   => 'jcs-block-editor',
				'render_callback' => array( $this, 'render' ),
				'attributes'      => array(
					'bannerId' => array(
						'type'    => 'integer',
						'default' => 0,
					),
				),
			)
		);
	}

	public function render( $attributes ) {
		$id = isset( $attributes['bannerId'] ) ? (int) $attributes['bannerId'] : 0;
		if ( ! $id ) {
			return '';
		}
		return JCS_Render::render( $id );
	}
}
