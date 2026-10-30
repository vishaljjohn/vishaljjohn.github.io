#!/usr/bin/env python3
"""Builds the parts of the site that are generated. Run after any change:
    python3 tools/build.py

- Stamps tools/partials/header.html and footer.html into every page
- Generates a shareable page for each paper in assets/publications.json
- Generates the short links (/cv, /book, /rockcancer, ...)
- Rewrites sitemap.xml

The result is plain HTML, so GitHub Pages serves it with no build step.
Share images are separate: python3 tools/build-share-images.py
"""
import datetime, glob, html, json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
os.chdir(ROOT)
CURRENT = {"index_classic.html": "home", "pages/about.html": "about", "pages/blog.html": "blog",
           "pages/publications.html": "publications", "pages/contact.html": "contact"}


def partial(name, page):
    text = open(f"tools/partials/{name}.html").read().rstrip("\n")
    if page == "404.html":                 # served at any missing URL, so links must be absolute
        root, pages = "/", "/pages/"
    elif page.count("/") == 2:             # pages/papers/*.html
        root, pages = "../../", "../"
    elif page.startswith("pages/"):
        root, pages = "../", ""
    else:
        root, pages = "", "pages/"
    text = text.replace("{{root}}", root).replace("{{pages}}", pages)
    cur = CURRENT.get(page)
    return re.sub(r"\{\{current:(\w+)\}\}", lambda m: ' aria-current="page"' if m.group(1) == cur else "", text)


def stamp(page, name, s):
    pattern = rf"<!-- site:{name} -->.*?<!-- /site:{name} -->"
    block = f"<!-- site:{name} -->\n{partial(name, page)}\n<!-- /site:{name} -->"
    if not re.search(pattern, s, re.S):
        sys.exit(f"{page}: missing site:{name} markers")
    return re.sub(pattern, lambda m: block, s, count=1, flags=re.S)


SHORT_LINKS = {
    "cv": "pages/about.html#cv", "book": "pages/childrensbook.html", "rockcancer": "pages/rockcancer.html",
    "pubs": "pages/publications.html", "contact": "pages/contact.html", "card": "pages/card.html",
    "biodesign": "pages/bluegrassbiodesign.html", "mircore": "pages/mircore.html", "newsletter": "pages/blog.html",
}


def short_links():
    for name, target in SHORT_LINKS.items():
        os.makedirs(name, exist_ok=True)
        url = "https://www.vishaljohn.com/" + target
        page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Vishal John</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="{url}">
<meta http-equiv="refresh" content="0; url=/{target}">
<script>location.replace("/{target}");</script>
</head>
<body><a href="/{target}">Continue to vishaljohn.com/{target}</a></body>
</html>
"""
        path = f"{name}/index.html"
        if not os.path.exists(path) or open(path).read() != page:
            open(path, "w").write(page)


def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:60].rstrip("-")


PAPER = """<!DOCTYPE html>
<html lang="en">
<head>
<script>(function(){{try{{if(localStorage.getItem("vj-theme")==="dark")document.documentElement.classList.add("dark");}}catch(e){{}}}})();</script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Vishal John</title>
    <meta name="description" content="{desc}">
    <meta name="author" content="Vishal John">
    <link rel="canonical" href="https://www.vishaljohn.com/pages/papers/{slug}.html">
    <meta name="citation_title" content="{title}">
    {citation_authors}
    <meta name="citation_journal_title" content="{journal}">
    <meta name="citation_publication_date" content="{year}">
    <meta name="citation_doi" content="{doi}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:url" content="https://www.vishaljohn.com/pages/papers/{slug}.html">
    <meta property="og:image" content="https://www.vishaljohn.com/assets/og/papers/{slug}.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Vishal John">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{desc}">
    <meta name="twitter:image" content="https://www.vishaljohn.com/assets/og/papers/{slug}.jpg">
    <link rel="icon" type="image/svg+xml" href="../../assets/favicon.svg">
    <link rel="apple-touch-icon" href="../../assets/icons/apple-touch-icon.png">
    <meta name="theme-color" content="#ffffff">
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css">
    <link rel="stylesheet" href="../../assets/base.css">
    <link rel="stylesheet" href="../../assets/site.css">
