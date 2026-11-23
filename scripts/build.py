#!/usr/bin/env python3
"""Render the portfolio from data/site.json.

    python3 scripts/build.py
    python3 scripts/build.py --check
"""

from __future__ import annotations

import html
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import quote

MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "site.json"

NAV = [
    ("profile", "Profile", "01_Profile/profile.html"),
    ("work", "Work", "02_Works/index.html"),
    ("thoughts", "Thoughts", "05_Thoughts/index.html"),
    ("personal", "Personal", "04_Personal/index.html"),
    ("contact", "Contact", "04_Contact/contact.html"),
]

FOOTER_LINES = [
    "鹿島建設株式会社/建築設計本部/デジタルデザイン統括グループ",
    "奥川航大 | Kota okugawa",
]


def esc(value: str) -> str:
    return html.escape(value or "", quote=True)


def href(from_file: str, target: str) -> str:
    if target.startswith(("http://", "https://", "mailto:", "#")):
        return target
    hash_part = ""
    path = target
    if "#" in target:
        path, hash_part = target.split("#", 1)
        hash_part = "#" + hash_part
    rel = os.path.relpath(path, start=str(Path(from_file).parent)).replace(os.sep, "/")
    return quote(rel, safe="/%") + hash_part


def placeholder(text: str) -> bool:
    return "【" in (text or "")


def excerpt(paragraphs: list[str], limit: int = 78) -> str:
    if not paragraphs:
        return ""
    text = paragraphs[0].lstrip("　").strip()
    if len(text) <= limit:
        return text
    cut = text[:limit]
    point = cut.rfind("。")
    if point >= 24:
        return cut[: point + 1]
    return cut.rstrip() + "…"


def up(label: str) -> str:
    safe = esc(label)
    return f'<span class="up"><span>{safe}</span><span aria-hidden="true">{safe}</span></span>'


def shot(from_file: str, src: str, alt: str, wide: bool = False) -> str:
    url = href(from_file, src)
    klass = "shot wide" if wide else "shot"
    return (
        f'<button type="button" class="{klass}" data-full="{esc(url)}" data-alt="{esc(alt)}">'
        f'<img src="{esc(url)}" alt="{esc(alt)}" loading="lazy" decoding="async">'
        f"</button>"
    )


MENU = [
    ("top", "00", "Top", "index.html"),
    ("profile", "01", "Profile", "01_Profile/profile.html"),
    ("work", "02", "Work", "02_Works/index.html"),
    ("thoughts", "03", "Thoughts", "05_Thoughts/index.html"),
    ("personal", "04", "Personal", "04_Personal/index.html"),
    ("contact", "05", "Contact", "04_Contact/contact.html"),
]


def icon_menu() -> str:
    return """<svg viewBox="0 0 24 24" aria-hidden="true">
<path class="nav-line" d="M4 7h16"/>
<path class="nav-line" d="M4 12h16"/>
<path class="nav-line" d="M4 17h16"/>
</svg>"""


def chrome(from_file: str, current: str | None) -> str:
    links = []
    for key, label, target in NAV:
        attrs = ' aria-current="page"' if key == current else ""
        links.append(f'<a href="{esc(href(from_file, target))}"{attrs}>{up(label)}</a>')
    home = href(from_file, "index.html")
    mark = href(from_file, "assets/mark.svg")
    sheet_links = []
    for key, number, label, target in MENU:
        attrs = ' aria-current="page"' if key == current else ""
        sheet_links.append(
            f'<li><a href="{esc(href(from_file, target))}"{attrs}><span class="no">{number}</span><span>{esc(label)}</span></a></li>'
        )
    mail = "mailto:okugawak@kajima.com"
    return (
        '<a class="skip" href="#content">本文へ</a>'
        '<header class="bar">'
        f'<a class="mark" href="{esc(home)}"><img src="{esc(mark)}" alt="" width="28" height="28"><span>Kota Okugawa</span></a>'
        f'<nav class="bar-nav" aria-label="サイト">{"".join(links)}</nav>'
        f'<button type="button" class="nav-toggle" aria-expanded="false" aria-controls="nav-sheet" aria-label="メニュー">{icon_menu()}</button>'
        "</header>"
        '<div class="nav-sheet" id="nav-sheet" hidden role="dialog" aria-modal="true" aria-labelledby="nav-sheet-title">'
        '<p class="nav-title" id="nav-sheet-title">Menu</p>'
        f'<nav aria-label="ページ"><ol>{"".join(sheet_links)}</ol>'
        '<div class="nav-foot">'
        f'<a href="{esc(mail)}">Mail</a>'
        '<a href="https://github.com/okkkkkkkun" target="_blank" rel="noopener noreferrer">GitHub</a>'
        "</div></nav></div>"
    )


