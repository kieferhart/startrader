/* ============================================================
   AI LAYER — BYOK (bring your own key). Claude Haiku gives the crew
   and NPCs a voice and lets them pick their own actions in character.
   The key lives in localStorage ONLY (never in the save, never sent
   anywhere but api.anthropic.com). Without a key everything still
   works — the rule-based brain in people.js drives behavior and chat
   is disabled. The model may only pick from engine-approved actions
   and propose engine-validated offers; it never invents numbers.
   ============================================================ */

const AI_KEY='starTraderAIKey', AI_USAGE='starTraderAIUsage',
      AI_PROV='starTraderAIProvider', AI_MODEL_KEY='starTraderAIModel';
const AI_DEFAULTS={anthropic:'claude-haiku-4-5', openrouter:'anthropic/claude-haiku-4.5'};
// keys are sanitized to printable ASCII — copied keys often pick up invisible
// characters or a Unicode ellipsis from truncated displays, which both breaks
// fetch headers (non ISO-8859-1) and guarantees a 401
function cleanKey(v){ return String(v||'').replace(/[^\x21-\x7E]/g,''); }
function aiKey(){ try{return cleanKey(localStorage.getItem(AI_KEY)||'');}catch(e){return '';} }
function aiProvider(){ try{return localStorage.getItem(AI_PROV)||'anthropic';}catch(e){return 'anthropic';} }
function aiModel(){ try{return localStorage.getItem(AI_MODEL_KEY)||AI_DEFAULTS[aiProvider()];}catch(e){return AI_DEFAULTS.anthropic;} }
function aiEnabled(){ return !!aiKey(); }
function aiUsage(){ try{return JSON.parse(localStorage.getItem(AI_USAGE))||{i:0,o:0};}catch(e){return {i:0,o:0};} }
function trackUsage(inTok,outTok){ const t=aiUsage(); t.i+=inTok||0; t.o+=outTok||0;
  try{localStorage.setItem(AI_USAGE,JSON.stringify(t));}catch(e){} }
function aiCost(){ const u=aiUsage(); return (u.i*1+u.o*5)/1e6; }   // Haiku-rate estimate ($1/$5 per M)

// models reached through OpenRouter can't use Anthropic-native structured
// outputs, so on that path the schema is enforced by prompt + loose parsing
function parseLooseJSON(t){
  t=String(t).trim();
  if(t.indexOf('```')===0)t=t.replace(/^```[a-z]*\s*/i,'').replace(/```\s*$/,'').trim();
  const i=t.indexOf('{'), j=t.lastIndexOf('}');
  if(i>=0&&j>i)t=t.slice(i,j+1);
  return JSON.parse(t);
}
async function aiCall(system,messages,schema,maxTok){
  if(aiProvider()==='openrouter'){
    let sys=system;
    if(schema)sys+='\n\nRespond ONLY with a single valid JSON object matching this JSON Schema — no prose, no code fences:\n'+JSON.stringify(schema);
    const body={model:aiModel(),max_tokens:maxTok||600,
      messages:[{role:'system',content:sys}].concat(messages)};
    const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{
      method:'POST',
      headers:{'content-type':'application/json','authorization':'Bearer '+aiKey(),
        'HTTP-Referer':'https://kieferhart.github.io/startrader/','X-Title':'Star Trader'},
      body:JSON.stringify(body)});
    if(!r.ok){ let m='OpenRouter '+r.status; try{const eb=await r.json(); m+=': '+String((eb.error&&eb.error.message)||'').slice(0,140);}catch(e){} throw new Error(m); }
    const d=await r.json();
    if(d.usage)trackUsage(d.usage.prompt_tokens,d.usage.completion_tokens);
    const t=d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content;
    if(!t)throw new Error('empty');
    return schema?parseLooseJSON(t):t;
  }
  const body={model:aiModel(),max_tokens:maxTok||600,system,messages};
  if(schema)body.output_config={format:{type:'json_schema',schema}};
  const r=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':aiKey(),
      'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify(body)});
  if(!r.ok){ let m='Anthropic '+r.status; try{const eb=await r.json(); m+=': '+String((eb.error&&eb.error.message)||'').slice(0,140);}catch(e){} throw new Error(m); }
  const d=await r.json();
  if(d.usage)trackUsage(d.usage.input_tokens,d.usage.output_tokens);
  const t=(d.content||[]).find(b=>b.type==='text');
  if(!t)throw new Error('empty');
  return schema?JSON.parse(t.text):t.text;
}

