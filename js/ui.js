/* ---------- Rendering ---------- */
function renderAll(){ renderTabs(); renderTop(); renderMap(); renderWorlds(); renderCurrentWorld(); renderMarket(); renderHold(); renderLog(); renderJumpBtn(); renderFuel(); renderCommitments(); renderPendingChoice();
  if(typeof updateChatBadge==='function'){ updateChatBadge(); if(typeof CHAT_OPEN!=='undefined'&&CHAT_OPEN&&!CHAT_CUR)renderChatPanel(); } }

/* ---------- Fuel (SRD tankage: jump 0.1xhull/pc; plant burns weekly) ---------- */
function renderFuel(){
  const el=document.getElementById('fuelbox'); if(!el)return;
  const s=SHIPS[G.ship]; const w=here(); const sp=w.u.sp;
  const full=G.fuel>=s.fuelCap-0.01;
  el.innerHTML='<div class="hint" style="margin:6px 0 4px">Fuel: <b class="'+(G.fuel<jumpFuel()?'neg':'')+'">'+
    (Math.floor(G.fuel*10)/10)+'/'+s.fuelCap+'t</b> '+(G.fuelUnrefined?'<span class="code bad" title="−2 on the jump check — purify or refill clean">unrefined</span>':'<span class="code">refined</span>')+
    ' · jump burns '+jumpFuel()+'t/pc · plant '+s.plantWk+'t/wk</div>'+
    '<div class="row">'+
    '<button '+(full||!'AB'.includes(sp)?'disabled ':'')+'onclick="refuel(\'refined\')" title="Class A/B ports only">Refined Cr500/t</button>'+
    '<button '+(full||!'ABCDE'.includes(sp)?'disabled ':'')+'onclick="refuel(\'unrefined\')" title="A–C Cr100/t; D/E Cr300/t — misjump risk">Unrefined</button>'+
    '<button '+(full||(!w.gg&&w.u.hydro<2)?'disabled ':'')+'onclick="refuel(\'skim\')" title="Free from a gas giant or open water — 1 day, unrefined">Skim (1d)</button>'+
    '<button '+(!G.fuelUnrefined?'disabled ':'')+'onclick="refuel(\'purify\')" title="Onboard processors — 1 day">Purify (1d)</button>'+
    '</div>';
}

/* ---------- Commitments (loans, receivables, delivery commissions) ---------- */
function renderCommitments(){
  const el=document.getElementById('commitments'); if(!el)return;
  const rows=[];
  const b=G.bills||{wages:0,mortgage:0,upkeep:0,wagesM:0,mortM:0,upkeepM:0};
  const bill=(k,label,amt,late,warn)=>{ if(amt<=0)return;
    rows.push('<div class="w"><div><div class="nm '+(late?'neg':'')+'">'+label+' '+cr(amt)+(late?' · '+late+' mo late':'')+'</div>'+
      (warn?'<div class="meta neg">'+warn+'</div>':'')+'</div>'+
      '<button '+(G.credits<amt?'disabled ':'')+'onclick="payBill(\''+k+'\')">Pay</button></div>'); };
  bill('wages','Crew wages',b.wages,b.wagesM,b.wagesM?'unpaid crew remember this':'');
  bill('mortgage','Mortgage',b.mortgage,b.mortM,
    b.mortM>=3?'recovery agents hunting you':b.mortM>=2?'liens filed — high-law ports impound cargo':b.mortM>=1?'late fees accruing (10%/mo)':'');
  bill('upkeep','Maintenance & life support',b.upkeep,b.upkeepM,'');
  if(billTotal()>0&&G.credits>=billTotal())
    rows.push('<div class="w"><div><div class="nm">Settle everything</div></div><button class="primary" onclick="payBill(\'all\')">Pay all '+cr(billTotal())+'</button></div>');
  (G.loans||[]).forEach((l,i)=>{ const owed=Math.round(l.P*(1+l.rate/100));
    rows.push('<div class="w"><div><div class="nm neg">Owe '+l.from+' '+cr(owed)+'</div>'+
      '<div class="meta">due day '+(l.due+1)+(l.missed?' · PAYMENT MISSED':'')+(l.crew?' · crew loan':'')+'</div></div>'+
      '<button '+(G.credits<owed?'disabled':'')+' onclick="repayLoan('+i+')">Repay</button></div>'); });
  (G.lent||[]).filter(l=>!l.resolved).forEach(l=>{ const back=Math.round(l.P*(1+l.rate/100));
    rows.push('<div class="w"><div><div class="nm pos">'+l.to+' owes you '+cr(back)+'</div>'+
      '<div class="meta">promised by day '+(l.due+1)+'</div></div></div>'); });
  (G.requests||[]).forEach((r,i)=>{ const canDeliver=here().name===r.world&&G.hold.some(h=>h.id===r.gid);
    rows.push('<div class="w"><div><div class="nm">'+r.tons+'t '+(r.vname||goodById(r.gid).name)+' → '+r.name+'</div>'+
      '<div class="meta">'+goodById(r.gid).name+'</div>'+
      '<div class="meta">'+r.world+' · '+cr(r.ppt)+'/t · by day '+(r.due+1)+'</div></div>'+
      '<button '+(canDeliver?'':'disabled ')+'onclick="deliverRequest('+i+')">Deliver</button></div>'); });
  el.innerHTML=rows.length?rows.join(''):'<div class="hint">No standing obligations. The freest a trader ever feels.</div>';
}

