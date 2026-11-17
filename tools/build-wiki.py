"""Generate all static wiki pages from the canonical JSON. No runtime framework."""
from pathlib import Path
from html import escape
import argparse, json, re
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
docs=json.loads((ROOT/'assets/wiki-catalog.json').read_text(encoding='utf-8-sig'))
# Art direction only; gameplay content is owned by the JSON catalog.
art={
 'komandy-servera':('Команды сервера','book','#5d3a12','#bd842b'),
 'instrumenty-i-ustroistva':('Инструменты и устройства','pickaxe','#133b3b','#277b78'),
 'cepi-i-redstoun':('Цепи и редстоун','chain','#541c26','#ae384b'),
 'fermerstvo-i-napitki':('Фермерство и напитки','wheat','#233b19','#638b32'),
 'drugie-mekhaniki':('Другие механики','compass','#25315a','#526eb2'),
 'ekonomika-i-klany':('Экономика и кланы','emerald','#123f33','#258968'),
 'obshenie-i-profil':('Общение и профиль','paper','#502737','#aa536d'),
 'golosovoi-chat':('Голосовой чат','disc','#382651','#8153aa'),
 'futbol':('Футбол','snowball','#184246','#2c8b91'),
 'morozhenoe':('Мороженое','snowball','#4c2d44','#b16b9c'),
 'sigarety-i-keis':('Сигареты и кейс','spyglass','#49351e','#987047'),
 'zashita-i-bezopasnost':('Защита и безопасность','shield','#253d58','#4c82aa'),
}

def banner(doc,prefix='',current='',heading=False):
 title,icon,dark,color=art[doc['id']]
 url=f'{prefix}wiki/{doc["id"]}.html'
 tag='div' if heading else 'a'
 attrs='' if heading else f' href="{url}" data-id="{doc["id"]}" data-category="{escape(doc["cat"])}"'+(' aria-current="page"' if current==doc['id'] else '')
 texttag='h1' if heading else 'span'
 return f'''<{tag} class="wiki-banner{' article-banner' if heading else ' card'}" style="--card-dark:{dark};--card-color:{color}"{attrs}><span class="banner-copy"><span class="banner-category">{escape(doc['cat'])}</span><{texttag} class="banner-title">{escape(title)}</{texttag}></span><span class="banner-art" aria-hidden="true"><img src="{prefix}assets/wiki-icons/{icon}.png" alt="" width="256" height="256"><img src="{prefix}assets/wiki-icons/{icon}.png" alt="" width="256" height="256" loading="lazy"><img src="{prefix}assets/wiki-icons/{icon}.png" alt="" width="256" height="256" loading="lazy"></span>{'' if heading else '<span class="banner-arrow" aria-hidden="true">↗</span>'}</{tag}>'''

