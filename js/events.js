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

/* ---------- Cast & flavor: named characters with relationship scores ----------
   Every table entry keeps its mechanics; a flavor paragraph is composed from the
   entry's archetype (ARCH) — 8 scene templates per archetype filled with a
   persistent cast of named NPCs, the current world, crew names, goods. Template ×
   name combinations give 20+ unique realizations per entry. Cast members carry a
   relationship score per crew member (−100..100, clamp; drifts with interactions
   and with engage/decline on decisions); ship score = crew average. */
const CAST_FIRST=['Anneke','Brax','Cyrus','Dela','Ekaterin','Fenn','Goro','Hesta','Imre','Jola',
 'Kazimir','Liss','Mirelle','Nkoyo','Orin','Petra','Quint','Rolan','Saskia','Tobin',
 'Ulla','Vasil','Wendel','Xiomara','Yusuf','Zarina','Ardo','Branwen','Castor','Dagny'];
const CAST_SUR=['Mbeki','Tarkalian','Voss','Ironsides','Qureshi','Belmonte','Hax','Okonkwo','Strand','Villalobos',
 'Greel','Ashworth','Nyx','Calloway','Drumlin','Esterhazy','Fonseca','Grieg','Halloway','Ixtab',
 'Jardine','Kessler','Locke','Madrigal','Nightingale','Oduya','Pryce','Quill','Rasmussen','Soto'];
