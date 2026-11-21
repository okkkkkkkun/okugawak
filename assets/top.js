(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var mark = document.querySelector(".assemble svg");
  if (mark && !reduce) {
    var planes = Array.prototype.map.call(mark.querySelectorAll(".plane"), function (el) {
      return { el: el, x: 0, y: 0, drag: null };
    });
    var easing = false;

    function scale() {
      var box = mark.getBoundingClientRect();
      return box.width / 32 || 2;
    }
    function paintPlane(plane) {
      plane.el.setAttribute("transform", "translate(" + plane.x.toFixed(2) + " " + plane.y.toFixed(2) + ")");
    }
    function clamp(plane) {
      var limit = 16;
      var d = Math.hypot(plane.x, plane.y);
      if (d > limit) {
        plane.x = plane.x / d * limit;
        plane.y = plane.y / d * limit;
      }
    }
    function ease() {
      if (easing) return;
      easing = true;
      function step() {
        var live = false;
        planes.forEach(function (plane) {
          if (plane.drag) {
            live = true;
            return;
          }
          plane.x *= 0.84;
          plane.y *= 0.84;
          if (Math.hypot(plane.x, plane.y) < 0.35) {
            plane.x = 0;
            plane.y = 0;
          } else {
            live = true;
          }
          paintPlane(plane);
        });
        if (live) requestAnimationFrame(step);
        else easing = false;
      }
      requestAnimationFrame(step);
    }

    planes.forEach(function (plane) {
      plane.el.addEventListener("pointerdown", function (event) {
        if (event.button != null && event.button !== 0) return;
        plane.drag = { x: event.clientX, y: event.clientY, ox: plane.x, oy: plane.y };
        plane.el.setPointerCapture(event.pointerId);
        event.preventDefault();
      });
      plane.el.addEventListener("pointermove", function (event) {
        if (!plane.drag) return;
        var unit = scale();
        plane.x = plane.drag.ox + (event.clientX - plane.drag.x) / unit;
        plane.y = plane.drag.oy + (event.clientY - plane.drag.y) / unit;
        clamp(plane);
        paintPlane(plane);
      });
      function release(event) {
        if (!plane.drag) return;
        plane.drag = null;
        if (event && plane.el.hasPointerCapture && plane.el.hasPointerCapture(event.pointerId)) {
          plane.el.releasePointerCapture(event.pointerId);
        }
        ease();
      }
      plane.el.addEventListener("pointerup", release);
      plane.el.addEventListener("pointercancel", release);
    });

    mark.addEventListener("keydown", function (event) {
      var step = 1.6;
      var used = true;
      if (event.key === "ArrowLeft") {
        planes[0].x -= step;
        if (planes[1]) planes[1].x += step;
      } else if (event.key === "ArrowRight") {
        planes[0].x += step;
        if (planes[1]) planes[1].x -= step;
      } else if (event.key === "ArrowUp") {
        planes[0].y -= step;
        if (planes[1]) planes[1].y += step;
      } else if (event.key === "ArrowDown") {
        planes[0].y += step;
        if (planes[1]) planes[1].y -= step;
      } else {
        used = false;
      }
      if (!used) return;
      event.preventDefault();
      planes.forEach(function (plane) {
        clamp(plane);
        paintPlane(plane);
      });
    });
    mark.addEventListener("keyup", function (event) {
      if (event.key.indexOf("Arrow") === 0) ease();
    });
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
    var next = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, rect.width);
    var h = Math.max(1, rect.height);
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
      ctx.moveTo(poly[0].x, poly[0].y);
      for (var i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      ctx.clip();
      if (focus) ctx.filter = "brightness(1.12)";
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
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (var j = 1; j < poly.length; j++) ctx.lineTo(poly[j].x, poly[j].y);
      ctx.closePath();
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
      var center = areaCentroid(poly);
      var title = works[active].title;
      ctx.font = '500 15px "Zen Kaku Gothic New", sans-serif';
      var tw = ctx.measureText(title).width;
      var lx = Math.max(12 + tw / 2, Math.min(view.w - 12 - tw / 2, center.x));
      var ly = Math.max(28, Math.min(view.h - 16, center.y));
      ctx.fillStyle = "rgba(22,21,19,0.84)";
      ctx.fillRect(lx - tw / 2 - 10, ly - 18, tw + 20, 30);
      ctx.fillStyle = "#f6f3ee";
      ctx.fillText(title, lx - tw / 2, ly);
    }
    return cells;
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
      if (seed.tx != null && Math.hypot(seed.tx - seed.nx, seed.ty - seed.ny) < 0.004) {
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
      var moving = stepPhysics(dt);
      draw();
      if (moving || dragId >= 0) requestAnimationFrame(frame);
      else running = false;
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

  function beginGesture(event) {
    if (event.button != null && event.button !== 0) return;
    var point = local(event);
    fitCanvas();
    gesture = {
      id: nearest(point.x, point.y),
      x: point.x,
      y: point.y,
      t: performance.now(),
      pointerId: event.pointerId,
      type: event.pointerType,
      captured: event.pointerType === "mouse",
      moved: 0,
      lastX: point.x,
      lastY: point.y
    };
    hot = gesture.id;
    if (event.pointerType === "mouse") canvas.setPointerCapture(event.pointerId);
    wake();
  }

  function moveGesture(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) {
      if (event.pointerType === "mouse" && dragId < 0) {
        var hover = local(event);
        var next = nearest(hover.x, hover.y);
        if (next !== hot) {
          hot = next;
          if (!running) draw();
        }
      }
      return;
    }
    var point = local(event);
    var dx = point.x - gesture.x;
    var dy = point.y - gesture.y;
    gesture.moved = Math.hypot(dx, dy);
    var elapsed = performance.now() - gesture.t;
    if (!gesture.captured && gesture.type !== "mouse") {
      if (Math.abs(dy) > Math.abs(dx) && gesture.moved > 12) {
        gesture = null;
        return;
      }
      var held = elapsed > 170 && gesture.moved < 14;
      var sideways = Math.abs(dx) > Math.abs(dy) && gesture.moved > 10;
      if (held || sideways) {
        gesture.captured = true;
        canvas.setPointerCapture(event.pointerId);
      } else {
        return;
      }
    }
      if (gesture.moved > 8) {
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
      wake();
    }
    gesture.lastX = point.x;
    gesture.lastY = point.y;
  }

  function endGesture(event) {
    if (!gesture || (event && event.pointerId !== gesture.pointerId)) return;
    var point = local(event);
    var id = gesture.id;
    var dragged = gesture.moved > 8;
    var flingX = gesture.vx || 0;
    var flingY = gesture.vy || 0;
    dragId = -1;
    gesture = null;
    if (dragged) {
      hot = id;
      seeds[id].vx = flingX * 0.85;
      seeds[id].vy = flingY * 0.85;
      wake();
      return;
    }
    hot = id;
    if (fine && (!event || event.pointerType === "mouse")) {
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

  canvas.addEventListener("pointerdown", beginGesture);
  canvas.addEventListener("pointermove", moveGesture);
  canvas.addEventListener("pointerup", endGesture);
  canvas.addEventListener("pointercancel", function (event) {
    dragId = -1;
    gesture = null;
    wake();
  });
  canvas.addEventListener("pointerleave", function (event) {
    if (dragId >= 0 || (gesture && gesture.captured)) return;
    if (event.pointerType === "mouse") {
      hot = -1;
      wake();
    }
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
  if (shuffleBtn) shuffleBtn.addEventListener("click", function () { scatter(true); });
  if (resetBtn) resetBtn.addEventListener("click", function () { scatter(false); });

  window.addEventListener("resize", function () { wake(); });
  wake();
})();
