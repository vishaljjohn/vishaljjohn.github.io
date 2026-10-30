/* Mac's Big Gulp: the Immune Team game on the children's book page.
   Steer Mac the Macrophage around Sam's scraped knee, swallow germs to grow,
   dodge the ones bigger than you, and leave Sam's own cells alone.
   Germs keep multiplying, so clear the infection before it takes over.

   Immune-system ideas in the rules:
   - Macrophages engulf germs.
   - Memory: after a few of one germ, it is easier to catch from then on.
   - B-Bee's antibodies slow germs down and make them easier to swallow.
   - Tia the T-Cell calls in backup. */
(function () {
  "use strict";
  var root = document.getElementById("germGame");
  if (!root) return;

  var WORLD_W = 1800, WORLD_H = 1200;
  var START_R = 26, MIN_R = 20;
  var KINDS = ["germ-green", "germ-blue", "germ-purple", "germ-orange"];
  var KIND_NAMES = { "germ-green": "green germs", "germ-blue": "squiggly germs", "germ-purple": "purple germs", "germ-orange": "orange germs" };
  var MEMORY_AT = 4;
  var FACTS = [
    "Macrophage means \"big eater.\" Mac's name is his job!",
    "Your body makes billions of new immune cells every day.",
    "Fevers help: many germs don't like the heat.",
    "Lymph nodes are like lookout posts for your immune system.",
    "Washing your hands stops germs before the team even has to fight."
  ];

  var stage = root.querySelector(".gg-stage"), canvas = root.querySelector(".gg-canvas"), ctx = canvas.getContext("2d");
  var startPanel = root.querySelector(".gg-start"), endPanel = root.querySelector(".gg-end");
  var scoreEl = root.querySelector(".gg-score"), sizeEl = root.querySelector(".gg-size");
  var barEl = root.querySelector(".gg-bar i"), sayEl = root.querySelector(".gg-say");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Sprites: the same doodles used across the site ---- */
  var sprites = {};
  fetch("../assets/doodles.svg").then(function (r) { return r.text(); }).then(function (text) {
    var doc = new DOMParser().parseFromString(text, "image/svg+xml");
    Array.prototype.forEach.call(doc.querySelectorAll("symbol"), function (sym) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="240" height="240">' + sym.innerHTML + "</svg>";
      var img = new Image();
      img.onload = function () { sprites[sym.id] = img; drawIdle(); };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
  }).catch(function () {});
  var FALLBACK = { mac: "#f7c531", "germ-green": "#2fa84a", "germ-blue": "#2f9be0", "germ-purple": "#7d5fa8", "germ-orange": "#f59a23", "own-cell": "#ffc2d1", bbee: "#ffb732", tia: "#ee6b3b" };

  /* ---- State ---- */
  var W = 0, H = 0, DPR = 1, running = false, paused = false, raf = null, last = 0;
  var mac, germs, crumbs, cells, drops, bits, floats, deco, cam, remembered, eatenByKind;
  var score, infection, hurtUntil, antibodyUntil, spawnIn, dropIn, sayUntil, elapsed, target, keys = {};

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function buzz(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }
  function grow(obj, area) { obj.r = Math.sqrt(Math.max(1, obj.r * obj.r + area)); }

  function say(text, hold) { sayEl.textContent = text; sayUntil = elapsed + (hold || 3); }
  function hud() {
    scoreEl.textContent = score;
    sizeEl.textContent = Math.round(mac.r / START_R * 10) / 10 + "x";
    barEl.style.width = Math.max(0, Math.min(100, infection)) + "%";
  }

  function resize() {
    var box = stage.getBoundingClientRect();
    W = Math.max(1, box.width); H = Math.max(1, box.height);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    if (!running) drawIdle();
  }
  window.addEventListener("resize", resize);

  /* ---- Spawning ---- */
  function awayFromMac(minDist) {
    for (var i = 0; i < 20; i++) {
      var x = rnd(60, WORLD_W - 60), y = rnd(60, WORLD_H - 60);
      if (!mac || Math.hypot(x - mac.x, y - mac.y) > minDist) return { x: x, y: y };
    }
    return { x: rnd(60, WORLD_W - 60), y: rnd(60, WORLD_H - 60) };
  }
  // germ sizes scale with Mac, so there is always something to eat and something to fear
  function spawnGerm(sizeHint) {
    var p = awayFromMac(Math.max(320, Math.min(W, H) * 0.7));
    var roll = Math.random(), base = mac ? mac.r : START_R, r;
    if (sizeHint) r = sizeHint;
    else if (roll < 0.7) r = rnd(base * 0.45, base * 0.82);
    else if (roll < 0.9) r = rnd(base * 0.85, base * 1.2);
    else r = rnd(base * 1.35, base * 1.9);
    r = Math.max(11, Math.min(170, r));
    germs.push({ x: p.x, y: p.y, r: r, kind: KINDS[Math.floor(Math.random() * KINDS.length)], a: rnd(0, 6.28), vx: 0, vy: 0, wob: rnd(0, 6.28), born: elapsed });
  }
  function spawnCrumb() { crumbs.push({ x: rnd(30, WORLD_W - 30), y: rnd(30, WORLD_H - 30), r: rnd(4, 7), h: rnd(0, 1) }); }
  function spawnDrop() {
    var p = awayFromMac(240);
    drops.push({ x: p.x, y: p.y, r: 24, kind: Math.random() < 0.55 ? "bbee" : "tia", wob: 0 });
  }

  function newGame() {
    mac = { x: WORLD_W / 2, y: WORLD_H / 2, r: START_R, vx: 0, vy: 0, gulp: 0 };
    germs = []; crumbs = []; cells = []; drops = []; bits = []; floats = []; deco = [];
    remembered = {}; eatenByKind = {};
    score = 0; infection = 45; hurtUntil = 0; antibodyUntil = 0; spawnIn = 2.6; dropIn = 12; sayUntil = 0; elapsed = 0;
    target = null; keys = {};
    cam = { x: mac.x, y: mac.y, s: 1 };
    var i;
    for (i = 0; i < 130; i++) spawnCrumb();
    for (i = 0; i < 18; i++) spawnGerm();
    // a few easy first bites in view, so nobody starts on an empty screen
    for (i = 0; i < 5; i++) {
      var ang = i * 1.257 + rnd(0, 0.5), far = rnd(130, 190);
      germs.push({ x: mac.x + Math.cos(ang) * far, y: mac.y + Math.sin(ang) * far, r: rnd(13, 17), kind: KINDS[i % KINDS.length], a: rnd(0, 6.28), vx: 0, vy: 0, wob: rnd(0, 6.28), born: 0 });
    }
    for (i = 0; i < 11; i++) { var p = awayFromMac(190); cells.push({ x: p.x, y: p.y, r: rnd(24, 40), a: rnd(0, 6.28) }); }
    // drifting scenery: red blood cells
    for (i = 0; i < 46; i++) deco.push({ x: rnd(0, WORLD_W), y: rnd(0, WORLD_H), r: rnd(12, 26), v: rnd(4, 14), t: rnd(0, 6.28) });
  }

  /* ---- Effects ---- */
  function burst(x, y, color, n) {
    if (reduce) return;
    for (var i = 0; i < n; i++) {
      var a = rnd(0, 6.28), s = rnd(40, 170);
      bits.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.3, 0.6), r: rnd(2, 5), c: color });
    }
  }
  function floatText(x, y, text, color) { floats.push({ x: x, y: y, t: text, c: color || "#fff", life: 0.9 }); }

  /* ---- Rules ---- */
  function canEat(g) {
    var bonus = (elapsed < antibodyUntil ? 1.4 : 1) * (remembered[g.kind] ? 1.25 : 1);
    return mac.r * bonus > g.r * 1.08;
  }
  function eat(g, idx) {
    germs.splice(idx, 1);
    grow(mac, g.r * g.r * 0.38);
    mac.gulp = 1;
    var pts = Math.max(1, Math.round(g.r / 12));
    score += pts;
    infection -= 1 + g.r / 40;
    burst(g.x, g.y, "#ffe08a", 10);
    floatText(g.x, g.y, "+" + pts);
    buzz(10);
    eatenByKind[g.kind] = (eatenByKind[g.kind] || 0) + 1;
    if (eatenByKind[g.kind] === MEMORY_AT && !remembered[g.kind]) {
      remembered[g.kind] = true;
      say("Memory T-Cell remembers the " + KIND_NAMES[g.kind] + "! They're slower and easier to swallow now.", 4);
    } else if (elapsed > sayUntil && Math.random() < 0.18) {
      say(FACTS[Math.floor(Math.random() * FACTS.length)], 4);
    }
    hud();
    if (infection <= 0) end(true);
  }
  function hurt(g) {
    if (elapsed < hurtUntil) return;
    hurtUntil = elapsed + 1.8;
    mac.r = Math.max(MIN_R, Math.sqrt(mac.r * mac.r * 0.82));
    var a = Math.atan2(mac.y - g.y, mac.x - g.x);
    mac.vx += Math.cos(a) * 520; mac.vy += Math.sin(a) * 520;
    grow(g, 60);
    infection += 2;
    burst(mac.x, mac.y, "#ff6b6b", 12);
    floatText(mac.x, mac.y - mac.r, "Ouch!", "#ffe3e3");
    say("That germ was too big! Look for ones smaller than Mac.");
    buzz([30, 40, 30]);
    hud();
    if (infection >= 100) end(false);
  }
  function bumpCell(c) {
    if (elapsed < hurtUntil) return;
    hurtUntil = elapsed + 0.8;
    mac.r = Math.max(MIN_R, Math.sqrt(mac.r * mac.r * 0.92));
    var a = Math.atan2(mac.y - c.y, mac.x - c.x);
    mac.vx += Math.cos(a) * 340; mac.vy += Math.sin(a) * 340;
    floatText(c.x, c.y - c.r, "Oops!", "#ffd1dc");
    say("That's one of Sam's own cells! Macrophages protect those.");
    buzz(25);
    hud();
  }
  function collect(d, idx) {
    drops.splice(idx, 1);
    burst(d.x, d.y, d.kind === "bbee" ? "#ffb732" : "#ee6b3b", 16);
    buzz(20);
    if (d.kind === "bbee") {
      antibodyUntil = elapsed + 8;
      say("B-Bee's antibodies! Germs are tagged: slower and easier to swallow for 8 seconds.", 4);
    } else {
      // Tia calls in backup: nearby smaller germs get cleared
      var n = 0, reach = Math.max(W, H) / cam.s * 0.55;
      for (var i = germs.length - 1; i >= 0; i--) {
        var g = germs[i];
        if (g.r < mac.r * 1.3 && Math.hypot(g.x - mac.x, g.y - mac.y) < reach) {
          burst(g.x, g.y, "#ee6b3b", 6); germs.splice(i, 1); n++; score += 1; infection -= 1.2;
        }
      }
      say(n ? "Tia called in backup! The team cleared " + n + " germs." : "Tia is on the radio: all clear nearby!", 4);
      hud();
      if (infection <= 0) end(true);
    }
  }

  /* ---- Update ---- */
  function step(dt) {
    elapsed += dt;
    // steering: pointer position relative to Mac, or the keyboard
    var ix = 0, iy = 0;
    if (keys.left) ix -= 1; if (keys.right) ix += 1; if (keys.up) iy -= 1; if (keys.down) iy += 1;
    if (ix || iy) { var n = Math.hypot(ix, iy); ix /= n; iy /= n; }
    else if (target) {
      var sx = (mac.x - cam.x) * cam.s + W / 2, sy = (mac.y - cam.y) * cam.s + H / 2;
      var dx = target.x - sx, dy = target.y - sy, d = Math.hypot(dx, dy);
      var ease = Math.min(1, d / 70);
      if (d > 6) { ix = dx / d * ease; iy = dy / d * ease; }
    }
    var speed = 245 * Math.pow(START_R / mac.r, 0.28);
    var k = Math.min(1, dt * 7);
    mac.vx += (ix * speed - mac.vx) * k; mac.vy += (iy * speed - mac.vy) * k;
    mac.x = Math.max(mac.r, Math.min(WORLD_W - mac.r, mac.x + mac.vx * dt));
    mac.y = Math.max(mac.r, Math.min(WORLD_H - mac.r, mac.y + mac.vy * dt));
    mac.gulp = Math.max(0, mac.gulp - dt * 3.5);

    // very large macrophages slowly slim down, so germs stay a challenge
    if (mac.r > 95) mac.r -= dt * (mac.r - 95) * 0.02;

    // camera: zooms out as Mac grows
    var want = Math.max(0.42, Math.min(1.05, Math.pow(44 / mac.r, 0.55))) * (Math.min(W, H) < 480 ? 0.86 : 1);
    cam.s += (want - cam.s) * Math.min(1, dt * 2);
    cam.x += (mac.x - cam.x) * Math.min(1, dt * 6);
    cam.y += (mac.y - cam.y) * Math.min(1, dt * 6);

    var slow = elapsed < antibodyUntil ? 0.5 : 1;
    for (var i = germs.length - 1; i >= 0; i--) {
      var g = germs[i];
      var dist = Math.hypot(mac.x - g.x, mac.y - g.y);
      var edible = canEat(g);
      var gs = 56 * Math.pow(26 / g.r, 0.2) * slow * (remembered[g.kind] ? 0.72 : 1);
      var ax = Math.cos(g.a), ay = Math.sin(g.a);
      g.a += rnd(-1.4, 1.4) * dt;
      if (!edible && dist < 280 && elapsed - g.born > 1) { // bigger germs give chase, a bit slower than Mac
        ax = (mac.x - g.x) / dist; ay = (mac.y - g.y) / dist; gs = Math.min(speed * 0.62, gs * 2.1 + 40) * slow;
      } else if (edible && dist < 150 + mac.r) { // smaller ones try to scurry off
        ax = (g.x - mac.x) / dist; ay = (g.y - mac.y) / dist; gs *= 1.55;
      }
      g.vx += (ax * gs - g.vx) * Math.min(1, dt * 3); g.vy += (ay * gs - g.vy) * Math.min(1, dt * 3);
      g.x = Math.max(g.r, Math.min(WORLD_W - g.r, g.x + g.vx * dt));
      g.y = Math.max(g.r, Math.min(WORLD_H - g.r, g.y + g.vy * dt));
      if (g.x <= g.r || g.x >= WORLD_W - g.r || g.y <= g.r || g.y >= WORLD_H - g.r) g.a += 2;
      g.wob += dt * 4;
      if (edible) { if (dist < mac.r * 0.92) eat(g, i); }
      else if (dist < mac.r + g.r * 0.72) hurt(g);
      if (!running) return;
    }

    for (var c = crumbs.length - 1; c >= 0; c--) {
      if (Math.hypot(crumbs[c].x - mac.x, crumbs[c].y - mac.y) < mac.r) {
        grow(mac, 11); crumbs.splice(c, 1); spawnCrumb();
      }
    }
    cells.forEach(function (o) {
      o.a += dt * 0.4;
      o.x += Math.cos(o.a) * dt * 8; o.y += Math.sin(o.a * 0.7) * dt * 8;
      if (Math.hypot(o.x - mac.x, o.y - mac.y) < mac.r * 0.7 + o.r * 0.7) bumpCell(o);
    });
    if (!running) return;
    for (var d2 = drops.length - 1; d2 >= 0; d2--) {
      drops[d2].wob += dt * 3;
      if (Math.hypot(drops[d2].x - mac.x, drops[d2].y - mac.y) < mac.r + drops[d2].r) collect(drops[d2], d2);
      if (!running) return;
    }

    // germs multiply when left alone
    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnIn = Math.max(1.8, 2.7 - elapsed * 0.008);
      if (germs.length < 46) spawnGerm();
      infection += 0.4 + Math.min(0.5, germs.length * 0.01);
      hud();
      if (infection >= 100) { end(false); return; }
    }
    dropIn -= dt;
    if (dropIn <= 0) { dropIn = rnd(12, 18); if (drops.length < 3) spawnDrop(); }

    for (var b = bits.length - 1; b >= 0; b--) {
      var p = bits[b]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
      if (p.life <= 0) bits.splice(b, 1);
    }
    for (var f = floats.length - 1; f >= 0; f--) { floats[f].life -= dt; floats[f].y -= dt * 42; if (floats[f].life <= 0) floats.splice(f, 1); }
    deco.forEach(function (o) { o.x += o.v * dt; o.t += dt; if (o.x > WORLD_W + 40) o.x = -40; });
    if (elapsed > sayUntil && sayEl.textContent.indexOf("Steer") === 0) sayEl.textContent = FACTS[0];
  }

  /* ---- Draw ---- */
  function sprite(name, x, y, r, rot) {
    var img = sprites[name];
    if (rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); x = 0; y = 0; }
    if (img) ctx.drawImage(img, x - r * 1.1, y - r * 1.1, r * 2.2, r * 2.2);
    else { ctx.fillStyle = FALLBACK[name] || "#ccc"; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill(); }
    if (rot) ctx.restore();
  }
  function ring(x, y, r, color, width, dash) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.stroke(); ctx.restore();
  }
  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = "#b5473f"; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(cam.s, cam.s); ctx.translate(-cam.x, -cam.y);

    // tissue
    var grd = ctx.createRadialGradient(WORLD_W / 2, WORLD_H / 2, 100, WORLD_W / 2, WORLD_H / 2, WORLD_W * 0.7);
    grd.addColorStop(0, "#ffd3c2"); grd.addColorStop(1, "#ff9d88");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.fillStyle = "rgba(214,84,70,.28)";
    deco.forEach(function (o) {
      ctx.beginPath(); ctx.ellipse(o.x, o.y + Math.sin(o.t) * 6, o.r, o.r * 0.68, o.t * 0.3, 0, 6.29); ctx.fill();
    });
    ctx.strokeStyle = "rgba(120,30,30,.45)"; ctx.lineWidth = 8; ctx.strokeRect(0, 0, WORLD_W, WORLD_H);

    crumbs.forEach(function (c) {
      ctx.fillStyle = c.h < 0.5 ? "#7cc77a" : "#f2b35a";
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, 6.29); ctx.fill();
    });
    cells.forEach(function (c) { sprite("own-cell", c.x, c.y, c.r); });
    drops.forEach(function (d) {
      var r = d.r + Math.sin(d.wob) * 3;
      ring(d.x, d.y, r + 8, "rgba(255,255,255,.9)", 3, [6, 6]);
      sprite(d.kind, d.x, d.y, r);
    });

    var tagged = elapsed < antibodyUntil;
    germs.forEach(function (g) {
      var edible = canEat(g), wob = Math.sin(g.wob) * 0.06;
      sprite(g.kind, g.x, g.y, g.r, wob);
      // the key rule, shown on every germ: green ring = swallow it, red ring = stay away
      ring(g.x, g.y, g.r * 1.12 + 2, edible ? "rgba(36,150,80,.85)" : "rgba(214,40,40,.9)", 3 / cam.s, edible ? null : [8, 6]);
      if (tagged) {
        ctx.fillStyle = "#3a8fd8"; ctx.font = "bold " + Math.max(14, g.r * 0.5) + "px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("Y", g.x + g.r * 0.72, g.y - g.r * 0.62);
      }
    });

    bits.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.29); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Mac: squashes when he gulps, blinks when he has been hurt
    var flashing = elapsed < hurtUntil && Math.floor(elapsed * 10) % 2 === 0;
    var stretch = 1 + mac.gulp * 0.16;
    ctx.save();
    ctx.translate(mac.x, mac.y); ctx.scale(stretch, 2 - stretch);
    ctx.globalAlpha = flashing ? 0.45 : 1;
    sprite("mac", 0, 0, mac.r);
    ctx.restore();
    if (tagged) ring(mac.x, mac.y, mac.r * 1.2, "rgba(58,143,216,.8)", 4 / cam.s, [10, 8]);

    floats.forEach(function (f) {
      ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.c; ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 3 / cam.s;
      ctx.font = "800 " + 22 / cam.s + "px sans-serif"; ctx.textAlign = "center";
      ctx.strokeText(f.t, f.x, f.y); ctx.fillText(f.t, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    // shows where Mac is headed
    if (target) {
      ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(target.x, target.y, 14, 0, 6.29); ctx.stroke(); ctx.restore();
    }

    // arrow to the closest germ Mac can eat, when none is on screen
    var best = null, bestD = 1e9;
    germs.forEach(function (g) {
      if (!canEat(g)) return;
      var d = Math.hypot(g.x - mac.x, g.y - mac.y);
      if (d < bestD) { bestD = d; best = g; }
    });
    if (best) {
      var gx = (best.x - cam.x) * cam.s + W / 2, gy = (best.y - cam.y) * cam.s + H / 2;
      if (gx < 0 || gx > W || gy < 0 || gy > H) {
        var ang = Math.atan2(gy - H / 2, gx - W / 2), rad = Math.min(W, H) / 2 - 26;
        ctx.save(); ctx.translate(W / 2 + Math.cos(ang) * rad, H / 2 + Math.sin(ang) * rad); ctx.rotate(ang);
        ctx.fillStyle = "rgba(36,150,80,.9)"; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-9, -10); ctx.lineTo(-9, 10); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
  }
  function drawIdle() {
    if (running || !W) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#ffd9c7"); grd.addColorStop(1, "#ff9a84");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
  }

  /* ---- Loop ---- */
  function frame(t) {
    raf = null;
    if (!running) return;
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    if (!paused) { step(dt); if (running) draw(); }
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() {
    newGame();
    running = true; paused = false;
    startPanel.hidden = true; endPanel.hidden = true;
    root.classList.add("playing");
    document.documentElement.classList.add("gg-lock");
    resize();
    hud();
    sayEl.textContent = "Steer Mac to the germs with a green ring. Run from the red ones!";
    sayUntil = 4;
    last = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function stopPlaying() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    root.classList.remove("playing");
    document.documentElement.classList.remove("gg-lock");
    target = null; keys = {};
    resize();
  }

  function end(won) {
    stopPlaying();
    var best = score;
    try { best = Math.max(score, parseInt(localStorage.getItem("vj-gulp-best"), 10) || 0); localStorage.setItem("vj-gulp-best", best); } catch (e) {}
    endPanel.querySelector(".gg-final").textContent = won ? "Sam's knee is all better!" : "The germs took over!";
    endPanel.querySelector(".gg-verdict").textContent = won
      ? "You and the Immune Team cleared the infection. Great gulping!"
      : "Germs multiply fast. Try swallowing the small ones early, before they pile up.";
    endPanel.querySelector(".gg-best").textContent = "Score " + score + " · Best " + best + " · Mac grew to " + Math.round(mac.r / START_R * 10) / 10 + "x";
    endPanel.hidden = false;
    endPanel.querySelector(".gg-again").focus({ preventScroll: true });
    buzz(won ? [30, 50, 30, 50, 60] : 60);
  }

  /* ---- Controls ---- */
  function aim(e) {
    var box = canvas.getBoundingClientRect();
    target = { x: e.clientX - box.left, y: e.clientY - box.top };
  }
  function aimAt(x, y) {
    var box = canvas.getBoundingClientRect();
    target = { x: x - box.left, y: y - box.top };
  }
  canvas.addEventListener("pointerdown", function (e) {
    if (!running) return;
    e.preventDefault();
    if (e.pointerType !== "mouse" && canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }
    aimAt(e.clientX, e.clientY);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (running && (e.pointerType === "mouse" || e.buttons || e.pressure > 0)) aimAt(e.clientX, e.clientY);
  });
  // touch: Mac keeps swimming the way you last pointed after the finger lifts, so a quick tap works too
  function onTouch(e) {
    if (!running || !e.touches.length) return;
    e.preventDefault();
    aimAt(e.touches[0].clientX, e.touches[0].clientY);
  }
  canvas.addEventListener("touchstart", onTouch, { passive: false });
  canvas.addEventListener("touchmove", onTouch, { passive: false });

  var KEYMAP = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
  // capture phase, so playing with the arrow keys doesn't flip the book pages or scroll the page
  document.addEventListener("keydown", function (e) {
    if (!running || !KEYMAP[e.key] || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    keys[KEYMAP[e.key]] = true; e.preventDefault(); e.stopPropagation();
  }, true);
  document.addEventListener("keyup", function (e) { if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; }, true);

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    last = performance.now();
  });

  root.querySelector(".gg-go").addEventListener("click", start);
  root.querySelector(".gg-again").addEventListener("click", start);
  root.querySelector(".gg-quit").addEventListener("click", function () {
    stopPlaying();
    startPanel.hidden = false; endPanel.hidden = true;
  });

  // share with a teacher: native share sheet on phones, email elsewhere
  root.querySelector(".gg-share").addEventListener("click", function () {
    var url = "https://www.vishaljohn.com/book";
    var text = "Mac's Big Gulp: a free immune system game for kids, from the book The Brave Little Immune Team.";
    if (navigator.share) { navigator.share({ title: "Mac's Big Gulp", text: text, url: url }).catch(function () {}); return; }
    location.href = "mailto:?subject=" + encodeURIComponent("A free immune system game for your class") + "&body=" + encodeURIComponent(text + "\n\n" + url);
  });

  resize();

  // character cards: little hello wiggle on the doodle when flipped
  Array.prototype.forEach.call(document.querySelectorAll(".character-card"), function (card) {
    card.addEventListener("click", function () {
      var d = card.querySelector(".char-doodle");
      if (!d) return;
      d.classList.remove("wiggle"); void d.getBoundingClientRect(); d.classList.add("wiggle");
    });
  });
})();
