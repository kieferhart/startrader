/* ---------- boot ---------- */
if(typeof window!=='undefined'&&window.addEventListener)window.addEventListener('resize',function(){ if(typeof renderChatPanel==='function')renderChatPanel(); });

/* ---------- keyboard navigation (mouse always works too) ---------- */
function cycleDest(dir){
  const opts=G.worlds.filter(w=>w.id!==G.here&&hexDist(here(),w)<=SHIPS[G.ship].jump)
    .sort((a,b)=>hexDist(here(),a)-hexDist(here(),b)||a.id-b.id);
  if(!opts.length)return;
  let i=opts.findIndex(w=>w.id===G.dest);
  i=(i+dir+opts.length+(i<0&&dir<0?1:0))%opts.length;
  selectDest(opts[i].id);
}
function keyNav(e){
  if(!G)return;
  const tag=((e.target&&e.target.tagName)||'').toLowerCase();
  if(tag==='input'||tag==='textarea'||tag==='select')return;
  const k=(e.key||'').toLowerCase();
  // decision pop-ups / transit decisions: digits pick an option
  if(G.pendingChoice&&/^[1-9]$/.test(k)){
    const o=G.pendingChoice.options[+k-1];
    if(o){ resolveChoice(o.k); if(e.preventDefault)e.preventDefault(); }
    return;
  }
  if(typeof EV_OPEN!=='undefined'&&EV_OPEN&&!EV_CHOICE&&(k==='enter'||k===' '||k==='escape')){
    evNext(); if(e.preventDefault)e.preventDefault(); return;
  }
  if(k==='escape'){ closeModal(); if(typeof chatDocked==='function'&&!chatDocked()&&CHAT_OPEN)toggleChatPanel(); dismissChatPop(); return; }
  if(k==='?'){ showKeysHelp(); return; }
  if(k==='t'){ setTheme(crtOn()?'std':'crt'); return; }
  if(k==='m'){ toggleChatPanel(); return; }
  if(G.transit){ if(k==='e'||k==='enter'){ finishJump(); if(e.preventDefault)e.preventDefault(); } return; }
  switch(k){
    case '1': switchTab('trade'); break;
    case '2': switchTab('map'); break;
    case '3': switchTab('bridge'); break;
    case 'f': searchCargo('port'); break;
    case 'a': searchCargo('away'); break;
    case 'p': doPortEvent(); break;
    case 'o': doMeetContact(); break;
    case 'j': doJump(); break;
    case '[': cycleDest(-1); break;
    case ']': cycleDest(1); break;
    case 'r': refuel('refined'); break;
    case 'u': refuel('unrefined'); break;
    case 'k': refuel('skim'); break;
    case 'y': refuel('purify'); break;
  }
}
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('keydown',keyNav);

window.onload=function(){
  if(typeof applyTheme==='function')applyTheme();
  const s=load();
  if(s && s.worlds){ G=s; renderAll(); }
  else confirmNewGame();
};
