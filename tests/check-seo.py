"""Static SEO sanity checks: content, canonicals, JSON-LD, crawlability and sitemap."""
from pathlib import Path
from html import unescape
import json, re, xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
docs=json.loads((ROOT/'assets/wiki-catalog.json').read_text(encoding='utf-8-sig'))
BASE='https://mcfeather.com/'
canonical_pages=['index.html','wiki.html','map.html']+['wiki/'+d['id']+'.html' for d in docs]
expected={BASE, BASE+'wiki.html', BASE+'map.html'}|{BASE+'wiki/'+d['id']+'.html' for d in docs}
titles=set()

for path in canonical_pages+['map/index.html']:
 html=(ROOT/path).read_text(encoding='utf-8')
 def one(pattern):
  results=re.findall(pattern,html,re.S)
  assert len(results)==1, f'{path}: expected one {pattern}, found {len(results)}'
  return unescape(results[0])
 title=one(r'<title>(.*?)</title>')
 description=one(r'<meta\s+name="description"\s+content="([^"]+)"')
 canonical=one(r'<link\s+rel="canonical"\s+href="([^"]+)"')
 og_title=one(r'<meta\s+property="og:title"\s+content="([^"]+)"')
 og_desc=one(r'<meta\s+property="og:description"\s+content="([^"]+)"')
 og_url=one(r'<meta\s+property="og:url"\s+content="([^"]+)"')
 schemas=re.findall(r'<script\s+type="application/ld\+json">([\s\S]*?)</script>',html)
 assert len(schemas)==1, f'{path}: missing/duplicate structured data'
 schema=json.loads(schemas[0])
 assert schema.get('@context')=='https://schema.org', f'{path}: invalid schema'
 assert len(description)>=50 and len(title)>=15 and og_title and og_desc
 assert not re.search(r'noindex',html,re.I), f'{path}: noindex'
 assert og_url==canonical, f'{path}: mismatch Open Graph URL'
 if path!='map/index.html':
  assert canonical in expected, f'{path}: canonical not in sitemap {canonical}'
  assert title not in titles, f'{path}: duplicate title {title}'
  titles.add(title)
 else:
  assert canonical==BASE+'map.html'
 if path=='index.html':
  assert 'Фезер' in title and 'Майнкрафт' in title
  assert 'Фезер' in html[html.index('<body'):]
  assert any(x.get('@type')=='WebSite' and 'Фезер' in x.get('alternateName',[])
             for x in schema.get('@graph',[])), 'homepage alternate brand missing'
 elif path=='wiki.html':
  assert schema.get('@type')=='CollectionPage'
 elif path.startswith('wiki/'):
  assert any(x.get('@type')=='Article' for x in schema.get('@graph',[]))
  assert any(x.get('@type')=='BreadcrumbList' for x in schema.get('@graph',[]))

sitemap=ET.parse(ROOT/'sitemap.xml').getroot()
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls=[x.text for x in sitemap.findall('s:url/s:loc',ns)]
assert len(urls)==len(set(urls)), 'duplicate sitemap URL'
assert set(urls)==expected, f'sitemap mismatch: missing={expected-set(urls)}, extra={set(urls)-expected}'
robots=(ROOT/'robots.txt').read_text(encoding='utf-8')
assert 'Sitemap: https://mcfeather.com/sitemap.xml' in robots
assert 'Disallow: /' not in robots
print(f'PASS: SEO metadata, schema and sitemap for {len(expected)} canonical URLs; robots.txt points to sitemap')
