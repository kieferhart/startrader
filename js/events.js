/* ---------- Event tables (Star Trader d66) ---------- */
const WORLD_ENC={
 11:'Crime. A random non-lethal crime targets you.',12:'You discover a renowned restaurant — a fine evening.',
 13:'Sudden weather change threatens travel plans.',14:'Agents of a megacorporation are on planet, making normal trade difficult.',
 15:'A sudden restriction on movement — unless you can find a way around it.',16:'Another trader is after your preferred lot of trade goods.',
 21:'You are invited to a posh function.',22:'A ruined structure holds your interest.',
 23:'You discover a landed spacecraft. Why is it here?',24:'A dangerous encounter with local wildlife.',
 25:'The seller and the situation make you suspicious — rethink the purchase?',26:'Festival celebrations slow things down but are an enjoyable diversion.',
 31:'The seller is in legal trouble; you risk getting embroiled.',32:'The community is not what it seems — or unusually welcoming.',
 33:'You find a little-known retreat — a place to relax, or to hide.',34:'Security check — papers and belongings searched.',
 35:'A patron offers you a short-term courier job to your next destination.',36:'Transport delays bog you down.',
 41:'Hard times here mean few trade goods for purchase.',42:'Valuable trade goods on offer at a great deal. Why?',
 43:'You are harassed by a group of locals.',44:'You learn a profitable secret — political or corporate.',
 45:'You must travel to a restricted area with a forged ID — goods more valuable here.',46:'A one-day job for Cr250, or a favour.',
 51:'You travel with interesting locals and gain a useful tip.',52:'Local crisis! A timely cargo could sell for 3× the price.',
 53:'An investment opportunity — gamble Cr1,000 to Cr10,000.',54:'Goods direct from the maker, top quality (+1 bonus).',
 55:'You are offered a risky but rewarding adventure.',56:'Local entertainments cost you a little but win you a friend.',
 61:'A job opportunity, up to three days, pays Cr600 + 1d6×Cr100.',62:'You fall ill.',
 63:'You are approached to smuggle illegal goods off-planet.',64:'Boom economy — every dealer has extra unusual cargoes.',
 65:'You are embroiled in legal trouble.',66:'An off-worlder befriends you; they are in a spot of bother.'};
const PORT_ENC={
 11:'Starport shutdown for a week — labour dispute or security problem.',12:'Your cargo is in the wrong place and the ship can’t wait.',
 13:'Your ship or crew are in trouble — legally, personally or mechanically.',14:'Customs: a delay or a 1% duty to pay.',
 15:'Red tape — transfer papers contain irregularities.',16:'Security search of you and your cargo.',
 21:'You meet a fellow Traveller — a potential contact.',22:'One of your contacts needs your help.',
 23:'Your cargo is pilfered or damaged.',24:'Asteroid miners cause trouble in port all week.',
 25:'You meet a minor celebrity with their aides and guards.',26:'Port personnel confuse you with someone else.',
 31:'A ship has limped into port with damage and casualties.',32:'A contact is desperate for help.',
 33:'You find a great hang-out at the port — perfect for making deals.',34:'A mysterious ship has landed; no one may approach it.',
 35:'A warehouse auctions off cargo — you could bid.',36:'A free-trader crew is arrested and their ship seized.',
 41:'Someone needs to get off-world fast... but it’s not simple.',42:'A port employee recognises one of your skills.',
 43:'A fire alarm keeps going off; everyone is jumpy.',44:'You are approached to smuggle illegal goods off-planet.',
 45:'Cargo seized by customs is going cheap (+2 to buy).',46:'Military ships in port cause problems for travellers.'};
const JUMP_ENC={
 11:'Hijack, piracy, or both!',12:'An incident amongst the crew — they turn to you for help.',
 13:'A problem revolves around one of your skills or status.',14:'An accident aboard requires repair — and maybe an injury.',
 15:'Fire in the cargo area — an electrical fault.',16:'A demanding passenger is a friend of the destination’s port manager.',
 21:'A passenger is a government inspector authorised to tour the ship.',22:'A crewman becomes sullen and starts making mistakes.',
 23:'Recycling systems need maintenance — a messy job.',24:'A passenger gives you useful intel on the destination world (+1 next search).',
 25:'A fresher breaks; a stateroom floods!',26:'The jump field misaligns — dangerous spot retuning needed.',
 31:'Cargo containers have shifted and need re-setting.',32:'An obnoxious passenger makes the trip miserable.',
 33:'Sensors produce false readings. Or are they false?',34:'A cargo container explodes — chemical fire!',
 35:'Two passengers have a blazing, unresolved argument.',36:'A passenger shows too much interest in another’s cabin.',
 41:'A typical trip, with highs and lows.',42:'A fuel pump fails — reactor on stand-by.',
 43:'Power failure — parts of engineering go dark.',44:'You meet one of your contacts, who needs help.',
 45:'A passenger claims to have seen a gun in another’s stateroom.',46:'A passenger falls mysteriously ill.',
 51:'A security patrol ship makes contact and may board.',52:'A crewman has an affair with a passenger.',
 53:'A gambling passenger takes everyone’s money and causes trouble.',54:'You meet a fellow Traveller — a potential contact.',
 55:'The captain runs a crew training session.',56:'Theft from a passenger stateroom.',
 61:'The captain is incapacitated — a crisis erupts!',62:'An engineering problem needs all hands to replace a component.',
 63:'A crewman has a crisis of doubt and shuts down.',64:'One of the stewards is behaving badly.',
 65:'A passenger is extremely reclusive and won’t leave their cabin.',66:'Mysterious death of a passenger or crew — murder?'};

/* --- event pop-up queue: events surface as modals, one at a time; the
   Bridge feed keeps a history copy. Choice pop-ups must be answered. --- */
let EVQ=[], EV_OPEN=false, EV_CHOICE=false;
function evShow(html){ document.getElementById('ev-body').innerHTML=html; document.getElementById('ev-bg').style.display='flex'; EV_OPEN=true; }
function evHide(){ document.getElementById('ev-bg').style.display='none'; EV_OPEN=false; EV_CHOICE=false; }
function evReset(){ EVQ.length=0; evHide(); }
function infoPopupHTML(e){
  return '<div class="evt">'+e.title+' · roll '+e.roll+'</div>'+
    '<div style="margin:12px 0;line-height:1.6">'+e.text+'</div>'+
    '<div style="text-align:right"><button class="primary" onclick="evNext()">Continue</button></div>';
}
function choicePopupHTML(pc){
  return '<div class="evt">'+pc.title+' · roll '+pc.roll+' · decision</div>'+
    '<div style="margin:12px 0;line-height:1.6">'+pc.text+'</div>'+
    '<div class="row" style="flex-direction:column;align-items:stretch;gap:6px">'+
    pc.options.map(o=>'<button onclick="resolveChoice(\''+o.k+'\')">'+o.label+'</button>').join('')+'</div>'+
    '<div class="hint" style="margin-top:8px;text-align:right">Your call, captain.</div>';
}
function pumpEvents(){
  if(EV_OPEN||!EVQ.length)return;
  const e=EVQ.shift();
  if(e.choice){ if(!G||!G.pendingChoice)return pumpEvents();
    EV_CHOICE=true; evShow(choicePopupHTML(G.pendingChoice)); return; }
  EV_CHOICE=false; evShow(infoPopupHTML(e));
}
function evNext(){ EV_OPEN=false; if(EVQ.length)pumpEvents(); else evHide(); }
function showEvent(title,roll,text){
  const a=document.getElementById('event-area');
  a.innerHTML='<div class="event"><div class="t">'+title+' · roll '+roll+'</div>'+text+'</div>'+ (a?a.innerHTML:'');
  EVQ.push({title,roll,text}); pumpEvents();
}

