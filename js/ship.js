/* ---------- Ships ---------- */
// mortgage = price/240 (Cepheus 40-year note). Salaries, maintenance (0.1%/yr of
// price) and life support (Cr2,000/stateroom) are derived live from the crew —
// see crewSalaries()/shipMaint()/lifeSupport().
const SHIPS={
 free:{name:'Free Trader (Type A)',cargo:82,jump:1,perJump:12000,mortgage:154167,price:37000000,broker:1},
 far :{name:'Far Trader (Type A2)',cargo:64,jump:2,perJump:14000,mortgage:208333,price:50000000,broker:1},
 sub :{name:'Subsidized Merchant (Type R)',cargo:205,jump:1,perJump:30000,mortgage:404167,price:97000000,broker:2},
 easy:{name:'Salvaged Hauler (paid off)',cargo:120,jump:2,perJump:4000,mortgage:0,price:0,broker:2},
};

/* ---------- Crew ---------- */
const SURNAME=['Lucklow','Hammond','Shurishdam','Quinn','Holroyd','Vega','Calloway','Ten','Okafor','Reyes','Naismith','Drummond','Sato','Bryce','Volkov','Ferro'];
const SKILLPOOL={
 Captain:['Leadership-2','Admin-2','Broker-1','Tactics-1','Pilot-1'],
 Pilot:['Pilot-2','Navigation-1','Gunner-1','Vacc Suit-1'],
 Navigator:['Navigation-2','Pilot-1','Comms-1','Sensors-1'],
 Engineer:['Engineer-2','Mechanic-2','Vacc Suit-1','Gunner-1'],
 Medic:['Medic-3','Science-1','Investigate-1'],
 Steward:['Steward-1','Carouse-2','Streetwise-1','Persuade-1'],
};
// Salaries per Cepheus Engine "Crew Salaries" table (Pilot 6k, Navigator 5k,
// Engineer 4k, Steward 3k, Medic 2k). Ship.salaries are summed from this live.
const CREW_TMPL={
 free:[['Captain / Pilot',6000,'Captain'],['Engineer',4000,'Engineer'],['Medic',2000,'Medic'],['Steward',3000,'Steward']],
 far :[['Captain / Pilot',6000,'Captain'],['Navigator',5000,'Navigator'],['Engineer',4000,'Engineer'],['Steward',3000,'Steward']],
 sub :[['Captain',6000,'Captain'],['Pilot',6000,'Pilot'],['Navigator',5000,'Navigator'],['Engineer',4000,'Engineer'],['Medic',2000,'Medic'],['Steward',3000,'Steward']],
 easy:[['Captain / Pilot',0,'Captain'],['Engineer',0,'Engineer'],['Steward',0,'Steward']],
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
  const tmpl=CREW_TMPL[shipKey]||CREW_TMPL.free;
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
  return crew;
}

/* ---------- Running costs (derived from the crew, Cepheus Ch.6) ---------- */
function crewSalaries(){ return (G.crew||[]).reduce((a,c)=>a+(c.salary||0),0); }
function staterooms(){ return Math.max(1,Math.ceil((G.crew||[]).length/2)); } // double-occupancy
function shipMaint(){ return Math.round((SHIPS[G.ship].price||0)*0.001/12); }  // 0.1%/yr of hull
function lifeSupport(){ return staterooms()*2000; }                            // Cr2,000/stateroom
function monthlyOverhead(){ return shipMaint()+lifeSupport(); }
function monthlyTotal(){ return (SHIPS[G.ship].mortgage||0)+crewSalaries()+monthlyOverhead(); }

