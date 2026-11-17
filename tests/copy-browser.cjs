const { chromium, launchOptions }=require('./browser-config.cjs');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch(launchOptions);
 try{
  const base=process.env.SITE_URL||'http://127.0.0.1:18765';
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,permissions:['clipboard-read','clipboard-write']});
  const reader=await context.newPage();await reader.goto(base+'/');
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // A genuine insecure origin: Clipboard API is unavailable, so use the actual
  // synchronous browser copy command, then read the clipboard from localhost.
  await page.route('http://copy.test/**',async route=>{
   const url=new URL(route.request().url());const response=await route.fetch({url:base+url.pathname+url.search});await route.fulfill({response});
  });
  await page.goto('http://copy.test/');
  assert.equal(await page.evaluate(()=>isSecureContext),false);
  for(const selector of ['.hero-connect .copy-address','.start-intro .copy-address']){
   await reader.bringToFront();await reader.evaluate(()=>navigator.clipboard.writeText('before-copy'));
   await page.bringToFront();await page.locator(selector).tap();
   assert((await page.locator(selector+' .copy-value').textContent()).includes('Скопировано!'));
   await reader.bringToFront();assert.equal(await reader.evaluate(()=>navigator.clipboard.readText()),'play.mcfeather.com');
  }
  // A denied modern API falls back too; no false success when both are denied.
  await page.goto(base+'/');
  await page.evaluate(()=>{navigator.clipboard.writeText=()=>Promise.reject(new DOMException('denied','NotAllowedError'));});
  await page.locator('.hero-connect .copy-address').tap();
  assert((await page.locator('.hero-connect .copy-value').textContent()).includes('Скопировано!'));
  await reader.bringToFront();assert.equal(await reader.evaluate(()=>navigator.clipboard.readText()),'play.mcfeather.com');
  await page.bringToFront();await page.evaluate(()=>{document.execCommand=()=>false;});
  await page.locator('.start-intro .copy-address').tap();
  const dialog=page.locator('.copy-dialog');assert(await dialog.isVisible());
  assert.equal(await dialog.locator('input').inputValue(),'play.mcfeather.com');
  assert.equal(await dialog.locator('input').evaluate(e=>e.selectionEnd-e.selectionStart),18);
  await dialog.getByRole('button',{name:'Готово'}).tap();assert(await dialog.isHidden());
  assert(await page.locator('.start-intro .copy-address').evaluate(e=>e===document.activeElement));
  assert.deepEqual(errors,[]);await context.close();
  console.log('PASS: mobile taps copy real clipboard on HTTP, both visible address buttons, denied modern API fallback, manual selection dialog and focus return');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
