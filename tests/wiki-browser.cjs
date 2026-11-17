const { chromium, launchOptions } = require('./browser-config.cjs');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch(launchOptions);
 try {
 const context=await browser.newContext({hasTouch:true});const page=await context.newPage();
 const errors=[],failed=[];page.on('pageerror',error=>errors.push(error.message));
 const base=process.env.SITE_URL || 'http://127.0.0.1:18765';
 page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push(r.url());});
 await page.goto(base+'/wiki.html');
 await page.locator('#search').fill('/bank');await page.waitForFunction(()=>document.getElementById('searchStatus').textContent!=='Найдено статей: 0');
 assert.ok(await page.locator('#wikiGrid .card:visible').count()>0,'full text command search');
 await page.locator('#search').fill('несуществующаястатья');assert.equal(await page.locator('#searchEmpty').isVisible(),true);
 await page.locator('#resetSearch').click();assert.equal(await page.locator('#wikiGrid .card:visible').count(),12);
 await page.getByRole('button',{name:'Безопасность',exact:true}).click();assert.equal(await page.locator('#wikiGrid .card:visible').count(),1);
 await page.locator('#resetSearch').click();
 for (const width of [320,360,390,768,1024,1440,1920]) {
  await page.setViewportSize({width,height:900});
  await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth);
 }
 const links=await page.locator('#wikiGrid .card').evaluateAll(cards=>cards.map(card=>card.getAttribute('href')));
 for(const link of links){await page.goto(base+'/'+link);assert.equal(await page.locator('h1').count(),1);assert.ok(await page.locator('#articleToc a').count()>0);assert.equal(await page.locator('.wiki-sidebar [aria-current="page"]').count(),1);
  assert.equal(await page.locator('.article-banner img').count(),3);
  for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth);}
 }
 await page.setViewportSize({width:1440,height:900});
 await page.locator('#wikiNavSearch').fill('неттакойстатьи');assert.equal(await page.locator('#wikiNavEmpty').isVisible(),true);
 await page.locator('#wikiNavSearch').fill('');
 // Closing has a real exit; reversing mid-flight must preserve the drawn position.
 const continuity=await page.evaluate(async()=>{
   const button=document.querySelector('.wiki-sidebar-toggle');
   const panel=document.getElementById('wikiSidebar');
   button.click();await new Promise(resolve=>setTimeout(resolve,70));
   const before=panel.getBoundingClientRect().left;
   const closing=!panel.hidden && panel.inert;
   button.click();const after=panel.getBoundingClientRect().left;
   await new Promise(resolve=>setTimeout(resolve,320));
   return {closing,jump:Math.abs(after-before),settled:!panel.hidden && !panel.inert && panel.getAnimations().length===0};
 });
 assert(continuity.closing);assert(continuity.jump<2);assert(continuity.settled);
 // Drawer reversal, phone focus containment and Escape must work during animation.
 await page.setViewportSize({width:390,height:844});
 const toggle=page.locator('.wiki-sidebar-toggle');
 assert.equal((await toggle.textContent()).trim(),'');
 assert((await toggle.boundingBox()).x < 40);
 assert.equal(await toggle.locator('svg').count(),1);
 await toggle.click();await toggle.click();await toggle.click();
 assert(await page.locator('#wikiSidebar').isVisible());
 assert(await page.locator('#mainContent').evaluate(e=>e.inert));
 await page.keyboard.press('Escape');await page.locator('#wikiSidebar').waitFor({state:'hidden'});assert(await page.locator('#wikiSidebar').isHidden());
 assert(await toggle.evaluate(e=>e===document.activeElement));
 assert(!await page.locator('#mainContent').evaluate(e=>e.inert));
 await toggle.tap();await page.locator('.sidebar-cards a').nth(5).tap();
 await page.waitForURL('**/wiki/ekonomika-i-klany.html');
 assert.equal(await page.locator('h1').textContent(),'Экономика и кланы');
 await page.emulateMedia({reducedMotion:'reduce'});await toggle.click();
 assert.equal(await page.locator('#wikiSidebar').evaluate(e=>e.getAnimations().length),0);
 const nojs=await browser.newContext({javaScriptEnabled:false});const plain=await nojs.newPage();
 await plain.goto(base+'/wiki/komandy-servera.html');assert(await plain.locator('.article-content').isVisible());
 assert.equal(await plain.locator('h1').count(),1);await nojs.close();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 console.log('PASS: JSON search/commands/categories, 12 articles, shared banners, TOCs, sidebar/current article, seven widths, drawer reversal/Escape/focus, reduced motion, no-JS, no page/asset errors');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
