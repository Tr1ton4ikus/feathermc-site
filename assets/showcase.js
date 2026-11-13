(() => {
  'use strict';
  const hero = document.querySelector('.hero.homepage');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let moveFrame = 0;
  if (hero && finePointer.matches && !reducedMotion.matches) {
    hero.addEventListener('pointermove', event => {
      if (moveFrame) return;
      const x = event.clientX, y = event.clientY;
      moveFrame = requestAnimationFrame(() => {
        moveFrame = 0;
        const rect = hero.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const dx = ((x - rect.left) / rect.width - 0.5) * -19;
        const dy = ((y - rect.top) / rect.height - 0.5) * -11;
        hero.style.setProperty('--hero-x', dx.toFixed(1) + 'px');
        hero.style.setProperty('--hero-y', dy.toFixed(1) + 'px');
      });
    }, {passive: true});
    hero.addEventListener('pointerleave', () => {
      if (moveFrame) { cancelAnimationFrame(moveFrame); moveFrame = 0; }
      hero.style.setProperty('--hero-x', '0px');
      hero.style.setProperty('--hero-y', '0px');
    });
  }
  const dialog = document.getElementById('worldLightbox');
  if (!dialog) return;
  const image = document.getElementById('worldLightboxImage');
  const caption = document.getElementById('worldLightboxCaption');
  document.querySelectorAll('[data-world-scene]').forEach(link => {
    link.addEventListener('click', event => {
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      const thumbnail = link.querySelector('img');
      if (!thumbnail) return;
      image.src = link.getAttribute('href');
      image.alt = thumbnail.alt;
      caption.textContent = link.dataset.sceneTitle || 'Атмосфера FeatherMC';
      dialog.showModal();
    });
  });
  dialog.querySelector('[data-world-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
  });
})();