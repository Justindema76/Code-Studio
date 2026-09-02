(function(){
  'use strict';

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
    el.style.setProperty('text-transform','none','important');
    el.style.setProperty('z-index','50','important');
    el.style.setProperty('cursor','pointer','important');
    if(side==='prev'){
      el.style.setProperty('left','18px','important');
      el.style.removeProperty('right');
    }else{
      el.style.setProperty('right','18px','important');
      el.style.removeProperty('left');
    }
  }

  function ensureCanvasArrows(doc){
    var canvas = doc.getElementById('jcsCanvas');
    if(canvas){
      var prev = canvas.querySelector('.jcs-c-prev');
      var next = canvas.querySelector('.jcs-c-next');
      if(!prev){
        prev = doc.createElement('div');
        prev.className='jcs-c-arrow jcs-c-prev';
        prev.innerHTML='&#8249;';
        canvas.appendChild(prev);
      }
      if(!next){
        next = doc.createElement('div');
        next.className='jcs-c-arrow jcs-c-next';
        next.innerHTML='&#8250;';
        canvas.appendChild(next);
      }
      forceArrow(prev,'prev');
      forceArrow(next,'next');
    }
  }

  function ensureGeneratedArrows(doc){
    doc.querySelectorAll('.csx-banner-root').forEach(function(root){
      var prev = root.querySelector('.csx-prev');
      var next = root.querySelector('.csx-next');
      if(!prev){
        prev = doc.createElement('span');
        prev.className='csx-arrow csx-prev';
        prev.setAttribute('role','button');
        prev.setAttribute('tabindex','0');
        prev.setAttribute('aria-label','Previous slide');
        prev.innerHTML='&#8249;';
        root.appendChild(prev);
      }
      if(!next){
        next = doc.createElement('span');
        next.className='csx-arrow csx-next';
        next.setAttribute('role','button');
        next.setAttribute('tabindex','0');
        next.setAttribute('aria-label','Next slide');
        next.innerHTML='&#8250;';
        root.appendChild(next);
      }
      forceArrow(prev,'prev');
      forceArrow(next,'next');
    });
  }

  function fixDocument(doc){
    try{
      ensureCanvasArrows(doc);
      ensureGeneratedArrows(doc);
      doc.querySelectorAll('iframe').forEach(function(frame){
        try{
          if(frame.contentDocument) {
            ensureGeneratedArrows(frame.contentDocument);
            ensureCanvasArrows(frame.contentDocument);
          }
        }catch(e){}
      });
    }catch(e){}
  }

  function run(){ fixDocument(document); }
  run();
  document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('load',run);
  setInterval(run,500);

  if(window.MutationObserver){
    new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  }
})();