</head>
<body class="project-page">
<!-- site:header -->
<!-- /site:header -->
<div class="container">
<div class="main-content paper-page">
<a class="ph-link" href="../publications.html"><i class="fas fa-arrow-left" aria-hidden="true"></i> All publications</a>
<h2>{title}</h2>
<p class="ph-role">{authors}</p>
<p class="ph-role"><em>{journal}</em>, {detail}. doi:{doi}</p>
<div class="paper-summary"><p class="paper-label">In plain English</p><p>{plain}</p></div>
<div class="paper-summary"><p class="paper-label">For scientists</p><p>{abstract}</p></div>
<div class="paper-actions">
<a class="pub-link" href="{url}" target="_blank" rel="noopener">Read the paper</a>
<a class="btn-secondary" href="../publications.html">See all publications</a>
</div>
</div>
</div>
<!-- site:footer -->
<!-- /site:footer -->
<script src="../../assets/site.js"></script>
<script src="../../assets/chat-widget.js" defer></script>
<script src="../../assets/theme.js"></script>
</body>
</html>
"""


def paper_pages():
    path = "assets/publications.json"
    data = json.load(open(path))
    changed = False
    os.makedirs("pages/papers", exist_ok=True)
    keep = set()
    for p in data["data"]:
        if not p.get("slug"):
            p["slug"] = slugify(p["title"])
            changed = True
        e = lambda k: html.escape(str(p.get(k, "")), quote=True)
        names = [a.strip() for a in re.sub(r"\s*\(\d+ authors\)|\.$|†|\*\*", "", p["authors"]).split(",") if a.strip() not in ("…", "et al", "")]
        authors = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html.escape(p["authors"]))
        desc = html.escape(p.get("plain") or p.get("abstract", ""), quote=True)
        out = PAPER.format(title=e("title"), desc=desc, slug=p["slug"], journal=e("journal"), year=p["year"], doi=e("doi"),
                           detail=e("year_detail"), authors=authors, plain=e("plain"), abstract=e("abstract"), url=e("url"),
                           citation_authors="\n    ".join(f'<meta name="citation_author" content="{html.escape(n, quote=True)}">' for n in names))
        f = f"pages/papers/{p['slug']}.html"
        keep.add(f)
        old = open(f).read() if os.path.exists(f) else None
        new = stamp(f, "footer", stamp(f, "header", out))
        if new != old:
            open(f, "w").write(new)
            print("wrote", f)
    for f in glob.glob("pages/papers/*.html"):
        if f not in keep:
            os.remove(f)
            print("removed", f)
    if changed:
        open(path, "w").write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def sitemap():
    skip = {"404.html", "pages/thanks.html"}
    pages = ["index.html", "index_classic.html"] + sorted(glob.glob("pages/*.html")) + sorted(glob.glob("pages/papers/*.html"))
    body = "\n".join(
        f"  <url><loc>https://www.vishaljohn.com/{'' if p == 'index.html' else p}</loc></url>" for p in pages if p not in skip)
    new = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}\n</urlset>\n'
    if not os.path.exists("sitemap.xml") or open("sitemap.xml").read() != new:
        open("sitemap.xml", "w").write(new)


def main():
    paper_pages()
    short_links()
    pages = ["index_classic.html", "404.html"] + sorted(glob.glob("pages/*.html")) + sorted(glob.glob("pages/papers/*.html"))
    for page in pages:
        s = open(page).read()
        new = stamp(page, "footer", stamp(page, "header", s))
        if new != s:
            open(page, "w").write(new)
            print("updated", page)
    sitemap()


if __name__ == "__main__":
    main()
