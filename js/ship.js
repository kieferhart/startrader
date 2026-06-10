/* ---------- Ships ---------- */
// mortgage = price/240 (Cepheus 40-year note). Salaries, maintenance (0.1%/yr of
// price) and life support (Cr2,000/stateroom) are derived live from the crew —
// see crewSalaries()/shipMaint()/lifeSupport().
// Cepheus SRD "Common Vessels" (book2/common-vessels.md), TL9 trader hulls.
// Fuel per the SRD: jump burns 0.1 x hull x distance; the power plant burns
// plantWk tons/week continuously; tankage (fuelCap) is fixed per design.
// All of these designs carry fuel scoops + onboard fuel processors.
// mortgage = price/240 (40-year note). Life support = Cr2,000 per stateroom,
// occupied or not (the SRD is explicit) — big-roomed ships are expensive.
const SHIPS={
 courier:{name:'Courier (TL9, 100t)',hull:100,cargo:16,jump:2,fuelCap:28,plantWk:2,rooms:4,
   price:35928000,mortgage:149700,broker:1},
 yacht:{name:'Yacht (TL9, 100t)',hull:100,cargo:12,jump:2,fuelCap:24,plantWk:1,rooms:6,
   price:26388000,mortgage:109950,broker:2},
 trader:{name:'Merchant Trader (TL9, 200t)',hull:200,cargo:85,jump:1,fuelCap:24,plantWk:1,rooms:10,
   price:34929000,mortgage:145538,broker:1},
 frontier:{name:'Frontier Trader (TL9, 300t)',hull:300,cargo:75,jump:1,fuelCap:42,plantWk:3,rooms:25,
   price:82314000,mortgage:342975,broker:2},
 freighter:{name:'Merchant Freighter (TL9, 400t)',hull:400,cargo:261,jump:1,fuelCap:48,plantWk:2,rooms:4,
   price:59814000,mortgage:249225,broker:1},
 easy:{name:'Salvaged Asteroid Miner (paid off)',hull:200,cargo:84,jump:1,fuelCap:44,plantWk:1,rooms:3,
   price:0,mortgage:0,broker:2},
};
const SHIP_ALIAS={free:'trader',far:'courier',sub:'freighter'};   // legacy save keys
function jumpFuel(dist){ const s=SHIPS[G.ship]; return Math.ceil(s.hull*0.1*(dist||s.jump)); }

