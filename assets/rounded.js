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
    var source = body && body.querySelector("#work-source");
    var original = source && source.content.querySelector(".works");
    if (body && original) {
      var items = Array.from(original.querySelectorAll(".work-row")).map(function (article, i) {
        var a = article.querySelector("a.row"), image = article.querySelector("img");
        var time = article.querySelector("time");
        return {title:article.querySelector("h3").textContent.trim(),url:a.href,
          img:image ? image.src : "", date:time ? time.textContent.trim() : "",
          description:(article.querySelector(".excerpt") || {}).textContent || "",order:i};
      });
      var lead=document.querySelector(".page-hero .page-lead");
      if(lead) lead.remove();
      body.querySelectorAll(".log-label").forEach(function(el){el.remove();});
      source.remove();
      var explorer=document.createElement("section");
      explorer.className="work-explorer";
      explorer.setAttribute("aria-label","作品表示");
      explorer.innerHTML='<div class="explorer-toolbar" role="group" aria-label="作品の表示形式">'+
        '<button type="button" class="explorer-primary" data-view="voronoi" aria-pressed="true" aria-label="ボロノイマップに戻る">◈ <span>Voronoi</span></button>'+
        '<span class="explorer-toolbar-divider" aria-hidden="true"></span>'+
        '<button type="button" data-view="grid" aria-pressed="false">Grid</button>'+
        '<button type="button" data-view="timeline" aria-pressed="false">Timeline</button>'+
        '</div><div class="explorer-content view-voronoi">'+
        '<div class="explorer-map-layer"></div>'+
        '<div class="explorer-subview" aria-hidden="true"><div class="explorer-subview-inner"></div></div></div>';
      body.prepend(explorer);
      var panel=explorer.querySelector(".explorer-content");
      var mapLayer=explorer.querySelector(".explorer-map-layer");
      var subview=explorer.querySelector(".explorer-subview");
      var subviewInner=explorer.querySelector(".explorer-subview-inner");
      var buttons=Array.from(explorer.querySelectorAll("[data-view]"));
      function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
      function imageHtml(item){return item.img?'<span class="explorer-image"><img loading="lazy" alt="" src="'+esc(item.img)+'"></span>':'<span class="explorer-image explorer-placeholder" aria-hidden="true">↗</span>';}
      function card(item,index){return '<a class="explorer-card" href="'+esc(item.url)+'">'+imageHtml(item)+
        '<span class="explorer-info"><span class="explorer-date">'+esc(item.date||"時期未設定")+'</span>'+
        '<strong>'+esc(item.title)+'</strong></span></a>';}
      function renderGrid(){subviewInner.innerHTML='<div class="explorer-grid">'+items.map(card).join("")+'</div>';}
      function renderTimeline(){
        var groups={};
        items.forEach(function(item){var year=/^(\d{4})/.exec(item.date);var key=year?year[1]:"Other";(groups[key]||(groups[key]=[])).push(item);});
        var keys=Object.keys(groups).sort(function(a,b){return a==="Other"?1:b==="Other"?-1:Number(b)-Number(a);});
        subviewInner.innerHTML='<div class="explorer-timeline">'+keys.map(function(year){
          return '<section class="explorer-year"><h2>'+esc(year==="Other"?"OTHER":year)+'</h2><div>'+
          groups[year].map(function(item){return '<a href="'+esc(item.url)+'" class="explorer-timeline-row">'+
            imageHtml(item)+'<span class="explorer-timeline-info"><span class="explorer-date">'+esc(item.date||"時期未設定")+'</span>'+
            '<strong>'+esc(item.title)+'</strong></span>'+
            '<span class="explorer-timeline-arrow" aria-hidden="true">↗</span></a>';}).join("")+'</div></section>';
        }).join("")+'</div>';
      }
      function renderVoronoi(){
        mapLayer.innerHTML='<section class="works-map explorer-map" id="works-map" aria-label="ドラッグして作品を探索">'+
          '<canvas class="map-canvas" tabindex="0" aria-label="作品マップ。ドラッグして移動、タップで選択し、もう一度タップして開く"></canvas>'+
          '<div class="map-tools"><p class="map-hint" id="map-hint">DRAG TO EXPLORE</p>'+
          '<button type="button" id="map-shuffle" aria-label="シャッフル">↝</button>'+
          '<button type="button" id="map-reset" aria-label="元の配置に戻す">↺</button></div></section>';
        var node=document.createElement("script");
        node.type="application/json";
        node.id="works-map-data";
        node.textContent=JSON.stringify(items.filter(function(item){return item.img;}).map(function(item){
          return {title:item.title,href:item.url,thumb:item.img,year:item.date.slice(0,4),kind:item.kind||"作品"};
        }));
        mapLayer.appendChild(node);
        var script=document.createElement("script");
        script.src=new URL("../assets/top.js",location.href).href;
        script.dataset.workMap="true";
        mapLayer.appendChild(script);
      }
      renderVoronoi();
      function switchView(v){
        var sub=v!=="voronoi";
        buttons.forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.view===v));});
        panel.className="explorer-content view-"+v;
        if(v==="grid")renderGrid();
        else if(v==="timeline")renderTimeline();
        subview.setAttribute("aria-hidden",String(!sub));
        subview.inert=!sub;
        if(!sub)subviewInner.innerHTML="";
        // Keep the canvas mounted: no image reload, no reset of cell positions.
        if(!sub)requestAnimationFrame(function(){window.dispatchEvent(new Event("resize"));});
      }
      buttons.forEach(function(b){b.addEventListener("click",function(){switchView(b.dataset.view);});});
      // Always open Work in its primary Voronoi experience.
      subview.inert=true;
      switchView("voronoi");
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