/* --- small event utilities --- */
function regenMarket(){ generateMarket(G.marketSrc&&G.marketSrc.indexOf('away')===0?'away':'port'); }
function tradeLots(){ const idx=[]; G.market.forEach((m,i)=>{ if(m.id<100)idx.push(i); }); return idx; }
function pickTradeLot(){ const t=tradeLots(); return t.length?t[R(t.length)-1]:-1; }
function bestDealIdx(){ let bi=-1,bm=99; G.market.forEach((m,i)=>{ if(m.mult<bm){bm=m.mult;bi=i;} }); return bi; }
function addSeizedLot(frac,hot){            // cheap lot dumped on the market by events
  const pool=Object.values(TRADE).filter(g=>!g.illegal);
  const g=pool[R(pool.length)-1];
  const nm=goodVariant(g.id);
  G.market.push({id:g.id,name:nm,cat:g.name,base:g.base,illegal:false,tons:rollTons(g.tons),
    ppt:Math.round(g.base*frac),mult:frac,hot:!!hot});
  return nm;
}

/* --- player decisions: a pending choice survives save/load; starting any
   other major action (search / jump / port walk / contacts) lets it pass --- */
function offerChoice(kind,title,roll,text,data,options){
  G.choiceSeq=(G.choiceSeq||0)+1;
  G.pendingChoice={kind,title,roll,text,data:data||{},options,uid:'ch'+G.choiceSeq};
  save();
  EVQ.push({choice:true}); pumpEvents();
  renderAll();
}
function renderPendingChoice(){           // restores the pop-up after a reload
  if(!G||!G.pendingChoice)return;
  if(EV_OPEN||EVQ.some(e=>e.choice))return;
  EVQ.push({choice:true}); pumpEvents();
}
function resolveChoice(k){
  const pc=G.pendingChoice; if(!pc)return;
  G.pendingChoice=null;
  const out=(CHOICES[pc.kind]||function(){return '';})(k,pc.data);
  const a=document.getElementById('event-area');
  a.innerHTML='<div class="event"><div class="t">'+pc.title+' · resolved</div>'+out+'</div>'+String(a.innerHTML);
  EV_CHOICE=false;
  if(EV_OPEN){ evShow('<div class="evt">'+pc.title+' · resolved</div>'+
    '<div style="margin:12px 0;line-height:1.6">'+out+'</div>'+
    '<div style="text-align:right"><button class="primary" onclick="evNext()">Continue</button></div>'); }
  save(); renderAll();
}
function dropChoice(){
  if(!G||!G.pendingChoice)return;
  logEntry('You let it pass: '+G.pendingChoice.title.toLowerCase()+' (roll '+G.pendingChoice.roll+').','muted');
  G.pendingChoice=null;
  EVQ=EVQ.filter(e=>!e.choice);
}

