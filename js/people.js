/* ============================================================
   PEOPLE SIMULATION — traits, three-horizon goals, morale via the
   −100..100 relationship system, hidden crew wallets + public/private
   inventories, crew & NPC autonomous actions, loans/requests/barter.
   The brain here is rule-based; js/ai.js can override action picks and
   supply dialogue when a BYOK key is present. The AI NEVER invents
   numbers — every credit amount is rolled here and booked properly.
   ============================================================ */

/* ---------- Traits ---------- */
const TRAITS=['gruff','superstitious','meticulous','gambler','pious','homesick','ambitious',
 'cowardly','loyal','greedy','romantic','cynical','by-the-book','reckless','chatty','haunted',
 'frugal','vain','curious','stoic','generous','paranoid','easygoing','proud'];
function pickTraits(){ const t=[...TRAITS]; shuffle(t); return t.slice(0,2); }
function hasTrait(c,t){ return (c.traits||[]).indexOf(t)>=0; }

/* ---------- Goals (crew) ---------- */
const GOAL_POOL={
 short:[
  {id:'cards',txt:'win back the credits lost at cards',served:['sidejob','carouse','privatetrade'],w:800},
  {id:'gifthome',txt:'buy a gift to send home',served:['sidejob','scout'],w:600},
  {id:'night',txt:'see the night markets before the next jump',served:['carouse']},
  {id:'mend',txt:'patch things up with a crewmate',served:['carouse','tend']},
  {id:'kit',txt:'replace a worn-out tool kit',served:['sidejob','maintain'],w:400},
  {id:'letter',txt:'get a letter carried home',served:['network']},
 ],
 medium:[
  {id:'save20',txt:'save up Cr20,000',served:['sidejob','privatetrade','raise','steal','smugglepass'],w:20000},
  {id:'getraise',txt:'talk the captain into a raise',served:['raise']},
  {id:'heirloom',txt:'find a buyer for a family heirloom',served:['network','privatetrade'],w:5000},
  {id:'cert',txt:'earn a guild certification',served:['train','maintain','tend']},
  {id:'baddebt',txt:'clear a debt to someone dangerous',served:['sidejob','steal','smugglepass','privatetrade'],w:8000},
  {id:'stake',txt:'build a private trading stake',served:['privatetrade','scout'],w:10000},
 ],
 long:[
  {id:'ownship',txt:'one day buy a ship of their own',served:['privatetrade','raise','steal','smugglepass','sidejob'],w:150000},
  {id:'garden',txt:'retire to a garden world',served:['sidejob','privatetrade'],w:60000},
  {id:'clearname',txt:'clear their name back home',served:['network']},
  {id:'sibling',txt:'find a lost sibling somewhere out here',served:['network','carouse'],worlds:8},
  {id:'master',txt:'become the best in their trade',served:['train','maintain','tend']},
  {id:'shrine',txt:'fund a shrine on their homeworld',served:['sidejob'],w:40000},
 ]};
function newGoal(h,not){ const pool=GOAL_POOL[h].filter(g=>g.id!==not);
  const g=pool[R(pool.length)-1]; return {id:g.id,txt:g.txt}; }
function goalDef(id){ for(const h of ['short','medium','long']){const g=GOAL_POOL[h].find(x=>x.id===id); if(g)return g;} return null; }
function goalServes(c,action){
  for(const h of ['short','medium','long']){ const g=c.goals&&c.goals[h]&&goalDef(c.goals[h].id);
    if(g&&g.served&&g.served.indexOf(action)>=0)return true; }
  return false;
}

/* ---------- Goals (NPCs) — `want` = good id their requests favor ---------- */
const NPC_GOAL_POOL={
 short:[
  {id:'part',txt:'source a replacement machine part',want:103},
  {id:'feast',txt:'host a feast worth talking about',want:31},
  {id:'meds',txt:'get medicine to a sick relative',want:43},
  {id:'tools',txt:'re-equip a work crew',want:104},
 ],
 medium:[
  {id:'stall',txt:'open a market stall of their own',want:104,loan:true},
  {id:'clinic',txt:'stock a frontier clinic',want:41,loan:true},
  {id:'still',txt:'set up a quiet distillery',want:34,loan:true},
  {id:'arms',txt:'discreetly arm some friends',want:65},
  {id:'hab',txt:'expand the family habitat',want:12,loan:true},
  {id:'rig',txt:'refit an old prospecting rig',want:33,loan:true},
 ],
 long:[
  {id:'capital',txt:'buy passage to the subsector capital'},
  {id:'warehouse',txt:'own a whole warehouse row someday',want:33},
  {id:'comeback',txt:'rebuild a ruined family business',want:36,loan:true},
  {id:'vanish',txt:'disappear cleanly and start over'},
 ]};
function npcGoal(h){ const p=NPC_GOAL_POOL[h]; const g=p[R(p.length)-1]; return {id:g.id,txt:g.txt}; }
function npcGoalDef(id){ for(const h of ['short','medium','long']){const g=NPC_GOAL_POOL[h].find(x=>x.id===id); if(g)return g;} return null; }
function npcWantCat(ch){
  for(const h of ['medium','short','long']){ const g=ch.goals&&ch.goals[h]&&npcGoalDef(ch.goals[h].id);
    if(g&&g.want)return g.want; }
  return null;
}

/* ---------- Augmentation (new + legacy-save characters) ---------- */
const REL_SEED=[['Married',60],['Sexual partner',55],['love',50],['Inseparable',45],['Life-long',40],
 ['Good friends',35],['Admires',30],['good terms',25],['buddy',45],['guilt',10],
 ['Enemy',-50],['hates',-45],['feuding',-35],['Bitter',-35],['Blames',-30],['jealous',-25],
 ['Bickers',-20],['ridicules',-20],['rival',-15],['dark secret',-10]];
