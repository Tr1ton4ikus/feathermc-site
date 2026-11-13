const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(root).filter(f => f.endsWith('.html')).concat(fs.readdirSync(path.join(root, 'wiki')).filter(f => f.endsWith('.html')).map(f => 'wiki/' + f));
let scripts = 0;
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const [, attrs, source] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc=/.test(attrs)) continue;
    if (/application\/(?:ld\+)?json/.test(attrs)) JSON.parse(source);
    else { new vm.Script(source, { filename: file }); scripts++; }
  }
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(url)) continue;
    const target = path.resolve(root, path.dirname(file), url.split(/[?#]/)[0]);
    if (!fs.existsSync(target)) throw Error(`${file}: missing ${url}`);
  }
}
for (const file of fs.readdirSync(path.join(root, 'assets')).filter(f => f.endsWith('.js'))) new vm.Script(fs.readFileSync(path.join(root, 'assets', file), 'utf8'), { filename: file });
console.log(`PASS: ${files.length} HTML files, ${scripts} inline scripts, JSON metadata, local links/assets and external JS syntax`);
