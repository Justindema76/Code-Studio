from pathlib import Path

editor = Path('justinnovate-code-studio/editor/js/editor.js')
s = editor.read_text()

# Restore the editor canvas behavior from the working v0.3.7 build.
no_scale = """    // Show the real output dimensions. Do not scale the canvas to fit the editor.
    canvas.style.transform = 'none';
    canvas.style.transformOrigin = 'top left';
    var wrap = el('jcsScaleWrap');
    wrap.style.width = desiredW+'px';
    wrap.style.height = desiredH+'px';
"""
working_scale = """    var stage = el('jcsStage');
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
if no_scale in s:
    s = s.replace(no_scale, working_scale, 1)

# The regression: desktop values were written inline with !important.
# That prevents the mobile @media rules from overriding them. The working v0.3.7
# build did NOT mark these device-specific inline values important.
replacements = {
    "font-size:'+s.eyebrowSize+'px!important": "font-size:'+s.eyebrowSize+'px",
    "letter-spacing:'+s.eyebrowLetterSpacing+'px!important": "letter-spacing:'+s.eyebrowLetterSpacing+'px",
    "transform:translate('+s.eyebrowShiftX+'px,'+s.eyebrowShiftY+'px)!important": "transform:translate('+s.eyebrowShiftX+'px,'+s.eyebrowShiftY+'px)",
    "font-size:'+s.headingSize+'px!important": "font-size:'+s.headingSize+'px",
    "letter-spacing:'+s.headingLetterSpacing+'px!important": "letter-spacing:'+s.headingLetterSpacing+'px",
    "transform:translate('+s.headingShiftX+'px,'+s.headingShiftY+'px)!important": "transform:translate('+s.headingShiftX+'px,'+s.headingShiftY+'px)",
    "font-size:'+s.subSize+'px!important": "font-size:'+s.subSize+'px",
    "letter-spacing:'+s.subLetterSpacing+'px!important": "letter-spacing:'+s.subLetterSpacing+'px",
    "transform:translate('+s.subShiftX+'px,'+s.subShiftY+'px)!important": "transform:translate('+s.subShiftX+'px,'+s.subShiftY+'px)",
    "font-size:'+s.buttonFontSize+'px!important": "font-size:'+s.buttonFontSize+'px",
    "letter-spacing:'+s.buttonLetterSpacing+'px!important": "letter-spacing:'+s.buttonLetterSpacing+'px",
    "transform:translate('+s.buttonShiftX+'px,'+s.buttonShiftY+'px)!important": "transform:translate('+s.buttonShiftX+'px,'+s.buttonShiftY+'px)",
}
for old, new in replacements.items():
    s = s.replace(old, new)

editor.write_text(s)

# Undo the fallback change from the previous attempted repair; preserve existing
# mobile image width controls exactly as they were before that attempt.
render = Path('justinnovate-code-studio/includes/class-jcs-render.php')
r = render.read_text()
changed = "$mobile_bg_size = ! empty( $s['mobileImage'] ) ? ( (int) $s['mobileWidth'] . '% auto' ) : 'contain';\n\t\t$picture_style = 'background-image:url(\\'' . esc_url( $s['desktopImage'] ) . '\\');background-size:' . $desk_size . ';background-position:' . (int) $s['desktopX'] . '% ' . (int) $s['desktopY'] . '%;background-attachment:' . ( $is_fixed ? 'fixed' : 'scroll' ) . ';background-repeat:no-repeat;--jcs-mobile-bg:url(\\'' . esc_url( $s['mobileImage'] ? $s['mobileImage'] : $s['desktopImage'] ) . '\\');--jcs-mobile-bg-size:' . $mobile_bg_size . ';--jcs-mobile-bg-pos:' . (int) $s['mobileX'] . '% ' . (int) $s['mobileY'] . '%;';"
original = "$picture_style = 'background-image:url(\\'' . esc_url( $s['desktopImage'] ) . '\\');background-size:' . $desk_size . ';background-position:' . (int) $s['desktopX'] . '% ' . (int) $s['desktopY'] . '%;background-attachment:' . ( $is_fixed ? 'fixed' : 'scroll' ) . ';background-repeat:no-repeat;--jcs-mobile-bg:url(\\'' . esc_url( $s['mobileImage'] ? $s['mobileImage'] : $s['desktopImage'] ) . '\\');--jcs-mobile-bg-size:' . (int) $s['mobileWidth'] . '% auto;--jcs-mobile-bg-pos:' . (int) $s['mobileX'] . '% ' . (int) $s['mobileY'] . '%;';"
if changed in r:
    r = r.replace(changed, original, 1)
render.write_text(r)

plugin = Path('justinnovate-code-studio/justinnovate-code-studio.php')
p = plugin.read_text().replace('Version: 0.3.27', 'Version: 0.3.28', 1).replace("define( 'JCS_VERSION', '0.3.27' );", "define( 'JCS_VERSION', '0.3.28' );", 1)
plugin.write_text(p)
