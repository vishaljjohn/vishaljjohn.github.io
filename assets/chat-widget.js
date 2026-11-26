/* =========================================================================
   Vishal John — site-wide AI chat widget
   Drops a floating "ask me anything" button + chat panel on any page.
   Uses the Cloudflare Worker AI endpoint, with offline keyword fallback.
   Include with:  <script src="assets/chat-widget.js" defer></script>
   (use ../assets/chat-widget.js from pages in a subfolder)
   ========================================================================= */
(function () {
  "use strict";
  if (window.__vjChat) return; window.__vjChat = true;

  var AI_ENDPOINT = "https://vishal-chat.vishaljjohn.workers.dev";

  /* ---- Instant fun replies (jokes, balloon animals, fun facts): assets/chat-fun.js ---- */
  var ME = document.currentScript;
  var BASE = ME && ME.src ? ME.src.replace(/chat-widget\.js(\?.*)?$/, '') : '/assets/';
  if (!window.VJFun) { var funS = document.createElement('script'); funS.src = BASE + 'chat-fun.js'; funS.defer = true; document.head.appendChild(funS); }

  /* ---- Offline fallback knowledge (used if the AI is unreachable) ---- */
  var KB = [
    { k: ['who are you','about you','yourself','your name','what do you do'],
      a: "i'm Vishal John — an M3 medical student at the University of Louisville, plus a children's book author, balloon animal artist, and aspiring coffee shop owner." },
    { k: ['school','med school','medical','student','uofl','louisville','michigan','study'],
      a: "i'm a 3rd-year (M3) med student at the University of Louisville School of Medicine; i did my undergrad at the University of Michigan." },
    { k: ['book','children','author','immune','buy','amazon'],
      a: "i co-wrote a kids' book, \"The Brave Little Immune Team,\" for ages 4-8. you can grab it on <a href='https://www.amazon.com/Brave-Little-Immune-Team/dp/B0GVC5R915' target='_blank' rel='noopener'>Amazon</a>." },
    { k: ['balloon','animals','twist'],
      a: "balloon animals are my favorite party trick: dogs, monkeys, flowers, you name it." },
    { k: ['coffee','cafe','shop'],
      a: "one day i'd love to open a cozy little coffee shop." },
    { k: ['research','lab','koschmann','mircore','science','rna','organoid'],
      a: "i've done research in the Koschmann Lab (pediatric brain cancer) and led bioinformatics work at miRcore. ask me about either!" },
    { k: ['publication','paper','scholar'],
      a: "i've contributed to 6 publications — see them on my <a href='https://scholar.google.com/citations?user=QXyjTGgAAAAJ' target='_blank' rel='noopener'>Google Scholar</a>." },
    { k: ['rock cancer','climb'],
      a: "i'm on the leadership team of Rock Cancer — free rock climbing for young cancer survivors." },
    { k: ['volunteer','service','community','elder life','help program','breakfast','andrew'],
      a: "i'm on the board of Rock Cancer, and in Ann Arbor i volunteered with Saint Andrew's Breakfast Program and the Hospital Elder Life Program (HELP) until 2024." },
    { k: ['coding','code','github','program','tool','block sim','blocksim','anki add','extension','software'],
      a: "i build free study tools for med school, like Test Simulator (board-style practice exams from your own PDFs) and Anki add-ons. see my <a href='/pages/codingprojects.html'>Coding Projects &amp; Tools</a> page." },
    { k: ['cook','recipe','food','chef','thai','kitchen','bake'],
      a: "i love to cook! i started as a kid, making meals for my sister and me while our parents were at work. if i couldn't do medicine, i'd 100% be a hibachi chef. my <a href='/pages/cookbook.html'>recipes</a> page has my go-to dishes, family recipes, and the thai food i learned at a cooking class in thailand." },
    { k: ['guestbook','guest book','sticky note','leave a note','sign your','pin a note'],
      a: "i'd love that! <a href='/pages/guestbook.html'>leave me a note</a> on my sticky-note wall: where you're from, how we met, or just hi." },
    { k: ['contact','email','reach','hire','message','collaborat','work together'],
      a: "the best way to reach me is my Contact page — i'd love to hear from you." },
    { k: ['link','social','linkedin','github','medium','online'],
      a: "you can find me on <a href='https://www.linkedin.com/in/vishaljjohn/' target='_blank' rel='noopener'>LinkedIn</a>, <a href='https://github.com/vishaljjohn' target='_blank' rel='noopener'>GitHub</a>, and <a href='https://medium.com/@vishaljjohn' target='_blank' rel='noopener'>Medium</a>." },
    { k: ['hi','hey','hello','yo','howdy'],
      a: "hey! great to see you. ask me anything: my research, the kids' book, balloon animals, or how to reach me." },
    { k: ['thank','thanks'],
      a: "anytime! tell your friends i'm hilarious." },
    { k: ['bye','goodbye','later'],
      a: "bye! go drink some water. that's the only medical advice i'm allowed to give." }
  ];
  var FALLBACK = "ooh, that one stumped me, and i've survived organic chemistry. send it through my <a href='/pages/contact.html'>Contact page</a> and the real me will answer. or ask me for a joke, a balloon animal, or a fun fact.";

  function kbReply(text) {
    var q = ' ' + text.toLowerCase().replace(/[^a-z0-9.@ ]/g, ' ') + ' ';
    for (var i = 0; i < KB.length; i++)
      for (var j = 0; j < KB[i].k.length; j++)
        if (KB[i].k[j].length <= 3 ? q.indexOf(' ' + KB[i].k[j] + ' ') !== -1 : q.indexOf(KB[i].k[j]) !== -1) return KB[i].a;
    return FALLBACK;
  }

  /* ---- Styles (scoped with vjw- prefix) ---- */
  var css = ''
   + '.vjw-launch{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;border:none;'
   + 'background:rgba(10,109,176,0.88);color:#fff;cursor:pointer;z-index:2147483000;display:flex;align-items:center;'
   + 'justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,0.28);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);'
   + 'opacity:0.85;transition:opacity .2s,transform .2s;}'
   + '.vjw-launch:hover{opacity:1;transform:translateY(-2px);}'
   + '.vjw-launch svg{width:26px;height:26px;}'
   // sits above the chat button so it never covers the "Video call" pill to its left
   + '.vjw-tip{position:fixed;right:20px;bottom:88px;background:#15171b;color:#fff;font-size:13px;padding:8px 12px;'
   + 'border-radius:10px;z-index:2147483000;box-shadow:0 6px 18px rgba(0,0,0,.25);max-width:200px;'
   + 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;}'
   + '.vjw-tip:after{content:"";position:absolute;right:22px;bottom:-6px;border:6px solid transparent;border-bottom:0;border-top-color:#15171b;}'
   + '.vjw-panel{position:fixed;right:20px;bottom:88px;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 120px);'
   + 'background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.30);z-index:2147483000;display:none;flex-direction:column;'
   + 'overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;}'
   + '.vjw-panel.open{display:flex;animation:vjwpop .2s ease;}'
   + '@keyframes vjwpop{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}'
   + '.vjw-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:#0a6db0;color:#fff;}'
   + '.vjw-ava{width:34px;height:34px;border-radius:50%;background:#fff;color:#0a6db0;font-weight:800;font-size:14px;'
   + 'display:flex;align-items:center;justify-content:center;flex-shrink:0;}'
   + '.vjw-ava .h{color:#e5484d;font-size:11px;}'
   + '.vjw-name{font-weight:700;font-size:15px;line-height:1.1;}'
   + '.vjw-status{font-size:11px;opacity:.9;display:flex;align-items:center;gap:5px;white-space:nowrap;}'
   + '.vjw-dot{width:6px;height:6px;border-radius:50%;background:#5ee0a0;display:inline-block;}'
   + '.vjw-x{margin-left:auto;background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;opacity:.9;}'
   + '.vjw-thread{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f6f7f9;}'
   + '.vjw-b{max-width:85%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;}'
   + '.vjw-b.bot{align-self:flex-start;background:#fff;color:#222;border:1px solid #ececec;border-bottom-left-radius:4px;}'
   + '.vjw-b.me{align-self:flex-end;background:#0a6db0;color:#fff;border-bottom-right-radius:4px;}'
   + '.vjw-b a{color:#0a6db0;}.vjw-b.me a{color:#dff0ff;}'
   + '.vjw-typing{display:inline-flex;gap:4px;padding:4px 0;}'
   + '.vjw-typing span{width:7px;height:7px;border-radius:50%;background:#bbb;animation:vjwblink 1.2s infinite both;}'
   + '.vjw-typing span:nth-child(2){animation-delay:.2s;}.vjw-typing span:nth-child(3){animation-delay:.4s;}'
   + '@keyframes vjwblink{0%,80%,100%{opacity:.25;}40%{opacity:1;}}'
   + '.vjw-input{display:flex;gap:8px;padding:12px;border-top:1px solid #eee;background:#fff;}'
   + '.vjw-field{flex:1;min-width:0;border:1px solid #d8dadf;border-radius:22px;padding:10px 14px;font-size:16px;outline:none;}'
   + '.vjw-field:focus{border-color:#0a6db0;}'
   + '.vjw-send{width:40px;height:40px;flex-shrink:0;border:none;border-radius:50%;background:#0a6db0;color:#fff;cursor:pointer;font-size:16px;}'
   + '.vjw-send:disabled{opacity:.5;}'
   + '.vjw-chips{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:100%;}'
   + '.vjw-chip{border:1.5px solid #0a6db0;background:#fff;color:#0a5a92;border-radius:999px;padding:8px 12px;font:600 13px/1.1 -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;cursor:pointer;min-height:36px;}'
   + '@media (hover:hover){.vjw-chip:hover{background:#0a6db0;color:#fff;}}'
   + '.vjw-new{background:#074a7a;border:1px solid rgba(255,255,255,.55);color:#fff;border-radius:999px;font:600 12px/1 -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;padding:7px 10px;cursor:pointer;margin-left:auto;}'
   + '.vjw-new + .vjw-x{margin-left:4px;}'
   + '.vjw-new{white-space:nowrap;flex-shrink:0;}'
   + '@media (max-width:360px){.vjw-new{padding:6px 8px;font-size:11px;}}'
   + '.vjw-panel :focus-visible{outline:3px solid #6cb6ff;outline-offset:2px;}'
   + 'html.dark .vjw-panel{background:#161a20;}html.dark .vjw-thread{background:#0f1216;}'
   + 'html.dark .vjw-b.bot{background:#1d232b;color:#e6e9ee;border-color:#2a313c;}html.dark .vjw-b a{color:#8cc8ff;}'
   + 'html.dark .vjw-input{background:#161a20;border-color:#2a313c;}html.dark .vjw-field{background:#0f1216;color:#e6e9ee;border-color:#3a4250;}'
   + 'html.dark .vjw-chip{background:#161a20;color:#9fd0ff;border-color:#3d8fd6;}@media (hover:hover){html.dark .vjw-chip:hover{background:#1f6fb3;color:#fff;}}'
   + '@media (prefers-reduced-motion:reduce){.vjw-panel.open{animation:none;}.vjw-typing span{animation:none;opacity:.6;}.vjw-launch{transition:none;}}'
   + '.vjw-call{position:fixed;right:88px;bottom:25px;z-index:2147483000;display:flex;align-items:center;gap:7px;background:#0a6db0;color:#fff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;font-weight:700;font-size:13px;height:46px;padding:0 16px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,0.28);}'
   + '.vjw-call:hover{background:#085a93;}'
   + '.vjw-call svg{width:18px;height:18px;}'
   + '@media (max-width:480px){.vjw-panel{right:12px;bottom:80px;height:70vh;}.vjw-launch{right:14px;bottom:14px;}.vjw-call{right:19px;bottom:80px;width:46px;height:46px;padding:0;justify-content:center;border-radius:50%;}.vjw-call-t{display:none;}.vjw-tip{display:none !important;}}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  /* ---- DOM ---- */
  var launch = document.createElement('button');
  launch.className = 'vjw-launch'; launch.setAttribute('aria-label', 'Chat with Vishal'); launch.setAttribute('aria-expanded', 'false');
  launch.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>';
  document.body.appendChild(launch);

  // root-relative so it also works on the 404 page, which GitHub serves at any missing URL
  var vcUrl = '/';
  var vcBtn = document.createElement('a');
  vcBtn.className = 'vjw-call'; vcBtn.href = vcUrl; vcBtn.setAttribute('aria-label', 'Back to video call');
  vcBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="13" height="12" rx="2"></rect><path d="M22 8l-5 4 5 4V8z"></path></svg><span class="vjw-call-t">Video call</span>';
  document.body.appendChild(vcBtn);

  var tip = document.createElement('div');
  tip.className = 'vjw-tip'; tip.style.display = 'none';
  tip.textContent = ['Hi! Ask me anything', 'psst. i can make you a balloon animal.', 'ask me for a medical pun. i dare you.', 'want a fun fact about me?'][Math.floor(Math.random() * 4)];
  document.body.appendChild(tip);

  var panel = document.createElement('div');
  panel.className = 'vjw-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Chat with Vishal John');
  panel.innerHTML =
      '<div class="vjw-head">'
    + '  <div class="vjw-ava">V<span class="h">&#9829;</span>J</div>'
    + '  <div><div class="vjw-name">Vishal John</div><div class="vjw-status"><span class="vjw-dot"></span> ask me anything</div></div>'
    + '  <button class="vjw-new" type="button" aria-label="Start a new chat">new chat</button>'
    + '  <button class="vjw-x" type="button" aria-label="Close chat">&times;</button>'
    + '</div>'
    + '<div class="vjw-thread" id="vjwThread" role="log" aria-live="polite" aria-relevant="additions"></div>'
    + '<div class="vjw-input"><input class="vjw-field" id="vjwField" type="text" autocomplete="off" placeholder="Ask me anything…" aria-label="Message Vishal"><button class="vjw-send" id="vjwSend" aria-label="Send">&#8593;</button></div>';
  document.body.appendChild(panel);

  var thread = panel.querySelector('#vjwThread');
  var field = panel.querySelector('#vjwField');
  var sendBtn = panel.querySelector('#vjwSend');
  var hist = [], greeted = false, busy = false, msgs = [], usedChips = [];

  /* the conversation follows the visitor from page to page during a visit */
  var SAVE = 'vjw-chat-v1';
  function save(){ try { sessionStorage.setItem(SAVE, JSON.stringify({ msgs: msgs.slice(-40), hist: hist.slice(-12), used: usedChips })); } catch(e){} }
  function scrollDown(){ thread.scrollTop = thread.scrollHeight; }
  function addBubble(html, me, noSave){
    var b = document.createElement('div'); b.className = 'vjw-b ' + (me ? 'me' : 'bot');
    if (me) b.textContent = html; else b.innerHTML = html;
    thread.appendChild(b); scrollDown();
    if (!noSave){ msgs.push({ h: html, me: !!me }); save(); }
    return b;
  }
  function clearChips(){ var c = thread.querySelectorAll('.vjw-chips'); for (var i = 0; i < c.length; i++) c[i].remove(); }
  function showChips(){
    clearChips();
    var lastBot = msgs.length && !msgs[msgs.length - 1].me ? strip(msgs[msgs.length - 1].h) : '';
    var list = window.VJFun ? window.VJFun.chips(usedChips, 3, lastBot, location.pathname) : [];
    if (!list.length) return;
    var wrap = document.createElement('div'); wrap.className = 'vjw-chips';
    list.forEach(function(c){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'vjw-chip'; b.textContent = c.label;
      b.addEventListener('click', function(){ usedChips.push(c.label); send(c.q); });
      wrap.appendChild(b);
    });
    thread.appendChild(wrap); scrollDown();
  }
  (function restore(){
    try {
      var st = JSON.parse(sessionStorage.getItem(SAVE) || 'null');
      if (st && st.msgs && st.msgs.length){
        msgs = st.msgs; hist = st.hist || []; usedChips = st.used || []; greeted = true;
        msgs.forEach(function(m){ addBubble(m.h, m.me, true); });
      }
    } catch(e){}
  })();
  function addTyping(){
    var t = document.createElement('div'); t.className = 'vjw-b bot'; t.id = 'vjwTyping';
    t.innerHTML = '<span class="vjw-typing"><span></span><span></span><span></span></span>';
    thread.appendChild(t); scrollDown(); return t;
  }
  function rmTyping(){ var t = document.getElementById('vjwTyping'); if (t) t.remove(); }
  function strip(s){ return String(s).replace(/<[^>]*>/g, ''); }
  function esc(s){ return s.replace(/[&<>]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]; }); }

  // keep trailing punctuation ("…here: https://x.com.") out of the link
  function linkify(s){ return esc(s).replace(/(https?:\/\/[^\s<'"]*[^\s<'".,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); }

  // Streamed reply (Server-Sent Events). Calls onToken(text) as tokens arrive.
  // Resolves to { ok:true, full } on success, { ok:false } to trigger the local fallback.
  function aiReplyStream(text, onToken){
    if (!AI_ENDPOINT) return Promise.resolve({ ok:false });
    // give up (and use the offline answers) if the first byte takes too long
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function(){ ctrl.abort(); }, 15000) : null;
    return fetch(AI_ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message:text, history: hist.slice(-6), stream:true }),
        signal: ctrl ? ctrl.signal : undefined })
      .then(function(r){
        clearTimeout(timer);
        if (!r.ok || !r.body || !r.body.getReader) return { ok:false };
        var reader = r.body.getReader(), dec = new TextDecoder(), buf = '', full = '';
        function pump(){
          // a reply that stalls partway also falls back, so the chat never stays stuck
          if (ctrl) timer = setTimeout(function(){ ctrl.abort(); }, 20000);
          return reader.read().then(function(res){
            clearTimeout(timer);
            if (res.done) return { ok:true, full:full };
            buf += dec.decode(res.value, { stream:true });
            var lines = buf.split('\n'); buf = lines.pop();
            lines.forEach(function(line){
              line = line.trim();
              if (line.indexOf('data:') !== 0) return;
              var d = line.slice(5).trim();
              if (!d || d === '[DONE]') return;
              try { var ob = JSON.parse(d); if (ob.response){ full += ob.response; onToken(ob.response); } } catch(e){}
            });
            return pump();
          });
        }
        return pump();
      })
      .catch(function(){ return { ok:false }; });
  }
  function send(text){
    text = (text||'').trim(); if (!text || busy) return;
    busy = true; sendBtn.disabled = true; clearChips();
    addBubble(text, true); hist.push({role:'user', content:text}); field.value = '';
    addTyping();
    var fun = window.VJFun && window.VJFun.reply(text);
    if (fun){
      // instant reply: setup, a beat, then the punchline
      var parts = fun.parts.slice();
      var next = function(){
        var part = parts.shift();
        rmTyping(); addBubble(esc(part).replace(/\n/g, '<br>'));
        hist.push({role:'assistant', content:part});
        if (parts.length){ addTyping(); setTimeout(next, 1500); }
        else { busy = false; sendBtn.disabled = false; save(); if (fun.kind !== 'safety') showChips(); }
      };
      setTimeout(next, 650);
      return;
    }
    var bubble = null, shown = '';
    function ensureBubble(){ if (!bubble){ rmTyping(); bubble = document.createElement('div'); bubble.className = 'vjw-b bot'; thread.appendChild(bubble); } }
    function onToken(tok){ shown += tok; ensureBubble(); bubble.textContent = shown; scrollDown(); }
    function fallback(){
      rmTyping(); var kb = kbReply(text);
      if (bubble){ bubble.innerHTML = kb; } else { addBubble(kb); }
      scrollDown(); hist.push({role:'assistant', content:strip(kb)});
      if (bubble){ msgs.push({ h: kb, me: false }); }
      busy = false; sendBtn.disabled = false; save(); showChips();
    }
    aiReplyStream(text, onToken).then(function(res){
      if (res && res.ok && res.full && res.full.trim()){
        var reply = res.full.trim();
        ensureBubble(); bubble.innerHTML = linkify(reply); scrollDown();
        hist.push({role:'assistant', content:strip(reply)});
        msgs.push({ h: linkify(reply), me: false });
        busy = false; sendBtn.disabled = false; save(); showChips();
      } else {
        fallback();
      }
    }).catch(fallback);
  }

  var GREETS = [
    "hey! i'm vishal. well, the ai version of me: same jokes, more sleep. ask me anything, or tap a button below.",
    "hi there! i'm vishal's ai twin. i know about my research, my kids' book, my balloon animal skills, and an alarming number of medical puns.",
    "welcome! ask me anything. warning: i will offer you a balloon animal at some point."
  ];
  function pickGreet(){
    var g = window.VJFun && window.VJFun.greet && window.VJFun.greet(location.pathname);
    return g || GREETS[Math.floor(Math.random() * GREETS.length)];
  }
  function openPanel(){
    panel.classList.add('open'); tip.style.display = 'none'; launch.setAttribute('aria-expanded', 'true');
    if (!greeted){ greeted = true; setTimeout(function(){ addTyping(); setTimeout(function(){ rmTyping(); addBubble(pickGreet()); showChips(); }, 700); }, 250); }
    else if (!thread.querySelector('.vjw-chips') && !busy) showChips();
    setTimeout(function(){ field.focus(); }, 200);
  }
  function closePanel(){ if (!panel.classList.contains('open')) return; panel.classList.remove('open'); launch.setAttribute('aria-expanded', 'false'); launch.focus(); }
  panel.querySelector('.vjw-new').addEventListener('click', function(){
    if (busy) return;
    msgs = []; hist = []; usedChips = []; thread.innerHTML = ''; save();
    addBubble(pickGreet()); showChips(); field.focus();
  });

  launch.addEventListener('click', function(){ panel.classList.contains('open') ? closePanel() : openPanel(); });
  panel.querySelector('.vjw-x').addEventListener('click', closePanel);
  sendBtn.addEventListener('click', function(){ send(field.value); });
  field.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); send(field.value); } });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(); });

  /* gentle one-time invite */
  setTimeout(function(){ if (!panel.classList.contains('open')) { tip.style.display = 'block';
    setTimeout(function(){ tip.style.display = 'none'; }, 6000); } }, 2500);
})();
