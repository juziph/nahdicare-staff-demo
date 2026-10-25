"use strict";
/* NahdiCare PRE-PLANNED leave-first rota optimizer. Simulation only, not an HR system. */
(()=>{
 const scenario={leaves:[],swaps:[],report:null,generated:false,revision:0,open:false,initial:null};
 const ROLES=[
  ["off","m1","m1","m1","m1","m1","m1"],
  ["m2","m2","off","m2","m2","m2","m2"],
  ["m2","m2","m2","off","m2","m2","m2"],
  ["n","off","n","n","n","n","n"],
  ["off","e1","e1","e1","e1","e1","e1"],
  ["e2","n","off","e2","e2","e2","e2"],
  ["e3","e3","e3","off","e3","e3","e3"],
  ["e1","e1","e1","e1","off","e1","e1"],
  ["e3","e3","e3","e3","e3","off","e3"]
 ];
 const isWork=k=>k&&k!=="off"&&k!=="al"&&Boolean(types[k]?.start);
 function hour(t){const [clock,ap]=t.split(" "),[h,m]=clock.split(":").map(Number);return h%12+(ap==="PM"?12:0)+m/60}
 const start=k=>hour(types[k].start),end=k=>hour(types[k].end)+(hour(types[k].end)<=hour(types[k].start)?24:0);
 const rest=(before,after)=>!isWork(before)||!isWork(after)||24+start(after)-end(before)>=11-1e-6;
 const weekNum=d=>Math.floor((d-1)/7);
 const leaveOn=(p,d)=>d>=1&&d<=30&&scenario.leaves.some(l=>l.p===p&&l.from<=d&&l.to>=d);
 const previous=()=>scenario.initial||{};
 const init=()=>{if(!scenario.initial)scenario.initial={...appState.overrides}};
 function baseline(day){
  const codes=ROLES.map(r=>r[(day-1)%7]);
  return {
    morning:codes.filter(c=>c==="m1"||c==="m2").length,
    evening:codes.filter(c=>c[0]==="e").length,
    night:codes.filter(c=>c==="n").length,
    pediatrics:codes.filter(c=>c==="e1").length
  }
 }
 function penalty(p,role,week){
  let missing=0;
  for(let dow=0;dow<7;dow++){
   const day=week*7+dow+1;
   if(!leaveOn(p,day))continue;
   const code=ROLES[role][dow];if(!isWork(code))continue;
   const totals=baseline(day);
   if(code[0]==="m")missing+=totals.morning<=2?28000:340;
   else if(code==="n")missing+=totals.night<=1?38000:180;
   else if(code[0]==="e"){
    missing+=totals.evening<=3?27000:240;
    if(code==="e1"&&new Date(Date.UTC(2026,10,day,12)).getUTCDay()===5&&totals.pediatrics<=2)missing+=32000;
   }
  }
  return missing;
 }
 function assignWeek(week,last,hist){
  const costs=Array.from({length:9},()=>Array(9).fill(Infinity));
  for(let role=0;role<9;role++)for(let p=0;p<9;p++){
   if(last&&!rest(last[p],ROLES[role][0]))continue;
   const h=hist[p];let fairness=0;
   if(role===3)fairness+=h.night*26;
   else if(role===5)fairness+=h.nightRelief*22+h.night*10;
   else if(role<3)fairness+=h.morning*11;
   else fairness+=h.evening*5;
   const category=role<3?"m":role===3?"n":"e";
   if(h.prevRole===role)fairness+=4;
   if(h.prevCategory&&h.prevCategory!==category)fairness+=3;
   costs[role][p]=fairness+penalty(p,role,week)+(p*13+role*7+week*11)%19*.001;
  }
  // Dynamic-programming bipartite assignment. Leavers are allocated to surplus slots first.
  const memo=new Map();
  function solve(mask){
   const role=mask.toString(2).replace(/0/g,"").length;
   if(role===9)return {total:0,assignment:[]};
   if(memo.has(mask))return memo.get(mask);
   let best=null;
   for(let p=0;p<9;p++){
    if(mask&(1<<p)||!Number.isFinite(costs[role][p]))continue;
    const suffix=solve(mask|(1<<p));if(!suffix)continue;
    const score=costs[role][p]+suffix.total;
    if(!best||score<best.total)best={total:score,assignment:[p,...suffix.assignment]};
   }
   memo.set(mask,best);return best;
  }
  const solution=solve(0);
  if(!solution)return {assignment:null,reason:"تعذر توليد توزيع أسبوعي مع فاصل راحة آمن عند الانتقال من الأسبوع السابق."};
  return {assignment:solution.assignment};
 }
 function matrixFromAssignments(allWeeks){
  const matrix=Array.from({length:9},()=>Array(35).fill("off"));
  for(let w=0;w<allWeeks.length;w++)for(let role=0;role<9;role++){
   const p=allWeeks[w][role];
   for(let dow=0;dow<7;dow++){
    const day=w*7+dow+1;
    matrix[p][day-1]=leaveOn(p,day)?"al":ROLES[role][dow];
   }
  }
  return matrix;
 }
 function check(matrix){
  const daily=[],restProblems=[],hours=[];
  for(let day=1;day<=30;day++){
   const x=Array.from({length:9},(_,p)=>matrix[p][day-1]);
   const weekday=new Date(Date.UTC(2026,10,day,12)).getUTCDay();
   const morning=x.filter(c=>c==="m1"||c==="m2").length;
   const evening=x.filter(c=>c==="e1"||c==="e2"||c==="e3").length;
   const night=x.filter(c=>c==="n").length;
   const pediatrics=x.filter(c=>c==="e1").length;
   const off=x.filter(c=>c==="off").length,annual=x.filter(c=>c==="al").length;
   const lacks=[];
   if(morning<2)lacks.push("صباحي "+(2-morning));
   if(evening<3)lacks.push("مسائي "+(3-evening));
   if(night<1)lacks.push("ليلي "+(1-night));
   if(weekday===5&&pediatrics<2)lacks.push("أطفال الجمعة "+(2-pediatrics));
   if(off>2&&annual===0)lacks.push("تكدس OFF");
   daily.push({day,morning,evening,night,off,annual,pediatrics,lacks});
  }
  for(let p=0;p<9;p++){
   let workingDays=0;
   for(let day=1;day<=30;day++){
    if(isWork(matrix[p][day-1]))workingDays++;
    if(day<30&&!rest(matrix[p][day-1],matrix[p][day]))restProblems.push({p,day});
   }
   hours.push(workingDays*8);
  }
  const gaps=daily.filter(v=>v.lacks.length);
  return {daily,gaps,restProblems,hours,hasGaps:gaps.length>0};
 }
 function assignInitial(){
  const hist=Array.from({length:9},()=>({morning:0,evening:0,night:0,nightRelief:0,prevRole:null,prevCategory:null}));
  const plans=[];let last=null;
  for(let w=0;w<5;w++){
   const result=assignWeek(w,last,hist);
   if(!result.assignment)return {ok:false,error:result.reason,week:w+1};
   const assigned=result.assignment;
   plans.push(assigned);
   last=Array(9).fill("off");
   for(let role=0;role<9;role++){
    const p=assigned[role],h=hist[p],category=role<3?"m":role===3?"n":"e";
    if(role<3)h.morning++;
    else if(role===3)h.night++;
    else h.evening++;
    if(role===5)h.nightRelief++;
    h.prevRole=role;h.prevCategory=category;last[p]=ROLES[role][6];
   }
  }
  const matrix=matrixFromAssignments(plans);
  const audit=check(matrix);
  return {ok:true,matrix,plans,audit};
 }
 function publish(matrix){
  const map={};
  for(let p=0;p<9;p++)for(let day=1;day<=30;day++)map[p+"-"+day]=matrix[p][day-1];
  appState.overrides=map;
 }
 function generate(){
  if(appState.role!=="owner")return {ok:false,error:"التوليد متاح للمسؤول الرئيسي في هذه التجربة."};
  init();
  const result=assignInitial();
  if(!result.ok)return result;
  scenario.swaps=[];scenario.report=result;scenario.generated=true;scenario.revision++;
  publish(result.matrix);
  return {ok:true,report:result};
 }
 function leavePlan(p,from,to){
  if(appState.role!=="owner")return {ok:false,error:"تخطيط الإجازات متاح لحسابك فقط."};
  if(!Number.isInteger(p)||p<0||p>8||!Number.isInteger(from)||!Number.isInteger(to)||from<1||to>30||from>to)return {ok:false,error:"حدد موظفًا وتاريخ بداية ونهاية صحيحين في نوفمبر."};
  if(scenario.leaves.some(l=>l.p===p&&l.from<=to&&l.to>=from))return {ok:false,error:"توجد خطة متداخلة للموظف نفسه."};
  scenario.leaves.push({id:Date.now()+scenario.revision+scenario.leaves.length,p,from,to});
  if(scenario.initial)appState.overrides={...scenario.initial};
  scenario.swaps=[];scenario.generated=false;scenario.report=null;scenario.revision++;
  return {ok:true};
 }
 function clearPlan(id){
  if(appState.role!=="owner")return;
  scenario.leaves=scenario.leaves.filter(l=>l.id!==id);
  if(scenario.initial)appState.overrides={...scenario.initial};
  scenario.swaps=[];scenario.generated=false;scenario.report=null;scenario.revision++;
 }
 function trySwap(a,b,week){
  if(appState.role!=="owner")return {ok:false,error:"تبديل الشفتات متاح للمسؤول الرئيسي فقط."};
  if(!scenario.generated)return {ok:false,error:"ولّد جدول الشهر بعد تحديد الإجازات أولًا."};
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>8||b>8||a===b||!Number.isInteger(week)||week<0||week>4)return {ok:false,error:"حدد موظفين مختلفين وأسبوعًا صحيحًا."};
  const matrix=scenario.report.matrix.map(r=>r.slice());
  const from=week*7+1,to=Math.min(30,from+6);
  for(let day=from;day<=to;day++){
   if(matrix[a][day-1]==="al"||matrix[b][day-1]==="al")return {ok:false,error:"لا يجوز نقل الإجازة المعتمدة مع الشفت. اختر موظفين لا توجد لهم إجازة في هذا الأسبوع."};
   [matrix[a][day-1],matrix[b][day-1]]=[matrix[b][day-1],matrix[a][day-1]];
  }
  const old=scenario.report.audit,newAudit=check(matrix);
  const previousRest=new Set(old.restProblems.map(v=>v.p+"-"+v.day));
  if(newAudit.restProblems.some(v=>!previousRest.has(v.p+"-"+v.day)))return {ok:false,error:"رفض التبديل: يُحدث فاصل راحة أقل من 11 ساعة."};
  const previousGaps=new Map(old.gaps.map(v=>[v.day,new Set(v.lacks)]));
  if(newAudit.gaps.some(v=>v.lacks.some(lack=>!previousGaps.get(v.day)?.has(lack))))return {ok:false,error:"رفض التبديل: يزيد العجز في تغطية المناوبات."};
  scenario.report={...scenario.report,matrix,audit:newAudit};
  scenario.swaps.push({week,a,b});scenario.revision++;publish(matrix);
  return {ok:true,report:scenario.report};
 }
 function reset(){
  if(appState.role!=="owner")return {ok:false};
  if(scenario.initial)appState.overrides={...scenario.initial};
  scenario.leaves=[];scenario.swaps=[];scenario.report=null;scenario.generated=false;
  scenario.initial=null;scenario.revision++;return {ok:true};
 }
 function options(selected=0){
  return people.map((n,i)=>'<option value="'+i+'" '+(selected===i?"selected":"")+'>'+safe(n)+'</option>').join("");
 }
 function dayChoices(selected){
  return Array.from({length:30},(_,i)=>'<option value="'+(i+1)+'" '+(selected===i+1?"selected":"")+'>'+(i+1)+' نوفمبر</option>').join("");
 }
 function reportUI(){
  if(!scenario.generated)return '<p class="scenario-tip">لم يتم توليد الجدول بعد تحديد الإجازات الجديدة. اضغط «إنشاء الجدول» لتوزيع المناوبات على المتاحين أولًا.</p>';
  const audit=scenario.report.audit,missing=audit.gaps;
  const title=missing.length?"⚠ "+missing.length+" يومًا فيه عجز":"✓ تغطية كاملة وفق الحدود الدنيا المعرفة";
  const success=missing.length?"scenario-alert":"scenario-good";
  let html='<div class="'+success+'"><b>'+title+'</b><p>'+
   'الشفتات تُبنى بعد احتساب الإجازات، وليس بإزالة موظف من جدول جاهز. الفحص: صباحي 2، مسائي 3، ليلي 1، والجمعة موظفان من 1 إلى 9 مساءً.</p></div>';
  html+='<div class="scenario-kpis">'+
   '<div><strong>'+scenario.leaves.length+'</strong><small>خطط إجازة أدخلت مسبقًا</small></div>'+
   '<div><strong>'+audit.gaps.length+'</strong><small>أيام غير مكتملة</small></div>'+
   '<div class="'+(audit.restProblems.length?"kpi-alert":"")+'"><strong>'+audit.restProblems.length+'</strong><small>فواصل راحة أقل من 11 ساعة</small></div>'+
   '<div><strong>'+Math.min(...audit.hours)+'–'+Math.max(...audit.hours)+'</strong><small>ساعات عمل فردية بالشهر</small></div></div>';
  if(missing.length)html+='<details class="scenario-details"><summary>الأيام غير المغطاة</summary>'+
      missing.map(r=>'<div>'+r.day+' نوفمبر: '+r.lacks.join("، ")+'</div>').join("")+'</details>';
  if(scenario.swaps.length)html+='<p class="scenario-tip">تعديلات ما بعد إصدار الجدول: '+scenario.swaps.length+' تبديل أسبوعي تجريبي.</p>';
  return html;
 }
 function panel(){
  if(appState.role!=="owner")return "";
  let html='<details class="scenario-panel" '+(scenario.open?"open":"")+'><summary class="scenario-title"><span class="scenario-title-icon">⚙</span><div><b>محرك الجدولة الذكي</b><small>أدخل الإجازات السنوية أولًا ← أنشئ الجدول ← افحص العجز واعتمد النتيجة لاحقًا</small></div></summary>';
  html+='<div class="scenario-heading">1. الإجازات المحددة قبل إنشاء الجدول</div>';
  html+='<div class="scenario-form"><label>الموظف<select id="sim-leave-person">'+options()+'</select></label>'+
   '<label>من يوم<select id="sim-leave-from">'+dayChoices(1)+'</select></label>'+
   '<label>إلى يوم<select id="sim-leave-to">'+dayChoices(30)+'</select></label></div>';
  html+='<div class="scenario-actions"><button type="button" class="scenario-outline" id="sim-full-month">شهر كامل للاختبار</button>'+
   '<button type="button" class="scenario-action" id="sim-leave">إضافة إلى خطة الإجازات</button></div>';
  html+='<p class="scenario-tip">هذه تجربة نوفمبر 2026 فقط. إجازة شهر كامل تتجاوز رصيد 21 يومًا بعد استبعاد الجمعات؛ تُستخدم لاختبار نقص العدد، ولا تعتبر موافقة سنوية. لا تُرسل طلبات فعلية.</p>';
  if(scenario.leaves.length){
   html+='<div class="scenario-items">'+scenario.leaves.map(l=>'<div><span>'+safe(people[l.p])+' · '+l.from+'–'+l.to+' نوفمبر</span><button data-sim-remove-leave="'+l.id+'">حذف</button></div>').join("")+'</div>';
  }
  html+='<div class="scenario-heading">2. إنشاء جدول الشهر حسب الموظفين المتاحين</div>'+
    '<button type="button" class="scenario-action" id="sim-generate">إنشاء جدول جديد وفحص تغطيته</button>';
  html+=reportUI();
  html+='<div class="scenario-heading">3. تبديل شفت أسبوع بعد إصدار الجدول (صلاحيتك)</div>';
  const weekOptions=Array.from({length:5},(_,i)=>'<option value="'+i+'" '+(i===appState.week?"selected":"")+'>'+String(i+1)+' · '+(i*7+1)+'–'+Math.min(30,i*7+7)+' نوفمبر</option>').join("");
  html+='<div class="scenario-form"><label>الأسبوع<select id="sim-week">'+weekOptions+'</select></label>'+
     '<label>الموظف الأول<select id="sim-first">'+options(0)+'</select></label>'+
     '<label>الموظف الثاني<select id="sim-second">'+options(1)+'</select></label></div>'+
     '<button type="button" class="scenario-outline" id="sim-swap" '+(!scenario.generated?"disabled":"")+' >تبديل الأسبوع مع فحص التغطية والراحة</button>';
  html+='<div style="margin-top:16px"><button class="scenario-outline" id="sim-reset">مسح خطة التجربة والعودة للجدول الأصلي</button></div>';
  html+='<p class="scenario-tip">المحاكاة ليست اعتماد دوام رسميًا. الصلاحيات هنا للمعاينة فقط؛ التطبيق الفعلي يحتاج تسجيل دخول محميًا وخادمًا مشتركًا.</p></details>';
  return html;
 }
 const oldTeam=teamPage;
 teamPage=function(){
  let html=oldTeam();
  if(appState.role==="owner")html=html.replace('<div class="card roster-card">',panel()+'<div class="card roster-card">');
  return html;
 };
 const oldAdmin=adminPage;
 adminPage=function(){
  let html=oldAdmin();
  if(appState.role==="owner")html+='<div class="card" style="margin-top:14px"><h3>إعداد الجدول بعد اعتماد الإجازات</h3><p class="note">أدخل خطط الإجازات أولًا، ثم أنشئ توزيعًا جديدًا يفحص الصباح والمساء والليل والجمعة.</p><button type="button" class="primary" data-page="team">فتح المحرك في جدول الفريق</button></div>';
  return html;
 };
 document.addEventListener("click",event=>{
  if(appState.role!=="owner")return;
  const heading=event.target.closest(".scenario-title");
  if(heading){scenario.open=!scenario.open;return}
  const b=event.target.closest("#sim-full-month,#sim-leave,#sim-generate,#sim-swap,#sim-reset,[data-sim-remove-leave]");
  if(!b)return;
  if(b.id==="sim-full-month"){
   document.querySelector("#sim-leave-from").value="1";
   document.querySelector("#sim-leave-to").value="30";
   toast("اخترت نوفمبر كاملًا للمحاكاة فقط.");return;
  }
  if(b.id==="sim-leave"){
   const result=leavePlan(Number(document.querySelector("#sim-leave-person").value),Number(document.querySelector("#sim-leave-from").value),Number(document.querySelector("#sim-leave-to").value));
   toast(result.ok?"حُفظت فترة الإجازة داخل خطة التجربة. الآن أنشئ الجدول.":result.error);if(result.ok)render();return;
  }
  if(b.id==="sim-generate"){
   const result=generate();toast(result.ok?"أُنشئ جدول جديد بناءً على خطط الإجازات المحددة مسبقًا.":result.error);if(result.ok)render();return;
  }
  if(b.id==="sim-swap"){
   const result=trySwap(Number(document.querySelector("#sim-first").value),Number(document.querySelector("#sim-second").value),Number(document.querySelector("#sim-week").value));
   toast(result.ok?"تم تبديل الأسبوع ضمن جدول التجربة.":result.error);if(result.ok)render();return;
  }
  if(b.id==="sim-reset"){reset();toast("تمت إعادة جدول العرض الأصلي.");render();return}
  if(b.hasAttribute("data-sim-remove-leave")){clearPlan(Number(b.dataset.simRemoveLeave));render()}
 });
 window.NahdiScenarioDebug={scenario,generate,leavePlan,trySwap,reset,check,assignInitial,ROLES};
 if(appState.role&&appState.page==="team")render();
})();