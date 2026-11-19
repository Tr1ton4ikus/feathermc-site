"""Check canonical routes, metadata, structured data and old URL compatibility."""
from pathlib import Path
from html.parser import HTMLParser
import json,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.meta={};self.canonical=[];self.title='';self.h1=0;self.links=[];self.json=[];self.capture=None;self.text=''
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='meta':self.meta[a.get('name',a.get('property',''))]=a.get('content','')
  if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a['href'])
  if tag=='h1':self.h1+=1
  if tag=='title':self.capture='title';self.text=''
  if tag=='script' and a.get('type')=='application/ld+json':self.capture='json';self.text=''
  if tag=='a' and 'href' in a:self.links.append(a['href'])
 def handle_data(self,data):
  if self.capture:self.text+=data
 def handle_endtag(self,tag):
  if tag=='title' and self.capture=='title':self.title=self.text;self.capture=None
  if tag=='script' and self.capture=='json':self.json.append(json.loads(self.text));self.capture=None
routes=['/','/wiki/','/map/']+['/wiki/'+d['id']+'/' for d in json.load(open(ROOT/'assets/wiki-catalog.json'))]
titles=[];descriptions=[]
for route in routes:
 path=ROOT/route.lstrip('/')/'index.html';p=Page();p.feed(path.read_text())
 canonical='https://mcfeather.com'+route
 assert p.canonical==[canonical],(route,p.canonical)
 assert p.h1==1,(route,p.h1)
 assert p.title and len(p.meta['description'])>50,route
 titles.append(p.title);descriptions.append(p.meta['description'])
 assert p.meta['og:url']==canonical and p.meta['twitter:title']==p.title,route
 assert p.meta['og:image'].endswith('feather-world-figma.webp'),route
 assert p.meta['robots'].startswith('index,follow'),route
 assert len(p.json)==1 and p.json[0]['@context']=='https://schema.org',route
 assert all('.html' not in link for link in p.links if not link.startswith(('http:','https:'))),(route,p.links)
 if route.startswith('/wiki/'):
  assert any(item['@type']=='BreadcrumbList' for item in p.json[0]['@graph']) if route!='/wiki/' else True
assert len(set(titles))==len(routes);assert len(set(descriptions))==len(routes)
locs=[node.text for node in ET.parse(ROOT/'sitemap.xml').findall('.//{*}loc')]
assert set(locs)=={'https://mcfeather.com'+route for route in routes}
for old in [ROOT/'wiki.html',ROOT/'map.html',*(p for p in (ROOT/'wiki').glob('*.html') if p.name!='index.html')]:
 text=old.read_text();assert 'http-equiv="refresh"' in text and 'location.replace' in text,str(old)
assert (ROOT/'404.html').exists()
print(f'PASS: {len(routes)} clean static pages, unique titles/descriptions, canonicals, OG/Twitter, JSON-LD, sitemap and legacy redirects')
