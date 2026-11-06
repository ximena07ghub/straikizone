
(() => {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  const account = document.querySelector('[data-account-link]');

  const emailOf = value =>
    String(value || '').trim().toLowerCase();

  // Identificador estable para cuentas antiguas.
  const userId = user =>
    typeof user.id === 'string' && user.id.trim()
      ? user.id
      : `legacy-${encodeURIComponent(emailOf(user.email))}`;

  // Validar sesión contra usuarios registrados.
  function validSession() {
    if (window.StrikeZoneRewards?.session) {
      return window.StrikeZoneRewards.session();
    }

    try {
      const users = JSON.parse(
        localStorage.getItem('strikezoneUsers') || '[]'
      );

      const saved = JSON.parse(
        localStorage.getItem('strikezoneSession') || 'null'
      );

      if (!Array.isArray(users) || !saved?.email) {
        return null;
      }

      const email = emailOf(saved.email);

      const matches = users.filter(
        user => emailOf(user?.email) === email
      );

      if (matches.length !== 1) return null;

      const user = matches[0];
      const id = userId(user);

      if (
        !user?.name ||
        !user?.passwordHash ||
        (saved.id && saved.id !== id) ||
        (!saved.id && saved.name !== user.name)
      ) {
        return null;
      }

      return {
        id,
        name: user.name,
        email
      };
    } catch {
      return null;
    }
  }

  // Mantener el efecto del encabezado.
  function updateScroll() {
    header?.classList.toggle(
      'is-scrolled',
      window.scrollY > 8
    );
  }

  updateScroll();

  window.addEventListener(
    'scroll',
    updateScroll,
    { passive: true }
  );

  // Controlar el menú móvil.
  function setMenu(open) {
    if (!toggle || !menu) return;

    menu.classList.toggle('is-open', open);

    toggle.setAttribute(
      'aria-expanded',
      String(open)
    );

    toggle.setAttribute(
      'aria-label',
      open ? 'Cerrar menú' : 'Abrir menú'
    );
  }

  toggle?.addEventListener('click', () => {
    setMenu(!menu?.classList.contains('is-open'));
  });

  // Cerrar al seleccionar un enlace.
  menu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      setMenu(false);
    });
  });

  // Cerrar al tocar fuera.
  document.addEventListener('click', event => {
    if (!menu?.classList.contains('is-open')) return;

    if (
      !menu.contains(event.target) &&
      !toggle?.contains(event.target)
    ) {
      setMenu(false);
    }
  });

  // Cerrar con Escape.
  document.addEventListener('keydown', event => {
    if (
      event.key === 'Escape' &&
      menu?.classList.contains('is-open')
    ) {
      setMenu(false);
      toggle?.focus();
    }
  });

  // Cerrar si vuelve la navegación de escritorio.
  const desktop = window.matchMedia('(min-width: 931px)');

  function onDesktopChange(event) {
    if (event.matches) setMenu(false);
  }

  if (desktop.addEventListener) {
    desktop.addEventListener('change', onDesktopChange);
  } else {
    desktop.addListener(onDesktopChange);
  }

  // Identificar la página actual.
  const currentPage =
    location.pathname.split('/').pop() || 'index.html';

  menu?.querySelectorAll('a[href]').forEach(link => {
    const url = new URL(link.getAttribute('href'), location.href);
    const page = url.pathname.split('/').pop() || 'index.html';

    const active =
      url.origin === location.origin &&
      page === currentPage &&
      !url.search &&
      !url.hash;

    link.classList.toggle('is-active', active);

    if (active) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  // Actualizar enlace de la cuenta.
  function updateAccount() {
    if (!account) return;

    const session = validSession();

    if (session) {
      account.textContent = session.name;
      account.href = 'cuenta.html';
      account.title = 'Abrir mi perfil';
      account.setAttribute(
        'aria-label',
        `Abrir perfil de ${session.name}`
      );
    } else {
      account.textContent = 'Iniciar sesión';
      account.href = 'login.html';
      account.title = 'Iniciar sesión';
      account.setAttribute(
        'aria-label',
        'Iniciar sesión'
      );
    }
  }

  updateAccount();

  // Sincronizar entre pestañas.
  window.addEventListener('storage', event => {
    if (
      event.key === 'strikezoneSession' ||
      event.key === 'strikezoneUsers'
    ) {
      updateAccount();
    }
  });

  window.addEventListener('pageshow', updateAccount);

  // Conservar el sonido original.
  document.querySelectorAll('button, a').forEach(element => {
    if (element.dataset.noSound !== undefined) return;

    element.addEventListener(
      'click',
      () => window.StrikeZoneFeedback?.click(),
      { passive: true }
    );
  });
})();
