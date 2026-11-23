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
