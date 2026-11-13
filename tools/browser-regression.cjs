// npm ci && npx playwright install chromium && npm test
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require('../.qa/node_modules/playwright')); }
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(error ? 'Not found' : data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.SITE_URL || `http://127.0.0.1:${server.address().port}/`;
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
    // Third-party availability must not make local behavior nondeterministic.
    await context.route('https://api.mcsrvstat.us/**', route => route.fulfill({ json: { online: false } }));
    const page = await context.newPage();
    const errors = [], failedLocal = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) failedLocal.push(response.url()); });
    await page.goto(base, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    for (const theme of ['dark', 'light']) {
      await page.evaluate(t => { document.documentElement.dataset.theme = t; localStorage.setItem('feathermc-theme', t); }, theme);
      for (const width of [320, 360, 390, 768, 1024, 1291, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(200);
        await page.waitForFunction(w => document.documentElement.scrollWidth <= w, width, { timeout: 3000 });
        const geometry = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, outside: [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(e => ({ class: String(e.className), right: e.getBoundingClientRect().right })) }));
        assert(geometry.scroll <= width, JSON.stringify({theme, ...geometry}));
        const row = await page.evaluate(() => ({ bottom: document.querySelector('.header').getBoundingClientRect().bottom, hero: document.querySelector('.hero-content').getBoundingClientRect().top, brand: document.querySelector('.header .brand-name').textContent }));
        assert(row.hero >= row.bottom, `Header covers hero: ${width}/${theme}`);
        assert.equal(row.brand, 'Feather');
        assert.equal(await page.locator('#main-menu').evaluate(e => e.inert), width <= 1290);
        if (width <= 1290) {
          await page.locator('#menuButton').click();
          assert.equal(await page.locator('#menuButton').getAttribute('aria-expanded'), 'true');
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#menuButton').getAttribute('aria-expanded'), 'false');
          assert.equal(await page.evaluate(() => document.activeElement.id), 'menuButton');
        }
        await page.evaluate(() => scrollTo(0, 420));
        await page.waitForTimeout(200);
        assert(await page.locator('.header').evaluate(e => e.classList.contains('is-scrolled')));
        const panels = await page.locator('.nav > .brand, .nav > .nav-actions').evaluateAll(es => es.map(e => ({ left: e.getBoundingClientRect().left, right: e.getBoundingClientRect().right })));
        assert(panels.every(b => b.left >= 0 && b.right <= width), `Header bounds: ${width}`);
        if (width > 1290) {
          const groups = await page.locator('.nav > .brand, .nav > .nav-links, .nav > .nav-actions').evaluateAll(es => es.map(e => ({ left: e.getBoundingClientRect().left, right: e.getBoundingClientRect().right })));
          assert(groups[0].right < groups[1].left && groups[1].right < groups[2].left, `Split groups overlap: ${width}`);
        }
        await page.evaluate(() => scrollTo(0, 0));
        await page.waitForTimeout(200);
        assert(!await page.locator('.header').evaluate(e => e.classList.contains('is-scrolled')));
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('#themeToggle').click();
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => localStorage.getItem('feathermc-theme')), 'dark');
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.equal(await page.locator('.nav-shop-link').getAttribute('href'), 'https://feather.trademc.org/');
    assert(await page.locator('a[href="https://discord.gg/afb4uxe3GP"]').count());
    await page.locator('[data-copy]:visible').first().click();
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'mcfeather.com');
    for (const route of ['wiki', 'map']) {
      await page.evaluate(r => location.hash = r, route);
      await page.waitForTimeout(200);
      assert(await page.locator('#view-' + route).isVisible(), route);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForFunction(w => document.documentElement.scrollWidth <= w, width, { timeout: 3000 });
      }
    }
    assert.equal(await page.locator('a[href*="gradient"]').count(), 0);
    assert.equal(await page.locator('#view-gradient').count(), 0);
    assert.equal(await page.locator('.header .brand-name').textContent(), 'Feather');
    assert.equal(await page.locator('#heroTitle').textContent(), 'Feather');
    assert.match(await page.locator('.hero-description').textContent(), /без проходок и лицензии/);
    assert.match(await page.locator('.hero-description').textContent(), /без анкет и заявок/);
    await page.evaluate(() => location.hash = 'gradient');
    await page.waitForTimeout(100);
    assert(!await page.locator('body').evaluate(e => e.classList.contains('page-active')));
    await page.evaluate(() => location.hash = 'wiki/komandy-servera');
    await page.waitForTimeout(100);
    assert(await page.locator('#wikiArticle').isVisible());
    await page.locator('#wikiSearch').fill('/discord');
    assert(await page.locator('.wiki-nav-entry:visible').count() > 0);
    await page.locator('#wikiSearch').fill('нет-такой-статьи-12345');
    assert(await page.locator('#wikiNothing').isVisible());
    await page.locator('#wikiSearchClear').click();
    assert.equal(await page.locator('#wikiSearch').inputValue(), '');
    await page.setViewportSize({ width: 320, height: 900 });
    const wikiToggle = page.locator('.wiki-mobile-toggle');
    assert.equal(await wikiToggle.getAttribute('aria-expanded'), 'false');
    assert(!await page.locator('#wikiNavigation').isVisible());
    await wikiToggle.click();
    assert(await page.locator('#wikiNavigation').isVisible());
    await page.locator('#wikiNavigation a').first().click();
    assert.equal(await wikiToggle.getAttribute('aria-expanded'), 'false');
    await page.evaluate(() => location.hash = '%E0%A4%A');
    await page.waitForTimeout(100);
    assert(!await page.locator('body').evaluate(e => e.classList.contains('page-active')));
    assert.deepEqual(errors, [], 'Uncaught JavaScript errors');
    assert.deepEqual(failedLocal, [], 'Failed local assets');
    console.log('PASS: both themes, 8 widths, menu/focus/motion, routes, wiki search, removed gradient, Feather branding, theme persistence, clipboard, local assets and page errors.');
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());



