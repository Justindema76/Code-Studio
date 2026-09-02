(function(){
  'use strict';

  var livePreviewRef = null;
  var PATCH_MARKER = 'JCS-HOST-OVERRIDES-V2';

  function forceArrow(el, side){
    if(!el) return;
    el.style.setProperty('display','flex','important');
    el.style.setProperty('position','absolute','important');
    el.style.setProperty('top','50%','important');
    el.style.setProperty('transform','translateY(-50%)','important');
    el.style.setProperty('width','44px','important');
    el.style.setProperty('height','44px','important');
    el.style.setProperty('min-width','44px','important');
    el.style.setProperty('min-height','44px','important');
    el.style.setProperty('max-width','44px','important');
    el.style.setProperty('max-height','44px','important');
    el.style.setProperty('padding','0','important');
    el.style.setProperty('margin','0','important');
    el.style.setProperty('border-radius','9999px','important');
    el.style.setProperty('align-items','center','important');
    el.style.setProperty('justify-content','center','important');
    el.style.setProperty('font-family','Arial, sans-serif','important');
    el.style.setProperty('font-size','28px','important');
    el.style.setProperty('font-weight','400','important');
    el.style.setProperty('line-height','1','important');
    el.style.setProperty('letter-spacing','0','important');
    el.style.setProperty('text-transform','none','important');
    el.style.setProperty('opacity','1','important');
    el.style.setProperty('visibility','visible','important');
    el.style.setProperty('pointer-events','auto','important');
    el.style.setProperty('z-index','2147483000','important');
    el.style.setProperty('cursor','pointer','important');
    if(side==='prev'){
      el.style.setProperty('left','18px','important');
      el.style.setProperty('right','auto','important');
    }else{
      el.style.setProperty('right','18px','important');
      el.style.setProperty('left','auto','important');
    }
  }

  function ensureCanvasArrows(doc){
    var canvas = doc.getElementById('jcsCanvas');
    if(!canvas) return;
    var prev = canvas.querySelector('.jcs-c-prev');
    var next = canvas.querySelector('.jcs-c-next');
    if(prev) forceArrow(prev,'prev');
    if(next) forceArrow(next,'next');
  }

  function ensureGeneratedArrows(doc){
    doc.querySelectorAll('.csx-banner-root').forEach(function(root){
      if(root.querySelectorAll('.csx-slide').length <= 1) return;
      var prev = root.querySelector('.csx-prev');
      var next = root.querySelector('.csx-next');
      if(!prev){
        prev = doc.createElement('span');
        prev.className = 'csx-arrow csx-prev';
        prev.setAttribute('role','button');
        prev.setAttribute('tabindex','0');
        prev.setAttribute('aria-label','Previous slide');
        prev.innerHTML = '&#8249;';
        root.appendChild(prev);
      }
      if(!next){
        next = doc.createElement('span');
        next.className = 'csx-arrow csx-next';
        next.setAttribute('role','button');
        next.setAttribute('tabindex','0');
        next.setAttribute('aria-label','Next slide');
        next.innerHTML = '&#8250;';
        root.appendChild(next);
      }
      forceArrow(prev,'prev');
      forceArrow(next,'next');
    });
  }

  function injectPreviewCss(doc){
    if(!doc || !doc.head) return;
    var style = doc.getElementById('jcs-live-arrow-override');
    if(!style){
      style = doc.createElement('style');
      style.id = 'jcs-live-arrow-override';
      style.textContent = '.csx-banner-root .csx-arrow{display:flex!important;position:absolute!important;top:50%!important;transform:translateY(-50%)!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;z-index:2147483000!important}.csx-banner-root .csx-prev{left:18px!important;right:auto!important}.csx-banner-root .csx-next{right:18px!important;left:auto!important}';
      doc.head.appendChild(style);
    }
    ensureGeneratedArrows(doc);
  }

  function patchEmbedCode(){
    var out = document.getElementById('jcsCodeOutput');
    if(!out || !out.value || out.value.indexOf(PATCH_MARKER)!==-1) return;

    var runtime = '\n<!-- '+PATCH_MARKER+' -->\n' +
      '<style>\n' +
      '.csx-banner-root .csx-arrow{display:flex!important;position:absolute!important;top:50%!important;transform:translateY(-50%)!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;z-index:2147483000!important}\n' +
      '.csx-banner-root .csx-prev{left:18px!important;right:auto!important}\n' +
      '.csx-banner-root .csx-next{right:18px!important;left:auto!important}\n' +
      'main#maincontent.page-main-full-width:has(.csx-banner-root){padding-top:0!important;padding-bottom:0!important}\n' +
      '</style>\n' +
      '<script>(function(){function f(a,s){if(!a)return;var p=a.style;p.setProperty("display","flex","important");p.setProperty("position","absolute","important");p.setProperty("top","50%","important");p.setProperty("transform","translateY(-50%)","important");p.setProperty("width","44px","important");p.setProperty("height","44px","important");p.setProperty("min-width","44px","important");p.setProperty("min-height","44px","important");p.setProperty("max-width","44px","important");p.setProperty("max-height","44px","important");p.setProperty("padding","0","important");p.setProperty("margin","0","important");p.setProperty("border-radius","9999px","important");p.setProperty("align-items","center","important");p.setProperty("justify-content","center","important");p.setProperty("font-family","Arial,sans-serif","important");p.setProperty("font-size","28px","important");p.setProperty("font-weight","400","important");p.setProperty("line-height","1","important");p.setProperty("opacity","1","important");p.setProperty("visibility","visible","important");p.setProperty("pointer-events","auto","important");p.setProperty("z-index","2147483000","important");if(s==="p"){p.setProperty("left","18px","important");p.setProperty("right","auto","important")}else{p.setProperty("right","18px","important");p.setProperty("left","auto","important")}}function r(){document.querySelectorAll(".csx-banner-root").forEach(function(root){if(root.querySelectorAll(".csx-slide").length<=1)return;var p=root.querySelector(".csx-prev"),n=root.querySelector(".csx-next");if(!p){p=document.createElement("span");p.className="csx-arrow csx-prev";p.innerHTML="&#8249;";root.appendChild(p)}if(!n){n=document.createElement("span");n.className="csx-arrow csx-next";n.innerHTML="&#8250;";root.appendChild(n)}f(p,"p");f(n,"n");var m=root.closest("main#maincontent.page-main-full-width");if(m){m.style.setProperty("padding-top","0","important");m.style.setProperty("padding-bottom","0","important")}})}r();document.addEventListener("DOMContentLoaded",r);window.addEventListener("load",r);setTimeout(r,100);setTimeout(r,500);setInterval(r,1500)})();<\/script>\n';

    out.value += runtime;
  }

  function attachLivePreviewFix(){
    var btn = document.getElementById('jcsLivePreview');
    if(!btn || btn.dataset.jcsArrowFixBound==='1') return;
    btn.dataset.jcsArrowFixBound='1';
    btn.addEventListener('click', function(){
      setTimeout(function(){
        try{
          livePreviewRef = window.open('', 'jcs-live-preview');
          if(livePreviewRef && !livePreviewRef.closed){
            injectPreviewCss(livePreviewRef.document);
            setTimeout(function(){ if(livePreviewRef && !livePreviewRef.closed) injectPreviewCss(livePreviewRef.document); },150);
            setTimeout(function(){ if(livePreviewRef && !livePreviewRef.closed) injectPreviewCss(livePreviewRef.document); },600);
          }
        }catch(e){}
      },0);
    });
  }

  function run(){
    ensureCanvasArrows(document);
    ensureGeneratedArrows(document);
    patchEmbedCode();
    attachLivePreviewFix();
    try{
      if(livePreviewRef && !livePreviewRef.closed) injectPreviewCss(livePreviewRef.document);
    }catch(e){}
  }

  run();
  document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('load',run);
  setInterval(run,300);
})();
