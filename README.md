# Feather

Static Russian-language Minecraft community website at https://mcfeather.com/.
Minecraft address: **play.mcfeather.com**. Donation store: https://feather.trademc.org/.

## Development

No application build or runtime framework is required. Serve the checkout over HTTP:

```sh
python -m http.server 18765 --bind 127.0.0.1
```

The homepage supports existing `#wiki/<article>` and `#map` routes. Standalone `wiki.html`, `wiki/*.html`, and `map.html` remain available. Theme preference is shared across pages.

## Validation

Node 22+ and Python 3.11+:

```sh
npm ci
npx playwright install chromium
npm run check:wiki
npm test
npm run test:wiki
npm run test:supporting
```

Keep the HTTP server running for the wiki and supporting suites. `npm test` creates its own temporary local server. Browser tests use installed Microsoft Edge on Windows or Playwright Chromium elsewhere; `BROWSER_PATH` can override the executable. `SITE_URL` can target another served checkout.

See WIKI-MAINTENANCE.md for canonical article editing. Run both generator commands after catalog changes; `--check` verifies output without modifying files.

## Deployment

GitHub Actions validates documentation, JavaScript, links and browser behavior on PRs and main. The deploy job runs only after quality passes and only outside PR events. Only public HTML, assets, wiki, CNAME, robots.txt, sitemap.xml and .nojekyll enter the Pages artifact. DNS and domain settings are managed separately.

Map availability remains marked as upcoming. The obsolete opening countdown was replaced by an invitation to join. Server status remains API-driven; the site never invents online player counts.

The gradient generator has been removed. Its old standalone URL and hash route lead back to the homepage. The public website hostname is mcfeather.com and the Minecraft connection IP is play.mcfeather.com.


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
