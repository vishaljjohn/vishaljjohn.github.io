#!/usr/bin/env python3
"""Looks for papers by Vishal that aren't on the Publications page yet.

Google Scholar has no public API, so this uses OpenAlex (which collects Crossref,
ORCID, PubMed and publisher records). Vishal's OpenAlex author profile(s) are found
from the papers already in assets/publications.json, so nothing needs configuring.

Run by the daily GitHub Action; run by hand with:  python3 tools/find-new-papers.py
- Keeps its state in assets/new-papers.json (candidates found, ones already reported,
  and an "ignore" list: add a DOI there to stop a paper from being suggested again).
- Writes new-papers.md when there's something new; the Action turns it into a GitHub
  issue with a ready-to-paste entry for assets/publications.json, then runs this again
  with --mark so the same papers aren't reported twice (only once the issue exists).
- Skips supplementary files (Table S1..., Supplementary Data...), duplicate copies, and
  anything already in assets/presentations.json (posters/talks).
- Testing without the network: OPENALEX_FIXTURE=file.json (maps URL fragments to responses).
"""
import datetime, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
PUBS = os.path.join(ROOT, "assets", "publications.json")
PRES = os.path.join(ROOT, "assets", "presentations.json")
STATE = os.path.join(ROOT, "assets", "new-papers.json")
NEWLIST = os.path.join(ROOT, "new-papers.dois")
SUPPLEMENT = re.compile(r"^(supplementary|supplemental|table|figure|fig\.?|data|dataset|video|movie|appendix)\b[^.]{0,40}\bfrom\b", re.I)
SESSION_CODE = re.compile(r"^\s*([A-Z]{2,6}-\d+\.|abstract\s+\d+:|[A-Z]{1,4}\d{1,4}[.:])\s*", re.I)
KEEP_TYPES = {"article", "review", "letter", "preprint", "book-chapter", "editorial", "report", "conference-abstract"}
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
    for attempt in range(5):   # OpenAlex rate-limits busy moments; back off and retry
        try:
            return json.load(urllib.request.urlopen(req, timeout=30))
        except urllib.error.HTTPError as e:
            if e.code not in (429, 500, 502, 503) or attempt == 4:
                raise
            time.sleep(2 ** attempt * 3)


def norm_doi(d):
    return (d or "").lower().replace("https://doi.org/", "").strip()


def norm_title(t):
    t = SESSION_CODE.sub("", re.sub(r"<[^>]+>", "", t or ""))   # "PATH-39. Title" / "Abstract 2115: Title"
    return re.sub(r"[^a-z0-9]+", " ", t.lower()).strip()


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


def mark_notified():
    """After the Action has opened the issue: remember the reported DOIs."""
    if not (os.path.exists(STATE) and os.path.exists(NEWLIST)):
        return
    state = json.load(open(STATE))
    new = [d.strip() for d in open(NEWLIST) if d.strip()]
    state["notified"] = sorted(set(state.get("notified", [])) | set(new))
    with open(STATE, "w") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)
        f.write("\n")
    os.remove(NEWLIST)
    print(f"marked {len(new)} as reported")


def main():
    pubs = json.load(open(PUBS))["data"]
    pres = json.load(open(PRES))["data"] if os.path.exists(PRES) else []
    known_dois = {norm_doi(p.get("doi")) for p in pubs + pres if p.get("doi")}
    known_titles = {norm_title(p.get("title")) for p in pubs + pres}
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
    candidates, seen, abstracts = [], set(), set()
    for w in works:
        doi, title = norm_doi(w.get("doi")), w.get("title") or ""
        nt = norm_title(title)
        if not doi or doi in known_dois or doi in ignore or not nt or nt in known_titles or nt in seen:
            continue
        if (w.get("type") or "article") not in KEEP_TYPES or SUPPLEMENT.search(title):
            continue   # supplementary tables/figures/data files, errata, datasets
        seen.add(nt)
        if w.get("type") == "conference-abstract" or SESSION_CODE.match(title):
            abstracts.add(doi)
        candidates.append(entry_for(w, me))

    new = [c for c in candidates if c["doi"] not in notified]
    state.update({
        "_about": "Papers OpenAlex lists for Vishal that aren't in publications.json or presentations.json. Add a DOI to 'ignore' to stop suggesting it.",
        "authors": sorted(me),
        "candidates": candidates,
        "notified": sorted(notified & {c["doi"] for c in candidates} | (notified & ignore)),
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
            kind = " _(conference abstract: if it was a poster or talk, it belongs in `assets/presentations.json`)_" if c["doi"] in abstracts else ""
            block = [f"### {c['title']}", f"{c['journal'] or 'Unknown venue'} · {c['year_detail']} · https://doi.org/{c['doi']}{kind}", "",
                     "```json", json.dumps(c, indent=2, ensure_ascii=False), "```", ""]
            if sum(len(l) + 1 for l in lines + block) > 60000:   # GitHub issues max out at 65,536 characters
                lines += [f"…and {len(new) - new.index(c)} more; see `candidates` in `assets/new-papers.json`."]
                break
            lines += block
        open(REPORT, "w").write("\n".join(lines))
        open(NEWLIST, "w").write("\n".join(c["doi"] for c in new) + "\n")
    else:
        for f in (REPORT, NEWLIST):
            if os.path.exists(f):
                os.remove(f)
    print(f"{len(works)} works under {len(me)} profile(s); {len(candidates)} not on the page; {len(new)} new")


if __name__ == "__main__":
    mark_notified() if "--mark" in sys.argv else main()
