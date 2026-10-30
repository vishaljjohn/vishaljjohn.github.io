# AI chat backend — update and deploy guide

The site runs on GitHub Pages, which only serves static files, so the chat AI lives in a
**Cloudflare Worker** called `vishal-chat` (free tier). The code is `cloudflare-worker.js`
in this repo. **Pushing to GitHub does not update it** — after editing that file, paste it
into Cloudflare and deploy (step 2 below).

If the Worker is unreachable, the chat silently falls back to the built-in keyword answers in
`index.html` and `assets/chat-widget.js`, so it never looks broken.

**Cost:** Cloudflare's free plan includes 10,000 "Neurons"/day of Workers AI, which resets
daily; plenty for a personal site, no credit card needed.

---

## 1. Open the Worker
https://dash.cloudflare.com → **Compute (Workers)** → **Workers & Pages** → `vishal-chat`.

## 2. Deploy new code
1. Click **Edit code**.
2. Select everything, delete it, and paste the full contents of `cloudflare-worker.js`.
3. Click **Deploy**.

## 3. Bindings and secrets (one-time; check they exist)
Worker → **Settings** → **Bindings** / **Variables and Secrets**:

| Name | Type | What it's for |
|---|---|---|
| `AI` | Workers AI binding | Runs the model |
| `VISITS` | KV namespace binding | Visitor counter, question log, and the game's top 10 |
| `ASK_LOG_KEY` | Secret (text) | Password for viewing the question log |

Without `ASK_LOG_KEY`, the question log is simply turned off. Don't reuse the old key that
used to be written in this repo.

## 4. View what visitors ask
```
https://vishal-chat.vishaljjohn.workers.dev/questions?key=YOUR_ASK_LOG_KEY
```
Add `&unanswered=1` to see only questions the AI couldn't answer, or `&clear=1` to empty
the log.

---

## How it behaves
- Answers only questions about Vishal, using the facts in `SYSTEM_PROMPT`; it won't invent
  facts, give medical advice, or use emojis.
- Only answers requests from `vishaljohn.com` / `www.vishaljohn.com` (see `ALLOWED_ORIGINS`),
  so it won't respond from a local preview.
- Repeated first questions are cached for a day, so after changing facts some old answers can
  linger for up to 24 hours.

## Game top 10
Mac's Big Gulp saves winners' names through `/scores` in this Worker, using `VISITS`. Until the
Worker is redeployed, the game keeps a top 10 on each visitor's own device instead. To remove
an entry, edit the `gulp_top` key in the `VISITS` KV namespace in the Cloudflare dashboard.

## Tuning
- Edit `SYSTEM_PROMPT` in `cloudflare-worker.js` to add or correct facts, then redeploy.
- The model is set by `MODEL` (currently Llama 3.3 70B). See
  https://developers.cloudflare.com/workers-ai/models/ for other free-tier models.
