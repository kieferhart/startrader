/* ---------- World generation (Cepheus Engine SRD, Ch.12 "Worlds") ---------- */
function genUWP(){
  const size=Math.max(0,_2d6()-2);                          // 2D6-2
  const atmo = size===0?0:Math.max(0,Math.min(15,_2d6()-7+size)); // 2D6-7+Size; Size 0 -> 0
  let hydro;
  if(size<=1){ hydro=0; }                                   // Size 0/1 -> Hydro 0
  else { hydro=_2d6()-7+size;                               // 2D6-7+Size, modified by atmo
    if([0,1,10,11,12].includes(atmo))hydro-=4; else if(atmo===14)hydro-=2;
    hydro=Math.max(0,Math.min(10,hydro)); }
  let pop=_2d6()-2;                                          // 2D6-2 + Population DMs
  if(size<=2)pop-=1;
  if(atmo>=10)pop-=2;
  if(atmo===6)pop+=3;
  if(atmo===5||atmo===8)pop+=1;
  if(hydro===0&&atmo<3)pop-=2;
  pop=Math.max(0,Math.min(10,pop));
  const spr=_2d6()-7+pop;                                   // Starport = 2D6-7+Pop
  const sp = spr<=2?'X': spr<=4?'E': spr<=6?'D': spr<=8?'C': spr<=10?'B':'A';
  const gov = pop===0?0:Math.max(0,Math.min(15,_2d6()-7+pop));   // 2D6-7+Pop
  const law = gov===0?0:Math.max(0,Math.min(15,_2d6()-7+gov));   // 2D6-7+Gov
  let tl=0;
  if(pop>0){                                                // Pop 0 -> TL 0
    tl=d6();                                                // Cepheus TL DM table
    tl+= sp==='A'?6: sp==='B'?4: sp==='C'?2: sp==='X'?-4:0;
    tl+= size<=1?2: size<=4?1:0;
    tl+= (atmo<=3||atmo>=10)?1:0;
    tl+= hydro===0?1: hydro===9?1: hydro===10?2:0;
    tl+= (pop>=1&&pop<=5)?1: pop===9?1: pop===10?2:0;
    tl+= gov===0?1: gov===5?1: gov===7?2: (gov===13||gov===14)?-2:0;
    tl=Math.max(0,tl);
    if((hydro===0||hydro===10)&&pop>=6)tl=Math.max(tl,4);   // minimum-TL requirements
    if([4,7,9].includes(atmo))tl=Math.max(tl,5);
    if(atmo<=3||(atmo>=10&&atmo<=12))tl=Math.max(tl,7);
    if((atmo===13||atmo===14)&&hydro===10)tl=Math.max(tl,7);
  }
  return {sp,size,atmo,hydro,pop,gov,law,tl};
}
function tradeCodes(u){
  const c=[]; const {size,atmo,hydro,pop,gov,law,tl}=u;
  if(atmo>=4&&atmo<=9&&hydro>=4&&hydro<=8&&pop>=5&&pop<=7)c.push('Ag');
  if(size===0&&atmo===0&&hydro===0)c.push('As');
  if(pop===0&&gov===0&&law===0)c.push('Ba');
  if(atmo>=2&&hydro===0)c.push('De');
  if(atmo>=10&&hydro>=1)c.push('Fl');
  if([5,6,8].includes(atmo)&&hydro>=4&&hydro<=9&&pop>=4&&pop<=8)c.push('Ga');
  if(pop>=9)c.push('Hi');
  if(tl>=12)c.push('Ht');
  if(atmo<=1&&hydro>=1)c.push('Ic');
  if([0,1,2,4,7,9].includes(atmo)&&pop>=9)c.push('In');
  if(pop>=1&&pop<=3)c.push('Lo');
  if(tl<=5&&pop>0)c.push('Lt');
  if(atmo<=3&&hydro<=3&&pop>=6)c.push('Na');
  if(pop>=4&&pop<=6)c.push('Ni');
  if(atmo>=2&&atmo<=5&&hydro<=3)c.push('Po');
  if((atmo===6||atmo===8)&&pop>=6&&pop<=8)c.push('Ri');
  if(atmo===0)c.push('Va');
  if(hydro>=10)c.push('Wa');
  return c;
}
const CODE_NAME={Ag:'Agricultural',As:'Asteroid',Ba:'Barren',De:'Desert',Fl:'Fluid Oceans',
 Ga:'Garden',Hi:'High Pop',Ht:'High Tech',Ic:'Ice-Capped',In:'Industrial',Lo:'Low Pop',
 Lt:'Low Tech',Na:'Non-Agri',Ni:'Non-Industrial',Po:'Poor',Ri:'Rich',Va:'Vacuum',Wa:'Water World'};
