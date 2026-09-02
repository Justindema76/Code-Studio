from pathlib import Path
import re

front_path = Path('justinnovate-code-studio/includes/class-jcs-frontend.php')
front = front_path.read_text()

if "ACCESS_HASH_OPTION" not in front:
    front = front.replace(
        "\tconst MIGRATION_OPTION   = 'jcs_standalone_route_migrated';\n",
        "\tconst MIGRATION_OPTION   = 'jcs_standalone_route_migrated';\n"
        "\tconst ACCESS_HASH_OPTION = 'jcs_studio_access_password_hash';\n"
        "\tconst ACCESS_COOKIE      = 'jcs_studio_access';\n"
        "\tconst ACCESS_TTL         = 2592000; // 30 days.\n"
    )

old_require = re.compile(r"\n\tprivate function require_access\(\) \{.*?\n\t\}\n\n\t/\*\*\n\t \* Match /code-studio/", re.S)
new_require = '''
\tprivate function access_hash() {
\t\treturn (string) get_option( self::ACCESS_HASH_OPTION, '' );
\t}

\tprivate function access_signature( $expires, $hash ) {
\t\treturn hash_hmac( 'sha256', (string) $expires . '|' . $hash, wp_salt( 'auth' ) );
\t}

\tprivate function set_access_cookie() {
\t\t$hash = $this->access_hash();
\t\tif ( '' === $hash ) return;
\t\t$expires = time() + self::ACCESS_TTL;
\t\t$value = $expires . '.' . $this->access_signature( $expires, $hash );
\t\tsetcookie( self::ACCESS_COOKIE, $value, array(
\t\t\t'expires'  => $expires,
\t\t\t'path'     => '/',
\t\t\t'secure'   => is_ssl(),
\t\t\t'httponly' => true,
\t\t\t'samesite' => 'Lax',
\t\t) );
\t\t$_COOKIE[ self::ACCESS_COOKIE ] = $value;
\t}

\tprivate function clear_access_cookie() {
\t\tsetcookie( self::ACCESS_COOKIE, '', array(
\t\t\t'expires'  => time() - HOUR_IN_SECONDS,
\t\t\t'path'     => '/',
\t\t\t'secure'   => is_ssl(),
\t\t\t'httponly' => true,
\t\t\t'samesite' => 'Lax',
\t\t) );
\t\tunset( $_COOKIE[ self::ACCESS_COOKIE ] );
\t}

\tpublic function has_access() {
\t\tif ( current_user_can( 'edit_posts' ) ) return true;
\t\t$hash = $this->access_hash();
\t\tif ( '' === $hash || empty( $_COOKIE[ self::ACCESS_COOKIE ] ) ) return false;
\t\t$parts = explode( '.', (string) wp_unslash( $_COOKIE[ self::ACCESS_COOKIE ] ), 2 );
\t\tif ( 2 !== count( $parts ) || ! ctype_digit( $parts[0] ) ) return false;
\t\t$expires = (int) $parts[0];
\t\tif ( $expires < time() ) return false;
\t\treturn hash_equals( $this->access_signature( $expires, $hash ), (string) $parts[1] );
\t}

\tprivate function require_access() {
\t\tif ( isset( $_GET['jcs_logout'] ) ) {
\t\t\t$this->clear_access_cookie();
\t\t\twp_safe_redirect( $this->dashboard_url() );
\t\t\texit;
\t\t}
\t\tif ( $this->has_access() ) return;

\t\t$error = '';
\t\tif ( 'POST' === strtoupper( isset( $_SERVER['REQUEST_METHOD'] ) ? $_SERVER['REQUEST_METHOD'] : '' )
\t\t\t&& isset( $_POST['jcs_action'] )
\t\t\t&& 'access_login' === sanitize_key( wp_unslash( $_POST['jcs_action'] ) ) ) {
\t\t\t$password = isset( $_POST['jcs_password'] ) ? (string) wp_unslash( $_POST['jcs_password'] ) : '';
\t\t\t$hash = $this->access_hash();
\t\t\tif ( '' !== $hash && wp_check_password( $password, $hash ) ) {
\t\t\t\t$this->set_access_cookie();
\t\t\t\twp_safe_redirect( $this->dashboard_url() );
\t\t\t\texit;
\t\t\t}
\t\t\t$error = 'Incorrect Code Studio password.';
\t\t}
\t\t$this->render_access_login( $error );
\t\texit;
\t}

\tprivate function render_access_login( $error = '' ) {
\t\t$configured = '' !== $this->access_hash();
\t\tnocache_headers();
\t\tstatus_header( 200 );
\t\t?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
\t<meta charset="<?php bloginfo( 'charset' ); ?>">
\t<meta name="viewport" content="width=device-width, initial-scale=1">
\t<meta name="robots" content="noindex,nofollow,noarchive">
\t<title>Code Studio Access</title>
\t<style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f5f6f8;color:#17191d}body{min-height:100vh;display:grid;place-items:center;padding:24px}.jcs-login{width:min(430px,100%);background:#fff;border:1px solid #e3e6eb;border-radius:16px;padding:34px;box-shadow:0 18px 50px rgba(17,24,39,.1)}.brand{font-size:12px;letter-spacing:.18em;font-weight:800;color:#3157DF}.jcs-login h1{margin:8px 0 8px;font-size:30px}.jcs-login p{margin:0 0 22px;color:#68707c;line-height:1.5}.jcs-login label{display:block;font-weight:700;font-size:13px;margin-bottom:7px}.jcs-login input{width:100%;height:46px;border:1px solid #cfd4dc;border-radius:9px;padding:0 13px;font-size:16px}.jcs-login button{width:100%;height:46px;margin-top:14px;border:0;border-radius:9px;background:#3157DF;color:#fff;font-weight:800;font-size:14px;cursor:pointer}.error{background:#fff1f0;color:#b42318;border:1px solid #ffd5d2;padding:10px 12px;border-radius:8px;margin-bottom:16px;font-size:13px}.setup{background:#fff8e6;color:#7a4b00;border:1px solid #f4d88a;padding:12px;border-radius:8px;font-size:13px;line-height:1.45}</style>
</head>
<body>
\t<div class="jcs-login">
\t\t<div class="brand">JUSTINNOVATE</div><h1>Code Studio</h1>
\t\t<?php if ( $configured ) : ?>
\t\t\t<p>Enter the Code Studio password to continue. No WordPress account is required.</p>
\t\t\t<?php if ( $error ) : ?><div class="error"><?php echo esc_html( $error ); ?></div><?php endif; ?>
\t\t\t<form method="post" action="<?php echo esc_url( $this->dashboard_url() ); ?>"><input type="hidden" name="jcs_action" value="access_login"><label for="jcs-password">Password</label><input id="jcs-password" name="jcs_password" type="password" autocomplete="current-password" required autofocus><button type="submit">Enter Studio</button></form>
\t\t<?php else : ?>
\t\t\t<div class="setup">A shared Studio password has not been set yet. Sign in to WordPress once as an administrator, open <strong>/code-studio/</strong>, and set the shared password there. Everyone else will then use only this Code Studio login.</div>
\t\t<?php endif; ?>
\t</div>
</body>
</html>
\t\t<?php
\t}

\t/**
\t * Match /code-studio/'''
front, count = old_require.subn('\n' + new_require, front, count=1)
if count != 1:
    raise SystemExit('Could not replace frontend access block')

