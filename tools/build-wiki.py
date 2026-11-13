"""Synchronize canonical wiki content. Run after editing assets/wiki-catalog.json.
The catalog is the single article source; standalone pages remain readable without JS.
Use --index-only in the homepage integration branch to refresh its legacy router data.
"""
from pathlib import Path
import argparse,json,re
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(); parser.add_argument('--index-only',action='store_true');args=parser.parse_args()
docs=json.loads((ROOT/'assets/wiki-catalog.json').read_text(encoding='utf-8-sig'))
if args.index_only:
 path=ROOT/'index.html'; source=path.read_text(encoding='utf-8')
 match=re.search(r'(<script[^>]*id="featherWikiData"[^>]*>)(.*?)(</script>)',source,re.S)
 if not match: raise SystemExit('wiki-data script not found; inspect router before integration')
 embedded=[]
 for doc in docs:
  item=dict(doc);item['icon']='✦'
  item['html']=re.sub(r'href="([a-z0-9-]+)\.html"',r'href="#wiki/\1"',item['html']).replace('src="../assets/','src="assets/')
  embedded.append(item)
 payload=json.dumps(embedded,ensure_ascii=False,separators=(',',':')).replace('</script','<\\/script')
 source=source[:match.start(2)]+payload+source[match.end(2):]
 path.write_text(source,encoding='utf-8');print('Synchronized homepage wiki-data from canonical catalog')
else:
 for doc in docs:
  path=ROOT/'wiki'/(doc['id']+'.html');source=path.read_text(encoding='utf-8')
  content=re.sub(r'^<h1>.*?</h1>\s*','',doc['html'],count=1,flags=re.S)
  source,n=re.subn(r'(<div class="article-content">).*?(</div><hr)',lambda match:match[1]+content+match[2],source,count=1,flags=re.S)
  if n!=1:raise SystemExit(f'Unexpected article template: {path}')
  path.write_text(source,encoding='utf-8')
 print(f'Synchronized {len(docs)} standalone article bodies')

