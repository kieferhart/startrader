/* ---------- Books (P&L + balance sheet) ---------- */
function emptyBooks(){ return {sales:0,otherIncome:0,cogs:0,fuel:0,mortgage:0,salaries:0,overhead:0,fines:0,incidentals:0,spoilage:0,
  loanIn:0,interest:0,lentOut:0,shrinkage:0}; }
function book(cat,amt){ if(!G.books)G.books=emptyBooks(); G.books[cat]=(G.books[cat]||0)+amt; }
function inventoryValue(){ return G.hold.reduce((a,h)=>a+h.ppt*h.tons,0); }
function netWorth(){ return G.credits+inventoryValue(); }

/* ---------- Event helpers: crew skills, cash effects, modifiers ---------- */
// G.mods holds short-lived bonuses earned from events. buyDM/extraLots are
// consumed by the next generateMarket(); nextTradeDM by the next sale roll;
// nextContactDM by the next contact search; trained by the next skillCheck.
function emptyMods(){ return {buyDM:0,nextTradeDM:0,nextContactDM:0,extraLots:0,trained:false}; }
function crewSkill(){ let best=0; const names=Array.prototype.slice.call(arguments);
  ((G&&G.crew)||[]).forEach(c=>(c.skills||[]).forEach(s=>{ const m=String(s).match(/^(.+)-(\d+)$/);
    if(m&&names.indexOf(m[1])>=0)best=Math.max(best,+m[2]); }));
  return best; }
function skillCheck(target){ const names=Array.prototype.slice.call(arguments,1);
  let dm=crewSkill.apply(null,names);
  if(G.mods&&G.mods.trained){ dm+=1; G.mods.trained=false; }
  const roll=_2d6()+dm;
  return {roll,dm,ok:roll>=target,txt:' <span class="muted">['+names.join('/')+' '+roll+' vs '+target+']</span>'}; }
function gain(amt,text){ amt=Math.round(amt); G.credits+=amt; book('otherIncome',amt); logEntry(text,'money',amt); }
function pay(amt,cat,text){ amt=Math.round(amt); G.credits-=amt; book(cat,-amt); logEntry(text,'money',-amt); }
function damageCargo(frac,why){
  if(!G.hold.length)return '';
  const h=G.hold[R(G.hold.length)-1];
  const loss=Math.min(h.tons,Math.max(1,Math.round(h.tons*frac)));
  book('spoilage',-loss*h.ppt); h.tons-=loss;
  if(h.tons<=0)G.hold.splice(G.hold.indexOf(h),1);
  logEntry(why+' — lost '+loss+'t of '+h.name+'.','muted');
  return ' Lost '+loss+'t of '+h.name+'.';
}
function hasIllegal(){ return G.hold.some(h=>h.illegal); }
function confiscateIllegal(){
  const names=[];
  for(let i=G.hold.length-1;i>=0;i--){ const h=G.hold[i];
    if(h.illegal){ names.push(h.tons+'t '+h.name); book('spoilage',-h.ppt*h.tons); G.hold.splice(i,1); } }
  if(names.length)logEntry('Contraband confiscated: '+names.join(', ')+'.','muted');
  return names.join(', ');
}

/* ---------- Game state ---------- */
let G=null;
const SAVE='starTraderSave_v1';
function save(){ try{localStorage.setItem(SAVE,JSON.stringify(G));}catch(e){} }
function load(){ try{const s=localStorage.getItem(SAVE); if(!s)return null; const g=JSON.parse(s);
  if(g&&g.worlds){ if(!g.books)g.books=emptyBooks(); if(!g.crew||!g.crew.length)g.crew=genCrew(g.ship);
    if(!g.mods)g.mods=emptyMods(); if(!g.contacts)g.contacts=[]; if(!g.tab)g.tab='trade';
    if(!g.cast)g.cast=[]; if(g.castSeq==null)g.castSeq=0;
    if(!g.loans)g.loans=[]; if(!g.lent)g.lent=[]; if(!g.requests)g.requests=[];
    if(!g.chats)g.chats={}; if(!g.chatUnread)g.chatUnread={}; if(!g.visited)g.visited=[g.here];
    if(!g.captain)g.captain=genCaptain();
    augmentCrewAll(g.crew); g.crew.forEach(c=>augmentHealth(c));
    (g.cast||[]).forEach(c=>augmentCast(c)); }
  return g; }catch(e){return null;} }

