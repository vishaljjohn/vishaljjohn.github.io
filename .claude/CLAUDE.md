# vishaljohn.com

Static site on GitHub Pages; pushing to `main` deploys in about a minute.

## Always
- Every change must work on phones (check 375px and 320px wide: no sideways scrolling, readable text, tappable buttons, nav works) **and leave the desktop look unchanged**. Put phone-only fixes inside `@media (max-width: …)` rules so desktop styles are untouched.
- When a change is done and checked, commit and push it straight to `main` (Vishal wants to see it live; it can be reverted later). Also push the working branch.

## Where things live
- CV: `assets/cv.json` (rendered on `pages/about.html`). Rebuild the PDF with `./tools/build-cv-pdf.sh` after any CV, publication, or presentation change.
- Publications: `assets/publications.json`. Presentations: `assets/presentations.json`. Both feed the Publications page and the CV.
- Shared styles: `assets/site.css` (loaded after each page's inline styles). Shared scripts: `assets/site.js`, `assets/theme.js`, `assets/gallery.js`, `assets/chat-widget.js`.
- Chat backend: `cloudflare-worker.js` runs on Cloudflare (Worker `vishal-chat`, config in `wrangler.toml`). After changing it, deploy it yourself (Vishal wants to be hands-off): the cloud environment holds an "Edit Cloudflare Workers" token for api.cloudflare.com (injected by the proxy), so run `CLOUDFLARE_API_TOKEN=proxy-injected CLOUDFLARE_ACCOUNT_ID=a161b61106c4004546ce870d02fcd1b9 npx -y wrangler@3 deploy`, then check `/guestbook` returns `"api":3` and a chat POST (`{"message":"hi","history":[]}`) gets a real reply. `.github/workflows/deploy-worker.yml` would also auto-deploy on push to `main` if a `CLOUDFLARE_API_TOKEN` repository secret were ever added (it isn't; it skips with a warning).
- Guestbook: `pages/guestbook.html`, stored by the Worker's `/guestbook` endpoints; moderate at `pages/guestbook.html?admin` (see `DEPLOY_CHAT_AI.md`).
- Shared header/footer: edit `tools/partials/`, then run `python3 tools/build.py` (also regenerates paper pages, short links and the sitemap). Base layout CSS is `assets/base.css`.
- Project tiles on both homepages use 600px copies in `images/thumbs/`; `tools/build.py` creates missing ones.
- Share images: `python3 tools/build-share-images.py` after adding a page or paper.
- Owensboro White Flag page: `owensborowhiteflag.html` at the site root (a printed QR code points to this exact URL, so never rename or move it; `/whiteflag` is a short link). It is GENERATED: edit `tools/build-whiteflag.py` (all English + Spanish text and the resource list) or `tools/whiteflag-template.html` (layout, CSS, JS), then run `python3 tools/build-whiteflag.py`. Resource phones/addresses/hours came from Vishal (checked Nov 24, 2026); never add or change them without a source. `owensborowhiteflag-sw.js` is its offline helper (scope `/owensborowhiteflag` only).
- Daily job `.github/workflows/refresh-data.yml` refreshes `assets/medium.json` and `assets/citations.json`. Once a year (Dec 15), `.github/workflows/find-new-papers.yml` runs `tools/find-new-papers.py`, which opens a GitHub issue when OpenAlex lists a paper by Vishal that isn't in `publications.json` or `presentations.json` (not-his DOIs go in the `ignore` list in `assets/new-papers.json`). Vishal asked for yearly, not daily.