/* ---------- shared context builders ---------- */
function shipBrief(){
  const w=here(); const s=SHIPS[G.ship];
  const recent=(G.log||[]).slice(0,5).map(e=>e.text.replace(/<[^>]*>/g,'')).join(' | ');
  const cargo=(G.hold||[]).slice(0,5).map(h=>h.tons+'t '+h.name+' ('+goodCat(h)+')').join(', ');
  const loans=(G.loans||[]).map(l=>'owes '+l.from+' '+cr(Math.round(l.P*(1+l.rate/100)))+' by day '+(l.due+1)).join('; ');
  const reqs=(G.requests||[]).map(r=>r.tons+'t '+(r.vname||goodById(r.gid).name)+' promised to '+r.name+' on '+r.world+' by day '+(r.due+1)).join('; ');
  return 'GAME STATE — day '+(G.day+1)+', the ship ('+s.name+') is docked at '+w.name+' ('+(w.codes.join(' ')||'plain world')+', law '+w.u.law+', starport '+w.u.sp+'). '+
    'Captain visible funds roughly '+cr(Math.round(G.credits/1000)*1000)+'. '+
    'Hold '+holdUsed()+'/'+s.cargo+'t'+(cargo?' carrying: '+cargo:' (empty)')+'. '+
    'Fuel '+Math.floor(G.fuel==null?0:G.fuel)+'/'+s.fuelCap+'t '+(G.fuelUnrefined?'UNREFINED (misjump risk until purified)':'refined')+'. '+
    'Ship morale: '+moraleWord(shipMorale())+'. Captain health: '+(G.captain?hpWord(G.captain):'fit')+'. '+
    (loans?'Ship debts: '+loans+'. ':'')+(reqs?'Open delivery commissions: '+reqs+'. ':'')+
    ((G.bills&&billTotal()>0)?('UNPAID BILLS: wages '+cr(G.bills.wages)+(G.bills.wagesM?' ('+G.bills.wagesM+' months late — the crew has not been paid)':'')+
      ', mortgage '+cr(G.bills.mortgage)+(G.bills.mortM?' ('+G.bills.mortM+' months late'+(G.bills.mortM>=3?', recovery agents hunting the ship':G.bills.mortM>=2?', liens filed':'')+')':'')+
      ', upkeep '+cr(G.bills.upkeep)+'. '):'')+
    'Recent events: '+(recent||'a quiet stretch')+'.';
}
function businessWith(ch){
  const bits=[];
  (G.loans||[]).filter(l=>l.fromId===ch.id).forEach(l=>bits.push('the captain owes YOU '+cr(Math.round(l.P*(1+l.rate/100)))+', due day '+(l.due+1)+(l.missed?' (ALREADY MISSED ONCE — you are not amused)':'')));
  (G.lent||[]).filter(l=>l.toId===ch.id&&!l.resolved).forEach(l=>bits.push('YOU owe the captain '+cr(Math.round(l.P*(1+l.rate/100)))+', promised by day '+(l.due+1)));
  (G.requests||[]).filter(r=>r.by===ch.id).forEach(r=>bits.push('the captain promised you '+r.tons+'t of '+(r.vname||goodById(r.gid).name)+' by day '+(r.due+1)+' at '+cr(r.ppt)+'/t'));
  return bits.length?' OUTSTANDING BUSINESS between you and this captain: '+bits.join('; ')+'. Bring it up if it matters to you.':'';
}
function crewSheet(c){
  const rels=Object.entries(c.crels||{}).map(([k,v])=>(k==='@captain'?'the captain':k)+' '+(v>0?'+':'')+v).join(', ');
  return 'You are '+c.name+', '+c.position+' aboard a tramp trader. Traits: '+(c.traits||[]).join(', ')+'. '+
    'Goals — soon: '+c.goals.short.txt+'; this year: '+c.goals.medium.txt+'; someday: '+c.goals.long.txt+'. '+
    'Health: '+hpWord(c)+'. Private savings: about '+cr(c.wallet)+' (SECRET — never state the number; only offer money if your feelings toward the captain are warm and it serves your interests). '+
    'Feelings (−100 hostile..+100 devoted): '+rels+'. '+(c.rel?('Background: '+c.rel.desc+' '+(c.rel.target||'')+'. '):'')+
    shipBrief()+worldKnowledge(c.name);
}
function npcSheet(ch){
  return 'You are '+ch.name+', a '+ch.role+' on '+ch.world+'. Traits: '+(ch.traits||[]).join(', ')+'. '+
    'Goals — soon: '+ch.goals.short.txt+'; this year: '+ch.goals.medium.txt+'; someday: '+ch.goals.long.txt+'. '+
    'Your feeling toward this ship and crew: '+shipRel(ch)+' (−100..+100). '+
    'You met them on '+ch.world+'. '+
    (ch.wantItem?('You NEED to source a specific item: '+ch.wantItem.vname+' ('+goodById(ch.wantItem.gid).name+'). If you ask the captain to obtain goods for you, it must be exactly that item — never any other goods. '):'')+
    shipBrief()+businessWith(ch)+worldKnowledge(ch.name);
}
function worldKnowledge(excludeName){
  const from=here(); 
  const near=G.worlds.filter(w=>w.id!==G.here).map(w=>({w,d:hexDist(from,w)}))
    .sort((x,y)=>x.d-y.d).slice(0,6)
    .map(x=>x.w.name+' ('+(x.w.codes.join(' ')||'frontier world')+', '+x.d+'pc away)').join('; ');
  const others=(G.cast||[]).filter(c=>c.name!==excludeName).slice(-10)
    .map(c=>c.name+' ('+c.role+', on '+c.world+')').join('; ');
  return ' REAL PLACES: you are on '+here().name+'. Nearby worlds: '+near+'. '+
    'REAL PEOPLE you know of: '+(others||'nobody of note')+'. '+
    'Crew of the visiting ship: '+(G.crew||[]).map(c=>c.name+' ('+c.position+')').join(', ')+'.';
}
const CHAT_RULES=' RULES: Stay in character — terse, lived-in spacer dialect. 1–3 sentences. Never invent game numbers, cargo, prices, rules or events. Never reveal hidden mechanics. If asked for money you do not want to give, deflect in character. When you mention people, traders, worlds or places, use ONLY names from the REAL PLACES / REAL PEOPLE lists in your briefing — never invent names of people or locations.';

