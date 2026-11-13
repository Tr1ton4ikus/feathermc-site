# FeatherWiki content workflow

`assets/wiki-catalog.json` is the authoritative source for the 12 article bodies, titles, descriptions and six categories. Existing `wiki/*.html` URLs stay available as readable, indexable HTML without JavaScript. Do not edit article bodies in multiple places.

After editing a catalog article, run:

```powershell
python tools/build-wiki.py
python tools/build-wiki.py --index-only
python tests/check-wiki.py
node --check assets/wiki-experience.js
```

The first command refreshes the standalone article bodies; the second refreshes the homepage's existing `featherWikiData` JSON block so its legacy `#wiki/<id>` routes stay compatible. Navigation template changes must also be reflected in the standalone markup; this is deliberately a small static generator rather than a new site framework. The homepage's router converts article links to hash routes while standalone article links stay relative.

`assets/wiki-experience.js` enhances standalone pages with full-text search (including commands), category filtering, an accessible empty state, a generated table of contents and active section highlighting. If fetching the catalog fails, title/category search still works. All article text remains present without this enhancement.

For browser regression, serve this directory on localhost port 18766 and run `node tests/wiki-browser.cjs`. Set `SITE_URL`, `PLAYWRIGHT_PATH` and `BROWSER_PATH` to override the local environment. The test covers article count, category filtering, command search, empty and reset states, all article TOCs, current article state, sidebar search, theme changes, responsive widths and JavaScript page errors.

No game commands, recipes, statistics or mechanics were invented. Existing factual uncertainty in the safety article is preserved. Existing recipe images and cross-links are retained.
