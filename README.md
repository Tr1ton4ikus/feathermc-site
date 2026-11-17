# Feather — HTML, CSS, vanilla JavaScript

Public site: https://mcfeather.com/ · Minecraft: **play.mcfeather.com**.
The homepage preserves the dark/gold Feather design and original mascot. No React,
Next.js, Tailwind, Framer Motion, application build or runtime dependency is needed.
Animations use CSS and native Web Animations API with reduced-motion support.
Address buttons use Clipboard API with synchronous legacy copy fallback for
HTTP/older mobile browsers. If both are denied, a selectable input dialog opens.

## Local development

```sh
python3 -m http.server 18765 --bind 127.0.0.1
```

Open http://127.0.0.1:18765/. All assets and page links are relative, including fonts.
GitHub project-prefix URLs and the existing custom domain are supported.
Node dependencies are used only for browser checks, never shipped to visitors.

## Wiki

`assets/wiki-catalog.json` owns all 12 articles and six categories. Run
`python3 tools/build-wiki.py` after editing it. The generator writes the index and
all standalone article pages. Large illustrated cards appear in the catalog,
collapsible sidebar and article headers. Art settings are in the generator's
`art` dictionary; downloaded CCVault sources are in `assets/wiki-icons/SOURCES.md`.
Search covers article text/commands. Old `#wiki/<id>` and `#map` links redirect to
static pages. Articles and cards remain readable without JavaScript.

## Yandex Metrica

Set the real numeric `metrikaCounterId` in **assets/site-config.js** and commit it.
It is currently **0**, so analytics is disabled and sends no requests.
The shared loader covers the homepage, map and all wiki pages. It loads the
Yandex tag asynchronously, enables clickmap/link/bounce measurement, and leaves
Webvisor off. Optional JavaScript goals: `copy_server`, `open_discord`,
`open_shop`, `open_map`. Add the same identifiers in the counter settings.
The automated integration check intercepts the tag and uses a dummy ID locally;
it does not send test traffic to a real counter.

## Live map

The owner permits the public BlueMap address, configured as `mapDirectUrl` in
assets/site-config.js. BlueMap currently serves HTTP only. Map navigation opens the read-only **http://mcfeather.com/map.html** page in the
same tab. That page embeds BlueMap in an iframe with real viewport dimensions.
Only the map page uses HTTP; its return links go back to the HTTPS website.
An HTTPS map URL redirects to the same-site HTTP embed. A marker avoids loops
when a visitor enforces HTTPS-only navigation; that case retains a direct link.
The direct link also works without JavaScript and preserves shared coordinates.

An optional separately hosted HTTPS proxy can still be set in `mapProxyUrl`.
`tools/map-proxy.mjs` is tested locally but has not been externally deployed.
The gribmine-vds server must not be used for this project.

## Validation and deployment

```sh
npm ci
npx playwright install chromium
npm run check:wiki
npm test
npm run test:wiki
npm run test:supporting
```

Keep the static server on port 18765 for the wiki/supporting tests. The homepage
suite starts its own server. Tests cover 320–1920px, keyboard/touch controls,
clipboard, mode tabs, FAQ, no-JS, reduced motion, project-prefix asset paths,
legacy routes and mocked Metrica/map configuration.

The existing GitHub Pages workflow validates the site before deploying main.
Only public HTML, assets, wiki, map, CNAME, robots.txt, sitemap.xml and .nojekyll
enter its artifact. The existing mcfeather.com custom domain is preserved.
Manual Discord announcement workflows remain manual; deployment sends no posts.

## Discord "How to play" post

The screenshot-style, branded `discord/how-to-play.json` contains a Russian
instruction embed, highlighted game IP `play.mcfeather.com`, and **four Discord
link buttons**: information, FeatherWiki, donate, and support. No Minecraft
version, backup IP, or verification code has been invented.

To post, add the `DISCORD_WEBHOOK_URL` repository Actions secret in GitHub,
then open **Actions → Send Feather Discord announcement → Run workflow** and
choose **how-to-play** or **opening**. The sender adds
`?with_components=true&wait=true` so normal Discord webhooks display link
buttons and confirm the message was created. The workflow is manual-only to
avoid repeated Discord announcements. Never commit your webhook URL.

## Manual Discohook embed

Paste `discord/discohook-how-to-play.json` into Discohook's JSON editor. It intentionally omits the raw Discord `components` key (which Discohook may reject) and contains no empty `content`. Use `discord/how-to-play.json` with the GitHub Actions webhook sender for real link buttons.

The guide's image currently references a **temporary signed Discord CDN URL** supplied for this update. It expires on **2026-11-14 at 13:42:54 UTC**; for a durable banner, upload the original image to the repository or another permanent public host and replace the `image.url` value in both templates.

## Support panel / ticket menu

Use `discord/discohook-support-menu.json` for a Discohook-compatible support announcement. The banner lives in **the first image-only embed**, while the title, description and categories live in a **second embed** — this ensures the image is ABOVE the text. `discord/support-menu.json` contains the full webhook version with link buttons. To post via GitHub Actions select **support** in the **Send Feather Discord announcement** workflow.

Note: a webhook cannot process an interactive ticket-category dropdown or create tickets. To implement a working selection menu, configure a Discord ticket bot and its interactions separately. The static embed lists categories, not a functional selector.

The support banner is referenced from the signed Discord CDN URL supplied by the user. It is temporary and expires at **2026-11-14 14:00:17 UTC**. The image could not be downloaded into the repository in this environment. Upload a durable banner and replace the `image.url` in both support templates; the how-to-play banner also uses a signed URL.
