/* Reusable 3D spin-carousel gallery.
   Auto-initialises every .spin-gallery on the page.
   Markup expected:
   <div class="spin-gallery">
     <div class="spin-stage"><div class="spin-ring">
        <div class="spin-card" data-caption="..."><img src="..." alt="..."></div> ...
     </div></div>
     <div class="spin-caption"></div>
     <p class="spin-hint">Drag to spin &middot; or use the arrows</p>
     <div class="spin-controls">
        <button class="spin-btn spin-prev" aria-label="Previous">&#8249;</button>
        <button class="spin-btn spin-next" aria-label="Next">&#8250;</button>
     </div>
   </div>
*/
(function () {
  function initGallery(gallery) {
    var stage = gallery.querySelector('.spin-stage');
    var ring = gallery.querySelector('.spin-ring');
    var captionEl = gallery.querySelector('.spin-caption');
    var prevBtn = gallery.querySelector('.spin-prev');
    var nextBtn = gallery.querySelector('.spin-next');
    if (!stage || !ring) return;

    var cards = Array.prototype.slice.call(ring.querySelectorAll('.spin-card'));
    var n = cards.length;
    if (n < 1) return;

    // With a single image there is nothing to spin: just show it flat.
    if (n === 1) {
      cards[0].style.transform = 'none';
      ring.style.transform = 'none';
      if (captionEl) captionEl.textContent = cards[0].getAttribute('data-caption') || '';
      var hint = gallery.querySelector('.spin-hint');
      var ctrls = gallery.querySelector('.spin-controls');
      if (hint) hint.style.display = 'none';
      if (ctrls) ctrls.style.display = 'none';
      return;
    }

    var theta = 360 / n;
    var radius = (n === 2) ? 200 : Math.round(120 / Math.tan(Math.PI / n)) + 40;
    var angle = 0;
    var dragging = false, lastX = 0;
    var autoTimer = null, idleTimer = null;

    cards.forEach(function (card, i) {
      card.style.transform = 'rotateY(' + (i * theta) + 'deg) translateZ(' + radius + 'px)';
    });

    function frontIndex() {
      var idx = Math.round(-angle / theta) % n;
      if (idx < 0) idx += n;
      return idx;
    }
    function update() {
      ring.style.transform = 'translateZ(-' + radius + 'px) rotateY(' + angle + 'deg)';
      var fi = frontIndex();
      cards.forEach(function (c, i) { c.classList.toggle('dim', i !== fi); });
      if (captionEl) captionEl.textContent = cards[fi].getAttribute('data-caption') || '';
    }
    function snap() { angle = Math.round(angle / theta) * theta; ring.style.transition = 'transform 0.5s ease-out'; update(); }
    function step(dir) { stopAuto(); ring.style.transition = 'transform 0.5s ease-out'; angle += -dir * theta; update(); restartIdle(); }

    function startAuto() { if (autoTimer) return; autoTimer = setInterval(function () { ring.style.transition = 'transform 0.9s linear'; angle -= theta; update(); }, 2600); }
    function stopAuto() { clearInterval(autoTimer); autoTimer = null; }
    function restartIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(startAuto, 4000); }

    function onDown(e) { dragging = true; lastX = (e.touches ? e.touches[0].clientX : e.clientX); ring.style.transition = 'none'; stopAuto(); stage.classList.add('grabbing'); }
    function onMove(e) { if (!dragging) return; var x = (e.touches ? e.touches[0].clientX : e.clientX); var dx = x - lastX; lastX = x; angle += dx * 0.4; update(); }
    function onUp() { if (!dragging) return; dragging = false; stage.classList.remove('grabbing'); snap(); restartIdle(); }

    stage.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    stage.addEventListener('touchstart', onDown, { passive: true });
    stage.addEventListener('touchmove', onMove, { passive: true });
    stage.addEventListener('touchend', onUp);

    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

    // Pause auto-rotate when the page/tab is hidden or motion is reduced.
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopAuto(); });

    update();
    if (!reduceMotion) restartIdle();
  }

  function initAll() {
    var galleries = document.querySelectorAll('.spin-gallery');
    Array.prototype.forEach.call(galleries, initGallery);
  }

  if (document.readyState !== 'loading') initAll();
  else document.addEventListener('DOMContentLoaded', initAll);
})();
