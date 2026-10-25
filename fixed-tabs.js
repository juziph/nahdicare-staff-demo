"use strict";
/* iOS safe, fixed chrome: put the persistent tab bar outside every scrolling container. */
(()=>{
  const bar=document.getElementById("bottom-nav");
  if(!bar)return;
  // A fixed child of an async/touch scrolling region can scroll with its parent in iOS WebKit.
  // Keeping this a direct child of document.body makes the viewport its containing block.
  if(bar.parentNode!==document.body)document.body.appendChild(bar);

  // Every new screen starts at the top of the independent content scroller.
  const previousNav=navTo;
  navTo=function(id){
    const previous=appState.page;
    previousNav(id);
    if(previous!==appState.page){const content=document.querySelector(".body-region");if(content)content.scrollTop=0;}
  };

  // Returning to the logged-out screen must keep the page scrollable.
  const app=document.getElementById("app");
  const sync=()=>{
    const active=!app.classList.contains("hidden");
    if(active&&!document.body.classList.contains("nahdi-shell-active")){
      const content=document.querySelector(".body-region");if(content)content.scrollTop=0;
    }
    document.body.classList.toggle("nahdi-shell-active",active);
  };
  new MutationObserver(sync).observe(app,{attributes:true,attributeFilter:["class"]});
  sync();
  window.NahdiLayoutDebug={barAtBody:()=>bar.parentNode===document.body};
})();
