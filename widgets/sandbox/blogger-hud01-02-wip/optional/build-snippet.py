#!/usr/bin/env python3
"""
build-snippet.py — Regenerate Blogger snippet files from source files.

Generates two files:
  blogger-template-snippet.txt      — Full: HUD-01 + HUD-02, all JS
  blogger-template-snippet-lite.txt — HUD-01 + HUD-02 + HUD-03 CSS, HUD-01 JS only

Run from the repo root or from within widgets/releases/blogger-hud01-02-object/optional/.

Usage:
    python3 optional/build-snippet.py
  or
    python3 build-snippet.py     (from the optional/ directory)
"""
import os
import re
import sys
from datetime import datetime

# Locate paths relative to this script. RELEASE_DIR (this script's own
# container, e.g. releases/blogger-hud01-02-object/ or a sandbox/*-wip/
# duplicate) can live anywhere directly under widgets/ — only WIDGETS_DIR
# is trustworthy for paths OUTSIDE that container, like HUD-03's CSS,
# which always lives under widgets/releases/ regardless of where this
# script itself was copied to.
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
RELEASE_DIR  = os.path.dirname(SCRIPT_DIR)                       # .../blogger-hud01-02-object/ (or a sandbox copy)
WIDGETS_DIR  = os.path.dirname(os.path.dirname(RELEASE_DIR))     # widgets/
SHARED_DIR   = os.path.join(WIDGETS_DIR, 'shared', 'js')

CSS_SHARED = os.path.join(RELEASE_DIR, 'blogger-hud-shared.css')
CSS_HUD01  = os.path.join(RELEASE_DIR, 'blogger-hud01-template.css')
CSS_HUD02  = os.path.join(RELEASE_DIR, 'blogger-hud02-template.css')
CSS_HUD03  = os.path.join(WIDGETS_DIR, 'releases', 'blogger-pilot-hud03', 'blogger-hud03-template.css')
JS_MINI    = os.path.join(SHARED_DIR, 'hud-mini.js')
JS_PAPERS  = os.path.join(SHARED_DIR, 'hud_papers.js')
JS_HUD01   = os.path.join(RELEASE_DIR, 'blogger-hud01-template.js')
JS_HUD02   = os.path.join(RELEASE_DIR, 'blogger-hud02-template.js')
JS_ADAPT_01= os.path.join(SCRIPT_DIR, 'hud01-frame-adapt.js')
JS_ADAPT_02= os.path.join(SCRIPT_DIR, 'hud02-frame-adapt.js')
OUTPUT      = os.path.join(SCRIPT_DIR, 'blogger-template-snippet.txt')
OUTPUT_LITE = os.path.join(SCRIPT_DIR, 'blogger-template-snippet-lite.txt')
CLEAN_THEME = os.path.join(SCRIPT_DIR, 'blogger-clean-theme.txt')


def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read().rstrip('\n')


def escape_embedded_close_tag(content, tag):
    """Prevent a literal "</tag" inside content — e.g. a <script> usage
    example in a doc-comment — from prematurely closing the wrapping
    <tag> element. The HTML parser looks for that exact byte sequence
    anywhere in a script/style element's text, even inside comments or
    CDATA markers (which mean nothing to an HTML5 parser). Splitting the
    slash defeats the match without changing what a human or the JS/CSS
    engine sees."""
    pattern = re.compile('</(' + tag + ')', re.IGNORECASE)
    return pattern.sub(lambda m: '<\\/' + m.group(1), content)


def style_block(label, css_content):
    css_content = escape_embedded_close_tag(css_content, 'style')
    return (
        f'<!-- NebulaCast HUD: {label} -->\n'
        '<style>\n'
        '/*<![CDATA[*/\n'
        f'{css_content}\n'
        '/*]]>*/\n'
        '</style>'
    )


def script_block(label, js_content):
    js_content = escape_embedded_close_tag(js_content, 'script')
    return (
        f'<!-- NebulaCast HUD: {label} -->\n'
        '<script>\n'
        '/*<![CDATA[*/\n'
        f'{js_content}\n'
        '/*]]>*/\n'
        '</script>'
    )


FONTS = """\
<!-- NebulaCast HUD: Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&amp;display=swap" rel="stylesheet"/>"""


def write_snippet(path, parts):
    output = '\n'.join(parts)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(output)
    lines = output.count('\n') + 1
    print(f'Written: {path}  ({lines} lines)')
    return output


def build_full_theme_xml(snippet_text):
    """Splice the full HUD snippet into blogger-clean-theme.txt right
    before </head> — the same manual step described in the release
    notes ("вставить перед </head>") — and write the result as a
    timestamped, ready-to-paste-whole theme file. Requires exactly one
    </head> in the clean theme so the insertion point is unambiguous."""
    if not os.path.exists(CLEAN_THEME):
        print(f'  Note: {CLEAN_THEME} not found — skipping full theme .xml assembly')
        return

    with open(CLEAN_THEME, 'r', encoding='utf-8') as f:
        theme = f.read()

    marker = '</head>'
    count = theme.count(marker)
    if count != 1:
        print(f'  WARNING: expected exactly one "{marker}" in {CLEAN_THEME}, '
              f'found {count} — skipping full theme .xml assembly (ambiguous insertion point)')
        return

    theme = theme.replace(marker, snippet_text + '\n\n' + marker, 1)

    timestamp = datetime.now().strftime('%m%d%Y%H%M%S')
    out_path = os.path.join(SCRIPT_DIR, f'nebulacast_theme_{timestamp}.xml')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(theme)
    lines = theme.count('\n') + 1
    print(f'Written: {out_path}  ({lines} lines)')