const CAST_ROLES={
 official:['customs adjutant','port warden','imperial clerk','tariff assessor','harbour magistrate','licensing officer','quarantine marshal','dock registrar'],
 merchant:['commodities broker','warehouse factor','freelance trader','guild merchant','auction agent','cargo wholesaler','market fixer','import jobber'],
 underworld:['smuggler','fence','information broker','dock-gang lieutenant','freelance expediter','black-market courier','grey-cargo fixer','quiet financier'],
 social:['minor noble','holovid celebrity','retired diplomat','society host','local magnate','off-world artist','charity patron','university don'],
 dockhand:['cargo-master','rig mechanic','fuel-line chief','crane operator','stevedore boss','yard foreman','belt miner','launch tech'],
 passenger:['commercial envoy','itinerant scholar','missionary','travelling physician','colonial administrator','touring musician','insurance assessor','pilgrim'],
 danger:['corsair captain','protection-gang boss','bounty skip','mercenary sergeant','raider quartermaster','street enforcer','debt collector','pit fighter'],
 drifter:['veteran scout','tramp captain','prospector','wandering engineer','ex-naval rating','frontier guide','salvage hand','retired courier'],
};
const CAST_DET={
 official:['brass service pin','chipped Imperium seal','laminated rulebook','antique chronometer','ribbon of commendations','government-issue stylus','portrait of the Sector Duke','faded customs ledger'],
 social:['reception at the governors villa','harvest festival','rooftop tea garden','officers club','night market','recital hall','observation lounge','founders day parade'],
 dockhand:['mag-crane','fuel bowser','pallet loader','stuttering conveyor','half-stripped thruster','leaking coolant line','tangle of cargo netting','condemned loading arm'],
};
const FLAV={
 official:[
  '{N}, a {R} with a spotless uniform and a {D}, looks your paperwork over twice. {C} mutters that nothing about this port is ever simple.',
  'The {R} assigned to your berth — {N} — recites regulation like scripture. Somewhere behind the counter, a {D} thumps down on a stack of forms.',
  '{N} meets you at the ramp, datapad in hand and a {D} pinned to their lapel. The questions are polite, pointed, and entirely too well-informed.',
  'Word is {N} has held this {R} posting for twenty years and never once smiled. Today is not the exception, and {C} stops joking halfway through.',
  'A courier slips you a note: {N}, the {R} on duty, wants a word before anything moves. Their office smells of ink, dust and a {D}.',
  '{N} initials each page without looking up. When they finally do, it is {C} they study, not the manifest.',
  'The queue crawls. At its head, {N} — {R}, by the braid — weighs every traveller with the same tired, careful eyes.',
  'Every port has its gatekeeper; on {W} it is {N}. The {R} taps a {D} against the desk while deciding precisely how difficult to be.'],
 merchant:[
  '{N}, a {R} working out of a stall that smells of machine oil and incense, beckons you closer. They claim the {G} practically sells itself.',
  'Half the traders on {W} owe {N} a favour, or so the {R} says. The ledger they slide across the table looks suspiciously tidy.',
  '{N} talks fast and pours faster, the local custom before any deal. {C} keeps one eye on the samples and one on the exits.',
  'The {R} introduces themselves as {N}, purveyor of opportunities. Their warehouse holds more {G} than a world like {W} ought to need.',
  'A printed card reads: {N} — {R}, fair rates, no questions. The handshake is firm; the smile has a price built in.',
  '{N} circles the cargo like a gull over a galley. Every flaw is catalogued aloud, every virtue somehow overlooked.',
  'Over lukewarm caf, {N} sketches numbers on a napkin and pushes it across. {C} reads it twice and raises an eyebrow.',
  'They say {N} once sold sand to a desert colony. Watching the {R} work the room on {W}, you believe it.'],
 underworld:[
  '{N} finds you in the low light past the cargo gates, voice pitched under the dock noise. The {R} never quite shows both hands at once.',
  'A whisper network on {W} all points to one name: {N}. The {R} agrees to meet only where the cameras do not.',
  '{N} wears respectable clothes badly, like a costume. {C} recognises the type before a single word is said.',
  'The {R} calling themselves {N} buys the table a round and waits for the bar to thin out. What follows is quiet, quick and deniable.',
  'Everything about {N} is forgettable by design. Only the eyes give the {R} away — they price everything they touch.',
  '{N} speaks in favours, never credits. On {W}, the {R} explains, paper trails have a way of becoming nooses.',
  'You never see where {N} comes from; one moment the {R} is simply there, at your elbow, smiling. {C} nearly jumps out of an airlock.',
  'The {R} known as {N} keeps a list of who owes whom on this world. Tonight, your name enters the margin.'],
 social:[
  '{N} — {R}, and apparently famous on {W} — greets your crew like old friends. The invitation that follows is gilt-edged and impossible to refuse politely.',
  'At the {D}, {N} holds court with effortless charm. The {R} steers the conversation to off-world news, and to you.',
  'Laughter carries across the {D}; at its centre stands {N}. {C} is drawn in before anyone can object.',
  '{N} insists that no visitor to {W} should miss the {D}. The {R} talks the whole way there, and somehow you do not mind.',
  'Introductions are made: {N}, {R}, lately of the capital. Their interest in a tramp-trader crew seems genuine, which is itself suspicious.',
  'The {R} sends a handwritten card to your berth — {N} requests the pleasure. On {W}, you learn, refusing is its own statement.',
  '{N} has the easy warmth of someone who has never carried their own luggage. Still, the {R} listens more than they speak, and remembers everything.',
  'By the second drink {N} is telling stories that should probably stay on {W}. {C} trades one back, only slightly embellished.'],
 dockhand:[
  '{N}, a {R} with grease to the elbows, flags you down between container stacks. The {D} behind them has clearly lost the argument.',
  'The dock crew defers to {N} without being asked. The {R} sizes up your ship the way a farrier sizes up a horse.',
  '{N} talks over the howl of a {D}, all shorthand and hand signals. {C} catches about half of it and nods anyway.',
  'Every port runs on someone like {N}. The {R} knows which cranes stick, which inspectors nap, and which berths flood.',
  'A shift whistle blows and {N} appears at your ramp, thermos in hand. The {R} trades gossip for caf, straight across.',
  '{N} has opinions about your landing gear and shares them freely. Underneath the ribbing, the {R} is already reaching for tools.',
  'Between loads, {N} sketches the layout of the yard on a crate lid. The {R} marks two spots: trouble, and worse.',
  'The {R} called {N} has worked this gantry since before your ship was laid down. Nothing moves on this dock unnoticed.'],
 passenger:[
  'Among the passengers is {N}, travelling as a {R}, whose luggage outweighs its owner. They take meals alone and notice everyone who notices them.',
  '{N} booked passage at the last minute, paying in crisp notes. The {R} asks {C} a few too many questions about the route.',
  'The {R} in cabin two — {N} — keeps the same hours as the night watch. Their door is always just closing as you pass.',
  '{N} is charming at dinner and unreadable after it. {C} cannot decide if the {R} is running from something or toward it.',
  'Halfway through the week {N} finally opens up over cards. The story the {R} tells has a hole in it big enough to fly the ship through.',
  '{N} spends the jump in the lounge, watching the grey nothing outside. Whatever a {R} usually carries, they carry more of it.',
  'The manifest lists {N}, {R}, one bag. The bag hums faintly, and no one has worked up the nerve to ask.',
  'Of all the berths on all the ships, {N} chose yours. The {R} says it was the price; their eyes say otherwise.'],
 danger:[
  'The name {N} surfaces in every warning broadcast this month. When the {R} finally appears, it is exactly as advertised.',
  '{N} does the talking while the muscle stays in shadow. The {R} has the relaxed patience of someone who has done this many times.',
  'There is a bounty sheet somewhere with the face of {N} on it. {C} remembers it half a second too late.',
  'The {R} who steps forward gives the name {N}, daring anyone to react. Every exit suddenly feels further away.',
  '{N} smiles the way a knife catches light. Whatever the {R} wants, the asking is a formality.',
  'Static clears and the voice introduces itself as {N}. The {R} lists your hull number, your cargo, and your options, in that order.',
  'Local toughs answer to {N}, and {N} answers to no one on {W}. The {R} collects what they are owed, real or imagined.',
  'You have heard {N} described as reasonable, for a {R}. You suspect whoever said so was never on the wrong side of the ledger.'],
 drifter:[
  '{N} claims to have crossed the sector twice with nothing but a toolkit and good manners. The {R} has the scars and the stories to match.',
  'In the corner of the lounge sits {N}, nursing the same drink for hours. The {R} knows your next port better than you do.',
  '{N} introduces themselves with a firm handshake and a job in mind. Retired, says the {R}; the posture says otherwise.',
  'The {R} called {N} drifts from table to table, leaving laughter behind. By closing time they are at yours.',
  '{N} carries a battered case they never open and never leave. Ask the {R} about it and the subject changes, smooth as vacuum.',
  'Somewhere between anecdotes, {N} mentions exactly the thing you needed to hear. The {R} watches your reaction with mild, knowing amusement.',
  '{N} has been on {W} nine days and already knows everyone worth knowing. Some people simply travel like that, and the {R} is one of them.',
  'The {R} signs the guest ledger as {N}, no homeworld given. The handwriting is beautiful and the name is almost certainly borrowed.'],
 crew:[
  'It starts, as these things do, over nothing — a tool returned dirty, a watch traded late. By the time it reaches you, {C} and {C2} are not speaking.',
  '{C} swears it was handled by the book. {C2} has a different book, and the galley goes very quiet whenever both are in it.',
  'You find {C} re-reading the same gauge for the third time. Behind the professionalism, something is clearly grinding.',
  'The ship is small and the jump is long. Whatever passed between {C} and {C2} in the hold, it is filling every corridor now.',
  '{C} comes to you first, which says something. The story is reasonable, which says something else.',
  'Half the crew sides with {C}, the other half with {C2}, and the ship runs on the thin civility in between.',
  'It is nothing anyone says aloud; it is the pauses. {C} has stopped humming on watch, and the silence is louder.',
  'A week in jump strips everyone down to habit, and the habits of {C} are wearing grooves in everyone else.'],
 shipboard:[
  '{C} is elbow-deep in the access panel before the alarm finishes sounding. The diagnosis arrives in language unsuitable for the log.',
  'The fault announces itself at 0300 ship time. {C} arrives in boots and underwear, toolkit first.',
  '{C} taps the gauge, frowns, taps it again. Aboard a small ship, that frown travels faster than any klaxon.',
  'It is the smell that gives it away — hot insulation, somewhere aft. {C} and {C2} trade one look and start running.',
  'The checklist exists for exactly this. {C} runs it twice anyway, voice flat, hands steady.',
  '{C2} holds the light while {C} works, and the whole crew finds reasons to pass the corridor. Nobody asks the question out loud.',
  'Spare parts have a way of being the wrong spare parts. {C} improvises, which is either comforting or terrifying, depending on the day.',
  'The ship complains in a new key, and {C} hears it before any sensor does. Old hands and old hulls keep their own counsel.'],
};
// archetype per table entry — mechanics untouched, flavor matched to the scene
const ARCH={
 world:{11:'underworld',12:'social',13:'drifter',14:'official',15:'official',16:'merchant',
  21:'social',22:'drifter',23:'drifter',24:'drifter',25:'merchant',26:'social',
  31:'merchant',32:'social',33:'drifter',34:'official',35:'drifter',36:'dockhand',
  41:'merchant',42:'merchant',43:'danger',44:'underworld',45:'underworld',46:'dockhand',
  51:'social',52:'official',53:'merchant',54:'merchant',55:'drifter',56:'social',
  61:'dockhand',62:'shipboard',63:'underworld',64:'merchant',65:'official',66:'drifter'},
 port:{11:'dockhand',12:'dockhand',13:'crew',14:'official',15:'official',16:'official',
  21:'drifter',22:'social',23:'underworld',24:'dockhand',25:'social',26:'official',
  31:'dockhand',32:'social',33:'social',34:'drifter',35:'merchant',36:'official',
  41:'underworld',42:'dockhand',43:'dockhand',44:'underworld',45:'merchant',46:'official'},
 jump:{11:'danger',12:'crew',13:'passenger',14:'shipboard',15:'shipboard',16:'passenger',
  21:'official',22:'crew',23:'shipboard',24:'passenger',25:'shipboard',26:'shipboard',
  31:'shipboard',32:'passenger',33:'shipboard',34:'shipboard',35:'passenger',36:'passenger',
  41:'shipboard',42:'shipboard',43:'shipboard',44:'drifter',45:'passenger',46:'passenger',
  51:'official',52:'passenger',53:'passenger',54:'passenger',55:'crew',56:'passenger',
  61:'crew',62:'crew',63:'crew',64:'crew',65:'passenger',66:'passenger'},
};
const EV_TBL={'World Encounter':'world','Port Event':'port','Jump Event':'jump'};

