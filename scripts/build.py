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


def chrome(from_file: str, current: str | None) -> str:
    links = []
    for key, label, target in NAV:
        attrs = ' aria-current="page"' if key == current else ""
        links.append(f'<a href="{esc(href(from_file, target))}"{attrs}>{up(label)}</a>')
    home = href(from_file, "index.html")
    mark = href(from_file, "assets/mark.svg")
    sheet = [("top", "Top", "index.html"), *NAV]
    sheet_links = []
    for key, label, target in sheet:
        attrs = ' aria-current="page"' if key == current else ""
        sheet_links.append(
            f'<li><a href="{esc(href(from_file, target))}"{attrs}><span>{esc(label)}</span></a></li>'
        )
    contact = href(from_file, "04_Contact/contact.html")
    contact_current = ' aria-current="page"' if current == "contact" else ""
    place = {
        "top": "Top",
        "profile": "Profile",
        "work": "Work",
        "thoughts": "Thoughts",
        "personal": "Personal",
    }.get(current or "", "Menu")
    here = ' data-here="true"' if place != "Menu" else ""
    return (
        '<a class="skip" href="#content">本文へ</a>'
        '<header class="bar">'
        f'<a class="mark" href="{esc(home)}"><img src="{esc(mark)}" alt="" width="28" height="28"><span>Kota Okugawa</span></a>'
        f'<nav class="bar-nav" aria-label="サイト">{"".join(links)}</nav>'
        "</header>"
        '<nav class="dock" aria-label="ページ">'
        f'<button type="button" class="dock-menu" data-place="{esc(place)}"{here} aria-expanded="false" aria-controls="dock-sheet">{esc(place)}</button>'
        f'<a class="dock-contact" href="{esc(contact)}"{contact_current}>Contact</a>'
        "</nav>"
        '<div class="dock-sheet" id="dock-sheet" hidden>'
        '<div class="dock-panel" role="dialog" aria-modal="true" aria-labelledby="dock-sheet-title">'
        '<p class="dock-kicker" id="dock-sheet-title">Pages</p>'
        f'<ul>{"".join(sheet_links)}</ul>'
        '<button type="button" class="dock-close">Close</button>'
        "</div></div>"
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
      <ol class="timeline">{rows}</ol>
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
        '<p class="log-label">道具</p>'
        + tool_row(from_file, data)
        + '<p class="log-label">作品 · 新しい順</p>'
        + work_rows(from_file, data["works"])
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


def cover(site: dict) -> str:
    image = esc(site["hero"])
    return f"""
<div class="cover-pin">
  <img src="{image}" alt="" fetchpriority="high">
  <div class="cover-scrim"></div>
  <div class="cover-copy">
    <div class="cover-kicker-row">
      <p class="cover-kicker">01 — {esc(site["nameJa"])}</p>
      <div class="assemble">
        <svg viewBox="0 0 32 32" width="64" height="64" role="group" tabindex="0" aria-label="印。ドラッグでほどく">
          <g class="plane" data-plane="a">
            <rect x="2" y="1" width="12" height="30" fill="transparent"></rect>
            <path fill="currentColor" d="M4 3h8v26H4z"></path>
          </g>
          <g class="plane" data-plane="b">
            <rect x="12" y="1" width="18" height="30" fill="transparent"></rect>
            <path fill="currentColor" d="M16 3h11L20.2 16 27 29H16l-4.4-13z"></path>
          </g>
        </svg>
        <p class="assemble-hint">drag</p>
      </div>
    </div>
    <h1 class="cover-line">{"つくりながら、<br>考える。" if site["statement"]["ja"] == "つくりながら、考える。" else esc(site["statement"]["ja"])}</h1>
    <p class="cover-en"><span class="type">{esc(site["statement"]["en"])}</span><span class="caret" aria-hidden="true"></span></p>
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


def teaser(from_file: str, number: str, en: str, ja: str, line: str, target: str) -> str:
    return (
        f'<a href="{esc(href(from_file, target))}">'
        f'<span class="k">{esc(number)}</span>'
        f"<span><span class=\"en\">{esc(en)}</span>"
        f"<strong>{esc(ja)}</strong><p>{esc(line)}</p></span></a>"
    )


def works_map(data: dict) -> str:
    items = []
    for work in log_works(data["works"]):
        thumb = work.get("thumb") or ""
        items.append({"title": work["title"], "href": work["file"], "thumb": thumb})
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
<section class="works-map" id="works-map" aria-labelledby="works-map-title">
  <header class="map-head">
    <p class="sec-en">Work</p>
    <h2 id="works-map-title">面で見る</h2>
    <p class="map-note">面をドラッグして組み直す。離すと、ゆっくり整う。もう一度押すと、その作品へ。</p>
  </header>
  <div class="map-tools">
    <p class="map-hint" id="map-hint">drag to rearrange</p>
    <button type="button" id="map-shuffle">shuffle</button>
    <button type="button" id="map-reset">reset</button>
  </div>
  <canvas class="map-canvas" tabindex="0" aria-keyshortcuts="ArrowKeys Enter" aria-label="作品の面。ドラッグで動かす。矢印キーで選んだ面を動かし、Enterで開く。"></canvas>
  <ul class="map-links">{links}</ul>
  <script type="application/json" id="works-map-data">{payload}</script>
</section>
<script src="assets/top.js" defer></script>
"""


def home_page(data: dict) -> str:
    site = data["site"]
    profile = data["profile"]
    newest = log_works(data["works"])[0]
    profile_line = profile["intro"] if profile["intro"] and not placeholder(profile["intro"]) else f'{site["nameJa"]} / {site["nameEn"]}'
    thoughts = data["thoughts"]
    thought_line = thoughts["items"][0]["body"] if thoughts.get("items") else thoughts["lead"]
    rows = [
        ("01", "Profile", "プロフィール", profile_line, "01_Profile/profile.html"),
        ("02", "Work", "作品", f'{date_label(newest)} · {newest["title"]}', "02_Works/index.html"),
        ("03", "Thoughts", "考え", thought_line, "05_Thoughts/index.html"),
        ("04", "Personal", "仕事の外", data["personal"]["lead"], "04_Personal/index.html"),
        ("05", "Contact", "連絡", site["email"], "04_Contact/contact.html"),
    ]
    links = "".join(teaser("index.html", *row) for row in rows)
    body = (
        cover(site)
        + '<main class="sheet" id="content">'
        + works_map(data)
        + f'<nav class="teasers" aria-label="ページ">{links}</nav>'
        + footer("index.html", site)
        + "</main>"
    )
    description = f'{site["nameJa"]} / {site["nameEn"]}。建築とコンピュテーショナルデザイン。'
    return document("index.html", "Kota Okugawa", description, body, True, "top")


def section_page(from_file: str, current: str, en: str, ja: str, number: str, inner: str, data: dict) -> str:
    site = data["site"]
    body = f"""
<main class="page" id="content">
  <header class="sec-head">
    <p class="sec-no">{number}</p>
    <div>
      <p class="sec-en">{esc(en)}</p>
      <h1>{esc(ja)}</h1>
    </div>
  </header>
  {inner}
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
    return section_page(file, "profile", "Profile", "プロフィール", "01", inner, data)


def work_page(data: dict) -> str:
    file = "02_Works/index.html"
    return section_page(file, "work", "Work", "作品", "02", work_listing(file, data), data)


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
    return section_page(file, "thoughts", "Thoughts", "考え", "03", inner, data)


def personal_page(data: dict) -> str:
    file = "04_Personal/index.html"
    return section_page(file, "personal", "Personal", "仕事の外", "04", personal_inner(file, data), data)


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
    return section_page(file, "contact", "Contact", "連絡", "05", inner, data)


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
    body = f"""
<main class="page" id="content">
  <header class="sec-head">
    <p class="sec-no">02</p>
    <div>
      <p class="sec-en">Work</p>
      <h1>{esc(work["title"])}</h1>
      {note_html}
    </div>
  </header>
  {line_html}
  {lead}
  <div class="prose">{kind}{paragraphs}</div>
  <div class="gallery" style="margin-top:1.5rem">{rest}</div>
  {neighbors}
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