def footer(from_file: str, site: dict) -> str:
    mail = site["email"]
    lines = "".join(f"<p>{esc(line)}</p>" for line in FOOTER_LINES)
    return (
        '<footer class="site-foot">'
        f"{lines}"
        f'<p>mail：<a href="mailto:{esc(mail)}">{esc(mail)}</a></p>'
        f'<p><a href="{esc(href(from_file, "brand/index.html"))}">ブランド案</a></p>'
        f'<p>{esc(site["copyright"])}</p>'
        "</footer>"
        '<dialog class="lightbox"><form method="dialog"><button type="submit">閉じる</button></form>'
        '<img alt=""></dialog>'
    )


def head(from_file: str, title: str, description: str, path: str) -> str:
    css = href(from_file, "assets/site.css")
    rounded_css = href(from_file, "assets/rounded.css")
    rounded_js = href(from_file, "assets/rounded.js")
    js = href(from_file, "assets/site.js")
    icon = href(from_file, "assets/favicon.svg")
    canonical = "https://kota-okugawa.com/" + path.lstrip("/")
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<meta name="theme-color" content="#161513">
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:image" content="https://kota-okugawa.com/assets/og.png">
<meta property="og:url" content="{esc(canonical)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{esc(canonical)}">
<link rel="icon" href="{esc(icon)}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&amp;family=Instrument+Sans:wght@500;600;700&amp;family=Zen+Kaku+Gothic+New:wght@400;500;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="{esc(css)}">
</head>
"""


def manuscript(text: str) -> str:
    if not text:
        return ""
    klass = "manuscript" if placeholder(text) else "lede"
    return f'<p class="{klass}">{esc(text)}</p>'


def pending_note(texts: list[str]) -> str:
    if any(placeholder(text) for text in texts):
        return '<p class="note">【 】の文は、まだ本人の原稿が入っていません。</p>'
    return ""


def profile_block(from_file: str, data: dict) -> str:
    profile = data["profile"]
    site = data["site"]
    rows = "".join(
        f'<li><b>{esc(item["year"])}</b><span>{esc(item["text"])}</span></li>'
        for item in profile["timeline"]
    )
    photos = "".join(
        shot(from_file, photo["src"], photo["alt"])
        for photo in profile["photos"]
    )
    portrait = href(from_file, profile["portrait"])
    return f"""
<section class="section" id="profile">
  <header class="sec-head">
    <p class="sec-no">01</p>
    <div>
      <p class="sec-en">Profile</p>
      <h2>プロフィール</h2>
    </div>
  </header>
  {pending_note([profile["intro"]])}
  <div class="profile-grid">
    <figure class="portrait"><img src="{esc(portrait)}" alt="{esc(site["nameJa"])}の写真"></figure>
    <div>
      {manuscript(profile["intro"])}
      <p class="lede">{esc(site["nameJa"])} / {esc(site["nameEn"])}</p>
      <section class="profile-history" aria-labelledby="career-heading">
      <div class="profile-history-head"><h2 id="career-heading">Career</h2><span>EDUCATION / WORK</span></div>
      <ol class="timeline">{rows}</ol>
    </section>
    <section class="profile-history profile-activities" aria-labelledby="activities-heading">
      <div class="profile-history-head"><h2 id="activities-heading">Activities</h2><span>SELECTED HISTORY</span></div>
      <p class="profile-history-empty">活動履歴は準備中</p>
    </section>
    </div>
  </div>
  <div class="photos">{photos}</div>
