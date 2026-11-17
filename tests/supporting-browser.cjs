const { chromium, launchOptions } = require('./browser-config.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch(launchOptions);
 try{
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const base=process.env.SITE_URL || 'http://127.0.0.1:18765';
  for(const origin of ['https://pages.test','http://mcfeather.com']) await page.route(origin+'/**',async route=>{
   const url=new URL(route.request().url());
   const response=await route.fetch({url:base+url.pathname+url.search});await route.fulfill({response});
  });
  await page.route(/^http:\/\/[^/]+:8100\//,r=>r.fulfill({contentType:'text/html',body:'<title>Map fixture</title><canvas width="640" height="480"></canvas>'}));
  const forbidden=[];page.on('request',r=>{if(r.url().startsWith('http:')&&r.frame().parentFrame()?.url().startsWith('https:'))forbidden.push(r.url());});
  for(const route of ['/map.html','/map/']){
   await page.goto('https://pages.test'+route+'#world:1:0:2');
   await page.waitForURL('http://mcfeather.com/map.html?embed=1#world:1:0:2');
   await page.locator('#liveMap').waitFor({state:'visible'});
   assert.equal(await page.frameLocator('#liveMap').locator('canvas').count(),1);
   assert((await page.locator('#liveMap').getAttribute('src')).endsWith('#world:1:0:2'));
   for(const width of [320,390,768,1024,1440,1920]){
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`map ${width}`);
   }
   assert.equal((await page.locator('.logo').textContent()).trim(),'Feather');
   assert.equal(await page.locator('.map-back').getAttribute('href'),'https://mcfeather.com/index.html');
  }
  // HTTPS-only browsers must get a fallback rather than a navigation loop.
  await page.goto('https://pages.test/map.html?embed=1');
  assert(await page.locator('#mapStatus').isVisible());assert(await page.locator('#liveMap').isHidden());
  await page.goto('https://pages.test/');
  await page.waitForFunction(()=>document.querySelector('.hero-world-link').href.startsWith('http://mcfeather.com/map.html'));
  assert.equal(await page.locator('.hero-world-link').getAttribute('target'),null);
  for(const [label,url] of [['design by Epartis','https://t.me/epartis'],['code by rossek2','https://rossek2.ru']])
   assert.equal(await page.getByRole('link',{name:label,exact:true}).getAttribute('href'),url);
  assert.deepEqual(forbidden,[],'HTTPS documents must not request HTTP iframes');
  await page.route('**/assets/site-config.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.FEATHER_CONFIG={mapProxyUrl:"https://map.test/"};'}));
  await page.route('https://map.test/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Map test</title><script>parent.postMessage({type:"feather-map-view",hash:"#world:1:0:2"},"*")</script>'}));
  await page.goto(base+'/map.html');await page.locator('#liveMap').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>location.hash),'#world:1:0:2');
  await page.route('https://map.test/**',r=>r.fulfill({contentType:'text/html',body:'<script>parent.postMessage({type:"feather-map-error"},"*")</script>'}));
  await page.reload();await page.locator('#mapRetry').waitFor({state:'visible'});
  await page.unroute('**/assets/site-config.js*');
  await page.goto(base+'/gradient.html');await page.waitForURL('**/index.html#top');
  assert.equal(await page.locator('h1').textContent(),'FEATHER');assert.deepEqual(errors,[]);
  console.log('PASS: same-site map iframe/navigation/coordinates, six widths, HTTPS return links, no redirect loop/mixed frames, credits, proxy readiness/error');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
