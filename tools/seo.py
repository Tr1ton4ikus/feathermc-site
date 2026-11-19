"""Shared metadata and real static route helpers for GitHub Pages."""
import json, re, posixpath
from html import escape
from urllib.parse import urlsplit, urlunsplit
ORIGIN='https://mcfeather.com'
IMAGE=ORIGIN+'/assets/feather/feather-world-figma.webp'
def route(path):
 if path=='index.html':return ''
 if path.endswith('.html'):return path[:-5]+'/'
 return path

def clean_links(html,old_file,new_file):
 def replace(match):
  key,quote,value=match.groups()
  url=urlsplit(value)
  if url.scheme or url.netloc or not url.path:return match[0]
  resolved=posixpath.normpath(posixpath.join(posixpath.dirname(old_file),url.path))
  if resolved.endswith('.html'):resolved=route(resolved)
  target=posixpath.relpath(resolved or '.',posixpath.dirname(new_file) or '.')
  if resolved.endswith('/') and not target.endswith('/'):target+='/'
  if not resolved:target='./' if posixpath.dirname(new_file)=='' else target+'/'
  return key+'='+quote+urlunsplit(('', '',target,url.query,url.fragment))+quote
 return re.sub(r'\b(href|src)=(["\'])(.*?)\2',replace,html)

def metadata(html,path,title,description,kind='WebPage',breadcrumbs=None,items=None,faq=None,noindex=False):
 canonical=ORIGIN+path
 html=re.sub(r'<title>.*?</title>','',html,flags=re.S)
 html=re.sub(r'<meta\b(?=[^>]*(?:name=["\'](?:description|robots|twitter:[^"\']+)|property=["\']og:))[^>]*>','',html,flags=re.I)
 html=re.sub(r'<link\b(?=[^>]*rel=["\']canonical)[^>]*>','',html,flags=re.I)
 html=re.sub(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>.*?</script>','',html,flags=re.S)
 org={'@type':'Organization','@id':ORIGIN+'/#organization','name':'Feather','url':ORIGIN+'/','logo':ORIGIN+'/assets/feather/feather-logo.png','sameAs':['https://discord.gg/afb4uxe3GP']}
 website={'@type':'WebSite','@id':ORIGIN+'/#website','name':'Feather','alternateName':['Фезер','FeatherMC','Фезер Майнкрафт'],'url':ORIGIN+'/','inLanguage':'ru-RU','publisher':{'@id':org['@id']}}
 page={'@type':kind,'@id':canonical+'#page','url':canonical,'name':title,'description':description,'inLanguage':'ru-RU','isPartOf':{'@id':website['@id']},'primaryImageOfPage':{'@type':'ImageObject','url':IMAGE}}
 if kind=='TechArticle':page.update({'headline':title,'mainEntityOfPage':canonical,'author':{'@id':org['@id']},'publisher':{'@id':org['@id']}})
 graph=[org,website,page]
 if breadcrumbs:
  crumb={'@type':'BreadcrumbList','@id':canonical+'#breadcrumbs','itemListElement':[{'@type':'ListItem','position':i+1,'name':name,'item':ORIGIN+url} for i,(name,url) in enumerate(breadcrumbs)]};graph.append(crumb);page['breadcrumb']={'@id':crumb['@id']}
 if items:page['mainEntity']={'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'name':name,'url':ORIGIN+url} for i,(name,url) in enumerate(items)]}
 if faq:graph.append({'@type':'FAQPage','@id':canonical+'#faq','mainEntity':[{'@type':'Question','name':question,'acceptedAnswer':{'@type':'Answer','text':answer}} for question,answer in faq]})
 tags=f'<title>{escape(title)}</title><meta name="description" content="{escape(description,quote=True)}"><meta name="robots" content="'+('noindex,follow' if noindex else 'index,follow,max-image-preview:large')+'">'
 for key,value in {'og:type':'article' if kind=='TechArticle' else 'website','og:locale':'ru_RU','og:site_name':'Feather','og:title':title,'og:description':description,'og:url':canonical,'og:image':IMAGE,'og:image:width':'1447','og:image:height':'1087','og:image:alt':'Иллюстрированная карта мира Feather'}.items():tags+=f'<meta property="{key}" content="{escape(value,quote=True)}">'
 for key,value in {'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':IMAGE}.items():tags+=f'<meta name="{key}" content="{escape(value,quote=True)}">'
 tags+=f'<link rel="canonical" href="{canonical}"><script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+'</script>'
 return html.replace('</head>',tags+'</head>')

def redirect(destination,canonical):
 # Meta refresh is understood without JS. JS additionally retains query/hash.
 return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Переход — Feather</title><link rel="canonical" href="'+ORIGIN+canonical+'"><meta http-equiv="refresh" content="0;url='+escape(destination,quote=True)+'"></head><body><p><a href="'+escape(destination,quote=True)+'">Открыть страницу Feather</a></p><script>const target=new URL('+json.dumps(destination)+',location.href);target.search=location.search;target.hash=location.hash;location.replace(target.href)</script></body></html>'
