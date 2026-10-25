"use strict";
/* NahdiCare scheduling sandbox, month of November 2026. Not a production authorization boundary. */
(()=>{
const scenario={swaps:[],leaves:[],baseOverrides:null,report:null,revision:0,open:false};
const stamp=d=>new Date(Date.UTC(2026,10,d,12));
const hr=t=>{const [clock,suffix]=t.split(" ");let [h,m]=clock.split(":").map(Number);if(suffix==="PM"&&h!==12)h+=12;if(suffix==="AM"&&h===12)h=0;return h+m/60};
const working=code=>code!=="off"&&code!=="al"&&Boolean(types[code]?.start);
const startOf=(code,d)=>d*24+hr(types[code].start);
const endOf=(code,d)=>d*24+hr(types[code].end)+(hr(types[code].end)<=hr(types[code].start)?24:0);
const weekOf=d=>Math.floor((d-1)/7);
const index=(p,d)=>p*30+d-1;
const raw=(p,d)=>scenario.baseOverrides?.[p+"-"+d]||getShift(p,d);
function baseMatrix(){
 return Array.from({length:9},(_,p)=>Array.from({length:30},(_,i)=>raw(p,i+1)));
}
function applySwap(matrix,swap){
 const from=swap.week*7+1,to=Math.min(30,from+6);
 for(let d=from;d<=to;d++){
  const temp=matrix[swap.a][d-1];matrix[swap.a][d-1]=matrix[swap.b][d-1];matrix[swap.b][d-1]=temp;
 }
}
function buildBeforeLeave(swaps=scenario.swaps){
 const matrix=baseMatrix();for(const swap of swaps)applySwap(matrix,swap);return matrix;
}
function gapViolations(matrix,peopleToCheck){
 const result=[];
 for(const p of peopleToCheck)for(let d=1;d<30;d++){
  const x=matrix[p][d-1],y=matrix[p][d];
  if(!working(x)||!working(y))continue;
  const gap=startOf(y,d+1)-endOf(x,d);
  if(gap<11)result.push({p,d,gap:Math.round(gap*10)/10});
 }
 return result;
}
function restSafe(matrix,p,day,proposed){
 if(!working(proposed))return false;
 let previous=null,next=null;
 for(let d=day-1;d>=1;d--){const code=matrix[p][d-1];if(working(code)){previous={d,code};break}}
 for(let d=day+1;d<=30;d++){const code=matrix[p][d-1];if(working(code)){next={d,code};break}}
 if(previous&&startOf(proposed,day)-endOf(previous.code,previous.d)<11)return false;
 if(next&&startOf(next.code,next.d)-endOf(proposed,day)<11)return false;
 return true;
}
function workWeekCount(matrix,p,day){
 const start=weekOf(day)*7+1,end=Math.min(30,start+6);
 let count=0;for(let d=start;d<=end;d++)if(working(matrix[p][d-1]))count++;
 return count;
}
function isLeave(p,d,leaves=scenario.leaves){return leaves.some(l=>l.p===p&&l.from<=d&&l.to>=d)}
function compute(){
 const before=buildBeforeLeave();
 const m=before.map(r=>r.slice());
 const vacancies=[];
 for(let p=0;p<9;p++)for(let d=1;d<=30;d++)if(isLeave(p,d)){
   if(working(m[p][d-1]))vacancies.push({p,d,code:m[p][d-1]});
   m[p][d-1]="al";
 }
 // Coverage is proposed only from available OFF assignments, preserving one weekly OFF
 // and at least 11h between rostered shifts; no double booking or paid overtime assumed.
 vacancies.sort((a,b)=>a.d-b.d||(
   ["n","m1","m2","e2","e3","e1"].indexOf(a.code)-
   ["n","m1","m2","e2","e3","e1"].indexOf(b.code)));
 const filled=[],uncovered=[];
 for(const missing of vacancies){
  const candidates=[];
  for(let p=0;p<9;p++){
    if(p===missing.p||isLeave(p,missing.d))continue;
    if(m[p][missing.d-1]!=="off")continue;
    if(workWeekCount(m,p,missing.d)>=6)continue;
    if(!restSafe(m,p,missing.d,missing.code))continue;
    let recent=0;
    for(let q=Math.max(1,missing.d-4);q<=Math.min(30,missing.d+4);q++){
      if(q!==missing.d&&m[p][q-1]===missing.code)recent++;
    }
    const weekBias=workWeekCount(m,p,missing.d);
    candidates.push({p,score:recent*50-weekBias*2});
  }
  candidates.sort((a,b)=>b.score-a.score||a.p-b.p);
  if(candidates.length){
    const substitute=candidates[0].p;m[substitute][missing.d-1]=missing.code;
    filled.push({...missing,substitute});
  }else uncovered.push(missing);
 }
 const different=[],shiftCounts={morning:0,evening:0,night:0};
 for(let p=0;p<9;p++)for(let d=1;d<=30;d++)if(m[p][d-1]!==raw(p,d))different.push({p,d,from:raw(p,d),to:m[p][d-1]});
 for(const vacancy of uncovered){
  if(vacancy.code==="n")shiftCounts.night++;
  else if(vacancy.code.startsWith("m"))shiftCounts.morning++;
  else shiftCounts.evening++;
 }
 const restProblems=gapViolations(m,[0,1,2,3,4,5,6,7,8]);
 const baseProblems=gapViolations(baseMatrix(),[0,1,2,3,4,5,6,7,8]);
 const baseKeys=new Set(baseProblems.map(x=>x.p+"-"+x.d));
 const extraRest=restProblems.filter(x=>!baseKeys.has(x.p+"-"+x.d));
 return {matrix:m,vacancies,filled,uncovered,different,restProblems,extraRest,shiftCounts};
}
function publish(matrix){
 const updates=Object.create(null);
 for(let p=0;p<9;p++)for(let d=1;d<=30;d++)updates[p+"-"+d]=matrix[p][d-1];
 appState.overrides=updates;
}
function ensureOriginal(){if(scenario.baseOverrides===null)scenario.baseOverrides={...appState.overrides}}
function recompute(){
 const result=compute();scenario.report=result;publish(result.matrix);scenario.revision++;
 return result;
}
function swapWeek(a,b,week){
 if(appState.role!=="owner")return {ok:false,error:"هذه الصلاحية لصاحب الحساب الرئيسي فقط."};
 if(!Number.isInteger(a)||!Number.isInteger(b)||a===b||a<0||b<0||a>=9||b>=9||!Number.isInteger(week)||week<0||week>4)return {ok:false,error:"اختر أسبوعًا وموظفين مختلفين."};
 ensureOriginal();
 const prior=scenario.swaps.filter(x=>x.week!==week||(![x.a,x.b].includes(a)&&![x.a,x.b].includes(b)));
 const next=[...prior,{a,b,week}];
 const before=buildBeforeLeave(scenario.swaps),after=buildBeforeLeave(next);
 const old=new Set(gapViolations(before,[a,b]).map(v=>v.p+"-"+v.d));
 const newProblems=gapViolations(after,[a,b]).filter(v=>!old.has(v.p+"-"+v.d));
 if(newProblems.length){
   const v=newProblems[0];return {ok:false,error:"رفض التبديل: قد يترك "+people[v.p]+" براحة "+v.gap+" ساعات فقط بين المناوبتين (الحد المبدئي 11 ساعة)."};
 }
 scenario.swaps=next;const report=recompute();
 return {ok:true,report};
}
function addLeave(p,from,to){
 if(appState.role!=="owner")return {ok:false,error:"هذه الصلاحية لصاحب الحساب الرئيسي فقط."};
 if(!Number.isInteger(p)||p<0||p>=9||!Number.isInteger(from)||!Number.isInteger(to)||from<1||to>30||to<from)return {ok:false,error:"تحقق من اسم الموظف وتواريخ الإجازة."};
 ensureOriginal();
 const overlap=scenario.leaves.some(l=>l.p===p&&l.from<=to&&l.to>=from);
 if(overlap)return {ok:false,error:"هناك إجازة تجريبية متداخلة لهذا الموظف."};
 const leave={id:scenario.revision+1000+scenario.leaves.length,p,from,to};
 scenario.leaves.push(leave);
 return {ok:true,report:recompute()};
}
function removeLeave(id){if(appState.role!=="owner")return;scenario.leaves=scenario.leaves.filter(x=>x.id!==id);recompute()}
function removeSwap(week){if(appState.role!=="owner")return;scenario.swaps=scenario.swaps.filter(x=>x.week!==week);recompute()}
function reset(){
 if(appState.role!=="owner")return;
 appState.overrides={...(scenario.baseOverrides||{})};
 scenario.baseOverrides=null;scenario.swaps=[];scenario.leaves=[];scenario.report=null;scenario.revision++;
}
function elOptions(except=-1){
 return people.map((p,i)=>'<option value="'+i+'" '+(i===except?"selected":"")+'>'+safe(p)+'</option>').join("");
}
function panel(){
 if(appState.role!=="owner")return "";
 const report=scenario.report;
 let opts=Array.from({length:5},(_,i)=>'<option value="'+i+'" '+(i===appState.week?"selected":"")+'>'+String(i+1)+' · '+(1+i*7)+'–'+Math.min(30,7+i*7)+' نوفمبر</option>').join("");
 let html='<details class="scenario-panel" '+(scenario.open?"open":"")+'><summary class="scenario-title"><span class="scenario-title-icon">⚙</span><div><b>محاكي الشفتات والإجازات</b><small>اضغط لفتح أدوات التبديل وتغطية الإجازات • صلاحية يوسف فقط</small></div></summary>';
 html+='<div class="scenario-heading">تبديل شفت أسبوع كامل بين موظفين</div>'+
 '<div class="scenario-form"><label>الأسبوع<select id="sim-week">'+opts+'</select></label>'+
 '<label>الموظف الأول<select id="sim-first">'+elOptions(0)+'</select></label>'+
 '<label>الموظف الثاني<select id="sim-second">'+elOptions(1)+'</select></label></div>'+
 '<button class="scenario-action" type="button" id="sim-swap">تبديل الشفتات وأيام الراحة للأسبوع المختار</button>';
 html+='<div class="scenario-heading">محاكاة إجازات سنوية وقت النقص العددي</div>'+
 '<div class="scenario-form"><label>الموظف في إجازة<select id="sim-leave-person">'+elOptions(0)+'</select></label>'+
 '<label>من يوم<select id="sim-leave-from">'+Array.from({length:30},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+' نوفمبر</option>').join("")+'</select></label>'+
 '<label>إلى يوم<select id="sim-leave-to">'+Array.from({length:30},(_,i)=>'<option value="'+(i+1)+'" '+(i===29?"selected":"")+'>'+(i+1)+' نوفمبر</option>').join("")+'</select></label></div>'+
 '<div class="scenario-actions"><button type="button" class="scenario-action" id="sim-leave">إضافة الإجازة للمحاكاة</button><button class="scenario-outline" type="button" id="sim-full-month">اختيار الشهر كاملًا</button></div>';
 html+='<p class="scenario-tip">شهر نوفمبر الكامل يتجاوز رصيد 21 يومًا سنويًا بعد استبعاد الجمعة؛ هذا اختبار نقص عددي فقط، ولا يُسجل كطلب إجازة أو موافقة.</p>';
 if(scenario.swaps.length||scenario.leaves.length){
   html+='<div class="scenario-heading">التغييرات التجريبية النشطة</div><div class="scenario-items">';
   for(const s of scenario.swaps)html+='<div><span>الأسبوع '+(s.week+1)+': '+safe(people[s.a])+' ↔ '+safe(people[s.b])+'</span><button data-sim-remove-swap="'+s.week+'">إلغاء</button></div>';
   for(const l of scenario.leaves)html+='<div><span>'+safe(people[l.p])+' · إجازة '+l.from+'–'+l.to+' نوفمبر</span><button data-sim-remove-leave="'+l.id+'">إلغاء</button></div>';
   html+='</div><button class="scenario-outline" type="button" id="sim-reset">إعادة ضبط النموذج بالكامل</button>';
 }
 if(report){
   html+='<div class="scenario-kpis">'+
    '<div><strong>'+report.vacancies.length+'</strong><small>شفتات تأثرت بالإجازات</small></div>'+
    '<div><strong>'+report.filled.length+'</strong><small>شفتات غُطّيت بالبدلاء</small></div>'+
    '<div class="'+(report.uncovered.length?"kpi-alert":"")+'"><strong>'+report.uncovered.length+'</strong><small>شفتات دون تغطية</small></div>'+
    '<div class="'+(report.extraRest.length?"kpi-alert":"")+'"><strong>'+report.extraRest.length+'</strong><small>مخالفات راحة جديدة</small></div></div>';
   if(report.uncovered.length){
      html+='<div class="scenario-alert"><b>تنبيه: يوجد عجز في التغطية المقترحة.</b><p>صباحي: '+report.shiftCounts.morning+'، مسائي: '+report.shiftCounts.evening+'، ليلي: '+report.shiftCounts.night+'. لا نفترض موظفين إضافيين أو عملًا إضافيًا دون اعتماد.</p></div>';
   }else html+='<p class="scenario-good">تمت محاولة تغطية الشفتات المتأثرة ضمن حدود النموذج. يلزم فحص التغطية الفعلية ساعة بساعة قبل الاعتماد.</p>';
   if(report.extraRest.length)html+='<p class="scenario-alert">تحذير: توجد فترات راحة جديدة أقل من 11 ساعة بعد المحاكاة؛ يلزم إعادة توزيع يدوي.</p>';
   if(report.uncovered.length){
      html+='<details class="scenario-details"><summary>عرض الشفتات غير المغطاة ('+report.uncovered.length+')</summary>'+
       report.uncovered.slice(0,60).map(v=>'<div>'+v.d+' نوفمبر — '+safe(people[v.p])+' — '+types[v.code].name+' ('+types[v.code].start+'–'+types[v.code].end+')</div>').join("")+'</details>';
   }
 }
 html+='</details>';return html;
}
const previousTeam=teamPage;
teamPage=function(){
 let html=previousTeam();
 const content=panel();
 if(content)html=html.replace('<div class="card roster-card">',content+'<div class="card roster-card">');
 return html;
};
const originalAdmin=adminPage;
adminPage=function(){
 let html=originalAdmin();
 if(appState.role==="owner")html+='<section class="card scenario-entry"><h3>محاكاة أسبوعية للمناوبات والإجازات</h3><p class="note">تبديل شفتات أسبوع كامل أو تجربة نقص الموظفين خلال إجازة ممتدة. النتائج تجريبية وغير معتمدة.</p><button class="primary" type="button" data-page="team">فتح المحاكي في جدول الفريق</button></section>';
 return html;
};
document.addEventListener("click",e=>{
 if(appState.role==="owner"&&e.target.closest(".scenario-title"))scenario.open=!scenario.open;

 if(appState.role!=="owner")return;
 const clicked=e.target.closest("#sim-swap,#sim-leave,#sim-full-month,#sim-reset,[data-sim-remove-swap],[data-sim-remove-leave]");
 if(!clicked)return;
 const id=clicked.id;
 if(id==="sim-full-month"){
   const f=document.querySelector("#sim-leave-from"),t=document.querySelector("#sim-leave-to");
   if(f&&t){f.value="1";t.value="30";toast("تم اختيار نوفمبر كاملًا للمحاكاة فقط.")}return;
 }
 if(id==="sim-swap"){
   const a=Number(document.querySelector("#sim-first")?.value),b=Number(document.querySelector("#sim-second")?.value),week=Number(document.querySelector("#sim-week")?.value);
   const r=swapWeek(a,b,week);toast(r.ok?"تم تبديل الشفت الأسبوعي في المحاكاة فقط.":r.error);if(r.ok)render();return;
 }
 if(id==="sim-leave"){
   const p=Number(document.querySelector("#sim-leave-person")?.value),from=Number(document.querySelector("#sim-leave-from")?.value),to=Number(document.querySelector("#sim-leave-to")?.value);
   const r=addLeave(p,from,to);toast(r.ok?"أُضيفت الإجازة الافتراضية وأُعيد حساب تغطية المناوبات.":r.error);if(r.ok)render();return;
 }
 if(id==="sim-reset"){reset();toast("أُعيد الجدول إلى حالته قبل المحاكاة.");render();return}
 if(clicked.hasAttribute("data-sim-remove-swap")){removeSwap(Number(clicked.dataset.simRemoveSwap));render();return}
 if(clicked.hasAttribute("data-sim-remove-leave")){removeLeave(Number(clicked.dataset.simRemoveLeave));render();return}
});
window.NahdiScenarioDebug={scenario,compute,swapWeek,addLeave,reset,workWeekCount};
if(appState.role&&appState.page==="team")render();
})();