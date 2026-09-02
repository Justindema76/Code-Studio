(function(){
  var DATA = window.JCS_EDITOR_DATA || {};
  var STUDIO = DATA.settings || {};
  function studioColor(key, fallback){ return STUDIO[key] || fallback; }
  function fontLibrary(){
    var raw = String(STUDIO.fonts || 'Oswald\nInter\nArial\nGeorgia');
    var seen = {};
    return raw.split(/[\r\n,]+/).map(function(x){return x.trim();}).filter(function(x){ if(!x || seen[x.toLowerCase()]) return false; seen[x.toLowerCase()]=1; return true; });
  }
  function populateFontSelects(){
    var fonts=fontLibrary();
    ['fHeadingFont','fBodyFont','fEyebrowFont','fButtonFont'].forEach(function(id){
      var select=document.getElementById(id); if(!select) return; select.innerHTML='';
      fonts.forEach(function(font){ var o=document.createElement('option'); o.value=font; o.textContent=font; o.style.fontFamily='\"'+font+'\",sans-serif'; select.appendChild(o); });
    });
  }
  function googleFontsLink(){
    var system={'arial':1,'georgia':1,'impact':1,'verdana':1,'tahoma':1,'trebuchet ms':1,'times new roman':1,'courier new':1,'system-ui':1};
    var used={};
    slides.forEach(function(s){ ['headingFont','bodyFont','eyebrowFont','buttonFont'].forEach(function(k){ var f=s[k]; if(f && !system[String(f).toLowerCase()]) used[f]=1; }); });
    var families=Object.keys(used).map(function(f){ return 'family='+encodeURIComponent(f)+':wght@400;500;600;700;800;900'; });
    return families.length ? '<link href="https://fonts.googleapis.com/css2?'+families.join('&')+'&display=swap" rel="stylesheet">\n' : '';
  }

  // ---------- build the shell ----------
  var root = document.getElementById('jcs-root');
  root.innerHTML =
    '<div class="jcs">' +
      '<header class="jcs-topbar">' +
        '<div class="jcs-topbar-left">' +
          '<a class="jcs-back" href="'+ (DATA.listUrl||'#') +'" title="Back to list">&#8592;</a>' +
          '<input class="jcs-title-input" id="jcsTitle" type="text" value="">' +
          '<span class="jcs-status" id="jcsStatus">Loading…</span>' +
          '<span class="jcs-language-pill">'+(DATA.languageLabel||'English')+'</span>' +
        '</div>' +
        '<div class="jcs-topbar-actions">' +
          '<a class="jcs-btn secondary" href="'+(DATA.englishUrl||'#')+'">EN</a>' +
          '<a class="jcs-btn secondary" href="'+(DATA.frenchUrl||'#')+'">FR</a>' +
          ((DATA.language==='fr') ? '<button class="jcs-btn secondary" id="jcsAutoTranslate">Translate EN → FR</button>' : '') +
          '<button class="jcs-btn secondary" id="jcsLivePreview">Live preview</button>' +
          '<button class="jcs-btn secondary" id="jcsNew">New blank</button>' +
          '<button class="jcs-btn secondary" id="jcsOpenImport">Load code / project</button>' +
          '<button class="jcs-btn secondary" id="jcsCopyProject">Copy project JSON</button>' +
          '<button class="jcs-btn secondary" id="jcsCopyTop">Copy embed code</button>' +
          '<button class="jcs-btn primary" id="jcsSave">Save</button>' +
        '</div>' +
      '</header>' +
      '<div class="jcs-body" id="jcsBody">' +
        '<main class="jcs-main">' +
          '<section class="jcs-canvas-card">' +
            '<div class="jcs-toolbar">' +
              '<strong>Canvas</strong>' +
              '<div class="jcs-segmented"><button id="jcsDesktopMode" class="active">Desktop</button><button id="jcsMobileMode">Mobile</button></div>' +
            '</div>' +
            '<div class="jcs-width-row" id="jcsWidthRow">' +
              '<label>Preview at browser width</label><span id="jcsPreviewWidthVal">1920px</span>' +
              '<input id="jcsPreviewWidth" type="range" min="1360" max="3000" step="20" value="1920">' +
            '</div>' +
            '<div class="jcs-stage" id="jcsStage">' +
              '<div class="jcs-canvas-scale-wrap" id="jcsScaleWrap">' +
                '<div class="jcs-canvas desktop" id="jcsCanvas">' +
                  '<div class="jcs-c-picture"><img id="jcsCanvasImg" alt=""></div>' +
                  '<div class="jcs-c-overlay" id="jcsCanvasOverlay"></div>' +
                  '<div class="jcs-c-scrim" id="jcsCanvasScrim"></div>' +
                  '<div class="jcs-c-inner" id="jcsCanvasInner">' +
                    '<div class="jcs-c-content">' +
                      '<span class="jcs-c-eyebrow" id="jcsCEyebrow"></span>' +
                      '<h2 class="jcs-c-heading" id="jcsCHeading"></h2>' +
                      '<p class="jcs-c-sub" id="jcsCSub"></p>' +
                      '<span class="jcs-c-btn" id="jcsCBtn"></span>' +
                    '</div>' +
                  '</div>' +
                  '<div class="jcs-c-arrow jcs-c-prev">&#8249;</div>' +
                  '<div class="jcs-c-arrow jcs-c-next">&#8250;</div>' +
                  '<div class="jcs-c-dashes" id="jcsCanvasDashes"></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<p class="jcs-hint">Background images are locked as true backgrounds. Use Background controls to position them.</p>' +
          '</section>' +
          '<section class="jcs-canvas-card jcs-code-card">' +
            '<div class="jcs-toolbar">' +
              '<strong>Embed code</strong>' +
              '<button class="jcs-btn primary" id="jcsCopyCode">Copy code</button>' +
            '</div>' +
            '<p class="jcs-hint">Paste this into any page — an HTML block, a theme template, another site\'s page builder. It\'s self-contained and doesn\'t need this plugin installed anywhere else.</p>' +
            '<textarea class="jcs-code-output" id="jcsCodeOutput" readonly></textarea>' +
          '</section>' +
        '</main>' +
        '<aside class="jcs-side">' +
          '<div class="jcs-side-head"><strong>Banners <span class="jcs-mode-badge" id="jcsModeBadge"></span></strong>' +
            '<div><button class="jcs-btn secondary" id="jcsDuplicate">Duplicate</button> <button class="jcs-btn primary" id="jcsAdd">Add</button></div>' +
          '</div>' +
          '<div class="jcs-tabs-slides" id="jcsSlideTabs"></div>' +
          '<div class="jcs-tabbar" id="jcsTabbar">' +
            '<button class="jcs-tab active" data-tab="content">Content</button>' +
            '<button class="jcs-tab" data-tab="image">Background</button>' +
            '<button class="jcs-tab" data-tab="layout">Position</button>' +
            '<button class="jcs-tab" data-tab="gradient">Effects</button>' +
            '<button class="jcs-tab" data-tab="style">Typography & Style</button>' +
            '<button class="jcs-tab" data-tab="settings">Banner</button>' +
          '</div>' +

          '<div class="jcs-tabpanel active" data-panel="content">' +
            '<label>Eyebrow</label><input id="fEyebrow" type="text">' +
            '<label>Heading</label><textarea id="fHeading"></textarea>' +
            '<label>Sub-heading</label><textarea id="fSub"></textarea>' +
            '<label>Button text</label><input id="fBtnText" type="text">' +
            '<label>Button URL</label><input id="fBtnUrl" type="url">' +
            '<div class="jcs-checkbox-row"><input id="fBtnNewTab" type="checkbox"><label for="fBtnNewTab">Open button in new tab</label></div>' +
          '</div>' +

          '<div class="jcs-tabpanel" data-panel="image">' +
            '<label>Desktop image URL</label><input id="fDeskImg" type="url">' +
            '<label>Mobile image URL</label><input id="fMobImg" type="url">' +
            '<div class="jcs-section-label">Background link</div>' +
            '<label>Desktop background link URL</label><input id="fDeskBgLink" type="url" placeholder="https://...">' +
            '<div class="jcs-checkbox-row"><input id="fDeskBgNewTab" type="checkbox"><label for="fDeskBgNewTab">Open desktop background link in new tab</label></div>' +
            '<label>Mobile background link URL</label><input id="fMobBgLink" type="url" placeholder="https://...">' +
            '<div class="jcs-checkbox-row"><input id="fMobBgNewTab" type="checkbox"><label for="fMobBgNewTab">Open mobile background link in new tab</label></div>' +
            '<div class="jcs-section-label">Content visibility</div>' +
            '<div class="jcs-checkbox-row"><input id="fDeskShowContent" type="checkbox"><label for="fDeskShowContent">Show content on desktop</label></div>' +
            '<div class="jcs-checkbox-row"><input id="fMobShowContent" type="checkbox"><label for="fMobShowContent">Show content on mobile</label></div>' +
            '<label>Image alt text</label><input id="fAlt" type="text">' +
            '<label>Desktop background sizing</label><select id="fFit"><option value="width">100% width (recommended for designed banners)</option><option value="cover">Cover / crop</option><option value="contain">Contain</option><option value="custom">Custom width %</option></select>' +
            '<label>Background attachment</label><select id="fAttachment"><option value="scroll">Scroll (normal)</option><option value="fixed">Fixed (parallax)</option></select>' +
            '<div class="jcs-section-label">Background colour</div>' +
            '<label>Base colour</label><input id="fBgColor" type="color">' +
            '<div class="jcs-section-label">Background overlay</div>' +
            '<label>Type</label><select id="fOverlayType"><option value="none">Off</option><option value="color">Colour</option><option value="image">Image</option></select>' +
            '<div id="jcsOverlayColorRow"><label>Overlay colour</label><input id="fOverlayColor" type="color"></div>' +
            '<div id="jcsOverlayImageRow" style="display:none;"><label>Overlay image URL</label><input id="fOverlayImage" type="url"></div>' +
            '<div class="jcs-range"><label>Opacity</label><span id="fOverlayOpacityVal"></span><input id="fOverlayOpacity" type="range" min="0" max="100" step="1"></div>' +
            '<label>Blend mode</label><select id="fOverlayBlend">' +
              '<option value="normal">Normal</option><option value="multiply">Multiply</option><option value="screen">Screen</option><option value="overlay">Overlay</option><option value="darken">Darken</option><option value="lighten">Lighten</option>' +
              '<option value="color-dodge">Color Dodge</option><option value="color-burn">Color Burn</option><option value="hard-light">Hard Light</option><option value="soft-light">Soft Light</option>' +
              '<option value="difference">Difference</option><option value="exclusion">Exclusion</option><option value="hue">Hue</option><option value="saturation">Saturation</option><option value="color">Color</option><option value="luminosity">Luminosity</option>' +
            '</select>' +
            '<div class="jcs-section-label">Desktop position</div>' +
            '<div class="jcs-range"><label>Horizontal</label><span id="fDeskXVal"></span><input id="fDeskX" type="range" min="0" max="100" step="1"></div>' +
            '<div class="jcs-range"><label>Vertical</label><span id="fDeskYVal"></span><input id="fDeskY" type="range" min="0" max="100" step="1"></div>' +
            '<div class="jcs-range"><label>Zoom</label><span id="fDeskZoomVal"></span><input id="fDeskZoom" type="range" min="50" max="200" step="1"></div>' +
            '<div class="jcs-section-label">Mobile position</div>' +
            '<div class="jcs-range"><label>Horizontal</label><span id="fMobXVal"></span><input id="fMobX" type="range" min="-20" max="120" step="1"></div>' +
            '<div class="jcs-range"><label>Vertical</label><span id="fMobYVal"></span><input id="fMobY" type="range" min="-20" max="120" step="1"></div>' +
            '<div class="jcs-range"><label>Width</label><span id="fMobWVal"></span><input id="fMobW" type="range" min="30" max="200" step="1"></div>' +
          '</div>' +

          '<div class="jcs-tabpanel" data-panel="layout">' +
            '<div class="jcs-mode-toggle" id="jcsLayoutModeBadge">Editing: Desktop layout</div>' +
            '<button class="jcs-btn secondary" id="jcsCopyLayout" style="width:100%;margin-bottom:14px;">Copy from the other screen size</button>' +
            '<label>Justify content</label>' +
            '<div class="jcs-justify-group" id="jcsJustifyGroup">' +
              '<button type="button" data-value="left">L</button><button type="button" data-value="center">C</button><button type="button" data-value="right">R</button>' +
            '</div>' +
            '<div class="jcs-section-label">Content block</div>' +
            '<label>Vertical alignment</label><select id="fAlignY"><option value="center">Center</option><option value="flex-start">Top</option><option value="flex-end">Bottom</option></select>' +
            '<div class="jcs-range"><label>Edge padding</label><span id="fPaddingXVal"></span><input id="fPaddingX" type="range" min="16" max="140" step="2"></div>' +
            '<div class="jcs-range"><label>Shift horizontal</label><span id="fShiftXVal"></span><input id="fShiftX" type="range" min="-1000" max="1000" step="5"><input id="fShiftXNumber" type="number" min="-1000" max="1000" step="1" style="margin-top:6px;width:100%;" aria-label="Exact horizontal shift in pixels"></div>' +
            '<div class="jcs-range"><label>Shift vertical</label><span id="fShiftYVal"></span><input id="fShiftY" type="range" min="-150" max="150" step="2"></div>' +
            '<div class="jcs-section-label">Content background</div>' +
            '<div class="jcs-checkbox-row"><input id="fContentBgEnabled" type="checkbox"><label for="fContentBgEnabled">Show background panel</label></div>' +
            '<div id="jcsContentBgDetail">' +
              '<label>Colour</label><input id="fContentBgColor" type="color">' +
              '<div class="jcs-range"><label>Opacity</label><span id="fContentBgOpacityVal"></span><input id="fContentBgOpacity" type="range" min="0" max="100" step="1"></div>' +
              '<div class="jcs-range"><label>Padding</label><span id="fContentBgPaddingVal"></span><input id="fContentBgPadding" type="range" min="0" max="80" step="2"></div>' +
              '<div class="jcs-range"><label>Corner radius</label><span id="fContentBgRadiusVal"></span><input id="fContentBgRadius" type="range" min="0" max="40" step="1"></div>' +
              '<div class="jcs-checkbox-row"><input id="fContentBgShadowEnabled" type="checkbox"><label for="fContentBgShadowEnabled">Add drop shadow</label></div>' +
              '<div id="jcsContentBgShadowDetail">' +
                '<label>Shadow colour</label><input id="fContentBgShadowColor" type="color">' +
                '<div class="jcs-range"><label>Shadow opacity</label><span id="fContentBgShadowOpacityVal"></span><input id="fContentBgShadowOpacity" type="range" min="0" max="100" step="1"></div>' +
                '<div class="jcs-range"><label>Shadow blur</label><span id="fContentBgShadowBlurVal"></span><input id="fContentBgShadowBlur" type="range" min="0" max="80" step="2"></div>' +
                '<div class="jcs-range"><label>Shadow offset</label><span id="fContentBgShadowYVal"></span><input id="fContentBgShadowY" type="range" min="0" max="40" step="1"></div>' +
              '</div>' +
            '</div>' +
            '<div class="jcs-section-label">Spacing</div>' +
            '<div class="jcs-range"><label>Eyebrow &rarr; Heading</label><span id="fGapEyebrowVal"></span><input id="fGapEyebrow" type="range" min="0" max="50" step="1"></div>' +
            '<div class="jcs-range"><label>Heading &rarr; Sub</label><span id="fGapHeadingVal"></span><input id="fGapHeading" type="range" min="0" max="50" step="1"></div>' +
            '<div class="jcs-range"><label>Sub &rarr; Button</label><span id="fGapSubVal"></span><input id="fGapSub" type="range" min="0" max="60" step="1"></div>' +
          '</div>' +

          '<div class="jcs-tabpanel" data-panel="gradient">' +
            '<div class="jcs-mode-toggle" id="jcsGradientModeBadge">Editing: Desktop gradient</div>' +
            '<label>Type</label><select id="fGradType"><option value="off">Off</option><option value="linear">Linear</option><option value="radial">Radial</option></select>' +
            '<button class="jcs-btn secondary" id="jcsCopyGradient" style="width:100%;margin-top:10px;">Copy from the other screen size</button>' +
            '<div id="jcsGradientEditor">' +
              '<div class="jcs-section-label">Stops</div>' +
              '<div class="jcs-gradient-bar-wrap"><div class="jcs-gradient-bar" id="jcsGradBar"></div></div>' +
              '<div class="jcs-stop-editor" id="jcsStopEditor"></div>' +
              '<div class="jcs-section-label" id="jcsAngleLabel">Angle</div>' +
              '<div class="jcs-angle-row" id="jcsAngleRow"><div class="jcs-dial" id="jcsDial"><div class="jcs-dial-handle" id="jcsDialHandle"></div></div><input id="fAngle" type="number" min="0" max="360" step="1"></div>' +
              '<div class="jcs-section-label" id="jcsRadialLabel" style="display:none;">Radial center</div>' +
              '<div id="jcsRadialRow" style="display:none;">' +
                '<div class="jcs-range"><label>Horizontal</label><span id="fRadXVal"></span><input id="fRadX" type="range" min="0" max="100" step="1"></div>' +
                '<div class="jcs-range"><label>Vertical</label><span id="fRadYVal"></span><input id="fRadY" type="range" min="0" max="100" step="1"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="jcs-tabpanel" data-panel="style">' +
            '<div class="jcs-section-label">Colours</div>' +
            '<div class="jcs-color-grid">' +
              '<div><label>Heading</label><input id="fHeadingColor" type="color"></div>' +
              '<div><label>Sub-heading</label><input id="fSubColor" type="color"></div>' +
              '<div><label>Eyebrow bg</label><input id="fEyebrowBg" type="color"></div>' +
              '<div><label>Eyebrow text</label><input id="fEyebrowColor" type="color"></div>' +
              '<div><label>Button bg</label><input id="fBtnBg" type="color"></div>' +
              '<div><label>Button text</label><input id="fBtnColor" type="color"></div>' +
            '</div>' +
            '<div class="jcs-section-label">Typography</div>' +
            '<div class="jcs-mode-toggle" id="jcsTypeModeBadge">Editing: Desktop typography</div>' +
            '<button class="jcs-btn secondary panel" id="jcsCopyTypo" style="width:100%;margin-bottom:10px;">Copy from Mobile typography</button>' +
            '<label>Heading font</label><select id="fHeadingFont"></select>' +
            '<label>Sub-heading font</label><select id="fBodyFont"></select>' +
            '<label>Eyebrow font</label><select id="fEyebrowFont"></select>' +
            '<label>Button font</label><select id="fButtonFont"></select>' +
            '<label>Heading weight</label><select id="fHeadingWeight"><option value="300">300 Light</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 Semi-bold</option><option value="700">700 Bold</option><option value="800">800 Extra-bold</option><option value="900">900 Black</option></select>' +
            '<label>Sub-heading weight</label><select id="fBodyWeight"><option value="300">300 Light</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 Semi-bold</option><option value="700">700 Bold</option><option value="800">800 Extra-bold</option><option value="900">900 Black</option></select>' +
            '<label>Eyebrow weight</label><select id="fEyebrowWeight"><option value="300">300 Light</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 Semi-bold</option><option value="700">700 Bold</option><option value="800">800 Extra-bold</option><option value="900">900 Black</option></select>' +
            '<label>Button weight</label><select id="fButtonWeight"><option value="300">300 Light</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 Semi-bold</option><option value="700">700 Bold</option><option value="800">800 Extra-bold</option><option value="900">900 Black</option></select>' +
            '<div class="jcs-section-label">Text alignment</div>' +
            '<div class="jcs-justify" id="jcsTextAlignGroup"><button type="button" data-value="left">L</button><button type="button" data-value="center">C</button><button type="button" data-value="right">R</button></div>' +
            '<div class="jcs-range"><label>Eyebrow size</label><span id="fEyebrowSizeVal"></span><input id="fEyebrowSize" type="range" min="8" max="180" step="1"></div>' +
            '<div class="jcs-range"><label>Heading size</label><span id="fHeadingSizeVal"></span><input id="fHeadingSize" type="range" min="8" max="220" step="1"></div>' +
            '<div class="jcs-range"><label>Sub-heading size</label><span id="fSubSizeVal"></span><input id="fSubSize" type="range" min="8" max="140" step="1"></div>' +
            '<div class="jcs-range"><label>Button text size</label><span id="fButtonFontSizeVal"></span><input id="fButtonFontSize" type="range" min="8" max="100" step="1"></div>' +
            '<div class="jcs-range"><label>Text block width</label><span id="fWidthVal"></span><input id="fWidth" type="range" min="120" max="1900" step="10"></div><label>Exact text block width (px)</label><input id="fWidthNumber" type="number" min="120" max="1900" step="10" style="margin-bottom:8px">' +
            '<div class="jcs-width-presets" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px"><button type="button" class="jcs-btn secondary panel jcs-width-preset" data-width="480">480</button><button type="button" class="jcs-btn secondary panel jcs-width-preset" data-width="800">800</button><button type="button" class="jcs-btn secondary panel jcs-width-preset" data-width="1200">1200</button><button type="button" class="jcs-btn secondary panel jcs-width-preset" data-width="1900">MAX</button></div>' +
            '<div class="jcs-range"><label>Heading line height</label><span id="fHeadingLineHeightVal"></span><input id="fHeadingLineHeight" type="range" min="0.7" max="2.4" step="0.05"></div>' +
            '<div class="jcs-range"><label>Sub-heading line height</label><span id="fSubLineHeightVal"></span><input id="fSubLineHeight" type="range" min="0.7" max="2.8" step="0.05"></div>' +
            '<div class="jcs-section-label">Letter spacing</div>' +
            '<div class="jcs-range"><label>Eyebrow spacing</label><span id="fEyebrowLetterSpacingVal"></span><input id="fEyebrowLetterSpacing" type="range" min="-5" max="30" step="0.5"></div>' +
            '<div class="jcs-range"><label>Heading spacing</label><span id="fHeadingLetterSpacingVal"></span><input id="fHeadingLetterSpacing" type="range" min="-5" max="30" step="0.5"></div>' +
            '<div class="jcs-range"><label>Sub-heading spacing</label><span id="fSubLetterSpacingVal"></span><input id="fSubLetterSpacing" type="range" min="-5" max="30" step="0.5"></div>' +
            '<div class="jcs-range"><label>Button spacing</label><span id="fButtonLetterSpacingVal"></span><input id="fButtonLetterSpacing" type="range" min="-5" max="30" step="0.5"></div>' +
            '<div class="jcs-section-label">Fine positioning</div>' +
            '<div class="jcs-range"><label>Eyebrow horizontal</label><span id="fEyebrowShiftXVal"></span><input id="fEyebrowShiftX" type="range" min="-1000" max="1000" step="1"></div>' +
            '<div class="jcs-range"><label>Eyebrow vertical</label><span id="fEyebrowShiftYVal"></span><input id="fEyebrowShiftY" type="range" min="-600" max="600" step="1"></div>' +
            '<div class="jcs-range"><label>Heading horizontal</label><span id="fHeadingShiftXVal"></span><input id="fHeadingShiftX" type="range" min="-1000" max="1000" step="1"></div>' +
            '<div class="jcs-range"><label>Heading vertical</label><span id="fHeadingShiftYVal"></span><input id="fHeadingShiftY" type="range" min="-600" max="600" step="1"></div>' +
            '<div class="jcs-range"><label>Sub-heading horizontal</label><span id="fSubShiftXVal"></span><input id="fSubShiftX" type="range" min="-1000" max="1000" step="1"></div>' +
            '<div class="jcs-range"><label>Sub-heading vertical</label><span id="fSubShiftYVal"></span><input id="fSubShiftY" type="range" min="-600" max="600" step="1"></div>' +
            '<div class="jcs-range"><label>Button horizontal</label><span id="fButtonShiftXVal"></span><input id="fButtonShiftX" type="range" min="-1000" max="1000" step="1"></div>' +
            '<div class="jcs-range"><label>Button vertical</label><span id="fButtonShiftYVal"></span><input id="fButtonShiftY" type="range" min="-600" max="600" step="1"></div>' +
            '<div class="jcs-range"><label>Button width (0 = auto)</label><span id="fButtonWidthVal"></span><input id="fButtonWidth" type="range" min="0" max="1000" step="10"></div>' +
            '<div class="jcs-section-label">Eyebrow background</div>' +
            '<div class="jcs-checkbox-row"><input id="fEyebrowBgEnabled" type="checkbox"><label for="fEyebrowBgEnabled">Show eyebrow background</label></div>' +
            '<div id="jcsEyebrowBgDetail">' +
            '<div class="jcs-range"><label>Opacity</label><span id="fEyebrowOpacityVal"></span><input id="fEyebrowOpacity" type="range" min="0" max="100" step="1"></div>' +
            '<div class="jcs-range"><label>Padding (l/r)</label><span id="fEyebrowPadXVal"></span><input id="fEyebrowPadX" type="range" min="0" max="40" step="1"></div>' +
            '<div class="jcs-range"><label>Padding (t/b)</label><span id="fEyebrowPadYVal"></span><input id="fEyebrowPadY" type="range" min="0" max="24" step="1"></div>' +
            '<div class="jcs-range"><label>Corner radius</label><span id="fEyebrowRadiusVal"></span><input id="fEyebrowRadius" type="range" min="0" max="30" step="1"></div>' +
            '<div class="jcs-checkbox-row"><input id="fEyebrowShadowEnabled" type="checkbox"><label for="fEyebrowShadowEnabled">Add drop shadow</label></div>' +
            '<div id="jcsEyebrowShadowDetail">' +
              '<label>Shadow colour</label><input id="fEyebrowShadowColor" type="color">' +
              '<div class="jcs-range"><label>Opacity</label><span id="fEyebrowShadowOpacityVal"></span><input id="fEyebrowShadowOpacity" type="range" min="0" max="100" step="1"></div>' +
              '<div class="jcs-range"><label>Blur</label><span id="fEyebrowShadowBlurVal"></span><input id="fEyebrowShadowBlur" type="range" min="0" max="60" step="2"></div>' +
              '<div class="jcs-range"><label>Offset</label><span id="fEyebrowShadowYVal"></span><input id="fEyebrowShadowY" type="range" min="0" max="30" step="1"></div>' +
            '</div></div>' +
            '<div class="jcs-section-label">Button background</div>' +
            '<div class="jcs-checkbox-row"><input id="fButtonBgEnabled" type="checkbox"><label for="fButtonBgEnabled">Show button background</label></div>' +
            '<div id="jcsButtonBgDetail">' +
            '<div class="jcs-range"><label>Opacity</label><span id="fButtonOpacityVal"></span><input id="fButtonOpacity" type="range" min="0" max="100" step="1"></div>' +
            '<div class="jcs-range"><label>Padding (l/r)</label><span id="fButtonPadXVal"></span><input id="fButtonPadX" type="range" min="0" max="60" step="1"></div>' +
            '<div class="jcs-range"><label>Height</label><span id="fButtonHeightVal"></span><input id="fButtonHeight" type="range" min="28" max="80" step="1"></div>' +
            '<div class="jcs-range"><label>Corner radius</label><span id="fButtonRadiusVal"></span><input id="fButtonRadius" type="range" min="0" max="40" step="1"></div>' +
            '<div class="jcs-checkbox-row"><input id="fButtonShadowEnabled" type="checkbox"><label for="fButtonShadowEnabled">Add drop shadow</label></div>' +
            '<div id="jcsButtonShadowDetail">' +
              '<label>Shadow colour</label><input id="fButtonShadowColor" type="color">' +
              '<div class="jcs-range"><label>Opacity</label><span id="fButtonShadowOpacityVal"></span><input id="fButtonShadowOpacity" type="range" min="0" max="100" step="1"></div>' +
              '<div class="jcs-range"><label>Blur</label><span id="fButtonShadowBlurVal"></span><input id="fButtonShadowBlur" type="range" min="0" max="60" step="2"></div>' +
              '<div class="jcs-range"><label>Offset</label><span id="fButtonShadowYVal"></span><input id="fButtonShadowY" type="range" min="0" max="30" step="1"></div>' +
            '</div></div>' +
            '<div class="jcs-section-label">Button hover</div>' +
            '<div class="jcs-checkbox-row"><input id="fButtonHoverEnabled" type="checkbox"><label for="fButtonHoverEnabled">Enable hover effect</label></div>' +
            '<div id="jcsButtonHoverDetail"><div class="jcs-color-grid"><div><label>Hover background</label><input id="fButtonHoverBg" type="color"></div><div><label>Hover text</label><input id="fButtonHoverColor" type="color"></div></div></div>' +
            '<div class="jcs-section-label">Arrows &amp; dashes</div>' +
            '<div class="jcs-color-grid">' +
              '<div><label>Arrow background</label><input id="fArrowBg" type="color"></div>' +
              '<div><label>Arrow icon</label><input id="fArrowIconColor" type="color"></div>' +
              '<div><label>Arrow border</label><input id="fArrowBorderColor" type="color"></div>' +
              '<div><label>Dash / progress</label><input id="fDashColor" type="color"></div>' +
            '</div>' +
            '<div class="jcs-range"><label>Arrow bg opacity</label><span id="fArrowBgOpacityVal"></span><input id="fArrowBgOpacity" type="range" min="0" max="100" step="1"></div>' +
            '<div class="jcs-range"><label>Arrow border opacity</label><span id="fArrowBorderOpacityVal"></span><input id="fArrowBorderOpacity" type="range" min="0" max="100" step="1"></div>' +
          '</div>' +

          '<div class="jcs-tabpanel" data-panel="settings">' +
            '<label>Desktop height (px)</label><input id="fDeskHeight" type="number" min="200" max="1600" step="1">' +
            '<label>Mobile height (px)</label><input id="fMobHeight" type="number" min="200" max="1600" step="1">' +
            '<label>Autoplay speed (ms)</label><input id="fAutoplay" type="number" min="1000" step="100">' +
            '<div class="jcs-checkbox-row"><input id="fPauseHover" type="checkbox"><label for="fPauseHover">Pause on hover</label></div>' +
            '<button class="jcs-btn danger" id="jcsRemove" style="width:100%;margin-top:18px;">Remove this banner</button>' +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<div class="jcs-modal jcs-preview-modal" id="jcsPreviewModal" hidden>' +
        '<div class="jcs-preview-card" role="dialog" aria-modal="true" aria-labelledby="jcsPreviewTitle">' +
          '<div class="jcs-preview-head">' +
            '<div><h2 id="jcsPreviewTitle">Actual output preview</h2><p>This renders the exact exported HTML/CSS at the selected viewport width.</p></div>' +
            '<div class="jcs-preview-actions">' +
              '<div class="jcs-preview-devices"><button class="active" data-preview-width="390">Mobile 390</button><button data-preview-width="768">Tablet 768</button><button data-preview-width="1440">Desktop 1440</button></div>' +
              '<button class="jcs-btn secondary" id="jcsPreviewRefresh" type="button">Refresh</button>' +
              '<button class="jcs-modal-close" id="jcsClosePreview" type="button" aria-label="Close">&times;</button>' +
            '</div>' +
          '</div>' +
          '<div class="jcs-preview-stage" id="jcsPreviewStage"><div class="jcs-preview-device" id="jcsPreviewDevice" style="width:390px"><iframe id="jcsPreviewFrame" title="Actual banner output preview"></iframe></div></div>' +
          '<div class="jcs-preview-foot"><strong id="jcsPreviewSizeLabel">390px viewport</strong><span>What you see here is the same generated code you copy into the site.</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="jcs-modal" id="jcsImportModal" hidden>' +
        '<div class="jcs-modal-card" role="dialog" aria-modal="true" aria-labelledby="jcsImportTitle">' +
          '<div class="jcs-modal-head"><div><h2 id="jcsImportTitle">Load code or project</h2>' +
          '<p>Paste code exported by this studio or raw project JSON.</p></div>' +
          '<button class="jcs-modal-close" id="jcsCloseImport" type="button" aria-label="Close">&times;</button></div>' +
          '<textarea id="jcsImportArea" class="jcs-import-area" placeholder="Paste exported code or project JSON here..."></textarea>' +
          '<div class="jcs-import-msg" id="jcsImportMsg"></div>' +
          '<div class="jcs-modal-actions"><button class="jcs-btn secondary dark" id="jcsCancelImport" type="button">Cancel</button>' +
          '<button class="jcs-btn primary" id="jcsLoadImport" type="button">Load into studio</button></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  populateFontSelects();

  // ---------- data model (mirrors JCS_Render::defaults() in PHP) ----------
  function defaultGradient(){
    return { type:'linear', angle:90, radialX:0, radialY:50, stops:[
      {pos:0, color:'#000000', opacity:0.82},{pos:32, color:'#000000', opacity:0.60},
      {pos:60, color:'#000000', opacity:0.15},{pos:78, color:'#000000', opacity:0}
    ]};
  }
  function defaults(){
    return {
      eyebrow:'', heading:'', subheading:'', buttonText:'', buttonUrl:'#', buttonNewTab:false, altText:'',
      desktopImage:'', mobileImage:'', desktopBgLink:'', mobileBgLink:'', desktopBgNewTab:false, mobileBgNewTab:false, showContent:true, mobileShowContent:true, bgColor:'#ffffff',
      overlayType:'none', overlayColor:'#000000', overlayOpacity:30, overlayBlendMode:'normal', overlayImage:'',
      desktopFit:'width', desktopAttachment:'scroll', contentSide:'left', mobileContentSide:'left',
      desktopX:50, desktopY:50, desktopZoom:100, mobileX:50, mobileY:23, mobileWidth:100,
      gradient:Object.assign(defaultGradient(), {type:'off'}), mobileGradient:Object.assign(defaultGradient(), {type:'off'}),
      headingColor:'#1a1a1a', subColor:'#444444',
      eyebrowBg:studioColor('eyebrow_bg','#3157DF'), eyebrowColor:'#ffffff', eyebrowBgEnabled:true, eyebrowOpacity:100, eyebrowPadX:12, eyebrowPadY:5,
      buttonBg:studioColor('button_bg','#3157DF'), buttonColor:'#ffffff', buttonBgEnabled:true, buttonOpacity:100, buttonPadX:30, buttonHeight:48,
      arrowBg:'#000000', arrowBgOpacity:45, arrowIconColor:'#ffffff', arrowBorderColor:'#ffffff', arrowBorderOpacity:35, dashColor:studioColor('dash_color','#3157DF'),
      headingFont:'Oswald', bodyFont:'Inter', eyebrowFont:'Oswald', buttonFont:'Oswald', headingWeight:700, bodyWeight:400, eyebrowWeight:600, buttonWeight:700, eyebrowSize:12, headingSize:46, subSize:16, buttonFontSize:14, contentWidth:480,
      mobileEyebrowSize:12, mobileHeadingSize:34, mobileSubSize:16, mobileButtonFontSize:14, mobileContentWidth:480,
      textAlign:'left', mobileTextAlign:'left', eyebrowLetterSpacing:2.2, headingLetterSpacing:0, subLetterSpacing:0, buttonLetterSpacing:.6, mobileEyebrowLetterSpacing:2.2, mobileHeadingLetterSpacing:0, mobileSubLetterSpacing:0, mobileButtonLetterSpacing:.6,
      eyebrowShiftX:0, eyebrowShiftY:0, headingShiftX:0, headingShiftY:0, subShiftX:0, subShiftY:0, buttonShiftX:0, buttonShiftY:0, buttonWidth:0,
      mobileEyebrowShiftX:0, mobileEyebrowShiftY:0, mobileHeadingShiftX:0, mobileHeadingShiftY:0, mobileSubShiftX:0, mobileSubShiftY:0, mobileButtonShiftX:0, mobileButtonShiftY:0, mobileButtonWidth:0,
      headingLineHeight:1.1, subLineHeight:1.55, eyebrowRadius:2, buttonRadius:2,
      buttonHoverEnabled:false, buttonHoverBg:'#1a1a1a', buttonHoverColor:'#ffffff',
      eyebrowShadowEnabled:false, eyebrowShadowColor:'#000000', eyebrowShadowOpacity:25, eyebrowShadowBlur:8, eyebrowShadowY:2,
      buttonShadowEnabled:false, buttonShadowColor:'#000000', buttonShadowOpacity:25, buttonShadowBlur:12, buttonShadowY:4,
      contentAlign:'center', contentPadding:64, contentShiftX:0, contentShiftY:0,
      mobileContentAlign:'center', mobileContentPadding:64, mobileContentShiftX:0, mobileContentShiftY:0,
      gapEyebrow:20, gapHeading:16, gapSub:28, mobileGapEyebrow:20, mobileGapHeading:16, mobileGapSub:28,
      contentBgEnabled:false, contentBgColor:'#ffffff', contentBgOpacity:100, contentBgPadding:24, contentBgRadius:8,
      mobileContentBgEnabled:false, mobileContentBgColor:'#ffffff', mobileContentBgOpacity:100, mobileContentBgPadding:24, mobileContentBgRadius:8,
      contentBgShadowEnabled:false, contentBgShadowColor:'#000000', contentBgShadowOpacity:20, contentBgShadowBlur:24, contentBgShadowY:10,
      mobileContentBgShadowEnabled:false, mobileContentBgShadowColor:'#000000', mobileContentBgShadowOpacity:20, mobileContentBgShadowBlur:24, mobileContentBgShadowY:10,
      desktopHeight:490, mobileHeight:620, autoplay:5200, pauseHover:true
    };
  }

  var slides = (Array.isArray(DATA.slides) && DATA.slides.length) ? DATA.slides : [defaults()];
  slides.forEach(function(s){ var d=defaults(); Object.keys(d).forEach(function(k){ if(s[k]===undefined || s[k]===null) s[k]=d[k]; }); });
  var instanceId = 'jcs' + (DATA.postId || Math.random().toString(36).slice(2,8));
  var active=0, mode='desktop', selectedStop=0, dirty=false;

  function cur(){ return slides[active]; }
  function deviceKey(base){ return mode==='mobile' ? 'mobile'+base.charAt(0).toUpperCase()+base.slice(1) : base; }
  function curVal(base){ return cur()[deviceKey(base)]; }
  function setVal(base, value){ cur()[deviceKey(base)] = value; markDirty(); }
  function curGradient(){
    var s = cur();
    if(!s.mobileGradient){ s.mobileGradient = JSON.parse(JSON.stringify(s.gradient || defaultGradient())); }
    if(!s.gradient){ s.gradient = defaultGradient(); }
    return mode==='desktop' ? s.gradient : s.mobileGradient;
  }
  function esc(str){ return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function hexRgb(hex){
    var h=(hex||'#000000').replace('#','');
    if(h.length===3) h=h.split('').map(function(x){return x+x;}).join('');
    return parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16);
  }
  function gradientCssFromStops(stops){
    var sorted = stops.slice().sort(function(a,b){return a.pos-b.pos;});
    return sorted.map(function(s){ return 'rgba('+hexRgb(s.color)+','+s.opacity.toFixed(2)+') '+s.pos+'%'; }).join(', ');
  }
  function gradientCss(g){
    if(g.type==='off') return 'none';
    var stopsCss = gradientCssFromStops(g.stops);
    if(g.type==='radial') return 'radial-gradient(circle at '+g.radialX+'% '+g.radialY+'%, '+stopsCss+')';
    return 'linear-gradient('+g.angle+'deg, '+stopsCss+')';
  }

  function el(id){ return document.getElementById(id); }

  function markDirty(){ dirty = true; el('jcsStatus').textContent = 'Unsaved changes'; }


  function normalizeStoredText(value){
    var text = value == null ? '' : String(value);
    text = text.replace(/\r\n?/g,'\n');
    // Preserve real line breaks, and recover escaped line breaks from imported JSON/code.
    text = text.replace(/\\n/g,'\n');
    // Repair the specific legacy import corruption where "\n&" was flattened to "n&".
    text = text.replace(/([A-Za-z0-9,.;:!?])n&\s*/g,'$1 & ');
    return text;
  }

  // ---------- field bindings ----------
  var simpleFields = {
    fEyebrow:'eyebrow', fHeading:'heading', fSub:'subheading', fBtnText:'buttonText', fBtnUrl:'buttonUrl', fDeskBgLink:'desktopBgLink', fMobBgLink:'mobileBgLink',
    fDeskImg:'desktopImage', fMobImg:'mobileImage', fAlt:'altText', fFit:'desktopFit', fAttachment:'desktopAttachment',
    fBgColor:'bgColor', fOverlayType:'overlayType', fOverlayColor:'overlayColor', fOverlayImage:'overlayImage', fOverlayBlend:'overlayBlendMode',
    fHeadingColor:'headingColor', fSubColor:'subColor', fEyebrowBg:'eyebrowBg', fEyebrowColor:'eyebrowColor',
    fBtnBg:'buttonBg', fBtnColor:'buttonColor', fArrowBg:'arrowBg', fArrowIconColor:'arrowIconColor',
    fArrowBorderColor:'arrowBorderColor', fDashColor:'dashColor', fEyebrowShadowColor:'eyebrowShadowColor',
    fButtonShadowColor:'buttonShadowColor', fButtonHoverBg:'buttonHoverBg', fButtonHoverColor:'buttonHoverColor',
    fHeadingFont:'headingFont', fBodyFont:'bodyFont', fEyebrowFont:'eyebrowFont', fButtonFont:'buttonFont', fHeadingWeight:'headingWeight', fBodyWeight:'bodyWeight', fEyebrowWeight:'eyebrowWeight', fButtonWeight:'buttonWeight', fDeskHeight:'desktopHeight', fMobHeight:'mobileHeight', fAutoplay:'autoplay'
  };
  var rangeFields = {
    fDeskX:'desktopX', fDeskY:'desktopY', fDeskZoom:'desktopZoom', fMobX:'mobileX', fMobY:'mobileY', fMobW:'mobileWidth',
    fOverlayOpacity:'overlayOpacity', fEyebrowOpacity:'eyebrowOpacity', fEyebrowPadX:'eyebrowPadX', fEyebrowPadY:'eyebrowPadY', fEyebrowRadius:'eyebrowRadius',
    fButtonOpacity:'buttonOpacity', fButtonPadX:'buttonPadX', fButtonHeight:'buttonHeight', fButtonRadius:'buttonRadius',
    fArrowBgOpacity:'arrowBgOpacity', fArrowBorderOpacity:'arrowBorderOpacity', fHeadingLineHeight:'headingLineHeight', fSubLineHeight:'subLineHeight',
    fEyebrowShadowOpacity:'eyebrowShadowOpacity', fEyebrowShadowBlur:'eyebrowShadowBlur', fEyebrowShadowY:'eyebrowShadowY',
    fButtonShadowOpacity:'buttonShadowOpacity', fButtonShadowBlur:'buttonShadowBlur', fButtonShadowY:'buttonShadowY'
  };
  var PX_FIELDS = ['fPaddingX','fShiftX','fShiftY','fGapEyebrow','fGapHeading','fGapSub','fEyebrowPadX','fEyebrowPadY','fEyebrowRadius','fButtonPadX','fButtonHeight','fButtonRadius','fEyebrowShadowBlur','fEyebrowShadowY','fButtonShadowBlur','fButtonShadowY'];
  var NO_SUFFIX_FIELDS = ['fHeadingLineHeight','fSubLineHeight'];
  function valSuffix(id, value){ if(NO_SUFFIX_FIELDS.indexOf(id)>=0) return value; return value + (PX_FIELDS.indexOf(id)>=0 ? 'px' : '%'); }

  function loadFields(){
    var s=cur();
    Object.keys(simpleFields).forEach(function(id){ var f=el(id); if(!f) return; var key=simpleFields[id]; if(key==='heading'||key==='subheading'||key==='eyebrow'||key==='buttonText') s[key]=normalizeStoredText(s[key]); f.value = s[key]; });
    Object.keys(rangeFields).forEach(function(id){ var f=el(id); if(!f) return; f.value = s[rangeFields[id]]; var v=el(id+'Val'); if(v) v.textContent=valSuffix(id, f.value); });
    el('fPauseHover').checked = !!s.pauseHover;
    el('fBtnNewTab').checked = !!s.buttonNewTab;
    el('fDeskBgNewTab').checked = !!s.desktopBgNewTab;
    el('fMobBgNewTab').checked = !!s.mobileBgNewTab;
    el('fDeskShowContent').checked = s.showContent !== false;
    el('fMobShowContent').checked = s.mobileShowContent !== false;
    if (typeof s.eyebrowBgEnabled === 'undefined') s.eyebrowBgEnabled = true;
    if (typeof s.buttonBgEnabled === 'undefined') s.buttonBgEnabled = true;
    el('fEyebrowBgEnabled').checked = !!s.eyebrowBgEnabled;
    el('jcsEyebrowBgDetail').style.display = s.eyebrowBgEnabled ? 'block' : 'none';
    el('fButtonBgEnabled').checked = !!s.buttonBgEnabled;
    el('jcsButtonBgDetail').style.display = s.buttonBgEnabled ? 'block' : 'none';
    el('fEyebrowShadowEnabled').checked = !!s.eyebrowShadowEnabled;
    el('jcsEyebrowShadowDetail').style.display = s.eyebrowShadowEnabled ? 'block' : 'none';
    el('fButtonShadowEnabled').checked = !!s.buttonShadowEnabled;
    el('jcsButtonShadowDetail').style.display = s.buttonShadowEnabled ? 'block' : 'none';
    el('fButtonHoverEnabled').checked = !!s.buttonHoverEnabled;
    el('jcsButtonHoverDetail').style.display = s.buttonHoverEnabled ? 'block' : 'none';
    refreshOverlayUI(); refreshLayoutFields(); refreshTypographyFields(); refreshContentBgFields(); refreshGradientFields();
  }

  ['fBtnNewTab','fDeskBgNewTab','fMobBgNewTab','fDeskShowContent','fMobShowContent'].forEach(function(id){
    el(id).addEventListener('change',function(){
      var map={fBtnNewTab:'buttonNewTab',fDeskBgNewTab:'desktopBgNewTab',fMobBgNewTab:'mobileBgNewTab',fDeskShowContent:'showContent',fMobShowContent:'mobileShowContent'};
      cur()[map[id]]=!!this.checked; markDirty(); renderAll();
    });
  });

  function refreshOverlayUI(){
    var type = cur().overlayType;
    el('jcsOverlayColorRow').style.display = type==='color' ? 'block' : 'none';
    el('jcsOverlayImageRow').style.display = type==='image' ? 'block' : 'none';
  }
  el('fOverlayType').addEventListener('change', function(){ cur().overlayType = el('fOverlayType').value; refreshOverlayUI(); renderAll(); markDirty(); });

  var LAYOUT_PX_FIELDS = { fPaddingX:'contentPadding', fShiftX:'contentShiftX', fShiftY:'contentShiftY', fGapEyebrow:'gapEyebrow', fGapHeading:'gapHeading', fGapSub:'gapSub' };
  var TYPO_PX_FIELDS = { fEyebrowSize:'eyebrowSize', fHeadingSize:'headingSize', fSubSize:'subSize', fButtonFontSize:'buttonFontSize', fWidth:'contentWidth', fEyebrowShiftX:'eyebrowShiftX', fEyebrowShiftY:'eyebrowShiftY', fHeadingShiftX:'headingShiftX', fHeadingShiftY:'headingShiftY', fSubShiftX:'subShiftX', fSubShiftY:'subShiftY', fButtonShiftX:'buttonShiftX', fButtonShiftY:'buttonShiftY', fButtonWidth:'buttonWidth' };
  var TYPO_SPACING_FIELDS = { fEyebrowLetterSpacing:'eyebrowLetterSpacing', fHeadingLetterSpacing:'headingLetterSpacing', fSubLetterSpacing:'subLetterSpacing', fButtonLetterSpacing:'buttonLetterSpacing' };

  function refreshTypographyFields(){
    el('jcsTypeModeBadge').textContent = 'Editing: ' + (mode==='desktop' ? 'Desktop' : 'Mobile') + ' typography';
    el('jcsCopyTypo').textContent = mode==='desktop' ? 'Copy from Mobile typography' : 'Copy from Desktop typography';
    Object.keys(TYPO_PX_FIELDS).forEach(function(id){ var f = el(id); f.value = curVal(TYPO_PX_FIELDS[id]); el(id+'Val').textContent = f.value+'px'; }); if(el('fWidthNumber')) el('fWidthNumber').value=curVal('contentWidth');
    Object.keys(TYPO_SPACING_FIELDS).forEach(function(id){ var f = el(id); f.value = curVal(TYPO_SPACING_FIELDS[id]); el(id+'Val').textContent = f.value+'px'; });
    document.querySelectorAll('#jcsTextAlignGroup button').forEach(function(b){ b.classList.toggle('active', b.dataset.value === curVal('textAlign')); });
  }
  Object.keys(TYPO_PX_FIELDS).forEach(function(id){
    el(id).addEventListener('input', function(){ setVal(TYPO_PX_FIELDS[id], Number(el(id).value)); el(id+'Val').textContent = el(id).value+'px'; if(id==='fWidth' && el('fWidthNumber')) el('fWidthNumber').value=el(id).value; renderAll(); });
  });
  Object.keys(TYPO_SPACING_FIELDS).forEach(function(id){
    el(id).addEventListener('input', function(){ setVal(TYPO_SPACING_FIELDS[id], Number(el(id).value)); el(id+'Val').textContent = el(id).value+'px'; renderAll(); });
  });
  if(el('fWidthNumber')) el('fWidthNumber').addEventListener('input', function(){ var v=Math.max(120,Math.min(1900,Number(this.value)||120)); setVal('contentWidth',v); el('fWidth').value=v; el('fWidthVal').textContent=v+'px'; renderAll(); });
  document.querySelectorAll('.jcs-width-preset').forEach(function(btn){ btn.addEventListener('click', function(){ var v=Number(btn.dataset.width)||480; setVal('contentWidth',v); el('fWidth').value=v; if(el('fWidthNumber')) el('fWidthNumber').value=v; el('fWidthVal').textContent=v+'px'; renderAll(); markDirty(); }); });
  document.querySelectorAll('#jcsTextAlignGroup button').forEach(function(b){ b.addEventListener('click', function(){ setVal('textAlign', b.dataset.value); refreshTypographyFields(); renderAll(); }); });
  el('jcsCopyTypo').onclick=function(){
    Object.keys(TYPO_PX_FIELDS).concat(Object.keys(TYPO_SPACING_FIELDS)).forEach(function(id){
      var base = TYPO_PX_FIELDS[id] || TYPO_SPACING_FIELDS[id];
      var fromKey = mode==='desktop' ? 'mobile'+base.charAt(0).toUpperCase()+base.slice(1) : base;
      var toKey = mode==='desktop' ? base : 'mobile'+base.charAt(0).toUpperCase()+base.slice(1);
      cur()[toKey] = cur()[fromKey];
    });
    var fromAlign = mode==='desktop' ? 'mobileTextAlign' : 'textAlign';
    var toAlign = mode==='desktop' ? 'textAlign' : 'mobileTextAlign';
    cur()[toAlign] = cur()[fromAlign];
    refreshTypographyFields(); renderAll(); markDirty();
  };

  function refreshLayoutFields(){
    el('jcsLayoutModeBadge').textContent = 'Editing: ' + (mode==='desktop' ? 'Desktop' : 'Mobile') + ' layout';
    el('jcsCopyLayout').textContent = mode==='desktop' ? 'Copy from Mobile layout' : 'Copy from Desktop layout';
    document.querySelectorAll('#jcsJustifyGroup button').forEach(function(b){ b.classList.toggle('active', b.dataset.value === curVal('contentSide')); });
    el('fAlignY').value = curVal('contentAlign');
    Object.keys(LAYOUT_PX_FIELDS).forEach(function(id){ var f = el(id); f.value = curVal(LAYOUT_PX_FIELDS[id]); el(id+'Val').textContent = f.value+'px'; }); if(el('fShiftXNumber')) el('fShiftXNumber').value=curVal('contentShiftX');
  }
  document.querySelectorAll('#jcsJustifyGroup button').forEach(function(b){
    b.addEventListener('click', function(){
      setVal('contentSide', b.dataset.value);
      document.querySelectorAll('#jcsJustifyGroup button').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active'); renderAll();
    });
  });
  el('fAlignY').addEventListener('change', function(){ setVal('contentAlign', el('fAlignY').value); renderAll(); });
  Object.keys(LAYOUT_PX_FIELDS).forEach(function(id){
    el(id).addEventListener('input', function(){ setVal(LAYOUT_PX_FIELDS[id], Number(el(id).value)); el(id+'Val').textContent = el(id).value+'px'; if(id==='fShiftX' && el('fShiftXNumber')) el('fShiftXNumber').value=el(id).value; renderAll(); });
  });

  if(el('fShiftXNumber')) el('fShiftXNumber').addEventListener('input', function(){ var v=Math.max(-1000,Math.min(1000,Number(this.value)||0)); setVal('contentShiftX',v); el('fShiftX').value=v; el('fShiftXVal').textContent=v+'px'; renderAll(); });

  var CONTENTBG_PX_FIELDS = { fContentBgPadding:'contentBgPadding', fContentBgRadius:'contentBgRadius', fContentBgShadowBlur:'contentBgShadowBlur', fContentBgShadowY:'contentBgShadowY' };
  var CONTENTBG_COLOR_FIELDS = { fContentBgColor:'contentBgColor', fContentBgShadowColor:'contentBgShadowColor' };
  function refreshContentBgFields(){
    el('fContentBgEnabled').checked = !!curVal('contentBgEnabled');
    el('fContentBgShadowEnabled').checked = !!curVal('contentBgShadowEnabled');
    el('jcsContentBgDetail').style.display = curVal('contentBgEnabled') ? 'block' : 'none';
    el('jcsContentBgShadowDetail').style.display = curVal('contentBgShadowEnabled') ? 'block' : 'none';
    Object.keys(CONTENTBG_COLOR_FIELDS).forEach(function(id){ el(id).value = curVal(CONTENTBG_COLOR_FIELDS[id]); });
    Object.keys(CONTENTBG_PX_FIELDS).forEach(function(id){ var f = el(id); f.value = curVal(CONTENTBG_PX_FIELDS[id]); el(id+'Val').textContent = f.value+'px'; });
    el('fContentBgOpacity').value = curVal('contentBgOpacity'); el('fContentBgOpacityVal').textContent = curVal('contentBgOpacity')+'%';
    el('fContentBgShadowOpacity').value = curVal('contentBgShadowOpacity'); el('fContentBgShadowOpacityVal').textContent = curVal('contentBgShadowOpacity')+'%';
  }
  el('fContentBgEnabled').addEventListener('change', function(){ setVal('contentBgEnabled', el('fContentBgEnabled').checked); refreshContentBgFields(); renderAll(); });
  el('fContentBgShadowEnabled').addEventListener('change', function(){ setVal('contentBgShadowEnabled', el('fContentBgShadowEnabled').checked); refreshContentBgFields(); renderAll(); });
  Object.keys(CONTENTBG_COLOR_FIELDS).forEach(function(id){ el(id).addEventListener('input', function(){ setVal(CONTENTBG_COLOR_FIELDS[id], el(id).value); renderAll(); }); });
  Object.keys(CONTENTBG_PX_FIELDS).forEach(function(id){
    el(id).addEventListener('input', function(){ setVal(CONTENTBG_PX_FIELDS[id], Number(el(id).value)); el(id+'Val').textContent = el(id).value+'px'; renderAll(); });
  });
  el('fContentBgOpacity').addEventListener('input', function(){ setVal('contentBgOpacity', Number(el('fContentBgOpacity').value)); el('fContentBgOpacityVal').textContent = el('fContentBgOpacity').value+'%'; renderAll(); });
  el('fContentBgShadowOpacity').addEventListener('input', function(){ setVal('contentBgShadowOpacity', Number(el('fContentBgShadowOpacity').value)); el('fContentBgShadowOpacityVal').textContent = el('fContentBgShadowOpacity').value+'%'; renderAll(); });

  el('jcsCopyLayout').onclick=function(){
    var LAYOUT_BASES = ['contentSide','contentAlign','contentPadding','contentShiftX','contentShiftY','gapEyebrow','gapHeading','gapSub','contentBgEnabled','contentBgColor','contentBgOpacity','contentBgPadding','contentBgRadius','contentBgShadowEnabled','contentBgShadowColor','contentBgShadowOpacity','contentBgShadowBlur','contentBgShadowY'];
    LAYOUT_BASES.forEach(function(base){
      var fromKey = mode==='desktop' ? 'mobile'+base.charAt(0).toUpperCase()+base.slice(1) : base;
      var toKey = mode==='desktop' ? base : 'mobile'+base.charAt(0).toUpperCase()+base.slice(1);
      cur()[toKey] = cur()[fromKey];
    });
    refreshLayoutFields(); refreshContentBgFields(); renderAll(); markDirty();
  };

  Object.keys(simpleFields).forEach(function(id){
    var f=el(id); if(!f) return;
    f.addEventListener('input', function(){ cur()[simpleFields[id]] = f.value; renderAll(); markDirty(); });
  });
  Object.keys(rangeFields).forEach(function(id){
    var f=el(id); if(!f) return;
    f.addEventListener('input', function(){ cur()[rangeFields[id]] = Number(f.value); var v=el(id+'Val'); if(v) v.textContent=valSuffix(id, f.value); renderAll(); markDirty(); });
  });
  el('fPauseHover').addEventListener('change', function(){ cur().pauseHover = el('fPauseHover').checked; markDirty(); });
  el('fEyebrowBgEnabled').addEventListener('change', function(){ cur().eyebrowBgEnabled = el('fEyebrowBgEnabled').checked; el('jcsEyebrowBgDetail').style.display = cur().eyebrowBgEnabled ? 'block' : 'none'; renderAll(); markDirty(); });
  el('fButtonBgEnabled').addEventListener('change', function(){ cur().buttonBgEnabled = el('fButtonBgEnabled').checked; el('jcsButtonBgDetail').style.display = cur().buttonBgEnabled ? 'block' : 'none'; renderAll(); markDirty(); });
  el('fEyebrowShadowEnabled').addEventListener('change', function(){ cur().eyebrowShadowEnabled = el('fEyebrowShadowEnabled').checked; el('jcsEyebrowShadowDetail').style.display = cur().eyebrowShadowEnabled ? 'block' : 'none'; renderAll(); markDirty(); });
  el('fButtonShadowEnabled').addEventListener('change', function(){ cur().buttonShadowEnabled = el('fButtonShadowEnabled').checked; el('jcsButtonShadowDetail').style.display = cur().buttonShadowEnabled ? 'block' : 'none'; renderAll(); markDirty(); });
  el('fButtonHoverEnabled').addEventListener('change', function(){ cur().buttonHoverEnabled = el('fButtonHoverEnabled').checked; el('jcsButtonHoverDetail').style.display = cur().buttonHoverEnabled ? 'block' : 'none'; renderAll(); markDirty(); });
  ['fDeskHeight','fMobHeight'].forEach(function(id){
    el(id).addEventListener('input', function(){
      var value = Math.max(200, Math.min(1600, Number(el(id).value) || 200));
      cur()[simpleFields[id]] = value;
      renderCanvas();
      renderCode();
      markDirty();
    });
    el(id).addEventListener('change', function(){
      var value = Math.max(200, Math.min(1600, Number(el(id).value) || 200));
      el(id).value = value;
      cur()[simpleFields[id]] = value;
      renderCanvas();
      renderCode();
      markDirty();
    });
  });
  el('fAutoplay').addEventListener('change', function(){ cur().autoplay = Number(el('fAutoplay').value); markDirty(); renderCode(); });

  // ---------- gradient editor ----------
  el('fGradType').addEventListener('change', function(){ curGradient().type = el('fGradType').value; renderGradientUI(); renderAll(); markDirty(); });
  el('fAngle').addEventListener('input', function(){ curGradient().angle = Number(el('fAngle').value)%360; syncDial(); renderAll(); markDirty(); });
  el('fRadX').addEventListener('input', function(){ curGradient().radialX = Number(el('fRadX').value); el('fRadXVal').textContent = el('fRadX').value+'%'; renderAll(); markDirty(); });
  el('fRadY').addEventListener('input', function(){ curGradient().radialY = Number(el('fRadY').value); el('fRadYVal').textContent = el('fRadY').value+'%'; renderAll(); markDirty(); });

  function renderGradientUI(){
    var g = curGradient();
    var editor = el('jcsGradientEditor');
    editor.style.display = g.type==='off' ? 'none' : 'block';
    el('jcsAngleRow').style.display = g.type==='linear' ? 'flex' : 'none';
    el('jcsAngleLabel').style.display = g.type==='linear' ? 'block' : 'none';
    el('jcsRadialRow').style.display = g.type==='radial' ? 'block' : 'none';
    el('jcsRadialLabel').style.display = g.type==='radial' ? 'block' : 'none';
    var bar = el('jcsGradBar');
    bar.innerHTML = '<div class="jcs-gradient-bar-fill" style="background:linear-gradient(90deg, '+gradientCssFromStops(g.stops)+')"></div>';
    g.stops.forEach(function(s,i){
      var h=document.createElement('div');
      h.className='jcs-stop-handle'+(i===selectedStop?' selected':'');
      h.style.left=s.pos+'%'; h.style.setProperty('--swatch', s.color); h.dataset.index=i;
      h.addEventListener('pointerdown', function(e){
        e.stopPropagation(); selectedStop=i; renderGradientUI();
        var moving=true; h.setPointerCapture(e.pointerId);
        function move(ev){ if(!moving) return; var r=bar.getBoundingClientRect(); var pct=Math.round(((ev.clientX-r.left)/r.width)*100); pct=Math.max(0,Math.min(100,pct)); g.stops[i].pos=pct; renderGradientUI(); renderAll(); markDirty(); }
        function up(){ moving=false; h.removeEventListener('pointermove',move); h.removeEventListener('pointerup',up); }
        h.addEventListener('pointermove',move); h.addEventListener('pointerup',up);
      });
      bar.appendChild(h);
    });
    bar.onclick = function(e){
      if(e.target !== bar) return;
      var r=bar.getBoundingClientRect(); var pct=Math.round(((e.clientX-r.left)/r.width)*100);
      g.stops.push({pos:pct, color:'#000000', opacity:0.5}); selectedStop = g.stops.length-1;
      renderGradientUI(); renderAll(); markDirty();
    };
    renderStopEditor(); syncDial();
  }
  function renderStopEditor(){
    var g = curGradient(); var s = g.stops[selectedStop];
    if(!s){ el('jcsStopEditor').innerHTML=''; return; }
    var wrap = el('jcsStopEditor');
    wrap.innerHTML =
      '<div class="row"><label>Colour</label><input id="jcsStopColor" type="color" value="'+s.color+'"><span></span></div>' +
      '<div class="row"><label>Opacity</label><input id="jcsStopOpacity" type="range" min="0" max="100" value="'+Math.round(s.opacity*100)+'"><span id="jcsStopOpacityVal">'+Math.round(s.opacity*100)+'%</span></div>' +
      '<div class="row"><label>Position</label><input id="jcsStopPos" type="range" min="0" max="100" value="'+s.pos+'"><button class="del" id="jcsStopDel" '+(g.stops.length<=2?'disabled':'')+'>Delete stop</button></div>';
    el('jcsStopColor').addEventListener('input', function(){ s.color=this.value; renderGradientUI(); renderAll(); markDirty(); });
    el('jcsStopOpacity').addEventListener('input', function(){ s.opacity = Number(this.value)/100; el('jcsStopOpacityVal').textContent = this.value+'%'; renderAll(); markDirty();
      var bar=el('jcsGradBar'); if(bar.firstChild) bar.firstChild.style.background='linear-gradient(90deg, '+gradientCssFromStops(g.stops)+')'; });
    el('jcsStopPos').addEventListener('input', function(){ s.pos = Number(this.value); renderGradientUI(); renderAll(); markDirty(); });
    el('jcsStopDel').addEventListener('click', function(){ if(g.stops.length<=2) return; g.stops.splice(selectedStop,1); selectedStop = Math.max(0, selectedStop-1); renderGradientUI(); renderAll(); markDirty(); });
  }
  function syncDial(){ var g = curGradient(); el('fAngle').value = g.angle; el('jcsDialHandle').style.transform = 'rotate('+g.angle+'deg)'; }
  (function setupDial(){
    var dial = el('jcsDial');
    dial.addEventListener('pointerdown', function(e){
      dial.setPointerCapture(e.pointerId);
      function update(ev){
        var r=dial.getBoundingClientRect(); var cx=r.left+r.width/2, cy=r.top+r.height/2; var dx=ev.clientX-cx, dy=ev.clientY-cy;
        var angle = (Math.atan2(dx,-dy)*180/Math.PI + 360) % 360;
        curGradient().angle = Math.round(angle); syncDial(); renderAll(); markDirty();
      }
      update(e);
      function move(ev){ update(ev); }
      function up(){ dial.removeEventListener('pointermove',move); dial.removeEventListener('pointerup',up); }
      dial.addEventListener('pointermove',move); dial.addEventListener('pointerup',up);
    });
  })();

  // ---------- canvas render ----------
  var canvas = el('jcsCanvas');
  var canvasImg = el('jcsCanvasImg');

  function editorCanvasDocument(){
    // Render the selected banner with the EXACT same HTML/CSS generator used by Copy embed code.
    // We temporarily generate only the active banner so the editor never previews a different slide.
    var originalSlides = slides;
    var originalActive = active;
    var selectedSlide = originalSlides[originalActive] || originalSlides[0];
    slides = [selectedSlide];
    active = 0;
    var code = generateCode();
    slides = originalSlides;
    active = originalActive;
    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:transparent}body{font-family:Inter,Arial,sans-serif}</style>' +
      '</head><body>' + code + '</body></html>';
  }

  function renderCanvas(){
    var s = cur();
    canvas.className = 'jcs-canvas ' + mode;

    // The editor viewport IS the real output viewport.
    var desiredW = mode==='desktop' ? Number(el('jcsPreviewWidth').value) : 390;
    var desiredH = mode==='desktop' ? Number(s.desktopHeight || 490) : Number(s.mobileHeight || 620);
    canvas.style.width = desiredW+'px';
    canvas.style.height = desiredH+'px';
    canvas.style.minWidth = desiredW+'px';
    canvas.style.flex = '0 0 '+desiredW+'px';
    canvas.style.background = 'transparent';

    var stage = el('jcsStage');
    var availableW = Math.max(1, stage.clientWidth - 40);
    var availableH = Math.max(1, stage.clientHeight - 40);
    // Scale the whole real viewport only so it fits on screen. Its internal layout remains exact.
    var scale = Math.min(1, availableW / desiredW, availableH / desiredH);
    canvas.style.transformOrigin = 'top left';
    canvas.style.transform = 'scale('+scale+')';
    var wrap = el('jcsScaleWrap');
    wrap.style.width = (desiredW*scale)+'px';
    wrap.style.height = (desiredH*scale)+'px';

    var frame = el('jcsCanvasFrame');
    if(!frame){
      frame = document.createElement('iframe');
      frame.id = 'jcsCanvasFrame';
      frame.title = 'Actual banner output';
      frame.setAttribute('aria-label','Actual banner output');
      frame.tabIndex = -1;
      canvas.innerHTML = '';
      canvas.appendChild(frame);
    }
    frame.style.width = desiredW+'px';
    frame.style.height = desiredH+'px';
    frame.srcdoc = editorCanvasDocument();
  }

  // Background is locked; use Background controls for position and sizing.


  function refreshGradientFields(){
    el('jcsGradientModeBadge').textContent = 'Editing: ' + (mode==='desktop' ? 'Desktop' : 'Mobile') + ' gradient';
    el('jcsCopyGradient').textContent = mode==='desktop' ? 'Copy from Mobile gradient' : 'Copy from Desktop gradient';
    el('fGradType').value = curGradient().type; el('fAngle').value = curGradient().angle;
    el('fRadX').value = curGradient().radialX; el('fRadY').value = curGradient().radialY;
    el('fRadXVal').textContent = curGradient().radialX+'%'; el('fRadYVal').textContent = curGradient().radialY+'%';
    selectedStop = 0; renderGradientUI();
  }
  el('jcsCopyGradient').onclick=function(){
    if(mode==='desktop'){ cur().gradient = JSON.parse(JSON.stringify(cur().mobileGradient)); } else { cur().mobileGradient = JSON.parse(JSON.stringify(cur().gradient)); }
    refreshGradientFields(); renderAll(); markDirty();
  };

  el('jcsDesktopMode').onclick=function(){ mode='desktop'; el('jcsDesktopMode').classList.add('active'); el('jcsMobileMode').classList.remove('active'); el('jcsWidthRow').style.display='flex'; refreshLayoutFields(); refreshTypographyFields(); refreshContentBgFields(); refreshGradientFields(); renderCanvas(); };
  el('jcsMobileMode').onclick=function(){ mode='mobile'; el('jcsMobileMode').classList.add('active'); el('jcsDesktopMode').classList.remove('active'); el('jcsWidthRow').style.display='none'; refreshLayoutFields(); refreshTypographyFields(); refreshContentBgFields(); refreshGradientFields(); renderCanvas(); };
  el('jcsPreviewWidth').addEventListener('input', function(){ el('jcsPreviewWidthVal').textContent = this.value+'px'; renderCanvas(); });

  document.querySelectorAll('.jcs-tab').forEach(function(t){
    t.addEventListener('click', function(){
      document.querySelectorAll('.jcs-tab').forEach(function(x){x.classList.remove('active');});
      document.querySelectorAll('.jcs-tabpanel').forEach(function(x){x.classList.remove('active');});
      t.classList.add('active');
      document.querySelector('.jcs-tabpanel[data-panel="'+t.dataset.tab+'"]').classList.add('active');
    });
  });

  function renderSlideTabs(){
    var wrap = el('jcsSlideTabs'); wrap.innerHTML='';
    slides.forEach(function(_,i){
      var tab=document.createElement('div'); tab.className = 'jcs-slide-tab-wrap' + (i===active ? ' active' : '');
      var b=document.createElement('button'); b.textContent='Banner '+(i+1); b.onclick=function(){ active=i; loadFields(); renderAll(); }; tab.appendChild(b);
      if(slides.length>1){
        var del=document.createElement('button'); del.className='jcs-slide-tab-delete'; del.title='Delete this banner'; del.textContent='\u00D7';
        del.onclick=function(e){ e.stopPropagation(); if(!window.confirm('Delete Banner '+(i+1)+'?')) return; slides.splice(i,1); active = Math.max(0, active >= i ? active-1 : active); loadFields(); renderAll(); markDirty(); };
        tab.appendChild(del);
      }
      wrap.appendChild(tab);
    });
    el('jcsModeBadge').textContent = slides.length>1 ? '- Slider ('+slides.length+')' : '- Single banner';
  }
  el('jcsAdd').onclick=function(){ slides.push(defaults()); active=slides.length-1; loadFields(); renderAll(); markDirty(); };
  el('jcsDuplicate').onclick=function(){ slides.splice(active+1,0,JSON.parse(JSON.stringify(cur()))); active++; loadFields(); renderAll(); markDirty(); };
  el('jcsRemove').onclick=function(){
    if(slides.length===1){ window.alert('A project must contain at least one banner. Use New blank to reset it.'); return; }
    if(!window.confirm('Remove Banner '+(active+1)+'?')) return;
    slides.splice(active,1); active=Math.max(0,active-1); loadFields(); renderAll(); markDirty();
  };

  // ---------- portable code export (self-contained — no dependency on this plugin) ----------
  function slideMarkup(s, i){
    var g = s.gradient || defaultGradient();
    var mg = s.mobileGradient || JSON.parse(JSON.stringify(g));
    var scrimD = g.type==='off' ? 'transparent' : gradientCss(g);
    var scrimM = mg.type==='off' ? 'transparent' : gradientCss(mg);
    function justifyOf(side){ return side==='right' ? 'flex-end' : (side==='center' ? 'center' : 'flex-start'); }
    function alignTextOf(side){ return side==='right' ? 'right' : (side==='center' ? 'center' : 'left'); }
    var justifyD = justifyOf(s.contentSide), alignTextD = s.textAlign || alignTextOf(s.contentSide);
    var mSide = s.mobileContentSide != null ? s.mobileContentSide : s.contentSide;
    var justifyM = justifyOf(mSide), alignTextM = s.mobileTextAlign || alignTextOf(mSide);
    var mAlign = s.mobileContentAlign != null ? s.mobileContentAlign : s.contentAlign;
    var mPad = s.mobileContentPadding != null ? s.mobileContentPadding : s.contentPadding;
    var mShiftX = s.mobileContentShiftX || 0, mShiftY = s.mobileContentShiftY || 0;
    var mGapEyebrow = s.mobileGapEyebrow != null ? s.mobileGapEyebrow : s.gapEyebrow;
    var mGapHeading = s.mobileGapHeading != null ? s.mobileGapHeading : s.gapHeading;
    var mGapSub = s.mobileGapSub != null ? s.mobileGapSub : s.gapSub;
    var mHeadingSize = s.mobileHeadingSize != null ? s.mobileHeadingSize : Math.round(s.headingSize*0.74);
    var mSubSize = s.mobileSubSize != null ? s.mobileSubSize : s.subSize;
    var mEyebrowSize = s.mobileEyebrowSize != null ? s.mobileEyebrowSize : s.eyebrowSize;
    var mButtonFontSize = s.mobileButtonFontSize != null ? s.mobileButtonFontSize : s.buttonFontSize;
    var mContentWidth = s.mobileContentWidth != null ? s.mobileContentWidth : s.contentWidth;

    var cBgD = s.contentBgEnabled ? 'rgba('+hexRgb(s.contentBgColor)+','+(s.contentBgOpacity/100)+')' : 'transparent';
    var cPadD = s.contentBgEnabled ? s.contentBgPadding : 0;
    var cRadD = s.contentBgEnabled ? s.contentBgRadius : 0;
    var cShadowD = s.contentBgShadowEnabled ? ('0 '+s.contentBgShadowY+'px '+s.contentBgShadowBlur+'px rgba('+hexRgb(s.contentBgShadowColor)+','+(s.contentBgShadowOpacity/100)+')') : 'none';
    var mBgEnabled = s.mobileContentBgEnabled != null ? s.mobileContentBgEnabled : s.contentBgEnabled;
    var mBgColor = s.mobileContentBgColor != null ? s.mobileContentBgColor : s.contentBgColor;
    var mBgOpacity = s.mobileContentBgOpacity != null ? s.mobileContentBgOpacity : s.contentBgOpacity;
    var mBgPadding = s.mobileContentBgPadding != null ? s.mobileContentBgPadding : s.contentBgPadding;
    var mBgRadius = s.mobileContentBgRadius != null ? s.mobileContentBgRadius : s.contentBgRadius;
    var mShadowEnabled = s.mobileContentBgShadowEnabled != null ? s.mobileContentBgShadowEnabled : s.contentBgShadowEnabled;
    var mShadowColor = s.mobileContentBgShadowColor != null ? s.mobileContentBgShadowColor : s.contentBgShadowColor;
    var mShadowOpacity = s.mobileContentBgShadowOpacity != null ? s.mobileContentBgShadowOpacity : s.contentBgShadowOpacity;
    var mShadowBlur = s.mobileContentBgShadowBlur != null ? s.mobileContentBgShadowBlur : s.contentBgShadowBlur;
    var mShadowY = s.mobileContentBgShadowY != null ? s.mobileContentBgShadowY : s.contentBgShadowY;
    var cBgM = mBgEnabled ? 'rgba('+hexRgb(mBgColor)+','+(mBgOpacity/100)+')' : 'transparent';
    var cPadM = mBgEnabled ? mBgPadding : 0, cRadM = mBgEnabled ? mBgRadius : 0;
    var cShadowM = mShadowEnabled ? ('0 '+mShadowY+'px '+mShadowBlur+'px rgba('+hexRgb(mShadowColor)+','+(mShadowOpacity/100)+')') : 'none';

    var eyebrowShadow = s.eyebrowShadowEnabled ? ('0 '+s.eyebrowShadowY+'px '+s.eyebrowShadowBlur+'px rgba('+hexRgb(s.eyebrowShadowColor)+','+(s.eyebrowShadowOpacity/100)+')') : 'none';
    var buttonShadow = s.buttonShadowEnabled ? ('0 '+s.buttonShadowY+'px '+s.buttonShadowBlur+'px rgba('+hexRgb(s.buttonShadowColor)+','+(s.buttonShadowOpacity/100)+')') : 'none';

    var isFixed = s.desktopAttachment === 'fixed';
    var deskBgSize = s.desktopFit==='width' ? '100% auto' : (s.desktopFit==='contain' ? 'contain' : (s.desktopFit==='custom' ? (s.desktopZoom+'% auto') : 'cover'));
    var pictureStyle = ' style="background-image:url(\''+esc(s.desktopImage)+'\');background-size:'+deskBgSize+';background-position:'+s.desktopX+'% '+s.desktopY+'%;background-attachment:'+(isFixed?'fixed':'scroll')+';background-repeat:no-repeat;--jcs-mobile-bg:url(\''+esc(s.mobileImage||s.desktopImage)+'\');--jcs-mobile-bg-size:'+s.mobileWidth+'% auto;--jcs-mobile-bg-pos:'+s.mobileX+'% '+s.mobileY+'%;"';
    var overlayCss = '';
    if(s.overlayType==='color'){ overlayCss = 'display:block;opacity:'+(s.overlayOpacity/100)+';mix-blend-mode:'+s.overlayBlendMode+';background-color:'+s.overlayColor+';'; }
    else if(s.overlayType==='image' && s.overlayImage){ overlayCss = 'display:block;opacity:'+(s.overlayOpacity/100)+';mix-blend-mode:'+s.overlayBlendMode+';background-image:url(\''+esc(s.overlayImage)+'\');background-size:cover;background-position:center;background-repeat:no-repeat;'; }
    var hoverStyle = s.buttonHoverEnabled
      ? '<style>#'+instanceId+' .'+instanceId+'-slide[data-slide="'+i+'"] .csx-button:hover{background:'+s.buttonHoverBg+'!important;color:'+s.buttonHoverColor+'!important;}</style>\n      '
      : '';

    return '\n    <article class="csx-slide '+instanceId+'-slide'+(i===0?' is-active':'')+'" data-slide="'+i+'" style="background-color:'+(s.bgColor||'#0a0a0a')+';">\n' +
      '      '+hoverStyle+'<div class="csx-bg" data-attachment="'+(isFixed?'fixed':'scroll')+'"'+pictureStyle+'></div>\n' +
      (s.desktopBgLink ? '      <a class="csx-bg-link csx-bg-link-desktop" href="'+esc(s.desktopBgLink)+'"'+(s.desktopBgNewTab?' target="_blank" rel="noopener noreferrer"':'')+' aria-label="'+esc(s.altText||'Open banner link')+'"></a>\n' : '') +
      (s.mobileBgLink ? '      <a class="csx-bg-link csx-bg-link-mobile" href="'+esc(s.mobileBgLink)+'"'+(s.mobileBgNewTab?' target="_blank" rel="noopener noreferrer"':'')+' aria-label="'+esc(s.altText||'Open banner link')+'"></a>\n' : '') +
      '      <div class="csx-overlay" style="'+overlayCss+'"></div>\n' +
      '      <div class="csx-scrim" style="--jcs-scrim-d:'+scrimD+';--jcs-scrim-m:'+scrimM+';background:var(--jcs-scrim-d);"></div>\n' +
      '      <div class="csx-inner" style="justify-content:'+justifyD+';align-items:'+s.contentAlign+';padding-left:'+s.contentPadding+'px;padding-right:'+s.contentPadding+'px;--jcs-m-justify:'+justifyM+';--jcs-m-align:'+mAlign+';--jcs-m-pad:'+mPad+'px;">\n' +
      '        <div class="csx-content" style="display:'+(s.showContent===false?'none':'block')+';--jcs-mobile-display:'+(s.mobileShowContent===false?'none':'block')+';width:min('+s.contentWidth+'px,98%);text-align:'+alignTextD+';transform:translate('+s.contentShiftX+'px,'+s.contentShiftY+'px);background:'+cBgD+';padding:'+cPadD+'px;border-radius:'+cRadD+'px;box-shadow:'+cShadowD+';--jcs-m-text-align:'+alignTextM+';--jcs-m-shiftx:'+mShiftX+'px;--jcs-m-shifty:'+mShiftY+'px;--jcs-m-width:'+mContentWidth+'px;--jcs-m-content-bg:'+cBgM+';--jcs-m-content-pad:'+cPadM+'px;--jcs-m-content-radius:'+cRadM+'px;--jcs-m-content-shadow:'+cShadowM+';">\n' +
      '          <span class="csx-eyebrow" style="background:'+(s.eyebrowBgEnabled===false?'transparent':'rgba('+hexRgb(s.eyebrowBg)+','+(s.eyebrowOpacity/100)+')')+';color:'+s.eyebrowColor+';padding:'+s.eyebrowPadY+'px '+s.eyebrowPadX+'px;font-family:'+s.eyebrowFont+',sans-serif;font-weight:'+s.eyebrowWeight+';font-size:'+s.eyebrowSize+'px;letter-spacing:'+s.eyebrowLetterSpacing+'px;transform:translate('+s.eyebrowShiftX+'px,'+s.eyebrowShiftY+'px);--jcs-m-size:'+mEyebrowSize+'px;--jcs-m-letter:'+s.mobileEyebrowLetterSpacing+'px;--jcs-m-shiftx:'+s.mobileEyebrowShiftX+'px;--jcs-m-shifty:'+s.mobileEyebrowShiftY+'px;border-radius:'+s.eyebrowRadius+'px;box-shadow:'+eyebrowShadow+';margin-bottom:'+s.gapEyebrow+'px;--jcs-m-gap:'+mGapEyebrow+'px;">'+esc(s.eyebrow)+'</span>\n' +
      '          <div role="heading" aria-level="2" class="csx-heading" style="color:'+s.headingColor+';font-family:'+s.headingFont+',sans-serif;font-weight:'+s.headingWeight+';font-size:'+s.headingSize+'px;letter-spacing:'+s.headingLetterSpacing+'px;transform:translate('+s.headingShiftX+'px,'+s.headingShiftY+'px);--jcs-m-letter:'+s.mobileHeadingLetterSpacing+'px;--jcs-m-shiftx:'+s.mobileHeadingShiftX+'px;--jcs-m-shifty:'+s.mobileHeadingShiftY+'px;line-height:'+s.headingLineHeight+';margin-bottom:'+s.gapHeading+'px;--jcs-m-gap:'+mGapHeading+'px;--jcs-m-size:'+mHeadingSize+'px;">'+esc(normalizeStoredText(s.heading)).replace(/\n/g,'<br>')+'</div>\n' +
      '          <div class="csx-sub" style="color:'+s.subColor+';font-family:'+s.bodyFont+',sans-serif;font-weight:'+s.bodyWeight+';font-size:'+s.subSize+'px;letter-spacing:'+s.subLetterSpacing+'px;transform:translate('+s.subShiftX+'px,'+s.subShiftY+'px);--jcs-m-letter:'+s.mobileSubLetterSpacing+'px;--jcs-m-shiftx:'+s.mobileSubShiftX+'px;--jcs-m-shifty:'+s.mobileSubShiftY+'px;line-height:'+s.subLineHeight+';margin-bottom:'+s.gapSub+'px;--jcs-m-gap:'+mGapSub+'px;--jcs-m-size:'+mSubSize+'px;">'+esc(normalizeStoredText(s.subheading)).replace(/\n/g,'<br>')+'</div>\n' +
      '          <a href="'+esc(s.buttonUrl)+'"'+(s.buttonNewTab?' target="_blank" rel="noopener noreferrer"':'')+' class="csx-button" style="background:'+(s.buttonBgEnabled===false?'transparent':'rgba('+hexRgb(s.buttonBg)+','+(s.buttonOpacity/100)+')')+';color:'+s.buttonColor+';padding:0 '+s.buttonPadX+'px;font-family:'+s.buttonFont+',sans-serif;font-weight:'+s.buttonWeight+';font-size:'+s.buttonFontSize+'px;letter-spacing:'+s.buttonLetterSpacing+'px;transform:translate('+s.buttonShiftX+'px,'+s.buttonShiftY+'px);width:'+(s.buttonWidth>0?s.buttonWidth+'px':'auto')+';--jcs-m-size:'+mButtonFontSize+'px;--jcs-m-letter:'+s.mobileButtonLetterSpacing+'px;--jcs-m-shiftx:'+s.mobileButtonShiftX+'px;--jcs-m-shifty:'+s.mobileButtonShiftY+'px;--jcs-m-width:'+(s.mobileButtonWidth>0?s.mobileButtonWidth+'px':'auto')+';min-height:'+s.buttonHeight+'px;border-radius:'+s.buttonRadius+'px;box-shadow:'+buttonShadow+';transition:background .15s ease, color .15s ease;">'+esc(s.buttonText)+'</a>\n' +
      '        </div>\n' +
      '      </div>\n' +
      '    </article>';
  }

  function generateCode(){
    var s0 = slides[0];
    var slideHtml = slides.map(slideMarkup).join('\n');
    return '<!-- Built with Justinnovate Code Studio — self-contained, paste anywhere -->\n' +
'<!-- JCS-PROJECT-DATA-BEGIN\n'+JSON.stringify(slides).replace(/</g,'\\u003c')+'\nJCS-PROJECT-DATA-END -->\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
googleFontsLink() + '\n' +
'<section class="csx-banner-root'+(slides.length<=1?' csx-single-slide':'')+'" id="'+instanceId+'" style="--jcs-desktop-height:'+s0.desktopHeight+'px;--jcs-mobile-height:'+s0.mobileHeight+'px;" aria-roledescription="carousel" aria-label="Featured">\n' +
'  <div class="csx-track">'+slideHtml+'\n  </div>\n' +
'  <span class="csx-arrow csx-prev" role="button" tabindex="0" aria-label="Previous slide" style="background:rgba('+hexRgb(s0.arrowBg)+','+(s0.arrowBgOpacity/100)+');border:1px solid rgba('+hexRgb(s0.arrowBorderColor)+','+(s0.arrowBorderOpacity/100)+');color:'+s0.arrowIconColor+';">&#8249;</span>\n' +
'  <span class="csx-arrow csx-next" role="button" tabindex="0" aria-label="Next slide" style="background:rgba('+hexRgb(s0.arrowBg)+','+(s0.arrowBgOpacity/100)+');border:1px solid rgba('+hexRgb(s0.arrowBorderColor)+','+(s0.arrowBorderOpacity/100)+');color:'+s0.arrowIconColor+';">&#8250;</span>\n' +
'  <div class="csx-dash-track"></div>\n' +
'</section>\n\n' +
'<style>\n' +
'#'+instanceId+'{position:relative;width:100%;height:var(--jcs-desktop-height,490px);min-height:0!important;overflow:hidden;background:#000;font-family:Inter,sans-serif;isolation:isolate;box-sizing:border-box}\n' +
'#'+instanceId+' *,'+'#'+instanceId+' *::before,'+'#'+instanceId+' *::after{box-sizing:border-box!important}\n' +
'#'+instanceId+' .csx-heading,#'+instanceId+' .csx-sub,#'+instanceId+' .csx-eyebrow,#'+instanceId+' .csx-button,#'+instanceId+' .csx-arrow{font-style:normal!important;text-indent:0!important;text-transform:none!important;text-decoration:none!important;max-width:none!important}\n' +
'#'+instanceId+' .csx-heading,#'+instanceId+' .csx-sub{padding:0!important;border:0!important;background:transparent!important}\n' +
'#'+instanceId+' .csx-arrow{display:flex!important;align-items:center!important;justify-content:center!important;margin:0!important;padding:0!important;min-width:44px!important;max-width:44px!important;width:44px!important;min-height:44px!important;max-height:44px!important;height:44px!important;aspect-ratio:1/1!important;border-style:solid!important;border-width:1px!important;border-radius:9999px!important;font-family:Arial,sans-serif!important;font-weight:400!important;font-size:28px!important;line-height:1!important;letter-spacing:0!important;white-space:nowrap!important;overflow:hidden!important;appearance:none!important;-webkit-appearance:none!important}\n' +
'#'+instanceId+' .csx-arrow::before,#'+instanceId+' .csx-arrow::after{content:none!important;display:none!important}\n' +
'#'+instanceId+' .csx-bg-link{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;text-decoration:none!important;z-index:3!important;cursor:pointer!important}\n' +
'#'+instanceId+' .csx-bg-link::before,#'+instanceId+' .csx-bg-link::after{content:none!important;display:none!important}\n' +
'#'+instanceId+' .csx-track{position:relative;width:100%;height:100%!important;min-height:0!important}\n' +
'#'+instanceId+' .csx-slide{position:absolute;inset:0;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .6s ease}\n' +
'#'+instanceId+' .csx-slide.is-active{opacity:1;visibility:visible;pointer-events:auto}\n' +
'#'+instanceId+' .csx-bg{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;min-height:100%!important;overflow:hidden;background-color:transparent}\n' +
'#'+instanceId+' .csx-bg-link{position:absolute;inset:0;z-index:1;display:block}\n' +
'#'+instanceId+' .csx-bg-link-mobile{display:none}\n' +
'#'+instanceId+' .csx-scrim{position:absolute;inset:0;z-index:1;pointer-events:none}\n' +
'#'+instanceId+' .csx-overlay{position:absolute;inset:0;z-index:1;pointer-events:none;display:none}\n' +
'#'+instanceId+' .csx-inner{position:relative;z-index:4;display:flex;align-items:center;height:100%;max-width:1360px;margin:auto;padding:0 64px}\n' +
'#'+instanceId+' .csx-content{color:#fff}\n' +
'#'+instanceId+' .csx-eyebrow{display:inline-block;margin-bottom:20px;padding:5px 12px;font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase}\n' +
'#'+instanceId+' .csx-heading{margin:0 0 16px!important;text-shadow:0 2px 18px rgba(0,0,0,.4)}\n' +
'#'+instanceId+' .csx-sub{margin:0 0 28px!important}\n' +
'#'+instanceId+' .csx-button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 30px;border-radius:2px;font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;text-decoration:none}\n' +
'#'+instanceId+' .csx-arrow{position:absolute;top:50%;z-index:6;width:44px;height:44px;border-radius:50%;font-size:28px;line-height:1;cursor:pointer;transform:translateY(-50%)}\n' +
'#'+instanceId+' .csx-prev{left:20px}#'+instanceId+' .csx-next{right:20px}\n' +
'#'+instanceId+' .csx-dash-track{position:absolute;left:64px;bottom:24px;z-index:6;display:flex;gap:6px}\n' +
'#'+instanceId+' .csx-dash{width:34px;height:3px;background:rgba(255,255,255,.3);border-radius:2px;overflow:hidden;cursor:pointer}\n' +
'#'+instanceId+' .csx-dash span{display:block;width:100%;height:100%;background:'+s0.dashColor+';transform:scaleX(0);transform-origin:left}\n' +
'#'+instanceId+' .csx-dash.is-active span{transform:scaleX(1)}\n' +
'#'+instanceId+' .csx-dash.is-active.is-animating span{transition:transform '+s0.autoplay+'ms linear}\n' +
'#'+instanceId+' .csx-dash.is-filled span{transform:scaleX(1);transition:none}\n' +
'@media(max-width:900px){\n' +
'  #'+instanceId+' .csx-track{height:100%!important}\n' +
'  #'+instanceId+'{height:var(--jcs-mobile-height,620px)!important}\n' +
'  #'+instanceId+' .csx-bg{background-image:var(--jcs-mobile-bg)!important;background-size:var(--jcs-mobile-bg-size,100% auto)!important;background-position:var(--jcs-mobile-bg-pos,50% 23%)!important;background-attachment:scroll!important;background-repeat:no-repeat!important}\n' +
'  #'+instanceId+' .csx-bg-link-desktop{display:none!important}\n' +
'  #'+instanceId+' .csx-bg-link-mobile{display:block!important}\n' +
'  #'+instanceId+' .csx-scrim{background:var(--jcs-scrim-m)!important}\n' +
'  #'+instanceId+' .csx-inner{justify-content:var(--jcs-m-justify,flex-start)!important;align-items:var(--jcs-m-align,flex-end)!important;padding-left:var(--jcs-m-pad,26px)!important;padding-right:var(--jcs-m-pad,26px)!important;padding-bottom:60px!important}\n' +
'  #'+instanceId+' .csx-content{display:var(--jcs-mobile-display,block)!important;width:min(var(--jcs-m-width,480px),96%)!important;max-width:none!important;text-align:var(--jcs-m-text-align,left)!important;transform:translate(var(--jcs-m-shiftx,0px),var(--jcs-m-shifty,0px))!important;background:var(--jcs-m-content-bg,transparent)!important;padding:var(--jcs-m-content-pad,0px)!important;border-radius:var(--jcs-m-content-radius,0px)!important;box-shadow:var(--jcs-m-content-shadow,none)!important}\n' +
'  #'+instanceId+' .csx-eyebrow{margin-bottom:var(--jcs-m-gap)!important;font-size:var(--jcs-m-size)!important;letter-spacing:var(--jcs-m-letter)!important;transform:translate(var(--jcs-m-shiftx),var(--jcs-m-shifty))!important}\n' +
'  #'+instanceId+' .csx-heading{margin-bottom:var(--jcs-m-gap)!important;font-size:var(--jcs-m-size)!important;letter-spacing:var(--jcs-m-letter)!important;transform:translate(var(--jcs-m-shiftx),var(--jcs-m-shifty))!important}\n' +
'  #'+instanceId+' .csx-sub{margin-bottom:var(--jcs-m-gap)!important;font-size:var(--jcs-m-size)!important;letter-spacing:var(--jcs-m-letter)!important;transform:translate(var(--jcs-m-shiftx),var(--jcs-m-shifty))!important}\n' +
'  #'+instanceId+' .csx-button{font-size:var(--jcs-m-size)!important;letter-spacing:var(--jcs-m-letter)!important;transform:translate(var(--jcs-m-shiftx),var(--jcs-m-shifty))!important;width:var(--jcs-m-width)!important}\n' +
'  #'+instanceId+' .csx-dash-track{left:26px;bottom:24px}\n' +
'  #'+instanceId+' .csx-arrow{top:auto;bottom:18px;transform:none}\n' +
'  #'+instanceId+' .csx-prev{left:auto;right:82px}#'+instanceId+' .csx-next{right:26px}\n' +
'}\n' +
'#'+instanceId+'.csx-single-slide .csx-arrow,#'+instanceId+'.csx-single-slide .csx-dash-track{display:none!important}\n' +
'</style>\n\n' +
'<script>\n' +
'(function(){\n' +
'  var root=document.getElementById("'+instanceId+'");\n' +
'  if(!root||root.dataset.jcsInit)return; root.dataset.jcsInit="1";\n' +
'  var track=root.querySelector(".csx-track");\n' +
'  var slides=[].slice.call(track.querySelectorAll(".csx-slide"));\n' +
'  var prev=root.querySelector(".csx-prev"), next=root.querySelector(".csx-next"), dashTrack=root.querySelector(".csx-dash-track");\n' +
'  var current=0,timer=null,AUTOPLAY='+s0.autoplay+';\n' +
'  slides.forEach(function(_,i){ var d=document.createElement("div"); d.className="csx-dash"; d.innerHTML="<span></span>"; d.onclick=function(){go(i,true)}; dashTrack.appendChild(d); });\n' +
'  var dashes=[].slice.call(dashTrack.querySelectorAll(".csx-dash"));\n' +
'  function render(){\n' +
'    slides.forEach(function(s,i){s.classList.toggle("is-active",i===current)});\n' +
'    dashes.forEach(function(d,i){\n' +
'      d.classList.remove("is-active","is-filled","is-animating");\n' +
'      if(i<current)d.classList.add("is-filled");\n' +
'      else if(i===current){d.classList.add("is-active");void d.offsetWidth;if(slides.length>1)d.classList.add("is-animating")}\n' +
'    });\n' +
'  }\n' +
'  function go(i,user){current=(i+slides.length)%slides.length;render();if(user)restart()}\n' +
'  function restart(){clearInterval(timer);if(slides.length>1)timer=setInterval(function(){go(current+1,false)},AUTOPLAY)}\n' +
'  if(next)next.onclick=function(){go(current+1,true)};\n' +
'  if(prev)prev.onclick=function(){go(current-1,true)};\n' +
'  [prev,next].forEach(function(a){if(a)a.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();a.click()}}});\n' +
(s0.pauseHover ? '  root.addEventListener("mouseenter",function(){clearInterval(timer)});root.addEventListener("mouseleave",restart);\n' : '') +
'  var sx=0;\n' +
'  track.addEventListener("touchstart",function(e){sx=e.touches[0].clientX},{passive:true});\n' +
'  track.addEventListener("touchend",function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40)go(dx<0?current+1:current-1,true)},{passive:true});\n' +
'  render();restart();\n' +
'})();\n' +
'<\/script>';
  }

  var livePreviewWindow = null;
  function previewDocument(forceHeight){
    var h = Number(forceHeight || 0);
    var forceCss = h ? '<style>html,body{height:'+h+'px!important;min-height:0!important;overflow:hidden!important;background:transparent!important}body>.csx-banner-root{height:'+h+'px!important;min-height:0!important;margin:0!important}</style>' : '';
    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Justinnovate Live Preview</title>' +
      '<style>html,body{margin:0!important;padding:0!important;background:#111!important;overflow:hidden!important;min-height:0!important}body{font-family:Inter,Arial,sans-serif}body>.csx-banner-root{margin:0!important}</style>' + forceCss +
      '</head><body>' + generateCode() + '</body></html>';
  }

  function writeLivePreviewWindow(){
    if(!livePreviewWindow || livePreviewWindow.closed) return;
    try{
      var d=livePreviewWindow.document;
      d.open(); d.write(previewDocument()); d.close();
    }catch(e){}
  }

  function updateActualPreview(){
    var modal=el('jcsPreviewModal');
    if(modal && !modal.hidden){
      var frame=el('jcsPreviewFrame');
      var w=parseInt(el('jcsPreviewDevice').style.width,10)||390;
      var h=w<=900 ? Number(slides[0].mobileHeight||620) : Number(slides[0].desktopHeight||490);
      frame.srcdoc=previewDocument(h);
    }
    writeLivePreviewWindow();
  }

  function renderCode(){
    el('jcsCodeOutput').value = generateCode();
    updateActualPreview();
  }

  function renderAll(){ renderSlideTabs(); renderCanvas(); renderCode(); }

  el('jcsCopyCode').onclick = function(){
    var btn = this, ta = el('jcsCodeOutput');
    ta.select();
    navigator.clipboard.writeText(ta.value).then(function(){
      var old = btn.textContent; btn.textContent = 'Copied!';
      setTimeout(function(){ btn.textContent = old; }, 1400);
    });
  };

  if(el('jcsAutoTranslate')) el('jcsAutoTranslate').onclick = function(){
    var btn=this;
    if(!window.confirm('Translate the current English text into French? You can edit the French wording afterward.')) return;
    btn.disabled=true; var old=btn.textContent; btn.textContent='Translating…'; el('jcsStatus').textContent='Translating to French…';
    fetch(DATA.translateUrl,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-WP-Nonce':DATA.nonce},body:JSON.stringify({sourceLanguage:'en'})})
      .then(function(r){if(!r.ok) throw new Error('HTTP '+r.status); return r.json();})
      .then(function(res){ if(!res.data || res.translated!==true) throw new Error(res.message || 'No translation returned'); slides=res.data.map(function(x){return Object.assign(defaults(),x)}); active=0; loadFields(); renderAll(); markDirty(); el('jcsStatus').textContent='All banner text translated to French — review and Save'; })
      .catch(function(err){window.alert('Translation failed: '+err.message); el('jcsStatus').textContent='Translation failed';})
      .finally(function(){btn.disabled=false;btn.textContent=old;});
  };

  function setPreviewWidth(width){
    width=Number(width)||390;
    var outputHeight = width <= 900 ? Number(slides[0].mobileHeight || 620) : Number(slides[0].desktopHeight || 490);
    var device = el('jcsPreviewDevice');
    var frame = el('jcsPreviewFrame');
    device.style.width=width+'px';
    device.style.height=outputHeight+'px';
    device.style.minHeight='0';
    frame.style.height=outputHeight+'px';
    frame.style.minHeight='0';
    el('jcsPreviewSizeLabel').textContent=width+' × '+outputHeight+'px actual output';
    [].slice.call(document.querySelectorAll('[data-preview-width]')).forEach(function(btn){
      btn.classList.toggle('active', Number(btn.getAttribute('data-preview-width'))===width);
    });
    updateActualPreview();
  }

  el('jcsLivePreview').onclick=function(){
    var previewW = mode==='mobile' ? 390 : Math.max(900, Math.round(window.innerWidth));
    var previewH = mode==='mobile' ? Number(slides[0].mobileHeight||620) : Number(slides[0].desktopHeight||490);
    livePreviewWindow = window.open('', 'jcs-live-preview', 'width='+previewW+',height='+(previewH+90)+',resizable=yes,scrollbars=no');
    if(livePreviewWindow){
      writeLivePreviewWindow();
      try{ livePreviewWindow.focus(); }catch(e){}
    }else{
      // Popup blocked: fall back to the embedded exact-size preview.
      el('jcsPreviewModal').hidden=false; setPreviewWidth(mode==='mobile'?390:1440); updateActualPreview();
    }
  };
  el('jcsClosePreview').onclick=function(){ el('jcsPreviewModal').hidden=true; };
  el('jcsPreviewRefresh').onclick=updateActualPreview;
  el('jcsPreviewModal').addEventListener('click',function(e){ if(e.target===this) this.hidden=true; });
  [].slice.call(document.querySelectorAll('[data-preview-width]')).forEach(function(btn){
    btn.onclick=function(){ setPreviewWidth(this.getAttribute('data-preview-width')); };
  });

  el('jcsNew').onclick = function(){
    if(!window.confirm('Clear this project and start with one blank banner? Your current saved version will remain until you click Save.')) return;
    slides=[defaults()]; active=0; mode='desktop'; selectedStop=0;
    loadFields(); renderAll(); markDirty();
  };

  // ---------- project/code import ----------
  function copyText(text, btn){
    navigator.clipboard.writeText(text).then(function(){
      var old = btn.textContent; btn.textContent = 'Copied!';
      setTimeout(function(){ btn.textContent = old; }, 1400);
    });
  }

  function closeImport(){ el('jcsImportModal').hidden = true; }
  el('jcsOpenImport').onclick = function(){
    el('jcsImportMsg').textContent = '';
    el('jcsImportMsg').className = 'jcs-import-msg';
    el('jcsImportModal').hidden = false;
    setTimeout(function(){ el('jcsImportArea').focus(); }, 0);
  };
  el('jcsCloseImport').onclick = closeImport;
  el('jcsCancelImport').onclick = closeImport;
  el('jcsImportModal').addEventListener('click', function(e){ if(e.target === el('jcsImportModal')) closeImport(); });
  el('jcsCopyProject').onclick = function(){ copyText(JSON.stringify(slides), this); };
  el('jcsCopyTop').onclick = function(){ copyText(el('jcsCodeOutput').value, this); };

  function textOf(node){ return node ? node.textContent.trim() : ''; }
  function importLegacyCode(raw){
    var doc = new DOMParser().parseFromString(raw, 'text/html');
    var articles = [].slice.call(doc.querySelectorAll('.csx-slide, .jcs-hs-slide, .wa-hs-slide'));
    if(!articles.length) throw new Error('No banner slides found');
    var isWheels = !!doc.querySelector('.wa-hs-slide');
    var prefix = isWheels ? 'wa' : 'jcs';
    var rootNode = doc.querySelector('.'+prefix+'-hero-slider');
    var deskHeight = 490, mobHeight = 620, autoplay = 5200;
    if(rootNode){
      var styleAttr = rootNode.getAttribute('style') || '';
      var dh = styleAttr.match(new RegExp('--'+prefix+'-desktop-height:\\s*(\\d+)px'));
      var mh = styleAttr.match(new RegExp('--'+prefix+'-mobile-height:\\s*(\\d+)px'));
      if(dh) deskHeight = Number(dh[1]);
      if(mh) mobHeight = Number(mh[1]);
    }
    var apMatch = raw.match(/AUTOPLAY=(\d+)/);
    if(apMatch) autoplay = Number(apMatch[1]);
    return articles.map(function(article){
      var s = defaults();
      var img = article.querySelector('.'+prefix+'-hs-bg');
      var source = article.querySelector('source');
      var headingNode = article.querySelector('.'+prefix+'-hs-heading');
      var btn = article.querySelector('.'+prefix+'-hs-btn');
      s.eyebrow = textOf(article.querySelector('.'+prefix+'-hs-eyebrow'));
      s.heading = headingNode ? headingNode.innerHTML.replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').trim() : '';
      s.subheading = textOf(article.querySelector('.'+prefix+'-hs-sub'));
      s.buttonText = textOf(btn);
      s.buttonUrl = btn ? (btn.getAttribute('href') || '#') : '#';
      s.altText = img ? (img.getAttribute('alt') || '') : '';
      s.desktopImage = img ? (img.getAttribute('src') || '') : '';
      s.mobileImage = source ? (source.getAttribute('srcset') || s.desktopImage) : s.desktopImage;
      s.desktopHeight = deskHeight; s.mobileHeight = mobHeight; s.autoplay = autoplay;
      return s;
    });
  }

  el('jcsLoadImport').onclick = function(){
    var raw = el('jcsImportArea').value.trim();
    var msg = el('jcsImportMsg');
    if(!raw){ msg.textContent = 'Paste code or project JSON first.'; return; }
    try{
      var parsed;
      var marker = raw.match(/(?:JCS-PROJECT-DATA|WABB-DATA)-BEGIN\s*([\s\S]*?)\s*(?:JCS-PROJECT-DATA|WABB-DATA)-END/);
      if(marker){
        parsed = JSON.parse(marker[1]);
      } else {
        try { parsed = JSON.parse(raw); }
        catch(jsonError){ parsed = importLegacyCode(raw); }
      }
      if(parsed && !Array.isArray(parsed) && Array.isArray(parsed.slides)) parsed = parsed.slides;
      if(!Array.isArray(parsed) || !parsed.length) throw new Error('Empty project');
      slides = parsed.map(function(slide){ var merged=Object.assign(defaults(), slide); merged.heading=normalizeStoredText(merged.heading); merged.subheading=normalizeStoredText(merged.subheading); merged.eyebrow=normalizeStoredText(merged.eyebrow); merged.buttonText=normalizeStoredText(merged.buttonText); return merged; });
      active = 0; mode = 'desktop'; selectedStop = 0;
      loadFields(); renderAll(); markDirty();
      msg.className = 'jcs-import-msg success';
      msg.textContent = 'Loaded '+slides.length+' banner(s). Click Save to store the project in WordPress.';
      setTimeout(closeImport, 1100);
    } catch(err){
      msg.className = 'jcs-import-msg error';
      msg.textContent = "Couldn't read that code. Paste code exported by this studio, Wheels Banner Studio code, or project JSON.";
    }
  };

  window.addEventListener('resize', function(){ renderCanvas(); });

  // ---------- quick-pick colour swatches ----------
  var SWATCH_COLORS = String(STUDIO.swatches || '#000000,#404040,#737373,#a6a6a6,#d9d9d9,#ffffff,#e53935,#fb8c00,#fdd835,#43a047,#26c6da,#1e88e5,#3157df,#d81b60').split(',').map(function(x){return x.trim();}).filter(Boolean);
  root.querySelectorAll('input[type=color]').forEach(function(input){
    var row = document.createElement('div'); row.className = 'jcs-swatch-row';
    SWATCH_COLORS.forEach(function(color){
      var sw = document.createElement('button'); sw.type = 'button'; sw.className = 'jcs-swatch'; sw.style.background = color; sw.title = color;
      sw.onclick = function(){ input.value = color; input.dispatchEvent(new Event('input', {bubbles:true})); input.dispatchEvent(new Event('change', {bubbles:true})); };
      row.appendChild(sw);
    });
    input.insertAdjacentElement('afterend', row);
  });

  // ---------- title, save, unload guard ----------
  el('jcsTitle').value = DATA.title || '';
  el('jcsTitle').addEventListener('input', markDirty);

  function doSave(){
    var status = el('jcsStatus'); var btn = el('jcsSave');
    btn.disabled = true; status.textContent = 'Saving…';
    fetch(DATA.restUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': DATA.nonce },
      body: JSON.stringify({ data: slides, title: el('jcsTitle').value })
    }).then(function(r){
        return r.text().then(function(text){
          var parsed; try { parsed = JSON.parse(text); } catch(e) { parsed = null; }
          if(!r.ok){
            var msg = (parsed && parsed.message) ? parsed.message : ('HTTP ' + r.status);
            console.error('JCS save failed', r.status, text);
            throw new Error(msg);
          }
          return parsed;
        });
      })
      .then(function(){ dirty = false; status.textContent = 'All changes saved'; btn.disabled = false; })
      .catch(function(err){ status.textContent = 'Save failed: ' + err.message + ' (see console)'; btn.disabled = false; });
  }
  el('jcsSave').onclick = doSave;

  window.addEventListener('beforeunload', function(e){ if(!dirty) return; e.preventDefault(); e.returnValue=''; });

  document.addEventListener('keydown', function(e){
    if((e.ctrlKey||e.metaKey) && e.key==='s'){ e.preventDefault(); doSave(); }
  });

  // ---------- init ----------
  el('jcsStatus').textContent = dirty ? 'Unsaved changes' : 'All changes saved';
  loadFields();
  renderAll();
})();
