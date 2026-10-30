# vishaljohn.com

Static site on GitHub Pages; pushing to `main` deploys in about a minute.

## Always
- Every change must work on phones (check 375px and 320px wide: no sideways scrolling, readable text, tappable buttons, nav works) **and leave the desktop look unchanged**. Put phone-only fixes inside `@media (max-width: …)` rules so desktop styles are untouched.
- Commit and push only after Vishal approves.

## Where things live
- CV: `assets/cv.json` (rendered on `pages/about.html`). Rebuild the PDF with `./tools/build-cv-pdf.sh` after any CV, publication, or presentation change.
- Publications: `assets/publications.json`. Presentations: `assets/presentations.json`. Both feed the Publications page and the CV.
- Shared styles: `assets/site.css` (loaded after each page's inline styles). Shared scripts: `assets/site.js`, `assets/theme.js`, `assets/gallery.js`, `assets/chat-widget.js`.
- Chat backend: `cloudflare-worker.js` runs on Cloudflare and must be redeployed there by hand.
- Shared header/footer: edit `tools/partials/`, then run `python3 tools/build.py` (also regenerates paper pages, short links and the sitemap). Base layout CSS is `assets/base.css`.
- Share images: `python3 tools/build-share-images.py` after adding a page or paper.
- Daily job `.github/workflows/refresh-data.yml` refreshes `assets/medium.json` and `assets/citations.json`.
