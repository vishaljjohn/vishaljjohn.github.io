#!/usr/bin/env python3
"""Saves the latest Medium posts (title, preview, image) to assets/medium.json.

Browsers can't read Medium's feed directly (no CORS), so a scheduled GitHub
Action runs this and commits the result. Run it by hand with:
    python3 tools/fetch-medium.py
"""
import html, json, os, re, sys, urllib.request
import xml.etree.ElementTree as ET

FEED = "https://medium.com/feed/@vishaljjohn"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "medium.json")
CONTENT = "{http://purl.org/rss/1.0/modules/content/}encoded"
PREVIEW_WORDS = 42

req = urllib.request.Request(FEED, headers={"User-Agent": "Mozilla/5.0 (vishaljohn.com feed)"})
root = ET.fromstring(urllib.request.urlopen(req, timeout=30).read())

items = []
for it in root.iter("item"):
    body = it.findtext(CONTENT) or ""
    # first real picture (skip Medium's 1x1 tracking pixel)
    image = next((u for u in re.findall(r'<img[^>]+src="([^"]+)"', body) if "/_/stat" not in u), "")
    # readable text: drop figures and headings, keep paragraphs
    paras = re.findall(r"<p[^>]*>(.*?)</p>", re.sub(r"<figure.*?</figure>", " ", body, flags=re.S), re.S)
    text = " ".join(html.unescape(re.sub(r"<[^>]+>", "", p)).strip() for p in paras).strip()
    words = text.split()
    preview = " ".join(words[:PREVIEW_WORDS]).rstrip(",;:—-") + ("…" if len(words) > PREVIEW_WORDS else "")
    items.append({
        "title": (it.findtext("title") or "").strip(),
        "link": (it.findtext("link") or it.findtext("guid") or "").split("?")[0],
        "pubDate": it.findtext("pubDate") or "",
        "image": image,
        "preview": preview,
        "minutes": max(1, round(len(words) / 225)),
        "topics": [c.text for c in it.findall("category") if c.text],
    })

if not items:
    sys.exit("feed returned no posts; keeping the existing file")

with open(OUT, "w") as f:
    json.dump({"source": FEED, "items": items}, f, indent=2, ensure_ascii=False)
    f.write("\n")
print(f"saved {len(items)} posts")
