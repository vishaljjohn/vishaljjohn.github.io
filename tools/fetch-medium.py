#!/usr/bin/env python3
"""Saves the latest Medium posts to assets/medium.json for the Newsletter page.

Browsers can't read Medium's feed directly (no CORS), so a scheduled GitHub
Action runs this and commits the result. Run it by hand with:
    python3 tools/fetch-medium.py
"""
import json, os, sys, urllib.request
import xml.etree.ElementTree as ET

FEED = "https://medium.com/feed/@vishaljjohn"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "medium.json")

req = urllib.request.Request(FEED, headers={"User-Agent": "Mozilla/5.0 (vishaljohn.com feed)"})
xml = urllib.request.urlopen(req, timeout=30).read()
items = []
for it in ET.fromstring(xml).iter("item"):
    link = (it.findtext("link") or it.findtext("guid") or "").split("?")[0]
    items.append({"title": (it.findtext("title") or "").strip(), "link": link, "pubDate": it.findtext("pubDate") or ""})

if not items:
    sys.exit("feed returned no posts; keeping the existing file")

with open(OUT, "w") as f:
    json.dump({"source": FEED, "items": items}, f, indent=2, ensure_ascii=False)
    f.write("\n")
print(f"saved {len(items)} posts")
