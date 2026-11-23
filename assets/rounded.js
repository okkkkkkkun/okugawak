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
  // Spatial Reveal deliberately uses the native scroll flow.
  // No duplicate canvas, decorative Voronoi, scroll interpolation or snapping.
})();
