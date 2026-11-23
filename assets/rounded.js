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

  // Responsive editorial footer for the rounded design. Keep all original links and credits.
  if (rounded) {
    document.querySelectorAll(".site-foot").forEach(function(foot){
      var original=Array.from(foot.querySelectorAll(":scope > p"));
      if(original.length<5 || foot.querySelector(".foot-layout"))return;
      var affiliation=original[0].textContent.trim().split("/").filter(Boolean);
      var name=original[1].textContent.trim();
      var mail=original[2].querySelector("a");
      var brand=original[3].querySelector("a");
      var copyright=original[4].textContent.trim();
      var layout=document.createElement("div");
      layout.className="foot-layout";
      var identity=document.createElement("div");
      identity.className="foot-identity";
      var kicker=document.createElement("span");
      kicker.className="foot-kicker";
      kicker.textContent="KOTA OKUGAWA  /  PORTFOLIO";
      var signature=document.createElement("strong");
      signature.className="foot-signature";
      signature.textContent="奥川航大  |  Kota okugawa";
      var org=document.createElement("p");
      org.className="foot-affiliation";
      affiliation.forEach(function(part,i){
        if(i)org.appendChild(document.createElement("br"));
        org.appendChild(document.createTextNode(part));
      });
      identity.append(kicker,signature,org);
      var contact=document.createElement("div");
      contact.className="foot-contact";
      var contactLabel=document.createElement("span");
      contactLabel.className="foot-kicker";
      contactLabel.textContent="CONTACT";
      if(mail){mail.className="foot-mail";contact.append(contactLabel,mail.cloneNode(true));}
      if(brand){var link=brand.cloneNode(true);link.className="foot-brand";contact.appendChild(link);}
      var base=document.createElement("div");
      base.className="foot-base";
      var credit=document.createElement("small");
      credit.textContent=copyright;
      var top=document.createElement("a");
      top.className="foot-top";
      top.href="#";
      top.textContent="Back to top ↑";
      base.append(credit,top);
      layout.append(identity,contact,base);
      foot.replaceChildren(layout);
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
        '<button type="button" class="explorer-primary" data-view="voronoi" aria-pressed="true" aria-label="ボロノイ表示" title="Voronoi">'+
        '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 3.5 11 2l4.5 8-6 5-7-3zM15.5 10 22 5v13l-8 4-4.5-7zM11 2 22 5l-6.5 5"/></svg></button>'+
        '<button type="button" data-view="grid" aria-pressed="false" aria-label="グリッド表示" title="Grid">'+
        '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="2.5" width="8" height="8" rx="1.5"/><rect x="13.5" y="2.5" width="8" height="8" rx="1.5"/><rect x="2.5" y="13.5" width="8" height="8" rx="1.5"/><rect x="13.5" y="13.5" width="8" height="8" rx="1.5"/></svg></button>'+
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
      function renderVoronoi(){
        mapLayer.innerHTML='<section class="works-map explorer-map" id="works-map" aria-label="ドラッグして作品を探索">'+
          '<canvas class="map-canvas" tabindex="0" aria-label="作品マップ。ドラッグして移動、タップで選択し、もう一度タップして開く"></canvas>'+
          '<div class="map-tools">'+
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

  // Compare Thoughts variants; preserve the existing rounded preview.
  var thoughts = document.querySelector("[data-thoughts-experience]");
  if (thoughts) {
    var mode = new URLSearchParams(location.search).get("thoughts") === "b" ? "b" : "a";
    document.documentElement.setAttribute("data-thoughts-variant", mode);
    thoughts.querySelectorAll("[data-mode]").forEach(function(link){
      if(link.dataset.mode === mode)link.setAttribute("aria-current","true");
      else link.removeAttribute("aria-current");
    });
    var svg = thoughts.querySelector(".thoughts-generator svg");
    var density = thoughts.querySelector('[data-param="density"]');
    var variation = thoughts.querySelector('[data-param="variation"]');
    function drawThoughts(){
      if(!svg)return;
      var n=Number(density.value),v=Number(variation.value);
      var lines=[];
      for(var i=0;i<n;i++){
        var points=[];
        for(var j=0;j<=42;j++){
          var x=10+j*8.1;
          var y=18+i*174/Math.max(1,n-1)+Math.sin(j*.34+i*.4)*v*.22;
          points.push((j?"L":"M")+x.toFixed(1)+" "+y.toFixed(1));
        }
        lines.push('<path d="'+points.join(" ")+'" fill="none" stroke="'+(mode==="b"?"#5e625b":i%5===0?"#a9d5b5":"#d4ded5")+'" stroke-width="'+(i%5===0?1.6:.75)+'" opacity=".7"/>');
      }
      svg.innerHTML=lines.join("");
    }
    [density,variation].forEach(function(el){if(el)el.addEventListener("input",drawThoughts)});
    drawThoughts();
  }
  // Present the narrative order consistently in both desktop and mobile navigation.
  document.querySelectorAll(".bar-nav, .nav-sheet ol").forEach(function(nav){
    var links=Array.from(nav.children);
    var desired=["Thoughts","Work","Profile","Personal","Contact"];
    links.sort(function(a,b){
      var rank=function(el){var txt=el.textContent;var idx=desired.findIndex(function(label){return txt.includes(label)});return idx<0?99:idx};
      return rank(a)-rank(b);
    }).forEach(function(el){nav.appendChild(el)});
    if(nav.matches(".nav-sheet ol"))nav.querySelectorAll(".no").forEach(function(no,i){no.textContent=String(i+1).padStart(2,"0")});
  });

  var story = document.querySelector(".thoughts-story");
  if (story) {
    var reveals = story.querySelectorAll(".thoughts-reveal");
    if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var observer = new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target)}})},{threshold:.12});
      reveals.forEach(function(el){observer.observe(el)});
    } else reveals.forEach(function(el){el.classList.add("is-visible")});
  }
})();