function relSeed(desc){ for(const [k,v] of REL_SEED){ if(desc&&desc.indexOf(k)>=0)return v; } return 5; }
function augmentCrewAll(crew){
  crew.forEach(c=>{
    if(!c.traits)c.traits=pickTraits();
    if(!c.goals)c.goals={short:newGoal('short'),medium:newGoal('medium'),long:newGoal('long')};
    if(c.wallet==null)c.wallet=300+d6()*150;
    if(!c.pubInv)c.pubInv=[];
    if(!c.privInv)c.privInv=[];
    if(!c.crels)c.crels={'@captain':8+d6()*2};
  });
  crew.forEach(c=>{
    crew.forEach(o=>{ if(o===c)return;
      if(c.crels[o.name]==null){
        let s=R(21)-11;                                     // −10..10 ambient
        if(c.rel&&c.rel.target===o.name)s=relSeed(c.rel.desc)+R(11)-6;
        c.crels[o.name]=clampRel(s);
      }});
  });
}
function morale(c){ const v=Object.values(c.crels||{}); return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):0; }
function shipMorale(){ const cs=G.crew||[]; return cs.length?Math.round(cs.reduce((a,c)=>a+morale(c),0)/cs.length):0; }
function moraleWord(m){ return m>60?'devoted':m>25?'content':m>-15?'steady':m>-40?'restless':m>-65?'bitter':'mutinous'; }
function bumpCrew(c,who,d){ if(!c.crels)c.crels={}; c.crels[who]=clampRel((c.crels[who]||0)+d); }
function crewByName(n){ return (G.crew||[]).find(c=>c.name===n); }
function invTons(c){ return (c.pubInv||[]).concat(c.privInv||[]).reduce((a,i)=>a+i.tons,0); }
function augmentCast(ch){
  if(!ch.traits)ch.traits=pickTraits();
  if(!ch.goals)ch.goals={short:npcGoal('short'),medium:npcGoal('medium'),long:npcGoal('long')};
  if(ch.wealth==null)ch.wealth=R(4);                        // 1..4 loan/premium scale
  if(ch.hpMax==null){ ch.hpMax=_2d6()+_2d6()+_2d6(); ch.hp=ch.hpMax; }   // physical UPP sum
  if(!ch.wantItem){ const w=npcWantCat(ch);                 // a CONCRETE item off the goods
    if(w)ch.wantItem={gid:w,vname:goodVariant(w)}; }        // roster — chat + requests agree
  return ch;
}

/* ---------- World residents ---------- */
function ensureResidents(){
  const w=here();
  let n=(G.cast||[]).filter(c=>c.world===w.name&&c.resident).length;
  const want=2+R(2);
  while(n<want){
    const arch=['merchant','dockhand','official','social','drifter','underworld'][R(6)-1];
    const ch=meetCast(CAST_ROLES[arch][R(CAST_ROLES[arch].length)-1],true);
    ch.resident=true; ch.world=w.name; augmentCast(ch); n++;
  }
}
function peopleHere(){ const w=here(); return (G.cast||[]).filter(c=>c.world===w.name); }