/* ---------- AI crew brain (replaces the rule picks when enabled) ---------- */
const BRAIN_SCHEMA={type:'object',additionalProperties:false,required:['picks'],
 properties:{picks:{type:'array',items:{type:'object',additionalProperties:false,
  required:['name','action','line'],
  properties:{name:{type:'string'},action:{type:'string'},line:{type:'string'}}}}}};
async function aiCrewBrain(ctx,report){
  const roster=(G.crew||[]).map(c=>({name:c.name,sheet:crewSheet(c),acts:eligibleCrewActs(c,ctx)}));
  const sys='You decide what each crew member of a Traveller-style tramp trader does this '+(ctx==='jump'?'jump week in transit':'week in port')+
    '. For EACH crew member pick exactly one action id from THEIR list (in character — traits, goals and feelings drive choices; "rest" is always fine), plus one short in-character line of dialogue. Output JSON only.';
  const usr=roster.map(r=>r.sheet+'\nAvailable action ids for '+r.name+': '+r.acts.join(', ')).join('\n\n');
  const out=await aiCall(sys,[{role:'user',content:usr}],BRAIN_SCHEMA,900);
  const seen=new Set();
  (out.picks||[]).forEach(p=>{
    const c=crewByName(p.name); if(!c||seen.has(p.name))return; seen.add(p.name);
    const k=(eligibleCrewActs(c,ctx).indexOf(p.action)>=0)?p.action:pickCrewAct(c,ctx);
    const line=String(p.line||'').slice(0,160);
    const res=execCrewAct(c,k,line); if(res)report.push(res);
  });
  (G.crew||[]).forEach(c=>{ if(!seen.has(c.name)){ const res=execCrewAct(c,pickCrewAct(c,ctx)); if(res)report.push(res); } });
  finishCrewTick(ctx,report);
}