/* --- choice outcome handlers (each returns the resolution text) --- */
const CHOICES={
 dine(k,d){ if(k!=='yes')return 'Ship rations again. The crew sighs.';
   pay(d.cost,'incidentals','A fine dinner ashore');
   if(_2d6()+crewSkill('Carouse','Steward')>=9){ G.contacts.push(genContact()); return 'A glorious evening — and the owner turns out to be wonderfully connected (contact gained).'; }
   return 'A glorious evening. Money well spent, probably.'; },
 restrict(k){ if(k!=='sneak'){ advanceTime(1); return 'You wait for the restriction to lift — a day lost.'; }
   const c=skillCheck(8,'Streetwise');
   if(c.ok)return 'You slip through the cordon without breaking stride.'+c.txt;
   advanceTime(2); return 'Caught at a checkpoint and sent the long way round — 2 days lost.'+c.txt; },
 rival(k,d){ const m=G.market[d.idx];
   if(!m||m.name!==d.name)return 'The lot is already gone.';
   if(k==='outbid'){ m.ppt=Math.round(m.ppt*1.1); return 'You secure first refusal at a premium — '+m.name+' now '+cr(m.ppt)+'/t.'; }
   m.tons=Math.max(0,Math.floor(m.tons/2)); return 'The rival takes half the lot — '+m.tons+'t of '+m.name+' remain.'; },
 posh(k){ if(k!=='go')return 'You send polite regrets and have an early night.';
   advanceTime(1); const c=skillCheck(8,'Carouse','Steward');
   if(c.ok){ G.contacts.push(genContact()); G.mods.nextTradeDM+=1; return 'You charm the room — a new contact, and introductions that will help your next sale (+1).'+c.txt; }
   return 'Stiff collars and small talk; nothing comes of it.'+c.txt; },
 ruins(k){ if(k!=='go')return 'You leave the ruins to the archaeologists.';
   advanceTime(1); const x=d6();
   if(x===6){ const v=500*_2d6(); gain(v,'Sold a curio found in the ruins'); return 'Among the rubble: a saleable curio, worth '+cr(v)+'.'; }
   if(x===1){ const b=100*d6(); pay(b,'incidentals','Injury exploring the ruins'); return 'A floor gives way — '+cr(b)+' in medical bills.'; }
   return 'Atmospheric, but picked clean long ago.'; },
 derelict(k){ if(k!=='go')return 'Some questions are better left unasked.';
   advanceTime(1); const c=skillCheck(9,'Engineer','Mechanic');
   if(c.ok){ const v=500*d6(); gain(v,'Salvaged parts from an abandoned spacecraft'); return 'Long abandoned — you strip parts worth '+cr(v)+'.'+c.txt; }
   if(c.roll<=5){ advanceTime(1); return 'Armed squatters suggest you leave. The long way back costs another day.'+c.txt; }
   return 'Sealed tight and not worth forcing.'+c.txt; },
 suspect(k,d){ const m=G.market[d.idx];
   if(!m||m.name!==d.name)return 'The deal evaporates on its own.';
   if(k==='walk'){ G.market.splice(d.idx,1); return 'You walk away; the lot is withdrawn.'; }
   if(d6()<=2){ const dep=200*d6(); pay(dep,'incidentals','Deposit lost to a trade scam'); G.market.splice(d.idx,1);
     return 'A scam — the “seller” vanishes with your '+cr(dep)+' deposit.'; }
   m.ppt=Math.round(m.ppt*0.9); return 'Legitimate after all — and your scepticism knocks 10% more off: '+cr(m.ppt)+'/t.'; },
 sellerTrouble(k){ if(k!=='help'){ const t=tradeLots(); if(t.length){ const m=G.market.splice(t[0],1)[0]; return 'You steer clear; the '+m.name+' is impounded as evidence.'; } return 'You steer well clear.'; }
   const c=skillCheck(8,'Admin','Persuade');
   if(c.ok){ const i=bestDealIdx(); if(i>=0){ const m=G.market[i]; m.ppt=Math.round(m.ppt*0.85); return 'You untangle the case; the grateful seller discounts the '+m.name+' to '+cr(m.ppt)+'/t.'+c.txt; } return 'Sorted — and the seller owes you one.'+c.txt; }
   const f=500*d6(); pay(f,'incidentals','Dragged into a seller’s legal mess'); return 'You are named as a witness; lawyers cost '+cr(f)+'.'+c.txt; },
 retreat(k){ if(k!=='rest')return 'Credits don’t earn themselves. Back to work.';
   advanceTime(2); G.mods.nextTradeDM+=1; return 'Two days of quiet. You return sharp (+1 on your next sale).'; },
 courier(k,d){ if(k!=='yes')return 'You decline; the patron shrugs and moves on.';
   G.courier={pay:d.pay}; return 'A sealed case goes in the locker. '+cr(d.pay)+' on delivery at your next port of call.'; },
 secret(k){ if(k!=='use')return 'You file it under “interesting” and move on.';
   const c=skillCheck(8,'Streetwise','Persuade');
   if(c.ok){ const v=10000*d6(); gain(v,'Profited from a well-placed secret'); return 'Quiet calls, quick trades: +'+cr(v)+'.'+c.txt; }
   const f=1000*d6(); pay(f,'fines','Caught trading on a secret'); advanceTime(3); return 'It blows up in your face — '+cr(f)+' in fines and 3 days of questioning.'+c.txt; },
 forged(k){ if(k!=='go')return 'You stay near the port, papers genuine.';
   if(d6()<=2){ advanceTime(1); return 'The forgery fails at the first checkpoint — escorted back to the port, a day lost.'; }
   G.mods.buyDM+=1; regenMarket(); return 'The inland dealers are glad of an off-world buyer — market re-rolled at +1.'; },
 dayjob(k){ if(k==='job'){ advanceTime(1); gain(250,'A day’s casual labour'); return 'An honest day, an honest '+cr(250)+'.'; }
   if(k==='favour'){ G.contacts.push(genContact()); return 'You take the favour — a name worth knowing (contact gained).'; }
   return 'You pass; the work goes to someone hungrier.'; },
 crisis(k,d){ if(k!=='sell')return 'You hold your cargo. The relief agents look elsewhere.';
   const i=G.hold.findIndex(h=>h.name===d.name); if(i<0)return 'That cargo is no longer aboard.';
   const h=G.hold[i], w=here(), g=ALLGOODS[h.id]||{pDM:{},rDM:{}};
   const result=_2d6()+SHIPS[G.ship].broker+maxDM(g.rDM,w.codes)-maxDM(g.pDM,w.codes);
   const ppt=Math.round(h.base*priceMult(result,true))*3;
   const revenue=ppt*h.tons, basis=h.ppt*h.tons;
   G.credits+=revenue; book('sales',revenue); book('cogs',-basis); G.hold.splice(i,1);
   logEntry('Crisis sale: '+h.tons+'t '+h.name+' @ '+cr(ppt)+'/t (3×) = '+cr(revenue),'money',revenue);
   return 'The relief effort pays triple: '+cr(revenue)+' for '+h.tons+'t of '+h.name+'.'; },
 invest(k){ const stake={s2:2000,s5:5000,s10:10000}[k]; if(!stake)return 'You keep your credits in your pocket.';
   if(G.credits<stake)return 'You can’t cover that stake right now.';
   const c=skillCheck(8,'Broker','Carouse');
   if(c.ok){ const v=Math.round(stake/2); gain(v,'Local investment pays off'); return 'The venture pays out half again: +'+cr(v)+'.'+c.txt; }
   pay(stake,'incidentals','Local investment goes bust'); return 'The venture folds; your '+cr(stake)+' goes with it.'+c.txt; },
 adventure(k){ if(k!=='go')return 'You are a trader, not a hero. Probably wise.';
   advanceTime(7); const c=skillCheck(8,'Tactics','Leadership');
   if(c.ok){ const v=5000*d6(); gain(v,'A risky adventure pays off'); return 'A week of danger, well rewarded: +'+cr(v)+'.'+c.txt; }
   const b=500*d6(); pay(b,'incidentals','Adventure gone wrong — medical bills'); advanceTime(3); return 'It goes wrong — '+cr(b)+' in medical bills and 3 extra days recovering.'+c.txt; },
 job3(k,d){ if(k!=='yes')return 'You decline; time is money.';
   advanceTime(3); gain(d.pay,'Three days’ contract work'); return 'Three days of work for '+cr(d.pay)+'.'; },
 smuggle(k,d){ if(k!=='yes'){ if(d6()<=2)return 'You refuse. The smuggler’s smile doesn’t reach his eyes — you may have made an enemy.';
     return 'You refuse, and that is that.'; }
   G.smuggleJob={pay:d.pay}; return 'A plain case goes aboard. '+cr(d.pay)+' waits at the next port — if customs don’t find it first.'; },
 legal(k){ if(k==='bribe'){ pay(2000,'fines','Made legal trouble disappear'); return 'A discreet payment and the matter evaporates ('+cr(2000)+').'; }
   const c=skillCheck(8,'Admin');
   if(c.ok)return 'Your case is thrown out with apologies.'+c.txt;
   advanceTime(7); return 'The court takes its time — a week lost to hearings.'+c.txt; },
 bother(k){ if(k!=='help')return 'You wish them luck and keep walking.';
   advanceTime(1);
   if(_2d6()>=7){ if(d6()<=3){ const v=250*d6(); gain(v,'Helped an off-worlder out of a jam'); return 'A day’s trouble, gratefully paid: +'+cr(v)+'.'; }
     G.contacts.push(genContact()); return 'No payment, but a firm handshake and a name worth keeping (contact gained).'; }
   const b=100*d6(); pay(b,'incidentals','An off-worlder’s troubles became yours'); return 'Their bother becomes your bother: '+cr(b)+' and a wasted day.'; },
 shutdown(k){ if(k==='grease'){ pay(1500,'incidentals','Expedited port clearance'); advanceTime(2); return 'The right palms, greased: you are moving again in 2 days.'; }
   advanceTime(7); return 'The port reopens after a full week.'; },
 wrongplace(k){ if(k==='bribe'){ pay(500,'incidentals','Bribed the cargo handlers'); return 'Your pallets materialise within the hour.'; }
   const c=skillCheck(8,'Admin');
   if(c.ok)return 'A correctly filed Form 77-C works miracles.'+c.txt;
   advanceTime(2); return 'The paperwork goes in circles — 2 days lost.'+c.txt; },
 crewtrouble(k,d){ if(k==='pay'){ pay(d.cost,'incidentals','Bailed the crew out of trouble'); return 'Settled quietly for '+cr(d.cost)+'. No one mentions it again.'; }
   advanceTime(2); return 'It runs its course — 2 days of awkwardness.'; },
 customs(k,d){ if(k==='duty'){ pay(d.duty,'fines','Customs duty (1%)'); return 'You pay the 1% duty: '+cr(d.duty)+'.'; }
   if(k==='wait'){ advanceTime(7); return 'Your cargo sits in bond for a week.'; }
   const c=skillCheck(10,'Admin');
   if(c.ok)return 'Subsection 12(b): exempt. The customs officer is furious.'+c.txt;
   pay(d.duty,'fines','Customs duty (after failed appeal)'); advanceTime(2); return 'No loophole — duty of '+cr(d.duty)+' plus 2 days of arguing.'+c.txt; },
 helpcontact(k,d){ const ct=G.contacts[d.ci];
   if(k!=='help'){ if(ct){ G.contacts.splice(d.ci,1); return 'You turn '+ct.name+' away. They won’t ask again (contact lost).'; } return 'They’ve already found help elsewhere.'; }
   advanceTime(1); const b=100*d6(); pay(b,'incidentals','Helping out '+(ct?ct.name:'a contact'));
   G.mods.buyDM+=1; return 'A day and '+cr(b)+' later, it’s sorted'+(ct?' — '+ct.name+' repays you with a dealer tip (+1 next market search).':'.'); },
 miners(k){ if(k!=='join')return 'You keep your head down; the brawls find other targets.';
   const c=skillCheck(8,'Carouse','Steward');
   if(c.ok){ G.contacts.push(genContact()); G.mods.buyDM+=1; return 'A loud, excellent night — a new contact and a tip about a dealer (+1 next market search).'+c.txt; }
   pay(200,'incidentals','A rough night with the miners'); advanceTime(1); return 'You remember little; you are short '+cr(200)+' and a day.'+c.txt; },
 celeb(k){ if(k!=='go')return 'You admire the entourage from a distance.';
   const c=skillCheck(8,'Carouse','Persuade','Steward');
   if(c.ok){ G.contacts.push(genContact()); G.mods.nextTradeDM+=1; return 'You make an impression — a well-placed contact, and doors open (+1 next sale).'+c.txt; }
   return 'A bodyguard’s palm meets your chest. The moment passes.'+c.txt; },
 auction(k,d){ if(k==='pass')return 'The hammer falls for someone else.';
   const frac={hi:0.75,mid:0.5,lo:0.25}[k], dm={hi:-1,mid:-2,lo:-4}[k];
   const g=ALLGOODS[d.gid];
   const roll=_2d6()+(SHIPS[G.ship].broker||0)+dm;
   const nm=d.vname||goodVariant(d.gid);
   if(roll>=8){ const ppt=Math.round(g.base*frac);
     G.market.push({id:g.id,name:nm,cat:g.name,base:g.base,illegal:false,tons:d.tons,ppt,mult:frac});
     return 'Yours! '+d.tons+'t of '+nm+' added to the market at '+cr(ppt)+'/t. <span class="muted">[bid roll '+roll+' vs 8]</span>'; }
   return 'Outbid — the lot goes to a rival shipper. <span class="muted">[bid roll '+roll+' vs 8]</span>'; },
 fugitive(k,d){ if(k!=='yes')return 'You want no part of whatever is chasing them.';
   G.passenger={pay:d.pay,hot:d.hot}; return 'They come aboard with one small bag and many backward glances. '+cr(d.pay)+' on arrival.'; },
 military(k,d){ if(k!=='sell')return 'The quartermaster shrugs and moves down the line.';
   const i=G.hold.findIndex(h=>h.name===d.name); if(i<0)return 'That cargo is no longer aboard.';
   const h=G.hold[i]; const ppt=Math.round(h.base*1.5); const revenue=ppt*h.tons, basis=h.ppt*h.tons;
   G.credits+=revenue; book('sales',revenue); book('cogs',-basis); G.hold.splice(i,1);
   logEntry('Military sale: '+h.tons+'t '+h.name+' @ '+cr(ppt)+'/t = '+cr(revenue),'money',revenue);
   return 'The quartermaster pays 150% of base, no questions asked: '+cr(revenue)+'.'; },
 pirates(k,d){ const take=()=>{ const i=G.hold.findIndex(h=>h.name===d.name);
     if(i>=0){ const h=G.hold[i]; book('spoilage',-h.ppt*h.tons); G.hold.splice(i,1);
       logEntry('Pirates seized '+h.tons+'t of '+h.name+'.','muted'); return h.tons+'t of '+h.name; }
     pay(d.cash,'incidentals','Pirate tribute'); return cr(d.cash); };
   if(k==='comply'){ const got=take(); return 'You stand down. They take '+got+' and let you go. It stings.'; }
   const c=skillCheck(8,'Tactics','Gunner');
   if(c.ok)return 'Your crew sends them running!'+c.txt;
   const got=take(); const rep=500*d6(); pay(rep,'incidentals','Hull repairs after pirate skirmish');
   return 'The fight goes badly — they take '+got+', and repairs cost '+cr(rep)+'.'+c.txt; },
 gamble(k){ if(k==='join'){ if(G.credits<500)return 'You can’t cover the stake.';
     if(_2d6()+crewSkill('Carouse','Streetwise')>=8){ const v=500*d6(); gain(v,'Won at the card table'); return 'You read him like a manifest: +'+cr(v)+'.'; }
     pay(500,'incidentals','Lost at the card table'); return 'He was better. '+cr(500)+' gone.'; }
   if(k==='shut'){ const c=skillCheck(8,'Leadership');
     if(c.ok)return 'The captain bans gambling for the rest of the trip. Grumbling, but order holds.'+c.txt;
     G.mods.nextTradeDM-=1; return 'The ban is ignored and resented (−1 next sale).'+c.txt; }
   if(d6()<=2){ G.mods.nextTradeDM-=1; return 'Half the crew arrives broke and bitter (−1 next sale).'; }
   return 'The crew’s losses are theirs to rue. You stay out of it.'; },
};

