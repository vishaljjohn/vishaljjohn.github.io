/* Play buttons for the recently played lists: 30-second samples from Apple's
   free search API (Spotify no longer offers previews). Songs without a sample
   open on Spotify instead. Lookups run ahead of the tap because phones only
   allow audio and new tabs straight from a tap. */
(function () {
  var found = {};   // "name|artist" -> promise of a sample url ('' if none)
  var audio = null, playing = '';

  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  // "Song (feat. X) - Remastered 2011" -> "Song"
  function title(s) { return String(s || '').replace(/\s*[(\[].*$/, '').replace(/\s+-\s+.*$/, ''); }
  function close(a, b) { a = norm(a); b = norm(b); return !!a && !!b && (a.indexOf(b) !== -1 || b.indexOf(a) !== -1); }

  function lookup(name, artist) {
    var key = name + '|' + artist;
    if (!found[key]) {
      found[key] = fetch('https://itunes.apple.com/search?entity=song&limit=10&country=US&term=' + encodeURIComponent(title(name) + ' ' + artist))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var hit = (d.results || []).filter(function (r) {
            return r.previewUrl && close(title(r.trackName), title(name)) && close(r.artistName, artist);
          })[0];
          return hit ? hit.previewUrl : '';
        })
        .catch(function () { return ''; });
    }
    return found[key];
  }

  function paint() {
    Array.prototype.forEach.call(document.querySelectorAll('.sp-play'), function (b) {
      var on = !!playing && b.dataset.key === playing;
      b.classList.toggle('on', on);
      b.querySelector('i').className = 'fas ' + (on ? 'fa-pause' : b.dataset.url ? 'fa-play' : 'fa-external-link-alt');
      b.setAttribute('aria-label', (on ? 'Pause ' : b.dataset.url ? 'Play a sample of ' : 'Open on Spotify: ') + b.dataset.label);
    });
  }

  function stop() {
    if (audio) audio.pause();
    playing = '';
    paint();
  }

  function button(name, artist, spotifyUrl) {
    var key = name + '|' + artist;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sp-play';
    b.dataset.key = key; b.dataset.label = name + ' by ' + artist; b.dataset.url = '';
    b.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
    lookup(name, artist).then(function (url) { b.dataset.url = url; paint(); });
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (!b.dataset.url) { window.open(spotifyUrl, '_blank', 'noopener'); return; }
      if (playing === key) { stop(); return; }
      if (!audio) { audio = new Audio(); audio.addEventListener('ended', stop); }
      audio.src = b.dataset.url;
      playing = key; paint();
      var p = audio.play();
      if (p && p.catch) p.catch(function () { if (playing === key) stop(); });
    });
    return b;
  }

  window.spPreview = { button: button, stop: stop, paint: paint };
})();