// hover blurbs: what each code means for a trader (drives pDM/rDM in data.js)
const CODE_DESC={
 Ag:'Agricultural — breadbasket world. Farm goods are CHEAP here: animal products, groceries, liquor, textiles, luxuries. Buy food, sell machinery.',
 As:'Asteroid belt — vacuum mining culture. Ores and precious metals come cheap; survival gear matters.',
 Ba:'Barren — essentially no population, no market to speak of.',
 De:'Desert — dry world, little open water (no free water refueling).',
 Fl:'Fluid oceans — seas of something other than water. Harsh; survival gear sells.',
 Ga:'Garden world — pleasant and fertile. Luxuries, furniture and farm goods are cheap here.',
 Hi:'High population (billions) — a hungry mass market. PAYS WELL for foodstuffs, collectibles, medical equipment and military gear.',
 Ht:'High Tech (TL12+) — advanced industry. Electronics, computers, robots, cyberware and pharma are CHEAP here. Buy tech, haul it to Ni/Po worlds.',
 Ic:'Ice-capped — frozen rock. Precious metals mined cheap.',
 In:'Industrial — factory world. Manufactured goods and machinery are CHEAP; PAYS WELL for raw materials, crystals, radioactives and (quietly) vices.',
 Lo:'Low population — a few thousand souls at most; thin market.',
 Lt:'Low Tech — pre-industrial society. Pays for tools and simple manufactured goods.',
 Na:'Non-Agricultural — cannot feed itself. PAYS WELL for food, textiles and petrochemicals. Bring groceries, leave rich.',
 Ni:'Non-Industrial — cannot make its own goods. PAYS WELL for electronics, machinery, vehicles, weapons. The classic place to SELL.',
 Po:'Poor — scraping by. Pays for weapons and advanced goods, but money is tight; little worth buying.',
 Ri:'Rich — wealthy consumers. PAYS WELL for luxuries, gems, gambling gear; their own luxuries are also traded cheap.',
 Va:'Vacuum — airless world. Survival gear and polymers in demand.',
 Wa:'Water world — all ocean. Pharmaceuticals come cheap; free water for fuel skimming.',
};
const BADCODE=['Ba','Po','Va','As'];
function uwpString(u){ return u.sp+ehex(u.size)+ehex(u.atmo)+ehex(u.hydro)+ehex(u.pop)+ehex(u.gov)+ehex(u.law)+'-'+ehex(u.tl); }

const NAMES=['Aramis','Boreas','Calder','Drennan','Eshar','Fenwick','Gax','Hollis','Ix',
 'Jorvik','Kellis','Lumen','Mira','Nostra','Oberon','Pyre','Quillon','Rastaban','Skara',
 'Tamber','Ursa','Vance','Wexford','Xanthe','Yarrow','Zelos','Corvane','Bellaster','Drift',
 'Halcyon','Marrow','Sable','Tycho','Veridian','Halloran','Cinder','Lethe','Onyx','Praxis','Wyck'];
const SSNAMES=['Vilani Reach','Cortex','Marrow Run','The Tangle','Spinward Cluster','Drift Subsector','Halloran Cross','Ember Verge'];

