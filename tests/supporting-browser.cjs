const { chromium, launchOptions } = require('./browser-config.cjs');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch(launchOptions);
  try{
    const page=await browser.newPage();const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const base=process.env.SITE_URL || 'http://127.0.0.1:18765';
    for(const route of ['/map.html','/map/']){
      await page.goto(base+route);
      for(const width of [320,390,768,1024,1440,1920]){
        await page.setViewportSize({width,height:900});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`map ${width}`);
      }
      assert.equal((await page.locator('.logo').textContent()).trim(),'Feather');
      assert(await page.locator('#mapStatus').isVisible());
      assert(await page.locator('#liveMap').isHidden());
      await page.locator('.map-back').click();await page.waitForURL('**/index.html');
    }
    // Simulate a configured HTTPS proxy without leaking or contacting an upstream.
    await page.route('**/assets/site-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.FEATHER_CONFIG={mapProxyUrl:"https://map.test/"};'}));
    await page.route('https://map.test/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Map test</title><script>parent.postMessage({type:"feather-map-view",hash:"#world:1:0:2"},"*")</script>'}));
    await page.goto(base+'/map.html');
    await page.locator('#liveMap').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>location.hash),'#world:1:0:2');
    await page.unroute('**/assets/site-config.js');
    await page.goto(base+'/gradient.html');await page.waitForURL('**/index.html#top');
    assert.equal(await page.locator('h1').textContent(),'FEATHER');
    assert.deepEqual(errors,[]);
    console.log('PASS: two map URLs/six widths, honest unconfigured state, mocked HTTPS proxy readiness/hash sync, legacy redirect');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
