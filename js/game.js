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
  if(g&&g.worlds){
    if(!SHIPS[g.ship])g.ship=SHIP_ALIAS[g.ship]||'trader';        // legacy ship keys
    if(g.fuel==null){ g.fuel=SHIPS[g.ship].fuelCap; g.fuelUnrefined=false; }
    if(!g.bills)g.bills={wages:0,wagesM:0,mortgage:0,mortM:0,upkeep:0,upkeepM:0};
    g.worlds.forEach(w=>{ if(w.gg==null)w.gg=_2d6()>=5; });
    if(!g.books)g.books=emptyBooks(); if(!g.crew||!g.crew.length)g.crew=genCrew(g.ship);
    if(!g.mods)g.mods=emptyMods(); if(!g.contacts)g.contacts=[]; if(!g.tab)g.tab='trade';
    if(!g.cast)g.cast=[]; if(g.castSeq==null)g.castSeq=0;
    if(!g.loans)g.loans=[]; if(!g.lent)g.lent=[]; if(!g.requests)g.requests=[];
    if(!g.chats)g.chats={}; if(!g.chatUnread)g.chatUnread={}; if(!g.visited)g.visited=[g.here];
    if(!g.captain)g.captain=genCaptain();
    augmentCrewAll(g.crew); g.crew.forEach(c=>augmentHealth(c));
    (g.cast||[]).forEach(c=>augmentCast(c)); }
  return g; }catch(e){return null;} }

function newGame(shipKey){
  shipKey=SHIPS[shipKey]?shipKey:(SHIP_ALIAS[shipKey]||'trader');
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
    fuel:SHIPS[shipKey].fuelCap, fuelUnrefined:false,
    bills:{wages:0,wagesM:0,mortgage:0,mortM:0,upkeep:0,upkeepM:0},
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
    if(!G.bills)G.bills={wages:0,wagesM:0,mortgage:0,mortM:0,upkeep:0,upkeepM:0};
    const b=G.bills;
    // anything still unpaid when a new statement posts is officially LATE
    if(b.wages>0)b.wagesM+=n;
    if(b.mortgage>0)b.mortM+=n;
    if(b.upkeep>0)b.upkeepM+=n;
    let fee=0;
    if(b.mortM>=1&&b.mortgage>0){ fee=Math.round(b.mortgage*0.1); b.mortgage+=fee; }  // late fee on the overdue balance
    b.wages+=crewSalaries()*n;
    b.mortgage+=(s.mortgage||0)*n;
    b.upkeep+=monthlyOverhead()*n;
    // unpaid wages: every crew member takes it personally
    if(b.wagesM>=1&&crewSalaries()>0){
      (G.crew||[]).forEach(c=>bumpCrew(c,'@captain',-(8+d6())));
      logEntry('Wages are '+b.wagesM+' month'+(b.wagesM>1?'s':'')+' in arrears. The mess hall has gone quiet when you walk in.','muted');
    }
    const warn=[];
    if(fee)warn.push('mortgage late fee '+cr(fee)+' added');
    if(b.mortM>=2)warn.push('the bank has filed liens — high-law ports WILL impound cargo');
    if(b.mortM>=3)warn.push('the note has been sold to a recovery agency — expect bounty hunters');
    logEntry('Monthly statements posted — wages '+cr(b.wages)+', mortgage '+cr(b.mortgage)+', upkeep '+cr(b.upkeep)+
      '. Pay them in Commitments.'+(warn.length?' ⚠ '+warn.join('; ')+'.':''),'muted');
    showEvent('Accounts','—','Monthly statements posted. <b>Wages '+cr(b.wages)+'</b> · <b>Mortgage '+cr(b.mortgage)+'</b> · <b>Upkeep '+cr(b.upkeep)+'</b>. '+
      'Settle them from the <b>Commitments</b> card on the Bridge tab.'+
      (warn.length?'<div class="hint" style="margin-top:6px;color:#ffcf6b">⚠ '+warn.join('. ')+'.</div>':''));
  }
  // power plant burns fuel continuously (SRD: plantWk tons per week)
  if(G.fuel!=null){ const burn=SHIPS[G.ship].plantWk*days/7;
    const had=G.fuel; G.fuel=Math.max(0,Math.round((G.fuel-burn)*100)/100);
    if(had>0&&G.fuel<=0)logEntry('Fuel tanks have run dry — the plant is on reserve cells. No jumping until you refuel.','muted'); }
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
  const need=jumpFuel(dist);
  if(G.fuel<need){ flash('Jump-'+dist+' needs '+need+'t of fuel — tanks hold '+Math.floor(G.fuel)+'t. Refuel first (Bridge tab).'); return; }
  dropChoice();
  document.getElementById('event-area').innerHTML='';   // fresh feed for the new leg
  G.fuel=Math.round((G.fuel-need)*100)/100;
  logEntry('Jumped '+dist+' parsec'+(dist>1?'s':'')+' to '+to.name+' — burned '+need+'t of '+(G.fuelUnrefined?'unrefined':'refined')+' fuel.','muted');
  let jdelay=0, jmsg='';
  if(G.fuelUnrefined){                          // SRD: unrefined fuel is −2 on the jump check
    const roll=_2d6()-2+Math.min(2,crewSkill('Engineer'));
    if(roll<=0){ const rep=1000*d6(); jdelay=d6(); pay(rep,'incidentals','Misjump on dirty fuel — drive damage');
      jmsg='MISJUMP. The drive screams on unrefined hydrogen and wrenches you out of jump space the hard way — '+jdelay+' extra days adrift and '+cr(rep)+' in drive repairs.'; }
    else if(roll<8){ jdelay=Math.ceil(d6()/2);
      jmsg='Rough transition on unrefined fuel — you emerge well off the mark. '+jdelay+' extra day'+(jdelay>1?'s':'')+' limping in-system.'; }
  }
  advanceTime(7+jdelay);
  if(jmsg)showEvent('Jump Transition','—',jmsg);
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