/* ---------- Crew actions ---------- */
function skillOf(c,name){ let b=0; (c.skills||[]).forEach(s=>{const m=String(s).match(/^(.+)-(\d+)$/); if(m&&m[1]===name)b=Math.max(b,+m[2]);}); return b; }
// sneaky weighting: trait base × morale multiplier × goal motive — low morale makes
// it likelier, a goal it serves makes it make sense, neither is required
function sneakW(c,base,goalBonus,action){
  const m=morale(c);
  const mult=m<-30?2.2:m<0?1.4:m<40?0.8:0.35;
  return (base+(goalServes(c,action)?goalBonus:0))*mult;
}
const CREW_ACTS={
 rest:{w:c=>6,ok:c=>true,exec:c=>null},
 maintain:{w:c=>4+(hasTrait(c,'meticulous')?4:0),ok:c=>skillOf(c,'Engineer')>0||skillOf(c,'Mechanic')>0,
  exec:c=>{ G.mods.maintained=true; return c.name+' spent the watch deep in the engineering spaces. (next breakdown or cargo mishap halved)'; }},
 tend:{w:c=>3+(hasTrait(c,'generous')?2:0),ok:c=>skillOf(c,'Medic')>0,
  exec:c=>{ if(G.mods.nextTradeDM<0){G.mods.nextTradeDM=0; return c.name+' patched up bodies and tempers alike. (crew penalty cleared)';}
    G.mods.tended=true; return c.name+' ran health checks on everyone. (next illness softened)'; }},
 train:{w:c=>2+(hasTrait(c,'by-the-book')?2:0),ok:c=>skillOf(c,'Leadership')>0,
  exec:c=>{ G.mods.trained=true; return c.name+' drilled the crew on procedure. (+1 next skill check)'; }},
 scout:{w:c=>3+(hasTrait(c,'greedy')?2:0)+(hasTrait(c,'ambitious')?2:0),ok:(c,ctx)=>ctx==='port',
  exec:c=>{ G.mods.buyDM+=1; return c.name+' walked the warehouses asking pointed questions. (+1 next market search)'; }},
 network:{w:c=>3+(hasTrait(c,'chatty')?3:0),ok:(c,ctx)=>ctx==='port',
  exec:c=>{ G.mods.nextContactDM+=1; if(d6()===6){G.contacts.push(genContact()); return c.name+' made a friend in port — a new contact for the ship.';}
    return c.name+' worked the bars and the dock offices. (+1 next contact search)'; }},
 sidejob:{w:c=>2+(c.wallet<500?3:0)+(hasTrait(c,'frugal')?2:0),ok:(c,ctx)=>ctx==='port',
  exec:c=>{ c.wallet+=100+d6()*50; return c.name+' picked up shift work on the docks.'; }},
 carouse:{w:c=>3+(hasTrait(c,'gambler')?3:0)+(hasTrait(c,'easygoing')?2:0)-(hasTrait(c,'frugal')?2:0),
  ok:(c,ctx)=>ctx==='port'&&c.wallet>=100,
  exec:c=>{ c.wallet-=50+d6()*25; const o=G.crew.filter(x=>x!==c); if(o.length){const m=o[R(o.length)-1]; bumpCrew(c,m.name,3+d6()); bumpCrew(m,c.name,2+d6());
    return c.name+' dragged '+m.name+' out on the town — they came back laughing.';}
    return c.name+' had a quiet night out.'; }},
 gripe:{w:c=>Math.max(0,(10-morale(c))/8)+(hasTrait(c,'cynical')?2:0),ok:c=>true,
  exec:c=>{ G.mods.nextTradeDM-=1; bumpCrew(c,'@captain',-2);
    return c.name+' has been loudly unhappy; it is wearing on everyone. (−1 next sale)'; }},
 raise:{w:c=>2+(hasTrait(c,'greedy')?2:0)+(morale(c)<0?2:0)+(goalServes(c,'raise')?4:0),
  ok:c=>G.day-(c.lastRaiseAsk||-99)>56,
  exec:c=>{ c.lastRaiseAsk=G.day; const amt=Math.max(200,Math.round((c.salary||1000)*0.2/100)*100);
    chatOffer('crew',c.name,'crewRaise',
      'Cap, got a minute? I\u2019m asking for a raise \u2014 '+cr(amt)+' a month more. '+
      (morale(c)<0?'I\u2019d rather not make it a thing.':'I\u2019ve earned it and you know it.'),
      {name:c.name,amt},
      [{k:'yes',label:'Grant it (+'+cr(amt)+'/mo)'},{k:'no',label:'Times are tight \u2014 refuse'}]);
    return null; }},
 privatetrade:{w:c=>sneakW(c,1+(hasTrait(c,'greedy')?3:0)+(hasTrait(c,'ambitious')?2:0),6,'privatetrade'),
  ok:(c,ctx)=>ctx==='port'&&invTons(c)<1&&G.market&&G.market.some(m=>m.ppt<=c.wallet&&m.tons>0),
  exec:c=>{ const opts=G.market.filter(m=>m.ppt<=c.wallet&&m.tons>0); const m=opts[R(opts.length)-1];
    c.wallet-=m.ppt; m.tons-=1;
    const item={id:m.id,name:m.name,base:m.base,ppt:m.ppt,tons:1,origin:here().name,illegal:!!m.illegal};
    if(m.illegal){ c.privInv.push(item); return null; }                  // hidden
    c.pubInv.push(item); return c.name+' bought a ton of '+m.name+' with their own savings — stowed in quarters.'; }},
 smugglepass:{w:c=>sneakW(c,0.5+(hasTrait(c,'greedy')?2:0)+(hasTrait(c,'reckless')?2:0),6,'smugglepass'),
  ok:(c,ctx)=>ctx==='port'&&!c.stow,
  exec:c=>{ c.stow={fare:300+d6()*100}; return null; }},                 // silent until found/arrival
 steal:{w:c=>sneakW(c,0.2+(hasTrait(c,'greedy')?1.5:0),5,'steal'),
  ok:c=>G.hold.length>0&&invTons(c)<1,
  exec:c=>{ const h=G.hold[R(G.hold.length)-1];
    book('shrinkage',-h.ppt);                                           // the books notice even if you don't
    c.privInv.push({id:h.id,name:h.name,base:h.base,ppt:h.ppt,tons:1,origin:h.origin,stolen:true,illegal:!!h.illegal});
    h.tons-=1; if(h.tons<=0)G.hold.splice(G.hold.indexOf(h),1);
    return null; }},
 sabotage:{w:c=>1+(hasTrait(c,'haunted')?1:0)+(hasTrait(c,'cynical')?1:0),
  ok:c=>{ const v=Object.entries(c.crels||{}).filter(([k])=>k!=='@captain').map(([,x])=>x);
    return v.length>0&&(v.reduce((a,b)=>a+b,0)/v.length)<-35&&!G.sabotage; },
  exec:c=>{ G.sabotage={by:c.name}; return null; }},
 gift:{w:c=>morale(c)>55&&G.credits<10000&&c.wallet>2000?4:0,ok:c=>true,
  exec:c=>{ const amt=Math.round(c.wallet/3/50)*50; c.wallet-=amt; gain(amt,c.name+' quietly covered some ship expenses');
    bumpCrew(c,'@captain',3); return c.name+' slid a credit chit across the mess table: "Pay me back when we are flush, Cap." (+'+cr(amt)+')'; }},
};
function eligibleCrewActs(c,ctx){
  return Object.keys(CREW_ACTS).filter(k=>{ try{return CREW_ACTS[k].ok(c,ctx);}catch(e){return false;} });
}
function pickCrewAct(c,ctx){
  const acts=eligibleCrewActs(c,ctx);
  let tot=0; const ws=acts.map(k=>{ const w=Math.max(0,CREW_ACTS[k].w(c)); tot+=w; return w; });
  if(tot<=0)return 'rest';
  let r=Math.random()*tot;
  for(let i=0;i<acts.length;i++){ r-=ws[i]; if(r<=0)return acts[i]; }
  return acts[acts.length-1];
}
function execCrewAct(c,k,line){
  const a=CREW_ACTS[k]; if(!a||!a.ok(c, G._tickCtx||'port'))return null;
  let out=null; try{ out=a.exec(c); }catch(e){}
  if(out&&line)out=out+' <span class="muted">“'+line+'”</span>';
  return out;
}

/* ---------- Crew ticks ---------- */
function crewTick(ctx){
  if(!G.crew||!G.crew.length)return;
  G._tickCtx=ctx;
  // quit check first — deterministic threshold, random trigger
  for(let i=G.crew.length-1;i>=0;i--){ const c=G.crew[i];
    if(morale(c)<-40&&!c.quitting&&d6()<=2){ c.quitting=true;
      logEntry(c.name+' has had enough and gives notice — leaving at the next port.','muted'); } }
  const report=[];
  if(typeof aiCrewBrain==='function'&&aiEnabled&&aiEnabled()){
    aiCrewBrain(ctx,report).catch(()=>{ ruleCrewTick(ctx,report); finishCrewTick(ctx,report); });
    return;                                                  // AI path finishes async
  }
  ruleCrewTick(ctx,report);
  finishCrewTick(ctx,report);
}
function ruleCrewTick(ctx,report){
  (G.crew||[]).forEach(c=>{ const k=pickCrewAct(c,ctx); const out=execCrewAct(c,k);
    if(out)report.push(out); });
}
function finishCrewTick(ctx,report){
  checkGoals();
  if(report.length)showEvent('Crew Report','—',report.join('<div style="height:6px"></div>'));
  save(); renderAll();
}
function checkGoals(){
  (G.crew||[]).forEach(c=>{
    ['short','medium','long'].forEach(h=>{
      const cur=c.goals&&c.goals[h]; if(!cur)return;
      const g=goalDef(cur.id); if(!g)return;
      let done=false;
      if(g.w!=null)done=c.wallet>=g.w;
      if(g.worlds!=null)done=(G.visited||[]).length>=g.worlds;
      if(!done&&h==='short'&&d6()===6)done=true;            // small goals resolve on their own
      if(done){ G.crew.forEach(o=>{ if(o!==c)bumpCrew(c,o.name,4); }); bumpCrew(c,'@captain',5);
        logEntry(c.name+' got what they were after — '+cur.txt+'.','muted');
        c.goals[h]=newGoal(h,cur.id); }
    });
  });
}