/* ---------- Crew ---------- */
const SURNAME=['Lucklow','Hammond','Shurishdam','Quinn','Holroyd','Vega','Calloway','Ten','Okafor','Reyes','Naismith','Drummond','Sato','Bryce','Volkov','Ferro'];
const SKILLPOOL={
 Captain:['Leadership-2','Admin-2','Broker-1','Tactics-1','Pilot-1'],
 Gunner:['Gunner-2','Mechanic-1','Vacc Suit-1','Tactics-1'],
 Pilot:['Pilot-2','Navigation-1','Gunner-1','Vacc Suit-1'],
 Navigator:['Navigation-2','Pilot-1','Comms-1','Sensors-1'],
 Engineer:['Engineer-2','Mechanic-2','Vacc Suit-1','Gunner-1'],
 Medic:['Medic-3','Science-1','Investigate-1'],
 Steward:['Steward-1','Carouse-2','Streetwise-1','Persuade-1'],
};
// Salaries per Cepheus Engine "Crew Salaries" table (Pilot 6k, Navigator 5k,
// Engineer 4k, Steward 3k, Medic 2k). Ship.salaries are summed from this live.
const CREW_TMPL={
 courier:[['Pilot / First Officer',6000,'Captain'],['Navigator',5000,'Navigator'],['Engineer',4000,'Engineer']],
 yacht:[['Pilot / First Officer',6000,'Captain'],['Navigator',5000,'Navigator'],['Engineer',4000,'Engineer']],
 trader:[['Pilot / First Officer',6000,'Captain'],['Navigator',5000,'Navigator'],['Engineer',4000,'Engineer'],['Medic',2000,'Medic'],['Steward',3000,'Steward']],
 frontier:[['Pilot / First Officer',6000,'Captain'],['Navigator',5000,'Navigator'],['Engineer',4000,'Engineer'],['Gunner',1000,'Gunner'],['Gunner',1000,'Gunner'],['Gunner',1000,'Gunner'],['Steward',3000,'Steward'],['Steward',3000,'Steward']],
 freighter:[['Pilot / First Officer',6000,'Captain'],['Navigator',5000,'Navigator'],['Engineer',4000,'Engineer']],
 easy:[['Pilot / First Officer',0,'Captain'],['Navigator',0,'Navigator'],['Engineer',0,'Engineer']],
};
const NPC_REL={11:'Bickers with',12:'Secretly in love with',13:'Secretly hates',14:'Competitive rival of',
 15:'Blames for a past event',16:'Blames for a past event',21:'Knows a dark secret of',22:'Ignores or ridicules',
 23:'Good friends with',24:'Good friends with',25:'Life-long friend of',26:'Emotionally dependent on',
 31:'Admires',32:'Secretly jealous of',33:'Openly jealous of',34:'Loner',35:'Old (ex-) friend of',
 36:'Shares a secret past with',41:'Sexual partner of',42:'Sexual partner of',43:'Married to',
 44:'Divorced (past incident) from',45:'Divorced (differences) from',46:'Related to (good terms)',
 51:'Related to (feuding)',52:'Life-long friend of',53:'Secretly related to',54:'Loner',
 55:'Bitter about a past event with',56:'Inseparable buddy of',61:'Bitter about a past event with',
 62:'Friend through guilt of',63:'Friend through guilt of',64:'Knows a dark secret of',
 65:'Enemy of — waiting to strike',66:'It’s all an act with'};
const UPP_LBL=['STR','DEX','END','INT','EDU','SOC'];
function pickSkills(pool){ const cp=[...pool]; shuffle(cp); return cp.slice(0,Math.min(cp.length,2+R(2))); }
function genCrew(shipKey){
  const tmpl=CREW_TMPL[shipKey]||CREW_TMPL.trader;
  const used=new Set();
  const crew=tmpl.map(t=>{
    let nm; do{ nm=CFIRST[R(CFIRST.length)-1]+' '+SURNAME[R(SURNAME.length)-1]; }while(used.has(nm)); used.add(nm);
    return {name:nm, position:t[0], salary:t[1], age:26+d6()*2+d6()*2,
      upp:[0,0,0,0,0,0].map(()=>ehex(_2d6())).join(''),
      skills:pickSkills(SKILLPOOL[t[2]]||SKILLPOOL.Steward)};
  });
  crew.forEach((c,i)=>{ const r=d66(); const desc=NPC_REL[r]||'Reserved toward';
    if(r===34||r===54){ c.rel={desc:'Loner',target:null}; }
    else { const others=crew.filter((_,j)=>j!==i); const tgt=others[R(others.length)-1];
      c.rel={desc, target:tgt?tgt.name:null}; } });
  augmentCrewAll(crew);                  // traits, goals, wallets, pairwise rels (people.js)
  crew.forEach(c=>augmentHealth(c));
  return crew;
}

/* ---------- Running costs (derived from the crew, Cepheus Ch.6) ---------- */
function crewSalaries(){ return (G.crew||[]).reduce((a,c)=>a+(c.salary||0),0); }
function staterooms(){ return SHIPS[G.ship].rooms; }   // fixed per SRD design; Cr2,000/room occupied or not
function shipMaint(){ return Math.round((SHIPS[G.ship].price||0)*0.001/12); }  // 0.1%/yr of hull
function lifeSupport(){ return staterooms()*2000; }                            // Cr2,000/stateroom
function monthlyOverhead(){ return shipMaint()+lifeSupport(); }
function monthlyTotal(){ return (SHIPS[G.ship].mortgage||0)+crewSalaries()+monthlyOverhead(); }

