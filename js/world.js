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
      worlds.push({id:i, name:NAMES[i], col, row, u, codes:tradeCodes(u)});
      i++;
    }
  }
  // guarantee at least 12 worlds
  while(worlds.length<12 && i<NAMES.length){
    const col=R(8),row=R(10);
    if(worlds.some(w=>w.col===col&&w.row===row))continue;
    const u=genUWP(); worlds.push({id:i,name:NAMES[i],col,row,u,codes:tradeCodes(u)}); i++;
  }
  return worlds;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}
function cube(col,row){const x=col,z=row-(col-(col&1))/2,y=-x-z;return{x,y,z};}
function hexDist(a,b){const A=cube(a.col,a.row),B=cube(b.col,b.row);return Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y),Math.abs(A.z-B.z));}

