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
        '<path fill="currentColor" d="M4 3h8v26H4z"/>' +
        '<path fill="currentColor" d="M16 3h11L20.2 16 27 29H16l-4.4-13z"/>' +
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

  function favicon(px) {
    return (
      '<svg width="' + px + '" height="' + px + '" viewBox="0 0 32 32" aria-hidden="true">' +
      '<rect width="32" height="32" fill="#f6f3ee"/>' +
      '<path fill="#161513" d="M3 3h11v26H3z"/>' +
      '<path fill="#161513" d="M13 3h16L22 16l7 13H13L7 16z"/>' +
      "</svg>"
    );
  }

  document.querySelectorAll(".lockups").forEach(function (el) {
    var key = el.getAttribute("data-tone");
    var t = tones[key];
    var sizes = [16, 24, 32].map(function (n) {
      if (key === "b" && n === 16) {
        return '<div style="color:' + t.ink + '"><span>16 favicon</span>' + favicon(n) + "</div>";
      }
      return '<div style="color:' + t.ink + '"><span>' + n + "px</span>" + mark(key, n) + "</div>";
    }).join("");
    el.innerHTML =
      plate(t.paper, t.ink, "light", mark(key, 28) + name(key, t.ink)) +
      plate(t.paper, t.ink, "light stack", mark(key, 28) + name(key, t.ink)) +
      plate(t.ink, t.paper, "dark", mark(key, 28) + name(key, t.paper)) +
      '<div class="sizes">' + sizes + "</div>";
  });

  var mocks = document.getElementById("mocks");
  if (!mocks) return;
  var paper = "#f6f3ee";
  var ink = "#161513";
  var nameFont = "'Instrument Sans', sans-serif";
  var jaFont = "'Zen Kaku Gothic New', sans-serif";
  mocks.innerHTML =
    '<article class="card">' +
    '<span class="badge now">採用 · C / B / A / B / B</span>' +
    '<div class="app">' +
    '<div class="hdr" style="background:' + ink + ";color:" + paper + '">' +
    '<span style="display:flex;align-items:center;gap:.45rem;font-family:' + nameFont + ';font-weight:600">' +
    mark("b", 26) + "Kota Okugawa</span>" +
    '<span style="font-family:' + nameFont + ';letter-spacing:.12em;font-size:.68rem;font-weight:600">WORK</span>' +
    "</div>" +
    '<div class="cardish" style="background:' + paper + ";color:" + ink + ';border:1px solid rgba(22,21,19,.14)">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
    mark("b", 28) +
    '<span style="font-family:' + nameFont + ';font-weight:600;font-size:1.05rem">Kota Okugawa</span>' +
    "</div>" +
    "<div>" +
    '<div style="font-family:' + jaFont + ';font-weight:700;font-size:.95rem">つくりながら、考える。</div>' +
    '<div style="font-family:IBM Plex Mono,monospace;font-size:.68rem">Make / Run / Rethink.</div>' +
    "</div></div>" +
    '<div style="display:flex;align-items:center;gap:.75rem">' +
    '<div class="avatar" style="background:' + paper + ";color:" + ink + '">' + mark("b", 40) + "</div>" +
    favicon(32) +
    '<p class="small" style="margin:0">左が通常の印。右が 16px 用の簡略形。</p>' +
    "</div></div></article>";
})();
