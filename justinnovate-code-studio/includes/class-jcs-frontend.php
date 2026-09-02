<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Standalone front-end workspace for Justinnovate Code Studio.
 *
 * /code-studio/ is an app-style route rendered by the plugin itself. It is
 * NOT a themed WordPress Page. WordPress remains the private storage/auth
 * layer in the background.
 */
class JCS_Frontend {
	private static $instance = null;

	const LEGACY_PAGE_OPTION = 'jcs_frontend_page_id';
	const MIGRATION_OPTION   = 'jcs_standalone_route_migrated';

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'template_redirect', array( $this, 'handle_frontend_request' ), 0 );
		add_action( 'init', array( $this, 'cleanup_legacy_page' ), 40 );
		add_action( 'admin_notices', array( $this, 'admin_notice' ) );
	}

	/**
	 * Remove the private WordPress Page created by v0.3.1. The standalone app
	 * no longer needs a Page, shortcode, theme template, header, or footer.
	 */
	public function cleanup_legacy_page() {
		if ( get_option( self::MIGRATION_OPTION ) ) {
			return;
		}

		$page_id = (int) get_option( self::LEGACY_PAGE_OPTION );
		if ( $page_id ) {
			$page = get_post( $page_id );
			if ( $page && 'page' === $page->post_type ) {
				$content = trim( (string) $page->post_content );
				if ( 'code-studio' === $page->post_name && '[justinnovate_code_studio]' === $content ) {
					wp_delete_post( $page_id, true );
				}
			}
			delete_option( self::LEGACY_PAGE_OPTION );
		}

		update_option( self::MIGRATION_OPTION, 1, false );
	}

	public function dashboard_url() {
		return home_url( '/code-studio/' );
	}

	public function editor_url( $post_id, $lang = 'en' ) {
		return add_query_arg(
			array(
				'jcs_edit' => absint( $post_id ),
				'lang'     => ( 'fr' === $lang ? 'fr' : 'en' ),
			),
			$this->dashboard_url()
		);
	}

	private function require_access() {
		if ( ! is_user_logged_in() ) {
			auth_redirect();
			exit;
		}
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die( esc_html__( 'You do not have permission to use Code Studio.', 'jcs' ) );
		}
	}

	/**
	 * Match /code-studio/ directly from REQUEST_URI. This deliberately avoids
	 * creating a WordPress Page or depending on the active theme.
	 */
	private function is_studio_request() {
		$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '';
		$path        = (string) wp_parse_url( $request_uri, PHP_URL_PATH );
		$home_path   = (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH );
		$home_path   = '/' . trim( $home_path, '/' );
		if ( '/' === $home_path ) {
			$home_path = '';
		}
		$expected = $home_path . '/code-studio';
		return untrailingslashit( $path ) === untrailingslashit( $expected );
	}

	/**
	 * Handle all Code Studio front-end requests before the WordPress theme can
	 * render anything.
	 */
	public function handle_frontend_request() {
		if ( ! $this->is_studio_request() ) {
			return;
		}

		$this->require_access();

		// Tell caches/proxies this is a private application screen.
		nocache_headers();
		status_header( 200 );

		if ( isset( $_GET['jcs_edit'] ) ) {
			$post_id = absint( $_GET['jcs_edit'] );
			JCS_Editor::instance()->render_editor( $post_id, true );
			exit;
		}

		if ( 'POST' === strtoupper( isset( $_SERVER['REQUEST_METHOD'] ) ? $_SERVER['REQUEST_METHOD'] : '' ) ) {
			$this->handle_action();
		}

		$this->render_dashboard();
		exit;
	}

	private function handle_action() {
		$action = isset( $_POST['jcs_action'] ) ? sanitize_key( wp_unslash( $_POST['jcs_action'] ) ) : '';
		if ( ! $action ) {
			return;
		}

		if ( 'create' === $action ) {
			check_admin_referer( 'jcs_front_create', 'jcs_nonce' );
			$preset_id = isset( $_POST['preset_id'] ) ? absint( $_POST['preset_id'] ) : 0;
			if ( ! $preset_id ) $preset_id = JCS_Settings::get_default_preset_id();
			if ( $preset_id && ! JCS_Settings::is_preset( $preset_id ) ) $preset_id = 0;
			$id = wp_insert_post(
				array(
					'post_type'   => JCS_CPT::POST_TYPE,
					'post_status' => 'publish',
					'post_title'  => 'New Banner',
				),
				true
			);
			if ( is_wp_error( $id ) ) { wp_die( esc_html( $id->get_error_message() ) ); }
			update_post_meta( $id, '_jcs_element_type', 'banner' );
			if ( $preset_id ) { JCS_CPT::save_data( $id, JCS_CPT::get_data( $preset_id, 'en' ), 'en' ); }
			wp_safe_redirect( $this->editor_url( $id, 'en' ) );
			exit;
		}

		$id = isset( $_POST['post_id'] ) ? absint( $_POST['post_id'] ) : 0;
		if ( ! $id || JCS_CPT::POST_TYPE !== get_post_type( $id ) ) {
			wp_die( esc_html__( 'Builder element not found.', 'jcs' ) );
		}

		if ( 'duplicate' === $action ) {
			check_admin_referer( 'jcs_front_duplicate_' . $id, 'jcs_nonce' );
			if ( ! current_user_can( 'edit_post', $id ) ) {
				wp_die( esc_html__( 'Not allowed.', 'jcs' ) );
			}
			$new = wp_insert_post(
				array(
					'post_type'   => JCS_CPT::POST_TYPE,
					'post_status' => 'publish',
					'post_title'  => get_the_title( $id ) . ' Copy',
				),
				true
			);
			if ( is_wp_error( $new ) ) {
				wp_die( esc_html( $new->get_error_message() ) );
			}
			update_post_meta( $new, '_jcs_element_type', JCS_CPT::get_element_type( $id ) );
			JCS_CPT::save_data( $new, JCS_CPT::get_data( $id, 'en' ), 'en' );
			$fr = JCS_CPT::get_data( $id, 'fr' );
			if ( $fr ) {
				JCS_CPT::save_data( $new, $fr, 'fr' );
			}
			wp_safe_redirect( $this->dashboard_url() );
			exit;
		}

		if ( 'delete' === $action ) {
			check_admin_referer( 'jcs_front_delete_' . $id, 'jcs_nonce' );
			if ( ! current_user_can( 'delete_post', $id ) ) {
				wp_die( esc_html__( 'Not allowed.', 'jcs' ) );
			}
			wp_trash_post( $id );
			wp_safe_redirect( $this->dashboard_url() );
			exit;
		}
	}

	private function render_dashboard() {
		$items = get_posts(
			array(
				'post_type'      => JCS_CPT::POST_TYPE,
				'post_status'    => array( 'publish', 'draft' ),
				'posts_per_page' => -1,
				'orderby'        => 'modified',
				'order'          => 'DESC',
				'meta_query'     => array( array( 'key' => JCS_Settings::PRESET_META, 'compare' => 'NOT EXISTS' ) ),
			)
		);

		$user = wp_get_current_user();
		$studio_settings = JCS_Settings::get();
		$presets = JCS_Settings::presets();
		$default_preset = JCS_Settings::get_default_preset_id();
		?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex,nofollow,noarchive">
	<title>Justinnovate Code Studio</title>
	<style>
		:root{--ink:#17191d;--muted:#68707c;--line:#e6e8ec;--panel:#fff;--bg:#f6f7f9;--brand:<?php echo esc_attr( $studio_settings['accent'] ); ?>;--brand-dark:<?php echo esc_attr( $studio_settings['accent'] ); ?>;--soft:#eef2ff;--danger:#b42318;--green:#117a55}
		*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg)}body{min-height:100vh}
		.jcs-app{min-height:100vh;display:grid;grid-template-columns:240px minmax(0,1fr)}
		.jcs-side{background:<?php echo esc_attr( $studio_settings['workspace_sidebar'] ); ?>;color:#fff;padding:28px 18px;display:flex;flex-direction:column;min-height:100vh;position:sticky;top:0;height:100vh}
		.jcs-brand{padding:4px 10px 30px}.jcs-brand strong{display:block;font-size:17px;letter-spacing:.08em}.jcs-brand span{display:block;font-size:12px;color:#9ca3af;margin-top:5px}
		.jcs-nav{display:grid;gap:8px}.jcs-nav a,.jcs-nav button{width:100%;border:0;text-decoration:none;text-align:left;padding:12px 14px;border-radius:9px;font:700 14px/1.2 inherit;cursor:pointer}.jcs-nav a{color:#d1d5db;background:transparent}.jcs-nav a.active{color:#fff;background:<?php echo esc_attr( $studio_settings['workspace_active'] ); ?>}.jcs-nav button{background:var(--brand);color:#fff}.jcs-nav button:hover{filter:brightness(1.08)}
		.jcs-side-bottom{margin-top:auto;padding:16px 10px 4px;font-size:12px;color:#9ca3af}.jcs-side-bottom a{color:#d1d5db;text-decoration:none}
		.jcs-main{padding:48px 52px 64px;min-width:0}.jcs-shell{max-width:1240px;margin:0 auto}
		.jcs-top{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:30px}.jcs-kicker{text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:800;color:#7b8490;margin-bottom:8px}.jcs-top h1{margin:0;font-size:34px;letter-spacing:-.035em}.jcs-top p{margin:8px 0 0;color:var(--muted);font-size:14px}.jcs-count{font-size:13px;color:var(--muted);white-space:nowrap}
		.jcs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.jcs-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:22px;box-shadow:0 8px 24px rgba(17,24,39,.04)}
		.jcs-card-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.jcs-title{font-weight:800;font-size:18px;line-height:1.25}.jcs-meta{margin-top:8px;color:var(--muted);font-size:12px}.jcs-badges{display:flex;gap:6px;flex-shrink:0}.jcs-badge{font-size:10px;font-weight:800;padding:5px 7px;border-radius:999px;background:#f0f1f3;color:#59616c}.jcs-badge.fr{background:#e7f7f0;color:var(--green)}
		.jcs-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.jcs-actions form{margin:0}.jcs-btn{appearance:none;border:1px solid #d7dbe2;border-radius:8px;padding:10px 13px;background:#fff;color:#222;font:700 13px/1.2 inherit;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}.jcs-btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}.jcs-btn.primary:hover{background:var(--brand-dark)}.jcs-btn.fr{background:var(--soft);border-color:#cdd7ff;color:#294bc6}.jcs-btn.danger{color:var(--danger)}
		.jcs-empty{background:#fff;border:1px dashed #cfd4dc;border-radius:14px;padding:70px 30px;text-align:center}.jcs-empty h2{margin:0 0 8px}.jcs-empty p{margin:0;color:var(--muted)}
		@media(max-width:900px){.jcs-app{grid-template-columns:1fr}.jcs-side{position:relative;height:auto;min-height:auto;padding:16px;flex-direction:row;align-items:center;gap:16px}.jcs-brand{padding:0;margin-right:auto}.jcs-brand span,.jcs-side-bottom{display:none}.jcs-nav{display:flex}.jcs-nav a{display:none}.jcs-nav button{white-space:nowrap}.jcs-main{padding:30px 20px}.jcs-grid{grid-template-columns:1fr}}
		@media(max-width:560px){.jcs-top{align-items:flex-start;flex-direction:column}.jcs-main{padding:24px 14px}.jcs-card{padding:18px}.jcs-actions{display:grid;grid-template-columns:1fr 1fr}.jcs-actions>*{width:100%}.jcs-btn{width:100%}}
	</style>
</head>
<body>
	<div class="jcs-app">
		<aside class="jcs-side">
			<div class="jcs-brand"><strong>CODE STUDIO</strong><span>JustINNOVATE</span></div>
			<nav class="jcs-nav">
				<a class="active" href="<?php echo esc_url( $this->dashboard_url() ); ?>">Banners</a>
				<form method="post" action="<?php echo esc_url( $this->dashboard_url() ); ?>">
					<input type="hidden" name="jcs_action" value="create">
					<?php wp_nonce_field( 'jcs_front_create', 'jcs_nonce' ); ?>
					<?php if ( $presets ) : ?><select name="preset_id" style="width:100%;margin:0 0 8px;padding:9px;border-radius:8px;background:#fff;color:#111"><option value="0">Blank banner</option><?php foreach ( $presets as $preset ) : ?><option value="<?php echo (int) $preset->ID; ?>" <?php selected( $default_preset, $preset->ID ); ?>><?php echo esc_html( $preset->post_title ); ?></option><?php endforeach; ?></select><?php endif; ?>
					<button type="submit">+ New Banner</button>
				</form>
			</nav>
			<div class="jcs-side-bottom">Signed in as <?php echo esc_html( $user->display_name ); ?><br><a href="<?php echo esc_url( wp_logout_url( home_url( '/' ) ) ); ?>">Log out</a></div>
		</aside>

		<main class="jcs-main">
			<div class="jcs-shell">
				<header class="jcs-top">
					<div><div class="jcs-kicker">Workspace</div><h1>Banner projects</h1><p>Create, edit and translate your banners here. WordPress only handles storage in the background.</p></div>
					<div class="jcs-count"><?php echo esc_html( count( $items ) ); ?> project<?php echo 1 === count( $items ) ? '' : 's'; ?></div>
				</header>

				<?php if ( ! $items ) : ?>
					<section class="jcs-empty"><h2>No banners yet</h2><p>Use New Banner to create your first project.</p></section>
				<?php else : ?>
					<section class="jcs-grid">
						<?php foreach ( $items as $item ) :
							$has_fr = (bool) JCS_CPT::get_data( $item->ID, 'fr' );
						?>
						<article class="jcs-card">
							<div class="jcs-card-head">
								<div><div class="jcs-title"><?php echo esc_html( $item->post_title ? $item->post_title : 'Untitled Banner' ); ?></div><div class="jcs-meta">Updated <?php echo esc_html( get_the_modified_date( 'M j, Y · g:i a', $item ) ); ?></div></div>
								<div class="jcs-badges"><span class="jcs-badge">EN</span><?php if ( $has_fr ) : ?><span class="jcs-badge fr">FR</span><?php endif; ?></div>
							</div>
							<div class="jcs-actions">
								<a class="jcs-btn primary" href="<?php echo esc_url( $this->editor_url( $item->ID, 'en' ) ); ?>">Edit English</a>
								<a class="jcs-btn fr" href="<?php echo esc_url( $this->editor_url( $item->ID, 'fr' ) ); ?>"><?php echo $has_fr ? 'Edit French' : 'Create French'; ?></a>
								<form method="post" action="<?php echo esc_url( $this->dashboard_url() ); ?>"><input type="hidden" name="jcs_action" value="duplicate"><input type="hidden" name="post_id" value="<?php echo (int) $item->ID; ?>"><?php wp_nonce_field( 'jcs_front_duplicate_' . $item->ID, 'jcs_nonce' ); ?><button class="jcs-btn" type="submit">Duplicate</button></form>
								<form method="post" action="<?php echo esc_url( $this->dashboard_url() ); ?>" onsubmit="return confirm('Move this banner to Trash?')"><input type="hidden" name="jcs_action" value="delete"><input type="hidden" name="post_id" value="<?php echo (int) $item->ID; ?>"><?php wp_nonce_field( 'jcs_front_delete_' . $item->ID, 'jcs_nonce' ); ?><button class="jcs-btn danger" type="submit">Trash</button></form>
							</div>
						</article>
						<?php endforeach; ?>
					</section>
				<?php endif; ?>
			</div>
		</main>
	</div>
</body>
</html>
		<?php
	}

	/** Admin reminder only; the working UI remains completely front-end. */
	public function admin_notice() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || JCS_CPT::POST_TYPE !== $screen->post_type ) {
			return;
		}
		?>
		<div class="notice notice-info"><p><strong>Justinnovate Code Studio:</strong> Open your standalone workspace at <a href="<?php echo esc_url( $this->dashboard_url() ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $this->dashboard_url() ); ?></a></p></div>
		<?php
	}
}