function clampRel(v){ return Math.max(-100,Math.min(100,Math.round(v))); }
function meetCast(role,forceNew){
  if(!G.cast)G.cast=[];
  if(!forceNew&&G.cast.length&&d6()<=2){ const ch=G.cast[R(G.cast.length)-1];
    if(typeof augmentCast==='function')augmentCast(ch); return ch; }   // recurring faces
  let nm,guard=0;
  do{ nm=CAST_FIRST[R(CAST_FIRST.length)-1]+' '+CAST_SUR[R(CAST_SUR.length)-1]; guard++; }
  while(guard<60&&(G.cast.some(c=>c.name===nm)||(G.crew||[]).some(c=>c.name===nm)));
  const ch={id:++G.castSeq, name:nm, role:role||'traveller', world:here().name, met:G.day, rels:{}};
  if(typeof augmentCast==='function')augmentCast(ch);
  G.cast.push(ch);
  if(G.cast.length>80){                  // evict the oldest drifter, never a resident
    const i=G.cast.findIndex(c=>!c.resident);
    if(i>=0)G.cast.splice(i,1); else G.cast.shift();
  }
  return ch;
}
function bumpRel(ch,crewName,delta){ if(!ch||!ch.rels||!crewName)return; ch.rels[crewName]=clampRel((ch.rels[crewName]||0)+delta); }
function shipRel(ch){ const v=Object.values((ch&&ch.rels)||{}); return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):0; }
function castById(id){ return (G.cast||[]).find(c=>c.id===id); }
function eventFlavor(table,r){
  const a=(ARCH[table]||{})[r]; if(!a||!G||!G.crew||!G.crew.length)return '';
  if(G.castSeq==null)G.castSeq=0;
  const crew=G.crew[R(G.crew.length)-1];
  let crew2=crew;
  if(G.crew.length>1)while(crew2===crew)crew2=G.crew[R(G.crew.length)-1];
  let s=FLAV[a][R(FLAV[a].length)-1];
  G._lastCast=null;
  if(a==='crew'||a==='shipboard'){
    s=s.split('{C2}').join('<b>'+crew2.name+'</b>').split('{C}').join('<b>'+crew.name+'</b>');
  } else {
    const ch=meetCast(CAST_ROLES[a][R(CAST_ROLES[a].length)-1]);
    bumpRel(ch,crew.name,(_2d6()-7)*4);          // how this brush went: −20..+20
    G._lastCast=ch.id;
    const det=CAST_DET[a]?CAST_DET[a][R(CAST_DET[a].length)-1]:'ledger';
    const goods=Object.values(TRADE); const g=goods[R(goods.length)-1];
    s=s.split('{N}').join('<b>'+ch.name+'</b>').split('{R}').join(ch.role)
      .split('{C}').join('<b>'+crew.name+'</b>').split('{W}').join(here().name)
      .split('{D}').join(det).split('{G}').join(goodVariant(g.id));
  }
  return '<div class="flav">'+s+'</div>';
}

