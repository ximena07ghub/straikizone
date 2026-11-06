
window.StrikeZoneRewards = (() => {
  const USERS = 'strikezoneUsers';
  const SESSION = 'strikezoneSession';

  const COLLECTION = 'strikezoneCollection';
  const REWARDS = 'strikezoneRewards';

  const emailOf = value =>
    String(value || '').trim().toLowerCase();

  // Identificador estable para cuentas antiguas.
  const userId = user =>
    typeof user.id === 'string' && user.id.trim()
      ? user.id
      : `legacy-${encodeURIComponent(emailOf(user.email))}`;

  // Leer arreglos sin modificar almacenamiento.
  function readArray(key) {
    try {
      const raw = localStorage.getItem(key);

      if (raw === null) return [];

      const data = JSON.parse(raw);

      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  // Lectura estricta para operaciones de escritura.
  function readForWrite(key) {
    try {
      const raw = localStorage.getItem(key);

      if (raw === null) return [];

      const data = JSON.parse(raw);

      return Array.isArray(data) ? data : null;
    } catch (error) {
      console.error(`Error al leer ${key}:`, error);
      return null;
    }
  }

  // Guardar y confirmar persistencia.
  function write(key, data) {
    try {
      const serialized = JSON.stringify(data);

      localStorage.setItem(key, serialized);

      return localStorage.getItem(key) === serialized;
    } catch (error) {
      console.error(`Error al guardar ${key}:`, error);
      return false;
    }
  }

  // Validar cuentas locales.
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

  // Validar sesión contra una cuenta real.
  function session() {
    try {
      const raw = localStorage.getItem(SESSION);

      if (!raw) return null;

      const saved = JSON.parse(raw);
      const users = readForWrite(USERS);

      if (
        !saved ||
        typeof saved !== 'object' ||
        Array.isArray(saved) ||
        !validUsers(users)
      ) {
        return null;
      }

      const email = emailOf(saved.email);

      const matches = users.filter(
        user => emailOf(user.email) === email
      );

      if (matches.length !== 1) return null;

      const user = matches[0];
      const id = userId(user);

      // Validar el identificador de sesión.
      if (saved.id !== undefined) {
        if (saved.id !== id) return null;
      } else {
        // Compatibilidad con sesiones antiguas.
        if (saved.name !== user.name) return null;
      }

      return {
        id,
        name: user.name,
        email
      };
    } catch (error) {
      console.error('Error al validar la sesión:', error);
      return null;
    }
  }

  // Construir claves individuales.
  function storageKeys() {
    const user = session();

    if (!user) return null;

    return {
      collection: `${COLLECTION}:${user.id}`,
      rewards: `${REWARDS}:${user.id}`
    };
  }

  // Leer únicamente las cartas del usuario.
  function readCollection() {
    const keys = storageKeys();

    if (!keys) return [];

    return [
      ...new Set(
        readArray(keys.collection).filter(
          id => typeof id === 'string' && id.length > 0
        )
      )
    ];
  }

  // Leer únicamente las recompensas del usuario.
  function readRewards() {
    const keys = storageKeys();

    if (!keys) return [];

    const seen = new Set();

    return readArray(keys.rewards).filter(record => {
      if (
        !record ||
        typeof record.playerId !== 'string' ||
        !record.playerId ||
        seen.has(record.playerId)
      ) {
        return false;
      }

      seen.add(record.playerId);
      return true;
    });
  }

  // Verificar carta desbloqueada.
  function isUnlocked(playerId) {
    if (
      typeof playerId !== 'string' ||
      !playerId
    ) {
      return false;
    }

    return readCollection().includes(playerId);
  }

  // Catálogo oficial de jugadores.
  const players = () =>
    Array.isArray(window.STRIKEZONE_PLAYERS)
      ? window.STRIKEZONE_PLAYERS
      : [];

  // Validar enlace exacto de un reto.
  function matchesChallenge(player, page) {
    if (
      typeof player?.id !== 'string' ||
      !player.id ||
      typeof player.primaryHref !== 'string' ||
      !player.primaryHref.trim()
    ) {
      return false;
    }

    try {
      const url = new URL(
        player.primaryHref.trim(),
        location.href
      );

      if (url.origin !== location.origin) {
        return false;
      }

      if (url.pathname.split('/').pop() !== page) {
        return false;
      }

      const ids = url.searchParams.getAll('player');

      return (
        ids.length === 1 &&
        ids[0] === player.id
      );
    } catch {
      return false;
    }
  }

  // Reconocer cartas del reto de bateo.
  function isBattingGame(player) {
    return matchesChallenge(player, 'juego.html');
  }

  // Reconocer cartas de trivia.
  function isTrivia(player) {
    return matchesChallenge(player, 'trivia.html');
  }

  // Mantener la selección determinista.
  function gameRewardPool() {
    return players().filter(
      player =>
        player?.gameReward !== false &&
        isBattingGame(player)
    );
  }

  function getGameReward(playerId) {
    if (
      typeof playerId !== 'string' ||
      !playerId
    ) {
      return null;
    }

    return gameRewardPool().find(
      player => player.id === playerId
    ) || null;
  }

  // Detectar disponibilidad de AR.
  function hasAR(player) {
    return Boolean(
      player.arCard ||
      player.ar ||
      window.STRIKEZONE_AR_CARDS?.[player.id]
    );
  }

  // Validar el origen del desbloqueo.
  function authorizedSource(player, source) {
    if (source === 'minijuego-premio') {
      return Boolean(getGameReward(player.id));
    }

    if (source === 'trivia') {
      return isTrivia(player);
    }

    if (source === 'coleccion-directa') {
      return player.primaryAction === 'collect';
    }

    // Compatibilidad con la operación general previa.
    if (source === 'collection') {
      return true;
    }

    return false;
  }

  // Desbloquear únicamente en la cuenta activa.
  function unlock(player, source = 'collection') {
    const user = session();

    if (!user) return false;

    if (
      typeof player?.id !== 'string' ||
      !player.id ||
      typeof source !== 'string'
    ) {
      return false;
    }

    // Utilizar siempre el registro oficial.
    const canonical = players().find(
      item => item?.id === player.id
    );

    if (!canonical) return false;

    if (!authorizedSource(canonical, source)) {
      return false;
    }

    const keys = storageKeys();

    if (!keys) return false;

    const oldCollection = readForWrite(keys.collection);
    const oldRewards = readForWrite(keys.rewards);

    // No sobrescribir datos dañados.
    if (!oldCollection || !oldRewards) {
      return false;
    }

    // No crear otra copia de una carta existente.
    if (oldCollection.includes(canonical.id)) {
      return true;
    }

    const rewardExists = oldRewards.some(
      record => record?.playerId === canonical.id
    );

    // Conservar el historial anterior.
    const newRewards = rewardExists
      ? oldRewards
      : [
          ...oldRewards,
          {
            playerId: canonical.id,
            source,
            createdAt: Date.now(),
            hasAR: hasAR(canonical)
          }
        ];

    const newCollection = [
      ...oldCollection,
      canonical.id
    ];

    // Guardar la recompensa antes de la colección.
    if (
      !rewardExists &&
      !write(keys.rewards, newRewards)
    ) {
      return false;
    }

    // Guardar la carta.
    if (!write(keys.collection, newCollection)) {
      // Intentar revertir el metadato nuevo.
      if (!rewardExists) {
        write(keys.rewards, oldRewards);
      }

      return false;
    }

    // Confirmar que realmente se guardó.
    const saved = readForWrite(keys.collection);

    return Array.isArray(saved) &&
      saved.includes(canonical.id);
  }

  // Solicitar una sesión válida.
  function requireSession(returnUrl) {
    if (session()) {
      return true;
    }

    const destination =
      returnUrl ||
      `${location.pathname.split('/').pop()}${location.search}`;

    location.href =
      `login.html?next=${encodeURIComponent(destination)}`;

    return false;
  }

  // Detectar progreso antiguo sin asignarlo.
  function hasLegacyProgress() {
    try {
      return (
        localStorage.getItem(COLLECTION) !== null ||
        localStorage.getItem(REWARDS) !== null
      );
    } catch {
      return false;
    }
  }

  return {
    readCollection,
    readRewards,
    isUnlocked,
    unlock,
    session,
    requireSession,
    getGameReward,
    gameRewardPool,
    isBattingGame,
    hasLegacyProgress
  };
})();
