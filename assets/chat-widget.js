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

  /* ---- Offline fallback knowledge (used if the AI is unreachable) ---- */
  var KB = [
    { k: ['who are you','about you','yourself','your name','what do you do'],
      a: "i'm Vishal John — an M2 medical student at the University of Louisville, plus a children's book author, balloon animal artist, and aspiring coffee shop owner." },
    { k: ['school','med','student','uofl','louisville','michigan','study'],
      a: "i'm a 2nd-year (M2) med student at the University of Louisville School of Medicine; i did my undergrad at the University of Michigan." },
    { k: ['book','children','author','immune','buy','amazon'],
      a: "i co-wrote a kids' book, \"The Brave Little Immune Team,\" for ages 4-8. you can grab it on <a href='https://www.amazon.com/Brave-Little-Immune-Team/dp/B0GVC5R915' target='_blank' rel='noopener'>Amazon</a>." },
    { k: ['balloon','animals','twist'],
      a: "balloon animals are my favorite party trick 🎈 dogs, monkeys, flowers — you name it." },
    { k: ['coffee','cafe','shop'],
      a: "one day i'd love to open a cozy little coffee shop ☕" },
    { k: ['research','lab','koschmann','mircore','science','rna','organoid'],
      a: "i've done research in the Koschmann Lab (pediatric brain cancer) and led bioinformatics work at miRcore. ask me about either!" },
    { k: ['publication','paper','scholar'],
      a: "i've contributed to 5 publications — see them on my <a href='https://scholar.google.com/citations?user=QXyjTGgAAAAJ' target='_blank' rel='noopener'>Google Scholar</a>." },
    { k: ['rock cancer','climb'],
      a: "i'm on the leadership team of Rock Cancer — free rock climbing for young cancer survivors." },
    { k: ['volunteer','service','community','help','breakfast','andrew'],
      a: "i volunteer with Rock Cancer, Saint Andrew's Breakfast Program, and the Hospital Elder Life Program (HELP)." },
    { k: ['contact','email','reach','hire','message','collaborat','work together'],
      a: "the best way to reach me is my Contact page — i'd love to hear from you." },
    { k: ['link','social','linkedin','github','medium','online'],
      a: "you can find me on <a href='https://www.linkedin.com/in/vishaljjohn/' target='_blank' rel='noopener'>LinkedIn</a>, <a href='https://github.com/vishaljjohn' target='_blank' rel='noopener'>GitHub</a>, and <a href='https://medium.com/@vishaljjohn' target='_blank' rel='noopener'>Medium</a>." },
    { k: ['hi','hey','hello','yo','howdy'],
      a: "hey! great to see you 😊 ask me anything — my research, the kids' book, balloon animals, or how to reach me." },
    { k: ['thank','thanks'],
      a: "anytime! 😊" },
    { k: ['bye','goodbye','later'],
      a: "take care — come back soon! 👋" }
  ];
  var FALLBACK = "great question! i'm not sure about that one — try my Contact page and i'll get back to you. you can also ask about my research, the book, balloon animals, or volunteering.";

  function kbReply(text) {
    var q = ' ' + text.toLowerCase().replace(/[^a-z0-9.@ ]/g, ' ') + ' ';
    for (var i = 0; i < KB.length; i++)
      for (var j = 0; j < KB[i].k.length; j++)
        if (q.indexOf(KB[i].k[j]) !== -1) return KB[i].a;
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
   + '.vjw-tip{position:fixed;right:86px;bottom:32px;background:#15171b;color:#fff;font-size:13px;padding:8px 12px;'
   + 'border-radius:10px;z-index:2147483000;box-shadow:0 6px 18px rgba(0,0,0,.25);max-width:200px;'
   + 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;}'
   + '.vjw-tip:after{content:"";position:absolute;right:-6px;bottom:14px;border:6px solid transparent;border-left-color:#15171b;}'
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
   + '.vjw-status{font-size:11px;opacity:.9;display:flex;align-items:center;gap:5px;}'
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
   + '.vjw-field{flex:1;min-width:0;border:1px solid #d8dadf;border-radius:22px;padding:10px 14px;font-size:15px;outline:none;}'
   + '.vjw-field:focus{border-color:#0a6db0;}'
   + '.vjw-send{width:40px;height:40px;flex-shrink:0;border:none;border-radius:50%;background:#0a6db0;color:#fff;cursor:pointer;font-size:16px;}'
   + '.vjw-send:disabled{opacity:.5;}'
   + '.vjw-call{position:fixed;right:20px;bottom:86px;z-index:2147483000;display:flex;align-items:center;gap:7px;background:#0a6db0;color:#fff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;font-weight:700;font-size:13px;height:46px;padding:0 16px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,0.28);}'
   + '.vjw-call:hover{background:#085a93;}'
   + '.vjw-call svg{width:18px;height:18px;}'
   + '@media (max-width:480px){.vjw-panel{right:12px;bottom:80px;height:70vh;}.vjw-launch{right:14px;bottom:14px;}.vjw-call{right:14px;bottom:78px;height:42px;font-size:12px;padding:0 12px;}.vjw-tip{display:none;}}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  /* ---- DOM ---- */
  var launch = document.createElement('button');
  launch.className = 'vjw-launch'; launch.setAttribute('aria-label', 'Chat with Vishal');
  launch.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>';
  document.body.appendChild(launch);

  var vcUrl = location.pathname.indexOf('/pages/') !== -1 ? '../index.html' : 'index.html';
  var vcBtn = document.createElement('a');
  vcBtn.className = 'vjw-call'; vcBtn.href = vcUrl; vcBtn.setAttribute('aria-label', 'Back to video call');
  vcBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="13" height="12" rx="2"></rect><path d="M22 8l-5 4 5 4V8z"></path></svg> Video call';
  document.body.appendChild(vcBtn);

  var tip = document.createElement('div');
  tip.className = 'vjw-tip'; tip.textContent = 'Hi! Ask me anything 👋'; tip.style.display = 'none';
  document.body.appendChild(tip);

  var panel = document.createElement('div');
  panel.className = 'vjw-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Chat with Vishal John');
  panel.innerHTML =
      '<div class="vjw-head">'
    + '  <div class="vjw-ava">V<span class="h">&#9829;</span>J</div>'
    + '  <div><div class="vjw-name">Vishal John</div><div class="vjw-status"><span class="vjw-dot"></span> ask me anything</div></div>'
    + '  <button class="vjw-x" aria-label="Close chat">&times;</button>'
    + '</div>'
    + '<div class="vjw-thread" id="vjwThread"></div>'
    + '<div class="vjw-input"><input class="vjw-field" id="vjwField" type="text" autocomplete="off" placeholder="Ask me anything…" aria-label="Message Vishal"><button class="vjw-send" id="vjwSend" aria-label="Send">&#8593;</button></div>';
  document.body.appendChild(panel);

  var thread = panel.querySelector('#vjwThread');
  var field = panel.querySelector('#vjwField');
  var sendBtn = panel.querySelector('#vjwSend');
  var hist = [], greeted = false, busy = false;

  function scrollDown(){ thread.scrollTop = thread.scrollHeight; }
  function addBubble(html, me){
    var b = document.createElement('div'); b.className = 'vjw-b ' + (me ? 'me' : 'bot');
    if (me) b.textContent = html; else b.innerHTML = html;
    thread.appendChild(b); scrollDown();
  }
  function addTyping(){
    var t = document.createElement('div'); t.className = 'vjw-b bot'; t.id = 'vjwTyping';
    t.innerHTML = '<span class="vjw-typing"><span></span><span></span><span></span></span>';
    thread.appendChild(t); scrollDown(); return t;
  }
  function rmTyping(){ var t = document.getElementById('vjwTyping'); if (t) t.remove(); }
  function strip(s){ return String(s).replace(/<[^>]*>/g, ''); }
  function esc(s){ return s.replace(/[&<>]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]; }); }

  function aiReply(text){
    if (!AI_ENDPOINT) return Promise.resolve(null);
    return fetch(AI_ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message:text, history: hist.slice(-6) }) })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ return d && d.reply ? String(d.reply) : null; })
      .catch(function(){ return null; });
  }
  function send(text){
    text = (text||'').trim(); if (!text || busy) return;
    busy = true; sendBtn.disabled = true;
    addBubble(text, true); hist.push({role:'user', content:text}); field.value = '';
    addTyping(); var t0 = Date.now();
    aiReply(text).then(function(reply){
      var fromAI = !!reply; if (!reply) reply = kbReply(text);
      var html = fromAI ? esc(reply).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>') : reply;
      setTimeout(function(){
        rmTyping(); addBubble(html); hist.push({role:'assistant', content:strip(reply)});
        busy = false; sendBtn.disabled = false;
      }, Math.max(0, 400 - (Date.now()-t0)));
    });
  }

  function openPanel(){
    panel.classList.add('open'); tip.style.display = 'none';
    if (!greeted){ greeted = true; setTimeout(function(){ var ty=addTyping(); setTimeout(function(){ rmTyping(); addBubble("hey! i'm vishal (well, an ai version 😄). ask me anything about my work, the kids' book, balloon animals, or how to get in touch."); }, 700); }, 150); }
    setTimeout(function(){ field.focus(); }, 200);
  }
  function closePanel(){ panel.classList.remove('open'); }

  launch.addEventListener('click', function(){ panel.classList.contains('open') ? closePanel() : openPanel(); });
  panel.querySelector('.vjw-x').addEventListener('click', closePanel);
  sendBtn.addEventListener('click', function(){ send(field.value); });
  field.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); send(field.value); } });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closePanel(); });

  /* gentle one-time invite */
  setTimeout(function(){ if (!panel.classList.contains('open')) { tip.style.display = 'block';
    setTimeout(function(){ tip.style.display = 'none'; }, 6000); } }, 2500);
})();
