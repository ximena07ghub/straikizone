
window.StrikeZoneRewards = (() => {
  const COLLECTION = 'strikezoneCollection';
  const REWARDS = 'strikezoneRewards';

  // Leer datos sin alterar registros existentes.
  const read = key => {
    try {
      const raw = localStorage.getItem(key);
      const data = raw === null ? [] : JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  // Lectura estricta para evitar pérdidas de datos.
  const readForWrite = key => {
    try {
      const raw = localStorage.getItem(key);

      if (raw === null) return [];

      const data = JSON.parse(raw);

      return Array.isArray(data) ? data : null;
    } catch (error) {
      console.error(`Error al leer ${key}:`, error);
      return null;
    }
  };

  // Guardar y comprobar persistencia.
  const write = (key, value) => {
    try {
      const serialized = JSON.stringify(value);

      localStorage.setItem(key, serialized);

      return localStorage.getItem(key) === serialized;
    } catch (error) {
      console.error(`Error al guardar ${key}:`, error);
      return false;
    }
  };

  // Sesión actual.
  const session = () => {
    try {
      return JSON.parse(
        localStorage.getItem('strikezoneSession') || 'null'
      );
    } catch {
      return null;
    }
  };

  // Catálogo oficial.
  const players = () =>
    Array.isArray(window.STRIKEZONE_PLAYERS)
      ? window.STRIKEZONE_PLAYERS
      : [];

  // Validar enlace al minijuego de bateo.
  const isBattingGame = player => {
    if (
      !player ||
      typeof player.id !== 'string' ||
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

      // Impedir enlaces externos.
      if (url.origin !== location.origin) {
        return false;
      }

      // Aceptar únicamente juego.html.
      const page = url.pathname.split('/').pop();

      if (page !== 'juego.html') {
        return false;
      }

      // Exigir un solo identificador.
      const ids = url.searchParams.getAll('player');

      if (ids.length !== 1) {
        return false;
      }

      // Debe coincidir exactamente con la carta.
      return ids[0] === player.id;
    } catch {
      return false;
    }
  };

  // Consultar disponibilidad AR.
  const hasAR = player => Boolean(
    player?.arCard ||
    player?.ar ||
    window.STRIKEZONE_AR_CARDS?.[player?.id]
  );

  // Cartas autorizadas para bateo.
  const gameRewardPool = () =>
    players().filter(player =>
      player?.gameReward !== false &&
      isBattingGame(player)
    );

  // Obtener exclusivamente la carta seleccionada.
  const getGameReward = playerId => {
    if (
      typeof playerId !== 'string' ||
      !playerId
    ) {
      return null;
    }

    return gameRewardPool().find(
      player => player.id === playerId
    ) || null;
  };

  // Comprobar si una carta está desbloqueada.
  const isUnlocked = playerId =>
    read(COLLECTION).includes(playerId);

  // Guardar la carta sin duplicados.
  const unlock = (
    player,
    source = 'collection'
  ) => {
    if (
      typeof player?.id !== 'string' ||
      !player.id
    ) {
      return false;
    }

    // Verificar que exista en el catálogo.
    const canonical = players().find(
      entry => entry?.id === player.id
    );

    if (!canonical) {
      return false;
    }

    // Proteger las recompensas del minijuego.
    if (
      source === 'minijuego-premio' &&
      !getGameReward(player.id)
    ) {
      return false;
    }

    const ids = readForWrite(COLLECTION);
    const previousRewards = readForWrite(REWARDS);

    // No sobrescribir datos ilegibles.
    if (!ids || !previousRewards) {
      return false;
    }

    // Evitar duplicados.
    if (ids.includes(player.id)) {
      return true;
    }

    // Conservar los registros anteriores.
    const rewardExists = previousRewards.some(
      entry => entry?.playerId === player.id
    );

    const updatedRewards = rewardExists
      ? previousRewards
      : [
          ...previousRewards,
          {
            playerId: player.id,
            source,
            createdAt: Date.now(),
            hasAR: hasAR(canonical)
          }
        ];

    const updatedCollection = [
      ...ids,
      player.id
    ];

    // Guardar metadatos si aún no existen.
    if (!rewardExists) {
      if (!write(REWARDS, updatedRewards)) {
        return false;
      }
    }

    // Guardar la carta seleccionada.
    if (!write(COLLECTION, updatedCollection)) {
      // Revertir metadatos nuevos cuando sea posible.
      if (!rewardExists) {
        write(REWARDS, previousRewards);
      }

      return false;
    }

    // Confirmar que la carta permanece guardada.
    return isUnlocked(player.id);
  };

  // Exigir inicio de sesión.
  const requireSession = returnUrl => {
    if (session()) {
      return true;
    }

    const destination =
      returnUrl ||
      location.href.split('/').pop();

    location.href =
      `login.html?next=${encodeURIComponent(destination)}`;

    return false;
  };

  return {
    readCollection: () => read(COLLECTION),
    readRewards: () => read(REWARDS),
    isUnlocked,
    unlock,
    getGameReward,
    gameRewardPool,
    isBattingGame,
    session,
    requireSession
  };
})();