</section>
"""


def stamp(work: dict) -> tuple[int, int] | None:
    blob = " ".join(work.get("note") or [])
    found = re.search(r"([A-Za-z]{3,9})(?:\s*[-–]\s*[A-Za-z]+)?\s*,?\s*(20\d{2})", blob)
    if not found:
        return None
    month = MONTHS.get(found.group(1).lower()[:3], 0)
    return int(found.group(2)), month


def log_works(works: list[dict]) -> list[dict]:
    decorated = []
    for index, work in enumerate(works):
        when = stamp(work) or (0, 0)
        decorated.append((when[0], when[1], -index, work))
    decorated.sort(reverse=True)
    return [item[-1] for item in decorated]


def date_label(work: dict) -> str:
    when = stamp(work)
    if not when:
        return " · ".join(work.get("note") or [])
    return f"{when[0]}.{when[1]:02d}"


def work_rows(from_file: str, works: list[dict]) -> str:
    rows = []
    ordered = log_works(works)
    for index, work in enumerate(ordered, start=1):
        link = href(from_file, work["file"])
        thumb = href(from_file, work["thumb"]) if work.get("thumb") else ""
        note = " · ".join(work.get("note") or [])
        line = work.get("addresses") or excerpt(work.get("paragraphs") or [])
        line_class = "manuscript" if placeholder(line) else "excerpt"
        note_html = f'<p class="work-note">{esc(note)}</p>' if note else ""
        loading = "eager" if index <= 2 else "lazy"
        image = (
            f'<div class="frame"><img src="{esc(thumb)}" alt="" loading="{loading}" decoding="async"></div>'
            if thumb
            else ""
        )
        feature = " feature" if index == 1 else ""
        rows.append(
            f'''<article class="work-row{feature}">
  <a class="row" href="{esc(link)}">
    {image}
    <div class="meta">
      <time datetime="{esc(date_label(work))}">{esc(date_label(work))}</time>
      <h3>{esc(work["title"])}</h3>
      <p class="{line_class}">{esc(line)}</p>
    </div>
  </a>
</article>'''
        )
    return '<div class="works">' + "".join(rows) + "</div>"


def tool_row(from_file: str, data: dict) -> str:
    ball = data["personal"]["footballPhoto"]
    link = ball["links"][0]["href"]
    line_class = "manuscript" if placeholder(ball["addresses"]) else "excerpt"
    when_class = "manuscript" if placeholder(ball["when"]) else ""
    return f'''<article class="work-row" id="tool">
  <a class="row" href="{esc(link)}">
    <time class="{when_class}">{esc(ball["when"])}</time>
    <div>
      <h3>{esc(ball["titleJa"])}</h3>
      <p class="{line_class}"><span class="tag">取り組み</span>{esc(ball["addresses"])}</p>
      <span class="more">アプリ</span>
    </div>
  </a>
</article>'''


def work_listing(from_file: str, data: dict) -> str:
    return (
        '<template id="work-source">'
        + work_rows(from_file, data["works"])
        + '</template>'
    )


def work_block(from_file: str, data: dict) -> str:
    return f"""
<section class="section" id="work">
  <header class="sec-head">
    <p class="sec-no">02</p>
    <div>
      <p class="sec-en">Work</p>
      <h2>作品</h2>
    </div>
  </header>
  {work_listing(from_file, data)}
</section>
"""


def pull_quote(text: str) -> str:
    klass = "pull is-placeholder" if placeholder(text) else "pull"
    return f'<blockquote class="{klass}"><p>{esc(text)}</p></blockquote>'


def thought_stack(thoughts: dict) -> str:
    items = []
    for item in thoughts["items"]:
        title = item.get("title") or ""
        head = f"<h3>{esc(title)}</h3>" if title else ""
        items.append(f'<article class="block thought">{head}{pull_quote(item["body"])}</article>')
    return f'<div class="quotes">{"".join(items)}</div>'


def thoughts_block(data: dict) -> str:
    thoughts = data["thoughts"]
    texts = [thoughts["lead"]] + [item.get("body", "") for item in thoughts["items"]]
    return f"""
<section class="section" id="thoughts">
  <header class="sec-head">
    <p class="sec-no">03</p>
    <div>
      <p class="sec-en">Thoughts</p>
      <h2>考え</h2>
    </div>
  </header>
  {pending_note(texts)}
  {pull_quote(thoughts["lead"])}
  {thought_stack(thoughts)}