marker = "\t\tif ( 'create' === $action ) {\n"
if "'set_access_password' === $action" not in front:
    access_action = '''\t\tif ( 'set_access_password' === $action ) {
\t\t\tif ( ! current_user_can( 'manage_options' ) ) wp_die( esc_html__( 'Not allowed.', 'jcs' ) );
\t\t\tcheck_admin_referer( 'jcs_set_access_password', 'jcs_nonce' );
\t\t\t$password = isset( $_POST['access_password'] ) ? (string) wp_unslash( $_POST['access_password'] ) : '';
\t\t\tif ( strlen( $password ) < 8 ) wp_die( esc_html__( 'Use at least 8 characters for the Code Studio password.', 'jcs' ) );
\t\t\tupdate_option( self::ACCESS_HASH_OPTION, wp_hash_password( $password ), false );
\t\t\twp_safe_redirect( add_query_arg( 'password_saved', '1', $this->dashboard_url() ) );
\t\t\texit;
\t\t}

'''
    if marker not in front:
        raise SystemExit('Could not find create action marker')
    front = front.replace(marker, access_action + marker, 1)

front = front.replace(
    "\t\t\tif ( ! current_user_can( 'edit_post', $id ) ) {\n\t\t\t\twp_die( esc_html__( 'Not allowed.', 'jcs' ) );\n\t\t\t}\n",
    "\t\t\tif ( ! $this->has_access() ) {\n\t\t\t\twp_die( esc_html__( 'Not allowed.', 'jcs' ) );\n\t\t\t}\n",
    1
)
front = front.replace(
    "\t\t\tif ( ! current_user_can( 'delete_post', $id ) ) {\n\t\t\t\twp_die( esc_html__( 'Not allowed.', 'jcs' ) );\n\t\t\t}\n",
    "\t\t\tif ( ! $this->has_access() ) {\n\t\t\t\twp_die( esc_html__( 'Not allowed.', 'jcs' ) );\n\t\t\t}\n",
    1
)