/* ---------- Chat ---------- */
const CHAT_SCHEMA={type:'object',additionalProperties:false,required:['say','suggest','offer'],
 properties:{say:{type:'string'},
  suggest:{anyOf:[{type:'null'},{type:'string'}]},
  offer:{anyOf:[{type:'null'},{type:'object',additionalProperties:false,required:['type','amount'],
    properties:{type:{type:'string',enum:['gift','loan']},amount:{type:'integer'}}}]}}};
let CHAT_CUR=null;   // null = roster list; else {kind:'crew'|'cast', name}
let CHAT_OPEN=false;
function chatKey(kind,name){ return kind+':'+name; }
function chatLog(kind,name){ if(!G.chats)G.chats={}; const k=chatKey(kind,name);
  if(!G.chats[k])G.chats[k]=[]; return G.chats[k]; }
function chatChar(kind,name){
  return kind==='crew'?crewByName(name):(G.cast||[]).find(c=>c.name===name);
}
function chatUnreadMap(){ if(!G.chatUnread)G.chatUnread={}; return G.chatUnread; }
function chatUnreadTotal(){ return Object.values(chatUnreadMap()).reduce((a,b)=>a+b,0); }
function markUnread(kind,name){ const m=chatUnreadMap(); const k=chatKey(kind,name); m[k]=(m[k]||0)+1; updateChatBadge(); }
function updateChatBadge(){ const b=document.getElementById('chatbadge'); if(!b)return;
  const n=chatUnreadTotal(); b.style.display=n?'flex':'none'; b.textContent=n; }