/* ---------- Arrival processing (crew side) ---------- */
function crewArrival(){
  const w=here(); const report=[];
  for(let i=(G.crew||[]).length-1;i>=0;i--){ const c=G.crew[i];
    // quitting crew walk
    if(c.quitting){ G.crew.splice(i,1);
      report.push('<b>'+c.name+'</b> shoulders a duffel at the bottom of the ramp, nods once, and walks into '+w.name+' port.');
      G.crew.forEach(o=>{ if((o.crels&&o.crels[c.name]||0)>20)bumpCrew(o,'@captain',-4); });
      continue; }
    // stowaway resolves
    if(c.stow){ if(d6()<=2){ const f=500*d6(); pay(f,'fines','Undeclared passenger found aboard — port fine');
        bumpCrew(c,'@captain',-10);
        report.push('Port control marches a stranger off your ship. <b>'+c.name+'</b> avoids your eye. Fine: '+cr(f)+'.');
      } else { c.wallet+=c.stow.fare; }
      c.stow=null; }
    // their goods sell where profitable; contraband risks the ship
    const sellInv=(inv,priv)=>{ for(let j=inv.length-1;j>=0;j--){ const it=inv[j];
      if(it.origin===w.name)continue;
      if(priv&&it.illegal&&d6()===1){ const f=1000*d6(); pay(f,'fines','Contraband traced to your ship — fine');
        bumpCrew(c,'@captain',-12);
        report.push('Customs finds contraband in a crew locker. The ship eats the fine ('+cr(f)+') — and <b>'+c.name+'</b> has some explaining to do.');
        inv.splice(j,1); continue; }
      const v=Math.round(it.base*priceMult(_2d6()+2,true));
      c.wallet+=v; inv.splice(j,1);
      if(!priv)report.push(c.name+' sold their '+it.name+' on the dockside market.'); } };
    sellInv(c.pubInv||[],false); sellInv(c.privInv||[],true);
  }
  if(report.length)showEvent('Portside','—',report.join('<div style="height:6px"></div>'));
}

/* ---------- NPC actions ---------- */
function goodById(id){ return ALLGOODS[id]||COMMON[0]; }
const NPC_ACTS={
 quiet:{w:8,ok:ch=>true,exec:ch=>null},
 tipoff:{w:3,ok:ch=>shipRel(ch)>20,exec:ch=>{ G.mods.buyDM+=1;
   return '<b>'+ch.name+'</b> passes word of a dealer worth visiting. (+1 next market search)'; }},
 deal:{w:2,ok:ch=>shipRel(ch)>30,exec:ch=>{ const nm=addSeizedLot(0.55+R(2)*0.05,d6()===1);
   return '<b>'+ch.name+'</b> can get you '+nm+' at well under market. It is on offer now.'; }},
 npcgift:{w:1,ok:ch=>shipRel(ch)>50,exec:ch=>{ const v=ch.wealth*100*d6(); gain(v,'A gift from '+ch.name);
   return '<b>'+ch.name+'</b> insists you take '+cr(v)+' — for past kindnesses, they say.'; }},
 intro:{w:2,ok:ch=>shipRel(ch)>40,exec:ch=>{ G.contacts.push(genContact());
   return '<b>'+ch.name+'</b> introduces you around. (new contact)'; }},
 reqitem:{w:4,ok:ch=>!(G.requests||[]).some(r=>r.by===ch.id),
  exec:ch=>{ const it=ch.wantItem; const pool=Object.values(TRADE).filter(g=>!g.illegal).concat(COMMON);
    const g=it?goodById(it.gid):pool[R(pool.length)-1];
    const vname=it?it.vname:goodVariant(g.id);
    const tons=Math.min(6,ch.wealth+R(2)); const match=!!it;
    const mult=Math.min(2.5,1.5+Math.max(0,shipRel(ch))/200+(match?0.4:0));
    const ppt=Math.round(g.base*mult); const due=G.day+14+d6()*7;
    chatOffer('cast',ch.name,'npcReq',
      'I need <b>'+tons+'t of '+vname+'</b> ('+g.name+')'+(match&&ch.goals.medium?' — for my plans to '+ch.goals.medium.txt+'.':'.')+
      ' I\u2019ll pay <b>'+cr(ppt)+'/t</b> \u2014 '+Math.round(mult*100)+'% of base \u2014 on delivery here within '+(due-G.day)+' days. Can you source it?',
      {_cast:ch.id,gid:g.id,vname,tons,ppt,due,name:ch.name},
      [{k:'yes',label:'Take the commission'},{k:'no',label:'Can\u2019t promise that'}]);
    return null; }},
 loanoffer:{w:2,ok:ch=>shipRel(ch)>25&&ch.wealth>=2&&G.credits<100000&&(G.loans||[]).length<3,
  exec:ch=>{ const P=ch.wealth*2500*d6(); const rate=10+d6()*5; const due=G.day+28;
    chatOffer('cast',ch.name,'npcLoanOffer',
      'Word is your ledger\u2019s thin. I can front you <b>'+cr(P)+'</b> \u2014 <b>'+cr(Math.round(P*(1+rate/100)))+'</b> back within 28 days ('+rate+'%). Among friends.',
      {_cast:ch.id,P,rate,due,name:ch.name},
      [{k:'yes',label:'Take the loan'},{k:'no',label:'Decline politely'}]);
    return null; }},
 loanask:{w:2,ok:ch=>{ const g=ch.goals&&ch.goals.medium&&npcGoalDef(ch.goals.medium.id);
   return g&&g.loan&&G.credits>20000&&!(G.lent||[]).some(l=>l.toId===ch.id&&!l.resolved); },
  exec:ch=>{ const P=ch.wealth*1000*d6(); const rate=20+d6()*10; const due=G.day+28;
    chatOffer('cast',ch.name,'npcLoanAsk',
      'I\u2019m going to be straight with you. I want to '+ch.goals.medium.txt+' and I\u2019m short <b>'+cr(P)+'</b>. '+
      'You\u2019d see <b>'+cr(Math.round(P*(1+rate/100)))+'</b> back in 28 days. It matters.',
      {_cast:ch.id,P,rate,due,name:ch.name},
      [{k:'yes',label:'Lend the money'},{k:'no',label:'Money and friends don\u2019t mix'}]);
    return null; }},
 barter:{w:2,ok:ch=>G.hold.length>0&&shipRel(ch)>0,
  exec:ch=>{ let bi=0,bv=-1; G.hold.forEach((h,i)=>{const v=h.ppt*h.tons; if(v>bv){bv=v;bi=i;}});
    const h=G.hold[bi]; const take=Math.min(h.tons,1+R(3));
    const pool=Object.values(TRADE).filter(g=>!g.illegal); const want=npcWantCat(ch);
    const g=(want&&want===h.id)?pool[R(pool.length)-1]:pool[R(pool.length)-1];
    const skew=1.1+R(3)*0.07;                                  // value lands in the player's favor
    const giveVal=Math.round(h.base*take*skew);
    const giveTons=Math.max(1,Math.round(giveVal/g.base));
    chatOffer('cast',ch.name,'npcBarter',
      'Straight swap: your <b>'+take+'t of '+h.name+'</b> for my <b>'+giveTons+'t of '+goodVariant(g.id)+'</b> ('+g.name+', ~'+cr(g.base)+'/t base). '+
      'The numbers lean your way \u2014 I want what you\u2019re carrying.',
      {_cast:ch.id,hi:bi,hname:h.name,take,gid:g.id,giveTons,name:ch.name},
      [{k:'yes',label:'Shake on it'},{k:'no',label:'Pass'}]);
    return null; }},
 travel:{w:1,ok:ch=>!ch.resident,exec:ch=>{ const o=G.worlds[R(G.worlds.length)-1]; ch.world=o.name; return null; }},
 snitch:{w:3,ok:ch=>shipRel(ch)<-30,exec:ch=>{ G.flagged=true;
   logEntry('Word is someone has been talking to customs about your ship.','muted');
   return null; }},
 npctheft:{w:2,ok:ch=>shipRel(ch)<-50,exec:ch=>{ const v=200*d6(); pay(v,'incidentals','Dock pilferage — your gear, specifically');
   return 'Tools and fittings go missing from your berth overnight. The dock cameras were, of course, broken.'; }},
};
function eligibleNpcActs(ch){ return Object.keys(NPC_ACTS).filter(k=>{ try{return NPC_ACTS[k].ok(ch);}catch(e){return false;} }); }
function npcTick(){
  const ppl=peopleHere(); if(!ppl.length)return;
  shuffle(ppl);
  const actors=ppl.slice(0,Math.min(2,ppl.length));
  const report=[];
  actors.forEach(ch=>{
    const acts=eligibleNpcActs(ch);
    let tot=0; const ws=acts.map(k=>{tot+=NPC_ACTS[k].w;return NPC_ACTS[k].w;});
    let r=Math.random()*tot,k=acts[acts.length-1];
    for(let i=0;i<acts.length;i++){ r-=ws[i]; if(r<=0){k=acts[i];break;} }
    const out=NPC_ACTS[k].exec(ch); if(out)report.push(out);
  });
  if(report.length)showEvent('Around the Port','—',report.join('<div style="height:6px"></div>'));
}

