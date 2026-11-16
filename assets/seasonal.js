/* Seasonal touches, switched on by the visitor's own date:
     October ............ Halloween: spooky filters on the video call, the odd bat
     around Diwali ...... string lights along the top of every page
     December ........... gentle snow on the homepages
     Jan 1-3 ............ a confetti burst      Holi ... a burst of colors
   Preview any of them with ?season=halloween (or diwali, winter, newyear, holi, none).
   Everything is decorative (aria-hidden, no taps blocked) and stays off for people
   who ask their device for reduced motion, except the lights, which just stop twinkling.
   The video-call page reads window.VJ_SEASON for its seasonal filters and greeting. */
(function () {
  "use strict";
  var now = new Date(), Y = now.getFullYear(), M = now.getMonth() + 1, D = now.getDate();
  function day(y, md) { var p = md.split("-"); return new Date(y, +p[0] - 1, +p[1]); }
  function within(date, before, after) { var d = (now - date) / 864e5; return d >= -before && d < after + 1; }

  // Diwali and Holi follow the lunar calendar, so they move every year
  var DIWALI = { 2026: "11-08", 2027: "10-29", 2028: "10-17", 2029: "11-05", 2030: "10-26", 2031: "11-14", 2032: "11-02" };
  var HOLI = { 2027: "03-22", 2028: "03-11", 2029: "03-01", 2030: "03-20", 2031: "03-09", 2032: "03-27" };

  var on = {
    halloween: M === 10,
    diwali: DIWALI[Y] ? within(day(Y, DIWALI[Y]), 7, 7) : (M === 11 && D <= 14),
    winter: M === 12,
    newyear: M === 1 && D <= 3,
    holi: !!HOLI[Y] && within(day(Y, HOLI[Y]), 0, 2)
  };
  var spookyWeek = M === 10 && D >= 24;
  var pick = (location.search.match(/[?&]season=([a-z]+)/) || [])[1];
  if (pick) { for (var k in on) on[k] = (k === pick); spookyWeek = pick === "halloween"; }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- what the video call uses ----
  var S = { on: on, any: false, greeting: "", hint: "", vibe: null, vibeDefault: false, assets: [], label: "" };
  if (on.halloween) {
    S.label = "Halloween specials";
    S.greeting = "happy halloween! 🎃 tap the magic wand for some spooky filters.";
    S.hint = "tap for a spooky 🎃 filter!";
    S.vibe = { label: "Spooky", emoji: "🎃", f: "sepia(0.35) saturate(1.7) hue-rotate(-22deg) contrast(1.15) brightness(0.88)" };
    S.vibeDefault = spookyWeek;
    S.assets = [
      { id: "pumpkin", label: "Pumpkin", slot: "face", preview: "🎃", emoji: "🎃" },
      { id: "witch", label: "Witch", slot: "face", preview: "🧙", emoji: "🧙" },
      { id: "ghost", label: "Ghost", slot: "top", preview: "👻", emoji: "👻" },
      { id: "bats", label: "Bats", slot: "top", preview: "🦇", emoji: "🦇" },
      { id: "skull", label: "Skull", slot: "face", preview: "💀", emoji: "💀" }
    ];
  } else if (on.diwali) {
    S.label = "Diwali specials";
    S.greeting = "happy diwali! 🪔 wishing you light, joy, and way too many sweets.";
    S.hint = "tap for a golden diwali ✨ filter!";
    S.vibe = { label: "Diya", emoji: "🪔", f: "saturate(1.45) sepia(0.28) hue-rotate(-10deg) brightness(1.08) contrast(1.05)" };
    S.assets = [
      { id: "diya", label: "Diya", slot: "top", preview: "🪔", emoji: "🪔" },
      { id: "fireworks", label: "Fireworks", slot: "top", preview: "🎆", emoji: "🎆" }
    ];
  } else if (on.winter) {
    S.label = "Holiday specials";
    S.greeting = "happy holidays! ❄️ grab a cocoa and stay a while.";
    S.hint = "tap for a frosty ❄️ filter!";
    S.vibe = { label: "Frosty", emoji: "❄️", f: "saturate(0.75) hue-rotate(12deg) brightness(1.12) contrast(1.05)" };
    S.assets = [
      { id: "santa", label: "Santa", slot: "face", preview: "🎅", emoji: "🎅" },
      { id: "snowman", label: "Snowman", slot: "face", preview: "⛄", emoji: "⛄" },
      { id: "snowflake", label: "Snow", slot: "top", preview: "❄️", emoji: "❄️" }
    ];
  } else if (on.newyear) {
    S.greeting = "happy new year! 🎉 thanks for starting it with a call.";
  } else if (on.holi) {
    S.greeting = "happy holi! 🌈 consider yourself splashed.";
  }
  S.any = !!(S.greeting || S.vibe);
  window.VJ_SEASON = S;

  // ---- decorations ----
  var isCall = !!document.getElementById("feed");   // the video-call homepage
  function isHome() { return isCall || !!document.querySelector(".projects-gallery"); }
  function once(key) { try { if (sessionStorage.getItem(key)) return false; sessionStorage.setItem(key, "1"); } catch (e) {} return true; }
  function layer(cls, z) {
    var el = document.createElement("div");
    el.className = "vj-season " + cls; el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:" + (z || 40);
    document.body.appendChild(el); return el;
  }
  function css(text) { var s = document.createElement("style"); s.textContent = text; document.head.appendChild(s); }

  // Diwali: a strand of warm, twinkling bulbs hanging along the top edge
  function lights() {
    var colors = ["#ffb703", "#ff6b6b", "#ffd166", "#06d6a0", "#ff8fab", "#8ecae6", "#fb8500"];
    css(".vj-lights{position:absolute;left:0;right:0;top:0;height:34px;pointer-events:none;z-index:1002;overflow:hidden}" +
        ".vj-lights svg{position:absolute;left:0;top:0;width:100%;height:16px}" +
        ".vj-bulb{position:absolute;top:7px;width:9px;height:14px;margin-left:-4.5px;border-radius:50% 50% 45% 45%/55% 55% 45% 45%;" +
        "box-shadow:0 0 6px 2px var(--g),0 0 14px 4px var(--g);background:radial-gradient(circle at 40% 30%,#fff 0,var(--c) 45%,var(--c) 100%);" +
        (reduce ? "" : "animation:vjTwinkle var(--d) ease-in-out infinite alternate;") + "}" +
        ".vj-bulb::before{content:'';position:absolute;left:2px;top:-4px;width:5px;height:5px;border-radius:1px;background:#4a4a4a}" +
        "@keyframes vjTwinkle{from{opacity:1;filter:brightness(1.15)}to{opacity:.45;filter:brightness(.8)}}" +
        "html.dark .vj-bulb{box-shadow:0 0 8px 3px var(--g),0 0 20px 6px var(--g)}");
    var strand = document.createElement("div"); strand.className = "vj-lights vj-season"; strand.setAttribute("aria-hidden", "true");
    strand.innerHTML = '<svg viewBox="0 0 100 16" preserveAspectRatio="none"><path d="M0,3 ' +
      Array.apply(null, Array(20)).map(function (_, i) { return "Q" + (i * 5 + 2.5) + ",13 " + (i * 5 + 5) + ",3"; }).join(" ") +
      '" fill="none" stroke="#3b3b3b" stroke-width="0.6" vector-effect="non-scaling-stroke"/></svg>';
    var n = Math.max(10, Math.min(40, Math.round(window.innerWidth / 38)));
    for (var i = 0; i < n; i++) {
      var b = document.createElement("span"), c = colors[i % colors.length], x = (i + 0.5) / n;
      var sag = Math.sin((x * 20 % 1) * Math.PI) * 8;   // follow the drooping wire
      b.className = "vj-bulb";
      b.style.cssText = "left:" + (x * 100) + "%;top:" + (3 + sag) + "px;--c:" + c + ";--g:" + c + "99;--d:" + (0.8 + (i * 37 % 10) / 8) + "s";
      strand.appendChild(b);
    }
    (isCall ? document.querySelector(".stage") || document.body : document.body).appendChild(strand);
    if (!isCall) document.body.style.position = document.body.style.position || "relative";
  }

  // December: soft snow on a canvas (paused when the tab is hidden)
  function snow(count) {
    if (reduce) return;
    var c = document.createElement("canvas"); c.className = "vj-season vj-snow"; c.setAttribute("aria-hidden", "true");
    c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:" + (isCall ? 4 : 40);
    (isCall ? document.querySelector(".stage") || document.body : document.body).appendChild(c);
    var x = c.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 1.5), W, H, flakes = [];
    function size() { W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; }
    size(); addEventListener("resize", size);
    var n = Math.round(count * Math.min(1, innerWidth / 1200) + count * 0.35);
    for (var i = 0; i < n; i++) flakes.push({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 2.4, s: 0.15 + Math.random() * 0.45, w: Math.random() * 6.28 });
    var last = 0;
    (function tick(t) {
      requestAnimationFrame(tick);
      if (document.hidden || t - last < 33) return;   // ~30fps is plenty for snow
      var dt = Math.min(3, (t - last) / 33); last = t;
      x.clearRect(0, 0, W, H);
      // white flakes everywhere; on light pages a soft blue glow makes them read as snow, not dust
      var light = !document.documentElement.classList.contains("dark") && !isCall;
      x.fillStyle = light ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.85)";
      x.shadowColor = light ? "rgba(90,130,185,0.55)" : "rgba(255,255,255,0.35)";
      x.shadowBlur = (light ? 4 : 3) * dpr;
      for (var j = 0; j < flakes.length; j++) {
        var f = flakes[j];
        f.y += f.s * 0.0016 * dt * (1 + f.r * 0.3); f.w += 0.02 * dt; f.x += Math.sin(f.w) * 0.0006 * dt;
        if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
        x.beginPath(); x.arc(f.x * W, f.y * H, f.r * dpr, 0, 6.283); x.fill();
      }
    })(0);
  }

  // October: a little bat flutters across every so often
  function bats(every) {
    if (reduce) return;
    css(".vj-bat{position:absolute;font-size:26px;left:-40px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));animation:vjBat var(--t) linear forwards}" +
        "@keyframes vjBat{0%{transform:translate(0,0) scale(.9)}25%{transform:translate(28vw,-30px) scale(1)}50%{transform:translate(55vw,10px) scale(.95)}75%{transform:translate(80vw,-25px) scale(1)}100%{transform:translate(calc(100vw + 80px),0) scale(.9)}}");
    var L = layer("vj-bats", isCall ? 5 : 40);
    function fly() {
      if (document.hidden) return;
      var b = document.createElement("span"); b.className = "vj-bat"; b.textContent = "🦇";
      b.style.top = (8 + Math.random() * 30) + "%"; b.style.setProperty("--t", (7 + Math.random() * 4) + "s");
      L.appendChild(b); setTimeout(function () { b.remove(); }, 12000);
    }
    setTimeout(fly, 2500); setInterval(fly, every);
  }

  // New Year confetti / Holi color burst: once per visit, on the homepages
  function burst(colors, shapes, n) {
    if (reduce) return;
    css(".vj-bit{position:absolute;top:-20px;width:9px;height:14px;border-radius:2px;opacity:.95;animation:vjFall var(--t) cubic-bezier(.25,.6,.4,1) forwards}" +
        ".vj-bit.dot{width:14px;height:14px;border-radius:50%;filter:blur(1px);opacity:.8}" +
        "@keyframes vjFall{to{transform:translate(var(--dx),110vh) rotate(var(--r));opacity:.9}}");
    var L = layer("vj-burst", 45);
    for (var i = 0; i < n; i++) {
      var b = document.createElement("span"); b.className = "vj-bit" + (shapes === "dot" ? " dot" : "");
      b.style.left = Math.random() * 100 + "%"; b.style.background = colors[i % colors.length];
      b.style.setProperty("--t", (2.6 + Math.random() * 2.4) + "s"); b.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
      b.style.setProperty("--r", (Math.random() * 720 - 360) + "deg"); b.style.animationDelay = Math.random() * 0.8 + "s";
      L.appendChild(b);
    }
    setTimeout(function () { L.remove(); }, 7000);
  }

  function decorate() {
    if (on.diwali) lights();
    if (on.winter && isHome()) snow(isCall ? 45 : 70);
    if (on.halloween && isHome()) bats(isCall ? (spookyWeek ? 14000 : 30000) : 22000);
    if (on.newyear && isHome() && once("vj_newyear")) burst(["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#ffffff"], "bit", 90);
    if (on.holi && isHome() && once("vj_holi")) burst(["#ff006e", "#fb5607", "#ffbe0b", "#3a86ff", "#8338ec", "#06d6a0"], "dot", 80);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", decorate); else decorate();
})();
