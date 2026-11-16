#!/usr/bin/env python3
"""Looks for papers by Vishal that aren't on the Publications page yet.

Google Scholar has no public API, so this uses OpenAlex (which collects Crossref,
ORCID, PubMed and publisher records). Vishal's OpenAlex author profile(s) are found
from the papers already in assets/publications.json, so nothing needs configuring.

Run by the daily GitHub Action; run by hand with:  python3 tools/find-new-papers.py
- Keeps its state in assets/new-papers.json (candidates found, ones already reported,
  and an "ignore" list: add a DOI there to stop a paper from being suggested again).
- Writes new-papers.md when there's something new; the Action turns it into a GitHub
  issue with a ready-to-paste entry for assets/publications.json.
- Testing without the network: OPENALEX_FIXTURE=file.json (maps URL fragments to responses).
"""
import datetime, json, os, re, sys, urllib.parse, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
PUBS = os.path.join(ROOT, "assets", "publications.json")
STATE = os.path.join(ROOT, "assets", "new-papers.json")
REPORT = os.path.join(ROOT, "new-papers.md")
NAME = re.compile(r"\bvishal\b.*\bjohn\b", re.I)
API = "https://api.openalex.org/works"


def get(url):
    fixture = os.environ.get("OPENALEX_FIXTURE")
    if fixture:
        data = json.load(open(fixture))
        for frag, resp in data.items():
            if frag in url:
                return resp
        return {"results": []}
    req = urllib.request.Request(url, headers={"User-Agent": "vishaljohn.com publications check"})
    return json.load(urllib.request.urlopen(req, timeout=30))


def norm_doi(d):
    return (d or "").lower().replace("https://doi.org/", "").strip()


def norm_title(t):
    return re.sub(r"[^a-z0-9]+", " ", re.sub(r"<[^>]+>", "", (t or "").lower())).strip()


def short_name(display):
    """'Rebecca W. Gao' -> 'Gao RW'"""
    parts = re.sub(r"[.,]", " ", display or "").split()
    if len(parts) < 2:
        return display or ""
    return parts[-1] + " " + "".join(p[0].upper() for p in parts[:-1])


def entry_for(w, me):
    """A suggested assets/publications.json entry (Vishal checks it before adding)."""
    authors = []
    first = False
    for i, a in enumerate(w.get("authorships") or []):
        aid = (a.get("author") or {}).get("id", "")
        name = short_name((a.get("author") or {}).get("display_name", ""))
        if aid in me or NAME.search((a.get("author") or {}).get("display_name", "")):
            name = "**" + name + "**"
            first = first or i == 0
        authors.append(name)
    if len(authors) > 8:
        mine = [i for i, a in enumerate(authors) if a.startswith("**")]
        keep = sorted(set([0, 1, 2, len(authors) - 1] + mine))
        out, prev = [], -1
        for i in keep:
            if i - prev > 1:
                out.append("…")
            out.append(authors[i])
            prev = i
        authors = out
    src = ((w.get("primary_location") or {}).get("source") or {})
    b = w.get("biblio") or {}
    date = w.get("publication_date") or ""
    try:
        when = datetime.date.fromisoformat(date).strftime("%b %Y")
    except ValueError:
        when = str(w.get("publication_year") or "")
    detail = when
    if b.get("volume"):
        detail += f", Vol {b['volume']}" + (f"({b['issue']})" if b.get("issue") else "")
    if b.get("first_page"):
        detail += f", pp {b['first_page']}" + (f"-{b['last_page']}" if b.get("last_page") and b["last_page"] != b["first_page"] else "")
    doi = norm_doi(w.get("doi"))
    return {
        "year": w.get("publication_year"),
        "title": re.sub(r"<[^>]+>", "", w.get("title") or ""),
        "authors": ", ".join(authors) + ".",
        "journal": src.get("display_name") or "",
        "year_detail": detail,
        "doi": doi,
        "url": "https://doi.org/" + doi,
        "abstract": "",
        "plain": "",
        "kid": "",
        "role": "first" if first else "co-author",
        "highlight": first,
    }


def main():
    pubs = json.load(open(PUBS))["data"]
    known_dois = {norm_doi(p.get("doi")) for p in pubs if p.get("doi")}
    known_titles = {norm_title(p.get("title")) for p in pubs}
    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    old = json.dumps(state, sort_keys=True)
    ignore = {norm_doi(d) for d in state.get("ignore", [])}
    notified = {norm_doi(d) for d in state.get("notified", [])}

    # 1. Vishal's OpenAlex author id(s), from papers already on the site
    me = set(state.get("authors", []))
    if known_dois:
        q = API + "?per-page=50&select=doi,authorships&filter=doi:" + "|".join(urllib.parse.quote(d, safe="/") for d in sorted(known_dois))
        for w in get(q).get("results", []):
            for a in w.get("authorships") or []:
                au = a.get("author") or {}
                if au.get("id") and NAME.search(au.get("display_name") or ""):
                    me.add(au["id"])
    if not me:
        sys.exit("couldn't find Vishal's author profile; keeping the existing file")

    # 2. every work under those ids, newest first
    ids = "|".join(sorted(i.rsplit("/", 1)[-1] for i in me))
    q = API + "?per-page=100&sort=publication_date:desc&select=doi,title,publication_year,publication_date,type,primary_location,authorships,biblio&filter=author.id:" + ids
    works = get(q).get("results", [])

    # 3. anything with a DOI that isn't on the page yet (and isn't ignored)
    candidates = []
    for w in works:
        doi = norm_doi(w.get("doi"))
        if not doi or doi in known_dois or doi in ignore or norm_title(w.get("title")) in known_titles:
            continue
        if (w.get("type") or "") in ("paratext", "erratum", "retraction", "peer-review"):
            continue
        candidates.append(entry_for(w, me))

    new = [c for c in candidates if c["doi"] not in notified]
    state.update({
        "_about": "Papers OpenAlex lists for Vishal that aren't in publications.json. Add a DOI to 'ignore' to stop suggesting it.",
        "authors": sorted(me),
        "candidates": candidates,
        "notified": sorted(notified | {c["doi"] for c in new}),
        "ignore": sorted(ignore),
    })
    if json.dumps(state, sort_keys=True) != old:
        with open(STATE, "w") as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
            f.write("\n")

    if new:
        lines = [f"OpenAlex lists {len(new)} paper(s) by you that aren't on the Publications page yet.", "",
                 "**To add one:** check it's really yours, paste its entry into the `data` list in `assets/publications.json`, "
                 "fill in `abstract`, `plain` and `kid` (the three \"Explain it like I'm…\" levels), then run `python3 tools/build.py` "
                 "and `./tools/build-cv-pdf.sh`. **Not yours?** Add its DOI to the `ignore` list in `assets/new-papers.json`.", ""]
        for c in new:
            lines += [f"### {c['title']}", f"{c['journal']} · {c['year_detail']} · https://doi.org/{c['doi']}", "",
                      "```json", json.dumps(c, indent=2, ensure_ascii=False), "```", ""]
        open(REPORT, "w").write("\n".join(lines))
    elif os.path.exists(REPORT):
        os.remove(REPORT)
    print(f"{len(works)} works under {len(me)} profile(s); {len(candidates)} not on the page; {len(new)} new")


if __name__ == "__main__":
    main()
