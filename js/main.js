/* ---------- boot ---------- */
window.onload=function(){
  const s=load();
  if(s && s.worlds){ G=s; renderAll(); }
  else confirmNewGame();
};
