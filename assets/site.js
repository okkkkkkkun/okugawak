(function () {
  document.documentElement.classList.add("js");
  var cover = document.querySelector(".cover-pin");
  function paint() {
    if (!cover) {
      document.body.classList.add("is-solid");
      return;
    }
    document.body.classList.toggle("is-solid", window.scrollY > window.innerHeight * 0.72);
  }
  paint();
  window.addEventListener("scroll", paint, { passive: true });

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    document.querySelectorAll(".section, .work-row, .pull").forEach(function (node) {
      node.classList.add("reveal");
    });
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        seen.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (node) { seen.observe(node); });
  }

  var dialog = document.querySelector(".lightbox");
  if (dialog) {
  var view = dialog.querySelector("img");
  document.querySelectorAll("[data-full]").forEach(function (button) {
    button.addEventListener("click", function () {
      view.src = button.getAttribute("data-full");
      view.alt = button.getAttribute("data-alt") || "";
      if (typeof dialog.showModal === "function") dialog.showModal();
    });
  });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", function () {
    view.removeAttribute("src");
  });
  }

  var toggle = document.querySelector(".nav-toggle");
  var sheet = document.getElementById("nav-sheet");
  if (toggle && sheet) {
    function items() {
      return [toggle].concat(Array.prototype.slice.call(sheet.querySelectorAll("a")));
    }
    function setOpen(open) {
      sheet.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
      if (open) {
        var first = sheet.querySelector("a");
        if (first) first.focus();
      } else {
        toggle.focus();
      }
    }
    toggle.addEventListener("click", function () {
      setOpen(sheet.hidden);
    });
    document.addEventListener("keydown", function (event) {
      if (sheet.hidden) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      var list = items();
      var first = list[0];
      var last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }
})();
