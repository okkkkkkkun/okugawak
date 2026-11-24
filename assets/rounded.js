(function(){
  document.documentElement.classList.add("design-rounded");
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

  // Responsive editorial footer for the rounded design. Keep all original links and credits.
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

  // Work Explorer: all views derive from the same existing work links.
  var source = document.querySelector(".page-body #work-source");
  if (source) {
    var body = source.parentElement;
    var original = source.querySelector(".works");
    if (original) {
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
      source.remove();
    }
  }

  if (document.body.classList.contains("is-home")) {
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

  // Subtle, scroll-linked motion; all content remains readable without JavaScript.
  var scrollStory = document.querySelector(".thoughts-story");
  if (scrollStory && !scrollStory.querySelector(".thoughts-stack") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var storySections = Array.from(scrollStory.querySelectorAll(".thoughts-story-section"));
    var storyOpening = scrollStory.querySelector(".thoughts-story-opening");
    var storyEnding = scrollStory.querySelector(".thoughts-story-ending");
    var progress = document.createElement("div");
    progress.className = "thoughts-story-progress";
    progress.setAttribute("aria-hidden","true");
    progress.innerHTML = '<span class="thoughts-story-progress-number">THOUGHTS</span><span class="thoughts-story-progress-track"><span class="thoughts-story-progress-fill"></span></span><span class="thoughts-story-progress-number">01 — 03</span>';
    document.body.appendChild(progress);
    var scheduled = false;
    function clamp(n){return Math.max(0,Math.min(1,n));}
    function updateScrollStory(){
      scheduled=false;
      var vh=window.innerHeight || 800;
      var start=scrollStory.getBoundingClientRect().top;
      var end=scrollStory.getBoundingClientRect().bottom;
      var total=Math.max(1,scrollStory.offsetHeight-vh);
      var pct=clamp(-start/total);
      progress.style.setProperty("--thought-page-progress",pct.toFixed(4));
      progress.classList.toggle("is-active",start < vh*.25 && end > vh*.65);
      if(storyOpening){
        var opening=storyOpening.getBoundingClientRect();
        storyOpening.style.setProperty("--thought-opening-shift",clamp(-opening.top/Math.max(1,opening.height)).toFixed(4));
      }
      storySections.forEach(function(section){
        var rect=section.getBoundingClientRect();
        var reveal=clamp((vh*.88-rect.top)/(vh*.55));
        section.style.setProperty("--thought-reveal",reveal.toFixed(4));
      });
      if(storyEnding){
        var closing=storyEnding.getBoundingClientRect();
        storyEnding.style.setProperty("--thought-ending-progress",clamp((vh*.9-closing.top)/(vh*.55)).toFixed(4));
      }
    }
    function scheduleScrollStory(){
      if(!scheduled){scheduled=true;requestAnimationFrame(updateScrollStory);}
    }
    window.addEventListener("scroll",scheduleScrollStory,{passive:true});
    window.addEventListener("resize",scheduleScrollStory,{passive:true});
    updateScrollStory();
  }


  // Sticky chapters with per-line scroll-driven typography.
  var stickyStory=document.querySelector(".thoughts-story");
  if(stickyStory){
    var chapterItems=Array.from(stickyStory.querySelectorAll(".thoughts-story-section"));
    chapterItems.forEach(function(chapter,i){
      if(!chapter.querySelector(".thoughts-chapter-frame")){
        var frame=document.createElement("div");
        frame.className="thoughts-chapter-frame";
        while(chapter.firstChild)frame.appendChild(chapter.firstChild);
        var counter=document.createElement("div");
        counter.className="thoughts-chapter-counter";
        counter.innerHTML="<strong>0"+(i+1)+"</strong> / 0"+chapterItems.length;
        frame.appendChild(counter);
        chapter.appendChild(frame);
      }
      var heading=chapter.querySelector(".thoughts-story-copy h3");
      if(heading&&!heading.querySelector(".thoughts-type-line")){
        var lines=heading.innerHTML.split(/<br\s*\/?\s*>/i);
        heading.innerHTML="";
        lines.forEach(function(line){
          var outer=document.createElement("span");
          outer.className="thoughts-type-line";
          var inner=document.createElement("span");
          inner.innerHTML=line;
          outer.appendChild(inner);
          heading.appendChild(outer);
        });
      }
    });
    if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      var pending=false;
      function chapterClamp(x){return Math.max(0,Math.min(1,x));}
      function paintChapters(){
        pending=false;
        var vh=window.innerHeight||800;
        chapterItems.forEach(function(chapter){
          var r=chapter.getBoundingClientRect();
          var stickyDistance=Math.max(1,r.height-vh);
          var p=chapterClamp((-r.top)/stickyDistance);
          chapter.style.setProperty("--chapter-progress",p.toFixed(4));
          chapter.querySelectorAll(".thoughts-type-line").forEach(function(line,i){
            var lp=chapterClamp((p-(i*.16))/.48);
            line.style.setProperty("--line-reveal",lp.toFixed(4));
          });
        });
      }
      function requestChapters(){if(!pending){pending=true;requestAnimationFrame(paintChapters);}}
      window.addEventListener("scroll",requestChapters,{passive:true});
      window.addEventListener("resize",requestChapters,{passive:true});
      paintChapters();
    }
  }


  // Stacking Thoughts uses one scroll position for the deck, text and closing message.
  var stack = document.querySelector(".thoughts-stack");
  if (stack) {
    var staticStack = window.matchMedia("(prefers-reduced-motion: reduce), (max-height: 560px)");
    var stage = stack.querySelector(".thoughts-stack-stage");
    var opening = stack.querySelector(".thoughts-story-opening");
    var deck = stack.querySelector(".thoughts-stack-deck");
    var cards = Array.from(deck.querySelectorAll(".thoughts-stack-card"));
    var outro = stack.querySelector(".thoughts-stack-outro");
    var frame = 0;
    var leadIn = 64;
    var introOffset, scrollRange, poses;

    function smooth(value) {
      var t = Math.max(0, Math.min(1, value));
      return t * t * (3 - 2 * t);
    }

    function between(progress, start, end) {
      return smooth((progress - start) / (end - start));
    }

    function reading(progress, start, full, hold, end) {
      return between(progress, start, full) * (1 - between(progress, hold, end));
    }

    function measureStack() {
      if (staticStack.matches) {
        stack.classList.remove("is-animated");
        outro.inert = false;
        return;
      }
      stack.classList.add("is-animated");
      var height = deck.offsetHeight;
      var tab = 36;
      var compact = 66;
      var gap = 8;
      var step = compact + gap;
      var summary = (height - 2 * gap) / 3;

      introOffset = Math.max(0, opening.offsetTop + opening.offsetHeight + 16 - deck.offsetTop);
      scrollRange = stack.offsetHeight - stage.offsetHeight + leadIn;
      poses = [
        [0,    [[0,84],[44,84],[88,66]]],
        [.19,  [[0,height-2*tab],[height-2*tab,tab],[height-tab,tab]]],
        [.34,  [[0,height-2*tab],[height-2*tab,tab],[height-tab,tab]]],
        [.45,  [[0,compact],[step,height-step-tab],[height-tab,tab]]],
        [.59,  [[0,compact],[step,height-step-tab],[height-tab,tab]]],
        [.70,  [[0,compact],[step,compact],[2*step,height-2*step]]],
        [.84,  [[0,compact],[step,compact],[2*step,height-2*step]]],
        [.96,  [[0,summary],[summary+gap,summary],[2*(summary+gap),summary]]]
      ];
      scheduleStack();
    }

    function renderStack() {
      frame = 0;
      if (staticStack.matches) return;
      var progress = Math.max(0, Math.min(1, (leadIn - stack.getBoundingClientRect().top) / scrollRange));
      var next = poses.findIndex(function(pose) { return pose[0] > progress; });
      if (next < 0) next = poses.length - 1;
      var from = poses[next - 1];
      var to = poses[next];
      var travel = between(progress, from[0], to[0]);
      var intro = 1 - between(progress, 0, .15);
      var closing = between(progress, .87, .97);
      var titleTimes = [[.08,.19,.34,.44],[.36,.45,.59,.69],[.61,.70,.84,.94]];
      var bodyTimes = [[.13,.19,.34,.39],[.40,.45,.59,.64],[.66,.70,.84,.89]];
      var positions = to[1].map(function(target, i) {
        var start = from[1][i];
        return [start[0] + (target[0] - start[0]) * travel, start[1] + (target[1] - start[1]) * travel];
      });

      stack.style.setProperty("--stack-intro", intro.toFixed(4));
      stack.style.setProperty("--stack-intro-offset", (intro * introOffset).toFixed(2) + "px");
      stack.style.setProperty("--stack-running", between(progress, .08, .19).toFixed(4));
      stack.style.setProperty("--stack-progress", progress.toFixed(4));
      stack.style.setProperty("--stack-outro", closing.toFixed(4));
      outro.inert = closing === 0;

      cards.forEach(function(card, i) {
        var top = positions[i][0];
        var height = positions[i][1];
        var visibleHeight = i < cards.length - 1 ? Math.min(height, positions[i + 1][0] - top) : height;
        var open = reading(progress, ...titleTimes[i]);
        var body = reading(progress, ...bodyTimes[i]);
        var heading = between(visibleHeight, 47, 63) * between(progress, .04, .15);
        card.style.setProperty("--stack-y", top.toFixed(2) + "px");
        card.style.setProperty("--stack-height", height.toFixed(2) + "px");
        card.style.setProperty("--stack-open", open.toFixed(4));
        card.style.setProperty("--stack-heading", heading.toFixed(4));
        card.style.setProperty("--stack-body", body.toFixed(4));
        var art = Math.max(body, .38 * closing);
        card.style.setProperty("--stack-art-space", art.toFixed(4));
        card.style.setProperty("--stack-art-visibility", Math.max(body, closing).toFixed(4));
        card.style.setProperty("--stack-rule", Math.max(open, closing, .5 * intro).toFixed(4));
      });
    }

    function scheduleStack() {
      if (!frame) frame = requestAnimationFrame(renderStack);
    }

    window.addEventListener("scroll", scheduleStack, {passive:true});
    window.addEventListener("resize", measureStack, {passive:true});
    staticStack.addEventListener("change", measureStack);
    var stackSizing = new ResizeObserver(measureStack);
    stackSizing.observe(opening);
    stackSizing.observe(deck);
    measureStack();
  }

})();