function toggleChatPanel(){ CHAT_OPEN=!CHAT_OPEN; if(CHAT_OPEN)dismissChatPop(); renderChatPanel(); }
function openChatList(){ CHAT_CUR=null; renderChatPanel(); }
function showChat(kind,name){
  CHAT_CUR={kind,name}; CHAT_OPEN=true;
  delete chatUnreadMap()[chatKey(kind,name)];
  if(typeof closeModal==='function')closeModal();
  dismissChatPop(); updateChatBadge(); renderChatPanel(); save();
}
function chatRoster(){
  const rows=[]; const seen=new Set();
  (G.crew||[]).forEach(c=>{ rows.push({kind:'crew',name:c.name,sub:c.position+' \u00b7 '+moraleWord(morale(c)),here:true}); seen.add(chatKey('crew',c.name)); });
  peopleHere().forEach(ch=>{ rows.push({kind:'cast',name:ch.name,sub:ch.role+' \u00b7 '+ch.world,here:true}); seen.add(chatKey('cast',ch.name)); });
  Object.keys(G.chats||{}).forEach(k=>{
    if(seen.has(k))return;
    const i=k.indexOf(':'); const kind=k.slice(0,i), name=k.slice(i+1);
    const c=chatChar(kind,name); if(!c)return;
    rows.push({kind,name,sub:(c.role||c.position||'')+' \u00b7 away on '+(c.world||'parts unknown'),here:false});
  });
  return rows;
}
function renderChatPanel(extra){
  const p=document.getElementById('chatpanel'); if(!p)return;
  p.style.display=CHAT_OPEN?'flex':'none';
  if(!CHAT_OPEN)return;
  const head=document.getElementById('chathead'), body=document.getElementById('chatbody'), foot=document.getElementById('chatfoot');
  if(!head||!body||!foot)return;
  if(!CHAT_CUR){
    head.innerHTML='<b>COMMS</b><span class="x" style="margin-left:auto" onclick="toggleChatPanel()">\u2715</span>';
    const m=chatUnreadMap();
    body.innerHTML=chatRoster().map(r=>{
      const k=chatKey(r.kind,r.name); const log=(G.chats||{})[k]||[];
      const last=log.length?String(log[log.length-1].text).replace(/<[^>]*>/g,'').slice(0,42):'';
      return '<div class="chatrow'+(r.here?'':' away')+'" onclick="showChat(\''+r.kind+'\',\''+r.name+'\')">'+
        '<b>'+r.name+'</b>'+(m[k]?'<span class="chatdot">'+m[k]+'</span>':'')+
        '<div class="hint">'+r.sub+'</div>'+(last?'<div class="hint muted">'+last+'</div>':'')+'</div>';
    }).join('')||'<div class="hint" style="padding:10px">No one around to talk to.</div>';
    foot.innerHTML=aiEnabled()?'':'<div class="hint" style="padding:2px 4px">Add an API key in <a href="#" onclick="showSettings();return false">\u2699 AI</a> to talk with people.</div>';
    return;
  }
  const kind=CHAT_CUR.kind, name=CHAT_CUR.name; const c=chatChar(kind,name);
  const present=!!c&&(kind==='crew'||c.world===here().name);
  head.innerHTML='<span class="x" onclick="openChatList()">\u2039</span><b>'+name+'</b>'+
    '<span class="hint" style="margin-left:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+
    (c?(kind==='crew'?(c.position+' \u00b7 '+moraleWord(morale(c))+' \u00b7 '+hpWord(c)):(c.role+(present?'':' \u00b7 on '+c.world))):'gone')+'</span>'+
    '<span class="x" style="margin-left:auto" onclick="toggleChatPanel()">\u2715</span>';
  const log=chatLog(kind,name);
  body.innerHTML=(log.map(function(m,i){
    let inner='<div class="chatmsg '+(m.who==='you'?'me':'them')+'">'+m.text;
    if(m.off&&!m.off.done)inner+='<div class="row" style="margin-top:7px">'+
      m.off.options.map(o=>'<button onclick="resolveChatOffer('+i+',\''+o.k+'\')">'+o.label+'</button>').join('')+'</div>';
    else if(m.off&&m.off.done)inner+='<div class="hint" style="margin-top:4px">\u2713 settled</div>';
    return inner+'</div>';
  }).join('')||'<div class="hint" style="padding:8px">Say something. They are listening.</div>')+(extra||'');
  foot.innerHTML=!aiEnabled()
    ?'<div class="hint" style="padding:2px 4px">Chat needs a key \u2014 <a href="#" onclick="showSettings();return false">\u2699 AI</a>.</div>'
    :(!present?'<div class="hint" style="padding:2px 4px">'+name+' isn\u2019t on '+here().name+' right now.</div>'
    :'<input id="chatin" type="text" placeholder="Say something\u2026" onkeydown="if(event.key===\'Enter\')sendChat()">'+
     '<button class="primary" onclick="sendChat()">Send</button>');
  if(body.scrollTo)body.scrollTo(0,999999); else body.scrollTop=999999;
}
async function sendChat(){
  const inp=document.getElementById('chatin'); const text=(inp&&inp.value||'').trim();
  if(!text||!CHAT_CUR)return;
  const kind=CHAT_CUR.kind, name=CHAT_CUR.name; const c=chatChar(kind,name); if(!c)return;
  const log=chatLog(kind,name);
  log.push({who:'you',text}); if(log.length>16)log.shift();
  save(); renderChatPanel('<div class="hint">\u2026</div>');
  const acts=kind==='crew'?eligibleCrewActs(c,'port'):eligibleNpcActs(c).filter(k=>['tipoff','deal','intro','reqitem','barter','loanoffer'].indexOf(k)>=0&&(k!=='reqitem'||c.wantItem));
  const sys=(kind==='crew'?crewSheet(c):npcSheet(c))+CHAT_RULES+
    ' You may optionally set "suggest" to ONE of these action ids if it fits the conversation: ['+acts.join(', ')+'] \u2014 otherwise null.'+
    (kind==='crew'?' You may optionally set "offer" to {type:"gift"|"loan", amount} ONLY if you genuinely would (warm feelings, you can afford it, it serves your goals) \u2014 otherwise null.':' Set "offer" to null.');
  const msgs=log.map(m=>({role:m.who==='you'?'user':'assistant',content:String(m.text).replace(/<[^>]*>/g,'')}));
  try{
    const out=await aiCall(sys,msgs,CHAT_SCHEMA,400);
    log.push({who:'them',text:out.say}); if(log.length>16)log.shift();
    let extra='';
    if(out.suggest&&acts.indexOf(out.suggest)>=0)
      extra+='<div style="margin:6px 0"><button onclick="chatDoSuggest(\''+out.suggest+'\')">Let them: '+out.suggest+'</button></div>';
    if(out.offer&&kind==='crew'){
      const amt=Math.round(out.offer.amount/50)*50;
      const ok=morale(c)>35&&amt>0&&amt<=c.wallet&&(out.offer.type==='gift'?amt<=c.wallet*0.5:true);
      if(ok)extra+='<div style="margin:6px 0"><button class="primary" onclick="chatAcceptOffer(\''+out.offer.type+'\','+amt+')">Accept '+out.offer.type+' of '+cr(amt)+'</button></div>';
    }
    save(); renderChatPanel(extra);
  }catch(e){
    log.push({who:'them',text:'<span class="muted">(comm static \u2014 '+e.message+')</span>'});
    save(); renderChatPanel();
  }
}
function chatDoSuggest(k){
  if(!CHAT_CUR)return;
  const c=chatChar(CHAT_CUR.kind,CHAT_CUR.name); if(!c)return;
  G._tickCtx='port';
  if(CHAT_CUR.kind==='crew'){ const res=execCrewAct(c,k);
    if(res)showEvent('Crew','\u2014',res); }
  else { const fn=NPC_ACTS[k]; if(fn&&fn.ok(c)){ const res=fn.exec(c); if(res)showEvent('Around the Port','\u2014',res); } }
  save(); renderAll(); renderChatPanel();
}
function chatAcceptOffer(type,amt){
  if(!CHAT_CUR)return;
  const c=chatChar(CHAT_CUR.kind,CHAT_CUR.name);
  if(!c||CHAT_CUR.kind!=='crew'||amt>c.wallet)return;
  c.wallet-=amt;
  if(type==='gift'){ gain(amt,CHAT_CUR.name+' chipped in from their own savings'); bumpCrew(c,'@captain',4); }
  else { G.credits+=amt; book('loanIn',amt);
    if(!G.loans)G.loans=[];
    G.loans.push({id:'ln'+(++G.choiceSeq),from:CHAT_CUR.name,fromId:null,P:amt,rate:0,due:G.day+56,missed:0,crew:true});
    logEntry('Borrowed '+cr(amt)+' from '+CHAT_CUR.name+' \u2014 interest-free, but do not test it.','money',amt);
    bumpCrew(c,'@captain',2); }
  save(); renderAll(); renderChatPanel();
}
function showChatPop(kind,name,line){
  if(CHAT_OPEN&&CHAT_CUR&&CHAT_CUR.kind===kind&&CHAT_CUR.name===name){ renderChatPanel(); return; }
  markUnread(kind,name);
  let el=document.getElementById('chatpop');
  if(!el){ el=document.createElement?document.createElement('div'):null;
    if(el){ el.id='chatpop'; el.className='chatpop'; document.body.appendChild(el); } }
  if(!el)return;
  el.innerHTML='<div class="t">'+name+'</div><div>'+line+'</div>'+
    '<div class="row" style="margin-top:6px;justify-content:flex-end">'+
    '<button onclick="showChat(\''+kind+'\',\''+name+'\')">Reply</button>'+
    '<button onclick="dismissChatPop()">\u2715</button></div>';
  el.style.display='block';
  clearTimeout(window._chatPopT);
  window._chatPopT=setTimeout(dismissChatPop,15000);
}
function dismissChatPop(){ const el=document.getElementById('chatpop'); if(el)el.style.display='none'; }

