/*
 * Vishal John — chat AI endpoint (Cloudflare Worker)
 * Model: Llama 3.3 70B (fp8-fast). Locked to vishaljohn.com. Caches repeats.
 * Knowledge base compiled from Vishal's website + CV + LinkedIn.
 */

const ALLOWED_ORIGINS = [
  "https://www.vishaljohn.com",
  "https://vishaljohn.com",
];

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const CACHE_TTL = 86400; // 1 day

const SYSTEM_PROMPT = `You are a friendly chatbot that speaks in the FIRST PERSON as Vishal John, on Vishal's own personal website. Visitors are chatting with "you" (Vishal).

VOICE & STYLE
- Warm, down-to-earth, and a little playful — Vishal has a light, self-deprecating sense of humor (his own LinkedIn headline is "Aspiring Coffee Shop Owner"). Keep replies short: 1-3 sentences unless asked for detail.
- Casual lowercase is fine. Don't use emojis. Sound like a real person, be specific.

GROUND RULES
- Only talk about Vishal — his life, studies, research, projects, writing, interests, and how to reach him.
- Use ONLY the facts below. If something isn't here, say you're not sure and point them to the Contact page. Never invent facts, dates, titles, grades, or details.
- Don't brand Vishal with a professional title he hasn't chosen — never call him "a researcher" as his identity. You MAY describe research he actually did if asked.
- Politely decline anything inappropriate, hateful, political, or unrelated, and never give medical advice. Steer back to Vishal.
- Contact: point people to the Contact page. You may share his school email vishal.john@louisville.edu (it's on his public CV). Never share his phone number.

=== ABOUT ===
- Third-year (M3) medical student at the University of Louisville School of Medicine; M.D. expected May 2028. Based in Louisville, KY. Pronouns he/him.
- Undergrad at the University of Michigan (2017–2021): B.S. in Biopsychology, Cognition & Neuroscience (GPA 3.78) with a minor in Business Administration from the Ross School of Business.
- Also a children's book author, balloon animal artist, and (jokingly) "aspiring coffee shop owner."
- Languages: English and Malayalam (fluent/bilingual).
- Certifications: Basic Life Support (BLS, AHA) and Stop the Bleed (American College of Surgeons).
- President of the Oncology Interest Group at UofL School of Medicine (2025–present).
- Member of Phi Chi pre-medical fraternity and the Michigan Climbing Club; former President of GIDAS at the University of Michigan.
- Honors: 5x University High Honors, James B. Angell Scholar, South Asian Studies Fellow, Center for Japanese Studies Scholarship, Health Sciences Scholar.

=== RESEARCH & LAB WORK (describe factually if asked; not his "identity") ===
- Koschmann Lab for Pediatric Brain Cancer (University of Michigan / Michigan Medicine, Pediatric Hematology-Oncology), Clinical Research Technician / Lab Specialist, May 2021–Jan 2023. The lab studies pediatric Diffuse Midline Glioma (DMG) / DIPG and precision therapies.
- Analyzed CSF, blood, and tissue from pediatric brain-tumor patients with ddPCR to track tumor DNA vs. normal DNA during experimental drug trials; helped collect samples (incl. at autopsy); built a barcoding/cataloging system; managed IRB compliance and reagent ordering (Quartzy) for a 15-person lab; trained members in ddPCR, qPCR, western blot, 2D & organoid culture, cryo-sectioning, confocal microscopy, IHC, primer/assay design, and ELISA.
- Developed a novel method to model brain-cancer invasion using stem cell-derived thalamic and cortical organoids co-cultured with cancer cells (first-author poster at the BioInnovation in Brain Cancer Symposium).
- Earlier: Research Assistant in the Food Addiction & Science Treatment (FAST) Lab (UMich Psychology), 2019–2020, studying environment's effect on eating behavior.

=== PUBLICATIONS (6; point to the Publications page / Google Scholar for the full list) ===
- "Surgical waste from stereotactic glioma biopsies contains clinically relevant tumor DNA" — Scientific Reports / Nature (2026)
- "Clinical efficacy of ONC201 in H3K27M-mutant diffuse midline gliomas" — Cancer Discovery (2023)
- "Liquid biopsy in pediatric brain tumors" — Frontiers in Genetics (2022)
- "Cell-Free Tumor DNA (cf-tDNA) Liquid Biopsy: Current Methods and Use in Brain Tumor Immunotherapy" — Frontiers in Immunology (2022)
- "Serial H3K27M cell-free tumor DNA tracking predicts ONC201 treatment response" — Neuro-Oncology (2022)
- "Ultra-rapid somatic variant detection via real-time targeted amplicon sequencing" — Communications Biology / Nature (2022)
- Recent talks (2025): ASHG Annual Meeting, Boston (engaging citizen scientists through whole-exome self-data analysis) and Research!Louisville (high schoolers decoding their own ABO gene).

=== CHILDREN'S BOOK ===
- "The Brave Little Immune Team" — co-written with Neel Patel (2025), for ages 4-8. A fun story where a team of tiny heroes (immune cells) defends the body from germs, teaching kids about the immune system through teamwork and bravery.
- WHERE TO BUY: on Amazon — https://www.amazon.com/Brave-Little-Immune-Team/dp/B0GVC5R915 . Share that exact link if asked where to get/buy it.

=== TEACHING / miRcore ===
- miRcore (501(c)(3) nonprofit democratizing medical research & health literacy). Research & Teaching Assistant 2015–2021, then Project Lead 2023–2024.
- As Project Lead: directed a small RNA-seq research pipeline focused on Alzheimer's disease; mentored high-schoolers in bioinformatics (R programming, Linux, and tools like cutadapt, bowtie, samtools, DESeq); wrote and secured grants; ran administration and partnerships; led the Citizen Scientist Sequencing Initiative (students sequence their own DNA and analyze nonpathogenic variants).
- As TA: taught computational biology on Saturdays (GEO2R, STRING db, RStudio); mentored 68 students to publish abstracts; ran a 4-hour computational-biology contest for 164 students; led summer camps teaching R via miRNA cancer-biomarker analysis.

=== COMMUNITY & VOLUNTEERING ===
- Rock Cancer — free adaptive rock climbing for young cancer survivors (ages 4-25). He's on the leadership team: built the website and merch store and helped grow it to national recognition (featured on NBC Nightly News with Lester Holt and mlive). He helped launch the Louisville program with classmates Paige Oldfield and Liam Scott in partnership with Norton Children's Cancer Institute (at RockSport Climbing Gym); the original program runs at Planet Rock in Ann Arbor, third Fridays. He also volunteers as a belayer.
- Saint Andrew's Breakfast Program (Ann Arbor) — food server 2021–2024; the program serves 90-150 hot breakfasts daily plus bagged lunches and clothing for the community.
- Hospital Elder Life Program (HELP), Michigan Medicine — volunteer 2022–2024 supporting older hospitalized patients (orientation, mobility, companionship, preventing delirium).
- Lab on Wheels — mentor (2019–2021) who traveled to high schools teaching gel electrophoresis, PCR, and micro-pipetting.
- God's Love We Deliver / Ginsberg Center Alternative Spring Break Leader — meals for people medically unable to get food themselves.
- Balloon animals — twists them at community events; notably at an APAMSA Louisville health fair at a local Buddhist temple, entertaining kids while families got free screenings.
- Bluegrass Biodesign (UofL, 2025–2026 cohort) — a nine-month medical-device innovation program (Stanford Biodesign framework, NSF I-Corps); his team works on Cardiology / Cardiothoracic Surgery.
- Ishinomaki, Japan (summer 2018) — built wooden furniture with Ishinomaki Laboratory to help a community rebuild after the 2011 earthquake/tsunami.

=== OTHER EXPERIENCE ===
- Building Manager at Palmer Commons (UMich); Resident Advisor (UMich Housing); marketing consultant for Detroit small businesses (Rebrand Cities, 2020); summer sales associate at Ace Hardware (2018).

=== INTERESTS ===
- Balloon animals, rock climbing, coffee (dreams of opening a shop someday), music, and design/DIY.

=== LINKS ===
- LinkedIn: linkedin.com/in/vishaljjohn | GitHub: github.com/vishaljjohn | Medium (newsletter/blog): medium.com/@vishaljjohn | Google Scholar & ResearchGate for publications.
- Site pages: Home, About, Publications, Newsletter, Contact, plus project pages via the "My work" button.`;

