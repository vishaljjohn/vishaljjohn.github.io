/* Germ Patrol: the Immune Team game on the children's book page.
   Tap germs before they get away, and leave the body's own cells alone. */
(function () {
  "use strict";
  var root = document.getElementById("germGame");
  if (!root) return;

  var SPRITE = "../assets/doodles.svg#";
  var ROUND = 30, START_LIVES = 5;
  var GERMS = ["germ-green", "germ-blue", "germ-purple", "germ-orange"];
  var TEAM = {
    mac:  { name: "Mac", power: "Macrophage: swallows germs whole. Every germ is worth 2 points.", line: "Gulp! That's what macrophages do: they swallow germs." },
    bbee: { name: "B-Bee", power: "B-Cell: antibodies slow germs down, so they hang around longer.", line: "Antibodies stick to germs like tiny tags and slow them down." },
    tia:  { name: "Tia", power: "T-Cell: every 5 germs, she radios the team to clear the screen.", line: "T-cells coordinate the team. Calling in backup!" }
  };
  var FACTS = [
    "Your body makes billions of new immune cells every day.",
    "Fevers help: many germs don't like the heat.",
    "Memory T-cells remember germs so your body fights faster next time.",
    "Lymph nodes are like lookout posts for your immune system.",
    "Washing your hands stops germs before the team even has to fight."
  ];

  var stage = root.querySelector(".gg-stage"), field = root.querySelector(".gg-field");
  var startPanel = root.querySelector(".gg-start"), endPanel = root.querySelector(".gg-end");
  var scoreEl = root.querySelector(".gg-score"), timeEl = root.querySelector(".gg-time"), livesEl = root.querySelector(".gg-lives");
  var sayEl = root.querySelector(".gg-say"), helperEl = root.querySelector(".gg-helper use");

  var who = "mac", score = 0, lives = START_LIVES, left = ROUND, zaps = 0, running = false;
  var spawnTimer = null, clock = null, sayTimer = null, id = 0;

  function buzz(ms) { if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }
  function say(text) {
    sayEl.textContent = text;
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { if (running) sayEl.textContent = FACTS[Math.floor(Math.random() * FACTS.length)]; }, 2600);
  }
  function hud() {
    scoreEl.textContent = score;
    timeEl.textContent = left;
    livesEl.textContent = "";
    livesEl.setAttribute("aria-label", lives + " lives left");
    for (var i = 0; i < START_LIVES; i++) {
      var s = document.createElement("span");
      s.className = "gg-heart" + (i < lives ? "" : " lost");
      s.setAttribute("aria-hidden", "true");
      s.textContent = "♥";
      livesEl.appendChild(s);
    }
  }

  function spawn() {
    if (!running) return;
    var own = Math.random() < 0.17;
    var kind = own ? "own-cell" : GERMS[Math.floor(Math.random() * GERMS.length)];
    var b = document.createElement("button");
    b.type = "button";
    b.className = "gg-thing" + (own ? " own" : "");
    b.setAttribute("aria-label", own ? "Your own healthy cell, leave it alone" : "Germ, tap to catch it");
    b.style.left = (4 + Math.random() * 78) + "%";
    b.style.top = (6 + Math.random() * 70) + "%";
    b.innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true"><use href="' + SPRITE + kind + '"/></svg>';
    b.dataset.id = ++id;
    var elapsed = ROUND - left;
    var life = Math.max(1050, 2000 - elapsed * 28) * (who === "bbee" ? 1.35 : 1);
    var gone = setTimeout(function () {
      if (!b.parentNode) return;
      b.remove();
      if (!own && running) {
        lives--; hud();
        say("A germ got away! Keep watching.");
        if (lives <= 0) end();
      }
    }, life);
    b._gone = gone;
    b.addEventListener("pointerdown", function (e) { e.preventDefault(); tap(b, own); });
    b.addEventListener("click", function () { tap(b, own); });  // keyboard
    field.appendChild(b);
  }

  function pop(b, label, cls) {
    clearTimeout(b._gone);
    b.disabled = true;
    b.classList.add("zapped");
    var t = document.createElement("span");
    t.className = "gg-float " + (cls || "");
    t.textContent = label;
    t.style.left = b.style.left; t.style.top = b.style.top;
    field.appendChild(t);
    setTimeout(function () { b.remove(); t.remove(); }, 450);
  }

  function tap(b, own) {
    if (!running || b.disabled) return;
    if (own) {
      score = Math.max(0, score - 1);
      pop(b, "Oops!", "bad");
      say("That's one of your own cells! The team protects those.");
      buzz([20, 40, 20]);
    } else {
      var pts = who === "mac" ? 2 : 1;
      score += pts; zaps++;
      pop(b, "+" + pts);
      buzz(10);
      if (zaps % 6 === 1) say(TEAM[who].line);
      if (who === "tia" && zaps % 5 === 0) backup();
    }
    hud();
  }

  function backup() {
    say("Tia called in backup! Screen cleared.");
    Array.prototype.forEach.call(field.querySelectorAll(".gg-thing:not(.own):not(.zapped)"), function (g) {
      score += 1; zaps++;
      pop(g, "+1");
    });
    buzz(30);
    hud();
  }

  function tickSpawn() {
    if (!running) return;
    spawn();
    var elapsed = ROUND - left;
    spawnTimer = setTimeout(tickSpawn, Math.max(430, 950 - elapsed * 18));
  }

  function start(choice) {
    who = choice || who;
    score = 0; lives = START_LIVES; left = ROUND; zaps = 0; running = true;
    field.textContent = "";
    helperEl.setAttribute("href", SPRITE + who);
    startPanel.hidden = true; endPanel.hidden = true;
    root.classList.add("playing");
    hud();
    say(TEAM[who].power);
    tickSpawn();
    clock = setInterval(function () {
      left--; hud();
      if (left <= 0) end();
    }, 1000);
  }

  function end() {
    running = false;
    clearInterval(clock); clearTimeout(spawnTimer);
    Array.prototype.forEach.call(field.querySelectorAll(".gg-thing"), function (g) { clearTimeout(g._gone); g.remove(); });
    root.classList.remove("playing");
    var best = 0;
    try { best = Math.max(score, parseInt(localStorage.getItem("vj-germ-best"), 10) || 0); localStorage.setItem("vj-germ-best", best); } catch (e) { best = score; }
    endPanel.querySelector(".gg-final").textContent = score;
    endPanel.querySelector(".gg-best").textContent = "Best: " + best;
    endPanel.querySelector(".gg-verdict").textContent = lives <= 0
      ? "The germs got past the team this time. Try again!"
      : score >= 30 ? "Amazing! Sam's knee is all better thanks to you." : "Nice work! The team kept Sam safe.";
    endPanel.hidden = false;
    endPanel.querySelector(".gg-again").focus({ preventScroll: true });
    buzz(40);
  }

  // pause rather than let germs escape while the tab is hidden
  document.addEventListener("visibilitychange", function () { if (document.hidden && running) end(); });

  Array.prototype.forEach.call(root.querySelectorAll(".gg-pick"), function (b) {
    b.addEventListener("click", function () { start(b.dataset.who); });
  });
  root.querySelector(".gg-again").addEventListener("click", function () { endPanel.hidden = true; startPanel.hidden = false; });

  // share with a teacher: native share sheet on phones, email elsewhere
  var shareBtn = root.querySelector(".gg-share");
  shareBtn.addEventListener("click", function () {
    var url = "https://www.vishaljohn.com/book";
    var text = "Germ Patrol: a free immune system game for kids ages 4-8, from the book The Brave Little Immune Team.";
    if (navigator.share) { navigator.share({ title: "Germ Patrol", text: text, url: url }).catch(function () {}); return; }
    location.href = "mailto:?subject=" + encodeURIComponent("A free immune system game for your class") + "&body=" + encodeURIComponent(text + "\n\n" + url);
  });

  hud();

  // character cards: little hello wiggle on the doodle when flipped
  Array.prototype.forEach.call(document.querySelectorAll(".character-card"), function (card) {
    card.addEventListener("click", function () {
      var d = card.querySelector(".char-doodle");
      if (!d) return;
      d.classList.remove("wiggle"); void d.getBoundingClientRect(); d.classList.add("wiggle");
    });
  });
})();
