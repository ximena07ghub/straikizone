
(async () => {
  const rewards = window.StrikeZoneRewards;

  const guest = document.querySelector(
    '[data-account-guest]'
  );

  const content = document.querySelectorAll(
    '[data-account-content]'
  );

  const logoutButton = document.querySelector(
    '[data-logout]'
  );

  const emailOf = value =>
    String(value || '').trim().toLowerCase();

  const userId = user =>
    typeof user.id === 'string' && user.id.trim()
      ? user.id
      : `legacy-${encodeURIComponent(emailOf(user.email))}`;

  // Validar sesión incluso si falta rewards.js.
  function validSession() {
    if (rewards?.session) {
      return rewards.session();
    }

    try {
      const saved = JSON.parse(
        localStorage.getItem('strikezoneSession') || 'null'
      );

      const users = JSON.parse(
        localStorage.getItem('strikezoneUsers') || '[]'
      );

      if (!saved || !Array.isArray(users)) {
        return null;
      }

      const matches = users.filter(
        user =>
          emailOf(user?.email) === emailOf(saved.email)
      );

      if (matches.length !== 1) return null;

      const user = matches[0];
      const id = userId(user);

      if (
        !user.name ||
        !user.passwordHash ||
        (saved.id && saved.id !== id) ||
        (!saved.id && saved.name !== user.name)
      ) {
        return null;
      }

      return {
        id,
        name: user.name,
        email: emailOf(user.email)
      };
    } catch {
      return null;
    }
  }

  // Evitar insertar HTML desde datos personales.
  function escape(value) {
    return String(value ?? '').replace(
      /[&<>"']/g,
      character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[character]
    );
  }

  function showGuest() {
    if (guest) guest.hidden = false;

    content.forEach(element => {
      element.hidden = true;
    });
  }

  function showProfile() {
    if (guest) guest.hidden = true;

    content.forEach(element => {
      element.hidden = false;
    });
  }

  // Mensajes junto al botón de salida.
  function showError(text) {
    let message = document.querySelector(
      '[data-account-error]'
    );

    if (!message && logoutButton) {
      message = document.createElement('p');

      message.dataset.accountError = '';
      message.className = 'status-message';
      message.setAttribute('role', 'alert');

      logoutButton.insertAdjacentElement(
        'afterend',
        message
      );
    }

    if (message) {
      message.textContent = text;
    }
  }

  const session = validSession();

  if (!session) {
    showGuest();
    return;
  }

  showProfile();

  // Nombre y datos de la cuenta validada.
  document.querySelectorAll(
    '[data-account-name]'
  ).forEach(element => {
    element.textContent = session.name;
  });

  document.querySelectorAll(
    '[data-account-email]'
  ).forEach(element => {
    element.textContent = session.email;
  });

  const initial = document.querySelector(
    '[data-account-initial]'
  );

  if (initial) {
    initial.textContent =
      session.name.trim().charAt(0).toUpperCase() || 'S';
  }

  // Cartas exclusivas de esta cuenta.
  let ids = [];

  try {
    ids = rewards?.readCollection?.() || [];
  } catch (error) {
    console.error('Error de colección:', error);
  }

  const uniqueIds = [
    ...new Set(ids.filter(id => typeof id === 'string'))
  ];

  const count = document.querySelector(
    '[data-card-count]'
  );

  if (count) {
    count.textContent = uniqueIds.length;
  }

  // No modificar IndexedDB ni medios existentes.
  let media = [];

  try {
    media = await window.StrikeZonePhotos?.all?.() || [];
  } catch (error) {
    console.error('Error al consultar medios:', error);
  }

  const mediaTotal = document.querySelector(
    '[data-media-total]'
  );

  if (mediaTotal) {
    mediaTotal.textContent = media.length;
  }

  // Mostrar colección del usuario.
  const wrapper = document.querySelector(
    '[data-profile-cards]'
  );

  const players = Array.isArray(window.STRIKEZONE_PLAYERS)
    ? window.STRIKEZONE_PLAYERS
    : [];

  const cards = uniqueIds
    .map(id => players.find(player => player.id === id))
    .filter(Boolean);

  if (wrapper) {
    if (cards.length) {
      wrapper.innerHTML = cards.map(player => {
        const image =
          player.image || 'assets/players/placeholder.svg';

        const ar = Boolean(
          player.arCard ||
          player.ar ||
          window.STRIKEZONE_AR_CARDS?.[player.id]
        );

        return `
          <a
            class="profile-mini-card"
            href="coleccion.html?focus=${encodeURIComponent(player.id)}"
          >
            <img
              src="${escape(image)}"
              alt="${escape(player.name)}"
            >

            <div>
              <strong>${escape(player.name)}</strong>
              <small>
                ${ar ? 'AR disponible' : 'Carta coleccionada'}
              </small>
            </div>
          </a>
        `;
      }).join('');
    } else {
      wrapper.innerHTML = `
        <div class="empty-state">
          Aún no tienes cartas.
          Completa un reto o colecciona una carta directa.
        </div>
      `;
    }
  }

  // Cerrar únicamente la sesión activa.
  logoutButton?.addEventListener('click', () => {
    try {
      localStorage.removeItem('strikezoneSession');

      if (
        localStorage.getItem('strikezoneSession') !== null
      ) {
        throw new Error('No se eliminó la sesión.');
      }

      location.href = 'index.html';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);

      showError(
        'No se pudo cerrar sesión. Comprueba el almacenamiento del navegador.'
      );
    }
  });
})();