def page(doc=None):
 prefix='../' if doc else ''
 current=doc['id'] if doc else ''
 title=doc['title']+' — FeatherWiki' if doc else 'FeatherWiki — вики сервера Feather'
 description=doc['desc'] if doc else 'Команды, механики и руководства Minecraft-сервера Feather.'
 canonical='https://mcfeather.com/'+('wiki/'+current+'.html' if doc else 'wiki.html')
 categories=list(dict.fromkeys(item['cat'] for item in docs))
 sidebar=''.join(banner(item,prefix,current) for item in docs)
 if doc:
  content=re.sub(r'^<h1>.*?</h1>\s*','',doc['html'],count=1,flags=re.S).replace('<th>','<th scope="col">')
  i=docs.index(doc)
  neighbors=''.join(f'<a href="{item["id"]}.html"><small>{label}</small><strong>{escape(item["title"])}</strong><span aria-hidden="true">{arrow}</span></a>' for item,label,arrow in [(docs[i-1],'Предыдущая статья','←')] if i>0)
  if i<len(docs)-1:neighbors+=f'<a href="{docs[i+1]["id"]}.html"><small>Следующая статья</small><strong>{escape(docs[i+1]["title"])}</strong><span aria-hidden="true">→</span></a>'
  main=f'''<nav class="wiki-breadcrumb" aria-label="Хлебные крошки"><a href="../wiki.html">Вся вики</a><span aria-hidden="true">/</span><span>{escape(doc['cat'])}</span></nav>{banner(doc,prefix,current,True)}<div class="article-intro"><p>{escape(doc['desc'])}</p><details class="article-toc"><summary>В этой статье</summary><nav aria-label="Содержание статьи"><ol id="articleToc"></ol></nav></details></div><article class="article-content">{content}</article><nav class="wiki-article-pagination" aria-label="Соседние статьи">{neighbors}</nav>'''
 else:
  filters='<button class="topic active" type="button" data-category="" aria-pressed="true">Все статьи</button>'+''.join(f'<button class="topic" type="button" data-category="{escape(cat)}" aria-pressed="false">{escape(cat)}</button>' for cat in categories)
  main=f'''<div class="wiki-intro"><span class="wiki-caption">База знаний Feather</span><h1>Меньше вопросов.<br>Больше игры.</h1><p>Команды, механики и всё, что пригодится в твоём мире.</p></div><label class="search-label" for="search">Поиск по названиям, тексту и командам</label><div class="wiki-search-row"><input id="search" type="search" name="wiki-search" autocomplete="off" placeholder="Например, /bank…" aria-controls="wikiGrid"><button id="resetSearch" type="button">Сбросить</button></div><nav class="wiki-topics" aria-label="Категории статей">{filters}</nav><p id="searchStatus" class="search-status" role="status" aria-live="polite">Найдено статей: {len(docs)}</p><div id="wikiGrid" class="wiki-grid">{sidebar}</div><p id="searchEmpty" class="wiki-empty" hidden>Ничего не найдено. Попробуй другое слово или сбрось поиск.</p>'''
 return f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#121110"><meta name="color-scheme" content="dark"><title>{escape(title)}</title><meta name="description" content="{escape(description)}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="article"><meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="https://mcfeather.com/assets/feather/feather-character.png"><link rel="icon" href="{prefix}assets/feather/feather-logo.png"><link rel="stylesheet" href="{prefix}assets/feather/fonts.css"><link rel="stylesheet" href="{prefix}assets/feather/site.css"><link rel="stylesheet" href="{prefix}assets/feather/wiki.css"><script defer src="{prefix}assets/site-config.js"></script><script defer src="{prefix}assets/analytics.js"></script><script defer src="{prefix}assets/feather/wiki.js"></script><noscript><style>.wiki-sidebar-toggle,.article-toc,.wiki-topics,.wiki-search-row,.search-label,.sidebar-search-label,#wikiNavSearch{{display:none!important}}@media(max-width:760px){{.wiki-sidebar{{display:none}}}}</style></noscript></head><body class="wiki-page"><a class="skip-link" href="#mainContent">К содержимому</a><header class="wiki-header"><button class="wiki-sidebar-toggle" type="button" aria-label="Закрыть список статей" title="Закрыть список статей" aria-expanded="true" aria-controls="wikiSidebar"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path class="sidebar-icon-divider" d="M9 4v16"/><path class="sidebar-icon-chevron" d="m15 9-3 3 3 3"/></svg></button><a class="logo" href="{prefix}index.html"><img src="{prefix}assets/feather/feather-logo.png" width="38" height="38" alt=""><span>Feather<span class="wiki-word"> / wiki</span></span></a><nav aria-label="Основное меню"><a href="{prefix}index.html">Главная</a><a href="{prefix}map.html">Карта мира</a><a href="https://discord.gg/afb4uxe3GP" target="_blank" rel="noopener noreferrer">Discord ↗</a></nav></header><div class="wiki-layout"><div class="wiki-sidebar-space" aria-hidden="true"></div><aside class="wiki-sidebar" id="wikiSidebar" aria-label="Карточки статей"><div class="sidebar-heading"><a href="{prefix}wiki.html">Все руководства <span>{len(docs)}</span></a></div><label class="sidebar-search-label" for="wikiNavSearch">Найти статью</label><input id="wikiNavSearch" type="search" name="sidebar-search" autocomplete="off" placeholder="Название или команда…"><nav class="sidebar-cards" aria-label="Статьи Feather">{sidebar}</nav><p id="wikiNavEmpty" role="status" hidden>Статьи не найдены</p><a class="sidebar-help" href="https://discord.gg/afb4uxe3GP" target="_blank" rel="noopener noreferrer">Нужна помощь? Заходи в Discord ↗</a></aside><main id="mainContent" class="wiki-content" tabindex="-1">{main}<footer class="wiki-footer"><span>© Feather</span><a href="{prefix}index.html#start">play.mcfeather.com</a><a href="https://ccvaults.com/" target="_blank" rel="noopener noreferrer">Minecraft-иконки · CCVault</a></footer></main></div></body></html>'''

stale=[]
for path,source in [(ROOT/'wiki.html',page()),*((ROOT/'wiki'/(doc['id']+'.html'),page(doc)) for doc in docs)]:
 if args.check:
  if path.read_text()!=source:stale.append(str(path.relative_to(ROOT)))
 else:path.write_text(source)
if stale:raise SystemExit('Regenerate wiki: '+', '.join(stale))
print('PASS: 13 wiki pages match the canonical JSON and shared card template' if args.check else 'Generated 13 wiki pages from canonical JSON')