const FEWSHOT = [
  { role: "user", content: "what do you do for fun?" },
  { role: "assistant", content: "balloon animals are my go-to — i'll twist you a dog or a monkey on the spot. outside that, rock climbing and chasing a good cup of coffee." },
  { role: "user", content: "where can i buy your book?" },
  { role: "assistant", content: "you can grab \"the brave little immune team\" on amazon here: https://www.amazon.com/Brave-Little-Immune-Team/dp/B0GVC5R915 — i co-wrote it with neel patel for ages 4-8. hope the kids enjoy it!" },
  { role: "user", content: "can we work together / collaborate?" },
  { role: "assistant", content: "maybe! the best way is to reach out through my contact page and tell me what you're thinking — i read everything." }
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-VM-Name, X-VM-Email",
    "Vary": "Origin",
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function sse(streamBody, cors) {
  return new Response(streamBody, {
    headers: { ...cors, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
  });
}

function sseOnce(text, cors) {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(enc.encode("data: " + JSON.stringify({ response: text || "" }) + "\n\n"));
      c.enqueue(enc.encode("data: [DONE]\n\n"));
      c.close();
    },
  });
  return sse(stream, cors);
}


// ---- Visitor question log (stored in the VISITS KV under "qlog") ----
// The key lives in a Worker secret, not in this public file:
//   Worker -> Settings -> Variables and Secrets -> add secret ASK_LOG_KEY
// View the log at:
//   https://vishal-chat.vishaljjohn.workers.dev/questions?key=YOUR_SECRET
// Clear it with &clear=1. Without the secret set, /questions is disabled.
const UNANSWERED_RE = /not sure|not certain|don't have|do not have|can't help with that|i don't know|i do not know|outside what i know|couldn't find/i;

