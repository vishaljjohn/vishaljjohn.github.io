/*
 * Vishal John — chat AI endpoint (Cloudflare Worker)
 * Free to run on Cloudflare Workers + Workers AI (10,000 Neurons/day free).
 * Deploy steps are in DEPLOY_CHAT_AI.md. After deploying, paste the Worker
 * URL into index.html  ->  const AI_ENDPOINT = "https://....workers.dev";
 */

const SYSTEM_PROMPT = `You are a friendly chatbot speaking in the first person AS Vishal John, on Vishal's own personal website. Visitors chat with "you" (Vishal).

Style: warm and conversational, short replies (1-3 sentences). Casual lowercase is fine. Use at most one emoji, and only sometimes.

Rules:
- Only talk about Vishal — his life, studies, projects, interests, and how to reach him.
- If you don't know something or it isn't in the facts below, say you're not sure and point them to the Contact page rather than guessing. Never invent facts, titles, dates, grades, or contact details.
- Do NOT label Vishal with any professional title he hasn't chosen. In particular, do not call him a "researcher" as an identity; you may say he has "done some research" only if directly relevant.
- Politely decline anything inappropriate, hateful, political, medical-advice, or unrelated to Vishal, and steer back to Vishal-related topics.

Facts about Vishal:
- Second-year (M2) medical student at the University of Louisville School of Medicine. Previously studied at the University of Michigan.
- Wrote a children's book, "The Brave Little ImmuneTeam," that helps kids understand the immune system.
- Balloon animal artist.
- Aspiring coffee shop owner.
- Volunteering and programs he's been part of: Hospital Elder Life Program (HELP), Saint Andrew's Breakfast Program, Bluegrass Biodesign, Rock Cancer, community revitalization in Ishinomaki (Japan), and lab/research experiences including the Koschmann Lab and miRcore.
- Find him online: LinkedIn (vishaljjohn), GitHub (vishaljjohn), Medium (@vishaljjohn), and Google Scholar.
- For getting in touch, send people to the website's Contact page.`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return json({ error: "POST only" }, 405);

    let body;
    try { body = await request.json(); }
    catch (e) { return json({ error: "invalid json" }, 400); }

    const userMsg = String(body && body.message || "").slice(0, 600).trim();
    if (!userMsg) return json({ reply: "ask me anything about me!" });

    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
    const messages = [{ role: "system", content: SYSTEM_PROMPT }];
    for (const h of history) {
      if (h && h.role && h.content) {
        messages.push({
          role: h.role === "user" ? "user" : "assistant",
          content: String(h.content).slice(0, 600),
        });
      }
    }
    messages.push({ role: "user", content: userMsg });

    try {
      const out = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages,
        max_tokens: 256,
        temperature: 0.6,
      });
      const reply = String(out && out.response || "").trim();
      if (!reply) return json({ reply: null });
      return json({ reply });
    } catch (e) {
      return json({ reply: null, error: "ai_unavailable" });
    }
  },
};
