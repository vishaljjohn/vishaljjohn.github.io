/* Dark-mode toggle. Pairs with the early no-flash snippet in each page <head>:
   <script>(function(){try{if(localStorage.getItem('vj-theme')==='dark')
   document.documentElement.classList.add('dark');}catch(e){}})();</script>
   Light is the default; dark only applies when the visitor has toggled it.
   This file adds the floating toggle button and handles clicks. */
(function () {
  var SUN = '☀︎';   // shown when in dark mode (click -> go light)
  var MOON = '☾';        // shown when in light mode (click -> go dark)

  function isDark() { return document.documentElement.classList.contains('dark'); }

  function build() {
    if (document.querySelector('.vj-theme-toggle')) return;
    var btn = document.createElement('button');
    btn.className = 'vj-theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    function sync() {
      var dark = isDark();
      btn.textContent = dark ? SUN : MOON;
      btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    }
    btn.addEventListener('click', function () {
      var dark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('vj-theme', dark ? 'dark' : 'light'); } catch (e) {}
      sync();
    });
    document.body.appendChild(btn);
    sync();
  }

  if (document.readyState !== 'loading') build();
  else document.addEventListener('DOMContentLoaded', build);
})();