/* ---------- Choice handlers for the new decisions ---------- */
Object.assign(CHOICES,{
 bountyHunters(k,d){
   const b=G.bills;
   if(k==='pay'){ if(G.credits<b.mortgage)return 'You open the ledger and they laugh. You cannot cover it — pick again next time they corner you.';
     const amt=b.mortgage; G.credits-=amt; book('mortgage',-amt); b.mortgage=0; b.mortM=0;
     logEntry('Paid the recovery agents in full — '+cr(amt)+'.','money',-amt);
     return 'Credits transfer. The writ is stamped void and they walk away without a backward glance. The mortgage arrears are cleared.'; }
   if(k==='fight'){ const c=skillCheck(9,'Gunner','Tactics');
     if(c.ok){ logEntry('Drove off the recovery agents — this time.','muted');
       return 'Your crew makes it expensive enough that they reconsider. They will be back with more friends — the debt still stands.'+c.txt; }
     const rep=2000*d6(); pay(rep,'incidentals','Firefight with recovery agents — damage');
     return 'It goes badly. '+cr(rep)+' in damage'+hurtCaptain(d6(),'the recovery-agent firefight')+' The debt still stands.'+c.txt; }
   advanceTime(2);
   return 'You buy two days dodging traffic control and burn out-system. The writ does not expire.'; },
 crewRaise(k,d){ const c=crewByName(d.name); if(!c)return 'They have already left the ship.';
   if(k==='yes'){ c.salary=(c.salary||0)+d.amt; bumpCrew(c,'@captain',12+d6());
     return 'You shake on it. '+c.name+' walks taller for a week. (salaries +'+cr(d.amt)+'/mo)'; }
   bumpCrew(c,'@captain',-(8+d6()));
   return c.name+' takes it without a word, which is somehow worse.'; },
 caughtCrew(k,d){ const c=crewByName(d.name); if(!c)return 'They are already gone.';
   const stolen=(c.privInv||[]).filter(i=>i.stolen);
   // stolen cargo returns to the hold — reverse the shrinkage
   stolen.forEach(it=>{ book('shrinkage',it.ppt*it.tons);
     const ex=G.hold.find(h=>h.id===it.id&&h.ppt===it.ppt); if(ex)ex.tons+=it.tons;
     else G.hold.push({id:it.id,name:it.name,cat:goodCat(it),base:it.base,tons:it.tons,ppt:it.ppt,illegal:it.illegal,origin:it.origin,quality:false,hot:false}); });
   c.privInv=[];
   if(k==='fire'){ const i=G.crew.indexOf(c); if(i>=0)G.crew.splice(i,1);
     G.crew.forEach(o=>{ if((o.crels&&o.crels[d.name]||0)>20)bumpCrew(o,'@captain',-5); });
     return 'You pay out '+d.name+'’s book and put them off the ship. The mess is quiet that night.'; }
   if(k==='dock'){ c.wallet=Math.max(0,c.wallet-1000); bumpCrew(c,'@captain',-10);
     return 'Docked pay and a long look. '+c.name+' nods stiffly. The goods are back in the hold.'; }
   bumpCrew(c,'@captain',8);
   return 'You let it go with a warning. '+c.name+' does not forget that.'; },
 npcReq(k,d){ const ch=castById(d._cast);
   if(k!=='yes')return 'They nod, disappointed, and start asking down the dock.';
   if(!G.requests)G.requests=[];
   G.requests.push({id:'rq'+(++G.choiceSeq),by:d._cast,name:d.name,gid:d.gid,vname:d.vname,tons:d.tons,ppt:d.ppt,due:d.due,world:here().name});
   return 'Good. '+d.tons+'t of '+(d.vname||goodById(d.gid).name)+' ('+goodById(d.gid).name+'), here, by day '+(d.due+1)+', at '+cr(d.ppt)+'/t. It\u2019s in your Commitments.'; },
 npcLoanOffer(k,d){ if(k!=='yes')return 'They pocket the chit. "The offer keeps. Mostly."';
   if(!G.loans)G.loans=[];
   G.credits+=d.P; book('loanIn',d.P);
   G.loans.push({id:'ln'+(++G.choiceSeq),from:d.name,fromId:d._cast,P:d.P,rate:d.rate,due:d.due,missed:0});
   logEntry('Borrowed '+cr(d.P)+' from '+d.name+' — '+cr(Math.round(d.P*(1+d.rate/100)))+' due day '+(d.due+1)+'.','money',d.P);
   return 'The credits land in the ship account. So does the obligation. (see Commitments)'; },
 npcLoanAsk(k,d){ const ch=castById(d._cast);
   if(k!=='yes'){ if(ch)bumpRel(ch,G.crew[0]?G.crew[0].name:'Captain',-4); return 'They take it gracefully. Their shoulders do not.'; }
   if(G.credits<d.P)return 'You check the ledger — you cannot actually spare it.';
   G.credits-=d.P; book('lentOut',-d.P);
   if(!G.lent)G.lent=[];
   G.lent.push({id:'lt'+(++G.choiceSeq),to:d.name,toId:d._cast,P:d.P,rate:d.rate,due:d.due,resolved:false});
   logEntry('Lent '+cr(d.P)+' to '+d.name+' — repayment promised day '+(d.due+1)+'.','money',-d.P);
   return d.name+' grips your hand hard. "You will not regret this." (see Commitments)'; },
 npcBarter(k,d){ if(k!=='yes')return 'No deal. No hard feelings, mostly.';
   const h=G.hold[d.hi]; if(!h||h.name!==d.hname||h.tons<d.take)return 'The goods in question are no longer aboard.';
   const g=goodById(d.gid);
   const inVal=g.base*d.giveTons;                          // booked as sale at the swap valuation
   const basis=h.ppt*d.take;
   book('sales',inVal); book('cogs',-basis);
   h.tons-=d.take; if(h.tons<=0)G.hold.splice(d.hi,1);
   G.hold.push({id:g.id,name:goodVariant(g.id),cat:g.name,base:g.base,tons:d.giveTons,
     ppt:Math.round(inVal/d.giveTons),illegal:false,origin:here().name,quality:false,hot:false});
   logEntry('Barter with '+d.name+': '+d.take+'t '+d.hname+' for '+d.giveTons+'t '+g.name+'.','muted');
   return 'Crates cross the dock in both directions. You come out ahead on paper — time will tell on the market.'; },
});