/* --- World Encounters: rolled when searching away from the port --- */
function rollWorldEncounter(force){
  const r=force||d66(), t=WORLD_ENC[r]; if(!t)return;
  const w=here(); let mech='';
  switch(r){
    case 11:{ if(_2d6()>w.u.law){ const c=200*d6(); pay(c,'incidentals','Petty crime — pocket picked'); mech=' You lose '+cr(c)+'.'; }
      else mech=' Strict local law keeps you safe.'; break; }
    case 12: offerChoice('dine','World Encounter',r,t+' The crew eye the menu hopefully.',{cost:250},
      [{k:'yes',label:'Dine out (−Cr250)'},{k:'no',label:'Ship rations tonight'}]); return;
    case 13: advanceTime(1); mech=' Grounded transports cost you a day.'; break;
    case 14: G.mods.buyDM-=1; regenMarket(); mech=' Dealers hedge while the agents circle — prices re-quoted at a disadvantage (market re-rolled at −1).'; break;
    case 15: offerChoice('restrict','World Encounter',r,t,{},
      [{k:'sneak',label:'Slip through (Streetwise 8+)'},{k:'wait',label:'Wait it out (1 day)'}]); return;
    case 16:{ const i=bestDealIdx(); if(i<0){ mech=' Fortunately there is nothing here worth fighting over.'; break; }
      offerChoice('rival','World Encounter',r,t+' They are circling the '+G.market[i].name+'.',{idx:i,name:G.market[i].name},
      [{k:'outbid',label:'Outbid them (+10% on that lot)'},{k:'letgo',label:'Let them have first pick'}]); return; }
    case 21: offerChoice('posh','World Encounter',r,t,{},
      [{k:'go',label:'Attend (1 day)'},{k:'no',label:'Send regrets'}]); return;
    case 22: offerChoice('ruins','World Encounter',r,t,{},
      [{k:'go',label:'Explore (1 day)'},{k:'no',label:'Leave it be'}]); return;
    case 23: offerChoice('derelict','World Encounter',r,t,{},
      [{k:'go',label:'Investigate (1 day)'},{k:'no',label:'Not your business'}]); return;
    case 24:{ const c=skillCheck(6,'Tactics','Streetwise');
      if(c.ok)mech=' Your crew keeps its distance — no harm done.'+c.txt;
      else { let b=100*d6(); const med=crewSkill('Medic')>0; if(med)b=Math.round(b/2);
        pay(b,'incidentals','Wildlife encounter — medical bills'); mech=' It bites. Medical bills: '+cr(b)+(med?' (your medic patched the worst).':'.'); }
      break; }
    case 25:{ const i=bestDealIdx(); if(i<0||G.market[i].mult>=1){ mech=' On reflection, no deal here looks tempting enough to worry about.'; break; }
      offerChoice('suspect','World Encounter',r,t+' The deal in question: '+G.market[i].name+' at '+cr(G.market[i].ppt)+'/t.',{idx:i,name:G.market[i].name},
      [{k:'risk',label:'Press ahead with the deal'},{k:'walk',label:'Walk away (lot withdrawn)'}]); return; }
    case 26:{ advanceTime(1); if(d6()>=5){ G.contacts.push(genContact()); mech=' A day lost to festivities — but you make a friend (contact gained).'; }
      else mech=' A colourful day lost to parades and closed offices.'; break; }
    case 31: offerChoice('sellerTrouble','World Encounter',r,t,{},
      [{k:'help',label:'Help untangle it (Admin/Persuade 8+)'},{k:'steer',label:'Steer well clear'}]); return;
    case 32:{ if(d6()<=3)mech=' Smiles everywhere, eyes cold — you keep one hand on your credit chit.';
      else { G.mods.nextContactDM+=1; mech=' Genuinely welcoming — word of a friendly trader gets around (+1 next contact search).'; } break; }
    case 33: offerChoice('retreat','World Encounter',r,t,{},
      [{k:'rest',label:'Take 2 days R&R (+1 next sale)'},{k:'no',label:'No time for holidays'}]); return;
    case 34:{ if(_2d6()<=w.u.law)mech=' Your papers pass without comment.';
      else if(hasIllegal()){ const lost=confiscateIllegal(); const f=1000*d6(); pay(f,'fines','Contraband found in security check');
        mech=' A full search turns up your contraband — '+lost+' confiscated, fined '+cr(f)+'.'; }
      else { advanceTime(1); mech=' A full search finds nothing, but eats a day.'; } break; }
    case 35:{ const p=1500+500*d6(); offerChoice('courier','World Encounter',r,t+' Payment: '+cr(p)+' on delivery.',{pay:p},
      [{k:'yes',label:'Accept the package'},{k:'no',label:'Decline politely'}]); return; }
    case 36:{ const dly=R(2); advanceTime(dly); mech=' '+dly+' day'+(dly>1?'s':'')+' lost to cancelled shuttles.'; break; }
    case 41:{ G.market=G.market.filter(m=>m.id>=100).concat(G.market.filter(m=>m.id<100).slice(0,1));
      mech=' Most dealers have nothing — the market thins out.'; break; }
    case 42:{ const i=pickTradeLot(); if(i<0){ mech=' But no special lots are on offer today.'; break; }
      const m=G.market[i]; m.ppt=Math.round(m.ppt*0.7); if(d6()<=2)m.hot=true;
      mech=' '+m.name+' is going for a song — now '+cr(m.ppt)+'/t. Why indeed.'; break; }
    case 43:{ const c=skillCheck(8,'Streetwise','Tactics');
      if(c.ok)mech=' You face them down and they melt away.'+c.txt;
      else { const b=100*d6(); pay(b,'incidentals','Roughed up by locals — medical'); advanceTime(1); mech=' It gets ugly — '+cr(b)+' in bruises and a day licking wounds.'+c.txt; } break; }
    case 44: offerChoice('secret','World Encounter',r,t,{},
      [{k:'use',label:'Profit from it (Streetwise/Persuade 8+)'},{k:'no',label:'Forget you heard it'}]); return;
    case 45: offerChoice('forged','World Encounter',r,t,{},
      [{k:'go',label:'Travel inland on forged papers'},{k:'no',label:'Stay near the port'}]); return;
    case 46: offerChoice('dayjob','World Encounter',r,t,{},
      [{k:'job',label:'Take the job (1 day, +Cr250)'},{k:'favour',label:'Ask a favour instead (contact)'},{k:'no',label:'Pass'}]); return;
    case 51: G.mods.buyDM+=1; mech=' Their tip should pay off — +1 on your next market search.'; break;
    case 52:{ if(!G.hold.length){ mech=' Sadly your hold is empty — nothing to offer the relief effort.'; break; }
      const h=G.hold[R(G.hold.length)-1];
      offerChoice('crisis','World Encounter',r,t+' Relief agents want your '+h.name+' — at triple the going rate.',{name:h.name},
      [{k:'sell',label:'Sell '+h.tons+'t '+h.name+' at 3×'},{k:'no',label:'Hold onto it'}]); return; }
    case 53: offerChoice('invest','World Encounter',r,t+' (Broker check 8+: succeed and gain half again, fail and lose the stake.)',{},
      [{k:'s2',label:'Stake Cr2,000'},{k:'s5',label:'Stake Cr5,000'},{k:'s10',label:'Stake Cr10,000'},{k:'no',label:'Keep your money'}]); return;
    case 54:{ const i=pickTradeLot(); if(i<0){ mech=' Alas, nothing of the maker’s is on the market this week.'; break; }
      G.market[i].quality=true; mech=' The '+G.market[i].name+' here is top quality — it will sell at +1 wherever you take it.'; break; }
    case 55: offerChoice('adventure','World Encounter',r,t,{},
      [{k:'go',label:'Take the job (1 week, risky)'},{k:'no',label:'You are a trader, not a hero'}]); return;
    case 56:{ const c=100*d6(); pay(c,'incidentals','A memorable night out'); G.contacts.push(genContact());
      mech=' '+cr(c)+' lighter, one friend richer (contact gained).'; break; }
    case 61:{ const p=600+100*d6(); offerChoice('job3','World Encounter',r,t,{pay:p},
      [{k:'yes',label:'Take it (3 days, +'+cr(p)+')'},{k:'no',label:'Decline'}]); return; }
    case 62:{ const med=crewSkill('Medic')>0;
      if(d6()<=3){ if(med)mech=' A bizarre local bug — your medic shrugs and cures it for free.';
        else { pay(600,'incidentals','Local disease — doctor’s fees'); mech=' A bizarre local bug; the doctor charges '+cr(600)+'.'; } }
      else { const days=med?1:R(3); advanceTime(days); mech=' Bedridden for '+days+' day'+(days>1?'s':'')+(med?' — your medic speeds the recovery.':'.'); }
      break; }
    case 63:{ const p=1000*_2d6(); offerChoice('smuggle','World Encounter',r,t+' Payment: '+cr(p)+' on delivery, no questions.',{pay:p},
      [{k:'yes',label:'Take the package'},{k:'no',label:'Refuse'}]); return; }
    case 64: G.mods.extraLots+=3; regenMarket(); mech=' Every dealer has extra stock — the market brims with goods.'; break;
    case 65: offerChoice('legal','World Encounter',r,t,{},
      [{k:'court',label:'Fight it (Admin 8+; lose = 1 week)'},{k:'bribe',label:'Make it go away (−Cr2,000)'}]); return;
    case 66: offerChoice('bother','World Encounter',r,t,{},
      [{k:'help',label:'Help them out (1 day)'},{k:'no',label:'Wish them luck'}]); return;
  }
  showEvent('World Encounter',r,t+mech);
}

