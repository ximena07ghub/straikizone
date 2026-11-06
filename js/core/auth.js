
(() => {
  const USERS = 'strikezoneUsers';
  const SESSION = 'strikezoneSession';

  const registerForm = document.querySelector(
    '[data-register-form]'
  );

  const loginForm = document.querySelector(
    '[data-login-form]'
  );

  const message = document.querySelector(
    '[data-auth-message]'
  );

  const emailOf = value =>
    String(value || '').trim().toLowerCase();

  // Identificador de cuentas existentes.
  const userId = user =>
    typeof user.id === 'string' && user.id.trim()
      ? user.id
      : `legacy-${encodeURIComponent(emailOf(user.email))}`;

  function showMessage(text) {
    if (message) {
      message.textContent = text;
    }
  }

  // Leer cuentas sin ocultar datos corruptos.
  function readUsers() {
    try {
      const raw = localStorage.getItem(USERS);
      const data = raw === null ? [] : JSON.parse(raw);

      return Array.isArray(data) ? data : null;
    } catch (error) {
      console.error('Error al leer usuarios:', error);
      return null;
    }
  }

  // Guardar y confirmar persistencia.
  function write(key, value) {
    try {
      const text = JSON.stringify(value);

      localStorage.setItem(key, text);

      return localStorage.getItem(key) === text;
    } catch (error) {
      console.error(`Error al guardar ${key}:`, error);
      return false;
    }
  }

  // Generar identificadores únicos.
  function newId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    if (window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);

      return [...bytes]
        .map(value => value.toString(16).padStart(2, '0'))
        .join('');
    }

    throw new Error('No hay generador seguro de identificadores.');
  }

  // Conservar el formato de contraseña actual.
  async function hash(value) {
    if (!window.crypto?.subtle) {
      return btoa(
        unescape(encodeURIComponent(value))
      );
    }

    const buffer = await window.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(value)
    );

    return [...new Uint8Array(buffer)]
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // Evitar redirecciones externas.
  function safeDestination() {
    const next = new URLSearchParams(
      location.search
    ).get('next');

    if (!next) return 'cuenta.html';

    try {
      const url = new URL(next, location.href);

      if (
        url.origin !== location.origin ||
        !['http:', 'https:'].includes(url.protocol)
      ) {
        return 'cuenta.html';
      }

      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return 'cuenta.html';
    }
  }

  // Detectar cuentas duplicadas o incompletas.
  function validUsers(users) {
    if (!Array.isArray(users)) return false;

    const emails = new Set();
    const ids = new Set();

    for (const user of users) {
      const email = emailOf(user?.email);
      const id = user ? userId(user) : '';

      if (
        !email ||
        !id ||
        typeof user.name !== 'string' ||
        !user.name.trim() ||
        typeof user.passwordHash !== 'string' ||
        !user.passwordHash ||
        emails.has(email) ||
        ids.has(id)
      ) {
        return false;
      }

      emails.add(email);
      ids.add(id);
    }

    return true;
  }

  // Activar sesión de un usuario registrado.
  function saveSession(user) {
    return write(SESSION, {
      id: userId(user),
      name: user.name,
      email: emailOf(user.email)
    });
  }

  // Evitar envíos repetidos.
  function setBusy(form, busy) {
    const button = form.querySelector(
      '[type="submit"]'
    );

    if (button) {
      button.disabled = busy;
    }
  }

  // Registrar cuenta.
  registerForm?.addEventListener('submit', async event => {
    event.preventDefault();

    const form = registerForm;
    const data = new FormData(form);

    const name = String(
      data.get('name') || ''
    ).trim();

    const email = emailOf(data.get('email'));

    const password = String(
      data.get('password') || ''
    );

    const confirm = String(
      data.get('confirm') || ''
    );

    showMessage('');

    if (
      name.length < 2 ||
      !email.includes('@') ||
      password.length < 6
    ) {
      showMessage(
        'Completa tus datos. La contraseña debe tener al menos 6 caracteres.'
      );
      return;
    }

    if (password !== confirm) {
      showMessage('Las contraseñas no coinciden.');
      return;
    }

    setBusy(form, true);

    try {
      const users = readUsers();

      if (!validUsers(users)) {
        showMessage(
          'No se pueden leer correctamente las cuentas guardadas.'
        );
        return;
      }

      if (
        users.some(user =>
          emailOf(user.email) === email
        )
      ) {
        showMessage(
          'Ya existe una cuenta con ese correo.'
        );
        return;
      }

      const existingIds = new Set(
        users.map(userId)
      );

      let id = newId();

      while (existingIds.has(id)) {
        id = newId();
      }

      const user = {
        id,
        name,
        email,
        passwordHash: await hash(password)
      };

      // Guardar primero la cuenta.
      if (!write(USERS, [...users, user])) {
        showMessage(
          'No se pudo guardar la cuenta. Comprueba el almacenamiento.'
        );
        return;
      }

      // Solo iniciar sesión si se confirma el guardado.
      if (!saveSession(user)) {
        showMessage(
          'La cuenta se creó, pero no se pudo iniciar sesión. Entra desde la página de acceso.'
        );
        return;
      }

      window.StrikeZoneFeedback?.show(
        'Cuenta creada. Bienvenido a StrikeZone.'
      );

      location.href = safeDestination();

    } catch (error) {
      console.error('Error de registro:', error);

      showMessage(
        'Ocurrió un error al registrar la cuenta.'
      );
    } finally {
      setBusy(form, false);
    }
  });

  // Iniciar sesión.
  loginForm?.addEventListener('submit', async event => {
    event.preventDefault();

    const form = loginForm;
    const data = new FormData(form);

    const email = emailOf(data.get('email'));
    const password = String(
      data.get('password') || ''
    );

    showMessage('');
    setBusy(form, true);

    try {
      const users = readUsers();

      if (!validUsers(users)) {
        showMessage(
          'No se pueden leer correctamente las cuentas guardadas.'
        );
        return;
      }

      const passwordHash = await hash(password);

      const user = users.find(
        entry =>
          emailOf(entry.email) === email &&
          entry.passwordHash === passwordHash
      );

      if (!user) {
        showMessage(
          'Correo o contraseña incorrectos.'
        );
        return;
      }

      if (!saveSession(user)) {
        showMessage(
          'No se pudo guardar la sesión. Comprueba el almacenamiento.'
        );
        return;
      }

      window.StrikeZoneFeedback?.show(
        'Sesión iniciada.'
      );

      location.href = safeDestination();

    } catch (error) {
      console.error('Error de acceso:', error);

      showMessage(
        'No se pudo iniciar sesión. Inténtalo nuevamente.'
      );
    } finally {
      setBusy(form, false);
    }
  });
})();
