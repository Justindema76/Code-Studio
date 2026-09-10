from pathlib import Path

# One-time source repair for mobile output and the editor canvas.
editor = Path('justinnovate-code-studio/editor/js/editor.js')
s = editor.read_text()

old_scale = """    var stage = el('jcsStage');
    var availableW = Math.max(1, stage.clientWidth - 40);
    var availableH = Math.max(1, stage.clientHeight - 40);
    // Scale the whole real viewport only so it fits on screen. Its internal layout remains exact.
    var scale = Math.min(1, availableW / desiredW, availableH / desiredH);
    canvas.style.transformOrigin = 'top left';
    canvas.style.transform = 'scale('+scale+')';
    var wrap = el('jcsScaleWrap');
    wrap.style.width = (desiredW*scale)+'px';
    wrap.style.height = (desiredH*scale)+'px';
"""
new_scale = """    // Show the real output dimensions. Do not scale the canvas to fit the editor.
    canvas.style.transform = 'none';
    canvas.style.transformOrigin = 'top left';
    var wrap = el('jcsScaleWrap');
    wrap.style.width = desiredW+'px';
    wrap.style.height = desiredH+'px';
"""
if old_scale in s:
    s = s.replace(old_scale, new_scale, 1)

old_picture = "var pictureStyle = ' style=\\\"background-image:url(\\\\''+esc(s.desktopImage)+'\\\\');background-size:'+deskBgSize+';background-position:'+s.desktopX+'% '+s.desktopY+'%;background-attachment:'+(isFixed?'fixed':'scroll')+';background-repeat:no-repeat;--jcs-mobile-bg:url(\\\\''+esc(s.mobileImage||s.desktopImage)+'\\\\');--jcs-mobile-bg-size:'+s.mobileWidth+'% auto;--jcs-mobile-bg-pos:'+s.mobileX+'% '+s.mobileY+'%;\\\"';"
new_picture = "var mobileBgSize = s.mobileImage ? (s.mobileWidth+'% auto') : 'contain';\n    var pictureStyle = ' style=\\\"background-image:url(\\\\''+esc(s.desktopImage)+'\\\\');background-size:'+deskBgSize+';background-position:'+s.desktopX+'% '+s.desktopY+'%;background-attachment:'+(isFixed?'fixed':'scroll')+';background-repeat:no-repeat;--jcs-mobile-bg:url(\\\\''+esc(s.mobileImage||s.desktopImage)+'\\\\');--jcs-mobile-bg-size:'+mobileBgSize+';--jcs-mobile-bg-pos:'+s.mobileX+'% '+s.mobileY+'%;\\\"';"
if old_picture in s:
    s = s.replace(old_picture, new_picture)

editor.write_text(s)

render = Path('justinnovate-code-studio/includes/class-jcs-render.php')
r = render.read_text()
old_php = "$picture_style = 'background-image:url(\\'' . esc_url( $s['desktopImage'] ) . '\\');background-size:' . $desk_size . ';background-position:' . (int) $s['desktopX'] . '% ' . (int) $s['desktopY'] . '%;background-attachment:' . ( $is_fixed ? 'fixed' : 'scroll' ) . ';background-repeat:no-repeat;--jcs-mobile-bg:url(\\'' . esc_url( $s['mobileImage'] ? $s['mobileImage'] : $s['desktopImage'] ) . '\\');--jcs-mobile-bg-size:' . (int) $s['mobileWidth'] . '% auto;--jcs-mobile-bg-pos:' . (int) $s['mobileX'] . '% ' . (int) $s['mobileY'] . '%;';"
new_php = "$mobile_bg_size = ! empty( $s['mobileImage'] ) ? ( (int) $s['mobileWidth'] . '% auto' ) : 'contain';\n\t\t$picture_style = 'background-image:url(\\'' . esc_url( $s['desktopImage'] ) . '\\');background-size:' . $desk_size . ';background-position:' . (int) $s['desktopX'] . '% ' . (int) $s['desktopY'] . '%;background-attachment:' . ( $is_fixed ? 'fixed' : 'scroll' ) . ';background-repeat:no-repeat;--jcs-mobile-bg:url(\\'' . esc_url( $s['mobileImage'] ? $s['mobileImage'] : $s['desktopImage'] ) . '\\');--jcs-mobile-bg-size:' . $mobile_bg_size . ';--jcs-mobile-bg-pos:' . (int) $s['mobileX'] . '% ' . (int) $s['mobileY'] . '%;';"
if old_php in r:
    r = r.replace(old_php, new_php, 1)
render.write_text(r)

plugin = Path('justinnovate-code-studio/justinnovate-code-studio.php')
p = plugin.read_text().replace('Version: 0.3.26', 'Version: 0.3.27', 1).replace("define( 'JCS_VERSION', '0.3.26' );", "define( 'JCS_VERSION', '0.3.27' );", 1)
plugin.write_text(p)