old_footer = "\t\t\t<div class=\"jcs-side-bottom\">Signed in as <?php echo esc_html( $user->display_name ); ?><br><a href=\"<?php echo esc_url( wp_logout_url( home_url( '/' ) ) ); ?>\">Log out</a></div>"
new_footer = '''\t\t\t<?php if ( current_user_can( 'manage_options' ) ) : ?>
\t\t\t<div style="margin-top:auto;padding:16px 10px 8px;border-top:1px solid rgba(255,255,255,.12)">
\t\t\t\t<form method="post" action="<?php echo esc_url( $this->dashboard_url() ); ?>">
\t\t\t\t\t<input type="hidden" name="jcs_action" value="set_access_password"><?php wp_nonce_field( 'jcs_set_access_password', 'jcs_nonce' ); ?>
\t\t\t\t\t<label style="display:block;font-size:11px;color:#9ca3af;margin-bottom:6px">Shared Studio password</label>
\t\t\t\t\t<input name="access_password" type="password" minlength="8" autocomplete="new-password" placeholder="Set / change password" style="width:100%;padding:9px;border:0;border-radius:7px;margin-bottom:7px">
\t\t\t\t\t<button type="submit" style="width:100%;padding:9px;border:0;border-radius:7px;background:#374151;color:#fff;font-weight:700;cursor:pointer">Save access password</button>
\t\t\t\t</form>
\t\t\t</div>
\t\t\t<?php endif; ?>
\t\t\t<div class="jcs-side-bottom"><?php if ( is_user_logged_in() ) : ?>Signed in as <?php echo esc_html( $user->display_name ); ?><br><a href="<?php echo esc_url( wp_logout_url( home_url( '/' ) ) ); ?>">WordPress log out</a><?php else : ?>Code Studio access<br><a href="<?php echo esc_url( add_query_arg( 'jcs_logout', '1', $this->dashboard_url() ) ); ?>">Log out</a><?php endif; ?></div>'''
if old_footer not in front:
    raise SystemExit('Could not find frontend footer')
front = front.replace(old_footer, new_footer, 1)
front_path.write_text(front)

editor_path = Path('justinnovate-code-studio/includes/class-jcs-editor.php')
editor = editor_path.read_text()
old_editor_perm = "\t\tif ( ! current_user_can( 'edit_post', $post_id ) ) {\n\t\t\twp_die( esc_html__( 'You do not have permission to edit this.', 'jcs' ) );\n\t\t}\n"
new_editor_perm = "\t\t$can_edit = $frontend ? JCS_Frontend::instance()->has_access() : current_user_can( 'edit_post', $post_id );\n\t\tif ( ! $can_edit ) {\n\t\t\twp_die( esc_html__( 'You do not have permission to edit this.', 'jcs' ) );\n\t\t}\n"
if old_editor_perm not in editor:
    raise SystemExit('Could not find editor permission block')
editor_path.write_text(editor.replace(old_editor_perm, new_editor_perm, 1))

rest_path = Path('justinnovate-code-studio/includes/class-jcs-rest.php')
rest = rest_path.read_text()
rest_pat = re.compile(r"\tpublic function can_edit\( \$request \) \{.*?\n\t\}\n", re.S)
rest_new = '''\tpublic function can_edit( $request ) {
\t\tif ( class_exists( 'JCS_Frontend' ) && JCS_Frontend::instance()->has_access() ) return true;
\t\t$id = (int) $request->get_param( 'id' );
\t\tif ( $id ) return current_user_can( 'edit_post', $id );
\t\treturn current_user_can( 'edit_posts' );
\t}
'''
rest, count = rest_pat.subn(rest_new, rest, count=1)
if count != 1:
    raise SystemExit('Could not replace REST permission block')
rest_path.write_text(rest)

main_path = Path('justinnovate-code-studio/justinnovate-code-studio.php')
main = main_path.read_text()
main = re.sub(r'\* Version: [0-9.]+', '* Version: 0.3.22', main, count=1)
main = re.sub(r"define\( 'JCS_VERSION', '[0-9.]+' \);", "define( 'JCS_VERSION', '0.3.22' );", main, count=1)
main_path.write_text(main)
