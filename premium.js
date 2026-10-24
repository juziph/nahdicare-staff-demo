"use strict";
const premiumLogo="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" role=\"img\" aria-label=\"رمز النهدي كير\"><defs><linearGradient id=\"nahdi-blue\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#38b9ff\"/><stop offset=\"1\" stop-color=\"#1375d7\"/></linearGradient><linearGradient id=\"nahdi-teal\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#32eaca\"/><stop offset=\"1\" stop-color=\"#1bbba8\"/></linearGradient></defs><path d=\"M30 13 12 31 48 72Q50 75 53 72L87 35 69 16 52 33\" fill=\"none\" stroke=\"#238ef0\" stroke-width=\"15\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"m29 39 20 18 23-23\" fill=\"none\" stroke=\"#20dbc1\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
const premiumIcons={
calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h2M14 14h2"/></svg>',
users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2H3Z"/><path d="M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1"/></svg>',
plane:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4L22 2Z"/><path d="M22 2 11 13"/></svg>',
trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v7a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v3a3 3 0 0 0 3 3M17 6h3v3a3 3 0 0 1-3 3"/></svg>',
user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>',
shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5l-8-3Z"/><path d="m8 12 3 3 5-6"/></svg>'
};
const clinicBrand='<div class="brand-lockup"><div class="brand-symbol">'+premiumLogo+'</div><div class="brand-ar">عيادات <em>النهدي كير</em></div><div class="brand-en">nahdicare <em>clinics</em></div><div class="brand-rule"></div></div>';
document.querySelector(".login-card")?.insertAdjacentHTML("afterbegin",clinicBrand);
const poster=document.querySelector(".poster-main");
if(poster){const logo=poster.querySelector(".clinic-emblem");if(logo)logo.innerHTML=premiumLogo}
const brand=document.querySelector(".side-top");
if(brand)brand.innerHTML='<div class="brand-logo">'+premiumLogo+'</div><div><b>عيادات النهدي كير</b><small>nahdicare clinics</small></div>';
const mobileBrand=document.querySelector(".brand-mobile");
if(mobileBrand)mobileBrand.innerHTML='<span class="mobile-brand-icon">'+premiumLogo+'</span><b>nahdicare <em>clinics</em></b>';
homePage=function(){
 const roleLabel=appState.role==="owner"?"المسؤول الرئيسي":appState.role==="manager"?"مدير العيادة":"موظف العيادة";
 const displayName=appState.role==="owner"?"Owner Demo":appState.role==="manager"?"Clinic Manager":"Staff Demo";
 const hero='<div class="dashboard-hero"><div class="premium-employee"><div class="premium-portrait">'+premiumIcons.user+'</div><div><div class="premium-employee-name">مرحبًا، '+roleLabel+'</div><small class="premium-en">Welcome, '+displayName+'</small></div></div><div class="premium-moments"><span>✦</span><div><strong>كل يوم نصنع فرقًا | NahdiCare Moments</strong><p>بابتسامتك واهتمامك بضيوفنا، نصنع يومًا أفضل.</p></div></div></div>';
 const next='<div class="premium-next"><div><p>دوامك القادم | YOUR NEXT SHIFT</p><h2>02:00 PM – 10:00 PM</h2><p>الشفت المسائي · Evening Shift · نموذج تجريبي</p></div>'+premiumIcons.calendar+'</div>';
 const options=[["my","جدولي","My Schedule","calendar"],["team","جدول الموظفين","Staff Schedule","users"],["leaves","إجازاتي","Annual Leave","plane"],["award","موظف الشهر","Employee of the Month","trophy"],["profile","ملفي الشخصي","My Profile","user"],...(isAdmin()?[["admin","لوحة الإدارة","Admin Dashboard","shield"]]:[])];
 const tiles='<div class="premium-home-title">الخدمات الرئيسية | Main Services</div><div class="premium-tiles">'+options.map(([route,label,en,icon])=>'<button class="premium-tile '+(route==="award"?"gold":"")+'" data-page="'+route+'">'+premiumIcons[icon]+'<b>'+label+'</b><small>'+en+'</small></button>').join("")+'</div>';
 const award='<div class="premium-award-banner"><div class="award-icon">♛</div><div style="flex:1"><b>موظف الشهر | Employee of the Month</b><small>'+appState.award+' · نتيجة تجريبية 94 / 100</small></div><button class="secondary small" data-page="award">عرض</button></div>';
 return pageHead("الرئيسية | Home","NahdiCare Clinics · تطبيق إدارة الموظفين",'<span class="pill blueprint">DEMO</span>')+hero+next+tiles+award+'<p class="note" style="margin-top:19px">هذه واجهة عرض عامة ببيانات موظفين وهمية، وليست نظام إجازات أو إدارة منشورًا للاستخدام الرسمي.</p>';
};
render();
const previewRole=new URLSearchParams(location.search).get('demo');if(['owner','manager','staff'].includes(previewRole))login(previewRole);