</section>
"""


def photo_grid(from_file: str, images: list[dict]) -> str:
    cells = []
    n = 0
    for image in images:
        src = image.get("src") or ""
        caption = image.get("caption") or image.get("alt") or ""
        n += 1
        wide = " feature" if n == 1 and src else ""
        if src:
            cells.append(
                f'<figure class="{wide.strip()}">'
                + shot(from_file, src, image.get("alt") or caption)
                + (f'<figcaption class="caption">{esc(caption)}</figcaption>' if caption else "")
                + "</figure>"
            )
        else:
            cells.append(
                f'<figure class="slot"><span class="slot-no">{n:02d}</span><figcaption>{esc(caption)}</figcaption></figure>'
            )
    return f'<div class="mosaic">{"".join(cells)}</div>'


def personal_inner(from_file: str, data: dict) -> str:
    personal = data["personal"]
    block = personal["footballPhoto"]
    links = "".join(
        f'<a href="{esc(link["href"])}" target="_blank" rel="noopener noreferrer">{esc(link["label"])}</a>'
        for link in block["links"]
    )
    texts = [personal["lead"], block["body"], block["when"]]
    return f"""
{pending_note(texts)}
{manuscript(personal["lead"])}
<article class="block" id="football-photo">
  <h3>{esc(block["titleJa"])}</h3>
  <p class="lede">{esc(block["body"])}</p>
  <p class="links">{links}</p>
  {photo_grid(from_file, block["images"])}
</article>
"""


def personal_block(from_file: str, data: dict) -> str:
    return f"""
<section class="section" id="personal">
  <header class="sec-head">
    <p class="sec-no">04</p>
    <div>
      <p class="sec-en">Personal</p>
      <h2>仕事の外</h2>
    </div>
  </header>
  {personal_inner(from_file, data)}
</section>
"""


def contact_block(data: dict) -> str:
    contact = data["contact"]
    mail = data["site"]["email"]
    facts = "".join(f"<li>{esc(line)}</li>" for line in contact["lines"])
    return f"""
<section class="section" id="contact">
  <header class="sec-head">
    <p class="sec-no">05</p>
    <div>
      <p class="sec-en">Contact</p>
      <h2>連絡</h2>
    </div>
  </header>
  <p class="sec-en">{esc(contact["intro"])}</p>
  <p><a class="mail" href="mailto:{esc(mail)}">{esc(mail)}</a></p>
  <ul class="facts">{facts}</ul>
</section>
"""


def icon_pull() -> str:
    return """<svg class="icon" viewBox="0 0 24 24" role="img" aria-label="右へ引っ張る">
<title>右へ引っ張る</title>
<g class="nudge" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M4 7l5 5-5 5"/><path d="M12 7l5 5-5 5"/>
</g></svg>"""


def icon_drag() -> str:
    return """<svg class="icon" viewBox="0 0 24 24" role="img" aria-label="ドラッグで組み直す">
<title>ドラッグで組み直す</title>
<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
<rect x="3.5" y="7.5" width="7" height="9"/>
<path d="M13 12h7"/><path d="M17 8.5 20.5 12 17 15.5"/>
</g></svg>"""


def icon_shuffle() -> str:
    return """<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M16 3h5v5"/>
<path d="M4 20 21 3"/>
<path d="M21 16v5h-5"/>
<path d="M15 15 21 21"/>
<path d="M4 4 9 9"/>
</g></svg>"""


def icon_reset() -> str:
    return """<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M4.2 9.2A7.6 7.6 0 1 0 12 4.6"/>
<path d="M12 1.8 8.2 5.2 12 8.8"/>
</g></svg>"""


def cover(site: dict) -> str:
    image = esc(site["hero"])
    return f"""
