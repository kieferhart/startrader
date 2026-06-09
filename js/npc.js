/* ---------- Contacts ---------- */
const CFIRST=['Nikos','Vella','Sergei','Mara','Jon','Susan','Megan','Tariq','Lena','Cano','Beck','Ivo'];
const CROLE=['free-trader captain','broker','dock boss','smuggler','retired naval officer','noble’s agent','mechanic','information broker'];
function genContact(){ return {name:CFIRST[R(CFIRST.length)-1], role:CROLE[R(CROLE.length)-1], world:here().name}; }
function doMeetContact(){
  dropChoice();
  advanceTime(2);
  const sp=here().u.sp;
  let dm = G.contacts.length>=9?3: G.contacts.length>=6?2: G.contacts.length>=3?1:0;
  dm += sp==='B'?-1: sp==='C'?-2: sp==='D'?-3: sp==='E'?-6:0;
  if(G.mods&&G.mods.nextContactDM){ dm+=G.mods.nextContactDM; G.mods.nextContactDM=0; }
  const roll=_2d6()+dm;
  const a=document.getElementById('event-area');
  if(roll>=10 && G.contacts.length){
    const c=G.contacts[R(G.contacts.length)-1];
    a.innerHTML='<div class="event glow"><div class="t">Old Friend · roll '+roll+'</div>You run into <b>'+c.name+'</b>, a '+c.role+' you met on '+c.world+'. They’re glad to help this week.</div>'+a.innerHTML;
  } else {
    a.innerHTML='<div class="event glow"><div class="t">Contacts · roll '+roll+'</div>No familiar faces this week'+(G.contacts.length?'.':' — you have no contacts yet. Meet people through port and jump events.')+'</div>'+a.innerHTML;
  }
  save(); renderAll();
}

/* ---------- helpers ---------- */
const here=()=>world(G.here);
const world=id=>G.worlds.find(w=>w.id===id);
function logEntry(text,cls,amt){
  G.log.unshift({wk:Math.floor(G.day/7)+1, text, cls:cls||'', amt});
  if(G.log.length>200)G.log.pop();
}
function flash(msg){
  const a=document.getElementById('event-area');
  a.innerHTML='<div class="event glow" style="border-color:#c97"><div class="t" style="color:#ffcf6b">Notice</div>'+msg+'</div>'+a.innerHTML;
}

