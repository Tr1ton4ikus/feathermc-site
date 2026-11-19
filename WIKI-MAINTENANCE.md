# FeatherWiki

Edit `assets/wiki-catalog.json` for article titles, descriptions, categories and
HTML bodies. Preserve commands, recipes, links and factual uncertainty.

Run `python3 tools/build-wiki.py` to generate wiki/index.html and wiki/<article>/index.html; old .html paths become redirects.
Run `npm run check:wiki` to detect stale generated output and broken links.
Do not hand-edit generated pages. Shared layout/card markup and banner colors
are in tools/build-wiki.py; styling and behavior in assets/feather/wiki.css/js.
Card icons come from CCVault and are hosted locally; see assets/wiki-icons/SOURCES.md.

The sidebar is a scrollable set of large banner cards, open on desktop and
available through the Articles button on phones. Mobile Escape restores focus;
search, categories, TOC and previous/next links enhance static HTML. No theme
switch or duplicated SPA article data is used. Existing shared hash links are
redirected by assets/feather/site.js to canonical static article pages without .html. SEO helpers are in tools/seo.py.

Check `npm run test:wiki` with the local server on port 18765 before publishing.
