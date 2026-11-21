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
    ("profile", "Profile", "index.html#profile"),
    ("work", "Work", "index.html#work"),
    ("thoughts", "Thoughts", "index.html#thoughts"),
    ("personal", "Personal", "index.html#personal"),
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
    return (
        '<a class="skip" href="#content">本文へ</a>'
        '<header class="bar">'
        f'<a class="mark" href="{esc(home)}"><img src="{esc(mark)}" alt="" width="28" height="28"><span>Kota Okugawa</span></a>'
        f'<nav aria-label="サイト">{"".join(links)}</nav>'
        "</header>"
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


FIELD = """
<svg class="field" viewBox="0 0 800 900" aria-hidden="true">
  <g fill="none" stroke="currentColor" stroke-width="1.25">
    <path d="M80 40 L260 20 L300 180 L120 220 Z"/>
    <path d="M260 20 L520 60 L480 240 L300 180 Z"/>
    <path d="M520 60 L760 30 L740 250 L480 240 Z"/>
    <path d="M120 220 L300 180 L340 420 L90 390 Z"/>
    <path d="M300 180 L480 240 L520 460 L340 420 Z"/>
    <path d="M480 240 L740 250 L700 500 L520 460 Z"/>
    <path d="M90 390 L340 420 L300 680 L60 640 Z"/>
    <path d="M340 420 L520 460 L560 720 L300 680 Z"/>
    <path d="M520 460 L700 500 L760 780 L560 720 Z"/>
    <path d="M60 640 L300 680 L260 880 L40 860 Z"/>
    <path d="M300 680 L560 720 L520 890 L260 880 Z"/>
  </g>
  <path d="M300 180 L480 240" fill="none" stroke="#e24a1b" stroke-width="1.8"/>
</svg>
"""


def cover(site: dict) -> str:
    image = esc(site["hero"])
    return f"""
<div class="cover-pin">
  <img src="{image}" alt="" fetchpriority="high">
  <div class="cover-scrim"></div>
  {FIELD}
  <div class="cover-copy">
    <p class="cover-kicker">01 — {esc(site["nameJa"])}</p>
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


def home_page(data: dict) -> str:
    site = data["site"]
    body = (
        cover(site)
        + '<main class="sheet" id="content">'
        + profile_block("index.html", data)
        + work_block("index.html", data)
        + thoughts_block(data)
        + personal_block("index.html", data)
        + contact_block(data)
        + footer("index.html", site)
        + "</main>"
    )
    description = f'{site["nameJa"]} / {site["nameEn"]}。建築とコンピュテーショナルデザイン。'
    return document("index.html", "Kota Okugawa", description, body, True, None)


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
    file = "02_Works/work.html"
    return section_page(file, "work", "Work", "作品", "02", work_listing(file, data), data)


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
    target = "../index.html#football-photo"
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Football &amp; Photo | Kota Okugawa</title>
<meta http-equiv="refresh" content="0; url={target}">
<link rel="canonical" href="https://kota-okugawa.com/#football-photo">
</head>
<body>
<p><a href="{target}">Football &amp; Photo</a></p>
</body>
</html>
"""


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
    back = href(file, "02_Works/work.html")
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
        "02_Works/work.html": work_page(data),
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
    for work in data["works"]:
        if work["title"] not in files["index.html"]:
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
