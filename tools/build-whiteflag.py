#!/usr/bin/env python3
"""Builds owensborowhiteflag.html (the Owensboro White Flag & Help Finder page).

All page text lives here in English and Spanish side by side, so the two languages
never drift apart. The output is one self-contained static HTML file (inline CSS + JS).
Run:  python3 tools/build-whiteflag.py

Resource data (names, phones, addresses, hours) was given by Vishal and checked
November 24, 2026. Do not add or "update" any of it without a new source.
"""
import html, os, urllib.parse

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "owensborowhiteflag.html")
SLIDES_URL = "https://docs.google.com/presentation/d/1kFXJc5pKz9Hmx5x_nM2Qyy9G5l_AaRftVsr3X1_YhbY/edit?usp=sharing"
PDF = "assets/owensboro/staying-warm-and-safe-slides.pdf"


def esc(s):
    return html.escape(s, quote=True)


def t(en, es, tag="span", cls="", extra=""):
    """An element whose content switches language. English is the default content."""
    c = f' class="{cls}"' if cls else ""
    return f'<{tag}{c}{extra} data-es="{esc(es)}">{en}</{tag}>'


def maps(query):
    return "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote_plus(query + ", Owensboro, KY")


def tel(num):
    d = "".join(ch for ch in num if ch.isdigit())
    if len(d) == 3:
        return "tel:" + d
    if len(d) == 11 and d.startswith("1"):
        return "tel:+" + d
    return "tel:+1" + d


def icon(name, cls="ic"):
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#i-{name}"></use></svg>'


# ---------------------------------------------------------------- icons (Feather-style, MIT)
ICONS = {
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "text": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    "pin": '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    "flag": '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    "therm": '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
    "alert": '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    "share": '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    "file": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    "ext": '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    "home": '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    "food": '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
    "health": '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    "steps": '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    "grid": '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    "drop": '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
    "layers": '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    "hat": '<path d="M5 16a7 7 0 0 1 14 0"/><rect x="4" y="16" width="16" height="4" rx="1"/><circle cx="12" cy="5.5" r="1.8"/>',
    "cup": '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><line x1="7" y1="2" x2="7" y2="5"/><line x1="11" y1="2" x2="11" y2="5"/>',
    "wine": '<path d="M8 22h8"/><path d="M12 15v7"/><path d="M5 3h14l-1 6a6 6 0 0 1-12 0z"/>',
    "snow": '<line x1="12" y1="2" x2="12" y2="22"/><line x1="4.93" y1="7" x2="19.07" y2="17"/><line x1="19.07" y1="7" x2="4.93" y2="17"/><polyline points="9 4 12 7 15 4"/><polyline points="9 20 12 17 15 20"/>',
    "bus": '<rect x="4" y="3" width="16" height="15" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="8" y1="21" x2="8" y2="18"/><line x1="16" y1="21" x2="16" y2="18"/><circle cx="8" cy="14.5" r="1"/><circle cx="16" cy="14.5" r="1"/>',
    "users": '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "paw": '<circle cx="5.5" cy="10" r="2"/><circle cx="9.5" cy="5.5" r="2"/><circle cx="14.5" cy="5.5" r="2"/><circle cx="18.5" cy="10" r="2"/><path d="M12 12c-3 0-5.5 3.5-5.5 6 0 1.7 1.3 2.5 2.8 2.5 1.2 0 1.7-.6 2.7-.6s1.5.6 2.7.6c1.5 0 2.8-.8 2.8-2.5 0-2.5-2.5-6-5.5-6z"/>',
    "refresh": '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    "check": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    "info": '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    "speaker": '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    "stop": '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    "mail": '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
}
SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + "".join(
    f'<symbol id="i-{k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{v}</symbol>'
    for k, v in ICONS.items()) + "</defs></svg>"


