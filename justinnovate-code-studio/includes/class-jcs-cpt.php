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
	 * Old versions could store a JSON escape after WordPress had stripped its
	 * backslash, leaving literal text such as "imprimu00e9es". Decode only
	 * those six-character Unicode markers back to the single UTF-8 character
	 * they represent. Existing spaces are not changed.
	 */
	private static function repair_broken_unicode_string( $value ) {
		if ( ! is_string( $value ) || false === strpos( $value, 'u' ) ) {
			return $value;
		}

		$repaired = preg_replace_callback(
			'/(?<!\\\\)u([0-9a-fA-F]{4})/',
			static function ( $matches ) {
				$decoded = json_decode( '"\\u' . $matches[1] . '"' );
				return is_string( $decoded ) ? $decoded : $matches[0];
			},
			$value
		);

		return is_string( $repaired ) ? $repaired : $value;
	}

	private static function repair_broken_unicode_values( $value, &$changed = false ) {
		if ( is_array( $value ) ) {
			foreach ( $value as $key => $item ) {
				$value[ $key ] = self::repair_broken_unicode_values( $item, $changed );
			}
			return $value;
		}

		if ( is_string( $value ) ) {
			$repaired = self::repair_broken_unicode_string( $value );
			if ( $repaired !== $value ) {
				$changed = true;
			}
			return $repaired;
		}

		return $value;
	}

	/**
	 * Store native UTF-8 characters directly in JSON. JSON_UNESCAPED_UNICODE
	 * keeps French accents as é/è/à/ç instead of \u00e9-style sequences, while
	 * wp_slash() protects the JSON from WordPress metadata slashing rules.
	 */
	private static function encode_data( array $data ) {
		return wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	}

	/**
	 * The element's config, stored as a single JSON blob. For a banner this
	 * is the `slides` array — same shape the front-end JS canvas already
	 * works with, so the editor doesn't need a translation layer.
	 */
	public static function get_data( $post_id, $lang = 'en' ) {
		$key = ( 'fr' === $lang ) ? '_jcs_data_fr' : ( ( 'us' === $lang ) ? '_jcs_data_us' : '_jcs_data' );
		$raw = get_post_meta( $post_id, $key, true );
		if ( empty( $raw ) ) {
			return array();
		}

		$decoded = json_decode( $raw, true );
		if ( ! is_array( $decoded ) ) {
			return array();
		}

		// One-time self-healing migration for records written by older builds.
		$changed = false;
		$decoded = self::repair_broken_unicode_values( $decoded, $changed );

		if ( $changed ) {
			$json = self::encode_data( $decoded );
			if ( is_string( $json ) ) {
				update_post_meta( $post_id, $key, wp_slash( $json ) );
			}
		}

		return $decoded;
	}

	public static function save_data( $post_id, array $data, $lang = 'en' ) {
		$key  = ( 'fr' === $lang ) ? '_jcs_data_fr' : ( ( 'us' === $lang ) ? '_jcs_data_us' : '_jcs_data' );
		$json = self::encode_data( $data );

		if ( ! is_string( $json ) ) {
			return false;
		}

		return update_post_meta( $post_id, $key, wp_slash( $json ) );
	}

	/** Fields that belong to each language. Everything else always comes from English. */
	const LOCALE_KEYS = array( 'eyebrow', 'heading', 'subheading', 'buttonText', 'altText', 'buttonUrl', 'desktopBgLink', 'mobileBgLink' );

	/**
	 * English is the default: French / USA = the English banner (design, layout,
	 * sizes, colours, images, settings) with that language's own words and links
	 * on top (empty ones fall back to English). Any other setting changed in
	 * French / USA is remembered in "_own" and kept for that language only;
	 * everything not changed there keeps following English. The banner list
	 * always follows English.
	 */
	public static function merge_with_english( array $localized, array $english ) {
		$localized = array_values( $localized );
		$out       = array();
		foreach ( array_values( $english ) as $index => $en_slide ) {
			if ( ! is_array( $en_slide ) ) {
				continue;
			}
			$slide = $en_slide;
			unset( $slide['_own'], $slide['ownImages'] );
			$loc = ( isset( $localized[ $index ] ) && is_array( $localized[ $index ] ) ) ? $localized[ $index ] : null;
			if ( $loc ) {
				foreach ( self::LOCALE_KEYS as $key ) {
					if ( isset( $loc[ $key ] ) && is_string( $loc[ $key ] ) && '' !== trim( $loc[ $key ] ) ) {
						$slide[ $key ] = $loc[ $key ];
					}
				}
				$own = ( isset( $loc['_own'] ) && is_array( $loc['_own'] ) ) ? $loc['_own'] : array();
				if ( ! empty( $loc['ownImages'] ) ) {
					$own['desktopImage'] = true;
					$own['mobileImage']  = true;
				}
				$kept = array();
				foreach ( $own as $key => $flag ) {
					if ( ! $flag || in_array( $key, self::LOCALE_KEYS, true ) || ! array_key_exists( $key, $loc ) ) {
						continue;
					}
					// An emptied image means "use the English image again".
					if ( in_array( $key, array( 'desktopImage', 'mobileImage' ), true ) && ( ! is_string( $loc[ $key ] ) || '' === trim( $loc[ $key ] ) ) ) {
						continue;
					}
					$slide[ $key ] = $loc[ $key ];
					$kept[ $key ]  = true;
				}
				if ( $kept ) {
					$slide['_own'] = $kept;
				}
			}
			$out[] = $slide;
		}
		return $out;
	}

	public static function get_element_type( $post_id ) {
		$type = get_post_meta( $post_id, '_jcs_element_type', true );
		return $type ? $type : 'banner';
	}
}