/* --- Port Events: "Walk the Port" --- */
function doPortEvent(force){
  dropChoice();
  advanceTime(1);
  const r=force||d66();
  const t = r>=51 ? 'No encounter of any significance at the port this week.' : PORT_ENC[r];
  let mech='';
  switch(r){
    case 11: offerChoice('shutdown','Port Event',r,t,{},
      [{k:'wait',label:'Wait it out (1 week)'},{k:'grease',label:'Grease palms (−Cr1,500, 2 days)'}]); return;
    case 12:{ if(!G.hold.length){ mech=' With an empty hold, it’s someone else’s problem.'; break; }
      offerChoice('wrongplace','Port Event',r,t,{},
      [{k:'bribe',label:'Bribe the handlers (−Cr500)'},{k:'admin',label:'Work the paperwork (Admin 8+)'}]); return; }
    case 13:{ const c=250*d6(); offerChoice('crewtrouble','Port Event',r,t,{cost:c},
      [{k:'pay',label:'Pay to make it go away (−'+cr(c)+')'},{k:'wait',label:'Let it run its course (2 days)'}]); return; }
    case 14:{ if(d6()>=5){ mech=' Your cargo clears customs without a hitch.'; break; }
      if(!G.hold.length){ advanceTime(1); mech=' Nothing to declare — still a day of forms.'; break; }
      const duty=Math.max(100,Math.round(inventoryValue()*0.01));
      offerChoice('customs','Port Event',r,t,{duty},
      [{k:'duty',label:'Pay the duty (−'+cr(duty)+')'},{k:'loop',label:'Hunt a loophole (Admin 10+)'},{k:'wait',label:'Wait out the delay (1 week)'}]); return; }
    case 15:{ const c=skillCheck(8,'Admin','Streetwise');
      if(c.ok)mech=' Your paperwork is smoothed over.'+c.txt;
      else { const b=100*d6(); pay(b,'incidentals','Red tape — filing fees'); advanceTime(1); mech=' Fees and a wasted day: '+cr(b)+'.'+c.txt; } break; }
    case 16:{ if(hasIllegal()){ const lost=confiscateIllegal(); const f=1000*d6(); pay(f,'fines','Contraband found in port security search');
        mech=' The search finds your contraband — '+lost+' seized, fined '+cr(f)+'.'; }
      else if(d6()===6){ advanceTime(1); mech=' Some confusion over a crate costs you a day in detention.'; }
      else mech=' Thorough, humourless, and ultimately satisfied.'; break; }
    case 21:{ if(_2d6()+crewSkill('Carouse','Steward')>=8){ G.contacts.push(genContact()); mech=' You hit it off (contact gained).'; }
      else mech=' Pleasant, but it goes nowhere.'; break; }
    case 22: case 32:{ if(!G.contacts.length){ mech=' …but you have no contacts here. Awkward.'; break; }
      const ci=R(G.contacts.length)-1;
      offerChoice('helpcontact','Port Event',r,t+' It’s '+G.contacts[ci].name+', the '+G.contacts[ci].role+'.',{ci},
      [{k:'help',label:'Help them (1 day, some expense)'},{k:'no',label:'Turn them away (lose contact)'}]); return; }
    case 23: mech=G.hold.length?damageCargo(d6()*0.1,'Port pilferage'):' Luckily your hold was empty.'; break;
    case 24: offerChoice('miners','Port Event',r,t,{},
      [{k:'join',label:'Drink with them (Carouse 8+)'},{k:'no',label:'Keep your head down'}]); return;
    case 25: offerChoice('celeb','Port Event',r,t,{},
      [{k:'go',label:'Make an introduction (Carouse/Persuade 8+)'},{k:'no',label:'Admire from afar'}]); return;
    case 26:{ if(d6()<=3){ const g=100*d6(); gain(g,'Mistaken identity — someone else’s tab'); mech=' Whoever they think you are, their account settles your fees: +'+cr(g)+'.'; }
      else { advanceTime(1); mech=' Whoever they think you are, he’s wanted for questioning. A day lost proving otherwise.'; } break; }
    case 31:{ if(crewSkill('Engineer','Mechanic')){ const g=300*d6(); gain(g,'Repair work on the damaged ship'); mech=' Your engineer pitches in for pay: +'+cr(g)+'.'; }
      else mech=' You watch the rescue crews work. Sobering.'; break; }
    case 33: G.mods.nextContactDM+=2; mech=' A perfect spot for meeting people (+2 on your next contact search).'; break;
    case 34:{ if(d6()>=5){ G.mods.buyDM+=1; mech=' One rumour proves useful — a dealer tip (+1 next market search).'; }
      else mech=' The rumours multiply; the truth never lands.'; break; }
    case 35:{ const pool=Object.values(TRADE).filter(g=>!g.illegal); const g=pool[R(pool.length)-1]; const tons=rollTons(g.tons);
      const vname=goodVariant(g.id);
      offerChoice('auction','Port Event',r,t+' On the block: '+tons+'t of '+vname+' ('+g.name+', base '+cr(g.base)+'/t).',{gid:g.id,tons,vname},
      [{k:'hi',label:'Bid 75% of base'},{k:'mid',label:'Bid 50% of base'},{k:'lo',label:'Bid 25% of base'},{k:'pass',label:'Pass'}]); return; }
    case 36:{ if(d6()>=5){ const nm=addSeizedLot(0.6,false); mech=' Their cargo of '+nm+' is dumped on the market cheap.'; }
      else mech=' You make a note to keep your own manifests immaculate.'; break; }
    case 41:{ const p=1000+1000*d6(); offerChoice('fugitive','Port Event',r,t+' They offer '+cr(p)+' for a quiet ride out.',{pay:p,hot:d6()<=2},
      [{k:'yes',label:'Take them aboard'},{k:'no',label:'Too risky'}]); return; }
    case 42:{ const g=100*d6(); gain(g,'Helped a port employee with a small problem'); mech=' An hour’s work for '+cr(g)+'.'; break; }
    case 43:{ if(d6()<=2){ advanceTime(1); mech=' The third alarm triggers a full evacuation — a day lost.'; } else mech=' Everyone is jumpy; nothing burns.'; break; }
    case 44:{ const p=1000*_2d6(); offerChoice('smuggle','Port Event',r,t+' Payment: '+cr(p)+' on delivery, no questions.',{pay:p},
      [{k:'yes',label:'Take the package'},{k:'no',label:'Refuse'}]); return; }
    case 45:{ const nm=addSeizedLot(0.5,d6()===1); mech=' Seized '+nm+' hits the market at half price. (Do the original owners want it back?)'; break; }
    case 46:{ const wi=G.hold.findIndex(h=>h.id===64||h.id===65);
      if(wi>=0){ const h=G.hold[wi]; offerChoice('military','Port Event',r,t+' A quartermaster eyes your '+h.name+'.',{name:h.name},
        [{k:'sell',label:'Sell '+h.tons+'t '+h.name+' at 150% base'},{k:'no',label:'Not for sale'}]); return; }
      advanceTime(1); mech=' Checkpoints and queues cost you a day.'; break; }
  }
  showEvent('Port Event',r,t+mech);
  save(); renderAll();
}

