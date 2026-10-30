/* Hidden easter egg: type "code blue" or "stat" anywhere and the site gets resuscitated.
   Phones have no page-wide keyboard, so typing it alone in a chat box works too. */
(function () {
  "use strict";
  var running = false, buffer = "", waiting = null;
  var TRIGGER = /(code blue|stat)$/;

  function css() {
    if (document.getElementById("vjCodeStyle")) return;
    var s = document.createElement("style");
    s.id = "vjCodeStyle";
    s.textContent =
      ".vj-code{position:fixed;inset:0;z-index:2147483640;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(6,10,14,.9);color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:24px;text-align:center;opacity:0;transition:opacity .25s;}" +
      ".vj-code.on{opacity:1;}" +
      ".vj-code-title{font-size:clamp(26px,7vw,44px);font-weight:800;letter-spacing:2px;color:#ff5a5f;}" +
      ".vj-code.ok .vj-code-title{color:#4be38b;}" +
      ".vj-code-sub{font-size:15px;color:#c9d1d9;min-height:22px;max-width:420px;}" +
      ".vj-code svg{width:min(560px,88vw);height:120px;display:block;}" +
      ".vj-code path{fill:none;stroke:#ff5a5f;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}" +
      ".vj-code.ok path{stroke:#4be38b;}" +
      ".vj-shock{animation:vjshock .32s linear;}" +
      "@keyframes vjshock{0%,100%{transform:none;filter:none}25%{transform:translateX(-6px);filter:brightness(1.8)}50%{transform:translateX(6px)}75%{transform:translateX(-3px);filter:brightness(1.4)}}" +
      "@media (prefers-reduced-motion:reduce){.vj-shock{animation:none}}";
    document.head.appendChild(s);
  }

  var FLAT = "M0 60H560";
  var BEAT = "M0 60H70l12-8 12 8h14l8 10 14-58 14 66 9-18h40l14-10 14 10h60l12-8 12 8h14l8 10 14-58 14 66 9-18h40l14-10 14 10h26";

  function run() {
    if (running) return;
    running = true;
    css();
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var box = document.createElement("div");
    box.className = "vj-code";
    box.setAttribute("role", "status");
    box.innerHTML = '<div class="vj-code-title">CODE BLUE</div>' +
      '<svg viewBox="0 0 560 120" aria-hidden="true"><path d="' + FLAT + '"/></svg>' +
      '<div class="vj-code-sub">Website unresponsive. Starting compressions…</div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.classList.add("on"); });
    var title = box.querySelector(".vj-code-title"), sub = box.querySelector(".vj-code-sub"), path = box.querySelector("path");

    function buzz(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }
    function done() {
      box.classList.remove("on");
      setTimeout(function () { box.remove(); running = false; }, 300);
    }
    function shock(msg) {
      sub.textContent = msg;
      buzz(60);
      box.classList.remove("vj-shock"); void box.offsetWidth; box.classList.add("vj-shock");
    }
    if (reduce) {
      setTimeout(function () { box.classList.add("ok"); path.setAttribute("d", BEAT); title.textContent = "ROSC"; sub.textContent = "Site resuscitated. It was the coffee."; }, 900);
      setTimeout(done, 2800);
      return;
    }
    setTimeout(function () { shock("Charging to 200 joules… clear!"); }, 1100);
    setTimeout(function () { shock("Shock delivered. Still flat. Clear!"); }, 2100);
    setTimeout(function () {
      box.classList.add("ok");
      title.textContent = "ROSC";
      path.setAttribute("d", BEAT);
      var len = path.getTotalLength();
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      path.getBoundingClientRect();
      path.style.transition = "stroke-dashoffset 1.1s linear";
      path.style.strokeDashoffset = 0;
      sub.textContent = "We have a rhythm! Site resuscitated. Prescribing one coffee.";
      buzz([20, 80, 20]);
    }, 3100);
    setTimeout(done, 5200);
  }

  function isField(el) {
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  }

  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || isField(e.target)) return;
    if (e.key === "Escape") { buffer = ""; return; }
    if (e.key.length !== 1) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-12);
    if (TRIGGER.test(buffer)) { buffer = ""; run(); }
  });

  // chat boxes only: a word in a contact form or search must never set it off
  document.addEventListener("input", function (e) {
    var el = e.target;
    if (!el || (el.id !== "chatField" && el.id !== "vjwField")) return;
    clearTimeout(waiting);
    if (/^\s*(code blue|stat)\s*$/i.test(el.value)) waiting = setTimeout(run, 700);
  });
})();