<div class="cover-pin">
  <img src="{image}" alt="" fetchpriority="high">
  <div class="cover-scrim"></div>
  <div class="hero-k">
    <div class="assemble">
      <div class="assemble-stage">
        <svg viewBox="0 0 32 32" role="group" tabindex="0" aria-label="印。右の面を引っ張るとほどける。左の面は動かない。">
          <line class="joint" x1="12" y1="16" x2="12" y2="16"></line>
          <text class="gap-word" x="14" y="13" text-anchor="middle"></text>
          <g class="plane plane-stem" data-plane="a">
            <path fill="currentColor" d="M4 3h8v26H4z"></path>
          </g>
          <g class="plane plane-chevron" data-plane="b">
            <rect x="12" y="0" width="18" height="32" fill="transparent"></rect>
            <path fill="currentColor" d="M16 3h11L20.2 16 27 29H16l-4.4-13z"></path>
          </g>
        </svg>
      </div>
      <p class="assemble-hint">{icon_pull()}</p>
    </div>
  </div>
  <div class="cover-copy">
    <p class="cover-kicker">{esc(site["nameJa"])}</p>
    <h1 class="cover-line">{"<span>つくりながら、</span><span>考える。</span>" if site["statement"]["ja"] == "つくりながら、考える。" else esc(site["statement"]["ja"])}</h1>
    <p class="cover-en" aria-label="{esc(site["statement"]["en"])}"><span class="cycle is-on">Make</span><span class="slash"> / </span><span class="cycle">Run</span><span class="slash"> / </span><span class="cycle">Rethink.</span></p>
  </div>
  <p class="cover-affil">{"<br>".join(esc(part) for part in site["affiliationDisplay"].split())}</p>
</div>
"""


def document(from_file: str, title: str, description: str, body: str, home: bool, current: str | None) -> str:
    site_class = "is-home" if home else "is-solid"
    return (
        head(from_file, title, description, from_file)
        + f'<body class="{site_class}">\n'
        + chrome(from_file, current)
        + body
        + "\n"
        + f'<script src="{esc(href(from_file, "assets/site.js"))}" defer></script>\n'
        + "</body>\n</html>\n"
    )


def works_map(data: dict) -> str:
    items = []
    for work in log_works(data["works"]):
        thumb = work.get("thumb") or ""
        when = stamp(work)
        items.append({
            "title": work["title"],
            "href": work["file"],
            "thumb": thumb,
            "year": str(when[0]) if when else "",
            "kind": work.get("kind") or "",
        })
    payload = json.dumps(items, ensure_ascii=False).replace("<", "\\u003c")
    links = []
    for item in items:
        image = (
            f'<img src="{esc(item["thumb"])}" alt="" loading="lazy" decoding="async">'
            if item["thumb"]
            else ""
        )
        links.append(
            f'<li><a href="{esc(item["href"])}">{image}<span>{esc(item["title"])}</span></a></li>'
        )
    links = "".join(links)
    return f"""
<section class="works-map" id="works-map" aria-label="作品">
  <canvas class="map-canvas" tabindex="0" aria-keyshortcuts="ArrowKeys Enter" aria-label="作品の面。ドラッグで動かす。矢印キーで選んだ面を動かし、Enterで開く。"></canvas>
  <div class="map-tools">
    <p class="map-hint" id="map-hint">{icon_drag()}</p>
    <button type="button" id="map-shuffle" aria-label="シャッフル" title="シャッフル">{icon_shuffle()}</button>
    <button type="button" id="map-reset" aria-label="元の位置に戻す" title="元の位置に戻す">{icon_reset()}</button>
  </div>
  <ul class="map-links">{links}</ul>
  <script type="application/json" id="works-map-data">{payload}</script>
</section>
<script src="assets/top.js" defer></script>
"""


def home_page(data: dict) -> str:
    site = data["site"]
    body = (
        cover(site)
        + '<main id="content" class="hero-only-main" aria-label="トップページ"></main>'
        + '<script src="assets/top.js" defer></script>'
    )
    description = f'{site["nameJa"]} / {site["nameEn"]}。建築とコンピュテーショナルデザイン。'
    return document("index.html", "Kota Okugawa", description, body, True, "top")


def section_page(from_file: str, current: str, en: str, ja: str, number: str, inner: str, data: dict, lead: str = "") -> str:
    site = data["site"]
    lead_html = f'<p class="page-lead">{esc(lead)}</p>' if lead else ""
    body = f"""
