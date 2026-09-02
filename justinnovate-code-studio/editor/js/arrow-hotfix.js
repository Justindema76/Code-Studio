(function(){
  'use strict';
  var BAD='.csx-heading,.csx-sub,.csx-eyebrow,.csx-button,.csx-arrow{font-style:normal!important;text-indent:0!important;text-transform:none!important;text-decoration:none!important;max-width:none!important;float:none!important;position:relative!important;white-space:normal!important;vertical-align:baseline!important}';
  var GOOD='.csx-heading,.csx-sub,.csx-eyebrow,.csx-button{font-style:normal!important;text-indent:0!important;text-transform:none!important;text-decoration:none!important;max-width:none!important;float:none!important;position:relative!important;white-space:normal!important;vertical-align:baseline!important}';
  function fixCode(){
    var out=document.getElementById('jcsCodeOutput');
    if(out && out.value && out.value.indexOf(BAD)!==-1) out.value=out.value.split(BAD).join(GOOD);
  }
  function forceArrows(doc){
    if(!doc) return;
    var id='csx-arrow-position-hotfix';
    if(doc.getElementById(id)) return;
    var style=doc.createElement('style');
    style.id=id;
    style.textContent='.csx-banner-root .csx-arrow{position:absolute!important;top:50%!important;transform:translateY(-50%)!important;z-index:50!important;display:flex!important;visibility:visible!important;opacity:1!important}.csx-banner-root .csx-prev{left:18px!important}.csx-banner-root .csx-next{right:18px!important}';
    (doc.head||doc.documentElement).appendChild(style);
  }
  function fixEditorPreview(){
    document.querySelectorAll('iframe').forEach(function(frame){try{forceArrows(frame.contentDocument);}catch(e){}});
  }
  document.addEventListener('click',function(e){
    if(e.target && e.target.id==='jcsLivePreview'){
      setTimeout(function(){try{var w=window.open('','jcs-live-preview');if(w) forceArrows(w.document);}catch(err){}},250);
    }
    if(e.target && (e.target.id==='jcsCopyCode'||e.target.id==='jcsCopyTop')) fixCode();
  },true);
  setInterval(function(){fixCode();fixEditorPreview();},250);
})();