// Compatibility of old shared hashes after replacing the SPA with static pages.
const { chromium, launchOptions } = require('./browser-config.cjs');
const assert = require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch(launchOptions);
  try {
    const page=await browser.newPage();
    await page.route(/^https?:\/\/(?:[^/]+:8100|map\.mcfeather\.com)\//, route=>route.fulfill({contentType:'text/html',body:'<title>Map test</title>'}));
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const base=process.env.SITE_URL || 'http://127.0.0.1:18765';
    await page.goto(base+'/#wiki');await page.waitForURL('**/wiki/');
    assert.equal(await page.locator('#wikiGrid .card').count(),16);
    await page.goto(base+'/#wiki/komandy-servera');await page.waitForURL('**/wiki/komandy-servera/');
    assert.equal(await page.locator('h1').count(),1);
    await page.goto(base+'/#wiki/unknown-article');await page.waitForURL('**/wiki/');
    await page.goto(base+'/#map');await page.waitForURL('**/map/');
    assert(await page.locator('.map-page').isVisible());
    assert.deepEqual(errors,[]);
    console.log('PASS: legacy wiki index/article/unknown-article and map hashes redirect to canonical static pages');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