/* ---------- In-chat interactive offers (replace pop-ups for person business) ---------- */
function chatOffer(ck,name,kind,text,data,options){
  const log=chatLog(ck,name);
  log.push({who:'them',text,off:{kind,data,options,done:false}});
  if(log.length>24)log.shift();
  save();
  if(CHAT_OPEN&&CHAT_CUR&&CHAT_CUR.kind===ck&&CHAT_CUR.name===name)renderChatPanel();
  else showChatPop(ck,name,String(text).replace(/<[^>]*>/g,'').slice(0,100));
  updateChatBadge();
}
function resolveChatOffer(i,k){
  if(!CHAT_CUR)return;
  const log=chatLog(CHAT_CUR.kind,CHAT_CUR.name);
  const m=log[i]; if(!m||!m.off||m.off.done)return;
  m.off.done=true; m.off.choice=k;
  const out=(CHOICES[m.off.kind]||function(){return '';})(k,m.off.data);
  if(m.off.data&&m.off.data._cast){            // engaging warms ties; brushing off cools them
    const ch=castById(m.off.data._cast);
    const declined=['no','pass','refuse'].indexOf(k)>=0;
    if(ch&&G.crew&&G.crew.length)bumpRel(ch,G.crew[R(G.crew.length)-1].name,declined?-(3+d6()):(3+d6()));
  }
  if(out)log.push({who:'them',text:out});
  if(log.length>24)log.shift();
  if(typeof notifyAction==='function')notifyAction('Decided on '+CHAT_CUR.name+'\u2019s proposal ('+m.off.kind+'): chose "'+k+'".');
  save(); renderAll(); renderChatPanel();
}

