(function(){
 var rounded=new URLSearchParams(location.search).get("design")==="rounded";
 document.documentElement.classList.toggle("design-rounded",rounded);
 var home=document.body.classList.contains("is-home");
 if(home){
  var link=document.createElement("a");
  link.className="design-switch";link.textContent=rounded?"Original design":"Rounded preview";
  link.href=rounded?location.pathname:location.pathname+"?design=rounded";
  link.setAttribute("aria-label",rounded?"元のデザインを表示":"Balancedデザインを表示");
  document.body.appendChild(link);
 }
 if(!rounded || !home)return;
 var pin=document.querySelector(".cover-pin"),source=document.querySelector(".map-canvas");
 if(!pin||!source)return;
 // The transition is a pixel-for-pixel copy of the ACTUAL interactive work map.
 // No unrelated SVG mesh or second Voronoi generator.
 var layer=document.createElement("canvas");
 layer.className="rounded-map-bridge";layer.setAttribute("aria-hidden","true");
 pin.appendChild(layer);
 var ctx=layer.getContext("2d"),busy=false,lastW=0,lastH=0;
 function paint(){
  busy=false;
  var h=Math.max(1,window.innerHeight);
  var p=Math.max(0,Math.min(1,(window.scrollY/h-.12)/.88));
  document.documentElement.style.setProperty("--transition-progress",p.toFixed(3));
  var alpha=Math.max(0,Math.min(1,(p-.24)/.68));
  var ready=source.width>0&&source.height>0;
  layer.style.opacity=ready?alpha.toFixed(3):"0";
  var w=layer.clientWidth,h2=layer.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);
  var bw=Math.round(w*dpr),bh=Math.round(h2*dpr);
  if(bw!==lastW||bh!==lastH){layer.width=bw;layer.height=bh;lastW=bw;lastH=bh;}
  if(ready&&bw&&bh){
   ctx.clearRect(0,0,bw,bh);
   ctx.drawImage(source,0,0,bw,bh);
  }
  document.body.classList.toggle("is-solid",p>.67);
 }
 function schedule(){if(!busy){busy=true;requestAnimationFrame(paint);}}
 window.addEventListener("scroll",schedule,{passive:true});
 window.addEventListener("resize",schedule,{passive:true});
 // The source map renders asynchronously as its photos load.
 // Refresh while the transition is visible so the two surfaces remain identical.
 function loop(){
  if(window.scrollY>0&&window.scrollY<window.innerHeight*1.1)schedule();
  requestAnimationFrame(loop);
 }
 requestAnimationFrame(loop);paint();
})();
