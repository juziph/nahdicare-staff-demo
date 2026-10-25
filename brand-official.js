(function(){
const markFallback='<svg viewBox="0 0 100 100" aria-label="نهدي كير" width="50" height="50"><path d="M30 14 12 31l37 43 39-41-18-17-17 17" stroke="#268ff1" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M29 39 49 58 70 36" stroke="#23dcc2" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
const htmlMark='<img class="official-mark" alt="شعار عيادات النهدي كير" width="45" height="45" style="object-fit:contain" />';
const brand=document.querySelector(".brand-lockup");
if(brand)brand.innerHTML='<div class="official-full-logo">'+htmlMark+'<div class="official-logo-words"><b>عيادات <span>النهدي كير</span></b><small>nahdicare <em>clinics</em></small></div></div><div class="brand-rule"></div>';
for(const el of document.querySelectorAll(".mobile-brand-icon,.brand-logo")){
 el.innerHTML=htmlMark;
}
fetch("./official-symbol.b64").then(r=>{if(!r.ok)throw new Error("No logo data");return r.text()}).then(base64=>{
 const source="data:image/png;base64,"+base64.trim();
 for(const im of document.querySelectorAll(".official-mark")){
   im.onerror=()=>{im.replaceWith(document.createRange().createContextualFragment(markFallback))};
   im.src=source;
 }
}).catch(()=>{
 for(const im of document.querySelectorAll(".official-mark"))im.replaceWith(document.createRange().createContextualFragment(markFallback));
});

})();