def main():
    required = [CSS_SHARED, CSS_HUD01, CSS_HUD02,
                JS_MINI, JS_PAPERS, JS_HUD01, JS_HUD02,
                JS_ADAPT_01, JS_ADAPT_02]
    missing = [p for p in required if not os.path.exists(p)]
    if missing:
        print('ERROR: missing source files:')
        for p in missing:
            print(' ', p)
        sys.exit(1)

    # ── Full snippet (HUD-01 + HUD-02 + HUD-03 CSS + all JS) ────────
    header_full = """\
<!--
  NebulaCast HUD Panels — Blogger Template Snippet (HUD-01 / HUD-02 / HUD-03)
  ===================================================================
  Paste this entire block into your Blogger theme's HTML,
  just before the closing </head> tag.

  Blogger → Theme → Edit HTML → find </head> → paste above it → Save.

  This only needs to be done ONCE per blog.
  After this, paste individual post HTML blocks from examples/ into Blogger posts.

  Contents:
  1. Google Fonts (Share Tech Mono)
  2. Shared CSS (keyframes, media containers, paper rows, row layout)
  3. CSS for HUD-01 (nc-ol-*)
  4. CSS for HUD-02 (nc-or-*)
  5. CSS for HUD-03 (nc-hp-*)
  6. Shared JS: NcHudMini, HudPapers
  7. Panel JS: NcHud01 factory, NcHud02 factory
  8. Dynamic frame height (ncFrameAdapt)

  Object mode (Aladin + SIMBAD) is included — no extra files needed.
  Set objectMode:true in NcHud01.init() / NcHud02.init() to activate it.

  Tip: if you only use HUD-01, remove the HUD-02 CSS/JS sections (and vice versa).
      The Shared CSS block is always required. HUD-03 has no JS factory of its
      own — its CSS block is enough (falls back to plain flowing HTML content).
-->"""

    frame_adapt_js = read(JS_ADAPT_01) + '\n\n' + read(JS_ADAPT_02)

    full_parts = [
        header_full, '',
        FONTS, '',
        style_block('Shared CSS (keyframes, media, paper rows, row layout)',
                    read(CSS_SHARED)), '',
        style_block('Panel CSS — HUD-01 (nc-ol-*)', read(CSS_HUD01)), '',
        style_block('Panel CSS — HUD-02 (nc-or-*)', read(CSS_HUD02)), '',
    ]

    if os.path.exists(CSS_HUD03):
        full_parts += [
            style_block('Panel CSS — HUD-03 (nc-hp-*)', read(CSS_HUD03)), '',
        ]
    else:
        print(f'  Note: {CSS_HUD03} not found — omitting HUD-03 CSS from full snippet')

    full_parts += [
        script_block('Shared JS — NcHudMini (mini/expand toggle)', read(JS_MINI)), '',
        script_block('Shared JS — HudPapers (publications module)', read(JS_PAPERS)), '',
        script_block('Panel JS — NcHud01 (Object Lock factory)', read(JS_HUD01)), '',
        script_block('Panel JS — NcHud02 (Object Report factory)', read(JS_HUD02)), '',
        script_block('dynamic frame height (ResizeObserver)', frame_adapt_js), '',
    ]

    full_snippet_text = write_snippet(OUTPUT, full_parts)

    # ── Lite snippet (HUD-01 + HUD-02 + HUD-03 CSS, HUD-01 JS only) ─
    header_lite = """\
<!--
  NebulaCast HUD Panels — Blogger Template Snippet LITE (HUD-01 / HUD-02 / HUD-03)
  =================================================================================
  Paste this entire block into your Blogger theme's HTML,
  just before the closing </head> tag.

  Blogger → Theme → Edit HTML → find </head> → paste above it → Save.

  This only needs to be done ONCE per blog.
  After this, paste individual post HTML blocks from examples/ into Blogger posts.

  Contents:
  1. Google Fonts (Share Tech Mono)
  2. Shared CSS (keyframes, media containers, paper rows, row layout)
  3. CSS for HUD-01 (nc-ol-*), HUD-02 (nc-or-*), HUD-03 (nc-hp-*)
  4. Shared JS: NcHudMini, HudPapers
  5. Panel JS: NcHud01 factory only

  Note: HUD-02 and HUD-03 JS factories are NOT included in the lite snippet.
  Use the full snippet if you need NcHud02.init() or NcHud03.init().
-->"""

    lite_parts = [
        header_lite, '',
        FONTS, '',
        style_block('Shared CSS (keyframes, media, paper rows, row layout)',
                    read(CSS_SHARED)), '',
        style_block('Panel CSS — HUD-01 (nc-ol-*)', read(CSS_HUD01)), '',
        style_block('Panel CSS — HUD-02 (nc-or-*)', read(CSS_HUD02)), '',
    ]

    if os.path.exists(CSS_HUD03):
        lite_parts += [
            style_block('Panel CSS — HUD-03 (nc-hp-*)', read(CSS_HUD03)), '',
        ]
    else:
        print(f'  Note: {CSS_HUD03} not found — omitting HUD-03 CSS from lite snippet')

    lite_parts += [
        script_block('Shared JS — NcHudMini (mini/expand toggle)', read(JS_MINI)), '',
        script_block('Shared JS — HudPapers (publications module)', read(JS_PAPERS)), '',
        script_block('Panel JS — NcHud01 (Object Lock factory)', read(JS_HUD01)), '',
    ]

    write_snippet(OUTPUT_LITE, lite_parts)

    # ── Full theme .xml (clean theme + full snippet spliced before </head>) ─
    build_full_theme_xml(full_snippet_text)


if __name__ == '__main__':
    main()