<main class="page" id="content">
  <header class="page-hero">
    <p class="page-no">{number}</p>
    <p class="page-en">{esc(en)}</p>
    <h1>{esc(ja)}</h1>
    {lead_html}
  </header>
  <div class="page-body">
    {inner}
  </div>
</main>
{footer(from_file, site)}
"""
    return document(from_file, f"{ja} | Kota Okugawa", f"{site['nameJa']} / {ja}", body, False, current)


def profile_page(data: dict) -> str:
    profile = data["profile"]
    file = "01_Profile/profile.html"
    rows = "".join(
        f'<li><b>{esc(item["year"])}</b><span>{esc(item["text"])}</span></li>'
        for item in profile["timeline"]
    )
    photos = "".join(shot(file, photo["src"], photo["alt"]) for photo in profile["photos"])
    portrait = href(file, profile["portrait"])
    inner = f"""
{pending_note([profile["intro"]])}
<div class="profile-grid">
  <figure class="portrait"><img src="{esc(portrait)}" alt="{esc(data["site"]["nameJa"])}の写真"></figure>
  <div>
    {manuscript(profile["intro"])}
    <p class="lede">{esc(data["site"]["nameJa"])} / {esc(data["site"]["nameEn"])}</p>
    <ol class="timeline">{rows}</ol>
  </div>
</div>
<div class="photos">{photos}</div>
"""
    site = data["site"]
    return section_page(file, "profile", "Profile", "プロフィール", "01", inner, data, f'{site["nameJa"]} / {site["nameEn"]}')


def work_page(data: dict) -> str:
    file = "02_Works/index.html"
    return section_page(file, "work", "Work", "作品", "02", work_listing(file, data), data, "")


def redirect_page(target: str, title: str, canonical: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} | Kota Okugawa</title>
<meta http-equiv="refresh" content="0; url={esc(target)}">
<link rel="canonical" href="{esc(canonical)}">
</head>
<body>
<p><a href="{esc(target)}">{esc(title)}</a></p>
</body>
</html>
"""


def thoughts_page(data: dict) -> str:
    file = "05_Thoughts/index.html"
    thoughts = data["thoughts"]
    texts = [thoughts["lead"]] + [item.get("body", "") for item in thoughts["items"]]
    inner = pending_note(texts) + pull_quote(thoughts["lead"]) + thought_stack(thoughts)
    lead = "" if placeholder(thoughts["lead"]) else thoughts["lead"]
    return section_page(file, "thoughts", "Thoughts", "考え", "03", inner, data, lead)


def personal_page(data: dict) -> str:
    file = "04_Personal/index.html"
    lead = data["personal"]["lead"]
    if placeholder(lead):
        lead = ""
    return section_page(file, "personal", "Personal", "仕事の外", "04", personal_inner(file, data), data, lead)


def trip_page(data: dict) -> str:
    return redirect_page(
        "../04_Personal/index.html#football-photo",
        "Football & Photo",
        "https://kota-okugawa.com/04_Personal/#football-photo",
    )


def contact_page(data: dict) -> str:
    file = "04_Contact/contact.html"
    block = contact_block(data)
    start = block.find("</header>")
    inner = block[start + len("</header>") :]
    inner = inner.rsplit("</section>", 1)[0]
    return section_page(file, "contact", "Contact", "連絡", "05", inner, data, data["contact"]["intro"])


