(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var mark = document.querySelector(".assemble svg");
  if (mark && !reduce) {
    var stage = mark.parentElement;
    var joint = mark.querySelector(".joint");
    var gapWord = mark.querySelector(".gap-word");
    var pullHint = document.querySelector(".assemble-hint");
    var planes = Array.prototype.map.call(mark.querySelectorAll(".plane"), function (el, index) {
      return { el: el, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, drag: null, side: index === 0 ? -1 : 1, phase: index * 1.7 };
    });
    var keys = { x: 0, y: 0 };
    var anchor = { left: 0, top: 0 };
    var words = ["Make", "Run", "Rethink"];
    var cycle = 0;
    var shownCycle = 0;
    var cycles = document.querySelectorAll(".cover-en .cycle");
    var loop = false;
    var wasApart = false;
    var lastTap = 0;
    var flashUntil = 0;

    mark.classList.add("mark-svg");
    var overlay = null;
    function unit() {
      if (mark.dataset.unit) return Number(mark.dataset.unit) || 3;
      var box = mark.getBoundingClientRect();
      return box.width / 32 || 3;
    }
    function soften(x, y) {
      var d = Math.hypot(x, y);
      var knee = 14;
      if (d <= knee) return { x: x, y: y };
      var extra = d - knee;
      var eased = knee + extra / (1 + extra / 360);
      var scale = eased / d;
      return { x: x * scale, y: y * scale };
    }
    function readAnchor() {
      if (mark.dataset.lifted) return;
      var box = mark.getBoundingClientRect();
      if (box.width < 2) return;
      anchor.left = box.left;
      anchor.top = box.top;
    }
    function contain(x, y) {
      var field = document.querySelector(".hero-k");
      if (!field || anchor.left === 0 && anchor.top === 0) return { x: Math.max(-0.2, x), y: y };
      var u = unit();
      var pad = 10;
      var rect = field.getBoundingClientRect();
      var minX = Math.max(-0.2, (rect.left + pad - anchor.left) / u - 11.6);
      var maxX = (rect.right - pad - anchor.left) / u - 27;
      var minY = (rect.top + pad - anchor.top) / u - 3;
      var maxY = (rect.bottom - pad - anchor.top) / u - 29;
      var bar = document.querySelector(".bar");
      if (bar) minY = Math.max(minY, (bar.getBoundingClientRect().bottom + 6 - anchor.top) / u - 3);
      var left = anchor.left + (11.6 + x) * u;
      var right = anchor.left + (27 + x) * u;
      [".cover-copy", ".cover-affil"].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (!el) return;
        var r = el.getBoundingClientRect();
        if (right > r.left + 2 && left < r.right - 2) {
          maxY = Math.min(maxY, (r.top - 12 - anchor.top) / u - 29);
        }
      });
      if (minX > maxX) maxX = minX;
      if (minY > maxY) maxY = minY;
      return { x: Math.min(maxX, Math.max(minX, x)), y: Math.min(maxY, Math.max(minY, y)) };
    }
    function applyCycle(index) {
      if (index === shownCycle) return;
      shownCycle = index;
      cycles.forEach(function (el, i) { el.classList.toggle("is-on", i === index); });
    }
    function lift() {
      if (!stage || mark.dataset.lifted) return;
      var box = mark.getBoundingClientRect();
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "assemble-overlay";
      }
      var pin = document.querySelector(".cover-pin");
      if (!overlay.parentElement && pin) pin.appendChild(overlay);
      overlay.appendChild(mark);
      if (stage) {
        stage.style.minWidth = box.width + "px";
        stage.style.minHeight = box.height + "px";
      }
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var scale = box.width / 32 || 3;
      mark.dataset.lifted = "1";
      mark.dataset.unit = String(scale);
      mark.setAttribute("viewBox", "0 0 " + vw + " " + vh);
      mark.style.position = "fixed";
      mark.style.left = "0";
      mark.style.top = "0";
      mark.style.width = vw + "px";
      mark.style.height = vh + "px";
      mark.style.margin = "0";
      var wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      wrap.setAttribute("class", "lift-wrap");
      wrap.setAttribute("transform", "translate(" + box.left + " " + box.top + ") scale(" + scale + ")");
      while (mark.firstChild) wrap.appendChild(mark.firstChild);
      mark.appendChild(wrap);
    }
    function unlift() {
      if (!overlay || mark.parentElement !== overlay) return;
      var wrap = mark.querySelector(".lift-wrap");
      if (wrap) {
        while (wrap.firstChild) mark.appendChild(wrap.firstChild);
        wrap.remove();
      }
      delete mark.dataset.lifted;
      delete mark.dataset.unit;
      mark.setAttribute("viewBox", "0 0 32 32");
      mark.style.position = "";
      mark.style.left = "";
      mark.style.top = "";
      mark.style.width = "";
      mark.style.height = "";
      mark.style.margin = "";
      if (stage) {
        stage.style.minWidth = "";
        stage.style.minHeight = "";
      }
      stage.appendChild(mark);
    }
    function paint() {
      planes[0].el.setAttribute("transform", "translate(0 0)");
      planes[1].el.setAttribute(
        "transform",
        "translate(" + planes[1].x.toFixed(2) + " " + planes[1].y.toFixed(2) + ")"
      );
      var ax = 12;
      var ay = 16;
      var bx = 12 + planes[1].x;
      var by = 16 + planes[1].y;
      var gap = Math.hypot(planes[1].x, planes[1].y);
      var show = Math.max(0, Math.min(1, (gap - 1.2) / 4));
      var distI = gap > 22 ? 2 : gap > 9 ? 1 : 0;
      var wordI = gap > 3 ? Math.max(cycle, distI) : cycle;
      applyCycle(wordI);
      if (joint) {
        joint.setAttribute("x1", ax.toFixed(2));
        joint.setAttribute("y1", ay.toFixed(2));
        joint.setAttribute("x2", bx.toFixed(2));
        joint.setAttribute("y2", by.toFixed(2));
        var snapping = performance.now() < flashUntil;
        joint.style.opacity = String(snapping ? 1 : show);
        joint.style.strokeWidth = snapping ? "1.6" : "0.7";
      }
      if (gapWord) {
        var dx = bx - ax;
        var dy = by - ay;
        var len = Math.hypot(dx, dy) || 1;
        var nx = -dy / len;
        var ny = dx / len;
        if (ny > 0) { nx = -nx; ny = -ny; }
        var mx = (ax + bx) / 2 + nx * 2.8;
        var my = (ay + by) / 2 + ny * 2.8;
        var scale = Math.max(1, Math.min(1.7, 0.9 + gap / 28));
        gapWord.textContent = words[wordI];
        gapWord.setAttribute("x", "0");
        gapWord.setAttribute("y", "0");
        gapWord.setAttribute(
          "transform",
          "translate(" + mx.toFixed(2) + " " + my.toFixed(2) + ") scale(" + scale.toFixed(3) + ")"
        );
        gapWord.style.opacity = String(Math.max(0, Math.min(1, (gap - 3.5) / 3.5)));
      }
    }
    function flash() {
      flashUntil = performance.now() + 220;
    }
    function tick(now) {
      var dt = 1;
      var live = false;
      var t = now || performance.now();
      if (!mark.dataset.lifted) readAnchor();
      planes[0].x = 0;
      planes[0].y = 0;
      var plane = planes[1];
      if (plane.drag) live = true;
      else {
        var dist = Math.hypot(plane.x, plane.y);
        var tx = keys.x * 8;
        var ty = keys.y * 6;
        var spring = dist > 24 ? 0.1 : 0.16;
        var damp = dist > 24 ? 0.86 : 0.74;
        plane.vx += (tx - plane.x) * spring * dt;
        plane.vy += (ty - plane.y) * spring * dt;
        plane.vx *= damp;
        plane.vy *= damp;
        plane.x += plane.vx * dt;
        plane.y += plane.vy * dt;
        var held = contain(plane.x, plane.y);
        plane.x = held.x;
        plane.y = held.y;
        if (Math.hypot(plane.vx, plane.vy) > 0.04 || Math.abs(plane.x - tx) > 0.08 || dist > 0.6) live = true;
      }
      var settled = !plane.drag && Math.hypot(plane.x, plane.y) < 1.15 && Math.hypot(plane.vx, plane.vy) < 0.25;
      if (settled) unlift();
      var gap = Math.hypot(planes[1].x, planes[1].y);
      var speed = Math.hypot(planes[1].vx, planes[1].vy);
      if (wasApart && gap < 1.15 && speed > 0.35) flash();
      wasApart = gap > 5;
      paint();
      if (live || keys.x || keys.y) requestAnimationFrame(tick);
      else loop = false;
    }
    function wakeMark() {
      if (loop) return;
      loop = true;
      requestAnimationFrame(tick);
    }
    function forgetHint() {
      if (pullHint) pullHint.classList.add("is-gone");
    }
    function explode() {
      forgetHint();
      readAnchor();
      lift();
      planes[1].vx = 16;
      planes[1].vy = -3;
      wakeMark();
    }
    function startDrag(plane, x, y, id, type) {
      if (plane.side < 0) return;
      readAnchor();
      lift();
      plane.drag = { x: x, y: y, ox: plane.x, oy: plane.y, id: id, type: type };
      plane.vx = 0;
      plane.vy = 0;
      forgetHint();
      wakeMark();
    }
    function moveDrag(plane, x, y) {
      if (!plane.drag || plane.side < 0) return;
      var u = unit();
      var rawX = plane.drag.ox + (x - plane.drag.x) / u;
      var rawY = plane.drag.oy + (y - plane.drag.y) / u;
      var soft = soften(rawX, rawY);
      var box = contain(soft.x, soft.y);
      plane.vx = box.x - plane.x;
      plane.vy = box.y - plane.y;
      plane.x = box.x;
      plane.y = box.y;
      paint();
      wakeMark();
    }
    function endDrag(plane, x, y, id) {
      if (!plane.drag || (id != null && id !== plane.drag.id)) return;
      var moved = Math.hypot((x == null ? plane.drag.x : x) - plane.drag.x, (y == null ? plane.drag.y : y) - plane.drag.y);
      var type = plane.drag.type;
      var travel = Math.hypot(plane.x, plane.y);
      plane.drag = null;
      if (travel > 10) {
        var ang = Math.atan2(plane.y, plane.x);
        var kick = Math.min(22, 4 + travel * 0.18);
        plane.vx = -Math.cos(ang) * kick;
        plane.vy = -Math.sin(ang) * kick;
        plane.vr = plane.side * Math.min(16, travel * 0.12);
        if (travel > 26) flash();
      }
      if (moved < 8 && type === "touch") {
        var now = performance.now();
        if (now - lastTap < 340) explode();
        lastTap = now;
      }
      wakeMark();
    }
    planes.forEach(function (plane) {
      if (plane.side < 0) return;
      plane.el.addEventListener("pointerdown", function (event) {
        if (event.button != null && event.button !== 0) return;
        startDrag(plane, event.clientX, event.clientY, event.pointerId, event.pointerType || "mouse");
        try { plane.el.setPointerCapture(event.pointerId); } catch (err) { /* synthetic or already gone */ }
      });
      plane.el.addEventListener("pointermove", function (event) {
        if (!plane.drag || event.pointerId !== plane.drag.id) return;
        plane.drag.saw = performance.now();
        moveDrag(plane, event.clientX, event.clientY);
      });
      function pointerRelease(event) {
        if (!plane.drag || event.pointerId !== plane.drag.id) return;
        endDrag(plane, event.clientX, event.clientY, event.pointerId);
        if (plane.el.hasPointerCapture && plane.el.hasPointerCapture(event.pointerId)) {
          try { plane.el.releasePointerCapture(event.pointerId); } catch (err) { /* already released */ }
        }
      }
      plane.el.addEventListener("pointerup", pointerRelease);
      plane.el.addEventListener("pointercancel", function (event) {
        if (!plane.drag || event.pointerId !== plane.drag.id) return;
        if ((plane.drag.type === "touch" || plane.drag.type === "pen") && event.pointerType !== "mouse") {
          plane.drag.pointerLost = true;
          return;
        }
        pointerRelease(event);
      });
      plane.el.addEventListener("touchstart", function (event) {
        if (event.cancelable) event.preventDefault();
        if (plane.drag && event.touches[0]) plane.drag.touchId = event.touches[0].identifier;
      }, { passive: false });
      plane.el.addEventListener("touchmove", function (event) {
        if (!plane.drag) return;
        if (event.cancelable) event.preventDefault();
        var live = plane.drag.saw && performance.now() - plane.drag.saw < 70;
        if (!plane.drag.pointerLost && live) return;
        var t = event.touches[0];
        if (!t) return;
        moveDrag(plane, t.clientX, t.clientY);
      }, { passive: false });
      plane.el.addEventListener("touchend", function (event) {
        if (!plane.drag) return;
        var t = event.changedTouches[0];
        endDrag(plane, t ? t.clientX : null, t ? t.clientY : null, plane.drag.id);
      });
      plane.el.addEventListener("touchcancel", function (event) {
        if (!plane.drag) return;
        endDrag(plane, null, null, plane.drag.id);
      });
      window.addEventListener("pointermove", function (event) {
        if (!plane.drag || event.pointerId !== plane.drag.id) return;
        if (event.target === plane.el || plane.el.contains(event.target)) return;
        plane.drag.saw = performance.now();
        moveDrag(plane, event.clientX, event.clientY);
      });
      window.addEventListener("pointerup", function (event) {
        if (!plane.drag || event.pointerId !== plane.drag.id) return;
        if (event.target === plane.el || plane.el.contains(event.target)) return;
        pointerRelease(event);
      });
      window.addEventListener("pointercancel", function (event) {
        if (!plane.drag || event.pointerId !== plane.drag.id) return;
        if (event.target === plane.el || plane.el.contains(event.target)) return;
        pointerRelease(event);
      });
    });
    mark.addEventListener("dblclick", function (event) {
      event.preventDefault();
      explode();
    });
    mark.addEventListener("keydown", function (event) {
      var used = true;
      if (event.key === "ArrowLeft") keys.x = -1;
      else if (event.key === "ArrowRight") keys.x = 1;
      else if (event.key === "ArrowUp") keys.y = -1;
      else if (event.key === "ArrowDown") keys.y = 1;
      else if (event.key === "Enter") explode();
      else used = false;
      if (!used) return;
      event.preventDefault();
      forgetHint();
      wakeMark();
    });
    mark.addEventListener("keyup", function (event) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") keys.x = 0;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") keys.y = 0;
      wakeMark();
    });
    readAnchor();
    setInterval(function () {
      if (planes[1].drag || Math.hypot(planes[1].x, planes[1].y) > 6) return;
      cycle = (cycle + 1) % words.length;
      paint();
    }, 2200);
    wakeMark();
  }

  var section = document.getElementById("works-map");
  var dataNode = document.getElementById("works-map-data");
  var canvas = section && section.querySelector("canvas");
  if (!section || !dataNode || !canvas || reduce) return;

  var hint = document.getElementById("map-hint");
  var shuffleBtn = document.getElementById("map-shuffle");
  var resetBtn = document.getElementById("map-reset");

  var works = JSON.parse(dataNode.textContent).filter(function (item) {
    return item.thumb;
  });
  if (!works.length) return;

  var images = works.map(function () {
    var img = new Image();
    img.decoding = "async";
    return img;
  });
  var loaded = false;
  var io = new IntersectionObserver(function (entries) {
    if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
    works.forEach(function (work, index) {
      images[index].onload = function () { draw(); };
      images[index].src = work.thumb;
    });
    loaded = true;
    io.disconnect();
    draw();
  }, { rootMargin: "240px" });
  io.observe(section);

  var hot = -1;
  var labelFor = -2;
  var labelT = 1;
  var touchHot = -1;
  var dragId = -1;
  var seeds = [];
  var view = { w: 1, h: 1 };
  var dpr = 1;
  var running = false;
  var gesture = null;
  var seenDrag = false;

  function homePoint(index) {
    var cols = Math.ceil(Math.sqrt(works.length * 1.35));
    var rows = Math.ceil(works.length / cols);
    var col = index % cols;
    var row = Math.floor(index / cols);
    var nx = 0.1 + ((col + 0.5) / cols) * 0.8;
    var ny = 0.12 + ((row + 0.5) / rows) * 0.76;
    nx += ((index * 47) % 17 - 8) * 0.008;
    ny += ((index * 19) % 13 - 6) * 0.008;
    return { nx: Math.min(0.92, Math.max(0.08, nx)), ny: Math.min(0.9, Math.max(0.1, ny)) };
  }

  function ensureSeeds() {
    if (seeds.length === works.length) return;
    seeds = works.map(function (_, index) {
      var home = homePoint(index);
      return { nx: home.nx, ny: home.ny, hx: home.nx, hy: home.ny, vx: 0, vy: 0, tx: null, ty: null };
    });
  }

  function px(seed) { return { x: seed.nx * view.w, y: seed.ny * view.h }; }

  function fitCanvas() {
    var rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    var next = Math.min(window.devicePixelRatio || 1, 2);
    var w = rect.width;
    var h = rect.height;
    var bw = Math.round(w * next);
    var bh = Math.round(h * next);
    if (canvas.width !== bw || canvas.height !== bh) {
      dpr = next;
      canvas.width = bw;
      canvas.height = bh;
    }
    view.w = w;
    view.h = h;
    ensureSeeds();
  }

  function syncViewport() {
    if (gesture) return;
    var vv = window.visualViewport;
    var h = vv && vv.height ? vv.height : window.innerHeight;
    if (!h || h < 80) return;
    var next = Math.round(h) + "px";
    if (document.documentElement.style.getPropertyValue("--vvh") !== next) {
      document.documentElement.style.setProperty("--vvh", next);
    }
  }

  function clip(poly, inside, hit) {
    var next = [];
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i];
      var b = poly[(i + 1) % poly.length];
      var ain = inside(a);
      var bin = inside(b);
      if (ain && bin) next.push(b);
      else if (ain && !bin) next.push(hit(a, b));
      else if (!ain && bin) {
        next.push(hit(a, b));
        next.push(b);
      }
    }
    return next;
  }

  function cell(index) {
    var site = px(seeds[index]);
    var poly = [
      { x: 0, y: 0 },
      { x: view.w, y: 0 },
      { x: view.w, y: view.h },
      { x: 0, y: view.h }
    ];
    for (var i = 0; i < seeds.length; i++) {
      if (i === index) continue;
      var other = px(seeds[i]);
      var mx = (site.x + other.x) * 0.5;
      var my = (site.y + other.y) * 0.5;
      var dx = other.x - site.x;
      var dy = other.y - site.y;
      poly = clip(poly, function (p) {
        return (p.x - mx) * dx + (p.y - my) * dy <= 0.5;
      }, function (a, b) {
        var da = (a.x - mx) * dx + (a.y - my) * dy;
        var db = (b.x - mx) * dx + (b.y - my) * dy;
        var t = da / (da - db || 1);
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      });
      if (poly.length < 3) break;
    }
    return poly;
  }

  function nearest(x, y) {
    var best = 0;
    var bestD = Infinity;
    for (var i = 0; i < seeds.length; i++) {
      var site = px(seeds[i]);
      var dx = site.x - x;
      var dy = site.y - y;
      var d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function local(event) {
    var rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function areaCentroid(poly) {
    var area = 0;
    var cx = 0;
    var cy = 0;
    for (var i = 0; i < poly.length; i++) {
      var p = poly[i];
      var q = poly[(i + 1) % poly.length];
      var cross = p.x * q.y - q.x * p.y;
      area += cross;
      cx += (p.x + q.x) * cross;
      cy += (p.y + q.y) * cross;
    }
    area *= 0.5;
    if (Math.abs(area) < 1) return { x: poly[0].x, y: poly[0].y };
    return { x: cx / (6 * area), y: cy / (6 * area) };
  }

  function longestEdge(poly) {
    var best = null;
    var bestD = -1;
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i];
      var b = poly[(i + 1) % poly.length];
      var d = (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
      if (d > bestD) {
        bestD = d;
        best = [a, b];
      }
    }
    return best;
  }

  function cellsOf() {
    return seeds.map(function (_, index) { return cell(index); });
  }

  var roundedMode = new URLSearchParams(location.search).get("design") === "rounded";
  // Offset each polygon edge in parallel, then fillet the resulting corners.
  // This preserves the straight Voronoi edges instead of shrinking vertices toward a centroid.
  function roundedCellPath(ctx, poly) {
    if (!roundedMode) {
      ctx.moveTo(poly[0].x, poly[0].y);
      for (var i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      return;
    }
    var n = poly.length, signedArea = 0;
    for (var a = 0; a < n; a++) {
      var b = (a + 1) % n;
      signedArea += poly[a].x * poly[b].y - poly[b].x * poly[a].y;
    }
    var sign = signedArea >= 0 ? 1 : -1;
    var gap = Math.min(5.5, Math.max(3, view.w * 0.011));
    var lines = [];
    for (var i = 0; i < n; i++) {
      var p = poly[i], q = poly[(i + 1) % n];
      var dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
      var nx = sign * -dy / len, ny = sign * dx / len;
      lines.push({x:p.x+nx*gap, y:p.y+ny*gap, dx:dx, dy:dy});
    }
    var pts = [];
    for (var j = 0; j < n; j++) {
      var prev = lines[(j+n-1)%n], next = lines[j];
      var cross = prev.dx*next.dy-prev.dy*next.dx;
      if (Math.abs(cross) < 0.000001) {
        pts.push({x:next.x,y:next.y});
        continue;
      }
      var t = ((next.x-prev.x)*next.dy-(next.y-prev.y)*next.dx)/cross;
      var x = prev.x+t*prev.dx, y = prev.y+t*prev.dy;
      if (!Number.isFinite(x) || !Number.isFinite(y) || Math.hypot(x-poly[j].x,y-poly[j].y)>Math.max(view.w,view.h)) {
        x=next.x;y=next.y;
      }
      pts.push({x:x,y:y});
    }
    // The reference uses generous, flowing shoulders, not tiny corner radii.
    // Keep the original seed layout; only soften each inset cell contour.
    var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    pts.forEach(function(p){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);});
    var cellScale=Math.min(maxX-minX,maxY-minY);
    var radius=Math.min(36,Math.max(14,cellScale*0.23));
    var corners=pts.map(function(p,k){
      var a=pts[(k+n-1)%n],b=pts[(k+1)%n];
      var da=Math.hypot(a.x-p.x,a.y-p.y),db=Math.hypot(b.x-p.x,b.y-p.y);
      var ux=(a.x-p.x)/(da||1),uy=(a.y-p.y)/(da||1);
      var vx=(b.x-p.x)/(db||1),vy=(b.y-p.y)/(db||1);
      var angle=Math.acos(Math.max(-1,Math.min(1,ux*vx+uy*vy)));
      // Short edges are protected from over-rounding; acute corners remain recognizable.
      var tangent=Math.min(da*.44,db*.44,radius/Math.max(.3,Math.tan(angle/2)));
      return {p:p,start:{x:p.x+ux*tangent,y:p.y+uy*tangent},
        end:{x:p.x+vx*tangent,y:p.y+vy*tangent}};
    });
    ctx.moveTo(corners[0].start.x,corners[0].start.y);
    corners.forEach(function(c) {
      ctx.lineTo(c.start.x,c.start.y);
      ctx.quadraticCurveTo(c.p.x,c.p.y,c.end.x,c.end.y);
    });
    ctx.closePath();
  }
  function draw() {
    fitCanvas();
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.fillStyle = "#e7e2d9";
    ctx.fillRect(0, 0, view.w, view.h);
    var cells = cellsOf();
    var active = dragId >= 0 ? dragId : hot;
    cells.forEach(function (poly, index) {
      if (poly.length < 3) return;
      var img = images[index];
      var focus = index === active;
      ctx.save();
      ctx.beginPath();
      roundedCellPath(ctx, poly);
      ctx.clip();
      if (focus) ctx.filter = "brightness(1.14)";
      if (img.complete && img.naturalWidth) {
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        poly.forEach(function (p) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
        var bw = Math.max(1, maxX - minX);
        var bh = Math.max(1, maxY - minY);
        var boost = focus ? 1.06 : 1;
        var fit = Math.max(bw / img.naturalWidth, bh / img.naturalHeight) * boost;
        var dw = img.naturalWidth * fit;
        var dh = img.naturalHeight * fit;
        ctx.drawImage(img, (minX + maxX) / 2 - dw / 2, (minY + maxY) / 2 - dh / 2, dw, dh);
      } else {
        ctx.fillStyle = "#e7e2d9";
        ctx.fill();
      }
      if (active >= 0 && !focus) {
        ctx.filter = "none";
        ctx.fillStyle = "rgba(22,21,19,0.38)";
        ctx.fillRect(0, 0, view.w, view.h);
      }
      ctx.restore();
      ctx.beginPath();
      roundedCellPath(ctx, poly);
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(246,243,238,0.9)";
      ctx.lineWidth = 1.35;
      ctx.stroke();
    });
    if (active >= 0 && cells[active] && cells[active].length > 2) {
      var poly = cells[active];
      var edge = longestEdge(poly);
      if (edge) {
        ctx.beginPath();
        ctx.moveTo(edge[0].x, edge[0].y);
        ctx.lineTo(edge[1].x, edge[1].y);
        ctx.strokeStyle = "#e24a1b";
        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      if (active !== labelFor) {
        labelFor = active;
        labelT = 0;
      }
      if (labelT < 1) {
        labelT = Math.min(1, labelT + 0.16);
        if (labelT < 1 && dragId < 0) requestAnimationFrame(function () { if (!running) draw(); });
      }
      var center = areaCentroid(poly);
      var seed = px(seeds[active]);
      var work = works[active];
      var titleSize = view.w < 700 ? 22 : 30;
      var maxText = Math.min(view.w - 36, 420);
      ctx.font = "700 " + titleSize + "px \"Zen Kaku Gothic New\", sans-serif";
      var shown = scramble(work.title, labelT);
      var lines = wrapLines(ctx, shown, maxText);
      var titleW = 0;
      lines.forEach(function (line) { titleW = Math.max(titleW, ctx.measureText(line).width); });
      var meta = metaLine(work, active);
      ctx.font = "400 12px \"IBM Plex Mono\", ui-monospace, monospace";
      var metaW = ctx.measureText(meta).width;
      var blockW = Math.max(titleW, metaW, 36);
      var blockH = 16 + lines.length * (titleSize + 6) + 36;
      var lx = Math.max(16, Math.min(view.w - blockW - 16, center.x - blockW * 0.15));
      var ly = Math.max(blockH + 8, Math.min(view.h - 20, center.y + blockH * 0.35));
      ctx.beginPath();
      ctx.moveTo(seed.x, seed.y);
      ctx.lineTo(lx, ly - blockH + 10);
      ctx.strokeStyle = "rgba(246,243,238,0.75)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(seed.x, seed.y);
      ctx.lineTo(seed.x + (lx - seed.x) * 0.18, seed.y + (ly - blockH + 10 - seed.y) * 0.18);
      ctx.strokeStyle = "#e24a1b";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      var reveal = ly - blockH + (1 - labelT) * 22;
      ctx.beginPath();
      ctx.rect(lx - 4, reveal, blockW + 12, blockH + 24);
      ctx.clip();
      ctx.shadowColor = "rgba(22,21,19,0.72)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = "#e24a1b";
      ctx.fillRect(lx, ly - blockH + 12, 22, 1.5);
      ctx.shadowBlur = 0;
      ctx.font = "700 " + titleSize + "px \"Zen Kaku Gothic New\", sans-serif";
      ctx.fillStyle = "#f6f3ee";
      ctx.shadowColor = "rgba(22,21,19,0.85)";
      ctx.shadowBlur = 12;
      lines.forEach(function (line, i) {
        ctx.fillText(line, lx, ly - blockH + 20 + titleSize + i * (titleSize + 6));
      });
      var metaY = ly - blockH + 28 + titleSize + lines.length * (titleSize + 6);
      ctx.font = "400 13px \"IBM Plex Mono\", ui-monospace, monospace";
      ctx.fillStyle = "#f6f3ee";
      ctx.fillText(meta, lx, metaY);
      var pulse = !fine ? (Math.sin(performance.now() / 260) + 1) / 2 : 0.35;
      ctx.save();
      ctx.translate(lx + pulse * 5, metaY + 16);
      ctx.strokeStyle = "#e24a1b";
      ctx.globalAlpha = 0.55 + pulse * 0.45;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(22, 0);
      ctx.moveTo(15, -6);
      ctx.lineTo(22, 0);
      ctx.lineTo(15, 6);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
      if (!fine && dragId < 0 && hot === active) {
        requestAnimationFrame(function () { if (hot === active && !running) draw(); });
      }
    }
    return cells;
  }

  function scramble(text, t) {
    if (t >= 1) return text;
    var glyphs = "アイウエオカキクケコ01";
    var out = "";
    for (var i = 0; i < text.length; i++) {
      if ((i + 1) / text.length < t) out += text.charAt(i);
      else out += glyphs.charAt((i * 7 + Math.floor(t * 20)) % glyphs.length);
    }
    return out;
  }

  function wrapLines(ctx, text, maxW) {
    var lines = [];
    var line = "";
    for (var i = 0; i < text.length; i++) {
      var trial = line + text.charAt(i);
      if (line && ctx.measureText(trial).width > maxW) {
        lines.push(line);
        line = text.charAt(i);
      } else line = trial;
    }
    if (line) lines.push(line);
    if (lines.length > 2) {
      lines = lines.slice(0, 2);
      lines[1] = lines[1].replace(/.$/, "…");
    }
    return lines;
  }

  function metaLine(work, index) {
    var bits = [];
    var n = String(index + 1);
    if (n.length < 2) n = "0" + n;
    var total = String(works.length);
    if (total.length < 2) total = "0" + total;
    bits.push(n + " / " + total);
    if (work.year) bits.push(work.year);
    if (work.kind) bits.push(work.kind);
    return bits.join("  ·  ");
  }

  function clampSeed(seed) {
    seed.nx = Math.min(0.94, Math.max(0.06, seed.nx));
    seed.ny = Math.min(0.92, Math.max(0.08, seed.ny));
  }

  function noteDrag() {
    if (seenDrag) return;
    seenDrag = true;
    if (hint) hint.classList.add("is-gone");
  }

  function openWork(id) {
    if (works[id]) window.location.href = works[id].href;
  }

  function stepPhysics(dt) {
    fitCanvas();
    var cells = null;
    var moving = false;
    var minSep = Math.min(view.w, view.h) * 0.105;
    for (var i = 0; i < seeds.length; i++) {
      for (var j = i + 1; j < seeds.length; j++) {
        var a = seeds[i];
        var b = seeds[j];
        var dx = (b.nx - a.nx) * view.w;
        var dy = (b.ny - a.ny) * view.h;
        var dist = Math.hypot(dx, dy);
        if (dist >= minSep || dist < 0.5) continue;
        var push = ((minSep - dist) / dist) * 0.045 * dt;
        if (i !== dragId) {
          a.nx -= (dx / view.w) * push;
          a.ny -= (dy / view.h) * push;
          moving = true;
        }
        if (j !== dragId) {
          b.nx += (dx / view.w) * push;
          b.ny += (dy / view.h) * push;
          moving = true;
        }
      }
    }
    var idle = dragId < 0;
    if (idle) cells = cellsOf();
    seeds.forEach(function (seed, index) {
      if (index === dragId) {
        seed.vx = 0;
        seed.vy = 0;
        clampSeed(seed);
        return;
      }
      if (seed.tx != null) {
        seed.vx += (seed.tx - seed.nx) * 0.12 * dt;
        seed.vy += (seed.ty - seed.ny) * 0.12 * dt;
        moving = true;
      }
      seed.vx *= Math.pow(0.9, dt);
      seed.vy *= Math.pow(0.9, dt);
      seed.nx += seed.vx * dt;
      seed.ny += seed.vy * dt;
      if (Math.hypot(seed.vx * view.w, seed.vy * view.h) > 0.25) moving = true;
      if (seed.tx != null && Math.hypot(seed.tx - seed.nx, seed.ty - seed.ny) < 0.008) {
        seed.nx = seed.tx;
        seed.ny = seed.ty;
        seed.vx = 0;
        seed.vy = 0;
        seed.tx = null;
        seed.ty = null;
      }
      if (idle && cells && cells[index] && cells[index].length > 2 && Math.hypot(seed.vx * view.w, seed.vy * view.h) < 1.2) {
        var c = areaCentroid(cells[index]);
        var pull = 0.02 * dt;
        seed.nx += (c.x / view.w - seed.nx) * pull;
        seed.ny += (c.y / view.h - seed.ny) * pull;
        if (Math.hypot(c.x - seed.nx * view.w, c.y - seed.ny * view.h) > 1.2) moving = true;
      }
      clampSeed(seed);
    });
    return moving;
  }

  function wake() {
    if (running) return;
    running = true;
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(2.2, (now - last) / 16.67);
      last = now;
      try {
        var moving = stepPhysics(dt);
        draw();
        if (moving || dragId >= 0 || gesture) requestAnimationFrame(frame);
        else running = false;
      } catch (err) {
        running = false;
      }
    }
    requestAnimationFrame(frame);
  }

  function scatter(randomize) {
    noteDrag();
    seeds.forEach(function (seed) {
      if (randomize) {
        seed.tx = 0.12 + Math.random() * 0.76;
        seed.ty = 0.14 + Math.random() * 0.72;
      } else {
        seed.tx = seed.hx;
        seed.ty = seed.hy;
      }
      seed.vx = 0;
      seed.vy = 0;
    });
    wake();
  }

  var scrollToken = 0;
  function scrollByFinger(delta) {
    if (!delta) return;
    var root = document.scrollingElement || document.documentElement;
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    root.scrollTop += delta;
    root.style.scrollBehavior = prev;
  }
  function flingScroll(v) {
    var token = scrollToken;
    var vel = v;
    function step() {
      if (token !== scrollToken || Math.abs(vel) < 0.35) return;
      scrollByFinger(vel);
      vel *= 0.92;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function beginGesture(event) {
    if (event.button != null && event.button !== 0) return;
    var point = local(event);
    fitCanvas();
    scrollToken += 1;
    gesture = {
      id: nearest(point.x, point.y),
      x: point.x,
      y: point.y,
      t: performance.now(),
      pointerId: event.pointerId,
      type: event.pointerType,
      mode: event.pointerType === "mouse" ? "drag" : "pending",
      moved: 0,
      lastX: point.x,
      lastY: point.y,
      lastClientY: event.clientY,
      viewW: view.w,
      viewH: view.h,
      vx: 0,
      vy: 0,
      scrollV: 0,
      travel: 0
    };
    hot = gesture.id;
    wake();
  }

  function moveGesture(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) {
      if (event.pointerType === "mouse" && dragId < 0 && !gesture) {
        var hover = local(event);
        var next = nearest(hover.x, hover.y);
        if (next !== hot) {
          hot = next;
          if (!running) draw();
        }
      }
      return;
    }
    if (!event.fromTouch) gesture.sawPointer = performance.now();
    var point = local(event);
    gesture.travel += Math.hypot(point.x - gesture.lastX, point.y - gesture.lastY);
    var adx = Math.abs(point.x - gesture.x);
    var ady = Math.abs(point.y - gesture.y);
    var dist = Math.hypot(adx, ady);
    gesture.moved = gesture.travel;
    if (gesture.mode === "pending") {
      var elapsed = performance.now() - gesture.t;
      if (dist < 8 && elapsed < 260) {
        gesture.lastX = point.x;
        gesture.lastY = point.y;
        gesture.lastClientY = event.clientY;
        return;
      }
      if (elapsed > 240 && dist < 16) gesture.mode = "drag";
      else if (ady > adx * 1.2 && dist >= 8) gesture.mode = "scroll";
      else if (dist >= 8) gesture.mode = "drag";
      else return;
      gesture.lastX = point.x;
      gesture.lastY = point.y;
      gesture.lastClientY = event.clientY;
      gesture.viewW = view.w;
      gesture.viewH = view.h;
      if (gesture.mode === "scroll") return;
    }
    if (gesture.mode === "scroll") {
      var delta = gesture.lastClientY - event.clientY;
      scrollByFinger(delta);
      gesture.scrollV = delta;
      gesture.lastClientY = event.clientY;
      gesture.lastX = point.x;
      gesture.lastY = point.y;
      return;
    }
    if (gesture.type === "mouse" && gesture.moved < 8) {
      gesture.lastX = point.x;
      gesture.lastY = point.y;
      return;
    }
    if (Math.abs(view.w - gesture.viewW) > 3 || Math.abs(view.h - gesture.viewH) > 3) {
      gesture.lastX = point.x;
      gesture.lastY = point.y;
      gesture.viewW = view.w;
      gesture.viewH = view.h;
      return;
    }
    dragId = gesture.id;
    var seed = seeds[dragId];
    var ddx = (point.x - gesture.lastX) / view.w;
    var ddy = (point.y - gesture.lastY) / view.h;
    seed.nx += ddx;
    seed.ny += ddy;
    gesture.vx = ddx;
    gesture.vy = ddy;
    clampSeed(seed);
    noteDrag();
    gesture.lastX = point.x;
    gesture.lastY = point.y;
    draw();
    wake();
  }

  function endGesture(event, cancelled) {
    if (!gesture || (event && event.pointerId != null && event.pointerId !== gesture.pointerId)) return;
    var id = gesture.id;
    var mode = gesture.mode;
    var moved = gesture.moved;
    var flingX = gesture.vx || 0;
    var flingY = gesture.vy || 0;
    var scrollV = gesture.scrollV || 0;
    var type = gesture.type;
    dragId = -1;
    gesture = null;
    syncViewport();
    if (mode === "scroll") {
      if (!cancelled && Math.abs(scrollV) > 1.5) flingScroll(scrollV);
      return;
    }
    if (mode === "drag" && moved > 8) {
      hot = id;
      if (!cancelled) {
        seeds[id].vx = flingX * 0.85;
        seeds[id].vy = flingY * 0.85;
      }
      wake();
      return;
    }
    if (cancelled) {
      wake();
      return;
    }
    hot = id;
    if (fine && type === "mouse") {
      openWork(id);
      return;
    }
    if (touchHot === id) {
      openWork(id);
      return;
    }
    touchHot = id;
    wake();
  }

  function inTools(event) {
    var node = event.target;
    return node && node.closest && node.closest(".map-tools");
  }
  canvas.addEventListener("pointerdown", function (event) {
    if (inTools(event) || (event.button != null && event.button !== 0)) return;
    beginGesture(event);
    try { canvas.setPointerCapture(event.pointerId); } catch (err) { /* synthetic or already gone */ }
  });
  canvas.addEventListener("pointermove", moveGesture);
  canvas.addEventListener("pointerup", function (event) { endGesture(event, false); });
  canvas.addEventListener("pointercancel", function (event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (gesture.type === "touch" || gesture.type === "pen") {
      gesture.pointerLost = true;
      return;
    }
    endGesture(event, true);
  });
  canvas.addEventListener("pointerleave", function (event) {
    if (event.pointerType !== "mouse" || dragId >= 0 || gesture) return;
    hot = -1;
    if (!running) draw();
  });
  function outsideCanvas(event) {
    return event.target !== canvas && !canvas.contains(event.target);
  }
  window.addEventListener("pointermove", function (event) {
    if (!gesture || event.pointerId !== gesture.pointerId || !outsideCanvas(event)) return;
    moveGesture(event);
  });
  window.addEventListener("pointerup", function (event) {
    if (!gesture || event.pointerId !== gesture.pointerId || !outsideCanvas(event)) return;
    endGesture(event, false);
  });
  window.addEventListener("pointercancel", function (event) {
    if (!gesture || event.pointerId !== gesture.pointerId || !outsideCanvas(event)) return;
    endGesture(event, true);
  });
  canvas.addEventListener("touchstart", function (event) {
    if (event.cancelable) event.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchmove", function (event) {
    if (!gesture) return;
    if (event.cancelable) event.preventDefault();
    var live = gesture.sawPointer && performance.now() - gesture.sawPointer < 70;
    if (!gesture.pointerLost && live) return;
    var t = event.touches[0];
    if (!t) return;
    moveGesture({
      clientX: t.clientX,
      clientY: t.clientY,
      pointerId: gesture.pointerId,
      pointerType: "touch",
      fromTouch: true
    });
  }, { passive: false });
  canvas.addEventListener("touchend", function () {
    if (!gesture || (gesture.type !== "touch" && gesture.type !== "pen")) return;
    endGesture({ pointerId: gesture.pointerId, pointerType: gesture.type, clientX: 0, clientY: gesture.lastClientY }, false);
  });
  canvas.addEventListener("touchcancel", function () {
    if (!gesture || (gesture.type !== "touch" && gesture.type !== "pen")) return;
    endGesture({ pointerId: gesture.pointerId, pointerType: gesture.type }, true);
  });
  canvas.addEventListener("keydown", function (event) {
    if (!seeds.length) return;
    if (hot < 0) hot = 0;
    var step = 0.02;
    var used = true;
    if (event.key === "ArrowLeft") seeds[hot].nx -= step;
    else if (event.key === "ArrowRight") seeds[hot].nx += step;
    else if (event.key === "ArrowUp") seeds[hot].ny -= step;
    else if (event.key === "ArrowDown") seeds[hot].ny += step;
    else if (event.key === "Enter") openWork(hot);
    else if (event.key === "[") hot = (hot + seeds.length - 1) % seeds.length;
    else if (event.key === "]") hot = (hot + 1) % seeds.length;
    else used = false;
    if (!used) return;
    if (event.key !== "Enter") {
      event.preventDefault();
      clampSeed(seeds[hot]);
      seeds[hot].vx = 0;
      seeds[hot].vy = 0;
      noteDrag();
      wake();
    }
  });
  function bindTool(btn, randomize) {
    if (!btn) return;
    var last = 0;
    function run(event) {
      event.preventDefault();
      event.stopPropagation();
      var now = performance.now();
      if (now - last < 80) return;
      last = now;
      scatter(randomize);
    }
    btn.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });
    btn.addEventListener("touchstart", function (event) {
      event.stopPropagation();
    }, { passive: true });
    btn.addEventListener("pointerup", function (event) {
      if (event.button != null && event.button !== 0) return;
      run(event);
    });
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
    });
    btn.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      run(event);
    });
  }
  bindTool(shuffleBtn, true);
  bindTool(resetBtn, false);

  syncViewport();
  window.addEventListener("resize", function () {
    syncViewport();
    wake();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", function () {
    syncViewport();
    wake();
  });
  }
  wake();
})();