/* ---------- Commitments: dues processed as time passes ---------- */
function processDues(){
  const day=G.day;
  (G.loans||[]).forEach(l=>{
    if(l.paid||day<=l.due)return;
    if(!l.missed){ l.missed=1; l.due=day+14;
      const ch=castById(l.fromId); if(ch&&G.crew.length)bumpRel(ch,G.crew[R(G.crew.length)-1].name,-30);
      const pen=Math.round(l.P*0.1); G.credits-=pen; book('interest',-pen);
      logEntry('Missed payment to '+l.from+' — '+cr(pen)+' penalty added, two weeks’ grace. They are not smiling.','money',-pen); }
    else { // second miss: they take it out of your cargo (the borrowed cash stays
      // on the books as loanIn — you kept it; you paid in cargo, booked as spoilage)
      let owed=Math.round(l.P*(1+l.rate/100));
      while(owed>0&&G.hold.length){ const h=G.hold[0]; const t=Math.min(h.tons,Math.ceil(owed/h.ppt));
        book('spoilage',-h.ppt*t); owed-=h.ppt*t; h.tons-=t; if(h.tons<=0)G.hold.shift(); }
      l.paid=true;
      logEntry(l.from+'’s people visit the hold with a manifest and very steady hands. Cargo seized in settlement.','muted'); }
  });
  G.loans=(G.loans||[]).filter(l=>!l.paid);
  (G.lent||[]).forEach(l=>{
    if(l.resolved||day<=l.due)return;
    l.resolved=true;
    const ch=castById(l.toId);
    const chance=Math.max(10,Math.min(90,40+(ch?shipRel(ch):0)));
    if(R(100)<=chance){ const back=Math.round(l.P*(1+l.rate/100));
      G.credits+=back; book('lentOut',l.P); book('otherIncome',back-l.P);
      if(ch&&G.crew.length)bumpRel(ch,G.crew[R(G.crew.length)-1].name,15);
      logEntry(l.to+' repays the loan — '+cr(back)+'. '+(ch&&ch.goals.medium?'The '+ch.goals.medium.txt+' worked out.':''),'money',back); }
    else { if(ch&&!ch.resident)ch.world='(gone)';
      logEntry(l.to+' has missed the repayment date. Asking around the port gets you shrugs.','muted'); }
  });
  (G.requests||[]).forEach(r=>{ if(day>r.due&&!r.expired){ r.expired=true;
    const ch=castById(r.by); if(ch&&G.crew.length)bumpRel(ch,G.crew[R(G.crew.length)-1].name,-15);
    logEntry('The commission for '+r.name+' ('+goodById(r.gid).name+') has lapsed.','muted'); } });
  G.requests=(G.requests||[]).filter(r=>!r.expired);
}

