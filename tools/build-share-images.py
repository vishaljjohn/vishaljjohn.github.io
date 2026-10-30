#!/usr/bin/env python3
"""Makes the preview card shown when a page is shared (texts, LinkedIn, etc.).

Run after adding a page or paper:  python3 tools/build-share-images.py
Needs Google Chrome and Pillow. Writes assets/og/*.jpg and points each page's
og:image and twitter:image at its card.
"""
import glob, html, json, os, re, subprocess, tempfile
from urllib.parse import unquote
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
os.chdir(ROOT)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SITE = "https://www.vishaljohn.com/"

# page -> (card title, photo). The summary comes from the page's own description.
PAGES = {
    "index_classic.html": ("Vishal John", "images/Vishal John Headshot.jpg"),
    "pages/about.html": ("About Vishal John", "images/Vishal John Headshot.jpg"),
    "pages/publications.html": ("Publications", "images/Photo1.jpg"),
    "pages/blog.html": ("My Writing", "images/Vishal John Headshot.jpg"),
    "pages/contact.html": ("Get in Touch", "images/Vishal John Headshot.jpg"),
    "pages/card.html": ("Digital Business Card", "images/Vishal John Headshot.jpg"),
    "pages/balloonanimals.html": ("Balloon Animals", "images/balloon_clownnose1.jpg"),
    "pages/rockcancer.html": ("Rock Cancer", "images/RockCancer.jpg"),
    "pages/bluegrassbiodesign.html": ("Bluegrass Biodesign", "images/biodesign_team.jpg"),
    "pages/childrensbook.html": ("The Brave Little Immune Team", "images/Brave_Little_ImmuneTeam_Cover.jpg"),
    "pages/mircore.html": ("miRcore", "images/mircore-team.jpg"),
    "pages/koschmannlab.html": ("Koschmann Lab", "images/lab1.JPG"),
    "pages/standrews.html": ("Saint Andrew's Breakfast Program", "images/andrew2.JPG"),
    "pages/HELP.html": ("Hospital Elder Life Program", "images/help.jpg"),
    "pages/japan.html": ("Ishinomaki, Japan", "images/japan1.jpg"),
}

CARD = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{{box-sizing:border-box;margin:0}}
html,body{{width:1200px;height:630px;overflow:hidden}}
body{{display:flex;font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif;background:#fff;color:#232529}}
.text{{flex:1;padding:56px 56px 48px 60px;display:flex;flex-direction:column;min-width:0;border-left:14px solid #0a6db0}}
.kicker{{font-size:21px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0a6db0}}
h1{{font-size:{size}px;line-height:1.14;letter-spacing:-.8px;margin:26px 0 18px}}
p{{font-size:25px;line-height:1.42;color:#555a61}}
.site{{margin-top:auto;font-size:22px;font-weight:600;color:#0a6db0}}
.side{{width:430px;flex-shrink:0;{side}}}
.journal{{display:flex;flex-direction:column;justify-content:center;padding:40px;color:#fff;background:#0a6db0}}
.journal b{{font-size:17px;letter-spacing:2px;text-transform:uppercase;opacity:.85}}
.journal span{{font-size:40px;font-weight:700;line-height:1.2;margin-top:14px}}
.journal i{{font-style:normal;font-size:26px;margin-top:14px;opacity:.9}}
</style></head><body>
<div class="text"><div class="kicker">{kicker}</div><h1>{title}</h1><p>{summary}</p><div class="site">vishaljohn.com</div></div>
{right}
</body></html>"""


def clip(text, n):
    text = " ".join(text.split())
    return text if len(text) <= n else text[:n].rsplit(" ", 1)[0].rstrip(",;:") + "…"


def render(out, title, summary, kicker, right, side=""):
    size = 58 if len(title) < 32 else 46 if len(title) < 70 else 38
    doc = CARD.format(size=size, kicker=html.escape(kicker), title=html.escape(title), summary=html.escape(clip(summary, 170)), right=right, side=side)
    with tempfile.TemporaryDirectory() as tmp:
        src, png = os.path.join(tmp, "card.html"), os.path.join(tmp, "card.png")
        open(src, "w").write(doc)
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                        "--window-size=1200,630", "--allow-file-access-from-files", f"--screenshot={png}", "file://" + src],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im = Image.open(png).convert("RGB")
        if im.size != (1200, 630):
            im = im.crop((0, 0, 1200, 630))
        im.save(out, "JPEG", quality=84, optimize=True)


def set_meta(page, image):
    s = open(page).read()
    url = SITE + image
    for key in ('property="og:image"', 'name="twitter:image"'):
        s, n = re.subn(r"<meta[^>]*" + re.escape(key) + r"[^>]*>", lambda m: re.sub(r'content="[^"]*"', f'content="{url}"', m.group(0)), s)
        if n == 0:
            tag = key.split("=")[0]
            s = s.replace("</title>", f'</title>\n    <meta {key} content="{url}">', 1)
    if "og:image:width" not in s:
        s = re.sub(r'(<meta[^>]*property="og:image"[^>]*>)', r'\1\n    <meta property="og:image:width" content="1200">\n    <meta property="og:image:height" content="630">', s, count=1)
    if 'name="twitter:card"' not in s:
        s = s.replace("</title>", '</title>\n    <meta name="twitter:card" content="summary_large_image">', 1)
    open(page, "w").write(s)


def description(page):
    s = open(page).read()
    m = re.search(r'<meta[^>]*name="description"[^>]*>', s)
    c = re.search(r'content="([^"]*)"', m.group(0)) if m else None
    return html.unescape(c.group(1)) if c else ""


def main():
    for page, (title, photo) in PAGES.items():
        name = "home" if page == "index_classic.html" else os.path.basename(page)[:-5]
        out = f"assets/og/{name}.jpg"
        pic = "file://" + os.path.join(ROOT, photo).replace(" ", "%20")
        fit = "contain" if "Immune" in photo else "cover"
        pos = "center 22%" if "Headshot" in photo else "left center" if "lab1" in photo else "center"
        back = "#fbe3d3" if "Immune" in photo else "#fff"
        side = f"background:{back} url('{pic}') {pos}/{fit} no-repeat"
        render(out, title, description(page), "Vishal John", '<div class="side"></div>', side)
        set_meta(page, out)
        print(out)
    for p in json.load(open("assets/publications.json"))["data"]:
        out = f"assets/og/papers/{p['slug']}.jpg"
        journal = p["journal"].replace(" (Nature)", "")
        right = f'<div class="side journal"><b>Published in</b><span>{html.escape(journal)}</span><i>{p["year"]}</i></div>'
        render(out, p["title"], p.get("plain") or p.get("abstract", ""), "Research by Vishal John and colleagues", right)
        print(out)


if __name__ == "__main__":
    main()