# ---------------------------------------------------------------- resource data (verified; do not edit without a source)
# phones: list of (number, en_label, es_label); a label of "" shows just the number.
CATS = [
    ("shelter", "home", "Shelter", "Refugio", "A safe place to sleep", "Un lugar seguro para dormir", [
        dict(n="Daniel Pitino Shelter", d=("Single women &amp; families. White Flag site for everyone.", "Mujeres solas y familias. Sitio de White Flag para todos."),
             a="501 Walnut St.", p=[("270-688-9000", "", "")]),
        dict(n="CrossRoads Shelter", d=("Women &amp; children. Overnight, 7 PM–6:30 AM.", "Mujeres y niños. De noche, de 7 p. m. a 6:30 a. m."),
             a="1631 Breckenridge St.", p=[("270-240-2773", "", "")]),
        dict(n="My Sister's Keeper", d=("Overnight shelter for women &amp; children.", "Refugio de noche para mujeres y niños."),
             a="2820 W. 4th St.", p=[("270-925-3032", "", "")]),
        dict(n="St. Benedict's Women &amp; Family Day Shelter", d=("Monday–Friday, 8 AM–noon.", "Lunes a viernes, de 8 a. m. a mediodía."),
             a="905 Hickman Ave.", p=[("270-541-1003", "", "")]),
        dict(n="St. Benedict's Men's Shelter", d=("Open 24 hours.", "Abierto las 24 horas."),
             a="1001 W. 7th St.", p=[("270-541-1003", "", "")]),
        dict(n="St. Gerard Maternal Home", d=("Free housing for pregnant women 18 and older. You can stay up to 3 months after birth.", "Vivienda gratis para mujeres embarazadas de 18 años o más. Puedes quedarte hasta 3 meses después del parto."),
             p=[("270-216-5910", "", "")]),
    ]),
    ("food", "food", "Food", "Comida", "Food &amp; everyday needs", "Comida y cosas del día a día", [
        dict(n=("Free hot meals", "Comidas calientes gratis"), d=("Churches serve a meal almost every day. The “Feeding Owensboro” Facebook page posts the calendar. Or call 211.", "Las iglesias sirven una comida casi todos los días. La página de Facebook “Feeding Owensboro” publica el calendario. O llama al 211."),
             p=[("211", "", "")]),
        dict(n=("New Life Church community meal", "Comida comunitaria de New Life Church"), d=("Free, Tuesdays at 5 PM.", "Gratis, los martes a las 5 p. m."), nophone=True),
        dict(n="Third Baptist Church", d=("Evening meals and a Blessing Box. Thursdays: showers and daytime rest. Across from the bus station.", "Cenas y una Blessing Box (caja de donaciones). Los jueves: duchas y descanso durante el día. Frente a la estación de autobuses."),
             p=[("270-683-0269", "", "")]),
        dict(n="Help Office", d=("Food pantry Mon, Tue, Thu, Fri, 9 AM–noon. Clothes. Help with utilities and rent.", "Despensa de comida lun., mar., jue. y vie., de 9 a. m. a mediodía. Ropa. Ayuda con servicios (luz, agua, gas) y renta."),
             a="1316 W. 4th St.", p=[("270-685-4971", "", "")]),
        dict(n="Salvation Army", d=("Food pantry Tuesday &amp; Thursday (bring ID). Clothing help.", "Despensa de comida martes y jueves (trae tu identificación). Ayuda con ropa."),
             a="Ewing Rd.", p=[("270-685-5576", "", "")]),
        dict(n="St. Vincent de Paul", d=("Help with basic needs and bills.", "Ayuda con necesidades básicas y cuentas."),
             a="1205 W. 9th St.", p=[("270-683-0062", "", "")]),
        dict(n=("First Christian Church pantry", "Despensa de First Christian Church"), d=("Monday–Thursday, 9 AM–noon &amp; 1–3 PM.", "Lunes a jueves, de 9 a. m. a mediodía y de 1 a 3 p. m."),
             a="700 J.R. Miller Blvd.", p=[("270-684-8879", "", "")]),
        dict(n=("SPARKY pet food pantry", "SPARKY: despensa de comida para mascotas"), d=("Food for your pet.", "Comida para tu mascota."),
             a="1004 E. 18th St.", p=[("270-684-4787", "", "")]),
    ]),
    ("health", "health", "Health", "Salud", "Health care, even without insurance", "Atención médica, aunque no tengas seguro", [
        dict(n="Audubon Area Community Care Clinic", d=("Health care for people without stable housing. Insurance or not. Fees based on income. A clinic is inside the Pitino Shelter.", "Atención médica para personas sin vivienda estable. Con o sin seguro. El costo depende de tus ingresos. Hay una clínica dentro del Pitino Shelter."),
             p=[("270-686-6040", "", "")]),
        dict(n="Health First Community Health Center", d=("Doctor visits &amp; counseling. Uninsured welcome. Fees based on income. Walk-ins OK.", "Consultas médicas y consejería. Bienvenidos sin seguro. El costo depende de tus ingresos. Puedes llegar sin cita."),
             a="2816 Veach Rd., Suite 205", p=[("270-926-9821", "", "")]),
        dict(n="Green River District Health Department", d=("Shots (including flu) and public health services.", "Vacunas (incluida la de la gripe) y servicios de salud pública."),
             a="1501 Breckenridge St.", p=[("270-686-7747", "", "")]),
        dict(n="Community Dental Clinic", d=("Dental care for low-income families. The Help Office also has dental vouchers.", "Atención dental para familias de bajos ingresos. La Help Office también tiene vales dentales."),
             a="2811 New Hartford Rd.", p=[("270-691-6205", "", "")]),
        dict(n=("Free glasses (Audubon Area Community Services)", "Lentes gratis (Audubon Area Community Services)"), d=("You need an eye exam from the past year.", "Necesitas un examen de la vista del último año."),
             a="1800 W. 4th St.", p=[("270-852-6506", "", "")]),
        dict(n=("Medicaid &amp; SNAP (food stamps)", "Medicaid y SNAP (cupones de alimentos)"), d=("Apply through DCBS.", "Solicítalos a través de DCBS."),
             a="3649 Wathen's Crossing", p=[("855-306-8959", "", "")]),
    ]),
    ("safety", "shield", "Safety &amp; Support", "Seguridad y apoyo", "Safety &amp; support", "Seguridad y apoyo", [
        dict(n=("Emergency", "Emergencia"), d=("If someone is hurt or in danger right now.", "Si alguien está herido o en peligro ahora mismo."),
             p=[("911", "", "")], urgent=True),
        dict(n=("988 Suicide &amp; Crisis Lifeline", "988 Línea de Prevención del Suicidio y Crisis"), d=("Free, 24/7. Call or text 988. Veterans, press 1.", "Gratis, 24/7. Llama o envía un mensaje de texto al 988. Veteranos: marquen 1."),
             p=[("988", "", "")], sms="988"),
        dict(n="OASIS", d=("Confidential shelter and help if you're not safe at home or with a partner. Address kept private for safety.", "Refugio y ayuda confidencial si no estás a salvo en casa o con tu pareja. La dirección es privada por seguridad."),
             p=[("270-685-0260", "", "")]),
        dict(n="New Beginnings", d=("Sexual assault support. Free &amp; confidential counseling.", "Apoyo después de una agresión sexual. Consejería gratis y confidencial."),
             p=[("1-800-226-7273", "24-hour crisis line", "Línea de crisis 24 horas"), ("270-926-7278", "Office", "Oficina")]),
        dict(n="RiverValley Behavioral Health", d=("Mental health &amp; substance use care.", "Atención de salud mental y uso de sustancias."),
             a="1100 Walnut St.", p=[("270-689-6500", "", "")]),
        dict(n="The Gathering Pointe", d=("Drop-in recovery center with peer support. Daily, 8 AM–8 PM. Walk-ins welcome.", "Centro de recuperación con apoyo de compañeros. Todos los días, de 8 a. m. a 8 p. m. Puedes llegar sin cita."),
             a="400 E. 4th St.", p=[("270-632-0622", "", "")]),
        dict(n="Heart &amp; Soul Sisters", d=("Women's support group, snacks provided. 1st &amp; 3rd Mondays at 1 PM, at The Gathering Pointe. All women welcome.", "Grupo de apoyo para mujeres, con bocadillos. 1.er y 3.er lunes a la 1 p. m., en The Gathering Pointe. Todas las mujeres son bienvenidas."),
             nophone=True),
    ]),
    ("next", "steps", "Next Steps", "Próximos pasos", "Next steps", "Próximos pasos", [
        dict(n="Welcome House", d=("Housing help, rent &amp; utility help, case management.", "Ayuda con vivienda, renta y servicios, y manejo de casos."),
             a="400 Crabtree Ave.", p=[("270-938-5309", "", "")]),
        dict(n="Housing Authority of Owensboro", d=("Public &amp; affordable housing. Ask about the waitlist.", "Vivienda pública y económica. Pregunta por la lista de espera."),
             a="2161 E. 19th St., Suite A", p=[("270-683-5365", "", "")]),
        dict(n="Kentucky Career Center", d=("Free job search, résumé &amp; training help.", "Ayuda gratis para buscar trabajo, hacer tu currículum y capacitarte."),
             a="3108 Fairview Dr.", p=[("270-687-7297", "", "")]),
        dict(n="Kentucky Legal Aid", d=("Free civil legal help (housing, benefits, family).", "Ayuda legal civil gratis (vivienda, beneficios, familia)."),
             a="117 W. 2nd St.", p=[("270-683-4585", "", "")]),
        dict(n=("Free phone (Lifeline)", "Teléfono gratis (Lifeline)"), d=("Free or low-cost phone service if you get Medicaid or SNAP. Ask 211 how to apply.", "Servicio de teléfono gratis o a bajo costo si recibes Medicaid o SNAP. Pregunta al 211 cómo solicitarlo."),
             p=[("211", "", "")]),
        dict(n=("Matthew's Table free bus passes", "Pases de autobús gratis de Matthew's Table"), d=("2nd Saturday of each month, 10 AM.", "2.º sábado de cada mes, a las 10 a. m."),
             a="100 W. 23rd St.", p=[("270-483-3086", "", "")]),
        dict(n=("Free GED (KCTCS SkillTrain)", "GED gratis (KCTCS SkillTrain)"), d=("Earn your GED for free.", "Obtén tu GED gratis."),
             p=[("270-686-4454", "", "")]),
        dict(n=("Owensboro VA Clinic (veterans)", "Owensboro VA Clinic (veteranos)"), d=("Health care for veterans.", "Atención médica para veteranos."),
             a="2060 E. Parrish Ave.", p=[("270-684-5034", "", "")]),
    ]),
]