/* --- Jump Events: rolled in transit; crew skills do the heavy lifting --- */
function rollJumpEvent(force){
  const r=force||d66(), t=JUMP_ENC[r];
  let mech='';
  switch(r){
    case 11:{ let name='',cash=2000*d6();
      if(G.hold.length){ let bi=0,bv=-1; G.hold.forEach((h,i)=>{ const v=h.ppt*h.tons; if(v>bv){bv=v;bi=i;} }); name=G.hold[bi].name; }
      logEntry('In jump: '+t,'muted');
      offerChoice('pirates','Jump Event',r,t+' A corsair matches your vector and demands tribute.',{name,cash},
      [{k:'resist',label:'Fight them off (Tactics/Gunner 8+)'},{k:'comply',label:'Hand over what they ask'}]); return; }
    case 12:{ const c=skillCheck(8,'Leadership'); if(c.ok)mech=' The captain talks it out.'+c.txt;
      else { G.mods.nextTradeDM-=1; mech=' Feelings fester — the crew will be off their game (−1 next sale).'+c.txt; } break; }
    case 13:{ const c=skillCheck(8,'Admin','Streetwise','Leadership');
      if(c.ok){ G.mods.nextContactDM+=1; mech=' Handled with quiet competence — word gets around (+1 next contact search).'+c.txt; }
      else mech=' It sorts itself out, eventually.'+c.txt; break; }
    case 14:{ let b=200*d6(); if(crewSkill('Engineer')>=2)b=Math.round(b/2); pay(b,'incidentals','Shipboard accident — spare parts'); mech=' Repairs cost '+cr(b)+'.'; break; }
    case 15:{ if(G.hold.length){ let frac=0.05*d6(); if(crewSkill('Engineer'))frac/=2; mech=damageCargo(frac,'Electrical fire in the cargo bay')||' The fire is out before it spreads.'; }
      else { const b=100*d6(); pay(b,'incidentals','Electrical fire — rewiring'); mech=' Rewiring costs '+cr(b)+'.'; } break; }
    case 16:{ const c=skillCheck(8,'Steward','Carouse');
      if(c.ok){ G.mods.buyDM+=1; mech=' Impeccable service — their friend the port manager will hear of it (+1 next market search).'+c.txt; }
      else { G.mods.buyDM-=1; mech=' They disembark in a huff — expect a frosty reception portside (−1 next market search).'+c.txt; } break; }
    case 21:{ if(hasIllegal()){ const c=skillCheck(8,'Admin','Steward');
        if(c.ok)mech=' Your manifests are a work of art; the inspector suspects nothing.'+c.txt;
        else { const lost=confiscateIllegal(); const f=500*d6(); pay(f,'fines','Government inspector found contraband'); mech=' The inspector finds your contraband — '+lost+' seized, fined '+cr(f)+'.'+c.txt; } }
      else mech=' A clean ship and a dull tour. The inspector leaves satisfied.'; break; }
    case 22:{ const c=skillCheck(8,'Leadership','Medic'); if(c.ok)mech=' A quiet word brings them back around.'+c.txt;
      else { G.mods.nextTradeDM-=1; mech=' Their mistakes pile up (−1 next sale).'+c.txt; } break; }
    case 23:{ let b=100*d6(); if(crewSkill('Engineer','Mechanic'))b=0;
      if(b){ pay(b,'incidentals','Recycler overhaul — parts'); mech=' Parts cost '+cr(b)+'.'; } else mech=' Your engineer handles it with spares on hand.'; break; }
    case 24: G.mods.buyDM+=1; mech=' Their tip should sharpen your first market search there (+1).'; break;
    case 25:{ const b=100*d6(); pay(b,'incidentals','Flooded stateroom — repairs'); mech=' Mop-up and repairs: '+cr(b)+'.'; break; }
    case 26:{ const c=skillCheck(8,'Engineer'); if(c.ok)mech=' Your engineer retunes it mid-flux. Heroic, terrifying work.'+c.txt;
      else { const b=500*d6(); pay(b,'incidentals','Jump-drive damage — emergency retune'); advanceTime(1); mech=' The drive takes damage: '+cr(b)+' and a day late.'+c.txt; } break; }
    case 31:{ const c=skillCheck(8,'Engineer','Mechanic'); if(c.ok)mech=' Re-lashed before anything cracks.'+c.txt;
      else mech=(damageCargo(0.05,'Shifted cargo containers')||' Nothing was aboard to break.')+c.txt; break; }
    case 32:{ const c=skillCheck(8,'Steward','Carouse','Leadership'); if(c.ok)mech=' Your steward finds the one topic that calms him.'+c.txt;
      else { G.mods.nextTradeDM-=1; mech=' The whole ship is frayed by arrival (−1 next sale).'+c.txt; } break; }
    case 33:{ if(d6()<=2){ const b=200*d6(); pay(b,'fuel','Sensor ghost — burned fuel investigating'); mech=' You burn '+cr(b)+' in fuel chasing a ghost.'; }
      else mech=' A recalibration clears it. Probably nothing. Probably.'; break; }
    case 34:{ let rep=500*d6(); if(crewSkill('Engineer'))rep=Math.round(rep/2); pay(rep,'incidentals','Chemical fire — bay repairs');
      mech=(G.hold.length?damageCargo(0.1*R(3),'Chemical fire in the hold'):'')+' Bay repairs: '+cr(rep)+'.'; break; }
    case 35:{ const c=skillCheck(8,'Steward','Leadership');
      if(c.ok){ const g=100*d6(); gain(g,'Grateful passengers tip the crew'); mech=' Peace is brokered; the relieved parties tip '+cr(g)+'.'+c.txt; }
      else { G.mods.nextTradeDM-=1; mech=' The feud poisons the whole trip (−1 next sale).'+c.txt; } break; }
    case 36:{ const c=skillCheck(8,'Streetwise','Investigate'); if(c.ok)mech=' Caught in the corridor and warned off.'+c.txt;
      else { const b=200*d6(); pay(b,'incidentals','Theft aboard — compensation paid'); mech=' Something goes missing; you compensate the victim '+cr(b)+'.'+c.txt; } break; }
    case 41: mech=' Nothing the logbook will remember.'; break;
    case 42:{ let b=300*d6(); if(crewSkill('Engineer'))b=Math.round(b/2); pay(b,'incidentals','Fuel pump replacement'); mech=' Replacement parts: '+cr(b)+'.'; break; }
    case 43:{ const b=200*d6(); pay(b,'incidentals','Power failure — burned fuses'); mech=' Burned components: '+cr(b)+'.'; break; }
    case 44:{ if(!G.contacts.length){ mech=' A garbled tightbeam from an old acquaintance — but you can’t place them.'; break; }
      const ci=R(G.contacts.length)-1;
      logEntry('In jump: '+t,'muted');
      offerChoice('helpcontact','Jump Event',r,t+' It’s '+G.contacts[ci].name+', the '+G.contacts[ci].role+'.',{ci},
      [{k:'help',label:'Help them (1 day, some expense)'},{k:'no',label:'Plead a tight schedule (lose contact)'}]); return; }
    case 45:{ const c=skillCheck(8,'Tactics','Leadership'); if(c.ok)mech=' The weapon is quietly confiscated until landfall.'+c.txt;
      else { G.mods.nextTradeDM-=1; mech=' A tense standoff sours the trip (−1 next sale).'+c.txt; } break; }
    case 46:{ if(crewSkill('Medic'))mech=' Your medic isolates and cures it. Worth every credit of that salary.';
      else { advanceTime(2); mech=' No medic aboard — port quarantine holds you 2 days on arrival.'; } break; }
    case 51:{ const k=d6();
      if(k<=2)mech=' They check your registry and move on.';
      else if(k===3){ if(hasIllegal()){ const c=skillCheck(8,'Streetwise','Admin');
          if(c.ok)mech=' Your manifest games pass inspection.'+c.txt;
          else { const f=1000*d6(); pay(f,'fines','Patrol found manifest irregularities'); mech=' Irregularities found — fined '+cr(f)+'.'+c.txt; } }
        else mech=' Your cargo list checks out.'; }
      else if(k<=5){ if(hasIllegal()){ const lost=confiscateIllegal(); const f=1000*d6(); pay(f,'fines','Patrol boarding — contraband seized');
          mech=' A boarding party finds your contraband — '+lost+' seized, fined '+cr(f)+'.'; }
        else mech=' Boarded, searched, released. Three tense hours.'; }
      else { advanceTime(1); if(hasIllegal()){ const lost=confiscateIllegal(); const f=1000*d6(); pay(f,'fines','Impound inspection — contraband seized');
          mech=' Escorted to port: '+lost+' seized, '+cr(f)+' in fines, a day lost.'; }
        else mech=' Escorted in for a spotless inspection — a day lost.'; } break; }
    case 52:{ if(d6()<=2){ G.mods.nextTradeDM-=1; mech=' It ends badly; the mood aboard curdles (−1 next sale).'; }
      else mech=' Discreet enough, and none of your business.'; break; }
    case 53: logEntry('In jump: '+t,'muted');
      offerChoice('gamble','Jump Event',r,t,{},
      [{k:'join',label:'Join the game (stake Cr500)'},{k:'shut',label:'Shut it down (Leadership 8+)'},{k:'no',label:'Let it ride'}]); return;
    case 54:{ if(_2d6()+crewSkill('Carouse','Steward')>=8){ G.contacts.push(genContact()); mech=' You trade stories all week (contact gained).'; }
      else mech=' Pleasant company, nothing more.'; break; }
    case 55: G.mods.trained=true; mech=' Drills sharpen everyone up (+1 on the next skill check).'; break;
    case 56:{ const c=skillCheck(8,'Investigate','Streetwise');
      if(c.ok){ const g=100*d6(); gain(g,'Recovered stolen property — reward'); mech=' Culprit found, goods returned — a '+cr(g)+' reward.'+c.txt; }
      else { pay(200,'incidentals','Unsolved theft — compensation'); mech=' Never solved; you cover the loss ('+cr(200)+').'+c.txt; } break; }
    case 61:{ if(crewSkill('Medic'))mech=' Your medic has the captain back on his feet in a day.';
      else { const b=200*d6(); pay(b,'incidentals','Emergency medical supplies'); advanceTime(1); mech=' Chaos on the bridge — '+cr(b)+' in supplies and a day lost.'; } break; }
    case 62: advanceTime(1); mech=' All hands lose a day wrestling it into place.'; break;
    case 63:{ const c=skillCheck(8,'Leadership','Medic'); if(c.ok)mech=' Long talks in the galley bring them back.'+c.txt;
      else { G.mods.nextTradeDM-=1; mech=' Their duties slip (−1 next sale).'+c.txt; } break; }
    case 64:{ const c=skillCheck(8,'Leadership'); if(c.ok)mech=' The captain straightens them out.'+c.txt;
      else { const b=100*d6(); pay(b,'incidentals','Refunds to wronged passengers'); mech=' You refund '+cr(b)+' to smooth things over.'+c.txt; } break; }
    case 65:{ if(d6()===6){ const g=100*d6(); gain(g,'Reclusive passenger’s parting tip'); mech=' On arrival they hand over '+cr(g)+' without a word.'; }
      else mech=' They emerge only at landfall, nod once, and vanish.'; break; }
    case 66:{ const c=skillCheck(8,'Investigate','Medic'); if(c.ok)mech=' Your crew cracks it before landfall — a tragic accident, properly documented.'+c.txt;
      else { advanceTime(2); pay(500,'incidentals','Inquest fees'); mech=' Port authorities hold the ship 2 days for an inquest ('+cr(500)+').'+c.txt; } break; }
  }
  showEvent('Jump Event',r,t+mech);
  logEntry('In jump: '+t,'muted');
}