/* ---------- Settings ---------- */
function showSettings(){
  const u=aiUsage(); const prov=aiProvider();
  const inp='style="background:var(--cell);border:1px solid var(--grid);color:var(--ink);border-radius:4px;padding:8px;font-family:inherit"';
  openModal('<h2>SETTINGS — AI</h2>'+
   '<p class="hint">Bring your own key to give the crew and locals a voice (chat), let the model pick their actions in character, and get reaction pop-ups. '+
   'The key is stored <b>only in this browser</b> (localStorage), never in the save file, and is sent only to the provider you pick. '+
   'Without a key the game runs the same on its built-in behavior engine — chat is the only thing disabled.</p>'+
   '<div class="row" style="margin:10px 0"><span class="hint" style="width:70px">Provider</span>'+
   '<select id="aiprov" '+inp+'>'+
   '<option value="anthropic"'+(prov==='anthropic'?' selected':'')+'>Anthropic (api.anthropic.com)</option>'+
   '<option value="openrouter"'+(prov==='openrouter'?' selected':'')+'>OpenRouter (openrouter.ai)</option>'+
   '</select></div>'+
   '<div class="row" style="margin:10px 0"><span class="hint" style="width:70px">API key</span>'+
   '<input id="aikey" type="password" placeholder="'+(prov==='openrouter'?'sk-or-...':'sk-ant-...')+'" value="'+(aiKey()?'••••••••••••':'')+'" '+inp+' style="flex:1;background:var(--cell);border:1px solid var(--grid);color:var(--ink);border-radius:4px;padding:8px;font-family:inherit"></div>'+
   '<div class="row" style="margin:10px 0"><span class="hint" style="width:70px">Model</span>'+
   '<input id="aimodel" type="text" placeholder="'+AI_DEFAULTS[prov]+'" value="'+(aiModel()===AI_DEFAULTS[prov]?'':aiModel())+'" '+inp+' style="flex:1;background:var(--cell);border:1px solid var(--grid);color:var(--ink);border-radius:4px;padding:8px;font-family:inherit"></div>'+
   '<div class="row" style="justify-content:flex-end;gap:6px"><button class="primary" onclick="saveAIKey()">Save &amp; test</button><button onclick="testAIKey()">Test key</button><button onclick="clearAIKey()">Clear key</button></div>'+
   '<p class="hint" style="margin-top:10px">Leave Model blank for the default (Claude Haiku — cheap and fast). '+
   'On OpenRouter you can use any model id, e.g. <b>'+AI_DEFAULTS.openrouter+'</b>; spend shows on your OpenRouter dashboard.<br>'+
   'Usage this browser: '+u.i.toLocaleString()+' in / '+u.o.toLocaleString()+' out'+(prov==='anthropic'?' ≈ $'+aiCost().toFixed(3):' (≈ $'+aiCost().toFixed(3)+' at Haiku rates; actual depends on model)')+'</p>'+
   '<p class="hint">Keys: console.anthropic.com → API keys (needs API credit — separate from a claude.ai subscription), or openrouter.ai → Keys.</p>'+
   '<div style="margin-top:12px;text-align:right;"><button class="primary" onclick="closeModal()">Close</button></div>');
}
function saveAIKey(){
  const v=(document.getElementById('aikey')||{}).value||'';
  const p=(document.getElementById('aiprov')||{}).value||'anthropic';
  const m=((document.getElementById('aimodel')||{}).value||'').trim();
  try{
    localStorage.setItem(AI_PROV,p);
    if(m)localStorage.setItem(AI_MODEL_KEY,m); else localStorage.removeItem(AI_MODEL_KEY);
    if(v&&v.indexOf('•')<0){
      const truncated=/\u2026|\.\.\.$/.test(v.trim());
      localStorage.setItem(AI_KEY,cleanKey(v));
      if(truncated){ flash('That key looks truncated (ends in …) — copy the FULL key from the provider console, not from a shortened display.'); return; }
    }
  }catch(e){}
  closeModal();
  if(aiEnabled())testAIKey();              // verify the key the moment it's entered
  else flash('No key saved.');
}
function clearAIKey(){ try{localStorage.removeItem(AI_KEY);}catch(e){} closeModal(); flash('AI key removed. Rule-based behavior continues.'); }
async function testAIKey(){
  if(!aiEnabled()){ flash('Save a key first.'); return; }
  flash('Testing key against '+aiProvider()+'…');
  try{ await aiCall('Connection test. Reply with the single word: ok',[{role:'user',content:'ping'}],null,16);
    flash('✓ Key works — '+aiProvider()+' / '+aiModel()+'. The crew can talk now.'); }
  catch(e){ flash('✗ '+e.message+' — check the key has no stray characters, matches the selected provider, and (Anthropic) that the console account has API credit.'); }
}

