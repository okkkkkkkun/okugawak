(function () {
  var tones = {
    a: {
      paper: "#f6f3ee",
      ink: "#161513",
      accent: "#e24a1b",
      font: "Syne, 'Noto Sans JP', sans-serif",
      label: "A · 窯"
    },
    b: {
      paper: "#f3f6f4",
      ink: "#14221c",
      accent: "#1f6b4a",
      font: "'Instrument Sans', 'Zen Kaku Gothic New', sans-serif",
      label: "B · 森"
    },
    c: {
      paper: "#f4f6f8",
      ink: "#141820",
      accent: "#1d4e89",
      font: "Newsreader, 'Shippori Mincho', serif",
      label: "C · 図面"
    }
  };

  function mark(key, px) {
    var accent = tones[key].accent;
    var box = 'width="' + px + '" height="' + px + '" viewBox="0 0 32 32" aria-hidden="true"';
    if (key === "a") {
      return (
        '<svg ' + box + '>' +
        '<path fill="currentColor" d="M14 2h4v28h-4z"/>' +
        '<path fill="currentColor" d="M2 14h28v4H2z"/>' +
        '<path fill="' + accent + '" d="M6.2 22.4 9.6 25.8 25.8 9.6 22.4 6.2z"/>' +
        "</svg>"
      );
    }
    if (key === "b") {
      return (
        '<svg ' + box + '>' +
        '<path fill="currentColor" d="M3 4h9v24H3z"/>' +
        '<path fill="currentColor" d="M16.2 4H26l-6.4 12L26 28h-9.8l-5.4-12z"/>' +
        "</svg>"
      );
    }
    var dots = [[8, 8], [16, 8], [24, 8], [8, 16], [24, 16], [8, 24], [16, 24], [24, 24]];
    var circles = dots.map(function (p) {
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.65" fill="currentColor"/>';
    }).join("");
    return (
      '<svg ' + box + '>' + circles +
      '<circle cx="20.5" cy="12" r="1.85" fill="' + accent + '"/>' +
      '<path d="M16 16 L20.5 12" stroke="' + accent + '" stroke-width="1.15" fill="none"/>' +
      "</svg>"
    );
  }

  function plate(bg, fg, klass, inner) {
    return '<div class="plate ' + klass + '" style="background:' + bg + ";color:" + fg + '">' + inner + "</div>";
  }

  function name(key, fg) {
    return '<span class="nm" style="font-family:' + tones[key].font + ";color:" + fg + '">Kota Okugawa</span>';
  }

  document.querySelectorAll(".lockups").forEach(function (el) {
    var key = el.getAttribute("data-tone");
    var t = tones[key];
    var sizes = [16, 24, 32].map(function (n) {
      var note = key === "b" && n === 16 ? "16 使わない" : n + "px";
      return '<div style="color:' + t.ink + '"><span>' + note + "</span>" + mark(key, n) + "</div>";
    }).join("");
    el.innerHTML =
      plate(t.paper, t.ink, "light", mark(key, 28) + name(key, t.ink)) +
      plate(t.paper, t.ink, "light stack", mark(key, 28) + name(key, t.ink)) +
      plate(t.ink, t.paper, "dark", mark(key, 28) + name(key, t.paper)) +
      '<div class="sizes">' + sizes + "</div>";
  });

  var mocks = document.getElementById("mocks");
  if (!mocks) return;
  ["a", "b", "c"].forEach(function (key) {
    var t = tones[key];
    var article = document.createElement("article");
    article.className = "card";
    article.innerHTML =
      '<span class="badge' + (key === "a" ? " now" : "") + '">' + t.label + "</span>" +
      '<div class="app">' +
      '<div class="hdr" style="background:' + t.ink + ";color:" + t.paper + '">' +
      '<span style="display:flex;align-items:center;gap:.45rem;font-family:' + t.font + ';font-weight:700">' +
      mark(key, 18) + "Kota Okugawa</span>" +
      '<span style="font-family:IBM Plex Mono,monospace;letter-spacing:.12em;font-size:.68rem">WORK</span>' +
      "</div>" +
      '<div class="cardish" style="background:' + t.paper + ";color:" + t.ink + ';border:1px solid rgba(22,21,19,.14)">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
      mark(key, 26) +
      '<span style="font-family:' + t.font + ';font-weight:700;font-size:1rem">Kota Okugawa</span>' +
      "</div>" +
      "<div>" +
      '<div style="font-size:.82rem">つくりながら、考える。</div>' +
      '<div style="font-family:IBM Plex Mono,monospace;font-size:.68rem;letter-spacing:.02em">okugawak@kajima.com</div>' +
      "</div></div>" +
      '<div style="display:flex;align-items:center;gap:.75rem">' +
      '<div class="avatar" style="background:' + t.paper + ";color:" + t.ink + ';border:1px solid rgba(22,21,19,.14)">' +
      mark(key, 40) + "</div>" +
      '<p class="small" style="margin:0">ヘッダー、名刺、アイコン。</p>' +
      "</div></div>";
    mocks.appendChild(article);
  });
})();
