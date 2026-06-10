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
function aiKey(){ try{return localStorage.getItem(AI_KEY)||'';}catch(e){return '';} }
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
    if(!r.ok)throw new Error('OpenRouter '+r.status);
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
  if(!r.ok)throw new Error('API '+r.status);
  const d=await r.json();
  if(d.usage)trackUsage(d.usage.input_tokens,d.usage.output_tokens);
  const t=(d.content||[]).find(b=>b.type==='text');
  if(!t)throw new Error('empty');
  return schema?JSON.parse(t.text):t.text;
}

/* ---------- shared context builders ---------- */
function shipBrief(){
  const w=here();
  const recent=(G.log||[]).slice(0,5).map(e=>e.text.replace(/<[^>]*>/g,'')).join(' | ');
  return 'Ship status: docked at '+w.name+' ('+(w.codes.join(' ')||'plain world')+', law '+w.u.law+'). '+
    'Captain visible funds roughly '+cr(Math.round(G.credits/1000)*1000)+'. Hold '+holdUsed()+'/'+SHIPS[G.ship].cargo+'t. '+
    'Ship morale: '+moraleWord(shipMorale())+'. Recent events: '+(recent||'a quiet stretch')+'.';
}
function crewSheet(c){
  const rels=Object.entries(c.crels||{}).map(([k,v])=>(k==='@captain'?'the captain':k)+' '+(v>0?'+':'')+v).join(', ');
  return 'You are '+c.name+', '+c.position+' aboard a tramp trader. Traits: '+(c.traits||[]).join(', ')+'. '+
    'Goals — soon: '+c.goals.short.txt+'; this year: '+c.goals.medium.txt+'; someday: '+c.goals.long.txt+'. '+
    'Health: '+hpWord(c)+'. Private savings: about '+cr(c.wallet)+' (SECRET — never state the number; only offer money if your feelings toward the captain are warm and it serves your interests). '+
    'Feelings (−100 hostile..+100 devoted): '+rels+'. '+(c.rel?('Background: '+c.rel.desc+' '+(c.rel.target||'')+'. '):'')+
    shipBrief();
}
function npcSheet(ch){
  return 'You are '+ch.name+', a '+ch.role+' on '+ch.world+'. Traits: '+(ch.traits||[]).join(', ')+'. '+
    'Goals — soon: '+ch.goals.short.txt+'; this year: '+ch.goals.medium.txt+'; someday: '+ch.goals.long.txt+'. '+
    'Your feeling toward this ship and crew: '+shipRel(ch)+' (−100..+100). '+
    'You met them on '+ch.world+'. '+shipBrief();
}
const CHAT_RULES=' RULES: Stay in character — terse, lived-in spacer dialect. 1–3 sentences. Never invent game numbers, cargo, prices, rules or events. Never reveal hidden mechanics. If asked for money you do not want to give, deflect in character.';

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
let CHAT_CUR=null;   // {kind:'crew'|'cast', name}
function chatKey(kind,name){ return kind+':'+name; }
function chatLog(kind,name){ if(!G.chats)G.chats={}; const k=chatKey(kind,name);
  if(!G.chats[k])G.chats[k]=[]; return G.chats[k]; }
