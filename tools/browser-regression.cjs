const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium, launchOptions } = require('../tests/browser-config.cjs');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
const server = http.createServer(async (request,response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    pathname = pathname.replace(/^\/feathermc-site(?=\/)/, '');
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root,'.'+pathname);
    if (!file.startsWith(root+path.sep)) {response.writeHead(403).end();return;}
    const data = await fs.readFile(file);
    response.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(data);
  } catch {response.writeHead(404).end();}
});
(async () => {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base = process.env.SITE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch(launchOptions);
  try {
    const context = await browser.newContext({reducedMotion:'reduce', permissions:['clipboard-read','clipboard-write']});
    await context.route(/^https?:\/\/(?:[^/]+:8100|map\.mcfeather\.com)\//, route=>route.fulfill({contentType:'text/html',body:'<title>Map test</title>'}));
    const page = await context.newPage();
    const errors=[], failedLocal=[], analytics=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failedLocal.push(r.url());});
    page.on('request',r=>{if(/mc\.yandex/.test(r.url()))analytics.push(r.url());});
    await page.goto(base+'/');
    await page.evaluate(()=>document.fonts.ready);
    for(const width of [320,390,760,768,1024,1100,1149,1150,1440,1920]) {
      await page.setViewportSize({width,height:900});
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`);
      if(width<=760){
        await page.getByRole('button',{name:'Открыть меню'}).click();
        assert(await page.locator('#mobile-navigation').isVisible());
        await page.keyboard.press('Escape');
        assert(await page.locator('#mobile-navigation').isHidden());
        assert(await page.locator('.menu-button').evaluate(e=>e===document.activeElement));
      }
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('.hero-connect .copy-address').click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'play.mcfeather.com');
    await page.getByRole('tab',{name:'Дуэли'}).click();
    assert(await page.locator('#panel-duels').isVisible());
    await page.getByRole('tab',{name:'Дуэли'}).press('ArrowLeft');
    assert(await page.locator('#panel-vanilla').isVisible());
    await page.getByRole('tab',{name:'Ванилла'}).press('End');
    assert(await page.getByRole('tab',{name:'Дуэли'}).evaluate(e=>e===document.activeElement));
    await page.getByRole('tab',{name:'Дуэли'}).press('Home');
    await page.locator('.faq-item summary').nth(1).click();
    assert(await page.locator('.faq-item').nth(1).evaluate(e=>e.open));
    assert.equal(await page.locator('script[src*="_next"],script[src*="react"],script[src*="framer"]').count(),0);
    assert.equal(analytics.length,0,'Metrica must stay off with no real ID');
    assert(await page.locator('a[href="wiki.html"]').count());
    assert(await page.locator('a[href="https://discord.gg/afb4uxe3GP"]').count());
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>!(a instanceof CSSTransition)).length),0,'reduced motion');
    // The same document and its resources work beneath a GitHub project prefix.
    if(!process.env.SITE_URL){
      await page.goto(base+'/feathermc-site/');
      await page.locator('.hero-world-link').click();
      await page.waitForURL('**/feathermc-site/map.html');
      assert(await page.locator('.map-page').isVisible());
    }
    const nojs=await browser.newContext({javaScriptEnabled:false});
    const plain=await nojs.newPage();await plain.goto(base+'/');
    assert(await plain.locator('.hero-copy').isVisible());
    assert(await plain.locator('#panel-duels').isVisible());
    await nojs.close();
    const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const phone=await touch.newPage();await phone.goto(base+'/');
    await phone.getByRole('button',{name:'Открыть меню'}).tap();
    await phone.locator('#mobile-navigation a[href="wiki.html"]').tap();
    await phone.waitForURL('**/wiki.html');await touch.close();
    // Configure a dummy counter only in this isolated, fully intercepted test.
    const metric=await browser.newContext();
    const m=await metric.newPage();let loads=0;
    await m.route('**/assets/site-config.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.FEATHER_CONFIG={metrikaCounterId:123456789};'}));
    await m.route('https://mc.yandex.ru/**',r=>{loads++;return r.fulfill({contentType:'text/javascript',body:''});});
    await m.goto(base+'/');
    const queued=await m.evaluate(()=>window.ym.a.map(args=>Array.from(args)));
    assert.equal(queued.filter(args=>args[1]==='init').length,1);
    assert.equal(loads,1);
    await m.locator('.hero-connect .copy-address').click();
    await metric.close();
    assert.deepEqual(errors,[]);assert.deepEqual(failedLocal,[]);
    console.log('PASS: vanilla runtime, 10 widths, keyboard/touch menu, tabs, clipboard, FAQ, reduced motion, no-JS, project-prefix paths, disabled and mocked Metrica');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
