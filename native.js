"use strict";
/* Mobile-first demo enhancements, distinct from production authentication. */
(()=>{
  const shapes={
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    team:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2H3Z"/><path d="M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1"/>',
    leaves:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18m-12 5 2 2 4-4"/>',
    award:'<path d="M8 20h8m-4-4v4M7 4h10v7a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v3a3 3 0 0 0 3 3m10-6h3v3a3 3 0 0 1-3 3"/>',
    profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    shield:'<path d="m12 2 8 3v6c0 5-3 9-8 11-5-2-8-6-8-11V5l8-3Z"/><path d="m8 12 3 3 5-6"/>'
  };
  const icon=k=>'<svg class="nav-native-icon" viewBox="0 0 24 24" aria-hidden="true">'+(shapes[k]||shapes.home)+'</svg>';
  const fixedTabs=[
    {id:"home",text:"الرئيسية",icon:"home"},
    {id:"team",text:"الجدول",icon:"team"},
    {id:"leaves",text:"الإجازات",icon:"leaves"},
    {id:"award",text:"التميز",icon:"award"},
    {id:"profile",text:"المزيد",icon:"profile"}
  ];
  const originalRender=render;
  let lastPage=null;
  render=function(){
    originalRender();
    if(!appState.role){lastPage=null;return}
    const nav=document.getElementById("bottom-nav");
    if(nav){
      nav.innerHTML=fixedTabs.map(t=>{
        const active=appState.page===t.id||(t.id==="profile"&&(appState.page==="photos"||appState.page==="admin"))||(t.id==="team"&&appState.page==="my");
        return '<button type="button" data-page="'+t.id+'" class="'+(active?"active":"")+'" aria-label="'+t.text+'" aria-current="'+(active?"page":"false")+'">'+icon(t.icon)+'<span>'+t.text+'</span></button>'
      }).join("");
    }
    const region=document.getElementById("screen");
    if(region&&lastPage!==appState.page){
      region.classList.remove("page-enter");
      void region.offsetWidth;
      region.classList.add("page-enter");
      if(lastPage!==null)window.scrollTo({top:0,behavior:"auto"});
    }
    lastPage=appState.page;
  };
  const originalProfile=profilePage;
  profilePage=function(){
    let output=originalProfile();
    if(isAdmin()){
      output+='<div class="card" style="margin-top:15px"><h3>لوحة الإدارة | Administration</h3><p class="note">أدوات التجربة الإدارية للجداول والإجازات والتقييمات.</p><div class="btnrow"><button class="primary" data-page="admin">'+icon("shield")+' إدارة القسم</button>';
      if(appState.role==="owner")output+='<button class="secondary" data-page="photos">اعتماد الصور | Photo Approvals</button>';
      output+='</div></div>';
    }
    output+='<p class="app-status">NAHDICARE STAFF · DEMO VERSION · بيانات افتراضية</p>';
    return output;
  };
  const loginPanel=document.querySelector(".login-card");
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  const standalone=window.navigator.standalone===true||window.matchMedia("(display-mode: standalone)").matches;
  if(ios&&!standalone&&loginPanel){
    const line=document.createElement("div");
    line.className="install-help";
    line.innerHTML='<span class="install-help-icon">▣</span><div><b>خله مثل تطبيق الآيفون</b><p>افتح الرابط في Safari، واضغط <strong>مشاركة</strong> ثم <strong>إضافة إلى الشاشة الرئيسية</strong>. بعدها افتحه من الأيقونة بدون شريط المتصفح.</p></div>';
    const footer=loginPanel.querySelector(".powered");
    if(footer)footer.before(line);
    else loginPanel.append(line);
  }
  if("serviceWorker" in navigator && location.protocol==="https:"){
    window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js",{scope:"./"}).catch(()=>{}),{once:true});
  }
  // No real employee data, passwords, attendance records or authenticated access is used in this demo.
  render();
})();