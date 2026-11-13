(() => {
 'use strict';
 const data=document.getElementById('featherWikiData');
 if(!data)return;
 const docs=JSON.parse(data.textContent);
 const byId=new Map(docs.map(doc=>[doc.id,doc]));
 const navigation=document.getElementById('wikiNavigation');
 const article=document.getElementById('wikiArticle');
 const search=document.getElementById('wikiSearch');
 const landing=document.getElementById('wikiLanding');
 // Keep the article close to the top on small screens, with navigation one tap away.
 const compact=matchMedia('(max-width:1024px)');
 const toggle=document.createElement('button');toggle.type='button';toggle.className='wiki-mobile-toggle';toggle.textContent='Разделы и статьи';toggle.setAttribute('aria-controls','wikiNavigation');
 navigation.before(toggle);
 const setExpanded=open=>{navigation.classList.toggle('mobile-expanded',open);toggle.setAttribute('aria-expanded',String(open));};
 setExpanded(!compact.matches);
 toggle.addEventListener('click',()=>setExpanded(toggle.getAttribute('aria-expanded')!=='true'));
 compact.addEventListener('change',()=>setExpanded(!compact.matches));
 search.addEventListener('focus',()=>{if(compact.matches)setExpanded(true);});
 navigation.addEventListener('click',event=>{if(compact.matches&&event.target.closest('a')){toggle.focus({preventScroll:true});setExpanded(false);}});
 window.addEventListener('hashchange',()=>{if(compact.matches)setExpanded(false);});
 const groups=new Map();
 docs.forEach(doc=>{if(!groups.has(doc.cat))groups.set(doc.cat,[]);groups.get(doc.cat).push(doc);});
 const existing=new Map([...navigation.querySelectorAll('[data-article-id]')].map(link=>[link.dataset.articleId,link]));
 navigation.replaceChildren();
 groups.forEach((items,category)=>{
  const group=document.createElement('details');group.className='wiki-group';group.open=true;
  const summary=document.createElement('summary');summary.className='wiki-group-title';summary.textContent=category;group.append(summary);
  items.forEach(doc=>{const link=existing.get(doc.id);if(link)group.append(link);});navigation.append(group);
 });
 const filters=document.createElement('div');filters.className='wiki-library-filters';filters.setAttribute('role','group');filters.setAttribute('aria-label','Категории статей');
 const status=document.createElement('p');status.className='wiki-library-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 landing.prepend(filters,status);
 let selected='';
 const buttons=[];
 const normalize=text=>text.toLocaleLowerCase('ru').replace(/ё/g,'е');
 const corpus=new Map(docs.map(doc=>[doc.id,normalize(doc.title+' '+doc.desc+' '+new DOMParser().parseFromString(doc.html,'text/html').body.textContent)]));
 const apply=()=>{
  const words=normalize(search.value).trim().split(/\s+/).filter(Boolean);let count=0;
  navigation.querySelectorAll('.wiki-group').forEach(group=>{
   let visible=0;group.querySelectorAll('[data-article-id]').forEach(link=>{
    const doc=byId.get(link.dataset.articleId);const show=(!selected||selected===doc.cat)&&words.every(word=>corpus.get(doc.id).includes(word));
    link.hidden=!show;link.setAttribute('aria-current',link.classList.contains('active')?'page':'false');if(show){visible++;count++;}
   });group.hidden=!visible;if(words.length)group.open=true;
  });
  document.querySelectorAll('#wikiAllLinks a').forEach(link=>{const doc=byId.get(link.hash.split('/')[1]);link.hidden=!!doc&&((!!selected&&selected!==doc.cat)||!words.every(word=>corpus.get(doc.id).includes(word)));});
  document.getElementById('wikiNothing').hidden=count>0;
  status.textContent=`Найдено статей: ${count}`;
 };
 ['',...groups.keys()].forEach(category=>{
  const button=document.createElement('button');button.type='button';button.textContent=category||'Все статьи';button.setAttribute('aria-pressed',String(!category));
  button.addEventListener('click',()=>{selected=category;buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));apply();});buttons.push(button);filters.append(button);
 });
 search.setAttribute('aria-controls','wikiNavigation wikiAllLinks');search.addEventListener('input',apply);
 document.getElementById('wikiSearchClear').addEventListener('click',()=>{selected='';buttons[0].click();});
 let lastContent=null;let sectionObserver=null;
 const enhanceArticle=()=>{
  const content=article.querySelector('.article-content');
  if(!content||content===lastContent){apply();return;}lastContent=content;
  const duplicate=content.querySelector('h1');if(duplicate)duplicate.remove();
  const title=article.querySelector('.article-title');
  if(title&&title.tagName!=='H1'){const heading=document.createElement('h1');heading.className=title.className;heading.textContent=title.textContent;title.replaceWith(heading);}
  content.querySelectorAll('th:not([scope])').forEach(cell=>cell.setAttribute('scope','col'));
  const id=location.hash.split('/')[1];const index=docs.findIndex(doc=>doc.id===id);
  if(index>=0)document.title=docs[index].title+' — FeatherWiki | FeatherMC';
  const pagination=document.createElement('nav');pagination.className='wiki-article-pagination';pagination.setAttribute('aria-label','Соседние статьи');
  for(const[offset,label]of[[-1,'← Предыдущая статья'],[1,'Следующая статья →']]){
   const doc=docs[index+offset];if(index<0||!doc)continue;
   const link=document.createElement('a');link.href='#wiki/'+doc.id;const small=document.createElement('small');small.textContent=label;const strong=document.createElement('strong');strong.textContent=doc.title;link.append(small,strong);pagination.append(link);
  }
  article.append(pagination);
  if(sectionObserver)sectionObserver.disconnect();
  if('IntersectionObserver'in window){sectionObserver=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{if(!entry.isIntersecting)return;document.querySelectorAll('#wikiToc a').forEach(link=>{if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});});
  },{rootMargin:'-15% 0px -65% 0px'});content.querySelectorAll('h2,h3').forEach(heading=>sectionObserver.observe(heading));}
  apply();
 };
 new MutationObserver(enhanceArticle).observe(article,{childList:true});
 window.addEventListener('hashchange',()=>{requestAnimationFrame(enhanceArticle);});
 document.getElementById('wikiToc').addEventListener('click',event=>{
  const link=event.target.closest('a');if(!link||!matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const heading=document.getElementById(link.hash.slice(1));if(!heading)return;event.preventDefault();event.stopImmediatePropagation();heading.scrollIntoView({behavior:'instant',block:'start'});
 },true);
 enhanceArticle();apply();
})();