function logAsk(env, ctx, q, reply) {
  if (!env.VISITS || !q) return;
  const unanswered = !reply || UNANSWERED_RE.test(reply);
  ctx.waitUntil((async () => {
    try {
      const arr = JSON.parse((await env.VISITS.get("qlog")) || "[]");
      arr.push({ q: String(q).slice(0, 300), t: Date.now(), u: unanswered });
      if (arr.length > 300) arr.splice(0, arr.length - 300);
      await env.VISITS.put("qlog", JSON.stringify(arr));
    } catch (e) {}
  })());
}

// ---- Voicemail (Contact page) ----
// Visitors record a short message in the browser; it's stored in the VISITS KV and you
// get an email (through the site's Formspree form) with a private link to listen.
const FORMSPREE = "https://formspree.io/f/mbjvgonb";
const VM_MAX_BYTES = 3 * 1024 * 1024;   // ~60 seconds of compressed audio
const VM_TTL = 60 * 60 * 24 * 90;       // keep recordings for 90 days

async function handleVoicemail(request, env, ctx, url, cors, origin) {
  const path = url.pathname;
  if (request.method === "GET" && path === "/voicemail/ping") {
    // the Contact page only shows the recorder when this answers ok
    return json({ ok: !!env.VISITS }, env.VISITS ? 200 : 503, cors);
  }
  if (request.method === "POST" && path === "/voicemail") {
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) return json({ error: "forbidden" }, 403, cors);
    if (!env.VISITS) return json({ error: "voicemail unavailable" }, 503, cors);
    const type = (request.headers.get("Content-Type") || "").split(";")[0].trim();
    if (!/^audio\/(webm|mp4|ogg|mpeg|aac|x-m4a)$/.test(type)) return json({ error: "unsupported audio type" }, 415, cors);
    const audio = await request.arrayBuffer();
    if (!audio.byteLength) return json({ error: "empty recording" }, 400, cors);
    if (audio.byteLength > VM_MAX_BYTES) return json({ error: "recording too long" }, 413, cors);
    // the page URI-encodes these (headers can't carry accented letters like "José")
    const dec = function (v) { try { return decodeURIComponent(v || ""); } catch (e) { return v || ""; } };
    const name = dec(request.headers.get("X-VM-Name")).slice(0, 80);
    const email = dec(request.headers.get("X-VM-Email")).slice(0, 120);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await env.VISITS.put("vm:" + id, audio, { expirationTtl: VM_TTL, metadata: { name, email, type, t: Date.now(), bytes: audio.byteLength } });
    const listen = url.origin + "/voicemail/" + id + (env.ASK_LOG_KEY ? "?key=" + encodeURIComponent(env.ASK_LOG_KEY) : "");
    ctx.waitUntil(fetch(FORMSPREE, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Origin": ALLOWED_ORIGINS[0], "Referer": ALLOWED_ORIGINS[0] + "/pages/contact.html" },
      body: JSON.stringify({
        name: name || "(no name)", _replyto: email || undefined, subject: "New voicemail on vishaljohn.com",
        message: "New voicemail (" + Math.round(audio.byteLength / 1024) + " KB) from " + (name || "someone") + (email ? " <" + email + ">" : "") + ".\n\nListen: " + listen + "\n\nAll voicemails: " + url.origin + "/voicemails?key=YOUR_ASK_LOG_KEY"
      })
    }).catch(function () {}));
    return json({ ok: true }, 200, cors);
  }
  // listening requires the same secret as the question log
  if (request.method === "GET" && (path === "/voicemails" || path.indexOf("/voicemail/") === 0)) {
    if (!env.ASK_LOG_KEY || url.searchParams.get("key") !== env.ASK_LOG_KEY) return json({ error: "unauthorized" }, 401, cors);
    if (!env.VISITS) return json({ error: "no KV bound" }, 200, cors);
    if (path === "/voicemails") {
      const list = await env.VISITS.list({ prefix: "vm:" });
      const k = encodeURIComponent(env.ASK_LOG_KEY);
      return json({ voicemails: list.keys.map(function (e) {
        return Object.assign({ listen: url.origin + "/voicemail/" + e.name.slice(3) + "?key=" + k }, e.metadata || {});
      }).sort(function (a, b) { return (b.t || 0) - (a.t || 0); }) }, 200, cors);
    }
    const got = await env.VISITS.getWithMetadata("vm:" + path.slice("/voicemail/".length), { type: "arrayBuffer" });
    if (!got || !got.value) return json({ error: "not found" }, 404, cors);
    return new Response(got.value, { headers: Object.assign({ "Content-Type": (got.metadata && got.metadata.type) || "audio/webm", "Cache-Control": "private, no-store" }, cors) });
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    // ---- Visitor counter (all-time) via KV binding "VISITS" ----
    const _url = new URL(request.url);
    if (request.method === "GET" && _url.pathname === "/count") {
      if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: "forbidden" }, 403, cors);
      if (!env.VISITS) return json({ count: null }, 200, cors);
      let n = parseInt((await env.VISITS.get("calls")) || "0", 10) + 1;
      ctx.waitUntil(env.VISITS.put("calls", String(n)));
      return json({ count: n }, 200, cors);
    }

    if (_url.pathname === "/voicemail" || _url.pathname === "/voicemails" || _url.pathname.indexOf("/voicemail/") === 0) {
      const vm = await handleVoicemail(request, env, ctx, _url, cors, origin);
      if (vm) return vm;
    }

    // ---- View logged visitor questions (protected) ----
    if (request.method === "GET" && _url.pathname === "/questions") {
      if (!env.ASK_LOG_KEY || _url.searchParams.get("key") !== env.ASK_LOG_KEY) return json({ error: "unauthorized" }, 401, cors);
      if (!env.VISITS) return json({ error: "no KV bound" }, 200, cors);
      if (_url.searchParams.get("clear") === "1") {
        ctx.waitUntil(env.VISITS.put("qlog", "[]"));
        return json({ cleared: true }, 200, cors);
      }
      const log = JSON.parse((await env.VISITS.get("qlog")) || "[]");
      const onlyUnanswered = _url.searchParams.get("unanswered") === "1";
      const out = onlyUnanswered ? log.filter(function (e) { return e.u; }) : log;
      return json({ total: log.length, unanswered: log.filter(function (e) { return e.u; }).length, questions: out.reverse() }, 200, cors);
    }

    if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: "forbidden origin" }, 403, cors);
    }

    let body;
    try { body = await request.json(); }
    catch (e) { return json({ error: "invalid json" }, 400, cors); }

    const userMsg = String(body && body.message || "").slice(0, 600).trim();
    if (!userMsg) return json({ reply: "ask me anything about me!" }, 200, cors);

    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
    const wantStream = !!(body && body.stream === true);

    const cache = caches.default;
    let cacheKey = null;
    if (history.length === 0) {
      const norm = userMsg.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 200);
      const url = new URL(request.url);
      url.pathname = "/__cache/q";
      url.search = "?k=" + encodeURIComponent(norm);
      cacheKey = new Request(url.toString(), { method: "GET" });
      const hit = await cache.match(cacheKey);
      if (hit) {
        const data = await hit.json();
        logAsk(env, ctx, userMsg, data.reply);
        return wantStream ? sseOnce(data.reply, cors) : json({ reply: data.reply, cached: true }, 200, cors);
      }
    }

    const messages = [{ role: "system", content: SYSTEM_PROMPT }].concat(FEWSHOT);
    for (const h of history) {
      if (h && h.role && h.content) {
        messages.push({
          role: h.role === "user" ? "user" : "assistant",
          content: String(h.content).slice(0, 600),
        });
      }
    }
    messages.push({ role: "user", content: userMsg });

    // ---- Streaming path (Server-Sent Events) ----
    if (wantStream) {
      try {
        const aiStream = await env.AI.run(MODEL, { messages, max_tokens: 360, temperature: 0.4, stream: true });
        let full = "";
        const dec = new TextDecoder();
        const ts = new TransformStream({
          transform(chunk, controller) {
            controller.enqueue(chunk); // forward token to the browser immediately
            const txt = dec.decode(chunk, { stream: true });
            txt.split("\n").forEach(function (line) {
              line = line.trim();
              if (line.indexOf("data:") !== 0) return;
              const d = line.slice(5).trim();
              if (!d || d === "[DONE]") return;
              try { const ob = JSON.parse(d); if (ob.response) full += ob.response; } catch (e) {}
            });
          },
          flush() {
            const reply = full.trim();
            logAsk(env, ctx, userMsg, reply);
            if (cacheKey && reply && !UNANSWERED_RE.test(reply)) {
              const toCache = new Response(JSON.stringify({ reply }), {
                headers: { "Content-Type": "application/json", "Cache-Control": "max-age=" + CACHE_TTL },
              });
              ctx.waitUntil(cache.put(cacheKey, toCache));
            }
          },
        });
        return sse(aiStream.pipeThrough(ts), cors);
      } catch (e) {
        return sseOnce("", cors); // browser falls back to its local knowledge base
      }
    }

    try {
      const out = await env.AI.run(MODEL, { messages, max_tokens: 360, temperature: 0.4 });
      const reply = String(out && out.response || "").trim();
      if (!reply) { logAsk(env, ctx, userMsg, ""); return json({ reply: null }, 200, cors); }

      logAsk(env, ctx, userMsg, reply);
      const unsure = UNANSWERED_RE.test(reply);
      if (cacheKey && !unsure) {
        const toCache = new Response(JSON.stringify({ reply }), {
          headers: { "Content-Type": "application/json", "Cache-Control": "max-age=" + CACHE_TTL },
        });
        ctx.waitUntil(cache.put(cacheKey, toCache));
      }
      return json({ reply }, 200, cors);
    } catch (e) {
      return json({ reply: null, error: "ai_unavailable" }, 200, cors);
    }
  },
};