def plain(s):
    return html.unescape(s).replace("’", "'")


def resource_card(cat, r):
    name = r["n"]
    name_en, name_es = (name if isinstance(name, tuple) else (name, name))
    out = [f'<article class="res{" res-urgent" if r.get("urgent") else ""}" data-cat="{cat}">']
    out.append(t(name_en, name_es, "h4", "res-name") if name_en != name_es else f'<h4 class="res-name">{name_en}</h4>')
    out.append(t(r["d"][0], r["d"][1], "p", "res-desc"))
    if r.get("a"):
        q = plain(name_en) + ", " + r["a"] if not name_en.startswith(("Free", "Medicaid")) else r["a"]
        out.append(f'<p class="res-addr">{icon("pin")}<a href="{esc(maps(q))}" target="_blank" rel="noopener" '
                   f'aria-label="{esc("Map: " + r["a"] + " (opens in a new tab)")}" data-es-aria="{esc("Mapa: " + r["a"] + " (se abre en otra pestaña)")}">{r["a"]}</a></p>')
    btns = []
    for num, len_, les in r.get("p", []):
        who = plain(name_en)
        who_es = plain(name_es)
        aria_en = f"Call {who}" + (f", {plain(len_)}" if len_ else "") + f": {num}"
        aria_es = f"Llamar a {who_es}" + (f", {plain(les)}" if les else "") + f": {num}"
        lab = (f'<span class="lbl" data-es="{esc(les)}">{len_}</span>' if len_ else "")
        btns.append(f'<a class="btn-call{" btn-911" if num == "911" else ""}" href="{tel(num)}" aria-label="{esc(aria_en)}" data-es-aria="{esc(aria_es)}">'
                    f'{icon("phone")}<span class="btxt">{lab}<span class="num">{num}</span></span></a>')
    if r.get("sms"):
        btns.append(f'<a class="btn-call btn-ghost" href="sms:{r["sms"]}" aria-label="Text {r["sms"]}" data-es-aria="Enviar texto al {r["sms"]}">'
                    f'{icon("text")}<span class="btxt">{t("Text", "Texto")} <span class="num">{r["sms"]}</span></span></a>')
    if r.get("nophone"):
        btns.append(t("No phone listed", "Sin teléfono", "span", "nophone"))
    out.append('<div class="res-actions">' + "".join(btns) + "</div>")
    out.append("</article>")
    return "".join(out)