/* ---------- Tabs (Trade / Star Map / Bridge) ---------- */
function switchTab(t){ G.tab=t; save(); renderTabs(); }
function renderTabs(){
  const t=(G&&G.tab)||'trade';
  ['trade','map','bridge'].forEach(k=>{
    const p=document.getElementById('tab-'+k), b=document.getElementById('tabbtn-'+k);
    if(p)p.className='tabpage'+(k===t?' active':'');
    if(b)b.className=(k===t?'on':'');
  });
}

/* ---------- Interactive star map (SVG hex grid, odd-q to match hexDist) ---------- */
const SP_COLOR={A:'#4ea1ff',B:'#7fc4ff',C:'#cdd6e4',D:'#ffcf6b',E:'#c79a55',X:'#ff6b6b'};
function hexCenter(col,row,r){
  const SQ=Math.sqrt(3);
  return [1.5*r*(col-1)+r, SQ*r*((row-1)+(col%2===1?0.5:0))+SQ*r/2];
}
function hexPts(cx,cy,r){
  const p=[]; for(let a=0;a<6;a++){ const t=Math.PI/3*a;
    p.push((cx+r*Math.cos(t)).toFixed(1)+','+(cy+r*Math.sin(t)).toFixed(1)); }
  return p.join(' ');
}
function renderMap(){
  const el=document.getElementById('starmap'); if(!el)return;
  const r=20, SQ=Math.sqrt(3);
  const W=Math.ceil(1.5*r*7+2*r), H=Math.ceil(SQ*r*10.5+SQ*r/2);
  const from=here(), jr=SHIPS[G.ship].jump;
  const byHex={}; G.worlds.forEach(w=>byHex[w.col+'-'+w.row]=w);
  let s='';
  for(let col=1;col<=8;col++)for(let row=1;row<=10;row++){
    const [cx,cy]=hexCenter(col,row,r);
    const w=byHex[col+'-'+row];
    const hexId=('0'+col).slice(-2)+('0'+row).slice(-2);
    if(!w){
      s+='<polygon points="'+hexPts(cx,cy,r-0.5)+'" fill="#0b0f18" stroke="#161e2e" stroke-width="1"><title>hex '+hexId+' — empty</title></polygon>';
      continue;
    }
    const d=hexDist(from,w);
    const isHere=w.id===G.here, isDest=w.id===G.dest, inRange=d>0&&d<=jr;
    const fill=isHere?'#0e2018':isDest?'#11253f':inRange?'#141e33':'#0c111b';
    const stroke=isHere?'#5fd08a':isDest?'#4ea1ff':inRange?'#2f4368':'#1a2334';
    const nm=w.name.length>10?w.name.slice(0,9)+'…':w.name;
    s+='<g style="cursor:pointer" onclick="selectDest('+w.id+')">'+
      '<polygon points="'+hexPts(cx,cy,r-0.5)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+(isHere||isDest?1.6:1)+'"/>'+
      '<circle cx="'+cx+'" cy="'+(cy-4)+'" r="3.6" fill="'+(SP_COLOR[w.u.sp]||'#9aa7bb')+'"/>'+
      (isHere?'<circle cx="'+cx+'" cy="'+(cy-4)+'" r="7" fill="none" stroke="#5fd08a" stroke-width="1"/>':'')+
      '<text x="'+cx+'" y="'+(cy+7.5)+'" text-anchor="middle" font-size="6.2" font-family="inherit" fill="'+(isHere?'#5fd08a':isDest?'#9ec5ff':'#9fb4d6')+'">'+nm+'</text>'+
      '<text x="'+cx+'" y="'+(cy+14.5)+'" text-anchor="middle" font-size="5.4" font-family="inherit" fill="'+(inRange?'#4ea1ff':'#5a6679')+'">'+(isHere?'◉ here':d+'pc'+(inRange?'':' ✕'))+'</text>'+
      '<title>'+w.name+' ('+hexId+')\n'+uwpString(w.u)+' · '+(w.codes.join(' ')||'no codes')+'\n'+
        (isHere?'Current location':d+' parsec'+(d>1?'s':'')+(inRange?' — in jump range':' — beyond J'+jr))+'</title>'+
      '</g>';
  }
  if(G.dest!=null&&G.dest!==G.here){
    const to=world(G.dest);
    if(to){ const [x1,y1]=hexCenter(from.col,from.row,r), [x2,y2]=hexCenter(to.col,to.row,r);
      s+='<line x1="'+x1+'" y1="'+(y1-4)+'" x2="'+x2+'" y2="'+(y2-4)+'" stroke="#4ea1ff" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.8"/>'; }
  }
  el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block" xmlns="http://www.w3.org/2000/svg">'+s+'</svg>';
}
function renderTop(){
  document.getElementById('t-credits').textContent=cr(G.credits);
  document.getElementById('t-credits').className='val '+(G.credits<0?'neg':'');
  const p=G.credits-G.startCredits;
  const pe=document.getElementById('t-profit'); pe.textContent=(p>=0?'+':'')+cr(p).replace('Cr','Cr'); pe.className='val '+(p>=0?'pos':'neg');
  document.getElementById('t-week').textContent=Math.floor(G.day/7)+1;
  document.getElementById('t-day').textContent=G.day+1;
  document.getElementById('t-loc').textContent=here().name;
  document.getElementById('t-hold').textContent=holdUsed()+'/'+SHIPS[G.ship].cargo+'t';
  const fe=document.getElementById('t-fuel');
  if(fe){ fe.textContent=Math.floor(G.fuel==null?0:G.fuel)+'/'+SHIPS[G.ship].fuelCap+'t'+(G.fuelUnrefined?'*':'');
    fe.className='val '+(G.fuel<jumpFuel()?'neg':G.fuelUnrefined?'':'' ); fe.title=G.fuelUnrefined?'Unrefined fuel aboard — misjump risk; purify or burn it off':'Refined fuel'; }
  document.getElementById('ss-name').textContent=G.ssname;
  document.getElementById('jrange').textContent='J'+SHIPS[G.ship].jump;
}
function renderWorlds(){
  const el=document.getElementById('worldlist'); const from=here(); const jr=SHIPS[G.ship].jump;
  const sorted=[...G.worlds].sort((a,b)=>hexDist(from,a)-hexDist(from,b));
  el.innerHTML=sorted.map(w=>{
    const d=hexDist(from,w); const inrange=d<=jr&&d>0;
    return '<div class="w'+(w.id===G.here?' here':'')+'" onclick="selectDest('+w.id+')" style="cursor:pointer">'+
      '<div><div class="nm">'+w.name+(w.id===G.here?' ◉':'')+'</div>'+
      '<div class="meta">'+uwpString(w.u)+' · '+(w.codes.join(' ')||'—')+'</div></div>'+
      '<div class="dist">'+(w.id===G.here?'here':(d+'pc'+(inrange?'':' ✕')))+'</div></div>';
  }).join('');
}
function renderCurrentWorld(){
  const w=here();
  document.getElementById('cw-name').textContent=w.name;
  document.getElementById('t-loc').textContent=w.name;
  const codes=w.codes.map(c=>'<span class="code'+(BADCODE.includes(c)?' bad':'')+'" title="'+CODE_NAME[c]+'">'+c+'</span>').join('');
  const ppl=(typeof peopleHere==='function'?peopleHere():[]).map(ch=>
    '<span class="code" style="cursor:pointer" title="'+ch.role+' · standing '+(shipRel(ch)>0?'+':'')+shipRel(ch)+'" '+
    'onclick="showChat(\'cast\',\''+ch.name+'\')">'+ch.name+'</span>').join(' ');
  document.getElementById('cw-detail').innerHTML=
    '<div class="uwp">'+uwpString(w.u)+'</div>'+
    '<div class="hint">Starport '+w.u.sp+' · Pop 10^'+w.u.pop+' · Law '+w.u.law+' · TL '+w.u.tl+'</div>'+
    '<div class="codes">'+(codes||'<span class="muted">no special trade codes</span>')+'</div>'+
    (ppl?'<div class="hint" style="margin-top:8px">People here (tap to talk):</div><div class="codes">'+ppl+'</div>':'');
}
function renderMarket(){
  document.getElementById('mkt-src').textContent=G.marketSrc;
  const free=holdFree();
  const rows=G.market.map((m,i)=>{
    const maxBuy=Math.min(m.tons,free,Math.floor(G.credits/m.ppt));
    const margin=m.mult; // <1 = cheap
    const cls = margin<0.9?'pos': margin>1.3?'neg':'';
    const nameHtml=m.name+(m.illegal?' <span class="code bad">illeg</span>':'')+(m.quality?' <span class="code">top quality</span>':'')+
      '<div class="meta muted" style="font-size:10px">'+goodCat(m)+'</div>';
    return '<tr class="namerow"><td colspan="5">'+nameHtml+'</td></tr>'+   // mobile: name gets its own line
      '<tr><td class="name-cell">'+nameHtml+'</td>'+
      '<td class="num hide-sm">'+cr(m.base)+'</td>'+
      '<td class="num '+cls+'">'+cr(m.ppt)+'</td>'+
      '<td class="num qty">'+m.tons+'t</td>'+
      '<td class="num"><input type="number" id="buy-'+i+'" min="0" max="'+maxBuy+'" value="'+maxBuy+'" '+(maxBuy<=0?'disabled':'')+'></td>'+
      '<td><button '+(maxBuy<=0?'disabled':'')+' onclick="buyGood('+i+')">Buy</button></td></tr>';
  }).join('');
  document.getElementById('market').innerHTML=
    '<table><thead><tr><th class="name-cell">Good</th><th class="num hide-sm">Base</th><th class="num">Price/t</th><th class="num">Avail</th><th class="num">Tons</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<div class="hint" style="margin-top:6px;">Green price = good buy (below base). Buy low here, sell where the world’s trade codes want it.</div>';
}
function renderHold(){
  document.getElementById('hold-cap').textContent=holdUsed()+'/'+SHIPS[G.ship].cargo+'t';
  if(!G.hold.length){ document.getElementById('hold').innerHTML='<div class="hint">Hold is empty. Buy cargo above, then jump to a world that demands it.</div>'; return; }
  const w=here();
  const rows=G.hold.map((h,i)=>{
    const g=ALLGOODS[h.id]||{pDM:{},rDM:{}};
    const estResult=7+SHIPS[G.ship].broker+maxDM(g.rDM,w.codes)-maxDM(g.pDM,w.codes)+(h.quality?1:0); // avg 2d6=7
    const estPpt=Math.round(h.base*priceMult(estResult,true));
    const good=estPpt>h.ppt;
    const nameHtml=h.name+(h.quality?' <span class="code">top quality</span>':'')+
      '<div class="meta muted" style="font-size:10px">'+goodCat(h)+' · from '+h.origin+'</div>';
    return '<tr class="namerow"><td colspan="4">'+nameHtml+'</td></tr>'+
      '<tr><td class="name-cell">'+nameHtml+'</td>'+
      '<td class="num">'+h.tons+'t</td>'+
      '<td class="num">'+cr(h.ppt)+'</td>'+
      '<td class="num '+(good?'pos':'neg')+'">~'+cr(estPpt)+'</td>'+
      '<td><button onclick="sellHold('+i+')">Sell here</button></td></tr>';
  }).join('');
  document.getElementById('hold').innerHTML=
    '<table><thead><tr><th class="name-cell">Cargo</th><th class="num">Tons</th><th class="num">Paid/t</th><th class="num">Est. sale/t here</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<div class="hint" style="margin-top:6px;">Green estimate = likely profit at this world. Actual price rolls when you sell.</div>';
}
function renderLog(){
  document.getElementById('log').innerHTML=G.log.map(e=>{
    let amt=''; if(e.amt!=null)amt='<span class="amt '+(e.amt>=0?'pos':'neg')+'"> '+(e.amt>=0?'+':'')+cr(e.amt).replace('Cr','Cr')+'</span>';
    return '<div class="entry '+(e.cls==='money'?'money':'')+'"><span class="wk">wk '+e.wk+'</span> '+
      '<span class="'+(e.cls==='muted'?'muted':'')+'">'+e.text+'</span>'+amt+'</div>';
  }).join('');
}
function renderJumpBtn(){
  // two synchronized jump-control sets: Bridge tab and Star Map tab
  let dis=true, dn='none', info='';
  if(G.dest!=null&&G.dest!==G.here){
    const to=world(G.dest), d=hexDist(here(),to), jr=SHIPS[G.ship].jump;
    dn=to.name+' ('+uwpString(to.u)+')';
    const need=jumpFuel(d);
    if(d>jr){ info='<span class="neg">'+d+'pc — beyond J'+jr+'</span>'; }
    else if(G.fuel<need){ info='<span class="neg">'+d+'pc — needs '+need+'t fuel (have '+Math.floor(G.fuel)+'t)</span>'; }
    else { dis=false; info=d+'pc · '+need+'t fuel'+(G.fuelUnrefined?' (unrefined!)':'')+' · 1 week'; }
  }
  [['jumpbtn','jump-info','dest-name'],['jumpbtn-m','jump-info-m','dest-name-m']].forEach(ids=>{
    const b=document.getElementById(ids[0]), i=document.getElementById(ids[1]), n=document.getElementById(ids[2]);
    if(b)b.disabled=dis; if(i)i.innerHTML=info; if(n)n.textContent=dn;
  });
}

