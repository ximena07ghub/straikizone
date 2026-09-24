(() => {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  const account = document.querySelector('[data-account-link]');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll(); addEventListener('scroll', onScroll, {passive:true});
  toggle?.addEventListener('click', () => {
    const open = menu?.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(Boolean(open)));
  });
  document.addEventListener('click', e => {
    if (!menu?.classList.contains('is-open')) return;
    if (!menu.contains(e.target) && !toggle?.contains(e.target)) {
      menu.classList.remove('is-open'); toggle?.setAttribute('aria-expanded','false');
    }
  });
  if (account) {
    try {
      const session = JSON.parse(localStorage.getItem('strikezoneSession') || 'null');
      if (session?.name) {
        account.textContent = session.name.split(' ')[0];
        account.href = 'cuenta.html';
        account.title = 'Abrir mi perfil';
      }
    } catch {}
  }
  document.querySelectorAll('button,a').forEach(el => {
    if (el.dataset.noSound !== undefined) return;
    el.addEventListener('click', () => window.StrikeZoneFeedback?.click(), {passive:true});
  });
})();
