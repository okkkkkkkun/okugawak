(function () {
  var cover = document.querySelector(".cover-pin");
  function paint() {
    if (!cover) {
      document.body.classList.add("is-solid");
      return;
    }
    var solid = window.scrollY > window.innerHeight * 0.72;
    document.body.classList.toggle("is-solid", solid);
  }
  paint();
  window.addEventListener("scroll", paint, { passive: true });

  var dialog = document.querySelector(".lightbox");
  if (!dialog) return;
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
})();
