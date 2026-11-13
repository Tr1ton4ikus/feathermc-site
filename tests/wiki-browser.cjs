const { chromium, launchOptions } = require('./browser-config.cjs');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch(launchOptions);
 const page=await browser.newPage(); const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const base=process.env.SITE_URL || 'http://127.0.0.1:18765';
 await page.goto(base+'/wiki.html');
 await page.locator('#search').fill('/bank');await page.waitForTimeout(400);
 assert.ok(await page.locator('#wikiGrid .card:visible').count()>0,'full text command search');
 await page.locator('#search').fill('несуществующаястатья');assert.equal(await page.locator('#searchEmpty').isVisible(),true);
 await page.locator('#resetSearch').click();assert.equal(await page.locator('#wikiGrid .card:visible').count(),12);
 await page.getByRole('button',{name:'Безопасность',exact:true}).click();assert.equal(await page.locator('#wikiGrid .card:visible').count(),1);
 for (const width of [320,360,390,768,1024,1440,1920]) for (const theme of ['dark','light']) {
  await page.setViewportSize({width,height:900});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`wiki overflow ${width}/${theme}`);
 }
 const links=await page.locator('#wikiGrid .card').evaluateAll(cards=>cards.map(card=>card.getAttribute('href')));
 for(const link of links){await page.goto(base+'/'+link);assert.equal(await page.locator('h1').count(),1);assert.ok(await page.locator('#articleToc a').count()>0);assert.equal(await page.locator('.sidebar [aria-current="page"]').count(),1);
  for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${link} overflow ${width}`);}
 }
 await page.locator('#wikiNavSearch').fill('неттакойстатьи');assert.equal(await page.locator('#wikiNavEmpty').isVisible(),true);
 const before=await page.evaluate(()=>document.documentElement.dataset.theme);await page.locator('#themeToggle').click();assert.notEqual(await page.evaluate(()=>document.documentElement.dataset.theme),before);
 assert.deepEqual(errors,[]);console.log('PASS: full-text search, empty/reset/category, 12 articles, TOCs, sidebar search, theme, seven widths/both themes, no page errors');await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
