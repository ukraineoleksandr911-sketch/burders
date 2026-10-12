(function () {
  "use strict";
  var root = document.querySelector("[data-builder]");
  if (!root) { return; }
  var S = window.SITE_SHOP || {};
  var ALG = S.allergens || {};
  var base = parseInt(root.getAttribute("data-base"), 10);
  var maxCheese = parseInt(root.getAttribute("data-max-cheese"), 10);
  var maxSauce = parseInt(root.getAttribute("data-max-sauce"), 10);
  var form = root.querySelector("[data-b-form]");
  var qty = 1;

  function money(p) { return "£" + (p / 100).toFixed(2); }
  function all(sel) { return Array.prototype.slice.call(form.querySelectorAll(sel)); }
  function checked(name) { return all("input[name=" + name + "]:checked"); }

  function limit(name, max, key) {
    var on = checked(name).length;
    all("input[name=" + name + "]").forEach(function (c) { c.disabled = !c.checked && on >= max; });
    var msg = root.querySelector("[data-limit=" + key + "]");
    if (msg) { msg.textContent = on >= max ? "Maximum of " + max + " reached. Untick one to change." : ""; }
  }

  function compute() {
    limit("cheese", maxCheese, "cheese");
    limit("sauce", maxSauce, "sauce");
    var price = base, lines = [], alg = {};
    function take(name, group) {
      checked(name).forEach(function (c) {
        var p = parseInt(c.getAttribute("data-price"), 10) || 0;
        price += p;
        lines.push([group ? group + ": " + c.getAttribute("data-label") : c.getAttribute("data-label"), p]);
        (c.getAttribute("data-alg") || "").split(" ").forEach(function (a) { if (a) { alg[a] = 1; } });
      });
    }
    take("bun", "Bun");
    take("patties", "");
    take("ptype", "Patty");
    take("cheese", "Cheese");
    take("veg", "");
    take("sauce", "Sauce");
    take("premium", "Extra");
    return { price: price, lines: lines, alg: Object.keys(alg) };
  }

  var list = root.querySelector("[data-b-list]");
  function render() {
    var r = compute();
    list.innerHTML = "";
    var li0 = document.createElement("li");
    li0.innerHTML = "<span>Base burger</span><span></span>";
    li0.lastChild.textContent = money(base);
    list.appendChild(li0);
    r.lines.forEach(function (l) {
      var li = document.createElement("li");
      li.innerHTML = "<span></span><span></span>";
      li.firstChild.textContent = l[0];
      li.lastChild.textContent = l[1] ? "+" + money(l[1]) : "";
      list.appendChild(li);
    });
    var names = r.alg.map(function (a) { return (ALG[a] || a).toLowerCase(); });
    root.querySelector("[data-b-alg]").textContent = names.length ? "Contains: " + names.join(", ") : "No listed allergens";
    var total = money(r.price * qty);
    root.querySelector("[data-b-price]").textContent = total;
    document.querySelector("[data-b-price2]").textContent = total;
    root.querySelector("[data-b-qty]").textContent = qty;
    return r;
  }

  function addToBasket() {
    var r = compute();
    var labels = r.lines.map(function (l) { return l[0].replace(/^(Bun|Patty|Cheese|Sauce|Extra): /, ""); });
    var key = "custom|" + labels.join(",");
    if (window.LBCart) {
      window.LBCart.addLine({ key: key, name: "Custom burger", desc: labels.join(", "), unit: r.price, qty: qty });
      if (window.showToast) { window.showToast("Added your burger to the basket"); }
    }
  }

  form.addEventListener("change", render);
  root.querySelector("[data-b-inc]").addEventListener("click", function () { qty = Math.min(20, qty + 1); render(); });
  root.querySelector("[data-b-dec]").addEventListener("click", function () { qty = Math.max(1, qty - 1); render(); });
  root.querySelector("[data-b-add]").addEventListener("click", addToBasket);
  document.querySelector("[data-b-add2]").addEventListener("click", addToBasket);
  render();
})();