# ---------------------------------------------------------------- strings used by the script (dynamic text)
JS_STRINGS = {
    "en": {
        "title": "Owensboro White Flag & Help Finder | Vishal John",
        "loading": "Checking tonight's forecast…",
        "red": "White Flag likely tonight",
        "amber": "Borderline — check before 4 PM",
        "green": "White Flag not likely tonight",
        "season": "White Flag season runs November 1 through March 31.",
        "low": "Coldest tonight: feels like <strong>{t}°F</strong> around {time}.",
        "lowOff": "Coldest tonight: feels like {t}°F around {time}.",
        "updated": "Forecast updated {time}.",
        "windowNight": "Tonight, 6 PM to 7 AM",
        "windowLate": "Now until 7 AM",
        "fail": "Can't load the forecast right now. Call or text <a href=\"tel:211\">211</a>, or call the shelter at <a href=\"tel:+12706889000\">270-688-9000</a>.",
        "retry": "Try again",
        "hourly": "See tonight hour by hour",
        "feels": "feels like",
        "redHint": "The Daniel Pitino Shelter, 501 Walnut St., opens at 6 PM on White Flag nights.",
        "amberHint": "It may be close to the White Flag line. Call or text 211, or call 270-688-9000, after 4 PM.",
        "greenHint": "The forecast is above freezing. Shelters on this page are still open on their usual schedule.",
        "copied": "Link copied",
        "share": "Share this page",
        "shareText": "White Flag shelter status and free help in Owensboro, KY",
        "outlook": "Next few nights",
        "outlookNote": "Forecasts change. Check again each day.",
        "o_red": "Likely", "o_amber": "Borderline", "o_green": "Not likely", "o_off": "Off season",
        "alertUntil": "until {time}",
        "alertFrom": "Weather alert from the National Weather Service",
        "savedNote": "No connection right now. Showing the forecast saved {time}.",
        "coldest": "(coldest hour)", "nightOf": "Night of",
        "read": "Read out loud", "stopRead": "Stop reading", "bigText": "A+ Larger text", "bigTextOff": "Normal text",
        "live": "{title}. {detail}",
    },
    "es": {
        "title": "White Flag y guía de ayuda en Owensboro | Vishal John",
        "loading": "Revisando el pronóstico de esta noche…",
        "red": "Es probable que haya White Flag esta noche",
        "amber": "Casi en el límite: confirma antes de las 4 p. m.",
        "green": "No es probable que haya White Flag esta noche",
        "season": "La temporada de White Flag va del 1 de noviembre al 31 de marzo.",
        "low": "Lo más frío esta noche: se sentirá como <strong>{t}°F</strong> alrededor de {time}.",
        "lowOff": "Lo más frío esta noche: se sentirá como {t}°F alrededor de {time}.",
        "updated": "Pronóstico actualizado: {time}.",
        "windowNight": "Esta noche, de 6 p. m. a 7 a. m.",
        "windowLate": "Desde ahora hasta las 7 a. m.",
        "fail": "No se puede cargar el pronóstico ahora. Llama o envía un mensaje de texto al <a href=\"tel:211\">211</a>, o llama al refugio al <a href=\"tel:+12706889000\">270-688-9000</a>.",
        "retry": "Intentar de nuevo",
        "hourly": "Ver esta noche hora por hora",
        "feels": "sensación",
        "redHint": "El Daniel Pitino Shelter, 501 Walnut St., abre a las 6 p. m. en noches de White Flag.",
        "amberHint": "Puede estar cerca del límite de White Flag. Llama o envía un texto al 211, o llama al 270-688-9000, después de las 4 p. m.",
        "greenHint": "El pronóstico está por encima del punto de congelación. Los refugios de esta página siguen abiertos en su horario normal.",
        "copied": "Enlace copiado",
        "share": "Compartir esta página",
        "shareText": "Estado del refugio White Flag y ayuda gratis en Owensboro, KY",
        "outlook": "Las próximas noches",
        "outlookNote": "Los pronósticos cambian. Revisa otra vez cada día.",
        "o_red": "Probable", "o_amber": "En el límite", "o_green": "No probable", "o_off": "Fuera de temporada",
        "alertUntil": "hasta {time}",
        "alertFrom": "Alerta del Servicio Nacional de Meteorología (National Weather Service)",
        "savedNote": "Sin conexión ahora. Mostrando el pronóstico guardado: {time}.",
        "coldest": "(la hora más fría)", "nightOf": "Noche del",
        "read": "Escuchar en voz alta", "stopRead": "Dejar de leer", "bigText": "A+ Letra más grande", "bigTextOff": "Letra normal",
        "live": "{title}. {detail}",
    },
}