function newGame(shipKey){
  evReset();
  // Guarantee: the start world has >=1 world within the ship's jump range and
  // can chain (leg by leg) to >=5 more — i.e. it sits in a jump-connected
  // cluster of >=6 worlds. Retry generation, then stitch as a last resort.
  const jr=SHIPS[shipKey].jump, NEED=6;
  let worlds=null, si=-1;
  for(let t=0;t<30&&si<0;t++){ worlds=genSubsector(); si=bigComponentStart(worlds,jr,NEED); }
  if(si<0){ ensureCluster(worlds,jr,NEED); si=bigComponentStart(worlds,jr,NEED); }
  if(si<0)si=0;   // unreachable in practice; keeps newGame total
  const start=worlds[si];
  const ship=SHIPS[shipKey];
  G={
    ship:shipKey, ssname:SSNAMES[R(SSNAMES.length)-1],
    worlds, here:start.id, dest:null,
    credits:250000, startCredits:250000,
    day:0, lastMonth:0,
    hold:[], market:null, marketSrc:'', contacts:[],
    crew:genCrew(shipKey), books:emptyBooks(),
    mods:emptyMods(), pendingChoice:null, choiceSeq:0,
    courier:null, smuggleJob:null, passenger:null,
    cast:[], castSeq:0,
    loans:[], lent:[], requests:[], chats:{}, chatUnread:{}, visited:[start.id],
    captain:genCaptain(), lastCrewTick:0,
    tab:'trade', log:[]
  };
  logEntry('Game begins at '+start.name+' aboard the '+ship.name+'. Starting capital '+cr(250000)+'.','start');
  generateMarket('port');
  ensureResidents();                          // the home port has people in it
  save(); renderAll();
}

/* ---------- Market ---------- */
// Cepheus: a supplier has all Common Goods + 1D6 randomly-rolled Trade Goods.
// Illegal goods (D66 61-65) only via a black-market supplier (search "away").
function makeOffer(g,w,broker,away,bdm){
  let result=_2d6()+broker+maxDM(g.pDM,w.codes)-maxDM(g.rDM,w.codes)+(bdm||0);
  if(away)result+=2;                      // away-from-port discount (Star Trader)
  const mult=priceMult(result,false);
  return {id:g.id, name:goodVariant(g.id), cat:g.name, base:g.base, illegal:!!g.illegal,
    tons:rollTons(g.tons), ppt:Math.round(g.base*mult), mult};
}
function generateMarket(src){
  const w=here(), broker=SHIPS[G.ship].broker, away=src==='away';
  const bdm=G.mods?(G.mods.buyDM||0):0; if(G.mods)G.mods.buyDM=0;       // event bonus, consumed
  const extra=G.mods?(G.mods.extraLots||0):0; if(G.mods)G.mods.extraLots=0;
  const list=[];
  COMMON.forEach(g=>list.push(makeOffer(g,w,broker,away,bdm)));
  const n=d6()+extra;                     // 1D6 random Trade Goods (+ boom-economy extras)
  for(let k=0;k<n;k++){
    let g, guard=0;
    do{ g=TRADE[d66()]; guard++; }while((!g||g.illegal)&&guard<40); // 66/illegal -> reroll
    if(g&&!g.illegal)list.push(makeOffer(g,w,broker,away,bdm));
  }
  if(away)ILLEGAL_GOODS.forEach(g=>list.push(makeOffer(g,w,broker,away,bdm))); // black market
  G.market=list;
  G.marketSrc = away?'away from port (black-market access, −price)':'at the starport';
}

/* ---------- Trade actions ---------- */
function searchCargo(mode){
  dropChoice();
  advanceTime(mode==='away'?3:2);
  generateMarket(mode);
  logEntry('Searched for cargo '+(mode==='away'?'away from the port':'at the starport')+'.','muted');
  if(mode==='away'){ rollWorldEncounter(); }
  peoplePortWeek();
  notifyAction('Searched for cargo '+(mode==='away'?'away from the port (black market)':'at the starport')+' on '+here().name+'.');
  save(); renderAll();
}
function holdUsed(){ return G.hold.reduce((a,h)=>a+h.tons,0); }
function holdFree(){ return SHIPS[G.ship].cargo - holdUsed(); }

