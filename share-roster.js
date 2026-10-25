"use strict";
/* Export is local-only. No WhatsApp account, bot, or data transfer is automated. */
(()=>{
 const oldTeam=teamPage;
 teamPage=function(){
  const html=oldTeam();
  const panel='<section class="share-roster-box" aria-label="مشاركة جداول الفريق">'+
   '<div class="share-roster-head"><span class="share-roster-symbol">▤</span><div><b>مشاركة الجدول | Share Schedule</b>'+
   '<small>بنفس هوية نهدي كير • يفتح قائمة المشاركة لاختيار واتساب</small></div></div>'+
   '<div class="share-roster-actions">'+
   '<button type="button" id="share-week-roster" class="share-roster-btn"><span>▣</span> مشاركة الأسبوع <small>صورة PNG</small></button>'+
   '<button type="button" id="share-month-roster" class="share-roster-btn"><span>▤</span> مشاركة الشهر <small>PDF من 5 صفحات</small></button>'+
   '</div><p>النموذج غير معتمد للدوام الرسمي. إذا لم يدعم المتصفح مشاركة الملفات، سيُتاح تنزيلها وإرسالها يدويًا.</p></section>';
  return html.replace('<div class="card roster-card">',panel+'<div class="card roster-card">');
 };
 const pad=(v)=>String(v).padStart(2,"0");
 const dateOf=(day)=>new Date(Date.UTC(2026,10,day,12));
 const arWeek=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
 const enWeek=["SUN","MON","TUE","WED","THU","FRI","SAT"];
 const width=1490, height=1270;
 const color={
  m1:["#57d6c7","#073c4c"],m2:["#57d6c7","#073c4c"],
  e1:["#f5c274","#583812"],e2:["#f5c274","#583812"],e3:["#f5c274","#583812"],
  n:["#afa5e9","#2b2254"],off:["#b1d1e0","#204661"],al:["#f5adb3","#6d263b"]
 };
 function roundBox(ctx,x,y,w,h,r,fill,stroke){
   r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.roundRect(x,y,w,h,r);
   if(fill){ctx.fillStyle=fill;ctx.fill()}
   if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}
 }
 function text(ctx,value,x,y,font,color,align="center"){
   ctx.font=font;ctx.textBaseline="middle";ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(value,x,y);
 }
 function drawMark(ctx){
   ctx.save();ctx.translate(41,30);ctx.scale(.67,.67);
   ctx.strokeStyle="#269af3";ctx.lineWidth=16;ctx.lineCap="round";ctx.lineJoin="round";
   ctx.beginPath();ctx.moveTo(29,13);ctx.lineTo(12,31);ctx.lineTo(49,75);ctx.lineTo(87,35);ctx.lineTo(69,16);ctx.lineTo(52,33);ctx.stroke();
   ctx.strokeStyle="#25dec7";ctx.lineWidth=13;
   ctx.beginPath();ctx.moveTo(29,40);ctx.lineTo(49,58);ctx.lineTo(70,36);ctx.stroke();ctx.restore();
 }
 function drawWeek(startDay,periodIndex,isMonthly){
   const canvas=document.createElement("canvas");
   canvas.width=width;canvas.height=height;
   const c=canvas.getContext("2d",{alpha:false});
   const grad=c.createLinearGradient(0,0,width,height);grad.addColorStop(0,"#051a32");grad.addColorStop(.7,"#0a2948");grad.addColorStop(1,"#08213e");
   c.fillStyle=grad;c.fillRect(0,0,width,height);
   c.strokeStyle="#287ca7";c.lineWidth=3;c.strokeRect(13,13,width-26,height-26);
   drawMark(c);
   text(c,"nahdicare clinics",138,62,"700 26px Arial","#ffffff","left");
   text(c,"NAHDICARE STAFF • WEEKLY SCHEDULE",width-43,64,"700 25px Arial","#70ddeb","right");
   text(c,"جدول موظفي القسم  |  Staff Schedule",width/2,128,"700 42px Arial","#f5faff");
   const d1=dateOf(startDay),d2=dateOf(startDay+6);
   const section=isMonthly?"NOVEMBER 2026  |  "+String(periodIndex+1)+"/5":"NOVEMBER 2026  |  WEEK "+(appState.week+1);
   text(c,section,width/2,178,"700 23px Arial","#99c7e2");
   roundBox(c,38,205,width-76,55,11,"#624528","#e7ba64");
   text(c,"نسخة تجريبية — غير معتمدة   |   DEMO — NOT AN APPROVED ROSTER",width/2,232,"700 22px Arial","#ffe6ae");
   const left=38,top=283, gap=7, firstW=233,innerWidth=width-76, dayW=(innerWidth-firstW-gap*7)/7, headerH=66,rowH=79;
   roundBox(c,left,top,firstW-1,headerH,10,"#114168","#206994");
   text(c,"EMPLOYEE",left+firstW/2,top+headerH/2,"700 22px Arial","#e6f8ff");
   for(let x=0;x<7;x++){
     const day=startDay+x,dt=dateOf(day),offset=dt.getUTCDay(),sx=left+firstW+gap+x*(dayW+gap);
     roundBox(c,sx,top,dayW,headerH,10,"#12436a","#206994");
     text(c,enWeek[offset],sx+dayW/2,top+22,"700 18px Arial","#b9def4");
     text(c,String(dt.getUTCDate())+" "+(dt.getUTCMonth()===10?"NOV":"DEC"),sx+dayW/2,top+47,"700 18px Arial","#fff");
   }
   for(let p=0;p<people.length;p++){
     const y=top+headerH+gap+p*(rowH+gap);
     roundBox(c,left,y,firstW-1,rowH,10,"#10395e","#205b83");
     text(c,people[p],left+14,y+rowH/2,"700 19px Arial","#f2faff","left");
     for(let x=0;x<7;x++){
       const day=startDay+x,sx=left+firstW+gap+x*(dayW+gap);
       if(isMonthly&&day>30){roundBox(c,sx,y,dayW,rowH,10,"#193753","#36556c");text(c,"—",sx+dayW/2,y+39,"700 26px Arial","#627c97");continue}
       const code=(appState.overrides[p+"-"+day]||getShift(p,day));
       const sh=types[code]||types.off;
       const [bg,fg]=color[code]||color.off;
       roundBox(c,sx,y,dayW,rowH,11,bg);
       const tag=code==="m1"||code==="m2"?"MORNING":code==="e1"||code==="e2"||code==="e3"?"EVENING":code==="n"?"NIGHT":code==="al"?"LEAVE":"OFF";
       text(c,tag,sx+dayW/2,y+(sh.start?21:38),"700 15px Arial",fg);
       if(sh.start){text(c,sh.start,sx+dayW/2,y+44,"700 17px Arial",fg);text(c,sh.end,sx+dayW/2,y+65,"700 17px Arial",fg)}
     }
   }
   const footerY=top+headerH+gap+9*(rowH+gap)+9;
   c.strokeStyle="#306183";c.lineWidth=2;c.beginPath();c.moveTo(left,footerY);c.lineTo(width-left,footerY);c.stroke();
   const legend=[["#57d6c7","Morning صباحي"],["#f5c274","Evening مسائي"],["#afa5e9","Night ليلي"],["#b1d1e0","OFF راحة"],["#f5adb3","Annual Leave إجازة"]];
   let lx=left+3;
   for(const [clr,lab] of legend){roundBox(c,lx,footerY+25,19,19,4,clr);text(c,lab,lx+29,footerY+35,"600 16px Arial","#d3e9f5","left");lx+=lab.includes("Annual")?235:lab.includes("Evening")?228:lab.includes("Morning")?230:lab.includes("Night")?199:151;}
   text(c,"مناوبات مقترحة للتجربة فقط — تُراجع تغطية الطوارئ وساعات الراحة قبل الاعتماد.",width/2,height-65,"600 20px Arial","#b5cde1");
   text(c,"NahdiCare Staff  •  Preview",width/2,height-33,"600 17px Arial","#6894b6");
   return canvas;
 }
 function bytesFromData(canvas,mime,quality){
   const dataUrl=canvas.toDataURL(mime,quality);const raw=atob(dataUrl.slice(dataUrl.indexOf(",")+1));
   const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes;
 }
 function asPDF(jpegs){
   const enc=new TextEncoder(),pieces=[],ofs=[0];let length=0;
   function addBytes(b){pieces.push(b);length+=b.length}
   function add(s){addBytes(enc.encode(s))}
   function objStart(id){ofs[id]=length;add(id+" 0 obj\n")}
   function objEnd(){add("\nendobj\n")}
   add("%PDF-1.4\n%");
   addBytes(new Uint8Array([0xE2,0xE3,0xCF,0xD3,10]));
   objStart(1);add("<< /Type /Catalog /Pages 2 0 R >>");objEnd();
   objStart(2);add("<< /Type /Pages /Count "+jpegs.length+" /Kids ["+jpegs.map((_,i)=>(3+3*i)+" 0 R").join(" ")+"] >>");objEnd();
   const pw=745,ph=635;
   for(let i=0;i<jpegs.length;i++){
     const a=3+i*3,b=a+1,im=a+2,content="q\n"+pw+" 0 0 "+ph+" 0 0 cm\n/Im0 Do\nQ\n";
     objStart(a);add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 "+pw+" "+ph+"] /Resources << /XObject << /Im0 "+im+" 0 R >> >> /Contents "+b+" 0 R >>");objEnd();
     objStart(b);add("<< /Length "+enc.encode(content).length+" >>\nstream\n"+content+"endstream");objEnd();
     objStart(im);add("<< /Type /XObject /Subtype /Image /Width "+width+" /Height "+height+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+jpegs[i].length+" >>\nstream\n");addBytes(jpegs[i]);add("\nendstream");objEnd();
   }
   const start=length,total=2+jpegs.length*3;
   add("xref\n0 "+(total+1)+"\n0000000000 65535 f \n");
   for(let i=1;i<=total;i++)add(String(ofs[i]).padStart(10,"0")+" 00000 n \n");
   add("trailer\n<< /Size "+(total+1)+" /Root 1 0 R >>\nstartxref\n"+start+"\n%%EOF");
   return new Blob(pieces,{type:"application/pdf"});
 }
 function buildFile(which){
   if(which==="week"){
     const day=1+Math.max(0,Math.min(4,appState.week))*7;
     const png=bytesFromData(drawWeek(day,appState.week,false),"image/png");
     return new File([png],"NahdiCare_Week_"+(appState.week+1)+"_Nov_2026.png",{type:"image/png"});
   }
   const jpgs=[];
   for(let i=0;i<5;i++){const canvas=drawWeek(1+7*i,i,true);jpgs.push(bytesFromData(canvas,"image/jpeg",.90));canvas.width=0;canvas.height=0;}
   return new File([asPDF(jpgs)],"NahdiCare_Month_Nov_2026.pdf",{type:"application/pdf"});
 }
 function downloadFile(file){
   const url=URL.createObjectURL(file),a=document.createElement("a");
   a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 async function shareRoster(which,button){
   if(button.disabled)return;
   const label=button.innerHTML;
   button.disabled=true;button.innerHTML="جارٍ تجهيز الملف…";
   let file;
   try{file=buildFile(which)}
   catch(err){console.error("Export error:",err);toast("تعذر تجهيز الجدول. أعد المحاولة.");button.disabled=false;button.innerHTML=label;return}
   button.disabled=false;button.innerHTML=label;
   const what=which==="week"?"جدول الأسبوع":"جدول الشهر";
   const message="جدول موظفي عيادات النهدي كير — نوفمبر 2026\n"+what+"\n⚠️ نسخة تجريبية غير معتمدة للدوام الرسمي.";
   try{
     if(typeof navigator.share==="function"&&(!navigator.canShare||navigator.canShare({files:[file]}))){
       await navigator.share({files:[file],title:"NahdiCare Staff | "+what,text:message});
       return;
     }
     downloadFile(file);toast("تم تجهيز الملف. شاركه يدويًا عبر واتساب.");
   }catch(err){
     if(err&&err.name==="AbortError")return;
     console.warn("File share unavailable:",err);
     downloadFile(file);toast("تعذرت المشاركة المباشرة؛ نزّلنا الملف لتشاركه عبر واتساب.");
   }
 }
 document.addEventListener("click",e=>{
   const b=e.target.closest("#share-week-roster,#share-month-roster");
   if(!b||appState.page!=="team")return;
   shareRoster(b.id==="share-week-roster"?"week":"month",b);
 });
 // Debug exports expose no private state, only test routines with synthetic demo data.
 window.NahdiRosterExport={buildFile,drawWeek};
if(appState.role && appState.page==="team")render();
})();
