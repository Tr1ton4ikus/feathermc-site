from pathlib import Path
from html.parser import HTMLParser
import json,re,urllib.parse
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=[];self.h1=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1':self.h1+=1
  if 'id'in a:self.ids.append(a['id'])
  for key in ('href','src'):
   if key in a:self.links.append(a[key])
errors=[]
for path in [ROOT/'wiki.html',*(ROOT/'wiki').glob('*.html')]:
 page=Page();page.feed(path.read_text(encoding='utf-8'))
 if page.h1!=1:errors.append(f'{path.name}: {page.h1} h1 headings')
 if len(page.ids)!=len(set(page.ids)):errors.append(f'{path.name}: duplicate IDs')
 for link in page.links:
  url=urllib.parse.urlsplit(link)
  if url.scheme or not url.path:continue
  target=(path.parent/urllib.parse.unquote(url.path)).resolve()
  if not target.exists():errors.append(f'{path.name}: broken {link}')
docs=json.loads((ROOT/'assets/wiki-catalog.json').read_text(encoding='utf-8-sig'))
assert len(docs)==12
assert len({doc['id'] for doc in docs})==12
assert len({doc['cat'] for doc in docs})==6
for doc in docs:
 body=(ROOT/'wiki'/(doc['id']+'.html')).read_text(encoding='utf-8')
 for command in re.findall(r'<code>(.*?)</code>',doc['html'],re.S):
  if '<code>'+command+'</code>'not in body:errors.append(f"{doc['id']}: lost command {command}")
if errors:raise SystemExit('\n'.join(errors))
print('PASS: 13 wiki pages, unique headings/IDs, all local links and assets, 12 canonical articles, 6 categories, all command markup preserved')
