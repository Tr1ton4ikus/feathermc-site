# Feather static site

The public site uses HTML, CSS and vanilla JavaScript. No application build or
runtime framework is needed. Keep all asset and internal links relative so the
site works on GitHub Pages under a project path and on the custom domain.

Keep the existing dark brown/black and gold identity, original mascot and map
illustration. Do not reintroduce abstract cube illustrations or generated scenery.
Use frontend-design for substantial composition changes, ui-ux-pro-max for relevant
accessibility/responsive checks, motion-director for animation decisions, and
web-design-guidelines plus web-motion-auditor before completing interface changes.
Honor reduced motion, visible focus, keyboard navigation and no-JS reading.

All public settings live in assets/site-config.js. Never commit credentials or environment files. The owner explicitly permits the
public BlueMap address in mapDirectUrl; do not access or change gribmine-vds. GitHub Pages cannot run the
optional Node map proxy in tools/map-proxy.mjs; it needs separate HTTPS hosting.
Metrica stays disabled until a real counter ID is supplied.

Preserve canonical wiki article content; see WIKI-MAINTENANCE.md. Existing Discord
announcement workflows are manual-only. Do not send announcements while deploying.
Run npm run check:wiki, npm test, npm run test:wiki and npm run test:supporting.
