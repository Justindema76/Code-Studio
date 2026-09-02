<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Renders the distraction-free canvas editor, bypassing normal wp-admin
 * chrome (admin bar, menu, etc.) the same way Elementor's `?action=elementor`
 * screen does — this file prints its own <html> document.
 */
class JCS_Editor {

	private static $instance = null;

	const QUERY_VAR = 'jcs_editor';

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'admin_menu', array( $this, 'register_hidden_page' ) );
		add_action( 'current_screen', array( $this, 'maybe_render_editor' ) );
	}

	public function register_hidden_page() {
		add_submenu_page(
			null,
			__( 'Builder Canvas', 'jcs' ),
			__( 'Builder Canvas', 'jcs' ),
			'edit_posts',
			'jcs-editor',
			array( $this, 'render_editor' )
		);
	}

	public function get_editor_url( $post_id, $lang = 'en' ) {
		return add_query_arg(
			array(
				'page' => 'jcs-editor',
				'post' => $post_id,
				'lang' => $lang,
			),
			admin_url( 'admin.php' )
		);
	}

	public function maybe_render_editor( $screen ) {
		if ( ! isset( $screen->id ) || false === strpos( $screen->id, 'jcs-editor' ) ) {
			return;
		}
		$this->render_editor();
		exit;
	}

	public function render_editor( $forced_post_id = 0, $frontend = false ) {
		$post_id = $forced_post_id ? (int) $forced_post_id : ( isset( $_GET['post'] ) ? (int) $_GET['post'] : 0 );
		$lang = ( isset( $_GET['lang'] ) && 'fr' === strtolower( sanitize_text_field( wp_unslash( $_GET['lang'] ) ) ) ) ? 'fr' : 'en';
		$post    = $post_id ? get_post( $post_id ) : null;

		if ( ! $post || JCS_CPT::POST_TYPE !== $post->post_type ) {
			wp_die( esc_html__( 'Banner not found.', 'jcs' ) );
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			wp_die( esc_html__( 'You do not have permission to edit this.', 'jcs' ) );
		}

		$data = JCS_CPT::get_data( $post_id, $lang );
		$studio_settings = JCS_Settings::get();
		if ( 'fr' === $lang && empty( $data ) ) { $data = JCS_CPT::get_data( $post_id, 'en' ); }

		wp_enqueue_style( 'jcs-editor', JCS_PLUGIN_URL . 'editor/css/editor.css', array(), JCS_VERSION );
		$font_url = JCS_Settings::google_fonts_url();
		if ( $font_url ) wp_enqueue_style( 'jcs-fonts', $font_url, array(), null );
		wp_enqueue_script( 'jcs-editor', JCS_PLUGIN_URL . 'editor/js/editor.js', array(), JCS_VERSION, true );
		wp_add_inline_style( 'jcs-editor', ':root{--accent:' . esc_attr( $studio_settings['accent'] ) . ';}' );

		wp_localize_script(
			'jcs-editor',
			'JCS_EDITOR_DATA',
			array(
				'postId'    => $post_id,
				'title'     => get_the_title( $post_id ),
				'slides'    => $data,
				'restUrl'   => esc_url_raw( add_query_arg( 'lang', $lang, rest_url( 'jcs/v1/element/' . $post_id ) ) ),
				'translateUrl' => esc_url_raw( rest_url( 'jcs/v1/translate/' . $post_id ) ),
				'language'  => $lang,
				'languageLabel' => ( 'fr' === $lang ? 'French' : 'English' ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'settings'  => $studio_settings,
				'isPreset'  => JCS_Settings::is_preset( $post_id ),
				'listUrl'   => $frontend ? JCS_Frontend::instance()->dashboard_url() : admin_url( 'edit.php?post_type=' . JCS_CPT::POST_TYPE ),
				'englishUrl'=> JCS_Frontend::instance()->editor_url( $post_id, 'en' ),
				'frenchUrl' => JCS_Frontend::instance()->editor_url( $post_id, 'fr' ),
			)
		);

		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo esc_html( sprintf( __( 'Editing: %s', 'jcs' ), get_the_title( $post_id ) ) ); ?></title>
	<?php wp_print_styles(); ?>
</head>
<body class="jcs-editor-body">
	<div id="jcs-root"></div>
	<?php wp_print_scripts(); ?>
</body>
</html>
		<?php
	}
}