/* ---------- Refueling (Cepheus SRD: off-world-travel.md) ---------- */
function refuel(kind){
  const s=SHIPS[G.ship]; const w=here(); const sp=w.u.sp;
  const space=Math.max(0,Math.ceil(s.fuelCap-G.fuel));
  if(kind!=='purify'&&space<=0){ flash('Tanks are already full.'); return; }
  if(kind==='refined'){
    if(!'AB'.includes(sp)){ flash('Refined fuel (Cr500/t) is sold only at class A or B starports.'); return; }
    const cost=space*500; if(G.credits<cost){ flash('Topping up costs '+cr(cost)+'.'); return; }
    pay(cost,'fuel','Refined fuel — '+space+'t @ Cr500');
    if(G.fuel<=0.01)G.fuelUnrefined=false;      // a clean fill of an empty tank
    G.fuel=s.fuelCap;
  } else if(kind==='unrefined'){
    if(!'ABCDE'.includes(sp)){ flash('No port services here — skim a gas giant or water source.'); return; }
    const rate='ABC'.includes(sp)?100:300;      // D/E: a local bowser at a markup (house rule)
    const cost=space*rate; if(G.credits<cost){ flash('Topping up costs '+cr(cost)+'.'); return; }
    pay(cost,'fuel','Unrefined fuel — '+space+'t @ Cr'+rate);
    G.fuel=s.fuelCap; G.fuelUnrefined=true;
  } else if(kind==='skim'){
    if(!w.gg&&w.u.hydro<2){ flash('Nothing to skim — no gas giant in-system and no open water.'); return; }
    advanceTime(1);
    G.fuel=s.fuelCap; G.fuelUnrefined=true;
    logEntry('Skimmed '+(w.gg?'the gas giant':'local waters')+' — tanks full of unrefined hydrogen. Free, if you ignore the day.','muted');
    if(w.gg&&d6()===1){ const c=skillCheck(8,'Gunner','Tactics');
      if(c.ok)logEntry('A pirate skiff shadowed you at the gas giant; your gunnery discouraged it.'+'','muted');
      else { const b=500*d6(); pay(b,'incidentals','Pirates harried you while skimming — repairs'); } }
  } else if(kind==='purify'){
    if(!G.fuelUnrefined){ flash('The fuel aboard is already refined.'); return; }
    advanceTime(1);
    G.fuelUnrefined=false;
    logEntry('Ran the tanks through the onboard fuel processors — refined and jump-safe.','muted');
  }
  if(typeof notifyAction==='function')notifyAction('Refueled ('+kind+'). Tanks: '+Math.floor(G.fuel)+'/'+s.fuelCap+'t '+(G.fuelUnrefined?'unrefined':'refined')+'.');
  save(); renderAll();
}


/* ---------- Bills: posted monthly, paid by hand. Neglect has teeth. ---------- */
function billTotal(){ const b=G.bills||{}; return (b.wages||0)+(b.mortgage||0)+(b.upkeep||0); }
function payBill(kind){
  if(!G.bills)return;
  const b=G.bills;
  const pay1=(k,cat,label,after)=>{
    const amt=b[k]; if(amt<=0){flash('Nothing owed there.');return;}
    if(G.credits<amt){ flash('That bill is '+cr(amt)+' — you have '+cr(G.credits)+'.'); return; }
    G.credits-=amt; book(cat,-amt);
    b[k]=0; b[k+'M']=0;
    logEntry('Paid '+label+' — '+cr(amt)+'.','money',-amt);
    if(after)after(amt);
  };
  if(kind==='wages'||kind==='all')pay1('wages','salaries','crew wages',amt=>{
    const tot=crewSalaries()||1;
    (G.crew||[]).forEach(c=>{ c.wallet=(c.wallet||0)+Math.round((c.salary||0)*0.1*(amt/tot));
      bumpCrew(c,'@captain',2); });
  });
  if(kind==='mortgage'||kind==='all')pay1('mortgage','mortgage','the ship mortgage');
  if(kind==='upkeep'||kind==='all')pay1('upkeep','overhead','maintenance & life support');
  if(typeof notifyAction==='function')notifyAction('Paid ship bills ('+kind+').');
  save(); renderAll();
}
