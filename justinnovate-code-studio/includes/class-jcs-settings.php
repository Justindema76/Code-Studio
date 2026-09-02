<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Admin-controlled Code Studio appearance + reusable preset manager.
 * Nothing here changes a saved banner unless the user explicitly uses a preset.
 */
class JCS_Settings {
	private static $instance = null;
	const OPTION = 'jcs_studio_settings';
	const PRESET_META = '_jcs_is_preset';
	const DEFAULT_PRESET_OPTION = 'jcs_default_preset_id';

	public static function instance() {
		if ( null === self::$instance ) self::$instance = new self();
		return self::$instance;
	}

	private function __construct() {
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'admin_post_jcs_save_settings', array( $this, 'save_settings' ) );
		add_action( 'admin_post_jcs_create_preset', array( $this, 'create_preset' ) );
		add_action( 'admin_post_jcs_delete_preset', array( $this, 'delete_preset' ) );
		add_action( 'admin_post_jcs_set_default_preset', array( $this, 'set_default_preset' ) );
	}

	public static function defaults() {
		return array(
			'accent'            => '#3157DF',
			'workspace_sidebar' => '#111827',
			'workspace_active'  => '#27334C',
			'eyebrow_bg'        => '#3157DF',
			'button_bg'         => '#3157DF',
			'dash_color'        => '#3157DF',
			'swatches'          => '#000000,#404040,#737373,#a6a6a6,#d9d9d9,#ffffff,#e53935,#fb8c00,#fdd835,#43a047,#26c6da,#1e88e5,#3157df,#d81b60',
			'fonts'             => "Oswald\nInter\nArial\nGeorgia\nImpact\nMontserrat\nRoboto\nOpen Sans\nPoppins\nLato\nBebas Neue\nAnton\nBarlow Condensed\nRoboto Condensed\nPlayfair Display\nMerriweather",
		);
	}

	public static function get() {
		$saved = get_option( self::OPTION, array() );
		return wp_parse_args( is_array( $saved ) ? $saved : array(), self::defaults() );
	}

	public static function get_default_preset_id() {
		$id = absint( get_option( self::DEFAULT_PRESET_OPTION, 0 ) );
		return $id && self::is_preset( $id ) ? $id : 0;
	}

	public static function is_preset( $post_id ) {
		return '1' === (string) get_post_meta( $post_id, self::PRESET_META, true );
	}

	public static function presets() {
		return get_posts( array(
			'post_type'      => JCS_CPT::POST_TYPE,
			'post_status'    => array( 'publish', 'draft' ),
			'posts_per_page' => -1,
			'orderby'        => 'title',
			'order'          => 'ASC',
			'meta_key'       => self::PRESET_META,
			'meta_value'     => '1',
		) );
	}


	public static function sanitize_fonts( $value ) {
		$lines = preg_split( '/[\r\n,]+/', (string) $value );
		$fonts = array();
		foreach ( $lines as $font ) {
			$font = trim( sanitize_text_field( $font ) );
			if ( '' !== $font && ! in_array( $font, $fonts, true ) ) $fonts[] = $font;
		}
		return implode( "\n", $fonts );
	}

	public static function font_list() {
		$s = self::get();
		$fonts = preg_split( '/[\r\n,]+/', (string) ( $s['fonts'] ?? '' ) );
		$fonts = array_values( array_filter( array_map( 'trim', $fonts ) ) );
		return $fonts ? $fonts : array( 'Oswald', 'Inter', 'Arial', 'Georgia' );
	}

	public static function google_fonts_url( $fonts = null ) {
		$fonts = is_array( $fonts ) ? $fonts : self::font_list();
		$system = array_map( 'strtolower', array( 'Arial','Georgia','Impact','Verdana','Tahoma','Trebuchet MS','Times New Roman','Courier New','system-ui' ) );
		$families = array();
		foreach ( $fonts as $font ) {
			if ( in_array( strtolower( $font ), $system, true ) ) continue;
			$families[] = 'family=' . rawurlencode( $font ) . ':wght@400;500;600;700;800;900';
		}
		if ( ! $families ) return '';
		return 'https://fonts.googleapis.com/css2?' . implode( '&', $families ) . '&display=swap';
	}

	public function admin_menu() {
		add_submenu_page(
			'edit.php?post_type=' . JCS_CPT::POST_TYPE,
			'Code Studio Settings',
			'Fonts & Presets',
			'manage_options',
			'jcs-settings',
			array( $this, 'render_page' )
		);
	}

	private function color( $value, $fallback ) {
		$value = sanitize_hex_color( $value );
		return $value ? strtoupper( $value ) : $fallback;
	}

	public function save_settings() {
		if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Not allowed.' );
		check_admin_referer( 'jcs_save_settings' );
		$d = self::defaults();
		$raw = isset( $_POST['settings'] ) && is_array( $_POST['settings'] ) ? wp_unslash( $_POST['settings'] ) : array();
		$out = array(
			'accent'            => $this->color( $raw['accent'] ?? '', $d['accent'] ),
			'workspace_sidebar' => $this->color( $raw['workspace_sidebar'] ?? '', $d['workspace_sidebar'] ),
			'workspace_active'  => $this->color( $raw['workspace_active'] ?? '', $d['workspace_active'] ),
			'eyebrow_bg'        => $this->color( $raw['eyebrow_bg'] ?? '', $d['eyebrow_bg'] ),
			'button_bg'         => $this->color( $raw['button_bg'] ?? '', $d['button_bg'] ),
			'dash_color'        => $this->color( $raw['dash_color'] ?? '', $d['dash_color'] ),
			'swatches'          => sanitize_text_field( $raw['swatches'] ?? $d['swatches'] ),
			'fonts'             => self::sanitize_fonts( $raw['fonts'] ?? $d['fonts'] ),
		);
		update_option( self::OPTION, $out, false );
		wp_safe_redirect( add_query_arg( array( 'post_type' => JCS_CPT::POST_TYPE, 'page' => 'jcs-settings', 'saved' => '1' ), admin_url( 'edit.php' ) ) );
		exit;
	}

	public function create_preset() {
		if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Not allowed.' );
		check_admin_referer( 'jcs_create_preset' );
		$source_id = isset( $_POST['source_id'] ) ? absint( $_POST['source_id'] ) : 0;
		$name = isset( $_POST['preset_name'] ) ? sanitize_text_field( wp_unslash( $_POST['preset_name'] ) ) : '';
		if ( ! $source_id || JCS_CPT::POST_TYPE !== get_post_type( $source_id ) || self::is_preset( $source_id ) ) wp_die( 'Choose a valid banner project.' );
		if ( '' === $name ) $name = get_the_title( $source_id ) . ' Preset';
		$id = wp_insert_post( array( 'post_type' => JCS_CPT::POST_TYPE, 'post_status' => 'publish', 'post_title' => $name ), true );
		if ( is_wp_error( $id ) ) wp_die( esc_html( $id->get_error_message() ) );
		update_post_meta( $id, '_jcs_element_type', 'banner' );
		update_post_meta( $id, self::PRESET_META, '1' );
		JCS_CPT::save_data( $id, JCS_CPT::get_data( $source_id, 'en' ), 'en' );
		wp_safe_redirect( add_query_arg( array( 'post_type' => JCS_CPT::POST_TYPE, 'page' => 'jcs-settings', 'preset_created' => '1' ), admin_url( 'edit.php' ) ) );
		exit;
	}

	public function delete_preset() {
		if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Not allowed.' );
		$id = isset( $_POST['preset_id'] ) ? absint( $_POST['preset_id'] ) : 0;
		check_admin_referer( 'jcs_delete_preset_' . $id );
		if ( ! self::is_preset( $id ) ) wp_die( 'Preset not found.' );
		if ( self::get_default_preset_id() === $id ) delete_option( self::DEFAULT_PRESET_OPTION );
		wp_trash_post( $id );
		wp_safe_redirect( add_query_arg( array( 'post_type' => JCS_CPT::POST_TYPE, 'page' => 'jcs-settings', 'preset_deleted' => '1' ), admin_url( 'edit.php' ) ) );
		exit;
	}

	public function set_default_preset() {
		if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Not allowed.' );
		$id = isset( $_POST['preset_id'] ) ? absint( $_POST['preset_id'] ) : 0;
		check_admin_referer( 'jcs_set_default_preset' );
		if ( 0 === $id ) delete_option( self::DEFAULT_PRESET_OPTION );
		elseif ( self::is_preset( $id ) ) update_option( self::DEFAULT_PRESET_OPTION, $id, false );
		wp_safe_redirect( add_query_arg( array( 'post_type' => JCS_CPT::POST_TYPE, 'page' => 'jcs-settings', 'default_saved' => '1' ), admin_url( 'edit.php' ) ) );
		exit;
	}

	public function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) return;
		$s = self::get();
		$presets = self::presets();
		$default_id = self::get_default_preset_id();
		$projects = get_posts( array(
			'post_type' => JCS_CPT::POST_TYPE, 'post_status' => array( 'publish','draft' ), 'posts_per_page' => -1,
			'orderby' => 'modified', 'order' => 'DESC',
			'meta_query' => array( array( 'key' => self::PRESET_META, 'compare' => 'NOT EXISTS' ) ),
		) );
		?>
		<div class="wrap">
			<h1>Code Studio Settings</h1>
			<p>Change the Studio once here. These settings become the defaults for new blank banners and the Studio interface.</p>
			<?php if ( isset( $_GET['saved'] ) ) : ?><div class="notice notice-success is-dismissible"><p>Studio settings saved.</p></div><?php endif; ?>
			<style>
			.jcs-admin-grid{display:grid;grid-template-columns:minmax(0,700px) minmax(320px,1fr);gap:24px;align-items:start}.jcs-admin-card{background:#fff;border:1px solid #dcdcde;padding:22px;border-radius:4px}.jcs-admin-card h2{margin-top:0}.jcs-color-row{display:grid;grid-template-columns:220px 90px 1fr;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid #eee}.jcs-color-row:last-child{border-bottom:0}.jcs-color-row input[type=text]{width:120px}.jcs-preset{display:grid;grid-template-columns:1fr auto;gap:12px;padding:14px 0;border-bottom:1px solid #eee}.jcs-preset:last-child{border-bottom:0}.jcs-preset-actions{display:flex;gap:8px;align-items:center}.jcs-preset-actions form{margin:0}@media(max-width:1000px){.jcs-admin-grid{grid-template-columns:1fr}}
			</style>
			<div class="jcs-admin-grid">
				<div class="jcs-admin-card">
					<h2>Studio colours & defaults</h2>
					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
						<input type="hidden" name="action" value="jcs_save_settings"><?php wp_nonce_field( 'jcs_save_settings' ); ?>
						<?php
						$fields = array(
							'accent' => array( 'Studio accent', 'Buttons, selected tabs and editor accent.' ),
							'workspace_sidebar' => array( 'Workspace sidebar', 'The /code-studio/ sidebar background.' ),
							'workspace_active' => array( 'Workspace active item', 'Selected item in the workspace sidebar.' ),
							'eyebrow_bg' => array( 'New banner eyebrow', 'Default eyebrow background on a new blank banner.' ),
							'button_bg' => array( 'New banner button', 'Default button background on a new blank banner.' ),
							'dash_color' => array( 'New banner slider dash', 'Default slider/dash accent on a new blank banner.' ),
						);
						foreach ( $fields as $key => $label ) : ?>
						<div class="jcs-color-row"><strong><?php echo esc_html( $label[0] ); ?></strong><input type="color" value="<?php echo esc_attr( $s[$key] ); ?>" oninput="this.nextElementSibling.value=this.value"><input type="text" name="settings[<?php echo esc_attr( $key ); ?>]" value="<?php echo esc_attr( $s[$key] ); ?>"><span class="description"><?php echo esc_html( $label[1] ); ?></span></div>
						<?php endforeach; ?>
						<p><strong>Colour swatches</strong></p><p><input class="large-text" type="text" name="settings[swatches]" value="<?php echo esc_attr( $s['swatches'] ); ?>"></p><p class="description">Comma-separated hex colours shown under colour pickers in the editor.</p>
						<hr style="margin:24px 0">
						<h2 style="margin-bottom:6px">Editor font library</h2>
						<p class="description">One font per line. Add or remove fonts here and the typography dropdowns in Code Studio update automatically. Google Fonts are loaded automatically; common system fonts such as Arial, Georgia and Impact use the browser font.</p>
						<textarea name="settings[fonts]" rows="14" class="large-text code" style="max-width:520px"><?php echo esc_textarea( $s['fonts'] ); ?></textarea>
						<p><strong>Included starter fonts:</strong> Oswald, Inter, Arial, Georgia, Impact, Montserrat, Roboto, Open Sans, Poppins, Lato, Bebas Neue, Anton, Barlow Condensed, Roboto Condensed, Playfair Display and Merriweather.</p>
						<?php submit_button( 'Save Studio Settings' ); ?>
					</form>
				</div>

				<div class="jcs-admin-card">
					<h2>Reusable presets</h2>
					<p>Create a preset from a banner you already designed. Then edit that preset in the same full-screen Studio and use it whenever you make a new banner.</p>
					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="padding:12px 0 20px;border-bottom:1px solid #ddd;">
						<input type="hidden" name="action" value="jcs_create_preset"><?php wp_nonce_field( 'jcs_create_preset' ); ?>
						<p><label><strong>Banner to copy</strong></label><br><select name="source_id" required style="min-width:280px"><option value="">Choose a banner…</option><?php foreach ( $projects as $p ) : ?><option value="<?php echo (int) $p->ID; ?>"><?php echo esc_html( $p->post_title ); ?></option><?php endforeach; ?></select></p>
						<p><label><strong>Preset name</strong></label><br><input type="text" name="preset_name" class="regular-text" placeholder="My banner preset"></p>
						<?php submit_button( 'Create Preset', 'secondary', 'submit', false ); ?>
					</form>

					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="padding:18px 0;border-bottom:1px solid #ddd;">
						<input type="hidden" name="action" value="jcs_set_default_preset"><?php wp_nonce_field( 'jcs_set_default_preset' ); ?>
						<label><strong>Default for + New Banner</strong></label><br><select name="preset_id" style="min-width:280px"><option value="0">Blank banner</option><?php foreach ( $presets as $p ) : ?><option value="<?php echo (int) $p->ID; ?>" <?php selected( $default_id, $p->ID ); ?>><?php echo esc_html( $p->post_title ); ?></option><?php endforeach; ?></select> <?php submit_button( 'Save Default', 'secondary', 'submit', false ); ?>
					</form>

					<?php if ( ! $presets ) : ?><p style="padding-top:14px">No presets yet.</p><?php else : foreach ( $presets as $preset ) : ?>
					<div class="jcs-preset"><div><strong><?php echo esc_html( $preset->post_title ); ?></strong><?php if ( $default_id === $preset->ID ) : ?> <span style="color:#2271b1">(default)</span><?php endif; ?><div class="description">Edit the design, colours, images and layout exactly like a normal banner.</div></div><div class="jcs-preset-actions"><a class="button button-primary" href="<?php echo esc_url( JCS_Frontend::instance()->editor_url( $preset->ID, 'en' ) ); ?>">Edit Preset</a><form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('Delete this preset?')"><input type="hidden" name="action" value="jcs_delete_preset"><input type="hidden" name="preset_id" value="<?php echo (int) $preset->ID; ?>"><?php wp_nonce_field( 'jcs_delete_preset_' . $preset->ID ); ?><button class="button" type="submit">Delete</button></form></div></div>
					<?php endforeach; endif; ?>
				</div>
			</div>
		</div>
		<?php
	}
}
