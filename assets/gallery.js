/* Reusable 3D spin-carousel gallery.
   Auto-initialises every .spin-gallery on the page.
   Click any photo to enlarge it in a shared lightbox.
   Markup expected:
   <div class="spin-gallery">
     <div class="spin-stage"><div class="spin-ring">
        <div class="spin-card" data-caption="..."><img src="..." alt="..."></div> ...
     </div></div>
     <div class="spin-caption"></div>
     <p class="spin-hint">Drag to spin &middot; click a photo to enlarge</p>
     <div class="spin-controls">
        <button class="spin-btn spin-prev" aria-label="Previous">&#8249;</button>
        <button class="spin-btn spin-next" aria-label="Next">&#8250;</button>
     </div>
   </div>
*/
(function () {

  /* ---------- Shared lightbox (one per page, used by every carousel) ---------- */
  var lb = null;
  function ensureLightbox() {
    if (lb) return lb;
    var overlay = document.createElement('div');
    overlay.className = 'spin-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<button class="spin-lb-close" aria-label="Close">&times;</button>' +
      '<img class="spin-lb-img" alt="">' +
      '<div class="spin-lb-caption"></div>';
    document.body.appendChild(overlay);

    var img = overlay.querySelector('.spin-lb-img');
    var cap = overlay.querySelector('.spin-lb-caption');
    var closeBtn = overlay.querySelector('.spin-lb-close');

    function close() { overlay.classList.remove('open'); }
    // Close on backdrop click, but not when clicking the image itself.
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    lb = {
      open: function (src, alt, caption) {
        img.src = src;
        img.alt = alt || caption || '';
        cap.textContent = caption || '';
        cap.style.display = caption ? '' : 'none';
        overlay.classList.add('open');
      }
    };
    return lb;
  }

  /* ---------- A single carousel ---------- */
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

    function captionOf(card) {
      return card.getAttribute('data-caption') || (card.querySelector('img') ? card.querySelector('img').alt : '') || '';
    }
    function enlarge(card) {
      var im = card.querySelector('img');
      if (im) ensureLightbox().open(im.currentSrc || im.src, im.alt, captionOf(card));
    }

    // With a single image there is nothing to spin: show it flat but still clickable.
    if (n === 1) {
      cards[0].style.transform = 'none';
      ring.style.transform = 'none';
      if (captionEl) captionEl.textContent = captionOf(cards[0]);
      var hint1 = gallery.querySelector('.spin-hint');
      var ctrls1 = gallery.querySelector('.spin-controls');
      if (hint1) hint1.textContent = 'Click the photo to enlarge';
      if (ctrls1) ctrls1.style.display = 'none';
      cards[0].addEventListener('click', function () { enlarge(cards[0]); });
      return;
    }

    var theta = 360 / n;
    var radius = (n === 2) ? 200 : Math.round(120 / Math.tan(Math.PI / n)) + 40;
    var angle = 0;
    var dragging = false, lastX = 0, downX = 0, moved = false;
    var autoTimer = null, idleTimer = null;

    cards.forEach(function (card, i) {
      card.style.transform = 'rotateY(' + (i * theta) + 'deg) translateZ(' + radius + 'px)';
      card.addEventListener('click', function () {
        if (moved) return;            // was a drag, not a click
        var fi = frontIndex();
        if (i === fi) enlarge(card);  // front card -> enlarge
        else { stopAuto(); ring.style.transition = 'transform 0.5s ease-out'; angle += (fi - i) * theta; update(); restartIdle(); } // side card -> bring to front
      });
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
      if (captionEl) captionEl.textContent = captionOf(cards[fi]);
    }
    function snap() { angle = Math.round(angle / theta) * theta; ring.style.transition = 'transform 0.5s ease-out'; update(); }
    function step(dir) { stopAuto(); ring.style.transition = 'transform 0.5s ease-out'; angle += -dir * theta; update(); restartIdle(); }

    function startAuto() { if (autoTimer) return; autoTimer = setInterval(function () { ring.style.transition = 'transform 0.9s linear'; angle -= theta; update(); }, 2600); }
    function stopAuto() { clearInterval(autoTimer); autoTimer = null; }
    function restartIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(startAuto, 4000); }

    function onDown(e) { dragging = true; moved = false; downX = lastX = (e.touches ? e.touches[0].clientX : e.clientX); ring.style.transition = 'none'; stopAuto(); stage.classList.add('grabbing'); }
    function onMove(e) { if (!dragging) return; var x = (e.touches ? e.touches[0].clientX : e.clientX); var dx = x - lastX; lastX = x; if (Math.abs(x - downX) > 6) moved = true; angle += dx * 0.4; update(); }
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
