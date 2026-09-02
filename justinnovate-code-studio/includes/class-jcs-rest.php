<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Code Studio REST endpoints.
 *
 * WordPress users use normal REST cookie + nonce authentication. Shared
 * Code Studio password sessions use the plugin's own access cookie and are
 * allowed only on the jcs/v1 routes below.
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
		add_filter( 'rest_authentication_errors', array( $this, 'allow_shared_studio_session' ), 110 );
	}

	public function allow_shared_studio_session( $result ) {
		if ( ! $this->is_jcs_rest_request() ) {
			return $result;
		}

		if ( ! class_exists( 'JCS_Frontend' ) || ! JCS_Frontend::instance()->has_access() ) {
			return $result;
		}

		if ( is_wp_error( $result ) && 'rest_cookie_invalid_nonce' === $result->get_error_code() ) {
			return true;
		}

		return $result;
	}

	private function is_jcs_rest_request() {
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
		$path        = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

		if ( false !== strpos( $path, '/wp-json/' . self::NAMESPACE_ . '/' ) ) {
			return true;
		}

		if ( isset( $_GET['rest_route'] ) ) {
			$route = '/' . ltrim( (string) wp_unslash( $_GET['rest_route'] ), '/' );
			return 0 === strpos( $route, '/' . self::NAMESPACE_ . '/' );
		}

		return false;
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
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'translate_element' ),
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
		if ( class_exists( 'JCS_Frontend' ) && JCS_Frontend::instance()->has_access() ) {
			return true;
		}

		$id = (int) $request->get_param( 'id' );
		if ( $id ) {
			return current_user_can( 'edit_post', $id );
		}

		return current_user_can( 'edit_posts' );
	}

	public function get_element( WP_REST_Request $request ) {
		$id   = (int) $request['id'];
		$post = get_post( $id );
		if ( ! $post || JCS_CPT::POST_TYPE !== $post->post_type ) {
			return new WP_Error( 'jcs_not_found', __( 'Element not found.', 'jcs' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response(
			array(
				'id'    => $id,
				'title' => get_the_title( $id ),
				'type'  => JCS_CPT::get_element_type( $id ),
				'data'  => JCS_CPT::get_data( $id, $this->language( $request ) ),
			)
		);
	}

	public function save_element( WP_REST_Request $request ) {
		$id   = (int) $request['id'];
		$post = get_post( $id );
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

	/**
	 * Keep translated text as real UTF-8. This deliberately does not collapse
	 * or invent spaces; it only decodes HTML entities, replaces NBSP with a
	 * normal space, validates UTF-8, and repairs legacy literal u00xx markers
	 * if a translation service ever returns one.
	 */
	private function normalize_translation_output( $text ) {
		$text = html_entity_decode( (string) $text, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		$text = str_replace( "\xC2\xA0", ' ', $text );
		$text = wp_check_invalid_utf8( $text, true );

		$text = preg_replace_callback(
			'/(?<!\\\\)u([0-9a-fA-F]{4})/',
			static function ( $matches ) {
				$decoded = json_decode( '"\\u' . $matches[1] . '"' );
				return is_string( $decoded ) ? $decoded : $matches[0];
			},
			$text
		);

		return is_string( $text ) ? $text : '';
	}

	private function translate_text( $text ) {
		$text = (string) $text;
		if ( '' === trim( $text ) ) {
			return $text;
		}

		$url = add_query_arg(
			array(
				'client' => 'gtx',
				'sl'     => 'en',
				'tl'     => 'fr',
				'dt'     => 't',
				'q'      => $text,
			),
			'https://translate.googleapis.com/translate_a/single'
		);

		$response = wp_remote_get(
			$url,
			array(
				'timeout'     => 15,
				'redirection' => 3,
				'user-agent'  => 'Mozilla/5.0 Justinnovate-Code-Studio/' . JCS_VERSION,
			)
		);

		if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
			$json = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( is_array( $json ) && ! empty( $json[0] ) ) {
				$out = '';
				foreach ( $json[0] as $part ) {
					if ( is_array( $part ) && isset( $part[0] ) ) {
						$out .= $part[0];
					}
				}
				$out = $this->normalize_translation_output( $out );
				if ( '' !== trim( $out ) && $out !== $text ) {
					return $out;
				}
			}
		}

		$fallback_url = add_query_arg(
			array(
				'q'        => $text,
				'langpair' => 'en|fr',
			),
			'https://api.mymemory.translated.net/get'
		);

		$fallback = wp_remote_get(
			$fallback_url,
			array(
				'timeout'     => 15,
				'redirection' => 3,
				'user-agent'  => 'Mozilla/5.0 Justinnovate-Code-Studio/' . JCS_VERSION,
			)
		);

		if ( ! is_wp_error( $fallback ) && 200 === wp_remote_retrieve_response_code( $fallback ) ) {
			$json = json_decode( wp_remote_retrieve_body( $fallback ), true );
			$out  = isset( $json['responseData']['translatedText'] ) ? $this->normalize_translation_output( $json['responseData']['translatedText'] ) : '';
			if ( '' !== trim( $out ) && $out !== $text ) {
				return $out;
			}
		}

		return new WP_Error( 'jcs_translation_failed', 'The translation service returned the original English text.' );
	}

	public function translate_element( WP_REST_Request $request ) {
		$id = (int) $request['id'];

		$data = JCS_CPT::get_data( $id, 'en' );
		if ( empty( $data ) ) {
			$body = $request->get_json_params();
			$data = ( isset( $body['data'] ) && is_array( $body['data'] ) ) ? $body['data'] : array();
		}

		if ( empty( $data ) ) {
			return new WP_Error( 'jcs_no_english_data', 'No English banner content was found to translate.', array( 'status' => 400 ) );
		}

		$text_fields = array( 'eyebrow', 'heading', 'subheading', 'buttonText', 'altText' );
		$failures    = array();

		foreach ( $data as $slide_index => &$slide ) {
			foreach ( $text_fields as $key ) {
				if ( ! isset( $slide[ $key ] ) || '' === trim( (string) $slide[ $key ] ) ) {
					continue;
				}

				$translated = $this->translate_text( $slide[ $key ] );
				if ( is_wp_error( $translated ) ) {
					$failures[] = 'Banner ' . ( $slide_index + 1 ) . ': ' . $key;
				} else {
					$slide[ $key ] = $translated;
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

		return rest_ensure_response(
			array(
				'data'       => $data,
				'translated' => true,
			)
		);
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
