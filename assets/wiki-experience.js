(() => {
  'use strict';
  const normalize = value => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  const search = document.getElementById('search');
  if (search) {
    const cards = [...document.querySelectorAll('#wikiGrid .card')];
    const topics = [...document.querySelectorAll('[data-category].topic')];
    let category = '';
    const corpus = new Map(cards.map(card => [card.dataset.id, normalize(card.textContent)]));
    const update = () => {
      const words = normalize(search.value).split(' ').filter(Boolean);
      let count = 0;
      cards.forEach(card => {
        const matches = (!category || category === card.dataset.category) && words.every(word => corpus.get(card.dataset.id).includes(word));
        card.hidden = !matches;
        if (matches) count++;
      });
      document.getElementById('searchStatus').textContent = `Найдено статей: ${count}`;
      document.getElementById('searchEmpty').hidden = count !== 0;
    };
    search.addEventListener('input', update);
    topics.forEach(button => button.addEventListener('click', () => {
      category = button.dataset.category;
      topics.forEach(topic => { topic.classList.toggle('active', topic === button); topic.setAttribute('aria-pressed', String(topic === button)); });
      update();
    }));
    document.getElementById('resetSearch').addEventListener('click', () => { search.value = ''; topics[0].click(); search.focus(); });
    fetch('assets/wiki-catalog.json').then(response => { if (!response.ok) throw new Error('catalog'); return response.json(); }).then(docs => {
      docs.forEach(doc => { const text = new DOMParser().parseFromString(doc.html, 'text/html').body.textContent; corpus.set(doc.id, normalize(`${doc.title} ${doc.desc} ${doc.cat} ${text}`)); });
      update();
    }).catch(() => { /* Title/category search remains usable offline. */ });
  }
  const navSearch = document.getElementById('wikiNavSearch');
  if (navSearch) navSearch.addEventListener('input', () => {
    const query = normalize(navSearch.value);
    let count = 0;
    document.querySelectorAll('#wikiNavGroups details').forEach(group => {
      let shown = 0;
      group.querySelectorAll('a').forEach(link => { link.hidden = !normalize(link.textContent).includes(query); if (!link.hidden) shown++; });
      group.hidden = shown === 0; count += shown;
      if (query) group.open = true;
    });
    document.getElementById('wikiNavEmpty').hidden = count > 0;
  });
  const toc = document.getElementById('articleToc');
  if (toc) {
    const headings = [...document.querySelectorAll('.article-content h2, .article-content h3')];
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `section-${index + 1}`;
      const item = document.createElement('li');
      item.classList.toggle('toc-subsection', heading.tagName === 'H3');
      const link = document.createElement('a'); link.href = `#${heading.id}`; link.textContent = heading.textContent;
      item.append(link); toc.append(item);
    });
    if (!headings.length) toc.closest('nav').hidden = true;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (!entry.isIntersecting) return;
          toc.querySelectorAll('a').forEach(link => { if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
        });
      }, { rootMargin: '-15% 0px -65% 0px' });
      headings.forEach(heading => observer.observe(heading));
    }
  }
})();