def build():
    import json
    nav = [("index_classic.html", "Home", "Inicio"), ("pages/about.html", "About Me", "Sobre mí"),
           ("pages/blog.html", "Newsletter", "Boletín"), ("pages/publications.html", "Publications", "Publicaciones"),
           ("pages/guestbook.html", "Leave Me A Note", "Déjame una nota"), ("pages/contact.html", "Contact", "Contacto")]
    nav_html = "".join(f'<li><a href="{h}" data-es="{esc(es)}">{en}</a></li>' for h, en, es in nav)

    filters = [("all", "grid", "All", "Todo")] + [(c[0], c[1], c[2], c[3]) for c in CATS]
    filter_html = "".join(
        f'<button type="button" class="chip{" on" if k == "all" else ""}" data-filter="{k}" aria-pressed="{"true" if k == "all" else "false"}">'
        f'{icon(ic)}{t(en, es)}</button>' for k, ic, en, es in filters)

    groups = []
    for key, ic, _f_en, _f_es, h_en, h_es, items in CATS:
        cards = "".join(resource_card(key, r) for r in items)
        groups.append(f'<section class="group" data-cat="{key}" aria-labelledby="g-{key}">'
                      f'<h3 class="group-h" id="g-{key}"><span class="group-ic">{icon(ic)}</span>{t(h_en, h_es)}</h3>'
                      f'<div class="res-grid">{cards}</div></section>')

    facts = [
        ("pin", ("Where", "Dónde"),
         f'<p><strong>Daniel Pitino Shelter</strong><br>501 Walnut St., Owensboro</p>'
         f'<div class="fact-actions"><a class="btn-call" href="tel:+12706889000" aria-label="Call Daniel Pitino Shelter: 270-688-9000" data-es-aria="Llamar a Daniel Pitino Shelter: 270-688-9000">{icon("phone")}<span class="btxt"><span class="num">270-688-9000</span></span></a>'
         f'<a class="btn-ghost-link" href="{esc(maps("Daniel Pitino Shelter, 501 Walnut St."))}" target="_blank" rel="noopener">{icon("pin")}{t("Directions", "Cómo llegar")}{t(" (opens in a new tab)", " (se abre en otra pestaña)", "span", "sr")}</a></div>'),
        ("clock", ("When", "Cuándo"),
         t("<strong>6 PM to 7 AM</strong>, only on White Flag nights. Open to men, women, and children.",
           "<strong>De 6 p. m. a 7 a. m.</strong>, solo en noches de White Flag. Abierto para hombres, mujeres y niños.", "p")),
        ("therm", ("When it's called", "Cuándo se activa"),
         t("When the National Weather Service forecasts <strong>32°F or below</strong>, counting wind chill. Season: Nov 1 – Mar 31.",
           "Cuando el National Weather Service (Servicio Nacional de Meteorología) pronostica <strong>32°F o menos</strong>, contando el viento. Temporada: 1 de nov. – 31 de mar.", "p")),
        ("bus", ("Free bus", "Autobús gratis"),
         t("Owensboro Transit gives <strong>free rides</strong> to the shelter Monday–Friday, 4–6 PM, on White Flag nights. Tell the driver you're going to White Flag. The shelter does not provide rides.",
           "Owensboro Transit da <strong>viajes gratis</strong> al refugio de lunes a viernes, de 4 a 6 p. m., en noches de White Flag. Dile al chofer que vas a White Flag. El refugio no ofrece transporte.", "p")),
        ("users", ("If Pitino is full", "Si Pitino está lleno"),
         t("Other participating shelters take overflow.", "Otros refugios participantes reciben a más personas.", "p")),
        ("paw", ("Pets", "Mascotas"),
         t("Last winter, pets could stay overnight in a heated space on White Flag nights. Ask shelter staff if this is available this year.",
           "El invierno pasado, las mascotas podían pasar la noche en un espacio con calefacción en noches de White Flag. Pregunta al personal del refugio si esto está disponible este año.", "p")),
    ]
    facts_html = "".join(
        f'<div class="fact"><div class="fact-ic">{icon(ic)}</div><div class="fact-body">{t(h[0], h[1], "h3", "fact-h")}{body}</div></div>'
        for ic, h, body in facts)

    def bullets(items):
        return "<ul>" + "".join(t(en, es, "li") for en, es in items) + "</ul>"

    guide = [
        ("drop", ("Stay dry", "Mantente seco"), [
            ("Wet clothes, especially cotton like jeans and sweatshirts, pull heat from your body.", "La ropa mojada, sobre todo la de algodón como jeans y sudaderas, le quita el calor a tu cuerpo."),
            ("Change into dry clothes as soon as you can.", "Cámbiate a ropa seca lo antes posible.")]),
        ("layers", ("Wear layers", "Usa capas"), [
            ("Several thin layers trap heat better than one big coat.", "Varias capas delgadas guardan el calor mejor que un abrigo grande."),
            ("Take one off before you sweat.", "Quítate una capa antes de sudar.")]),
        ("hat", ("Cover your head, hands &amp; feet", "Cubre tu cabeza, manos y pies"), [
            ("Keep a spare pair of socks in a plastic bag in your backpack.", "Lleva un par de calcetines extra en una bolsa de plástico en tu mochila."),
            ("Swap them when your feet get damp.", "Cámbialos cuando se te mojen los pies.")]),
        ("food", ("Eat a little, often", "Come poquito y seguido"), [
            ("Your body burns more energy in the cold.", "Tu cuerpo gasta más energía en el frío."),
            ("No-cook snacks: peanut butter, nuts, trail mix, granola bars, pop-top cans of tuna, beans, or soup.", "Bocadillos que no hay que cocinar: mantequilla de maní (cacahuate), nueces, mezcla de frutos secos, barras de granola, latas abre-fácil de atún, frijoles o sopa.")]),
        ("cup", ("Drink water", "Toma agua"), [
            ("Drink water through the day, even if you're not thirsty.", "Toma agua durante el día, aunque no tengas sed."),
            ("Warm soup or warm drinks help.", "La sopa o las bebidas calientes ayudan.")]),
        ("wine", ("About alcohol", "Sobre el alcohol"), [
            ("It can make you feel warm, but your body actually loses heat faster.", "Puede hacerte sentir calor, pero en realidad tu cuerpo pierde calor más rápido."),
            ("On cold nights, try to stay inside or with someone you trust.", "En noches frías, trata de estar bajo techo o con alguien de confianza.")]),
    ]
    guide_html = "".join(
        f'<div class="tip"><div class="tip-ic">{icon(ic)}</div>{t(h[0], h[1], "h3", "tip-h")}{bullets(items)}</div>'
        for ic, h, items in guide)

    danger = [
        ("snow", ("Frostbite", "Congelación"),
         [("Numb fingers, toes, ears, or nose", "Dedos, orejas o nariz entumidos (sin sentir)"),
          ("Skin turns white, gray, or waxy", "La piel se pone blanca, gris o como de cera")],
         [("Warm slowly: armpits, or warm (not hot) water.", "Calienta despacio: en las axilas o con agua tibia (no caliente)."),
          ("Don't rub it, and don't hold it to a fire or space heater. Numb skin can burn without you feeling it.", "No la frotes ni la acerques al fuego o a un calentador. La piel entumida se puede quemar sin que lo sientas.")]),
        ("therm", ("Hypothermia", "Hipotermia"),
         [("Hard shivering, clumsy hands", "Temblar mucho, manos torpes"),
          ("Confusion, slurred speech, very sleepy", "Confusión, hablar arrastrando las palabras, mucho sueño")],
         [("Get inside.", "Entra a un lugar bajo techo."), ("Get out of wet clothes.", "Quítate la ropa mojada."),
          ("Warm the chest first, with blankets.", "Calienta primero el pecho, con cobijas.")]),
    ]
    danger_html = "".join(
        f'<div class="danger"><div class="danger-top">{icon(ic)}{t(h[0], h[1], "h3", "danger-h")}</div>'
        f'{t("Signs", "Señales", "p", "danger-lbl")}{bullets(signs)}{t("What to do", "Qué hacer", "p", "danger-lbl")}{bullets(todo)}</div>'
        for ic, h, signs, todo in danger)

    page = TEMPLATE
    for k, v in {
        "%%SPRITE%%": SPRITE, "%%FILTERS%%": filter_html, "%%GROUPS%%": "".join(groups),
        "%%FACTS%%": facts_html, "%%GUIDE%%": guide_html, "%%DANGER%%": danger_html,
        "%%STRINGS%%": json.dumps(JS_STRINGS, ensure_ascii=False), "%%SLIDES%%": SLIDES_URL, "%%PDF%%": PDF,
    }.items():
        page = page.replace(k, v)
    # icons used directly in the template
    for name in ICONS:
        page = page.replace("%%I:" + name + "%%", icon(name))
    open(OUT, "w").write(page)
    print("wrote", os.path.relpath(OUT, ROOT), len(page.encode()) // 1024, "KB")


TEMPLATE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "whiteflag-template.html")).read()

if __name__ == "__main__":
    build()
