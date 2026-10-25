"use strict";
/* Coverage-first illustrative roster. Never use as an official staff rota without management review. */
(()=>{
  // Sunday–Saturday weekly groups. Each slot is one 8-hour shift on 6 days.
  const slotShifts=[
    ["m1","off","m1","m1","m1","m1","m1"], // two early staff always present even when a morning worker has OFF
    ["m1","m1","off","m1","m1","m1","m1"],
    ["m1","m1","m1","off","m1","m1","m1"],
    ["n","n","n","n","off","n","n"],
    ["off","e1","e1","e1","e1","e1","e1"],  // Friday 13:00–21:00
    ["e2","e2","e2","e2","n","off","e2"],   // Thursday night relief, Friday OFF
    ["e3","e3","e3","e3","e3","off","e3"],
    ["e1","e1","e1","e1","e1","e1","off"],  // second Friday 13:00–21:00
    ["e3","e3","e3","e3","e3","e3","off"]
  ];
  const weeks=5,peopleCount=people.length,weekAssignments=[];
  const history=Array.from({length:peopleCount},()=>({morning:0,night:0,nightRelief:0,evening:0,last:-1}));
  function h(time){
    const [part,meridiem]=time.split(" "),[hh,mm]=part.split(":").map(Number);
    return (hh%12)+(meridiem==="PM"?12:0)+mm/60;
  }
  const starts=k=>h(types[k].start);
  const ends=k=>h(types[k].end)+(h(types[k].end)<=h(types[k].start)?24:0);
  const isWork=k=>k!=="off"&&k!=="al"&&!!types[k]?.start;
  function safeTransition(prevCode,nextCode){
    if(!prevCode||!isWork(prevCode)||!isWork(nextCode))return true;
    return 24+starts(nextCode)-ends(prevCode)>=11-1e-6;
  }
  function roleCost(slot,p,week){
    const hist=history[p];
    let cost=0;
    if(slot===3)cost+=hist.night*140+hist.nightRelief*20;
    else if(slot===5)cost+=hist.nightRelief*75+hist.night*35;
    else if(slot<3)cost+=hist.morning*20;
    else cost+=hist.evening*8;
    if(hist.last===slot)cost+=12;
    if(hist.last>=0&&slot<3&&hist.last<3)cost+=3;
    return cost+((p*13+slot*7+week*11)%17)*.01;
  }
  function solveWeek(week,prevSat){
    if(week===0)return Array.from({length:peopleCount},(_,i)=>i);
    const cache=new Map();
    function solve(slot,mask){
      if(slot===9)return {score:0,assign:[]};
      const key=(slot<<10)|mask;
      if(cache.has(key))return cache.get(key);
      let best={score:Infinity,assign:null};
      for(let p=0;p<peopleCount;p++){
        if(mask&(1<<p))continue;
        if(!safeTransition(prevSat[p],slotShifts[slot][0]))continue;
        const next=solve(slot+1,mask|(1<<p));
        const cost=roleCost(slot,p,week)+next.score;
        if(next.assign&&cost<best.score)best={score:cost,assign:[p,...next.assign]};
      }
      cache.set(key,best);
      return best;
    }
    const solved=solve(0,0);
    if(!solved.assign)throw new Error("No safe weekly rotation meets rest constraints.");
    return solved.assign;
  }
  let sat=Array(peopleCount).fill(null);
  for(let w=0;w<weeks;w++){
    const assignment=solveWeek(w,sat);
    weekAssignments.push(assignment);
    for(let slot=0;slot<9;slot++){
      const p=assignment[slot],hist=history[p];
      if(slot<3)hist.morning++;
      else if(slot===3)hist.night++;
      else hist.evening++;
      if(slot===5)hist.nightRelief++;
      hist.last=slot;
      sat[p]=slotShifts[slot][6];
    }
  }
  const fixedMatrix=Array.from({length:9},()=>Array(35).fill("off"));
  for(let week=0;week<5;week++)for(let slot=0;slot<9;slot++)for(let dow=0;dow<7;dow++){
    const person=weekAssignments[week][slot],day=week*7+dow;
    fixedMatrix[person][day]=slotShifts[slot][dow];
  }
  const originalGetShift=getShift;
  getShift=function(person,day){
    if(!Number.isInteger(person)||person<0||person>=9||!Number.isInteger(day)||day<1||day>35)return "off";
    return fixedMatrix[person][day-1];
  };
  function dailyAudit(day,matrix){
    const shifts=Array.from({length:9},(_,p)=>matrix?.[p]?.[day-1]||getShift(p,day));
    const morning=shifts.filter(x=>x==="m1"||x==="m2").length;
    const evening=shifts.filter(x=>x==="e1"||x==="e2"||x==="e3").length;
    const night=shifts.filter(x=>x==="n").length;
    const off=shifts.filter(x=>x==="off").length;
    const annual=shifts.filter(x=>x==="al").length;
    const friday=(new Date(Date.UTC(2026,10,day,12))).getUTCDay()===5;
    const pediatrics=shifts.filter(x=>x==="e1").length;
    const problems=[];
    if(morning<2)problems.push("نقص الصباح");
    if(night<1)problems.push("نقص الليل");
    if(evening<3)problems.push("نقص المساء");
    if(friday&&pediatrics<2)problems.push("نقص تغطية الجمعة 1–9");
    if(off>2)problems.push("تكدس أيام الراحة");
    return {day,morning,evening,night,off,annual,friday,pediatrics,problems};
  }
  function validateBase(){
    const problems=[];
    for(let d=1;d<=35;d++){
      const a=dailyAudit(d);
      if(a.problems.length)problems.push({day:d,problems:a.problems});
    }
    for(let w=0;w<5;w++)for(let p=0;p<9;p++){
      const codes=fixedMatrix[p].slice(w*7,w*7+7);
      if(codes.filter(x=>x==="off").length!==1)problems.push({week:w+1,employee:p,error:"not exactly one OFF"});
      if(codes.filter(isWork).length!==6)problems.push({week:w+1,employee:p,error:"not exactly 6 shifts"});
    }
    for(let p=0;p<9;p++)for(let d=1;d<35;d++){
      if(!safeTransition(fixedMatrix[p][d-1],fixedMatrix[p][d]))problems.push({employee:p,day:d,error:"rest less than 11h"});
    }
    return problems;
  }
  const baseErrors=validateBase();
  if(baseErrors.length)throw Error("Coverage-first roster failed validation: "+JSON.stringify(baseErrors.slice(0,5)));
  function currentAudit(){
    const full=Array.from({length:9},(_,p)=>Array.from({length:30},(_,i)=>appState.overrides[p+"-"+(i+1)]||getShift(p,i+1)));
    return Array.from({length:30},(_,i)=>dailyAudit(i+1,full));
  }
  function panel(){
    const all=currentAudit();
    const broken=all.filter(x=>x.problems.length);
    const activeScenario=window.NahdiScenarioDebug?.scenario?.swaps?.length||window.NahdiScenarioDebug?.scenario?.leaves?.length;
    const stamp='<span class="coverage-tag '+(broken.length?"coverage-bad":"coverage-good")+'">'+
      (broken.length?"⚠ "+broken.length+" يومًا يحتاج مراجعة":"✓ تغطية الحدود الدنيا طوال الشهر")+'</span>';
    const chosen=appState.view==="month"?all:appState.view==="day"?all.filter(x=>x.day===appState.day):all.filter(x=>Math.floor((x.day-1)/7)===appState.week);
    let view='<section class="coverage-panel"><div class="coverage-head"><div><b>فحص التغطية اليومية</b><small>حد أدنى: صباحي 2، ليلي 1، مسائي 3، والجمعة موظفان من 1–9 م</small></div>'+stamp+'</div>';
    view+='<div class="coverage-mini">'+chosen.map(x=>'<div class="coverage-day '+(x.problems.length?"coverage-warn":"")+'"><b>'+x.day+' NOV</b><small>ص '+x.morning+' · م '+x.evening+' · ل '+x.night+'</small><small>راحة '+x.off+(x.annual?" · إجازة "+x.annual:"")+'</small></div>').join("")+'</div>';
    if(broken.length){
      view+='<div class="coverage-warning">⚠️ توجد أيام لا تستوفي الحد الأدنى المقترح. يجب معالجة العجز قبل اعتماد أو مشاركة جدول رسمي.'+
       '<details><summary>عرض الأيام المتأثرة</summary>'+broken.slice(0,31).map(x=>'<p>'+x.day+' نوفمبر: '+x.problems.join("، ")+'</p>').join("")+'</details></div>';
    }else if(!activeScenario)view+='<p class="coverage-footnote">الجدول النموذجي اجتاز فحص الحد الأدنى للعدد، ويوم الراحة الأسبوعي، وفواصل الراحة 11 ساعة. لم يعتمد رسميًا بعد.</p>';
    else view+='<p class="coverage-footnote">المحاكاة الحالية لم تكشف عجزًا وفق هذه الحدود الدنيا، لكن يلزم اعتماد الإدارة قبل التطبيق.</p>';
    return view+'</section>';
  }
  const previousTeam=teamPage;
  teamPage=function(){
    let html=previousTeam();
    html=html.replace('<div class="card roster-card">',panel()+'<div class="card roster-card">');
    return html;
  };
  window.NahdiCoverage={fixedMatrix,weekAssignments,dailyAudit,validateBase,currentAudit};
  if(appState.role&&appState.page==="team")render();
})();