/* ---------- Delivering on a commission ---------- */
function deliverRequest(ri){
  const r=(G.requests||[])[ri]; if(!r)return;
  if(here().name!==r.world){ flash('That delivery is owed on '+r.world+'.'); return; }
  const hi=G.hold.findIndex(h=>h.id===r.gid);
  if(hi<0){ flash('You need '+goodById(r.gid).name+' in the hold.'); return; }
  const h=G.hold[hi]; const t=Math.min(h.tons,r.tons);
  const revenue=t*r.ppt, basis=t*h.ppt;
  G.credits+=revenue; book('sales',revenue); book('cogs',-basis);
  h.tons-=t; if(h.tons<=0)G.hold.splice(hi,1);
  r.tons-=t;
  logEntry('Delivered '+t+'t '+h.name+' to '+r.name+' @ '+cr(r.ppt)+'/t = '+cr(revenue),'money',revenue);
  if(r.tons<=0){ const ch=castById(r.by);
    if(ch&&G.crew.length){ bumpRel(ch,G.crew[R(G.crew.length)-1].name,20); }
    showEvent('Delivery','—','<b>'+r.name+'</b> checks the seals twice and grins. "Knew I picked the right ship."');
    G.requests.splice(ri,1); }
  save(); renderAll();
}
function repayLoan(li){
  const l=(G.loans||[])[li]; if(!l)return;
  const owed=Math.round(l.P*(1+l.rate/100));
  if(G.credits<owed){ flash('You need '+cr(owed)+' on hand.'); return; }
  G.credits-=owed; book('loanIn',-l.P); book('interest',-(owed-l.P));
  const ch=castById(l.fromId); if(ch&&G.crew.length)bumpRel(ch,G.crew[R(G.crew.length)-1].name,10);
  logEntry('Repaid '+l.from+' in full — '+cr(owed)+'.','money',-owed);
  G.loans.splice(li,1);
  save(); renderAll();
}

/* ---------- Inspect quarters / fire / hire ---------- */
function inspectQuarters(name){
  const c=crewByName(name); if(!c)return;
  if(G.day-(c.lastInspect||-99)<7){ flash('You searched their quarters days ago. Let it breathe.'); return; }
  c.lastInspect=G.day;
  if((c.privInv||[]).length){
    const found=c.privInv.map(i=>i.tons+'t '+i.name+(i.stolen?' (from your own hold)':'')).join(', ');
    offerChoice('caughtCrew','Crew',0,'Under the bunk panel in <b>'+c.name+'</b>’s quarters: '+found+'. They stand in the doorway, very still.',
      {name:c.name},
      [{k:'fire',label:'Put them off the ship'},{k:'dock',label:'Dock their pay'},{k:'forgive',label:'A warning — this once'}]);
  } else {
    bumpCrew(c,'@captain',-8);
    showEvent('Crew','—','Nothing. '+c.name+' watches you remake the bunk in silence. Trust is not improved.');
  }
  save(); renderAll();
}
function fireCrew(name){
  const c=crewByName(name); if(!c)return;
  const i=G.crew.indexOf(c); G.crew.splice(i,1);
  G.crew.forEach(o=>{ if((o.crels&&o.crels[name]||0)>20)bumpCrew(o,'@captain',-5); });
  logEntry('Paid off and dismissed '+name+'.','muted');
  closeModal(); save(); renderAll();
}
const HIRE_ROLES=[['Pilot',6000,'Pilot'],['Navigator',5000,'Navigator'],['Engineer',4000,'Engineer'],['Medic',2000,'Medic'],['Steward',3000,'Steward'],['Gunner',1000,'Pilot']];
function genCandidate(){
  const t=HIRE_ROLES[R(HIRE_ROLES.length)-1];
  const used=new Set(G.crew.map(c=>c.name));
  let nm,guard=0;
  do{ nm=CFIRST[R(CFIRST.length)-1]+' '+SURNAME[R(SURNAME.length)-1]; guard++; }while(used.has(nm)&&guard<40);
  const c={name:nm,position:t[0],salary:t[1],age:24+d6()*2+d6()*2,
    upp:[0,0,0,0,0,0].map(()=>ehex(_2d6())).join(''),
    skills:pickSkills(SKILLPOOL[t[2]]||SKILLPOOL.Steward)};
  return c;
}
function hireCrew(idx){
  const cand=(G._candidates||[])[idx]; if(!cand)return;
  if(G.crew.length>=8){ flash('No bunks left — the ship sleeps eight at most.'); return; }
  G.crew.push(cand);
  cand.rel={desc:'New aboard — unproven',target:G.crew[0]?G.crew[0].name:null};
  augmentCrewAll(G.crew);
  G._candidates.splice(idx,1);
  logEntry('Signed on '+cand.name+' as '+cand.position+' — '+cr(cand.salary)+'/mo.','muted');
  showCrew(); save(); renderAll();
}
function showRecruits(){
  if(!'ABC'.includes(here().u.sp)){ flash('Only class A–C ports run a hiring hall.'); return; }
  if(!G._candidates||G._candWorld!==G.here){ G._candidates=[genCandidate(),genCandidate(),genCandidate()]; G._candWorld=G.here; }
  const cards=G._candidates.map((c,i)=>'<div class="card" style="margin-bottom:8px"><div class="body">'+
    '<div class="row" style="justify-content:space-between"><b style="color:#dfe8f7">'+c.name+'</b><span class="pill">'+c.position+'</span></div>'+
    '<div class="hint">UPP '+c.upp+' · Age '+c.age+' · '+cr(c.salary)+'/mo</div>'+
    '<div style="margin:4px 0">'+c.skills.map(s=>'<span class="code">'+s+'</span>').join(' ')+'</div>'+
    '<div style="text-align:right"><button class="primary" onclick="hireCrew('+i+')">Sign on</button></div>'+
    '</div></div>').join('');
  openModal('<h2>HIRING HALL</h2><p class="hint">Spacers looking for a berth on '+here().name+'. Salaries follow the standard tables; personalities are pot luck.</p>'+
    cards+'<div style="text-align:right;"><button onclick="showCrew()">Back</button></div>');
}

