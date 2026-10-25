"use strict";
/* Manual rota adjustments for owner demo: atomic day/range edits with preview and hard checks. */
(()=>{
 const ALL=["m1","m2","e1","e2","e3","n","off"];
 const shifts={m1:"صباح 6:00 ص – 2:00 م",m2:"صباح 8:00 ص – 4:00 م",e1:"مساء 1:00 م – 9:00 م",e2:"مساء 2:00 م – 10:00 م",e3:"مساء 3:00 م – 11:00 م",n:"نايت 10:00 م – 6:00 ص",off:"راحة OFF"};
 const editor={open:false,mode:"auto",person:1,other:0,from:1,to:1,shift:"e3",preview:null,history:[],notice:""};
 const work=c=>ALL.includes(c)&&c!=="off";
 const kind=c=>c==="off"?"off":c==="al"?"al":c==="n"?"n":c==="m1"||c==="m2"?"m":"e";
 const time=t=>{let [hhmm,ampm]=t.split(" "),[h,m]=hhmm.split(":").map(Number);return h%12+(ampm==="PM"?12:0)+m/60};
 const shiftStart=c=>time(types[c].start),shiftEnd=c=>time(types[c].end)+(time(types[c].end)<=time(types[c].start)?24:0);
 const current=()=>Array.from({length:9},(_,p)=>Array.from({length:30},(_,idx)=>appState.overrides[p+"-"+(idx+1)]||getShift(p,idx+1)));
 const copy=matrix=>matrix.map(r=>r.slice());
 const key=matrix=>matrix.map(r=>r.join(",")).join("|");
 function violations(matrix){
  const arr=[];
  for(let d=1;d<=30;d++){
   const codes=matrix.map(r=>r[d-1]);
   const m=codes.filter(x=>kind(x)==="m").length,n=codes.filter(x=>kind(x)==="n").length,e=codes.filter(x=>kind(x)==="e").length,
    pedi=codes.filter(x=>x==="e1").length,friday=new Date(Date.UTC(2026,10,d)).getUTCDay()===5;
   if(m!==2)arr.push({id:d+":m",day:d,msg:d+" نوفمبر: الصباح "+m+" والمطلوب موظفان بالضبط",severity:Math.abs(m-2)});
   if(n!==1)arr.push({id:d+":n",day:d,msg:d+" نوفمبر: النايت "+n+" والمطلوب موظف واحد",severity:Math.abs(n-1)});
   if(e<3)arr.push({id:d+":e",day:d,msg:d+" نوفمبر: المساء "+e+" والمطلوب 3 على الأقل",severity:3-e});
   if(friday&&pedi<2)arr.push({id:d+":f",day:d,msg:d+" نوفمبر: تغطية عيادة الأطفال أقل من موظفين",severity:2-pedi});
  }
  for(let p=0;p<9;p++){
   for(let d=1;d<30;d++){
    const before=matrix[p][d-1],after=matrix[p][d];if(!work(before)||!work(after))continue;
    const gap=24+shiftStart(after)-shiftEnd(before);
    if(gap<11-1e-6)arr.push({id:"rest:"+p+":"+d,day:d+1,msg:people[p]+": راحة "+Math.max(0,Math.round(gap))+" ساعات بين "+d+" و"+(d+1)+" نوفمبر",severity:11-gap});
   }
   for(let w=0;w<4;w++){
    const row=matrix[p].slice(w*7,w*7+7),n=row.filter(work).length;
    if(n>6)arr.push({id:"week:"+p+":"+w,day:w*7+1,msg:people[p]+": أكثر من 6 مناوبات بالأسبوع "+(w+1),severity:n-6});
   }
  }
  return arr;
 }
 function newProblems(before,after){
  const previous=new Map(violations(before).map(x=>[x.id,x.severity]));
  return violations(after).filter(x=>x.severity>(previous.get(x.id)||0)+1e-6);
 }
 function renderDiff(before,after){
  const changed=[];
  for(let d=1;d<=30;d++)for(let p=0;p<9;p++)if(before[p][d-1]!==after[p][d-1])changed.push({day:d,p,old:before[p][d-1],now:after[p][d-1]});
  return changed;
 }
 function makePreview(spec){
  if(appState.role!=="owner")return {ok:false,error:"هذه الميزة لحساب يوسف فقط."};
  if(!Number.isInteger(spec.person)||spec.person<0||spec.person>8||!Number.isInteger(spec.from)||!Number.isInteger(spec.to)||spec.from<1||spec.to>30||spec.to<spec.from)return {ok:false,error:"اختر موظفًا وفترة صحيحة في نوفمبر."};
  if(spec.mode==="auto"&&!ALL.includes(spec.shift))return {ok:false,error:"اختر مناوبة صحيحة."};
  if(spec.mode==="pair"&&(!Number.isInteger(spec.other)||spec.other===spec.person||spec.other<0||spec.other>8))return {ok:false,error:"اختر موظفين مختلفين للتبديل."};
  const before=current(),after=copy(before),details=[];
  const score=c=>c==="off"?0:c==="e1"?1:c==="e2"?2:c==="e3"?3:4;
  for(let d=spec.from;d<=spec.to;d++){
   const a=spec.person,origin=after[a][d-1],wanted=spec.shift;
   if(origin==="al")return {ok:false,error:"اليوم "+d+" نوفمبر إجازة سنوية محجوزة للموظف، ولا يمكن تعديلها من محرر الشفتات."};
   if(spec.mode==="pair"){
     const b=spec.other,second=after[b][d-1];
     if(second==="al")return {ok:false,error:"اليوم "+d+" نوفمبر يتعارض مع إجازة الموظف الثاني."};
     after[a][d-1]=second;after[b][d-1]=origin;
     details.push({day:d,companion:b,from:origin,to:second});
     continue;
   }
   if(origin===wanted){details.push({day:d,companion:null,from:origin,to:wanted});continue}
   if(kind(origin)===kind(wanted)){
      after[a][d-1]=wanted;
      const conflicts=newProblems(before,after);
      if(conflicts.length)return {ok:false,error:conflicts[0].msg};
      details.push({day:d,companion:null,from:origin,to:wanted});
      continue;
   }
   // Exact two morning and one night can only be preserved through a paired change.
   // Choose an available peer holding the requested category that keeps shifts safe.
   const choices=[];
   for(let b=0;b<9;b++){
     if(b===a||after[b][d-1]==="al"||kind(after[b][d-1])!==kind(wanted))continue;
     const trial=copy(after),oldPeer=after[b][d-1];
     trial[a][d-1]=wanted;trial[b][d-1]=origin;
     const problems=newProblems(before,trial);
     if(problems.length===0){
       const same=oldPeer===wanted?0:1;
       choices.push({b,trial,oldPeer,score:same*10+Math.abs(score(oldPeer)-score(wanted))});
     }
   }
   choices.sort((x,y)=>x.score-y.score||x.b-y.b);
   if(!choices.length)return {ok:false,error:"تعذر تغيير شفت يوم "+d+" نوفمبر دون نقص بالتغطية أو مخالفة الراحة. جرّب تبديلًا محددًا مع زميل أو اختر يومًا آخر."};
   after.splice(0,after.length,...choices[0].trial);
   details.push({day:d,companion:choices[0].b,from:origin,to:wanted});
  }
  const problems=newProblems(before,after);
  if(problems.length)return {ok:false,error:problems[0].msg};
  const changed=renderDiff(before,after);
  if(!changed.length)return {ok:false,error:"الشفت المختار مطابق للجدول الحالي، ولا توجد تغييرات."};
  return {ok:true,before,after,details,changed,beforeKey:key(before)};
 }
 function commit(preview){
  if(appState.role!=="owner")return {ok:false,error:"صلاحية حساب يوسف فقط."};
  if(!preview?.ok)return {ok:false,error:"اعرض المعاينة أولًا."};
  if(preview.beforeKey!==key(current()))return {ok:false,error:"تغير الجدول منذ المعاينة. اضغط معاينة مجددًا."};
  const nowProblems=newProblems(preview.before,preview.after);
  if(nowProblems.length)return {ok:false,error:nowProblems[0].msg};
  editor.history.push({before:copy(preview.before),after:copy(preview.after),changes:preview.changed});
  appState.overrides={...appState.overrides};
  for(let p=0;p<9;p++)for(let d=1;d<=30;d++)appState.overrides[p+"-"+d]=preview.after[p][d-1];
  const s=window.NahdiScenarioDebug?.scenario;
  if(s?.generated&&s.report){s.report.matrix=copy(preview.after);s.report.audit=window.NahdiScenarioDebug.check(preview.after);s.revision++;}
  return {ok:true,count:preview.changed.length};
 }
 function undo(){
  if(appState.role!=="owner")return {ok:false,error:"صلاحية حساب يوسف فقط."};
  const last=editor.history[editor.history.length-1];if(!last)return {ok:false,error:"لا توجد تعديلات للتراجع عنها."};
  if(key(last.after)!==key(current()))return {ok:false,error:"تغير الجدول بعد هذا التعديل. لا يمكن التراجع تلقائيًا؛ استخدم معاينة تعديل جديد."};
  editor.history.pop();
  for(let p=0;p<9;p++)for(let d=1;d<=30;d++)appState.overrides[p+"-"+d]=last.before[p][d-1];
  const s=window.NahdiScenarioDebug?.scenario;
  if(s?.generated&&s.report){s.report.matrix=copy(last.before);s.report.audit=window.NahdiScenarioDebug.check(last.before);s.revision++;}
  return {ok:true};
 }
 function panel(){
  if(appState.role!=="owner")return "";
  const dateOptions=selected=>Array.from({length:30},(_,i)=>'<option value="'+(i+1)+'"'+(i+1===selected?' selected':'')+'>'+(i+1)+' نوفمبر</option>').join("");
  const peopleOptions=(selected)=>people.map((x,i)=>'<option value="'+i+'"'+(i===selected?' selected':'')+'>'+safe(x)+'</option>').join("");
  const selected=(kind,value)=>kind===value?' selected':'';
  let html='<details id="manual-edit-panel" class="manual-edit-panel" '+(editor.open?"open":"")+'>';
  html+='<summary><span class="manual-edit-gear">✎</span><div><strong>تعديل الشفتات يدويًا</strong><small>يوم واحد أو عدة أيام · صلاحية يوسف · مراجعة التغطية قبل الحفظ</small></div></summary>';
  html+='<div class="manual-edit-body"><p class="manual-tip">تقدر تغير شفت موظف، والنظام يحاول تبديله تلقائيًا مع زميل إذا تغير نوع المناوبة. أو تختار موظفين للتبديل مباشرة.</p>';
  html+='<div class="manual-mode"><label><input type="radio" name="manual-mode" value="auto"'+(editor.mode==="auto"?' checked':'')+'> تعديل شفت موظف</label><label><input type="radio" name="manual-mode" value="pair"'+(editor.mode==="pair"?' checked':'')+'> تبديل بين موظفين</label></div>';
  html+='<div class="manual-fields"><label>الموظف<select id="manual-person" data-manual="person">'+peopleOptions(editor.person)+'</select></label>';
  html+='<label>من يوم<select id="manual-from" data-manual="from">'+dateOptions(editor.from)+'</select></label><label>إلى يوم<select id="manual-to" data-manual="to">'+dateOptions(editor.to)+'</select></label>';
  if(editor.mode==="auto")html+='<label>الشفت الجديد<select id="manual-shift" data-manual="shift">'+ALL.map(code=>'<option value="'+code+'"'+selected(editor.shift,code)+'>'+shifts[code]+'</option>').join("")+'</select></label>';
  else html+='<label>التبديل مع<select id="manual-other" data-manual="other">'+peopleOptions(editor.other)+'</select></label>';
  html+='</div><div class="manual-buttons"><button class="scenario-action" id="manual-preview" type="button">معاينة التعديل وفحص التغطية</button>';
  if(editor.preview?.ok)html+='<button class="manual-save" id="manual-save" type="button">حفظ التعديل في الجدول التجريبي</button>';
  html+='</div>';
  if(editor.notice)html+='<p class="manual-note">'+safe(editor.notice)+'</p>';
  if(editor.preview?.ok){
   const info=editor.preview, days=new Set(info.changed.map(x=>x.day)).size;
   html+='<div class="manual-preview-result"><b>المعاينة صالحة بحسب فحوص التغطية والراحة</b><p>عدد أيام التعديل: '+days+' · الخانات المتغيرة: '+info.changed.length+'</p>';
   html+='<div class="manual-change-list">'+info.changed.slice(0,22).map(x=>'<div><span>'+x.day+' نوفمبر · '+safe(people[x.p])+'</span><small>'+shifts[x.old]+' ← '+shifts[x.now]+'</small></div>').join("");
   if(info.changed.length>22)html+='<small>وبقية التعديلات ('+(info.changed.length-22)+')…</small>';
   html+='</div></div>';
  }
  if(editor.history.length)html+='<button class="scenario-outline" id="manual-undo" type="button">↶ التراجع عن آخر تعديل يدوي</button>';
  html+='<p class="manual-warning">لا يمكن تعديل يوم إجازة سنوية من هنا. التعديلات محلية وتجريبية، وليست جدولًا معتمدًا أو محفوظًا لبقية الموظفين.</p></div></details>';
  return html;
 }
 const priorTeam=teamPage;
 teamPage=function(){const s=priorTeam();if(appState.role!=="owner")return s;
    return s.replace('<div class="card roster-card">',panel()+'<div class="card roster-card">');
 };
 document.addEventListener("toggle",e=>{if(e.target.id==="manual-edit-panel")editor.open=e.target.open},true);
 document.addEventListener("change",e=>{
  if(appState.role!=="owner")return;
  if(e.target.name==="manual-mode"){editor.mode=e.target.value;editor.preview=null;editor.notice="";render();return}
  if(e.target.dataset.manual){const field=e.target.dataset.manual;editor[field]=field==="shift"?e.target.value:Number(e.target.value);editor.preview=null;editor.notice="";document.getElementById("manual-save")?.remove();document.querySelector(".manual-preview-result")?.remove();return}
 });
 document.addEventListener("click",e=>{
  if(appState.role!=="owner")return;
  const button=e.target.closest("#manual-preview,#manual-save,#manual-undo");
  if(!button)return;
  if(button.id==="manual-preview"){
    const result=makePreview(editor);
    editor.preview=result.ok?result:null;editor.notice=result.ok?"فحص التغطية والراحة اجتازه التعديل. راجع التفاصيل قبل الحفظ.":result.error;
    editor.open=true;render();return;
  }
  if(button.id==="manual-save"){
    const result=commit(editor.preview);
    editor.notice=result.ok?"حُفظ تعديل "+result.count+" خانة في الجدول التجريبي. تظهر التغييرات أيضًا في المشاركة الأسبوعية والشهرية.":result.error;
    editor.preview=null;editor.open=true;render();return;
  }
  if(button.id==="manual-undo"){
    const result=undo();editor.notice=result.ok?"تراجعنا عن آخر تعديل يدوي.":result.error;
    editor.preview=null;editor.open=true;render();return;
  }
 });

 document.addEventListener("click",e=>{
   if(appState.role!=="owner"||appState.page!=="team")return;
   const td=e.target.closest(".roster-card .calendar-table tbody td");
   if(!td||td.cellIndex===0)return;
   const row=td.parentElement.sectionRowIndex;
   const day=appState.view==="month"?td.cellIndex:1+appState.week*7+td.cellIndex-1;
   if(day<1||day>30||row<0||row>8)return;
   const code=current()[row][day-1];
   if(code==="al"){toast("هذا اليوم إجازة سنوية؛ تعديله يكون في تخطيط الإجازات.");return}
   editor.open=true;editor.person=row;editor.from=day;editor.to=day;
   editor.shift=code==="off"?"e3":code;
   editor.mode="auto";editor.preview=null;
   editor.notice="اختر الشفت المطلوب، ثم اضغط معاينة. يُفحص يوم "+day+" نوفمبر قبل الحفظ.";
   render();
   const panel=document.getElementById("manual-edit-panel");
   if(panel)panel.scrollIntoView({behavior:"smooth",block:"start"});
 });
 document.addEventListener("click",e=>{
 if(appState.role!=="owner"||appState.page!=="team"||appState.view!=="day")return;
 const item=e.target.closest(".roster-card .roster-list .listrow");if(!item)return;
 const person=Array.from(item.parentElement.children).indexOf(item),day=appState.day;
 if(person<0||person>8||day<1||day>30)return;
 const code=current()[person][day-1];
 if(code==="al"){toast("هذه إجازة سنوية، ولا تُعدل من محرر الشفتات.");return}
 editor.open=true;editor.person=person;editor.from=day;editor.to=day;
 editor.shift=code==="off"?"e3":code;editor.mode="auto";editor.preview=null;
 editor.notice="حدد شفت يوم "+day+" نوفمبر ثم عاين أثر التعديل على التغطية.";
 render();document.getElementById("manual-edit-panel")?.scrollIntoView({behavior:"smooth",block:"start"});
});
 window.NahdiManualEditor={editor,makePreview,commit,undo,current,violations};
 if(appState.role&&appState.page==="team")render();
})();
