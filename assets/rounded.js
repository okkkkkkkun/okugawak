(function(){
 var params=new URLSearchParams(location.search);
 var rounded=params.get("design")==="rounded";
 document.documentElement.classList.toggle("design-rounded",rounded);
 if(!document.body.classList.contains("is-home"))return;
 var link=document.createElement("a");
 link.className="design-switch";
 link.textContent=rounded?"Original design":"Rounded preview";
 link.href=rounded?location.pathname:location.pathname+"?design=rounded";
 link.setAttribute("aria-label",rounded?"元のデザインを表示":"Balancedデザインを表示");
 document.body.appendChild(link);
 if(!rounded)return;
 var pin=document.querySelector(".cover-pin");
 if(!pin)return;
 var bridge=document.createElement("div");bridge.className="rounded-bridge";
 bridge.innerHTML='<svg viewBox="0 0 390 844" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#f6f3ee" stroke-width="9" stroke-linejoin="round" opacity=".8"><path d="M-20 130 Q85 155 125 60 T400 100"/><path d="M-20 450 Q100 415 145 525 T410 500"/><path d="M125 60 Q180 260 145 525"/><path d="M400 100 Q290 280 410 500"/><path d="M145 525 Q240 690 155 870"/></g></svg>';
 pin.appendChild(bridge);
 var busy=false;
 function paint(){
   busy=false;
   var h=Math.max(1,window.innerHeight);
   var p=Math.max(0,Math.min(1,(window.scrollY/h-.15)/.85));
   document.documentElement.style.setProperty("--transition-progress",p.toFixed(3));
   document.documentElement.style.setProperty("--bridge-opacity",(Math.sin(p*Math.PI)*.72).toFixed(3));
   document.body.classList.toggle("is-solid",p>.67);
 }
 function schedule(){if(!busy){busy=true;requestAnimationFrame(paint);}}
 window.addEventListener("scroll",schedule,{passive:true});
 window.addEventListener("resize",schedule,{passive:true});
 paint();
})();
