(function(){
  var rounded = new URLSearchParams(location.search).get("design") === "rounded";
  document.documentElement.classList.toggle("design-rounded", rounded);
  if (rounded) {
    document.querySelectorAll("a[href]").forEach(function (a) {
      var raw = a.getAttribute("href");
      if (!raw || raw[0] === "#" || /^(mailto:|tel:|https?:|javascript:)/i.test(raw)) return;
      var url = new URL(raw, location.href);
      if (url.origin !== location.origin) return;
      url.searchParams.set("design", "rounded");
      a.href = url.href;
    });
  }
  if (rounded) {
    // Work links and detail pages share a small geometric, responsive vocabulary.
    // Preserve native navigation, accessibility, and the existing page reveals.
    document.querySelectorAll(".work-row a.row").forEach(function (link) {
      var frame = link.querySelector(".frame");
      if (!frame) return;
      link.addEventListener("pointerdown", function () {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        frame.style.transform = "scale(.995)";
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (eventName) {
        link.addEventListener(eventName, function () { frame.style.transform = ""; });
      });
    });
  }

  // Work Explorer: all views derive from the same existing work links.
  if (rounded && /\/02_Works\/index\.html$/.test(location.pathname)) {
    var body = document.querySelector(".page-body");
    var original = body && body.querySelector(".works");
    var tool = body && body.querySelector("#tool");
    if (body && original) {
      var items = Array.from(original.querySelectorAll(".work-row")).map(function (article, i) {
        var a = article.querySelector("a.row"), image = article.querySelector("img");
        var time = article.querySelector("time");
        return {title:article.querySelector("h3").textContent.trim(),url:a.href,
          img:image ? image.src : "", date:time ? time.textContent.trim() : "",
          description:(article.querySelector(".excerpt") || {}).textContent || "",order:i};
      });
      if (tool) {
        var ta=tool.querySelector("a.row");
        items.push({title:"Football & Photo",url:ta.href,img:"",date:"",
          description:(tool.querySelector(".excerpt") || {}).textContent || "",order:items.length,kind:"Tool"});
      }
      var lead=document.querySelector(".page-hero .page-lead");
      if(lead) lead.remove();
      body.querySelectorAll(".log-label").forEach(function(el){el.remove();});
      original.remove();
      if(tool) tool.remove();
      var explorer=document.createElement("section");
      explorer.className="work-explorer";
      explorer.setAttribute("aria-label","作品表示");
      explorer.innerHTML='<div class="explorer-toolbar" role="group" aria-label="表示形式">'+
        ['Grid','List','Voronoi','Timeline'].map(function(v){return '<button type="button" data-view="'+v.toLowerCase()+'" aria-pressed="false">'+v+'</button>';}).join('')+
        '</div><div class="explorer-content" aria-live="polite"></div>';
      body.prepend(explorer);
      var panel=explorer.querySelector(".explorer-content");
      var buttons=Array.from(explorer.querySelectorAll("[data-view]"));
      function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
      function imageHtml(item){return item.img?'<span class="explorer-image"><img loading="lazy" alt="" src="'+esc(item.img)+'"></span>':'<span class="explorer-image explorer-placeholder" aria-hidden="true">↗</span>';}
      function card(item,index){return '<a class="explorer-card" href="'+esc(item.url)+'">'+imageHtml(item)+
        '<span class="explorer-info"><span class="explorer-index">'+String(index+1).padStart(2,"0")+' / '+esc(item.date||item.kind||"Tool")+'</span>'+
        '<strong>'+esc(item.title)+'</strong></span></a>';}
      function renderGrid(){panel.innerHTML='<div class="explorer-grid">'+items.map(card).join("")+'</div>';}
      function renderList(){panel.innerHTML='<div class="explorer-list">'+items.map(function(item,i){return '<a href="'+esc(item.url)+'" class="explorer-list-row"><span class="explorer-index">'+String(i+1).padStart(2,"0")+'</span><strong>'+esc(item.title)+'</strong><span class="explorer-date">'+esc(item.date||item.kind||"Tool")+'</span><span aria-hidden="true">↗</span></a>';}).join("")+'</div>';}
      function renderTimeline(){
        var groups={};
        items.forEach(function(item){var year=/^(\d{4})/.exec(item.date);var key=year?year[1]:"Other";(groups[key]||(groups[key]=[])).push(item);});
        var keys=Object.keys(groups).sort(function(a,b){return a==="Other"?1:b==="Other"?-1:Number(b)-Number(a);});
        panel.innerHTML='<div class="explorer-timeline">'+keys.map(function(year){return '<section class="explorer-year"><h2>'+esc(year)+'</h2><div>'+groups[year].map(function(item){return '<a href="'+esc(item.url)+'"><span class="explorer-date">'+esc(item.date||item.kind||"Tool")+'</span><strong>'+esc(item.title)+'</strong><span aria-hidden="true">↗</span></a>';}).join("")+'</div></section>';}).join("")+'</div>';
      }
      function clip(poly,a,b,c){
        var out=[];
        for(var i=0;i<poly.length;i++){
          var p=poly[i],q=poly[(i+1)%poly.length],d=a*p[0]+b*p[1]-c,e=a*q[0]+b*q[1]-c;
          if(d<=0)out.push(p);
          if((d<0&&e>0)||(d>0&&e<0)){var t=d/(d-e);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
        }
        return out;
      }
      function path(poly){
        if(poly.length<3)return "";
        var pts=poly.map(function(p,i){var before=poly[(i+poly.length-1)%poly.length],after=poly[(i+1)%poly.length];
          var a=Math.hypot(before[0]-p[0],before[1]-p[1]),b=Math.hypot(after[0]-p[0],after[1]-p[1]);
          var t=Math.min(17,a*.32,b*.32);
          return {x:p[0],y:p[1],enter:[p[0]+(before[0]-p[0])*t/a,p[1]+(before[1]-p[1])*t/a],
            leave:[p[0]+(after[0]-p[0])*t/b,p[1]+(after[1]-p[1])*t/b]};});
        return "M"+pts[0].leave.join(" ")+" "+pts.map(function(p,i){var next=pts[(i+1)%pts.length];return "L"+next.enter.join(" ")+" Q"+next.x+" "+next.y+" "+next.leave.join(" ");}).join("")+"Z";
      }
      function renderVoronoi(){
        var w=900,h=Math.max(650,Math.ceil(items.length/4)*235),cols=Math.ceil(Math.sqrt(items.length*1.35)),rows=Math.ceil(items.length/cols);
        var seeds=items.map(function(item,i){var col=i%cols,row=Math.floor(i/cols);
          return [(col+.5+Math.sin(i*2.9)*.22)*w/cols,(row+.5+Math.cos(i*3.7)*.2)*h/rows];});
        var defs="",cells="";
        items.forEach(function(item,i){
          var p=seeds[i],poly=[[0,0],[w,0],[w,h],[0,h]];
          seeds.forEach(function(q,j){if(i===j)return;var a=q[0]-p[0],b=q[1]-p[1];poly=clip(poly,a,b,(q[0]*q[0]+q[1]*q[1]-p[0]*p[0]-p[1]*p[1])/2);});
          if(poly.length<3)return;
          // Inset each cell by ~1.5px; quadratic corner smoothing matches the design vocabulary.
          var center=poly.reduce(function(o,v){return [o[0]+v[0]/poly.length,o[1]+v[1]/poly.length];},[0,0]);
          poly=poly.map(function(v){var d=Math.hypot(v[0]-center[0],v[1]-center[1]);return [v[0]+(center[0]-v[0])*Math.min(1.5/d,.15),v[1]+(center[1]-v[1])*Math.min(1.5/d,.15)];});
          var id="vx-"+i,shape=path(poly);
          defs+='<clipPath id="'+id+'"><path d="'+shape+'"/></clipPath>';
          var img=item.img?'<image href="'+esc(item.img)+'" x="'+(p[0]-w/cols*.9)+'" y="'+(p[1]-h/rows*.9)+'" width="'+(w/cols*1.8)+'" height="'+(h/rows*1.8)+'" preserveAspectRatio="xMidYMid slice" clip-path="url(#'+id+')"/>':'<path d="'+shape+'" fill="#b5ada0"/>';
          cells+='<a href="'+esc(item.url)+'" aria-label="'+esc(item.title)+'"><path d="'+shape+'" fill="#a9a296"/>'+img+
            '<path d="'+shape+'" fill="transparent" stroke="#e7e2d9" stroke-width="3"/>'+
            '<title>'+esc(item.title)+'</title></a>';
        });
        panel.innerHTML='<div class="explorer-voronoi"><svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="作品のボロノイマップ"><defs>'+defs+'</defs>'+cells+'</svg></div>'+
          '<p class="explorer-hint">セルをタップすると作品を開きます</p>';
      }
      function switchView(v){
        buttons.forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.view===v));});
        panel.className="explorer-content view-"+v;
        if(v==="list")renderList();else if(v==="timeline")renderTimeline();else if(v==="voronoi")renderVoronoi();else renderGrid();
        try{sessionStorage.setItem("work-explorer-view",v);}catch(e){}
      }
      buttons.forEach(function(b){b.addEventListener("click",function(){switchView(b.dataset.view);});});
      var initial="grid";try{initial=sessionStorage.getItem("work-explorer-view")||"grid";}catch(e){}
      switchView(["grid","list","voronoi","timeline"].includes(initial)?initial:"grid");
    }
  }

  if (!document.body.classList.contains("is-home")) return;
  var link = document.createElement("a");
  link.className = "design-switch";
  link.textContent = rounded ? "Original design" : "Rounded preview";
  link.href = rounded ? location.pathname : location.pathname + "?design=rounded";
  link.setAttribute("aria-label", rounded ? "元のデザインを表示" : "Balancedデザインを表示");
  document.body.appendChild(link);
  if (rounded) {
    var tagline = document.querySelector(".cover-en");
    if (tagline) {
      var phrase = "Make / Run / Rethink.";
      var output = document.createElement("span");
      output.className = "editor-typing";
      output.setAttribute("aria-hidden", "true");
      tagline.textContent = "";
      tagline.setAttribute("aria-label", phrase);
      tagline.appendChild(output);
      var caret = document.createElement("span");
      caret.className = "editor-caret";
      caret.setAttribute("aria-hidden", "true");
      tagline.appendChild(caret);
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        output.textContent = phrase;
      } else {
        var index = 0, erasing = false;
        function typeNext() {
          if (document.hidden) { setTimeout(typeNext, 350); return; }
          output.textContent = phrase.slice(0, index);
          var delay = erasing ? 42 : 95;
          if (!erasing && index === phrase.length) { erasing = true; delay = 2600; }
          else if (erasing && index === 0) { erasing = false; delay = 650; }
          else if (erasing) index--;
          else index++;
          setTimeout(typeNext, delay);
        }
        setTimeout(typeNext, 600);
      }
    }
  }
  // Spatial Reveal deliberately uses the native scroll flow.
  // No duplicate canvas, decorative Voronoi, scroll interpolation or snapping.
})();
