<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the storage post type for every element the builder can create.
 *
 * Today that's only "banner", but the post type is generic (jcs_element) with
 * an `element_type` meta field so future block types (text, grid, etc.) reuse
 * the same storage + REST plumbing instead of needing their own CPT.
 */
class JCS_CPT {

	private static $instance = null;

	const POST_TYPE = 'jcs_element';

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_action( 'add_meta_boxes', array( $this, 'add_edit_row_link' ) );
		add_filter( 'post_row_actions', array( $this, 'add_row_action' ), 10, 2 );
	}

	public function register_post_type() {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'       => array(
					'name'          => __( 'Code Studio', 'jcs' ),
					'singular_name' => __( 'Banner', 'jcs' ),
					'menu_name'     => __( 'Code Studio', 'jcs' ),
					'all_items'     => __( 'Banners', 'jcs' ),
					'add_new'       => __( 'Add Banner', 'jcs' ),
					'add_new_item'  => __( 'Add Banner', 'jcs' ),
				),
				'public'       => false,
				'show_ui'      => true,
				'show_in_menu' => true,
				'menu_icon'    => 'dashicons-images-alt2',
				'supports'     => array( 'title' ),
				'show_in_rest' => true,
				'rest_base'    => 'jcs-elements',
			)
		);
	}

	/**
	 * Not a real meta box — just piggybacking the hook to make sure the
	 * default WP editor never renders for this post type. We replace it
	 * entirely with our own full-screen canvas.
	 */
	public function add_edit_row_link() {
		remove_post_type_support( self::POST_TYPE, 'editor' );
	}

	public function add_row_action( $actions, $post ) {
		if ( self::POST_TYPE !== $post->post_type ) {
			return $actions;
		}
		$edit_url = JCS_Frontend::instance()->editor_url( $post->ID, 'en' );
		$actions  = array( 'jcs_edit' => '<a href="' . esc_url( $edit_url ) . '">' . esc_html__( 'Edit with Builder', 'jcs' ) . '</a>' ) + $actions;
		unset( $actions['inline hide-if-no-js'] );
		return $actions;
	}

	/**
	 * Repair Unicode escapes that were previously stored without the leading
	 * backslash (for example "u00e9" instead of "\\u00e9"). This only runs
	 * when the raw JSON cannot be decoded as-is, so valid text is left alone.
	 */
	private static function repair_broken_unicode_json( $raw ) {
		$repaired = preg_replace( '/(?<!\\\\)u([0-9a-fA-F]{4})/', '\\\\u$1', $raw );
		return is_string( $repaired ) ? $repaired : $raw;
	}

	/**
	 * The element's config, stored as a single JSON blob. For a banner this
	 * is the `slides` array — same shape the front-end JS canvas already
	 * works with, so the editor doesn't need a translation layer.
	 */
	public static function get_data( $post_id, $lang = 'en' ) {
		$key = ( 'fr' === $lang ) ? '_jcs_data_fr' : '_jcs_data';
		$raw = get_post_meta( $post_id, $key, true );
		if ( empty( $raw ) ) {
			return array();
		}

		$decoded = json_decode( $raw, true );
		if ( is_array( $decoded ) ) {
			return $decoded;
		}

		$repaired = self::repair_broken_unicode_json( $raw );
		$decoded  = json_decode( $repaired, true );
		if ( is_array( $decoded ) ) {
			// Heal legacy corrupted data the first time it is successfully read.
			update_post_meta( $post_id, $key, wp_slash( wp_json_encode( $decoded ) ) );
			return $decoded;
		}

		return array();
	}

	public static function save_data( $post_id, array $data, $lang = 'en' ) {
		$key = ( 'fr' === $lang ) ? '_jcs_data_fr' : '_jcs_data';

		// update_post_meta() unslashes values before storing them. Slash the JSON
		// first so Unicode escape sequences such as \\u00e9 survive intact.
		return update_post_meta( $post_id, $key, wp_slash( wp_json_encode( $data ) ) );
	}

	public static function get_element_type( $post_id ) {
		$type = get_post_meta( $post_id, '_jcs_element_type', true );
		return $type ? $type : 'banner';
	}
}
