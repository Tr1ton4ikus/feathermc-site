const { chromium, launchOptions } = require('./browser-config.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch(launchOptions);
 try{
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const base=process.env.SITE_URL || 'http://127.0.0.1:18765';
  // Serve real local files under an intercepted HTTPS origin to verify browser
  // mixed-content handling without hitting an actual game server in CI.
  await page.route('https://pages.test/**',async route=>{
   const url=new URL(route.request().url());
   const response=await route.fetch({url:base+url.pathname+url.search});
   await route.fulfill({response});
  });
  const forbidden=[];page.on('request',r=>{if(r.url().startsWith('http:')&&r.frame().parentFrame())forbidden.push(r.url());});
  for(const route of ['/map.html','/map/']){
   await page.goto('https://pages.test'+route);
   for(const width of [320,390,768,1024,1440,1920]){
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`map ${width}`);
   }
   assert.equal((await page.locator('.logo').textContent()).trim(),'Feather');
   assert(await page.locator('#mapStatus').isVisible());assert(await page.locator('#liveMap').isHidden());
   const link=page.locator('#mapDirect');
   assert((await link.getAttribute('href')).startsWith('http:'));assert.equal(await link.getAttribute('target'),'_blank');
   await page.evaluate(()=>location.hash='#world:1:0:2');
   assert((await link.getAttribute('href')).endsWith('#world:1:0:2'));
  }
  await page.goto('https://pages.test/');
  await page.waitForFunction(()=>document.querySelector('.hero-world-link').target==='_blank');
  assert((await page.locator('.hero-world-link').getAttribute('href')).startsWith('http:'));
  for(const [label,url] of [['design by Epartis','https://t.me/epartis'],['code by rossek2','https://rossek2.ru']])
   assert.equal(await page.getByRole('link',{name:label,exact:true}).getAttribute('href'),url);
  assert.deepEqual(forbidden,[],'HTTPS site must not attempt mixed-content frames');
  // Optional proxy readiness, coordinate updates, failure and retry.
  await page.route('**/assets/site-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.FEATHER_CONFIG={mapProxyUrl:"https://map.test/"};'}));
  await page.route('https://map.test/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Map test</title><script>parent.postMessage({type:"feather-map-view",hash:"#world:1:0:2"},"*")</script>'}));
  await page.goto(base+'/map.html');await page.locator('#liveMap').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>location.hash),'#world:1:0:2');
  await page.locator('#liveMap').evaluate(frame=>frame.contentWindow.postMessage('ignored','*'));
  await page.route('https://map.test/**',r=>r.fulfill({contentType:'text/html',body:'<script>parent.postMessage({type:"feather-map-error"},"*")</script>'}));
  await page.reload();await page.locator('#mapRetry').waitFor({state:'visible'});
  // Plain HTTP can embed directly; dimensions must exist during initialization.
  await page.route('**/assets/site-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.FEATHER_CONFIG={mapDirectUrl:"http://map.test/#world:1:0:2"};'}));
  await page.route('http://map.test/**',async r=>{await new Promise(resolve=>setTimeout(resolve,100));await r.fulfill({contentType:'text/html',body:'<title>Direct test</title>Map'});});
  await page.goto(base+'/map.html');await page.locator('#liveMap').waitFor({state:'visible'});
  assert((await page.locator('#liveMap').boundingBox()).width>300);
  await page.unroute('**/assets/site-config.js');
  await page.goto(base+'/gradient.html');await page.waitForURL('**/index.html#top');
  assert.equal(await page.locator('h1').textContent(),'FEATHER');
  assert.deepEqual(errors,[]);
  console.log('PASS: HTTPS direct map links/six widths/coordinates, no mixed-content frames, footer credits, proxy ready/error, HTTP embed dimensions and legacy redirect');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
