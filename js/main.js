/* ---------- boot ---------- */
if(typeof window!=='undefined'&&window.addEventListener)window.addEventListener('resize',function(){ if(typeof renderChatPanel==='function')renderChatPanel(); });
window.onload=function(){
  const s=load();
  if(s && s.worlds){ G=s; renderAll(); }
  else confirmNewGame();
};