/* ---------- Hooks called from game flow ---------- */
function peoplePortWeek(){           // every ~7 days in port
  if(G.day-(G.lastCrewTick||0)>=7){ G.lastCrewTick=G.day; crewTick('port'); npcTick(); }
}
function peopleOnJump(){             // in transit
  G.lastCrewTick=G.day;
  if(G.sabotage){ const b=500*d6(); pay(b,'incidentals','Unexplained mechanical failure — repairs');
    advanceTime(1);
    logEntry('A feed line fails that was inspected last week. '+(crewSkill('Investigate')?'Someone aboard did this.':'Bad luck — probably.'),'muted');
    G.sabotage=null; }
  crewTick('jump');
}
function bankTrouble(){              // mortgage arrears bite on arrival
  const b=G.bills; if(!b||!(SHIPS[G.ship].mortgage>0))return;
  const w=here();
  // 2+ months behind: high-law ports enforce the bank's lien
  if(b.mortM>=2&&w.u.law>=7&&G.hold.length){
    let owed=b.mortgage, seized=0;
    while(owed>0&&G.hold.length){ const h=G.hold[0]; const t=Math.min(h.tons,Math.ceil(owed/h.ppt));
      book('spoilage',-h.ppt*t); seized+=h.ppt*t; owed-=h.ppt*t; h.tons-=t; if(h.tons<=0)G.hold.shift(); }
    b.mortgage=Math.max(0,b.mortgage-seized);
    if(b.mortgage<=0)b.mortM=0;
    logEntry('Port authority impounded cargo against the bank lien — '+cr(seized)+' credited to arrears.','muted');
    showEvent('Impound','—','Customs meets you at the berth with a bank lien and a flatbed. Cargo worth <b>'+cr(seized)+'</b> is impounded against the mortgage arrears.'+
      (b.mortgage>0?' You still owe <b>'+cr(b.mortgage)+'</b>.':' The arrears are cleared — the hard way.'));
    return;
  }
  // 3+ months: the note went to a recovery agency
  if(b.mortM>=3&&d6()<=4){
    const ch=meetCast(CAST_ROLES.danger[R(CAST_ROLES.danger.length)-1],true); ch.world=w.name;
    offerChoice('bountyHunters','Recovery Agents',0,
      '<b>'+ch.name+'</b> and two associates are waiting at the bottom of the ramp with a recovery writ for this hull. '+
      '"'+cr(b.mortgage)+' clears it, captain. Or we take the ship and you keep your teeth. Your pick."',
      {_cast:ch.id,name:ch.name},
      [{k:'pay',label:'Pay the arrears ('+cr(b.mortgage)+')'},
       {k:'fight',label:'Fight them off (Gunner/Tactics 9+)'},
       {k:'run',label:'Lift off hot (2 days, they will be back)'}]);
  }
}
function peopleOnArrival(){
  if(!G.visited)G.visited=[];
  if(G.visited.indexOf(G.here)<0)G.visited.push(G.here);
  ensureResidents();
  crewArrival();
  if(G.flagged){ G.flagged=false;
    if(hasIllegal()){ const lost=confiscateIllegal(); const f=1000*d6(); pay(f,'fines','Tipped-off customs search');
      showEvent('Customs','—','They came straight to the right deck plate. '+lost+' seized, fined '+cr(f)+'. Someone sold you out.'); }
    else showEvent('Customs','—','A full customs team turns the ship over and finds nothing. They seem almost disappointed. Someone sold you out anyway.'); }
  npcTick();
  bankTrouble();
}

/* ---------- Health (Cepheus-style: physical UPP = hit capacity) ---------- */
// hpMax = STR+DEX+END (first three UPP digits). Damage comes off the pool;
// at 0 the character is down — hospitalized at the next port. A Medic aboard
// speeds recovery, exactly the kind of salary that pays for itself.
function uppVal(ch){ const v=parseInt(ch,16); return isNaN(v)?7:v; }
function hpMaxOf(upp){ return uppVal(upp[0])+uppVal(upp[1])+uppVal(upp[2]); }
function augmentHealth(c){
  if(!c.upp)c.upp=[0,0,0,0,0,0].map(()=>ehex(_2d6())).join('');
  if(c.hpMax==null)c.hpMax=hpMaxOf(c.upp);
  if(c.hp==null)c.hp=c.hpMax;
}
function hurtCrew(c,dmg,why){
  if(!c)return '';
  augmentHealth(c);
  c.hp=Math.max(0,c.hp-dmg);
  if(c.hp===0&&!c.down){ c.down=true; c.downUntil=G.day+14;
    logEntry(c.name+' is badly hurt ('+why+') — out of action until day '+(c.downUntil+1)+'.','muted');
    return ' <b>'+c.name+'</b> is carried to a bunk, badly hurt.'; }
  logEntry(c.name+' took a knock ('+why+') — '+c.hp+'/'+c.hpMax+'.','muted');
  return '';
}
function hurtRandomCrew(dmg,why){ if(!G.crew||!G.crew.length)return '';
  return hurtCrew(G.crew[R(G.crew.length)-1],dmg,why); }
function hurtCaptain(dmg,why){
  if(!G.captain)return '';
  G.captain.hp=Math.max(0,G.captain.hp-dmg);
  if(G.captain.hp===0&&!G.captain.down){ G.captain.down=true; G.captain.downUntil=G.day+14;
    const med=1000*d6(); pay(med,'incidentals','Your own hospital bill');
    advanceTime(7);
    logEntry('You wake in a med bay ('+why+'). A week gone and '+cr(med)+' poorer.','muted');
    return ' You go down hard — a week in a med bay and '+cr(med)+' in bills.'; }
  logEntry('You took a hit ('+why+') — '+G.captain.hp+'/'+G.captain.hpMax+'.','muted');
  return '';
}
function healTick(){                      // called weekly + on arrival
  const med=crewSkill('Medic')>0;
  const all=(G.crew||[]).concat(G.captain?[G.captain]:[]);
  all.forEach(c=>{ augmentHealth(c);
    if(c.down){ if(G.day>=c.downUntil){ c.down=false; c.hp=Math.max(c.hp,Math.ceil(c.hpMax/2));
      logEntry((c===G.captain?'You are':c.name+' is')+' back on their feet.','muted'); } return; }
    if(c.hp<c.hpMax)c.hp=Math.min(c.hpMax,c.hp+1+(med?2:0)); });
  // hospitalization billing at port for downed crew
  (G.crew||[]).forEach(c=>{ if(c.down&&!c.billed){ c.billed=true; const b=500*d6();
    pay(b,'incidentals','Hospital care for '+c.name); } if(!c.down)c.billed=false; });
}
function hpWord(c){ const r=c.hp/c.hpMax; return c.down?'in sickbay':r>0.99?'fit':r>0.7?'bruised':r>0.4?'hurt':'in a bad way'; }
function genCaptain(){
  const upp=[0,0,0,0,0,0].map(()=>ehex(_2d6())).join('');
  return {name:'You',upp,hpMax:hpMaxOf(upp),hp:hpMaxOf(upp)};
}