function showEvent(title,roll,text){
  text+=eventFlavor(EV_TBL[title],roll);
  const a=document.getElementById('event-area');
  a.innerHTML='<div class="event"><div class="t">'+title+' · roll '+roll+'</div>'+text+'</div>'+ (a?a.innerHTML:'');
  if(G&&G.transit){ G.transit.log.push({title,roll,text});      // in jumpspace: feed, not pop-up
    if(typeof renderJumpScreen==='function')renderJumpScreen(); return; }
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
  text+=eventFlavor(EV_TBL[title],roll);
  data=data||{};
  if(G._lastCast)data._cast=G._lastCast;        // remember who this decision involves
  G.choiceSeq=(G.choiceSeq||0)+1;
  G.pendingChoice={kind,title,roll,text,data,options,uid:'ch'+G.choiceSeq};
  save();
  if(G.transit){ if(typeof renderJumpScreen==='function')renderJumpScreen(); renderAll(); return; }
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
  if(pc.data&&pc.data._cast){                    // engaging warms ties; brushing off cools them
    const ch=castById(pc.data._cast);
    const declined=['no','pass','walk','steer','letgo','wait','refuse'].indexOf(k)>=0;
    if(ch&&G.crew&&G.crew.length)bumpRel(ch,G.crew[R(G.crew.length)-1].name,declined?-(3+d6()):(3+d6()));
  }
  const a=document.getElementById('event-area');
  a.innerHTML='<div class="event"><div class="t">'+pc.title+' · resolved</div>'+out+'</div>'+String(a.innerHTML);
  if(G.transit){ G.transit.log.push({title:pc.title+' · resolved',roll:'—',text:out});
    if(typeof renderJumpScreen==='function')renderJumpScreen(); }
  EV_CHOICE=false;
  if(EV_OPEN){ evShow('<div class="evt">'+pc.title+' · resolved</div>'+
    '<div style="margin:12px 0;line-height:1.6">'+out+'</div>'+
    '<div style="text-align:right"><button class="primary" onclick="evNext()">Continue</button></div>'); }
  notifyAction('Decision made — '+pc.title+': chose "'+k+'". Outcome: '+String(out).replace(/<[^>]*>/g,'').slice(0,200));
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
   const b=500*d6(); pay(b,'incidentals','Adventure gone wrong — medical bills'); advanceTime(3); return 'It goes wrong — '+cr(b)+' in medical bills and 3 extra days recovering.'+c.txt+hurtCaptain(d6()+1,'the adventure'); },
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
   const hurt=hurtRandomCrew(d6(),'the pirate skirmish');
   return 'The fight goes badly — they take '+got+', and repairs cost '+cr(rep)+'.'+c.txt+hurt; },
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
        pay(b,'incidentals','Wildlife encounter — medical bills'); mech=' It bites. Medical bills: '+cr(b)+(med?' (your medic patched the worst).':'.')+hurtCaptain(med?R(2):d6(),'wildlife'); }
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
      else { const b=100*d6(); pay(b,'incidentals','Roughed up by locals — medical'); advanceTime(1); mech=' It gets ugly — '+cr(b)+' in bruises and a day licking wounds.'+c.txt+hurtCaptain(R(3),'a portside beating'); } break; }
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
    case 62:{ const med=crewSkill('Medic')>0||(G.mods&&G.mods.tended); if(G.mods)G.mods.tended=false;
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
  peoplePortWeek();
  notifyAction('Spent a day walking the port at '+here().name+'.');
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
  const MECH=[14,15,23,25,26,31,33,34,42,43];
  if(!force&&G.mods&&G.mods.maintained&&MECH.indexOf(r)>=0){
    G.mods.maintained=false;
    showEvent('Jump Event',r,t+' …but the recent overhaul holds. No harm done — someone earned their salary this week.');
    logEntry('In jump: '+t+' (shrugged off — maintenance)','muted');
    return;
  }
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
    case 14:{ let b=200*d6(); if(crewSkill('Engineer')>=2)b=Math.round(b/2); pay(b,'incidentals','Shipboard accident — spare parts'); mech=' Repairs cost '+cr(b)+'.'+(d6()<=2?hurtRandomCrew(R(3),'a shipboard accident'):''); break; }
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