/* --- jobs taken via events pay out (or blow up) on arrival --- */
function resolveArrivalJobs(){
  const w=here();
  if(G.courier){ gain(G.courier.pay,'Courier package delivered'); showEvent('Delivery','—','The sealed case is handed over. Payment: '+cr(G.courier.pay)+'.'); G.courier=null; }
  if(G.smuggleJob){ const c=skillCheck(8,'Streetwise','Persuade');
    if(c.ok){ gain(G.smuggleJob.pay,'Smuggled package delivered'); showEvent('Smuggling','—','The package slips past customs. Payment: '+cr(G.smuggleJob.pay)+'.'+c.txt); }
    else { const f=1000*d6(); pay(f,'fines','Smuggled package intercepted'); showEvent('Smuggling','—','Customs intercept the package — fined '+cr(f)+'.'+c.txt); }
    G.smuggleJob=null; }
  if(G.passenger){
    if(G.passenger.hot&&_2d6()<=w.u.law){ const f=1000*d6(); pay(f,'fines','Harboured a fugitive — fined');
      showEvent('Passenger','—','Port security arrest your passenger on the ramp — and fine you '+cr(f)+' for the company you keep.'); }
    else { gain(G.passenger.pay,'Passenger fare'); showEvent('Passenger','—','Your passenger disembarks quietly and pays '+cr(G.passenger.pay)+'.'); }
    G.passenger=null; }
}
function rollArrivalEncounter(){
  if(d6()<=4)return; // 5,6 = encounter
  const w=here(); const frontier='DEX'.includes(w.u.sp);
  showEvent('Ship Encounter',_2d6(), (frontier?'Frontier route: ':'Major route: ')+
    'Your navigator raises a passing ship on the comm. '+
    (R(6)>4?'They ask about the world you just left.':'They ignore you, but are polite.'));
}

