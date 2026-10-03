#!/bin/sh
# Render the design/ SVGs to the PNGs the site serves from docs/public/.
# Run after editing an SVG; commit the PNGs. Needs Google Chrome (macOS path).
#
# Chrome, not an SVG converter, because the card's text is JetBrains Mono from
# Google Fonts — a browser is the one renderer guaranteed to load it.
set -eu
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=../docs/public
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

# shot <svg> <width> <height> <png> [bg]
# bg defaults to the page navy; 'none' gives a transparent PNG, which the
# 48px favicon needs so its chamfered corner is see-through on any tab colour.
shot() {
    bg=${5:-#0B1C2C}
    [ "$bg" = none ] && bg=transparent
    {
        echo '<!doctype html><html><head><meta charset="utf-8">'
        echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=block">'
        echo '<style>html,body{margin:0;background:'"$bg"'}svg{display:block;width:'"$2"'px;height:'"$3"'px}</style>'
        echo '</head><body>'
        cat "$1"
        echo '</body></html>'
    } > "$tmp/page.html"
    "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
        --window-size="$2,$3" --virtual-time-budget=5000 --default-background-color=00000000 \
        --screenshot="$4" "file://$tmp/page.html" 2>/dev/null
}

shot og-default.svg 1200 627 "$OUT/og-default.png"
shot favicon.svg 48 48 "$OUT/favicon-48.png" none
# iOS ignores transparency (it fills black) and rounds the corners itself,
# so the touch icon keeps the navy fill behind the chamfer.
shot favicon.svg 180 180 "$OUT/apple-touch-icon.png"
cp favicon.svg "$OUT/favicon.svg"
ls -l "$OUT/og-default.png" "$OUT/favicon-48.png" "$OUT/apple-touch-icon.png" "$OUT/favicon.svg"
