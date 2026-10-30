#!/usr/bin/env python3
"""Saves citation counts for every paper to assets/citations.json.

Google Scholar has no public API, so counts come from OpenAlex. A daily GitHub
Action runs this; run it by hand with:  python3 tools/fetch-citations.py
"""
import datetime, json, os, sys, urllib.parse, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
pubs = json.load(open(os.path.join(ROOT, "assets", "publications.json")))["data"]
dois = [p["doi"] for p in pubs if p.get("doi")]
url = ("https://api.openalex.org/works?per-page=50&select=doi,cited_by_count&filter=doi:"
       + "|".join(urllib.parse.quote(d, safe="/") for d in dois))
req = urllib.request.Request(url, headers={"User-Agent": "vishaljohn.com citations"})
results = json.load(urllib.request.urlopen(req, timeout=30)).get("results", [])
if not results:
    sys.exit("no results; keeping the existing file")

counts = {w["doi"].replace("https://doi.org/", "").lower(): w["cited_by_count"] for w in results if w.get("doi")}
out = {"source": "OpenAlex", "updated": datetime.date.today().isoformat(), "total": sum(counts.values()), "counts": counts}
with open(os.path.join(ROOT, "assets", "citations.json"), "w") as f:
    json.dump(out, f, indent=2)
    f.write("\n")
print(f"{out['total']} citations across {len(counts)} papers")