function chatChar(kind,name){
  return kind==='crew'?crewByName(name):(G.cast||[]).find(c=>c.name===name);
}
function showChat(kind,name){
  CHAT_CUR={kind,name};
  renderChat();
}
function renderChat(extra){
  const {kind,name}=CHAT_CUR; const c=chatChar(kind,name);
  if(!c){ openModal('<h2>CHAT</h2><p class="hint">They are not around anymore.</p><div style="text-align:right"><button class="primary" onclick="closeModal()">Close</button></div>'); return; }
  const log=chatLog(kind,name);
  const msgs=log.map(m=>'<div class="chatmsg '+(m.who==='you'?'me':'them')+'">'+m.text+'</div>').join('');
  const sub=kind==='crew'?(c.position+' · '+moraleWord(morale(c))+' · '+hpWord(c)):(c.role+' · '+c.world+' · ship standing '+(shipRel(c)>0?'+':'')+shipRel(c));
  openModal('<h2>'+name.toUpperCase()+'</h2><div class="hint">'+sub+'</div>'+
    '<div id="chatlog" class="chatlog">'+(msgs||'<div class="hint">Say something. They are listening.</div>')+(extra||'')+'</div>'+
    (aiEnabled()
      ?'<div class="row" style="margin-top:8px"><input id="chatin" type="text" style="flex:1;background:var(--cell);border:1px solid var(--grid);color:var(--ink);border-radius:4px;padding:8px;font-family:inherit" placeholder="Say something…" onkeydown="if(event.key===\'Enter\')sendChat()">'+
       '<button class="primary" onclick="sendChat()">Send</button></div>'
      :'<p class="hint" style="margin-top:8px">Chat needs an Anthropic API key — add one in <a href="#" onclick="showSettings();return false;">Settings</a>. (Costs fractions of a cent per message, billed to your key.)</p>')+
    '<div style="margin-top:10px;text-align:right;"><button onclick="closeModal()">Close</button></div>');
  const el=document.getElementById('chatlog'); if(el&&el.scrollTo)el.scrollTo(0,99999); else if(el)el.scrollTop=999999;
}
async function sendChat(){
  const inp=document.getElementById('chatin'); const text=(inp&&inp.value||'').trim();
  if(!text||!CHAT_CUR)return;
  const {kind,name}=CHAT_CUR; const c=chatChar(kind,name); if(!c)return;
  const log=chatLog(kind,name);
  log.push({who:'you',text}); if(log.length>16)log.shift();
  save(); renderChat('<div class="hint">…</div>');
  const acts=kind==='crew'?eligibleCrewActs(c,'port'):eligibleNpcActs(c).filter(k=>['tipoff','deal','intro','reqitem','barter','loanoffer'].indexOf(k)>=0);
  const sys=(kind==='crew'?crewSheet(c):npcSheet(c))+CHAT_RULES+
    ' You may optionally set "suggest" to ONE of these action ids if it fits the conversation: ['+acts.join(', ')+'] — otherwise null.'+
    (kind==='crew'?' You may optionally set "offer" to {type:"gift"|"loan", amount} ONLY if you genuinely would (warm feelings, you can afford it, it serves your goals) — otherwise null.':' Set "offer" to null.');
  const msgs=log.map(m=>({role:m.who==='you'?'user':'assistant',content:m.text}));
  try{
    const out=await aiCall(sys,msgs,CHAT_SCHEMA,400);
    log.push({who:'them',text:out.say}); if(log.length>16)log.shift();
    let extra='';
    if(out.suggest&&acts.indexOf(out.suggest)>=0)
      extra+='<div style="margin-top:6px"><button onclick="chatDoSuggest(\''+out.suggest+'\')">Let them: '+out.suggest+'</button></div>';
    if(out.offer&&kind==='crew'){
      const amt=Math.round(out.offer.amount/50)*50;
      const ok=morale(c)>35&&amt>0&&amt<=c.wallet&&(out.offer.type==='gift'?amt<=c.wallet*0.5:true);
      if(ok)extra+='<div style="margin-top:6px"><button class="primary" onclick="chatAcceptOffer(\''+out.offer.type+'\','+amt+')">Accept '+out.offer.type+' of '+cr(amt)+'</button></div>';
    }
    save(); renderChat(extra);
  }catch(e){
    log.push({who:'them',text:'<span class="muted">(comm static — try again: '+e.message+')</span>'});
    save(); renderChat();
  }
}
function chatDoSuggest(k){
  const {kind,name}=CHAT_CUR; const c=chatChar(kind,name); if(!c)return;
  G._tickCtx='port';
  if(kind==='crew'){ const res=execCrewAct(c,k);
    if(res)showEvent('Crew','—',res); }
  else { const fn=NPC_ACTS[k]; if(fn&&fn.ok(c)){ const res=fn.exec(c); if(res)showEvent('Around the Port','—',res); } }
  save(); renderAll();
}
function chatAcceptOffer(type,amt){
  const {kind,name}=CHAT_CUR; const c=chatChar(kind,name);
  if(!c||kind!=='crew'||amt>c.wallet)return;
  c.wallet-=amt;
  if(type==='gift'){ gain(amt,name+' chipped in from their own savings'); bumpCrew(c,'@captain',4); }
  else { G.credits+=amt; book('loanIn',amt);
    if(!G.loans)G.loans=[];
    G.loans.push({id:'ln'+(++G.choiceSeq),from:name,fromId:null,P:amt,rate:0,due:G.day+56,missed:0,crew:true});
    logEntry('Borrowed '+cr(amt)+' from '+name+' — interest-free, but do not test it.','money',amt);
    bumpCrew(c,'@captain',2); }
  save(); renderChat(); renderAll();
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
   '<select id="aiprov" '+inp+' onchange="var m=document.getElementById(\'aimodel\'); if(m)m.placeholder=this.value===\'openrouter\'?\''+AI_DEFAULTS.openrouter+'\':\''+AI_DEFAULTS.anthropic+'\'">'+
   '<option value="anthropic"'+(prov==='anthropic'?' selected':'')+'>Anthropic (api.anthropic.com)</option>'+
   '<option value="openrouter"'+(prov==='openrouter'?' selected':'')+'>OpenRouter (openrouter.ai)</option>'+
   '</select></div>'+
   '<div class="row" style="margin:10px 0"><span class="hint" style="width:70px">API key</span>'+
   '<input id="aikey" type="password" placeholder="'+(prov==='openrouter'?'sk-or-...':'sk-ant-...')+'" value="'+(aiKey()?'••••••••••••':'')+'" '+inp+' class="grow" style="flex:1;background:var(--cell);border:1px solid var(--grid);color:var(--ink);border-radius:4px;padding:8px;font-family:inherit"></div>'+
   '<div class="row" style="margin:10px 0"><span class="hint" style="width:70px">Model</span>'+
   '<input id="aimodel" type="text" placeholder="'+AI_DEFAULTS[prov]+'" value="'+(aiModel()===AI_DEFAULTS[prov]?'':aiModel())+'" '+inp+' style="flex:1;background:var(--cell);border:1px solid var(--grid);color:var(--ink);border-radius:4px;padding:8px;font-family:inherit">'+
   '</div>'+
   '<div class="row" style="justify-content:flex-end;gap:6px"><button class="primary" onclick="saveAIKey()">Save</button><button onclick="clearAIKey()">Clear key</button></div>'+
   '<p class="hint" style="margin-top:10px">Leave Model blank for the default (Claude Haiku — cheap and fast: a chat message or crew turn costs fractions of a cent). '+
   'On OpenRouter you can point it at any model id, e.g. <b>'+AI_DEFAULTS.openrouter+'</b>; spend shows on your OpenRouter dashboard.<br>'+
   'Usage this browser: '+u.i.toLocaleString()+' in / '+u.o.toLocaleString()+' out'+(prov==='anthropic'?' ≈ $'+aiCost().toFixed(3):' (≈ $'+aiCost().toFixed(3)+' at Haiku rates; actual depends on model)')+'</p>'+
   '<p class="hint">Keys: console.anthropic.com → API keys, or openrouter.ai → Keys.</p>'+
   '<div style="margin-top:12px;text-align:right;"><button class="primary" onclick="closeModal()">Close</button></div>');
}
function saveAIKey(){
  const v=(document.getElementById('aikey')||{}).value||'';
  const p=(document.getElementById('aiprov')||{}).value||'anthropic';
  const m=((document.getElementById('aimodel')||{}).value||'').trim();
  try{
    localStorage.setItem(AI_PROV,p);
    if(m)localStorage.setItem(AI_MODEL_KEY,m); else localStorage.removeItem(AI_MODEL_KEY);
    if(v&&v.indexOf('•')<0)localStorage.setItem(AI_KEY,v.trim());
  }catch(e){}
  closeModal(); flash(aiEnabled()?'AI enabled via '+aiProvider()+' ('+aiModel()+') — the crew can talk now.':'No key saved.');
}
function clearAIKey(){ try{localStorage.removeItem(AI_KEY);}catch(e){} closeModal(); flash('AI key removed. Rule-based behavior continues.'); }

/* ---------- Reactions: an AI beat after player actions ----------
   Every state-changing player action calls notifyAction(desc). With a key
   present (and a cooldown so costs stay tiny), one crew member or local
   with something to say pops up a chat bubble about it. */
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
  // candidates: every crew member + up to 2 locals with strong feelings
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
}
function showChatPop(kind,name,line){
  let el=document.getElementById('chatpop');
  if(!el){ el=document.createElement?document.createElement('div'):null;
    if(el){ el.id='chatpop'; el.className='chatpop'; document.body.appendChild(el); } }
  if(!el)return;
  el.innerHTML='<div class="t">'+name+'</div><div>'+line+'</div>'+
    '<div class="row" style="margin-top:6px;justify-content:flex-end">'+
    '<button onclick="dismissChatPop();showChat(\''+kind+'\',\''+name+'\')">Reply</button>'+
    '<button onclick="dismissChatPop()">✕</button></div>';
  el.style.display='block';
  clearTimeout(window._chatPopT);
  window._chatPopT=setTimeout(dismissChatPop,15000);
}
function dismissChatPop(){ const el=document.getElementById('chatpop'); if(el)el.style.display='none'; }