function genSubsector(){
  shuffle(NAMES);
  const worlds=[]; let i=0;
  for(let col=1;col<=8;col++)for(let row=1;row<=10;row++){
    if(Math.random()<0.30 && i<NAMES.length){
      const u=genUWP();
      worlds.push({id:i, name:NAMES[i], col, row, u, codes:tradeCodes(u), gg:_2d6()>=5});
      i++;
    }
  }
  // guarantee at least 12 worlds
  while(worlds.length<12 && i<NAMES.length){
    const col=R(8),row=R(10);
    if(worlds.some(w=>w.col===col&&w.row===row))continue;
    const u=genUWP(); worlds.push({id:i,name:NAMES[i],col,row,u,codes:tradeCodes(u),gg:_2d6()>=5}); i++;
  }
  return worlds;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}
function cube(col,row){const x=col,z=row-(col-(col&1))/2,y=-x-z;return{x,y,z};}
function hexDist(a,b){const A=cube(a.col,a.row),B=cube(b.col,b.row);return Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y),Math.abs(A.z-B.z));}

/* ---------- Jump connectivity (start-world guarantee) ---------- */
// Label each world with its connected component under "reachable in one
// jump of rating jr" adjacency. A component of size >=6 means a member has
// >=1 world in direct range and >=5 it can chain to.
function jumpComponents(worlds,jr){
  const comp=new Array(worlds.length).fill(-1); let c=0;
  for(let i=0;i<worlds.length;i++){
    if(comp[i]>=0)continue;
    const stack=[i]; comp[i]=c;
    while(stack.length){
      const a=stack.pop();
      for(let j=0;j<worlds.length;j++)
        if(comp[j]<0&&hexDist(worlds[a],worlds[j])<=jr){ comp[j]=c; stack.push(j); }
    }
    c++;
  }
  return comp;
}
// Index of a good start world inside a component of >=need worlds:
// prefer an A/B/C port with pop>=5, else any member. -1 if no such component.
function bigComponentStart(worlds,jr,need){
  const comp=jumpComponents(worlds,jr);
  const sizes={}; comp.forEach(c=>sizes[c]=(sizes[c]||0)+1);
  const ok=i=>sizes[comp[i]]>=need;
  let pick=-1;
  worlds.forEach((w,i)=>{ if(pick<0&&ok(i)&&'ABC'.includes(w.u.sp)&&w.u.pop>=5)pick=i; });
  if(pick<0)worlds.forEach((w,i)=>{ if(pick<0&&ok(i))pick=i; });
  return pick;
}
// Deterministic fallback: relocate worlds from other components into empty
// hexes within jr of the largest cluster until it holds >=need worlds.
function ensureCluster(worlds,jr,need){
  for(let guard=0;guard<40;guard++){
    const comp=jumpComponents(worlds,jr);
    const sizes={}; comp.forEach(c=>sizes[c]=(sizes[c]||0)+1);
    const bestC=+Object.keys(sizes).reduce((a,b)=>sizes[a]>=sizes[b]?a:b);
    if(sizes[bestC]>=need)return;
    const di=worlds.findIndex((w,i)=>comp[i]!==bestC);
    if(di<0)return;
    const members=worlds.filter((w,i)=>comp[i]===bestC);
    let spot=null;
    for(const m of members){
      for(let col=Math.max(1,m.col-jr);col<=Math.min(8,m.col+jr)&&!spot;col++)
        for(let row=Math.max(1,m.row-jr);row<=Math.min(10,m.row+jr)&&!spot;row++){
          if(worlds.some(w=>w.col===col&&w.row===row))continue;
          const d=hexDist({col,row},m);
          if(d>0&&d<=jr)spot={col,row};
        }
      if(spot)break;
    }
    if(!spot)return;
    worlds[di].col=spot.col; worlds[di].row=spot.row;
  }
}

