
(() => {
  const $ = selector => document.querySelector(selector);

  // Pantallas principales.
  const intro = $('[data-game-intro]');
  const panel = $('[data-game-panel]');
  const result = $('[data-game-result]');

  if (!intro || !panel || !result) return;

  // Controles.
  const startBtn = $('[data-start]');
  const hitBtn = $('[data-hit]');
  const exitBtn = $('[data-exit]');
  const restartBtn = $('[data-restart]');

  // Indicadores.
  const scoreEl = $('[data-score]');
  const strikesEl = $('[data-strikes]');
  const timeEl = $('[data-time]');
  const levelEl = $('[data-level]');
  const hitsEl = $('[data-hits]');
  const comboEl = $('[data-combo]');
  const feedback = $('[data-feedback]');
  const ball = $('[data-ball]');
  const perfect = $('[data-perfect-zone]');
  const good = $('[data-good-zone]');
  const goalFill = $('[data-goal-fill]');
  const playerEl = $('[data-player]');

  // Resultados.
  const finalScore = $('[data-final-score]');
  const finalSummary = $('[data-final-summary]');
  const resultTitle = $('[data-result-title]');
  const unlockBox = $('[data-unlock]');
  const unlockTitle = $('[data-unlock-title]');
  const unlockCopy = $('[data-unlock-copy]');

  // Recompensa.
  const rewardBox = $('[data-game-reward]');
  const rewardImage = $('[data-reward-image]');
  const rewardBadge = $('[data-reward-badge]');
  const rewardName = $('[data-reward-name]');
  const rewardTeam = $('[data-reward-team]');
  const rewardStatus = $('[data-reward-status]');

  // Enlaces.
  const rewardAR = $('[data-reward-ar]');
  const rewardCard = $('[data-reward-card]');
  const rewardCollection = $('[data-reward-collection]');

  const params = new URLSearchParams(location.search);
  const playerId = params.get('player');
  const rewards = window.StrikeZoneRewards;

  // Mostrar errores antes de iniciar.
  function showError(title, message) {
    intro.hidden = true;
    panel.hidden = true;
    result.hidden = false;

    if (resultTitle) {
      resultTitle.textContent = title;
    }

    if (finalSummary) {
      finalSummary.textContent = message;
    }

    if (finalScore) {
      finalScore.textContent = '0 pts';
    }

    if (unlockBox) unlockBox.hidden = true;
    if (rewardBox) rewardBox.hidden = true;
    if (restartBtn) restartBtn.hidden = true;
  }

  // Verificar sistema de recompensas.
  if (
    !rewards ||
    typeof rewards.getGameReward !== 'function' ||
    typeof rewards.unlock !== 'function'
  ) {
    showError(
      'Sistema no disponible',
      'No se pudo cargar el sistema de recompensas.'
    );
    return;
  }

  // Verificar sesión.
  if (!rewards.session()) {
    rewards.requireSession(
      `juego.html${location.search}`
    );
    return;
  }

  // Verificar la carta seleccionada.
  const player = rewards.getGameReward(playerId);

  if (!player) {
    showError(
      'Carta no disponible',
      'El jugador seleccionado no existe o no está autorizado para el minijuego de bateo.'
    );
    return;
  }

  if (playerEl) {
    playerEl.textContent = player.name;
  }

  // Reglas originales.
  const TARGET = 3000;
  const LIMIT = 45;
  const STRIKES_MAX = 3;

  // Estado de la partida.
  let running = false;
  let score = 0;
  let strikes = 0;
  let hits = 0;
  let combo = 0;
  let level = 1;

  let pos = .12;
  let dir = 1;
  let speed = .47;
  let zone = .22;

  let timeLeft = LIMIT;
  let last = 0;
  let raf = 0;
  let lastHitAt = 0;
  let timerId = 0;

  const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, value));

  // Actualizar indicadores.
  function updateUI() {
    scoreEl.textContent =
      score.toLocaleString('es-MX');

    strikesEl.textContent =
      `${strikes} / ${STRIKES_MAX}`;

    timeEl.textContent =
      `${Math.max(0, Math.ceil(timeLeft))} s`;

    hitsEl.textContent = hits;
    comboEl.textContent = `x${combo}`;
    levelEl.textContent = level;

    goalFill.style.width =
      `${clamp(score / TARGET * 100, 0, 100)}%`;

    perfect.style.width = `${zone * 100}%`;
    perfect.style.left =
      `${(0.5 - zone / 2) * 100}%`;

    const gw = Math.min(.52, zone + .20);

    good.style.width = `${gw * 100}%`;
    good.style.left =
      `${(0.5 - gw / 2) * 100}%`;
  }

  // Restablecer partida.
  function reset() {
    score = 0;
    strikes = 0;
    hits = 0;
    combo = 0;
    level = 1;

    pos = .12;
    dir = 1;
    speed = .47;
    zone = .22;

    timeLeft = LIMIT;
    last = 0;
    lastHitAt = 0;

    feedback.textContent =
      '¡Batea cuando la pelota llegue al centro!';

    ball.style.left = `${pos * 100}%`;

    if (unlockBox) unlockBox.hidden = true;
    if (rewardBox) rewardBox.hidden = true;

    if (rewardAR) {
      rewardAR.hidden = true;
      rewardAR.removeAttribute('href');
    }

    if (rewardCard) {
      rewardCard.removeAttribute('href');
    }

    updateUI();
  }

  // Animar pelota.
  function tick(t) {
    if (!running) return;

    if (!last) last = t;

    const dt = Math.min(
      .05,
      (t - last) / 1000
    );

    last = t;
    pos += dir * speed * dt;

    if (pos >= .985) {
      pos = .985;
      dir = -1;
    } else if (pos <= .015) {
      pos = .015;
      dir = 1;
    }

    ball.style.left = `${pos * 100}%`;

    raf = requestAnimationFrame(tick);
  }

  // Controlar tiempo.
  function startTimer() {
    clearInterval(timerId);

    timerId = setInterval(() => {
      if (!running) return;

      timeLeft -= .1;

      if (timeLeft <= 0) {
        timeLeft = 0;
        updateUI();

        finish(false, 'Se acabó el tiempo.');
        return;
      }

      updateUI();
    }, 100);
  }

  // Iniciar juego.
  function begin() {
    reset();

    intro.hidden = true;
    result.hidden = true;
    panel.hidden = false;

    running = true;
    last = 0;

    startTimer();
    raf = requestAnimationFrame(tick);

    hitBtn.focus();
  }

  // Ejecutar bateo.
  function hit() {
    if (!running) return;

    const now = performance.now();

    if (now - lastHitAt < 260) return;

    lastHitAt = now;

    const d = Math.abs(pos - .5);
    const perfectHalf = zone / 2;
    const goodHalf = perfectHalf + .10;

    if (d <= perfectHalf) {
      combo++;
      hits++;

      const bonus = Math.min(
        250,
        (combo - 1) * 50
      );

      score += 500 + bonus;

      feedback.textContent =
        `PERFECT HIT +${500 + bonus}`;

    } else if (d <= goodHalf) {
      combo++;
      hits++;
      score += 250;

      feedback.textContent = 'GOOD +250';

    } else {
      strikes++;
      combo = 0;
      feedback.textContent = 'STRIKE';
    }

    // Dificultad progresiva.
    if (hits > 0) {
      level = Math.min(
        6,
        1 + Math.floor(hits / 2)
      );

      speed = .47 + (level - 1) * .105;
      zone = Math.max(
        .095,
        .22 - (level - 1) * .025
      );
    }

    updateUI();

    if (score >= TARGET) {
      finish(true, 'Meta alcanzada.');
    } else if (strikes >= STRIKES_MAX) {
      finish(
        false,
        'Tres strikes. Fin de la entrada.'
      );
    }
  }

  // Validar ruta de imagen.
  function validImage(value) {
    if (
      typeof value !== 'string' ||
      !value.trim()
    ) {
      return null;
    }

    const path = value.trim();

    try {
      const url = new URL(path, location.href);

      if (
        url.protocol !== 'https:' &&
        url.protocol !== 'http:'
      ) {
        return null;
      }

      return path;
    } catch {
      return null;
    }
  }

  // Mostrar imagen frontal o foto del jugador.
  function setRewardImage(reward) {
    if (!rewardImage) return;

    const arCard =
      window.STRIKEZONE_AR_CARDS?.[reward.id];

    // Prioridad: frente AR, frente del jugador y foto.
    const candidates = [
      arCard?.frontImage,
      reward.cardFront,
      reward.frontImage,
      reward.card?.frontImage,
      reward.card?.front,
      reward.image,
      'assets/players/placeholder.svg'
    ];

    const images = [
      ...new Set(
        candidates.map(validImage).filter(Boolean)
      )
    ];

    let index = 0;

    // Cambiar imagen si la anterior falla.
    rewardImage.onerror = () => {
      index++;

      if (index < images.length) {
        rewardImage.src = images[index];
      } else {
        rewardImage.onerror = null;
      }
    };

    rewardImage.src =
      images[0] || 'assets/players/placeholder.svg';

    rewardImage.alt = `Carta de ${reward.name}`;
  }

  // Presentar recompensa correcta.
  function showReward(reward, isNew) {
    if (!rewardBox) return;

    const arCard =
      window.STRIKEZONE_AR_CARDS?.[reward.id];

    const arId = arCard
      ? reward.id
      : (reward.arCard || reward.ar);

    setRewardImage(reward);

    if (rewardName) {
      rewardName.textContent = reward.name;
    }

    if (rewardTeam) {
      rewardTeam.textContent = reward.team || '';
    }

    if (rewardBadge) {
      rewardBadge.textContent = isNew
        ? 'NUEVA CARTA'
        : 'EN TU COLECCIÓN';
    }

    if (rewardStatus) {
      rewardStatus.textContent = isNew
        ? 'Se agregó a tu colección.'
        : 'Esta carta ya pertenece a tu colección. No se creó ningún duplicado.';
    }

    // Acceso AR de la carta seleccionada.
    if (rewardAR) {
      rewardAR.hidden = !arId;
      rewardAR.removeAttribute('href');

      if (arId) {
        rewardAR.href =
          `ar-carta.html?card=${encodeURIComponent(arId)}`;
      }
    }

    // Acceso a la tarjeta.
    if (rewardCard) {
      rewardCard.href =
        `tarjeta-provisional.html?card=${encodeURIComponent(
          reward.id
        )}`;
    }

    // Acceso a la colección.
    if (rewardCollection) {
      rewardCollection.href = 'cuenta.html#coleccion';
    }

    rewardBox.hidden = false;
  }

  // Guardar solamente la carta seleccionada.
  function saveCard() {
    const reward = rewards.getGameReward(playerId);

    if (!reward || reward.id !== playerId) {
      return null;
    }

    let isNew;

    try {
      isNew = !rewards.isUnlocked(playerId);

      const saved = rewards.unlock(
        reward,
        'minijuego-premio'
      );

      if (!saved || !rewards.isUnlocked(playerId)) {
        return null;
      }

    } catch (error) {
      console.error(
        'Error al guardar la recompensa:',
        error
      );

      return null;
    }

    return { reward, isNew };
  }

  // Finalizar partida.
  function finish(won, reason) {
    if (!running) return;

    running = false;

    cancelAnimationFrame(raf);
    clearInterval(timerId);

    panel.hidden = true;
    result.hidden = false;

    finalScore.textContent =
      `${score.toLocaleString('es-MX')} pts`;

    if (won) {
      const saved = saveCard();

      finalSummary.textContent =
        `Alcanzaste la meta con ${hits} hits y ` +
        `${Math.ceil(LIMIT - timeLeft)} segundos de juego.`;

      // No mostrar premios si falla el guardado.
      if (!saved) {
        resultTitle.textContent =
          '¡Reto superado, pero no se guardó la carta!';

        finalSummary.textContent +=
          ' No se pudo guardar la recompensa. ' +
          'Comprueba el almacenamiento del navegador.';

        if (unlockBox) unlockBox.hidden = true;
        if (rewardBox) rewardBox.hidden = true;

        window.StrikeZoneFeedback?.show(
          'Error al guardar la carta.'
        );

        return;
      }

      // Mostrar únicamente la recompensa guardada.
      resultTitle.textContent = '¡Reto superado!';

      if (unlockBox) {
        unlockBox.hidden = false;
      }

      if (unlockTitle) {
        unlockTitle.textContent = saved.isNew
          ? '¡Carta ganada!'
          : '¡Carta ya desbloqueada!';
      }

      if (unlockCopy) {
        unlockCopy.textContent = saved.isNew
          ? `${saved.reward.name} se agregó a tu colección.`
          : `${saved.reward.name} ya pertenece a tu colección.`;
      }

      showReward(saved.reward, saved.isNew);

      window.strikezoneConfetti?.();

      window.StrikeZoneFeedback?.show(
        saved.isNew
          ? `¡Desbloqueaste a ${saved.reward.name}!`
          : `${saved.reward.name} ya está en tu colección.`
      );

    } else {
      resultTitle.textContent = 'Fin de la entrada';

      const missing = Math.max(
        0,
        TARGET - score
      );

      finalSummary.textContent =
        `${reason} Lograste ${hits} hits. ` +
        `Te faltaron ${missing.toLocaleString('es-MX')} ` +
        'puntos para conseguir una carta.';

      if (unlockBox) unlockBox.hidden = true;
      if (rewardBox) rewardBox.hidden = true;
    }
  }

  // Botones existentes.
  startBtn?.addEventListener('click', begin);
  restartBtn?.addEventListener('click', begin);
  hitBtn?.addEventListener('click', hit);

  exitBtn?.addEventListener('click', () => {
    finish(
      false,
      'Entrada terminada por el jugador.'
    );
  });

  // Batear con barra espaciadora.
  document.addEventListener('keydown', e => {
    if (
      running &&
      e.code === 'Space' &&
      ![
        'INPUT',
        'TEXTAREA',
        'BUTTON'
      ].includes(document.activeElement?.tagName)
    ) {
      e.preventDefault();
      hit();
    }
  });
})();