/* ---------- Modals ---------- */
function openModal(html){ document.getElementById('modal-body').innerHTML=html; document.getElementById('modal-bg').style.display='flex'; }
function closeModal(){ document.getElementById('modal-bg').style.display='none'; }
function showShip(){
  const s=SHIPS[G.ship];
  openModal('<h2>SHIP & OPERATIONS</h2>'+
    '<table><tbody>'+
    '<tr><td>Vessel</td><td>'+s.name+'</td></tr>'+
    '<tr><td>Cargo capacity</td><td>'+s.cargo+' tons ('+holdUsed()+' used)</td></tr>'+
    '<tr><td>Jump rating</td><td>J'+s.jump+'</td></tr>'+
    '<tr><td>Broker skill</td><td>'+s.broker+' (helps buy & sell)</td></tr>'+
    '<tr><td>Fuel tankage</td><td>'+(Math.floor(G.fuel*10)/10)+' / '+s.fuelCap+'t ('+(G.fuelUnrefined?'unrefined — misjump risk':'refined')+')</td></tr>'+
    '<tr><td>Jump fuel</td><td>'+jumpFuel()+'t per parsec (0.1 × '+s.hull+'t hull)</td></tr>'+
    '<tr><td>Power plant burn</td><td>'+s.plantWk+'t per week, even at dock</td></tr>'+
    '<tr><td>Mortgage</td><td>'+(s.mortgage?cr(s.mortgage)+' / month — 1/240 of the '+cr(s.price)+' hull (40-year note)':'none — paid off')+'</td></tr>'+
    '<tr><td>Crew salaries</td><td>'+(crewSalaries()?cr(crewSalaries())+' / month ('+G.crew.length+' crew)':'profit-share (no salary)')+'</td></tr>'+
    '<tr><td>Maintenance</td><td>'+(shipMaint()?cr(shipMaint())+' / month — 0.1%/yr of hull':'none')+'</td></tr>'+
    '<tr><td>Life support</td><td>'+cr(lifeSupport())+' / month — '+staterooms()+' stateroom'+(staterooms()>1?'s':'')+' @ Cr2,000</td></tr>'+
    '<tr><td><b>Total monthly burden</b></td><td><b>'+cr(monthlyTotal())+'</b> (billed every 4 weeks)</td></tr>'+
    '</tbody></table>'+
    '<p class="hint" style="margin-top:10px;">Running costs follow the Cepheus Engine: a 40-year mortgage, crew salaries, maintenance (0.1%/yr of the hull) and life support (Cr2,000 per stateroom), billed monthly. Miss too many runs and you fall behind the bank. The <b>Salvaged Hauler</b> is mortgage-free if you want a lower-stress game.</p>'+
    '<div style="margin-top:14px;text-align:right;"><button class="primary" onclick="closeModal()">Close</button></div>');
}
function showPeople(){
  const cast=(G.cast||[]).slice().sort((a,b)=>Math.abs(shipRel(b))-Math.abs(shipRel(a)));
  if(!cast.length){
    openModal('<h2>PEOPLE</h2><p class="hint">No one of note yet. Events introduce named characters as you trade and travel — search away from port, walk the port, make jumps.</p>'+
      '<div style="text-align:right;"><button class="primary" onclick="closeModal()">Close</button></div>');
    return;
  }
  const crewNames=G.crew.map(c=>c.name);
  const head='<tr><th>Person</th>'+crewNames.map(n=>'<th class="num" title="'+n+'">'+n.split(' ')[0]+'</th>').join('')+'<th class="num">Ship</th></tr>';
  const cell=v=>'<td class="num '+(v>0?'pos':v<0?'neg':'muted')+'">'+(v==null?'—':(v>0?'+':'')+v)+'</td>';
  const rows=cast.map(ch=>{
    const sv=shipRel(ch);
    const talk=ch.world===here().name?' <button style="padding:2px 8px;font-size:11px" onclick="showChat(\'cast\',\''+ch.name+'\')">Talk</button>':'';
    return '<tr><td><b>'+ch.name+'</b>'+talk+'<div class="hint">'+ch.role+' · '+(ch.resident?'lives on ':'met on ')+ch.world+
      (ch.traits?' · '+ch.traits.join(', '):'')+(ch.hp!=null&&ch.hp<ch.hpMax?' · '+hpWord(ch):'')+'</div>'+
      (ch.goals?'<div class="hint muted">talks about wanting to '+ch.goals.short.txt+'</div>':'')+'</td>'+
      crewNames.map(n=>cell(ch.rels[n])).join('')+
      '<td class="num '+(sv>0?'pos':sv<0?'neg':'muted')+'"><b>'+(sv>0?'+':'')+sv+'</b></td></tr>';
  }).join('');
  openModal('<h2>PEOPLE</h2>'+
    '<p class="hint">Named characters your crew has dealt with. Scores run −100 (blood feud) to +100 (sworn friend); a dash means that crew member has never dealt with them. The <b>Ship</b> column is the average of the crew scores.</p>'+
    '<div style="overflow-x:auto"><table><thead>'+head+'</thead><tbody>'+rows+'</tbody></table></div>'+
    '<div style="margin-top:12px;text-align:right;"><button class="primary" onclick="closeModal()">Close</button></div>');
}
function showCrew(){
  const s=SHIPS[G.ship];
  const cap=G.captain;
  const capCard=cap?('<div class="card" style="margin-bottom:8px;border-color:#2f6ea8"><div class="body">'+
    '<div class="row" style="justify-content:space-between"><b style="color:#dfe8f7">You — Captain</b>'+
    '<span class="pill">'+cap.hp+'/'+cap.hpMax+' '+hpWord(cap)+'</span></div>'+
    '<div class="hint">UPP <b style="letter-spacing:2px">'+cap.upp+'</b> · health is STR+DEX+END — injuries come off the pool; a Medic speeds recovery.</div>'+
    '</div></div>'):'';
  const cards=G.crew.map(c=>{
    const m=morale(c);
    const rel = c.rel.desc==='Loner' ? '<span class="muted">Loner — keeps to themselves</span>'
              : c.rel.desc+' <b>'+(c.rel.target||'a crewmate')+'</b>';
    const inv=(c.pubInv||[]).map(i=>i.tons+'t '+i.name).join(', ');
    return '<div class="card" style="margin-bottom:8px"><div class="body">'+
      '<div class="row" style="justify-content:space-between"><b style="color:#dfe8f7">'+c.name+'</b>'+
      '<span class="pill">'+c.position+'</span></div>'+
      '<div class="hint" style="margin:4px 0">UPP <b style="letter-spacing:2px">'+c.upp+'</b> · Age '+c.age+
      ' · '+(c.salary?cr(c.salary)+'/mo':'profit-share')+
      ' · <span class="'+(m>15?'pos':m<-15?'neg':'')+'">'+moraleWord(m)+'</span>'+
      ' · '+(c.down?'<span class="neg">in sickbay</span>':c.hp+'/'+c.hpMax+' '+hpWord(c))+
      (c.quitting?' · <span class="neg">GIVEN NOTICE</span>':'')+'</div>'+
      '<div style="margin:3px 0">'+c.skills.map(sk=>'<span class="code">'+sk+'</span>').join(' ')+
      ' '+(c.traits||[]).map(t=>'<span class="code" style="background:#2a2440;color:#c5a8ff">'+t+'</span>').join(' ')+'</div>'+
      (c.goals?'<div class="hint muted">talks about wanting to '+c.goals.short.txt+'</div>':'')+
      (inv?'<div class="hint">owns (declared): '+inv+'</div>':'')+
      '<div class="hint" style="margin-top:4px;color:#c5a8ff">⮡ '+rel+'</div>'+
      '<div class="row" style="margin-top:6px">'+
      '<button onclick="showChat(\'crew\',\''+c.name+'\')">Talk</button>'+
      '<button onclick="inspectQuarters(\''+c.name+'\')">Inspect quarters</button>'+
      '<button class="danger" onclick="fireCrew(\''+c.name+'\')">Dismiss</button>'+
      '</div></div></div>';
  }).join('');
  const sm=shipMorale();
  openModal('<h2>CREW ROSTER</h2>'+
    '<p class="hint">Aboard the <b>'+s.name+'</b>. Ship morale: <b class="'+(sm>15?'pos':sm<-15?'neg':'')+'">'+moraleWord(sm)+'</b>. '+
    'Morale is each member’s average relationship (−100..100) with the rest of the crew and with you — it drives what they do on their own time. Wallets and what they keep <i>under</i> the bunk are theirs to know.</p>'+
    capCard+cards+
    '<table><tbody><tr><td><b>Crew salary total</b></td><td class="num"><b>'+(crewSalaries()?cr(crewSalaries())+' / month':'profit-share (no salary)')+'</b></td></tr></tbody></table>'+
    '<div style="margin-top:14px;text-align:right;">'+
    ('ABC'.includes(here().u.sp)?'<button onclick="showRecruits()">Hiring hall</button> ':'')+
    '<button class="primary" onclick="closeModal()">Close</button></div>');
}
function showFinancials(){
  const b=G.books||emptyBooks();
  const inv=inventoryValue(), cash=G.credits, nw=netWorth();
  const income=b.sales+b.otherIncome;
  const expenses=-(b.cogs+b.fuel+b.mortgage+b.salaries+(b.overhead||0)+b.fines+b.incidentals+b.spoilage+(b.interest||0)+(b.shrinkage||0)); // these stored negative
  const net=income-expenses;
  const owed=(G.loans||[]).reduce((a,l)=>a+Math.round(l.P*(1+l.rate/100)),0)+(typeof billTotal==='function'?billTotal():0);
  const receivable=(G.lent||[]).filter(l=>!l.resolved).reduce((a,l)=>a+Math.round(l.P*(1+l.rate/100)),0);
  const row=(label,val,opt)=>'<tr><td>'+label+'</td><td class="num '+(val>=0?(opt&&opt.pos?'pos':''):'neg')+'">'+(val<0?'−':'')+'Cr'+Math.abs(Math.round(val)).toLocaleString('en-US')+'</td></tr>';
  const exp=(label,val)=>'<tr><td style="padding-left:14px" class="muted">'+label+'</td><td class="num">'+(val?'−Cr'+Math.abs(Math.round(val)).toLocaleString('en-US'):'—')+'</td></tr>';
  const inc=(label,val)=>'<tr><td style="padding-left:14px" class="muted">'+label+'</td><td class="num">'+(val?'+Cr'+Math.abs(Math.round(val)).toLocaleString('en-US'):'—')+'</td></tr>';
  const roi = G.startCredits? Math.round((nw-G.startCredits)/G.startCredits*100):0;
  openModal('<h2>FINANCIALS</h2>'+
   '<h3 style="color:#9fb4d6;border:none;background:none;padding:6px 0">Profit &amp; Loss <span class="pill">since founding · wk '+(Math.floor(G.day/7)+1)+'</span></h3>'+
   '<table><tbody>'+
     '<tr><td><b>Income</b></td><td></td></tr>'+
     inc('Cargo sales', b.sales)+
     (b.otherIncome?inc('Other income', b.otherIncome):'')+
     row('Total income', income,{pos:1})+
     '<tr><td><b>Expenses</b></td><td></td></tr>'+
     exp('Cost of goods sold', b.cogs)+
     exp('Fuel &amp; operations', b.fuel)+
     exp('Mortgage payments', b.mortgage)+
     exp('Crew salaries', b.salaries)+
     exp('Maintenance &amp; life support', b.overhead)+
     exp('Customs fines', b.fines)+
     exp('Cargo theft / spoilage', b.spoilage)+
     exp('Inventory shrinkage', b.shrinkage)+
     exp('Interest paid', b.interest)+
     exp('Incidentals', b.incidentals)+
     row('Total expenses', -expenses)+
     '<tr style="border-top:2px solid var(--grid)"><td><b>NET PROFIT / LOSS</b></td><td class="num '+(net>=0?'pos':'neg')+'"><b>'+(net<0?'−':'')+'Cr'+Math.abs(Math.round(net)).toLocaleString('en-US')+'</b></td></tr>'+
   '</tbody></table>'+
   '<h3 style="color:#9fb4d6;border:none;background:none;padding:10px 0 6px">Balance Sheet <span class="pill">today</span></h3>'+
   '<table><tbody>'+
     '<tr><td><b>Assets</b></td><td></td></tr>'+
     row('Cash on hand', cash)+
     '<tr><td style="padding-left:14px" class="muted">Cargo inventory (at cost)</td><td class="num">Cr'+Math.round(inv).toLocaleString('en-US')+'</td></tr>'+
     (receivable?'<tr><td style="padding-left:14px" class="muted">Receivables (loans out, at promise)</td><td class="num">Cr'+receivable.toLocaleString('en-US')+'</td></tr>':'')+
     (owed?'<tr><td style="padding-left:14px" class="muted neg">Liabilities (loans payable)</td><td class="num neg">−Cr'+owed.toLocaleString('en-US')+'</td></tr>':'')+
     '<tr style="border-top:1px solid var(--grid)"><td><b>Net worth (working capital)</b></td><td class="num '+(nw>=0?'pos':'neg')+'"><b>Cr'+Math.round(nw).toLocaleString('en-US')+'</b>'+(owed?' <span class="hint">(−'+'Cr'+owed.toLocaleString('en-US')+' debt)</span>':'')+'</td></tr>'+
     '<tr><td>Starting capital</td><td class="num muted">Cr'+G.startCredits.toLocaleString('en-US')+'</td></tr>'+
     row('Return on capital', nw-G.startCredits)+
     '<tr><td class="muted">ROI</td><td class="num '+(roi>=0?'pos':'neg')+'">'+roi+'%</td></tr>'+
   '</tbody></table>'+
   '<p class="hint" style="margin-top:8px;">Memo: ship hull '+(SHIPS[G.ship].price?cr(SHIPS[G.ship].price)+' financed on a 40-year note ('+cr(SHIPS[G.ship].mortgage)+'/mo)':'owned free and clear')+
   '. Net worth counts cash plus cargo at cost — it is the true scoreboard; the top-bar figure is banked cash only.</p>'+
   '<div style="margin-top:12px;text-align:right;"><button class="primary" onclick="closeModal()">Close</button></div>');
}
function showHelp(){
  openModal('<h2>HOW TO PLAY</h2>'+
   '<p>You are a free-trader captain. <b>Buy cargo low, jump, sell high.</b> Your running profit (top bar) is the score.</p>'+
   '<ol style="padding-left:18px;line-height:1.7">'+
   '<li><b>Search for cargo</b> at the current world. <i>At the starport</i> is quick; <i>away from port</i> is cheaper (and opens the black market) but takes longer and risks an encounter.</li>'+
   '<li><b>Buy</b> goods in the Market. Green prices are below base value — bargains. You’re limited by credits and hold space.</li>'+
   '<li><b>Pick a destination</b> on the <b>Star Map</b> tab — tap a world, then Jump right from the map. A world that <i>wants</i> your cargo pays more — its trade codes drive the resale price.</li>'+
   '<li><b>Jump.</b> Burns real fuel (0.1 × hull tons per parsec) and one week; a Jump Event fires. On arrival, <b>Sell</b> from your hold. <b>Refuel on the Bridge tab</b>: refined Cr500/t (A/B ports), unrefined Cr100/t (A–C, −2 misjump risk), or skim a gas giant / open water for free and purify with the onboard processors — a day each. The power plant sips fuel every week even at dock.</li>'+
   '<li>Repeat. Watch the <b>Ledger</b> on the right — it’s your captain’s diary.</li>'+
   '</ol>'+
   '<p class="hint"><b>Trade codes</b> (Ag, In, Hi, Ht, Ri…) on each world decide what’s produced cheaply and what sells dear. Example: buy <i>Textiles</i> on an <b>Ag</b> world, sell on a <b>Hi</b> or <b>Na</b> world.</p>'+
   '<p class="hint">Every few weeks your ship bills monthly upkeep. Illegal goods (black market) pay big but risk customs fines on worlds with high Law Level.</p>'+
   '<p class="hint"><b>Events have teeth.</b> World, Port and Jump events pop up as they happen and cost or earn real credits, time and cargo. Some present a <b>decision</b> — pick an option to continue (a decision can’t be dismissed). A history of recent events stays in the Bridge panel. Your <b>crew’s skills</b> (see Crew) are rolled to resolve many of them: a Medic prevents quarantines and doctor’s bills, an Engineer halves repair costs, the captain’s Leadership keeps morale (and your sale prices) up.</p>'+
   '<p class="hint"><b>Your crew are people.</b> Each has traits, three goals, hidden savings, a health pool (STR+DEX+END), and relationship scores (−100..100) with you and each other — the average is their <b>morale</b>, and it drives what they do on their own time: maintain the drive, work side jobs, run little trades from their quarters… or skim your cargo, smuggle passengers, sabotage a feuding crewmate’s handiwork, demand raises, and quit. Locals on every world (tap their names on the Current World card) request goods at a premium, offer and ask for <b>loans</b>, propose barters, and remember how you treat them — see <b>Commitments</b> on the Bridge tab for everything you owe and are owed.</p>'+
   '<p class="hint"><b>Optional AI (⚙ AI):</b> paste your own Anthropic API key to <b>talk with anyone</b> in freeform chat, have crew and locals react to your moves, and let Claude pick their actions in character. Without a key the built-in behavior engine runs everything the same — chat is the only thing that needs the key.</p>'+
   '<div style="margin-top:14px;text-align:right;"><button class="primary" onclick="closeModal()">Got it</button></div>');
}
function confirmNewGame(){
  openModal('<h2>NEW GAME</h2><p>Choose your starship. A fresh subsector will be generated.</p>'+
   Object.keys(SHIPS).map(k=>{const s=SHIPS[k];
    const tmpl=CREW_TMPL[k]||[]; const sal=tmpl.reduce((a,t)=>a+t[1],0);
    const over=Math.round((s.price||0)*0.001/12)+s.rooms*2000;
    const upkeep=(s.mortgage||0)+sal+over;
    return '<div class="card" style="margin-bottom:8px;cursor:pointer" onclick="startWith(\''+k+'\')">'+
     '<div class="body"><b>'+s.name+'</b><div class="hint">'+s.cargo+'t hold · J'+s.jump+' · fuel '+s.fuelCap+'t · '+
     s.rooms+' staterooms · crew '+tmpl.length+' · broker '+s.broker+'</div>'+
     '<div class="hint">'+cr(upkeep)+'/mo upkeep'+(s.mortgage?' ('+cr(s.mortgage)+' mortgage on the '+cr(s.price)+' hull)':' — owned outright')+'</div></div></div>';}).join('')+
   '<div style="text-align:right;"><button onclick="closeModal()">Cancel</button></div>');
}
function startWith(k){ closeModal(); newGame(k); }