/* ---------- Reactions: an AI beat after player actions ----------
   Every state-changing player action calls notifyAction(desc). With a key
   present (and a cooldown so costs stay tiny), one crew member or local
   with something to say sends a message into the chat dock. */
const REACT_SCHEMA={type:'object',additionalProperties:false,required:['who','say'],
 properties:{who:{anyOf:[{type:'null'},{type:'string'}]},say:{type:'string'}}};
let LAST_REACT=0, REACT_BUSY=false;
function notifyAction(desc){
  try{
    if(!aiEnabled()||REACT_BUSY)return;
    const now=Date.now();
    if(now-LAST_REACT<20000)return;            // breathe between reactions
    if(Math.random()>0.5)return;               // not every action draws comment
    LAST_REACT=now; REACT_BUSY=true;
    aiReact(desc).catch(()=>{}).then(()=>{REACT_BUSY=false;});
  }catch(e){REACT_BUSY=false;}
}
async function aiReact(desc){
  const cands=[];
  (G.crew||[]).forEach(c=>cands.push({kind:'crew',name:c.name,sheet:crewSheet(c)}));
  peopleHere().filter(ch=>Math.abs(shipRel(ch))>15).slice(0,2)
    .forEach(ch=>cands.push({kind:'cast',name:ch.name,sheet:npcSheet(ch)}));
  if(!cands.length)return;
  const sys='The captain of a tramp trader just did something. Decide if exactly ONE of the people below would speak up about it — '+
    'someone whose traits, goals, feelings or health make this action matter to them. Most actions pass without comment: if nobody truly cares, set who=null. '+
    'If someone speaks, give one short in-character line (max 2 sentences, spacer dialect, no game numbers invented).';
  const usr='ACTION: '+desc+'\n\nPEOPLE:\n'+cands.map(c=>'['+c.name+'] '+c.sheet).join('\n\n');
  const out=await aiCall(sys,[{role:'user',content:usr}],REACT_SCHEMA,250);
  if(!out.who)return;
  const c=cands.find(x=>x.name===out.who); if(!c)return;
  const log=chatLog(c.kind,c.name);
  log.push({who:'them',text:out.say}); if(log.length>16)log.shift();
  save();
  showChatPop(c.kind,c.name,out.say);
  updateChatBadge();
}