function buyGood(i){
  const m=G.market[i]; if(!m)return;
  const free=holdFree();
  const maxByCredits=Math.floor(G.credits/m.ppt);
  const maxBuy=Math.min(m.tons, free, maxByCredits);
  if(maxBuy<=0){ flash('Not enough '+(free<=0?'cargo space':'credits')+' for even 1 ton.'); return; }
  const input=document.getElementById('buy-'+i);
  let qty=input?parseInt(input.value)||0:maxBuy;
  qty=Math.min(qty, m.tons, free, maxByCredits);
  if(qty<=0){ flash('Enter a quantity you can afford and fit.'); return; }
  const cost=qty*m.ppt;
  G.credits-=cost;
  G.hold.push({id:m.id,name:m.name,cat:goodCat(m),base:m.base,tons:qty,ppt:m.ppt,illegal:m.illegal,origin:here().name,
    quality:m.quality||false,hot:m.hot||false});
  m.tons-=qty;
  logEntry('Bought '+qty+'t '+m.name+' @ '+cr(m.ppt)+'/t = '+cr(-cost),'money',-cost);
  notifyAction('Bought '+qty+'t of '+m.name+' ('+goodCat(m)+') for '+cr(cost)+(m.illegal?' — ILLEGAL goods':'')+'.');
  save(); renderAll();
}
function sellHold(i){
  const h=G.hold[i]; if(!h)return;
  const w=here();
  const g=ALLGOODS[h.id]||{pDM:{},rDM:{}};
  const broker=SHIPS[G.ship].broker;
  let result=_2d6()+broker+maxDM(g.rDM,w.codes)-maxDM(g.pDM,w.codes);
  if(h.quality)result+=1;                                    // top-quality goods (world event 54)
  if(G.mods&&G.mods.nextTradeDM){ result+=G.mods.nextTradeDM; G.mods.nextTradeDM=0; }
  const mult=priceMult(result,true);
  const ppt=Math.round(h.base*mult);
  const revenue=ppt*h.tons;
  const costBasis=h.ppt*h.tons;
  const profit=revenue-costBasis;
  G.credits+=revenue;
  book('sales',revenue); book('cogs',-costBasis);
  let extra='';
  if(h.illegal){
    // customs risk on illegal sales: roll vs law level
    if(d6()+d6() <= w.u.law){ const fine=Math.round(revenue*0.5);
      G.credits-=fine; book('fines',-fine); extra=' ⚠ Customs flagged it — fine '+cr(-fine)+'.'; }
  }
  if(h.hot && d6()<=2){ const fine=Math.round(revenue*0.25);   // stolen goods traced (events 42/45)
    G.credits-=fine; book('fines',-fine); extra+=' ⚠ The goods were traced as stolen — fine '+cr(-fine)+'.'; }
  logEntry('Sold '+h.tons+'t '+h.name+' @ '+cr(ppt)+'/t = '+cr(revenue)+
    ' ('+(profit>=0?'profit ':'LOSS ')+cr(profit)+')'+extra,'money',revenue);
  G.hold.splice(i,1);
  notifyAction('Sold '+h.tons+'t of '+h.name+' for '+cr(revenue)+' ('+(profit>=0?'profit':'a loss')+' of '+cr(Math.abs(profit))+').'+extra);
  save(); renderAll();
}

/* ---------- Time & costs ---------- */
function advanceTime(days){
  G.day+=days;
  const month=Math.floor(G.day/28);
  if(month>G.lastMonth){
    const n=month-G.lastMonth; G.lastMonth=month;
    const s=SHIPS[G.ship];
    const mort=(s.mortgage||0)*n, sal=crewSalaries()*n, over=monthlyOverhead()*n, bill=mort+sal+over;
    if(bill>0){ G.credits-=bill; book('mortgage',-mort); book('salaries',-sal); book('overhead',-over);
      // crew bank their pay (abstracted: a tenth reaches the sock under the bunk)
      (G.crew||[]).forEach(c=>{ c.wallet=(c.wallet||0)+Math.round((c.salary||0)*0.1)*n; });
      const parts=[]; if(mort)parts.push('mortgage'); if(sal)parts.push('salaries'); if(over)parts.push('maintenance & life support');
      logEntry('Monthly bill — '+parts.join(' + ')+' '+cr(-bill)+(G.credits<0?' ⚠ overdrawn — the bank is watching':''),'money',-bill); }
  }
  if(G._timeBusy)return;                       // dues/healing can advance time themselves
  G._timeBusy=true;
  try{
    processDues();
    if(G.day-(G.lastHeal==null?0:G.lastHeal)>=7){ G.lastHeal=G.day; healTick(); }
  }finally{ G._timeBusy=false; }
}

/* ---------- Jump ---------- */
function selectDest(id){ G.dest=id; renderAll(); }
function doJump(){
  if(G.dest==null)return;
  const from=here(), to=world(G.dest);
  const dist=hexDist(from,to);
  const jr=SHIPS[G.ship].jump;
  if(dist>jr){ flash('That world is '+dist+' parsecs away — beyond Jump-'+jr+'.'); return; }
  dropChoice();
  document.getElementById('event-area').innerHTML='';   // fresh feed for the new leg
  const fuel=SHIPS[G.ship].perJump*dist;
  G.credits-=fuel; book('fuel',-fuel);
  logEntry('Jumped '+dist+' parsec'+(dist>1?'s':'')+' to '+to.name+' — fuel/operations '+cr(-fuel),'money',-fuel);
  advanceTime(7);
  rollJumpEvent();
  peopleOnJump();                              // crew act in transit; sabotage bites here
  G.here=G.dest; G.dest=null;
  generateMarket('port');
  logEntry('Arrived at '+to.name+'. '+(G.hold.length?'Local buyers await your cargo.':'Hold is empty — find something to trade.'),'start');
  resolveArrivalJobs();
  peopleOnArrival();                           // residents, crew sales/quits, tipped-off customs
  rollArrivalEncounter();
  notifyAction('Jumped to '+to.name+' ('+(to.codes.join(' ')||'plain world')+'). The ship has just arrived.');
  save(); renderAll();
}

