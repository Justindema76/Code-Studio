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

# Restore unrestricted content-block positioning. Vertical movement had been
# accidentally capped at +/-150px while horizontal already allowed +/-1000px.
old_vertical = "'<div class=\"jcs-range\"><label>Shift vertical</label><span id=\"fShiftYVal\"></span><input id=\"fShiftY\" type=\"range\" min=\"-150\" max=\"150\" step=\"2\"></div>' +"
new_vertical = "'<div class=\"jcs-range\"><label>Shift vertical</label><span id=\"fShiftYVal\"></span><input id=\"fShiftY\" type=\"range\" min=\"-1000\" max=\"1000\" step=\"5\"><input id=\"fShiftYNumber\" type=\"number\" min=\"-1000\" max=\"1000\" step=\"1\" style=\"margin-top:6px;width:100%;\" aria-label=\"Exact vertical shift in pixels\"></div>' +"
if old_vertical in s:
    s = s.replace(old_vertical, new_vertical, 1)

old_refresh = "if(el('fShiftXNumber')) el('fShiftXNumber').value=curVal('contentShiftX');"
new_refresh = old_refresh + " if(el('fShiftYNumber')) el('fShiftYNumber').value=curVal('contentShiftY');"
if new_refresh not in s and old_refresh in s:
    s = s.replace(old_refresh, new_refresh, 1)

old_slider_sync = "if(id==='fShiftX' && el('fShiftXNumber')) el('fShiftXNumber').value=el(id).value; renderAll();"
new_slider_sync = "if(id==='fShiftX' && el('fShiftXNumber')) el('fShiftXNumber').value=el(id).value; if(id==='fShiftY' && el('fShiftYNumber')) el('fShiftYNumber').value=el(id).value; renderAll();"
if new_slider_sync not in s and old_slider_sync in s:
    s = s.replace(old_slider_sync, new_slider_sync, 1)

x_number_handler = "if(el('fShiftXNumber')) el('fShiftXNumber').addEventListener('input', function(){ var v=Math.max(-1000,Math.min(1000,Number(this.value)||0)); setVal('contentShiftX',v); el('fShiftX').value=v; el('fShiftXVal').textContent=v+'px'; renderAll(); });"
y_number_handler = "if(el('fShiftYNumber')) el('fShiftYNumber').addEventListener('input', function(){ var v=Math.max(-1000,Math.min(1000,Number(this.value)||0)); setVal('contentShiftY',v); el('fShiftY').value=v; el('fShiftYVal').textContent=v+'px'; renderAll(); });"
if y_number_handler not in s and x_number_handler in s:
    s = s.replace(x_number_handler, x_number_handler + "\n  " + y_number_handler, 1)

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
