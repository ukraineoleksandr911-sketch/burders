(function () {
  "use strict";
  var S = window.SITE_SHOP;
  if (!S) { return; }
  var KEY = "lastbite-demo-cart-v1";
  var F = S.fees;
  var state = { lines: [], mode: "delivery", promo: false };

  var byId = {};
  S.items.forEach(function (x) { byId[x.id] = x; });
  var extraById = {};
  S.extras.forEach(function (x) { extraById[x.id] = x; });

  function money(p) { return "£" + (p / 100).toFixed(2); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && Array.isArray(d.lines)) { state.lines = d.lines; state.mode = d.mode === "collection" ? "collection" : "delivery"; state.promo = !!d.promo; }
      }
    } catch (e) { /* storage unavailable: basket lives in memory */ }
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function totals() {
    var sub = 0, count = 0;
    state.lines.forEach(function (l) { sub += l.unit * l.qty; count += l.qty; });
    var disc = state.promo ? Math.round(sub * F.promo_pct / 100) : 0;
    var del = state.mode === "delivery" && sub > 0 ? F.delivery : 0;
    var svc = sub > 0 ? F.service : 0;
    return { sub: sub, count: count, disc: disc, del: del, svc: svc, total: sub - disc + del + svc };
  }

  /* Public API for other pages (burger builder) */
  function addLine(line) {
    var found = null;
    state.lines.forEach(function (l) { if (l.key === line.key) { found = l; } });
    if (found) { found.qty = Math.min(99, found.qty + line.qty); } else { state.lines.push(line); }
    save();
    render();
  }
  function addItem(id, extraIds, qty) {
    var it = byId[id];
    if (!it || it.soldout) { return; }
    extraIds = (extraIds || []).slice().sort();
    var unit = it.price, names = [];
    extraIds.forEach(function (e) { if (extraById[e]) { unit += extraById[e].price; names.push(extraById[e].name); } });
    addLine({ key: id + "|" + extraIds.join(","), name: it.name, desc: names.length ? "+ " + names.join(", ") : "", unit: unit, qty: qty || 1 });
  }
  window.LBCart = { addLine: addLine, addItem: addItem, open: openCart };

  /* Rendering */
  var cart = $("#cart");
  function render() {
    var t = totals();
    $$("[data-cart-count]").forEach(function (el) { el.textContent = t.count; el.setAttribute("aria-label", t.count + " items"); });
    $$("[data-open-cart]").forEach(function (el) {
      if (el.classList.contains("cart-btn")) { el.setAttribute("aria-label", "Open basket, " + t.count + " items"); }
    });
    if (!cart) { return; }
    var list = $("[data-cart-lines]", cart);
    list.innerHTML = "";
    state.lines.forEach(function (l, idx) {
      var li = document.createElement("li");
      li.className = "line";
      li.innerHTML = '<div><h3></h3></div><span class="l-price"></span><div class="opts-txt"></div>' +
        '<div class="l-ctl"><div class="qty" role="group"><button type="button" data-dec><svg class="i" aria-hidden="true"><use href="#i-minus"/></svg></button><output></output><button type="button" data-inc><svg class="i" aria-hidden="true"><use href="#i-plus"/></svg></button></div>' +
        '<button type="button" class="l-remove" data-remove>Remove</button></div>';
      $("h3", li).textContent = l.name;
      $(".l-price", li).textContent = money(l.unit * l.qty);
      $(".opts-txt", li).textContent = l.desc || "";
      if (!l.desc) { $(".opts-txt", li).hidden = true; }
      $("output", li).textContent = l.qty;
      $("[data-dec]", li).setAttribute("aria-label", "Decrease quantity of " + l.name);
      $("[data-inc]", li).setAttribute("aria-label", "Increase quantity of " + l.name);
      $("[data-remove]", li).setAttribute("aria-label", "Remove " + l.name);
      li.setAttribute("data-idx", idx);
      list.appendChild(li);
    });
    var empty = state.lines.length === 0;
    $("[data-cart-empty]", cart).hidden = !empty;
    list.hidden = empty;
    $("[data-t-sub]", cart).textContent = money(t.sub);
    $("[data-t-disc]", cart).textContent = "-" + money(t.disc);
    $("[data-t-disc-row]", cart).hidden = !(t.disc > 0);
    $("[data-t-del]", cart).textContent = money(t.del);
    $("[data-t-del-row]", cart).hidden = state.mode !== "delivery";
    $("[data-t-svc]", cart).textContent = money(t.svc);
    $("[data-t-total]", cart).textContent = money(t.total);
    $$("[data-mode]", cart).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === state.mode)); });
    $("[data-closed-note]", cart).hidden = window.SITE_OPEN !== false;
    var short = state.mode === "delivery" && t.sub > 0 && t.sub < F.min_delivery;
    var minNote = $("[data-min-note]", cart);
    minNote.hidden = !short;
    if (short) { minNote.textContent = "Add " + money(F.min_delivery - t.sub) + " more for delivery, or switch to collection. (Example minimum order " + money(F.min_delivery) + ".)"; }
    $("[data-checkout]", cart).disabled = empty || short;
    // upsell
    var up = $("[data-upsell]", cart), row = $("[data-upsell-row]", cart);
    row.innerHTML = "";
    S.upsell.forEach(function (id) {
      var it = byId[id];
      if (!it) { return; }
      var b = document.createElement("button");
      b.type = "button";
      b.className = "up";
      b.setAttribute("data-up", id);
      b.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-plus"/></svg><span></span>';
      $("span", b).textContent = it.name + " " + money(it.price);
      row.appendChild(b);
    });
    up.hidden = empty;
    // sync promo message
    var pm = $("[data-promo-msg]", cart);
    if (state.promo && !pm.textContent) { pm.textContent = F.promo_code + " applied: " + F.promo_pct + "% off items."; pm.className = "promo-msg ok"; }
  }

  function openCart() {
    render();
    if (cart && !cart.open) { cart.showModal(); }
  }

  /* Events: basket */
  document.addEventListener("click", function (e) {
    var openBtn = e.target.closest("[data-open-cart]");
    if (openBtn) { e.preventDefault(); openCart(); return; }
    var closeBtn = e.target.closest("[data-close-dialog]");
    if (closeBtn) { var d = closeBtn.closest("dialog"); if (d) { d.close(); } return; }
    var dlg = e.target.tagName === "DIALOG" ? e.target : null;
    if (dlg) {
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) { dlg.close(); }
      return;
    }
    var add = e.target.closest("[data-add]");
    if (add) {
      var id = add.getAttribute("data-add");
      if (add.hasAttribute("data-custom")) { openOptions(id); return; }
      addItem(id, [], 1);
      flash(add, byId[id].name);
      return;
    }
    var up = e.target.closest("[data-up]");
    if (up) { addItem(up.getAttribute("data-up"), [], 1); return; }
    var mode = e.target.closest("[data-mode]");
    if (mode) { state.mode = mode.getAttribute("data-mode"); save(); render(); return; }
    var line = e.target.closest(".line");
    if (line) {
      var idx = parseInt(line.getAttribute("data-idx"), 10), l = state.lines[idx];
      if (!l) { return; }
      if (e.target.closest("[data-inc]")) { l.qty = Math.min(99, l.qty + 1); }
      else if (e.target.closest("[data-dec]")) { l.qty -= 1; if (l.qty < 1) { state.lines.splice(idx, 1); } }
      else if (e.target.closest("[data-remove]")) { state.lines.splice(idx, 1); }
      else { return; }
      save(); render();
    }
  });

  function flash(btn, name) {
    var card = btn.closest(".dish");
    if (card) { card.classList.add("is-added"); window.setTimeout(function () { card.classList.remove("is-added"); }, 700); }
    if (window.showToast) { window.showToast("Added " + name + " to your basket"); }
  }

  /* Promo */
  var promoForm = cart && $("[data-promo]", cart);
  if (promoForm) {
    promoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("input", promoForm), msg = $("[data-promo-msg]", promoForm);
      var v = input.value.trim().toUpperCase();
      if (!v) { msg.textContent = "Enter a code."; msg.className = "promo-msg bad"; return; }
      if (v === F.promo_code) {
        state.promo = true;
        msg.textContent = F.promo_code + " applied: " + F.promo_pct + "% off items.";
        msg.className = "promo-msg ok";
      } else {
        state.promo = false;
        msg.textContent = "That code is not valid.";
        msg.className = "promo-msg bad";
      }
      save(); render();
    });
  }

  /* Options dialog */
  var opt = $("#options");
  var optState = { id: null, qty: 1 };
  function optPrice() {
    var it = byId[optState.id], p = it.price;
    $$("input:checked", opt).forEach(function (c) { p += extraById[c.value].price; });
    return p * optState.qty;
  }
  function optUpdate() {
    $("[data-opt-qty]", opt).textContent = optState.qty;
    $("[data-opt-add]", opt).textContent = "Add to basket · " + money(optPrice());
  }
  function openOptions(id) {
    var it = byId[id];
    if (!opt || !it) { return; }
    optState = { id: id, qty: 1 };
    $("[data-opt-title]", opt).textContent = it.name;
    $("[data-opt-desc]", opt).textContent = it.desc + " " + money(it.price);
    var box = $("[data-opt-extras]", opt);
    box.innerHTML = "";
    S.extras.forEach(function (x) {
      var lb = document.createElement("label");
      lb.className = "opt";
      lb.innerHTML = '<input type="checkbox"><span class="o-name"></span><span class="o-price"></span>';
      $("input", lb).value = x.id;
      $(".o-name", lb).textContent = x.name;
      $(".o-price", lb).textContent = "+" + money(x.price);
      box.appendChild(lb);
    });
    optUpdate();
    opt.showModal();
  }
  if (opt) {
    opt.addEventListener("change", optUpdate);
    $("[data-opt-inc]", opt).addEventListener("click", function () { optState.qty = Math.min(20, optState.qty + 1); optUpdate(); });
    $("[data-opt-dec]", opt).addEventListener("click", function () { optState.qty = Math.max(1, optState.qty - 1); optUpdate(); });
    $("[data-opt-form]", opt).addEventListener("submit", function (e) {
      e.preventDefault();
      var ids = $$("input:checked", opt).map(function (c) { return c.value; });
      addItem(optState.id, ids, optState.qty);
      opt.close();
      if (window.showToast) { window.showToast("Added " + byId[optState.id].name + " to your basket"); }
    });
  }

  /* Checkout */
  var co = $("#checkout");
  if (co && cart) {
    var form = $("[data-co-form]", co), ok = $("[data-co-success]", co);
    $("[data-checkout]", cart).addEventListener("click", function () {
      var t = totals();
      form.hidden = false;
      ok.hidden = true;
      $$(".field", form).forEach(function (f) { f.classList.remove("is-invalid"); });
      $("[data-co-summary]", form).textContent = (state.mode === "delivery" ? "Delivery" : "Collection") + " · " + t.count + (t.count === 1 ? " item" : " items") + " · " + money(t.total);
      $("[data-co-addr]", form).hidden = state.mode !== "delivery";
      cart.close();
      co.showModal();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      $$(".field", form).forEach(function (field) {
        var input = $("input, textarea", field);
        var needed = input && (input.hasAttribute("required") || (input.name === "address" && state.mode === "delivery"));
        var bad = needed && !input.value.trim();
        field.classList.toggle("is-invalid", !!bad);
        if (input) { input.setAttribute("aria-invalid", bad ? "true" : "false"); }
        if (bad) { valid = false; }
      });
      var consent = $("input[name=consent]", form);
      if (!consent.checked) { valid = false; consent.focus(); }
      if (!valid) { var first = $(".is-invalid input", form); if (first) { first.focus(); } return; }
      form.hidden = true;
      ok.hidden = false;
      ok.focus();
    });
    $("[data-co-done]", co).addEventListener("click", function () {
      state.lines = []; state.promo = false;
      var pm = $("[data-promo-msg]", cart); pm.textContent = ""; pm.className = "promo-msg";
      save(); render(); form.reset(); co.close();
    });
  }

  load();
  render();
})();