def project_page(work: dict, works: list[dict], data: dict) -> str:
    file = work["file"]
    site = data["site"]
    note = " · ".join(work.get("note") or [])
    paragraphs = "".join(f"<p>{esc(paragraph)}</p>" for paragraph in work.get("paragraphs") or [])
    kind = f'<h2>{esc(work["kind"])}</h2>' if work.get("kind") else ""
    media = []
    images = [item for item in work.get("media") or [] if item["type"] == "image"]
    videos = [item for item in work.get("media") or [] if item["type"] == "video"]
    for index, item in enumerate(images):
        media.append(shot(file, item["src"], f'{work["title"]} {index + 1}', wide=index == 0))
    video_html = "".join(
        f'<video class="video" controls playsinline preload="metadata" src="{esc(href(file, item["src"]))}"></video>'
        for item in videos
    )
    listed = log_works([item for item in works if item.get("listed", True)])
    back = href(file, "02_Works/index.html")
    neighbors = ""
    if work in listed:
        index = listed.index(work)
        bits = [f'<a href="{esc(back)}">Back to WORK</a>']
        if index > 0:
            bits.append(f'<a href="{esc(href(file, listed[index - 1]["file"]))}">{esc(listed[index - 1]["title"])}</a>')
        if index < len(listed) - 1:
            bits.append(f'<a href="{esc(href(file, listed[index + 1]["file"]))}">{esc(listed[index + 1]["title"])}</a>')
        neighbors = '<nav class="pager" aria-label="作品">' + "".join(bits) + "</nav>"
    else:
        neighbors = f'<p class="pager"><a href="{esc(back)}">Back to WORK</a></p>'
    note_html = f'<p class="work-note">{esc(note)}</p>' if note else ""
    line = work.get("addresses") or ""
    line_html = (
        f'<p class="{"manuscript" if placeholder(line) else "lede"}"><span class="tag">取り組み</span>{esc(line)}</p>'
        if line
        else ""
    )
    lead = ""
    rest = "".join(media)
    if video_html and not images:
        lead = f'<div class="gallery">{video_html}</div>'
        rest = ""
    elif media:
        lead = f'<div class="gallery lead-frame">{media[0]}</div>'
        rest = video_html + "".join(media[1:])
    when = date_label(work)
    hero_lead = " · ".join(part for part in (when, work.get("kind") or "") if part)
    body = f"""
<main class="page" id="content">
  <header class="page-hero">
    <p class="page-no">02</p>
    <p class="page-en">Work</p>
    <h1>{esc(work["title"])}</h1>
    <p class="page-lead">{esc(hero_lead)}</p>
    {note_html}
  </header>
  <div class="page-body">
    {line_html}
    {lead}
    <div class="prose">{kind}{paragraphs}</div>
    <div class="gallery">{rest}</div>
    {neighbors}
  </div>
</main>
{footer(file, site)}
"""
    return document(file, f'{work["title"]} | Kota Okugawa', f'{work["title"]} / {site["nameJa"]}', body, False, "work")


def render(data: dict) -> dict[str, str]:
    files = {
        "index.html": home_page(data),
        "01_Profile/profile.html": profile_page(data),
        "02_Works/index.html": work_page(data),
        "02_Works/work.html": redirect_page("index.html", "作品", "https://kota-okugawa.com/02_Works/"),
        "03_Trip/trip.html": trip_page(data),
        "04_Contact/contact.html": contact_page(data),
        "04_Personal/index.html": personal_page(data),
        "05_Thoughts/index.html": thoughts_page(data),
    }
    listed = data["works"]
    for work in listed:
        files[work["file"]] = project_page(work, listed, data)
    for work in data.get("unlisted") or []:
        files[work["file"]] = project_page(work, listed, data)
    return files


def load() -> dict:
    return json.loads(DATA.read_text(encoding="utf-8"))


def main() -> int:
    data = load()
    files = render(data)
    check = "--check" in sys.argv
    failed = False
    required = [
        "okugawak@kajima.com",
        "gaulboard",
        "All rights reserved, Copyright(C) 2023 KAJIMA CORPORATION",
        "つくりながら、考える。",
        "Make / Run / Rethink.",
        "【ここに自己紹介を記入】",
        "【写真を追加】",
        "【ここに時期を記入】",
        "サンフレッチェ広島",
        "Russia",
        "Europe",
    ]
    blob = "\n".join(files.values())
    for token in required:
        if token not in blob:
            print("missing", token)
            failed = True
    works_index = files["02_Works/index.html"]
    for work in data["works"]:
        if work["title"] not in works_index:
            print("missing work", work["title"])
            failed = True
    if check:
        for rel, text in files.items():
            path = ROOT / rel
            current = path.read_text(encoding="utf-8") if path.exists() else None
            if current != text:
                print("drift", rel)
                failed = True
        if failed:
            return 1
        print(f"ok {len(files)} pages")
        return 0
    for rel, text in files.items():
        path = ROOT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    print(f"wrote {len(files)} pages")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
