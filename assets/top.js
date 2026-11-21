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

  var pointer = null;
  var hot = -1;
  var touchHot = -1;
  var positions = [];
  var looping = false;
  var dpr = 1;

  function size() {
    var rect = canvas.getBoundingClientRect();
    var coarse = window.matchMedia("(pointer: coarse)").matches;
    var next = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    var w = Math.max(1, rect.width);
    var h = Math.max(1, rect.height);
    var bw = Math.round(w * next);
    var bh = Math.round(h * next);
    if (canvas.width !== bw || canvas.height !== bh) {
      dpr = next;
      canvas.width = bw;
      canvas.height = bh;
      positions = [];
    }
    if (positions.length !== works.length) {
      positions = works.map(function (_, index) { return rest(index, w, h); });
    }
    return { w: w, h: h };
  }

  function rest(index, w, h) {
    var cols = Math.ceil(Math.sqrt(works.length * (w / Math.max(h, 1))));
    var rows = Math.ceil(works.length / cols);
    var col = index % cols;
    var row = Math.floor(index / cols);
    var padX = w * 0.1;
    var padY = h * 0.12;
    var x = padX + ((col + 0.5) / cols) * (w - padX * 2);
    var y = padY + ((row + 0.5) / rows) * (h - padY * 2);
    x += ((index * 47) % 17 - 8) * w * 0.01;
    y += ((index * 19) % 13 - 6) * h * 0.01;
    return { x: x, y: y, rx: x, ry: y };
  }

  function targetOf(point, w, h) {
    if (!pointer) return { x: point.rx, y: point.ry };
    var dx = point.rx - pointer.x;
    var dy = point.ry - pointer.y;
    var dist = Math.hypot(dx, dy) || 1;
    var reach = Math.min(w, h) * 0.55;
    var t = Math.max(0, 1 - dist / reach);
    var push = t * t * Math.min(w, h) * 0.2;
    return { x: point.rx + (dx / dist) * push, y: point.ry + (dy / dist) * push };
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
    var site = positions[index];
    var poly = [
      { x: 0, y: 0 },
      { x: canvas.clientWidth, y: 0 },
      { x: canvas.clientWidth, y: canvas.clientHeight },
      { x: 0, y: canvas.clientHeight }
    ];
    for (var i = 0; i < positions.length; i++) {
      if (i === index) continue;
      var other = positions[i];
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
    for (var i = 0; i < positions.length; i++) {
      var dx = positions[i].x - x;
      var dy = positions[i].y - y;
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

  function draw() {
    var box = size();
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box.w, box.h);
    ctx.fillStyle = "#e7e2d9";
    ctx.fillRect(0, 0, box.w, box.h);
    var cells = positions.map(function (_, index) { return cell(index); });
    cells.forEach(function (poly, index) {
      if (poly.length < 3) return;
      var img = images[index];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (var i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      ctx.clip();
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
        var fit = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
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
      ctx.strokeStyle = "rgba(246,243,238,0.85)";
      ctx.lineWidth = 1.25;
      ctx.stroke();
    });
    if (pointer && hot >= 0 && cells[hot] && cells[hot].length > 2) {
      var poly = cells[hot];
      var edge = null;
      var edgeD = Infinity;
      for (var k = 0; k < poly.length; k++) {
        var a = poly[k];
        var b = poly[(k + 1) % poly.length];
        var mx = (a.x + b.x) / 2;
        var my = (a.y + b.y) / 2;
        var dist = (mx - pointer.x) * (mx - pointer.x) + (my - pointer.y) * (my - pointer.y);
        if (dist < edgeD) {
          edgeD = dist;
          edge = [a, b];
        }
      }
      if (edge) {
        ctx.beginPath();
        ctx.moveTo(edge[0].x, edge[0].y);
        ctx.lineTo(edge[1].x, edge[1].y);
        ctx.strokeStyle = "#e24a1b";
        ctx.lineWidth = 2.4;
        ctx.stroke();
      }
      var cx = 0;
      var cy = 0;
      poly.forEach(function (p) { cx += p.x; cy += p.y; });
      cx /= poly.length;
      cy /= poly.length;
      var title = works[hot].title;
      ctx.font = '500 15px "Zen Kaku Gothic New", sans-serif';
      var tw = ctx.measureText(title).width;
      var lx = Math.max(12 + tw / 2, Math.min(box.w - 12 - tw / 2, cx));
      var ly = Math.max(28, Math.min(box.h - 16, cy));
      ctx.fillStyle = "rgba(22,21,19,0.84)";
      ctx.fillRect(lx - tw / 2 - 10, ly - 18, tw + 20, 30);
      ctx.fillStyle = "#f6f3ee";
      ctx.fillText(title, lx - tw / 2, ly);
    }
  }

  function kick() {
    if (looping) return;
    looping = true;
    function step() {
      var box = canvas.getBoundingClientRect();
      var w = box.width;
      var h = box.height;
      if (positions.length !== works.length || Math.abs((positions[0].rx || 0) - rest(0, w, h).x) > 2) {
        positions = works.map(function (_, index) { return rest(index, w, h); });
      }
      var moving = false;
      positions.forEach(function (point) {
        var goal = targetOf(point, w, h);
        point.x += (goal.x - point.x) * 0.38;
        point.y += (goal.y - point.y) * 0.38;
        if (Math.hypot(goal.x - point.x, goal.y - point.y) > 0.6) moving = true;
      });
      draw();
      if (moving || pointer) requestAnimationFrame(step);
      else looping = false;
    }
    requestAnimationFrame(step);
  }

  canvas.addEventListener("pointermove", function (event) {
    if (event.pointerType !== "mouse") return;
    pointer = local(event);
    hot = nearest(pointer.x, pointer.y);
    kick();
  });
  canvas.addEventListener("pointerleave", function (event) {
    if (event.pointerType !== "mouse") return;
    pointer = null;
    hot = -1;
    kick();
  });
  canvas.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse") return;
    pointer = local(event);
    hot = nearest(pointer.x, pointer.y);
    kick();
  });
  canvas.addEventListener("pointerup", function (event) {
    var point = local(event);
    var id = nearest(point.x, point.y);
    if (fine && event.pointerType === "mouse") {
      window.location.href = works[id].href;
      return;
    }
    if (event.pointerType === "mouse") return;
    if (touchHot === id) {
      window.location.href = works[id].href;
      return;
    }
    touchHot = id;
    hot = id;
    pointer = point;
    kick();
  });

  window.addEventListener("resize", function () {
    positions = [];
    draw();
  });
  if (loaded) draw();
  else requestAnimationFrame(draw);
})();
