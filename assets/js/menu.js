(function () {
  "use strict";
  var search = document.querySelector("[data-search]");
  var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".dish[data-item]"));
  var secs = Array.prototype.slice.call(document.querySelectorAll("[data-sec]"));
  var count = document.querySelector("[data-count]");
  var empty = document.querySelector("[data-empty]");
  var clear = document.querySelector("[data-clear]");
  if (!search || !cards.length) { return; }

  function active() {
    return chips.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; }).map(function (c) { return c.getAttribute("data-filter"); });
  }
  function apply() {
    var q = search.value.trim().toLowerCase();
    var f = active();
    var shown = 0;
    cards.forEach(function (card) {
      var text = card.textContent.toLowerCase();
      var tags = (card.getAttribute("data-tags") || "").split(" ");
      var ok = (!q || text.indexOf(q) !== -1) && f.every(function (t) {
        return t === "veg" ? (tags.indexOf("veg") !== -1 || tags.indexOf("vegan") !== -1) : tags.indexOf(t) !== -1;
      });
      card.hidden = !ok;
      if (ok) { shown++; }
    });
    secs.forEach(function (s) { s.hidden = !s.querySelector(".dish:not([hidden])"); });
    empty.hidden = shown !== 0;
    var filtering = q || f.length;
    count.textContent = filtering ? shown + (shown === 1 ? " dish" : " dishes") + " found" : "";
  }
  search.addEventListener("input", apply);
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      c.setAttribute("aria-pressed", String(c.getAttribute("aria-pressed") !== "true"));
      apply();
    });
  });
  if (clear) {
    clear.addEventListener("click", function () {
      search.value = "";
      chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      apply();
      search.focus();
    });
  }
})();
