(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var mark = document.querySelector(".assemble svg");
  if (mark && !reduce) {
    var stage = mark.parentElement;
    var joint = mark.querySelector(".joint");
    var gapWord = mark.querySelector(".gap-word");
    var hint = document.querySelector(".assemble-hint");
    var planes = Array.prototype.map.call(mark.querySelectorAll(".plane"), function (el, index) {
      return { el: el, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0, drag: null, side: index === 0 ? -1 : 1, phase: index * 1.7 };
    });
    var look = { x: 0, y: 0 };
    var keys = { x: 0, y: 0 };
    var loop = false;
    var wasApart = false;
    var lastTap = 0;
    var flashUntil = 0;

    function unit() {
      var box = mark.getBoundingClientRect();
      return box.width / 32 || 3;
    }
    function limit(plane) {
      var cap = 20;
      var d = Math.hypot(plane.x, plane.y);
      if (d > cap) {
        plane.x = plane.x / d * cap;
        plane.y = plane.y / d * cap;
      }
    }
    function paint() {
      planes.forEach(function (plane) {
        plane.el.setAttribute(
          "transform",
          "translate(" + plane.x.toFixed(2) + " " + plane.y.toFixed(2) + ") rotate(" + plane.rot.toFixed(2) + " 16 16)"
        );
      });
      var ax = 12 + planes[0].x;
      var ay = 16 + planes[0].y;
      var bx = 16 + planes[1].x;
      var by = 16 + planes[1].y;
      var gap = Math.hypot(planes[0].x - planes[1].x, planes[0].y - planes[1].y);
      var show = Math.max(0, Math.min(1, (gap - 1.4) / 5));
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
        var word = gap > 11 ? "Rethink" : gap > 6 ? "Run" : "Make";
        gapWord.textContent = word;
        gapWord.setAttribute("x", ((ax + bx) / 2).toFixed(2));
        gapWord.setAttribute("y", ((ay + by) / 2 - 1.4).toFixed(2));
        gapWord.style.opacity = String(Math.max(0, Math.min(1, (gap - 4) / 4)));
      }
      if (stage) {
        stage.style.transform = "rotateY(" + (look.x * 7).toFixed(2) + "deg) rotateX(" + (-look.y * 5).toFixed(2) + "deg)";
      }
      mark.style.filter = "drop-shadow(" + (look.x * 4).toFixed(1) + "px " + (3 + look.y * 3).toFixed(1) + "px 0 rgba(22,21,19,.4))";
    }
    function flash() {
      flashUntil = performance.now() + 220;
    }
    function tick(now) {
      var dt = 1;
      var live = false;
      var t = now || performance.now();
      planes.forEach(function (plane) {
        if (plane.drag) {
          live = true;
          return;
        }
        var tx = Math.sin(t / 980 + plane.phase) * 0.42 + look.x * plane.side * 1.15 + keys.x * plane.side * 7;
        var ty = Math.cos(t / 1140 + plane.phase) * 0.3 + look.y * 0.7 + keys.y * 6;
        plane.vx += (tx - plane.x) * 0.16 * dt;
        plane.vy += (ty - plane.y) * 0.16 * dt;
        plane.vx *= 0.72;
        plane.vy *= 0.72;
        plane.x += plane.vx * dt;
        plane.y += plane.vy * dt;
        plane.vr += (0 - plane.rot) * 0.14 * dt;
        plane.vr *= 0.74;
        plane.rot += plane.vr * dt;
        limit(plane);
        if (Math.hypot(plane.vx, plane.vy) > 0.04 || Math.abs(plane.x - tx) > 0.08 || Math.abs(plane.rot) > 0.4) live = true;
      });
      var gap = Math.hypot(planes[0].x - planes[1].x, planes[0].y - planes[1].y);
      var speed = Math.hypot(planes[0].vx, planes[0].vy) + Math.hypot(planes[1].vx, planes[1].vy);
      if (wasApart && gap < 1.15 && speed > 0.35) flash();
      wasApart = gap > 5;
      paint();
      if (live || Math.abs(look.x) + Math.abs(look.y) > 0.02 || keys.x || keys.y) requestAnimationFrame(tick);
      else loop = false;
    }
    function wake() {
      if (loop) return;
      loop = true;
      requestAnimationFrame(tick);
    }
    function forgetHint() {
      if (hint) hint.classList.add("is-gone");
    }
    function explode() {
      forgetHint();
      planes[0].vx = -5.2;
      planes[0].vy = -2.4;
      planes[0].vr = -7;
      planes[1].vx = 5.6;
      planes[1].vy = 2.8;
      planes[1].vr = 8;
      wake();
    }
    planes.forEach(function (plane) {
      plane.el.addEventListener("pointerdown", function (event) {
        if (event.button != null && event.button !== 0) return;
        plane.drag = {
          x: event.clientX,
          y: event.clientY,
          ox: plane.x,
          oy: plane.y,
          id: event.pointerId,
          type: event.pointerType,
          held: false,
          lx: event.clientX,
          ly: event.clientY
        };
        if (event.pointerType === "mouse") plane.el.setPointerCapture(event.pointerId);
        else {
          setTimeout(function () {
            if (!plane.drag || plane.drag.held) return;
            if (Math.hypot(plane.drag.lx - plane.drag.x, plane.drag.ly - plane.drag.y) < 10) {
              plane.drag.held = true;
              try { plane.el.setPointerCapture(plane.drag.id); } catch (err) { /* already gone */ }
            }
          }, 160);
        }
      });
      plane.el.addEventListener("pointermove", function (event) {
        if (!plane.drag || event.pointerId !== plane.drag.id) return;
        var dx = event.clientX - plane.drag.x;
        var dy = event.clientY - plane.drag.y;
        plane.drag.lx = event.clientX;
        plane.drag.ly = event.clientY;
        if (plane.drag.type !== "mouse" && !plane.drag.held && !plane.el.hasPointerCapture(event.pointerId)) {
          if (Math.abs(dy) > Math.abs(dx) && Math.hypot(dx, dy) > 10) {
            plane.drag = null;
            return;
          }
          if (Math.hypot(dx, dy) < 8) return;
          plane.drag.held = true;
          plane.el.setPointerCapture(event.pointerId);
        }
        var u = unit();
        var nx = plane.drag.ox + (event.clientX - plane.drag.x) / u;
        var ny = plane.drag.oy + (event.clientY - plane.drag.y) / u;
        plane.vx = nx - plane.x;
        plane.vy = ny - plane.y;
        plane.x = nx;
        plane.y = ny;
        limit(plane);
        forgetHint();
        wake();
      });
      function release(event) {
        if (!plane.drag || (event && event.pointerId !== plane.drag.id)) return;
        var moved = Math.hypot(event.clientX - plane.drag.x, event.clientY - plane.drag.y);
        plane.drag = null;
        if (event && plane.el.hasPointerCapture && plane.el.hasPointerCapture(event.pointerId)) {
          plane.el.releasePointerCapture(event.pointerId);
        }
        if (moved < 8 && event.pointerType !== "mouse") {
          var now = performance.now();
          if (now - lastTap < 320) explode();
          lastTap = now;
        }
        wake();
      }
      plane.el.addEventListener("pointerup", release);
      plane.el.addEventListener("pointercancel", release);
    });
    mark.addEventListener("dblclick", function (event) {
      event.preventDefault();
      explode();
    });
    if (fine) {
      window.addEventListener("pointermove", function (event) {
        var box = mark.getBoundingClientRect();
        var cx = box.left + box.width / 2;
        var cy = box.top + box.height / 2;
        look.x = Math.max(-1, Math.min(1, (event.clientX - cx) / 280));
        look.y = Math.max(-1, Math.min(1, (event.clientY - cy) / 280));
        wake();
      });
    }
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
      wake();
    });
    mark.addEventListener("keyup", function (event) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") keys.x = 0;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") keys.y = 0;
      wake();
    });
    wake();
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
      var cue = fine ? "open →" : "tap again to open →";
      var cueW = ctx.measureText(cue).width;
      var blockW = Math.max(titleW, metaW, cueW);
      var blockH = 18 + lines.length * (titleSize + 6) + 42;
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
      ctx.fillText(cue, lx, metaY + 18);
      ctx.restore();
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
