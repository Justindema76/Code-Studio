<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Two routes: load an element's data, save an element's data.
 * Auth is standard WP REST cookie + nonce (same pattern core uses),
 * so no separate API key system to build or maintain.
 */
class JCS_REST {

	private static $instance = null;

	const NAMESPACE_ = 'jcs/v1';

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route(
			self::NAMESPACE_,
			'/element/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_element' ),
					'permission_callback' => array( $this, 'can_edit' ),
					'args'                => array(
					'id' => array(
						'validate_callback' => static function ( $value, $request, $parameter ) {
							return is_numeric( $value ) && (int) $value > 0;
						},
					),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'save_element' ),
					'permission_callback' => array( $this, 'can_edit' ),
					'args'                => array(
					'id' => array(
						'validate_callback' => static function ( $value, $request, $parameter ) {
							return is_numeric( $value ) && (int) $value > 0;
						},
					),
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_,
			'/translate/(?P<id>\d+)',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array( $this, 'translate_element' ),
				'permission_callback' => array( $this, 'can_edit' ),
			)
		);

		register_rest_route(
			self::NAMESPACE_,
			'/elements',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'list_elements' ),
				'permission_callback' => array( $this, 'can_edit' ),
			)
		);
	}

	public function can_edit( $request ) {
		if ( class_exists( 'JCS_Frontend' ) && JCS_Frontend::instance()->has_access() ) return true;
		$id = (int) $request->get_param( 'id' );
		if ( $id ) return current_user_can( 'edit_post', $id );
		return current_user_can( 'edit_posts' );
	}

	public function get_element( WP_REST_Request $request ) {
		$id = (int) $request['id'];
		$post = get_post( $id );
		if ( ! $post || JCS_CPT::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'jcs_not_found', __( 'Element not found.', 'jcs' ), array( 'status' => 404 ) );
		}
		return rest_ensure_response(
			array(
				'id'      => $id,
				'title'   => get_the_title( $id ),
				'type'    => JCS_CPT::get_element_type( $id ),
				'data'    => JCS_CPT::get_data( $id, $this->language( $request ) ),
			)
		);
	}

	public function save_element( WP_REST_Request $request ) {
		$id     = (int) $request['id'];
		$post   = get_post( $id );
		if ( ! $post || JCS_CPT::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'jcs_not_found', __( 'Element not found.', 'jcs' ), array( 'status' => 404 ) );
		}

		$body = $request->get_json_params();
		if ( ! isset( $body['data'] ) || ! is_array( $body['data'] ) ) {
			return new WP_Error( 'jcs_bad_request', __( 'Missing or invalid data payload.', 'jcs' ), array( 'status' => 400 ) );
		}

		JCS_CPT::save_data( $id, $body['data'], $this->language( $request ) );

		if ( 'en' === $this->language( $request ) && ! empty( $body['title'] ) ) {
			wp_update_post(
				array(
					'ID'         => $id,
					'post_title' => sanitize_text_field( $body['title'] ),
				)
			);
		}

		return rest_ensure_response(
			array(
				'id'     => $id,
				'saved'  => true,
				'edited' => current_time( 'mysql' ),
			)
		);
	}

	private function language( WP_REST_Request $request ) {
		return 'fr' === strtolower( (string) $request->get_param( 'lang' ) ) ? 'fr' : 'en';
	}

	private function translate_text( $text ) {
		$text = (string) $text;
		if ( '' === trim( $text ) ) return $text;

		// Primary translator: Google Translate's public web endpoint.
		$url = add_query_arg(
			array( 'client' => 'gtx', 'sl' => 'en', 'tl' => 'fr', 'dt' => 't', 'q' => $text ),
			'https://translate.googleapis.com/translate_a/single'
		);
		$response = wp_remote_get( $url, array( 'timeout' => 15, 'redirection' => 3, 'user-agent' => 'Mozilla/5.0 Justinnovate-Code-Studio/' . JCS_VERSION ) );
		if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
			$json = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( is_array( $json ) && ! empty( $json[0] ) ) {
				$out = '';
				foreach ( $json[0] as $part ) { if ( is_array( $part ) && isset( $part[0] ) ) $out .= $part[0]; }
				if ( '' !== trim( $out ) && $out !== $text ) return $out;
			}
		}

		// Fallback translator so the button does not silently claim success when
		// a host blocks the primary endpoint.
		$fallback_url = add_query_arg(
			array( 'q' => $text, 'langpair' => 'en|fr' ),
			'https://api.mymemory.translated.net/get'
		);
		$fallback = wp_remote_get( $fallback_url, array( 'timeout' => 15, 'redirection' => 3, 'user-agent' => 'Mozilla/5.0 Justinnovate-Code-Studio/' . JCS_VERSION ) );
		if ( ! is_wp_error( $fallback ) && 200 === wp_remote_retrieve_response_code( $fallback ) ) {
			$json = json_decode( wp_remote_retrieve_body( $fallback ), true );
			$out = isset( $json['responseData']['translatedText'] ) ? html_entity_decode( (string) $json['responseData']['translatedText'], ENT_QUOTES | ENT_HTML5, 'UTF-8' ) : '';
			if ( '' !== trim( $out ) && $out !== $text ) return $out;
		}

		return new WP_Error( 'jcs_translation_failed', 'The translation service returned the original English text.' );
	}

	public function translate_element( WP_REST_Request $request ) {
		$id = (int) $request['id'];

		// Always translate from the saved ENGLISH project. The French editor may
		// already contain a copied/older version and must never be used as source.
		$data = JCS_CPT::get_data( $id, 'en' );
		if ( empty( $data ) ) {
			$body = $request->get_json_params();
			$data = ( isset( $body['data'] ) && is_array( $body['data'] ) ) ? $body['data'] : array();
		}
		if ( empty( $data ) ) return new WP_Error( 'jcs_no_english_data', 'No English banner content was found to translate.', array( 'status' => 400 ) );

		// Every human-readable banner field is translated. Design/layout/image
		// settings and URLs remain exactly the same.
		$text_fields = array( 'eyebrow', 'heading', 'subheading', 'buttonText', 'altText' );
		$failures = array();
		foreach ( $data as $slide_index => &$slide ) {
			foreach ( $text_fields as $key ) {
				if ( ! isset( $slide[$key] ) || '' === trim( (string) $slide[$key] ) ) continue;
				$translated = $this->translate_text( $slide[$key] );
				if ( is_wp_error( $translated ) ) {
					$failures[] = 'Banner ' . ( $slide_index + 1 ) . ': ' . $key;
				} else {
					$slide[$key] = $translated;
				}
			}
		}
		unset( $slide );

		if ( ! empty( $failures ) ) {
			return new WP_Error(
				'jcs_translation_incomplete',
				'Translation could not complete these fields: ' . implode( ', ', $failures ) . '. Nothing was saved.',
				array( 'status' => 502 )
			);
		}

		return rest_ensure_response( array( 'data' => $data, 'translated' => true ) );
	}

	public function list_elements( WP_REST_Request $request ) {
		$posts = get_posts(
			array(
				'post_type'      => JCS_CPT::POST_TYPE,
				'posts_per_page' => -1,
				'post_status'    => 'any',
			)
		);
		$out = array();
		foreach ( $posts as $post ) {
			$out[] = array(
				'id'    => $post->ID,
				'title' => $post->post_title ? $post->post_title : __( '(untitled banner)', 'jcs' ),
				'type'  => JCS_CPT::get_element_type( $post->ID ),
			);
		}
		return rest_ensure_response( $out );
	}
}
