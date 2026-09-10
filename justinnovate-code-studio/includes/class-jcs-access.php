<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Dedicated access role for the front-end Code Studio workspace.
 *
 * Code Studio users authenticate through WordPress, but are redirected away
 * from wp-admin and only receive the temporary post capabilities needed while
 * they are inside the Code Studio front-end or JCS REST routes.
 */
class JCS_Access {

	const ROLE = 'code_studio_user';
	const CAP  = 'use_code_studio';

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'ensure_role' ), 5 );
		add_filter( 'user_has_cap', array( $this, 'grant_studio_caps' ), 20, 4 );
		add_filter( 'login_redirect', array( $this, 'login_redirect' ), 20, 3 );
		add_action( 'admin_init', array( $this, 'block_wp_admin' ), 1 );
		add_filter( 'show_admin_bar', array( $this, 'hide_admin_bar' ) );
	}

	public function ensure_role() {
		$role = get_role( self::ROLE );
		if ( ! $role ) {
			$role = add_role(
				self::ROLE,
				__( 'Code Studio User', 'jcs' ),
				array(
					'read'    => true,
					self::CAP => true,
				)
			);
		} elseif ( ! $role->has_cap( self::CAP ) ) {
			$role->add_cap( self::CAP );
		}

		$administrator = get_role( 'administrator' );
		if ( $administrator && ! $administrator->has_cap( self::CAP ) ) {
			$administrator->add_cap( self::CAP );
		}
	}

	public static function user_is_studio_only( $user = null ) {
		if ( ! $user ) {
			$user = wp_get_current_user();
		}
		return $user instanceof WP_User
			&& $user->exists()
			&& in_array( self::ROLE, (array) $user->roles, true );
	}

	private function is_studio_context() {
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? (string) wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
		$path        = (string) wp_parse_url( $request_uri, PHP_URL_PATH );

		if ( false !== strpos( $path, '/code-studio' ) ) {
			return true;
		}

		if ( false !== strpos( $path, '/wp-json/jcs/v1/' ) ) {
			return true;
		}

		if ( isset( $_GET['rest_route'] ) ) {
			$route = '/' . ltrim( (string) wp_unslash( $_GET['rest_route'] ), '/' );
			if ( 0 === strpos( $route, '/jcs/v1/' ) ) {
				return true;
			}
		}

		return false;
	}

	public function grant_studio_caps( $allcaps, $caps, $args, $user ) {
		// Never call $user->has_cap() from inside user_has_cap; doing so recursively
		// invokes this same filter and can crash WordPress with a critical error.
		if ( ! $user instanceof WP_User || empty( $allcaps[ self::CAP ] ) || ! $this->is_studio_context() ) {
			return $allcaps;
		}

		$allowed = array(
			'read',
			'edit_posts',
			'edit_published_posts',
			'edit_others_posts',
			'delete_posts',
			'delete_published_posts',
			'delete_others_posts',
		);

		foreach ( (array) $caps as $cap ) {
			if ( in_array( $cap, $allowed, true ) ) {
				$allcaps[ $cap ] = true;
			}
		}

		return $allcaps;
	}

	public function login_redirect( $redirect_to, $requested_redirect_to, $user ) {
		if ( $user instanceof WP_User && self::user_is_studio_only( $user ) ) {
			return home_url( '/code-studio/' );
		}
		return $redirect_to;
	}

	public function block_wp_admin() {
		if ( ! self::user_is_studio_only() ) {
			return;
		}

		if ( wp_doing_ajax() ) {
			return;
		}

		wp_safe_redirect( home_url( '/code-studio/' ) );
		exit;
	}

	public function hide_admin_bar( $show ) {
		return self::user_is_studio_only() ? false : $show;
	}
}
