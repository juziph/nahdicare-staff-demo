"use strict";
const realEmployees=[
  "Maha Al-Juhani","Yousef Al-Malki","Reem Al-Rifai",
  "Amjad Kurdi","Sundus Helmy","Abdullah Al-Haidari",
  "Taghreed Al-Mutairi","Mutasim Elias","Omar Al-Mansour"
];
people.splice(0,people.length,...realEmployees);
appState.award="";
appState.view="week";
appState.week=0;
appState.day=1;
appState.overrides={};
const weeklyCore=["n","m1","m2","m2","e2","e3","e3","e3","e1"];
const plannedMonth=10; // November (zero-based); sample only, not approved clinic rota
const normalDate=d=>new Date(Date.UTC(2026,plannedMonth,d,12,0,0));
const mondayWeek=(d)=>Math.floor((d-1)/7);
function employeeRoles(d){
  const week=mondayWeek(d),ass=[];
  for(let person=0;person<9;person++)ass.push(weeklyCore[(person+week)%9]);
  return ass;
}
const baseGetShift=getShift;
getShift=function(person,day){
  if(day<1||day>35)return "off";
  const dayDate=normalDate(day);
  const weekday=dayDate.getUTCDay();
  const assignments=employeeRoles(day);
  const me=assignments[person];
  const indexFor=(code,nth=0)=>assignments.map((r,i)=>r===code?i:-1).filter(i=>i!==-1)[nth];
  const n=indexFor("n"),m1=indexFor("m1"),e2=indexFor("e2"),e1=indexFor("e1");
  const m2Cover=indexFor("m2",0),nightCover=indexFor("e3",0),eveningCover=indexFor("e3",1);
  // Every employee works a prevailing shift throughout the week wherever staffing allows.
  // Friday emergency and pediatric coverage is an exception, with compensating days off.
  if(weekday===5){
    const on=[n,m1,e2,e1,nightCover];
    return on.includes(person)?me:"off";
  }
  if(weekday===1&&person===e1)return "off"; // Pediatric Friday relief day
  if(weekday===2){
    if(person===n)return "off";
    if(person===nightCover)return "n";
  }
  if(weekday===3){
    if(person===m1||person===nightCover)return "off";
    if(person===m2Cover)return "m1";
  }
  if(weekday===4){
    if(person===e2)return "off";
    if(person===eveningCover)return "e2";
  }
  return me;
};
const rowShift=(p,day)=>appState.overrides[p+"-"+day]||getShift(p,day);
const employeeName=p=>safe(people[p]);
const awardMarker=p=>(appState.award===people[p]?" <span class=\"gold\">♛</span>":"");
function weekRange(start,count){
  const first=normalDate(start),last=normalDate(start+count-1);
  const fmt=new Intl.DateTimeFormat("ar-SA-u-ca-gregory",{day:"numeric",month:"long",timeZone:"UTC"});
  return fmt.format(first)+" – "+fmt.format(last)+" "+last.getUTCFullYear();
}
function rosterCell(code,compact){
 const shift=types[code]||types.off;
 const tag=compact?(code==="m1"||code==="m2"?"M":code==="e1"||code==="e2"||code==="e3"?"E":code==="n"?"N":code==="al"?"AL":"OFF"):shift.english;
 return '<div class="shiftcell '+shift.css+'"><strong>'+tag+'</strong>'+
 (shift.start?'<small class="date-time">'+shift.start+'</small><small class="date-time">'+shift.end+'</small>':"<small>"+(code==="off"?"راحة":"إجازة")+"</small>")+"</div>";
}
scheduleRows=function(team){
 const persons=team?people.map((x,i)=>i):[1];
 if(appState.view==="day"){
  const date=normalDate(appState.day);
  const fmt=new Intl.DateTimeFormat("ar-SA-u-ca-gregory",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
  const at=fmt.format(date);
  return '<div class="day-switch"><button class="secondary small" data-date="-1">›</button><span class="pill blueprint">'+at+'</span><button class="secondary small" data-date="1">‹</button></div><div class="roster-list">'+persons.map(p=>{
    const code=rowShift(p,appState.day);
    return '<div class="listrow"><div class="rowbody"><div class="rowname">'+employeeName(p)+awardMarker(p)+'</div>'+timePair(code)+'</div>'+shiftBadge(code)+'</div>'
  }).join("")+"</div>";
 }
 const days=appState.view==="week"?Array.from({length:7},(_,i)=>1+appState.week*7+i):Array.from({length:30},(_,i)=>i+1);
 const curLabel=appState.view==="week"?"الأسبوع "+(appState.week+1)+" · "+weekRange(days[0],7):"نوفمبر 2026";
 let result='<div class="day-switch"><button class="secondary small" data-week="-1">›</button><span class="pill blueprint">'+curLabel+'</span><button class="secondary small" data-week="1">‹</button></div>';
 if(appState.view==="week"){
   result+='<p class="note week-guide">الشفت الأساسي ثابت خلال الأسبوع قدر الإمكان؛ تتغير بعض المناوبات لتغطية الطوارئ والجمعة. اسحب الجدول أفقيًا لمشاهدة بقية الأيام.</p>';
 }
 result+='<div class="weekscroller"><table class="calendar-table '+(appState.view==="month"?"monthly":"weekly")+'"><thead><tr><th>الموظف<br>Employee</th>';
 const dayFmt=new Intl.DateTimeFormat("ar-SA-u-ca-gregory",{weekday:"short",timeZone:"UTC"});
 result+=days.map(d=>'<th>'+dayFmt.format(normalDate(d))+'<br>'+normalDate(d).getUTCDate()+' '+(normalDate(d).getUTCMonth()===10?"NOV":"DEC")+"</th>").join("");
 result+='</tr></thead><tbody>'+persons.map(p=>'<tr><td class="name-cell"><span>'+employeeName(p)+awardMarker(p)+'</span></td>'+days.map(d=>'<td>'+rosterCell(rowShift(p,d),appState.view==="week")+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>';
 return result;
};
const oldTeamPage=teamPage;
teamPage=function(){
 return pageHead("جدول الفريق | Staff Schedule","جدول تجريبي بأسماء موظفي القسم الفعلية · المناوبات المقترحة غير معتمدة")+
 pickerControl()+'<div class="card roster-card">'+scheduleRows(true)+legend()+'</div>'+
 '<p class="notice-safe">الجدول للتصور والمناقشة فقط. يجب مراجعته واعتماده من الإدارة، والتحقق من ساعات الراحة والتغطية لكل يوم قبل تطبيقه.</p>';
};
myPage=function(){
 return pageHead("جدولي | My Schedule","نموذج دوام الموظف: Yousef Al-Malki · لا يمثل جدولًا فعليًا")+
 pickerControl()+'<div class="card roster-card">'+scheduleRows(false)+legend()+'</div>'+
 '<p class="notice-safe">الشفت الليلي ينتهي صباح اليوم التالي. النموذج ليس تعيينًا رسميًا للمناوبة.</p>';
};
awardPage=function(){
 const assigned=people.includes(appState.award);
 return pageHead("موظف الشهر | Employee of the Month","تكريم الموظف بعد اعتماد النتائج من الإدارة")+
 '<div class="award-layout"><section class="award official-award"><div class="award-trophy">🏆</div>'+
 '<small class="gold">EXCELLENCE AWARD · جائزة التميز</small><div class="photo">'+(assigned?safe(appState.award[0]):"♛")+'</div>'+
 '<div class="gold" style="font-size:26px">♛</div><h2>'+ (assigned?safe(appState.award):"لم يُعتمد بعد") +'</h2>'+
 '<small>'+(assigned?"فائز تجريبي مُختار داخل المتصفح":"تُعلن النتيجة بعد مراجعة الأداء واعتماد الفائز")+'</small>'+
 '</section><section class="card performance-panel"><h3>مؤشرات الأداء | Performance Indicators</h3>'+
 [
  ["تقييم الضيوف","Guest Rating"],
  ["عدد الضيوف المخدومين","Guests Served"],
  ["متوسط الانتظار","Average Waiting"],
  ["أيام العمل الفعلية","Effective Attendance"],
  ["الالتزام بالمواعيد","Punctuality"]
 ].map(x=>'<div class="performance-item"><span class="metric-icon">✦</span><div><b>'+x[0]+'</b><small>'+x[1]+'</small></div><span class="metric-empty">—</span></div>').join("")+
 '<p class="note">لم نُدخل بيانات تقييم حقيقية بعد؛ لا تُعرض درجات أو فائزون افتراضيون على أسماء الموظفين.</p></section></div>';
};
const oldHomePage=homePage;
homePage=function(){
 let s=oldHomePage();
 s=s.replaceAll("Owner Demo","Yousef Al-Malki").replace("Sara Ahmed","لا يوجد فائز معتمد");
 s=s.replace("المسؤول الرئيسي","يوسف المالكي");
 s=s.replace(/94 \/ 100/g,"لم تُعتمد نتائج التقييم");
 return s;
};
const originalAdminPage=adminPage;
adminPage=function(){
 let s=originalAdminPage();
 if(!appState.award)s=s.replace('فائزًا تجريبيًا','فائزًا بعد اعتماد التقييم');
 return s;
};
const officialSymbol='<img src="./official-symbol.png" width="42" height="42" alt="شعار النهدي كير" loading="eager">';
const officialLogo='<img src="./official-logo.png" alt="عيادات النهدي كير | nahdicare clinics" loading="eager">';
function setOfficialBrand(){
 const mast=document.querySelector(".brand-lockup");
 if(mast)mast.innerHTML=officialLogo+'<div class="brand-rule"></div>';
 const left=document.querySelector(".side-top");
 if(left)left.innerHTML='<div class="brand-logo">'+officialSymbol+'</div><div><b>عيادات النهدي كير</b><small>nahdicare clinics</small></div>';
 const top=document.querySelector(".brand-mobile");
 if(top)top.innerHTML='<span class="mobile-brand-icon">'+officialSymbol+'</span>';
 const poster=document.querySelector(".poster-main");
 if(poster){
   const old=poster.querySelector(".clinic-emblem");if(old)old.innerHTML=officialSymbol;
 }
}
setOfficialBrand();
const rosterRender=render;render=function(){rosterRender();const v=document.getElementById("account-name");if(v&&appState.role==="owner")v.textContent="Yousef Al-Malki";};
render();

const previewPage=new URLSearchParams(location.search).get("page");if(appState.role&&["team","award","leaves","my"].includes(previewPage))navTo(previewPage);
