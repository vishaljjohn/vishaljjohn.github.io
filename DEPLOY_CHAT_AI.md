# Free AI chat — deploy guide

Your site runs on GitHub Pages, which only serves static files, so the AI lives in a tiny
**Cloudflare Worker** (free). The page already works *without* this — until you finish these
steps it uses built-in keyword answers. Once you paste in your Worker URL, the chat becomes
a real AI that answers questions about you.

**Cost:** Cloudflare's free plan includes **10,000 "Neurons"/day** of Workers AI, which resets
daily. For a personal site that's roughly dozens–to–hundreds of replies per day at no charge,
and no credit card is required for the free tier.

---

## 1. Make a free Cloudflare account
Go to https://dash.cloudflare.com/sign-up and create an account (free). You do **not** need to
move your domain to Cloudflare for this.

## 2. Create the Worker
1. In the dashboard sidebar: **Compute (Workers)** → **Workers & Pages** → **Create** → **Create Worker**.
2. Give it a name like `vishal-chat`. Click **Deploy** (it deploys a hello-world first).
3. Click **Edit code**. Delete the sample code, then paste in the entire contents of
   `cloudflare-worker.js` from this folder. Click **Deploy**.

## 3. Turn on Workers AI for the Worker
The code uses an `AI` binding. Add it:
1. Open your Worker → **Settings** → **Bindings** (older dashboards: **Settings → Variables**).
2. **Add binding** → choose **Workers AI**.
3. Set the **Variable name** to exactly `AI` → **Save / Deploy**.

## 4. Copy your Worker URL
On the Worker's page you'll see a URL like:
```
https://vishal-chat.YOURNAME.workers.dev
```

## 5. Plug it into the site
1. Open `index.html`.
2. Near the top of the `<script>` find this line:
   ```js
   var AI_ENDPOINT = "";
   ```
3. Put your Worker URL between the quotes:
   ```js
   var AI_ENDPOINT = "https://vishal-chat.YOURNAME.workers.dev";
   ```
4. Save, commit, and push to GitHub. Done — the chat now uses AI.

## 6. (Recommended) Lock it to your domain
By default the Worker accepts requests from anywhere. To restrict it to your site, open
`cloudflare-worker.js` and change:
```js
"Access-Control-Allow-Origin": "*",
```
to
```js
"Access-Control-Allow-Origin": "https://www.vishaljohn.com",
```
then re-deploy. (Keep `*` while testing locally, since `file://` pages send a `null` origin.)

---

## How it behaves
- **AI reachable:** visitor messages go to your Worker, which runs Llama 3.1 (8B) with a
  system prompt grounded on your bio and guardrails (only talks about you, stays appropriate,
  won't invent facts, and won't use the "researcher" label).
- **AI unset, rate-limited, or offline:** the page silently falls back to the built-in
  keyword answers, so the chat never looks broken.

## Tuning
- Edit the `SYSTEM_PROMPT` text in `cloudflare-worker.js` to add or correct facts about you.
- Want a different/cheaper model? Change the model id in
  `env.AI.run("@cf/meta/llama-3.1-8b-instruct", …)`. See
  https://developers.cloudflare.com/workers-ai/models/ for the current free-tier models.
