
(() => {
  const players = Array.isArray(window.STRIKEZONE_PLAYERS)
    ? window.STRIKEZONE_PLAYERS
    : [];

  const rewards = window.StrikeZoneRewards;
  const $ = selector => document.querySelector(selector);

  const wrapper = $('[data-collection-wrapper]');
  if (!wrapper) return;

  const filters = [
    ...document.querySelectorAll('[data-collection-filter]')
  ];

  const metaName = $('[data-active-name]');
  const metaTeam = $('[data-active-team]');
  const count = $('[data-collection-count]');
  const feedback = $('[data-collection-feedback]');
  const prevBtn = $('[data-prev]');
  const nextBtn = $('[data-next]');
  const swiperElement = $('.collection-swiper');

  const initialFocus = new URLSearchParams(
    location.search
  ).get('focus');

  const categories = {
    all: 'Todas',
    leyenda: 'Leyendas',
    capitan: 'Capitanes',
    internacional: 'Internacionales'
  };

  let current = 'all';
  let visible = [];
  let activeIndex = 0;
  let swiper = null;

  // Proteger contenido HTML.
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

  // Consultar cartas guardadas.
  function unlocked(id) {
    try {
      return Boolean(rewards?.isUnlocked(id));
    } catch {
      return false;
    }
  }

  // Mostrar mensajes de colección.
  function showMessage(message, isError = false) {
    if (feedback) {
      feedback.textContent = message;
      feedback.hidden = false;
      feedback.classList.toggle('is-error', isError);
    }

    if (!isError) {
      window.StrikeZoneFeedback?.show(message);
    }
  }

  function clearMessage() {
    if (!feedback) return;

    feedback.hidden = true;
    feedback.textContent = '';
    feedback.classList.remove('is-error');
  }

  // Construir estadísticas.
  function renderStats(player) {
    const stats = Array.isArray(player.stats)
      ? player.stats
      : [];

    return stats.map(stat => `
      <div class="collect-stat">
        <span>${escape(stat?.[0])}</span>
        <b>${escape(stat?.[1])}</b>
      </div>
    `).join('');
  }

  // Mantener el acceso AR original.
  function renderAR(player, isOpen) {
    const arConfig =
      window.STRIKEZONE_AR_CARDS?.[player.id];

    const hasAR = Boolean(
      player.arCard ||
      player.ar ||
      arConfig
    );

    if (!hasAR) return '';

    const arId = arConfig
      ? player.id
      : player.arCard;

    const href = arId
      ? `ar-carta.html?card=${encodeURIComponent(arId)}`
      : player.ar === 'pelota'
        ? 'ar-pelota.html'
        : 'ar-premio.html';

    return `
      <a
        class="button button-ghost"
        data-ar-link
        data-ar-card-id="${escape(arId || '')}"
        href="${escape(href)}"
        ${isOpen ? '' : 'hidden'}
      >
        Ver AR
      </a>
    `;
  }

  // Mantener el reto de cada jugador.
  function renderAction(player, isOpen) {
    if (isOpen) {
      return `
        <a
          class="button button-light wide"
          href="cuenta.html#coleccion"
        >
          En mi colección
        </a>
      `;
    }

    if (player.primaryAction === 'collect') {
      return `
        <button
          type="button"
          class="button button-light wide"
          data-collect="${escape(player.id)}"
        >
          ${escape(player.primaryLabel || 'Coleccionar')}
        </button>
      `;
    }

    return `
      <a
        class="button button-light wide"
        data-challenge
        href="${escape(player.primaryHref || '#')}"
      >
        ${escape(player.primaryLabel || 'Abrir reto')}
      </a>
    `;
  }

  // Crear carta sin botones de volteo.
  function card(player) {
    const isOpen = unlocked(player.id);
    const state = isOpen
      ? 'is-unlocked'
      : 'is-locked';

    const image =
      player.image || 'assets/players/placeholder.svg';

    const category =
      categories[player.category] ||
      player.category;

    return `
      <div
        class="swiper-slide"
        data-player-id="${escape(player.id)}"
      >
        <article
          class="collect-card ${state}"
          data-card
          tabindex="0"
          role="button"
          aria-label="Voltear carta de ${escape(player.name)}"
        >
          <div class="collect-card-inner">

            <!-- Frente -->
            <div
              class="collect-face collect-front"
              data-face-front
            >
              <span class="collect-badge">
                ${escape(category)}
              </span>

              <span
                class="collect-lock"
                title="${isOpen ? 'Desbloqueada' : 'Bloqueada'}"
                aria-label="${isOpen ? 'Desbloqueada' : 'Bloqueada'}"
              >
                ${isOpen ? '✓' : '🔒'}
              </span>

              <img
                src="${escape(image)}"
                alt="${escape(player.name)}"
                loading="lazy"
                draggable="false"
              >
            </div>

            <!-- Reverso -->
            <div
              class="collect-face collect-back"
              data-face-back
              aria-hidden="true"
              inert
            >
              <div class="collect-back-heading">
                <small>
                  ${escape(player.statsLabel)}
                </small>

                <h3>${escape(player.name)}</h3>

                <p class="collect-team">
                  ${escape(player.team)}
                </p>
              </div>

              <div class="collect-back-content">
                <div class="collect-stats">
                  ${renderStats(player)}
                </div>

                <p class="collect-bio">
                  ${escape(player.bio)}
                </p>
              </div>

              <!-- Acciones originales -->
              <div class="collect-actions">
                ${renderAR(player, isOpen)}
                ${renderAction(player, isOpen)}
              </div>
            </div>

          </div>
        </article>
      </div>
    `;
  }

  // Obtener jugadores del filtro.
  function filtered() {
    return current === 'all'
      ? players
      : players.filter(
          player => player.category === current
        );
  }

  // Activar solamente la cara visible.
  function syncFaces(element) {
    const flipped =
      element.classList.contains('is-flipped');

    const front = element.querySelector(
      '[data-face-front]'
    );

    const back = element.querySelector(
      '[data-face-back]'
    );

    if (front) {
      front.inert = flipped;
      front.setAttribute(
        'aria-hidden',
        String(flipped)
      );
    }

    if (back) {
      back.inert = !flipped;
      back.setAttribute(
        'aria-hidden',
        String(!flipped)
      );
    }

    element.setAttribute(
      'aria-label',
      `${flipped ? 'Volver al frente de' : 'Voltear carta de'} ${
        visible.find(
          player =>
            player.id === element.closest(
              '[data-player-id]'
            )?.dataset.playerId
        )?.name || 'jugador'
      }`
    );
  }

  // Voltear con un clic.
  function flipCard(element) {
    if (!element) return;

    element.classList.toggle('is-flipped');
    syncFaces(element);
  }

  // Restaurar cartas al cambiar de jugador.
  function resetFlips() {
    wrapper.querySelectorAll('[data-card]').forEach(
      element => {
        if (element.classList.contains('is-flipped')) {
          element.classList.remove('is-flipped');
          syncFaces(element);
        }
      }
    );
  }

  // Cambiar jugador seleccionado.
  function updateMeta(index = 0) {
    if (!visible.length) {
      if (metaName) metaName.textContent = 'Sin cartas';
      if (metaTeam) metaTeam.textContent = '';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    const newIndex = Math.max(
      0,
      Math.min(index, visible.length - 1)
    );

    if (newIndex !== activeIndex) {
      resetFlips();
    }

    activeIndex = newIndex;

    const player = visible[activeIndex];

    if (metaName) {
      metaName.textContent = player.name;
    }

    if (metaTeam) {
      metaTeam.textContent = unlocked(player.id)
        ? `${player.team} · En tu colección`
        : player.team;
    }

    if (prevBtn) {
      prevBtn.disabled = activeIndex === 0;
    }

    if (nextBtn) {
      nextBtn.disabled =
        activeIndex === visible.length - 1;
    }

    // Solo la carta activa recibe foco por teclado.
    wrapper.querySelectorAll('.swiper-slide').forEach(
      (slide, index) => {
        const element = slide.querySelector('[data-card]');
        if (!element) return;

        element.tabIndex = index === activeIndex ? 0 : -1;
      }
    );
  }

  // Guardar una carta directa.
  function collectCard(button) {
    const player = players.find(
      item => item.id === button.dataset.collect
    );

    if (
      !player ||
      player.primaryAction !== 'collect'
    ) {
      showMessage(
        'Esta carta no permite colección directa.',
        true
      );
      return;
    }

    if (
      !rewards ||
      typeof rewards.unlock !== 'function' ||
      typeof rewards.isUnlocked !== 'function' ||
      typeof rewards.requireSession !== 'function'
    ) {
      showMessage(
        'El sistema de colección no está disponible.',
        true
      );
      return;
    }

    try {
      if (!rewards.requireSession(
        `coleccion.html?focus=${encodeURIComponent(player.id)}`
      )) {
        return;
      }
    } catch (error) {
      console.error('Error de sesión:', error);
      showMessage('No se pudo verificar la sesión.', true);
      return;
    }

    if (button.disabled) return;

    button.disabled = true;

    try {
      if (rewards.isUnlocked(player.id)) {
        render(player.id);
        showMessage(`${player.name} ya está en tu colección.`);
        return;
      }

      const saved = rewards.unlock(
        player,
        'coleccion-directa'
      );

      if (!saved || !rewards.isUnlocked(player.id)) {
        throw new Error('No se confirmó el guardado.');
      }

      render(player.id);

      showMessage(
        `${player.name} se agregó a Mi colección.`
      );

    } catch (error) {
      console.error('Error al guardar:', error);

      button.disabled = false;

      showMessage(
        `No se pudo guardar ${player.name}. Inténtalo de nuevo.`,
        true
      );
    }
  }

  // Eventos de las cartas.
  function bindCards() {
    wrapper.querySelectorAll('[data-card]').forEach(
      syncFaces
    );

    // Clic: seleccionar o voltear.
    wrapper.onclick = event => {
      const target = event.target;

      const interactive = target.closest('a, button');

      if (interactive) {
        const collectButton = interactive.closest(
          '[data-collect]'
        );

        if (collectButton) {
          event.preventDefault();
          collectCard(collectButton);
          return;
        }

        const challenge = interactive.closest(
          '[data-challenge]'
        );

        if (challenge) {
          if (!rewards) {
            event.preventDefault();
            showMessage(
              'Sistema de sesión no disponible.',
              true
            );
            return;
          }

          try {
            if (!rewards.session()) {
              event.preventDefault();
              rewards.requireSession(
                challenge.getAttribute('href')
              );
            }
          } catch (error) {
            event.preventDefault();
            console.error(error);
            showMessage(
              'No se pudo verificar la sesión.',
              true
            );
          }
        }

        return;
      }

      const slide = target.closest('.swiper-slide');
      const element = target.closest('[data-card]');

      if (!slide || !element) return;

      const slides = [
        ...wrapper.querySelectorAll('.swiper-slide')
      ];

      const index = slides.indexOf(slide);

      // Clic en carta lateral: seleccionarla.
      if (index !== activeIndex) {
        if (swiper) {
          swiper.slideTo(index);
        } else {
          moveFallback(index);
        }
        return;
      }

      // Clic en carta central: voltearla.
      flipCard(element);
    };

    // Teclado: Enter o espacio para voltear.
    wrapper.onkeydown = event => {
      if (
        event.target.matches('[data-card]') &&
        ['Enter', ' '].includes(event.key)
      ) {
        event.preventDefault();

        const element = event.target;
        const slide = element.closest('.swiper-slide');

        if (
          slide?.dataset.playerId ===
          visible[activeIndex]?.id
        ) {
          flipCard(element);
        }
      }
    };
  }

  // Navegación de respaldo.
  function moveFallback(index) {
    const target = Math.max(
      0,
      Math.min(index, visible.length - 1)
    );

    const slides = wrapper.querySelectorAll(
      '.swiper-slide'
    );

    slides[target]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });

    updateMeta(target);
  }

  // Configurar Swiper para deslizamientos cortos.
  function setupSwiper(index) {
    if (!visible.length) {
      updateMeta(0);
      return;
    }

    if (typeof window.Swiper !== 'function') {
      swiperElement.classList.add('swiper-fallback');
      moveFallback(index);
      return;
    }

    swiperElement.classList.remove('swiper-fallback');

    swiper = new Swiper(swiperElement, {
      slidesPerView: 'auto',
      centeredSlides: true,
      spaceBetween: 18,
      initialSlide: index,

      speed: 320,
      grabCursor: false,
      watchOverflow: true,

      // Deslizamiento suave y corto.
      threshold: 5,
      shortSwipes: true,
      longSwipes: true,
      longSwipesRatio: .15,
      longSwipesMs: 300,
      resistanceRatio: .65,

      // Un toque no debe interferir con botones.
      preventClicks: true,
      preventClicksPropagation: false,
      slideToClickedSlide: false,

      // Mantener desplazamiento vertical de la página.
      touchStartPreventDefault: false,
      touchMoveStopPropagation: false,

      navigation: {
        nextEl: nextBtn,
        prevEl: prevBtn
      },

      keyboard: {
        enabled: true,
        onlyInViewport: true
      },

      a11y: {
        enabled: true,
        prevSlideMessage: 'Carta anterior',
        nextSlideMessage: 'Carta siguiente'
      },

      on: {
        init() {
          updateMeta(this.activeIndex);
        },

        slideChange() {
          updateMeta(this.activeIndex);
        }
      }
    });

    updateMeta(swiper.activeIndex);
  }

  // Mostrar colección.
  function render(focus = null) {
    const previousId =
      focus || visible[activeIndex]?.id || initialFocus;

    if (swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }

    visible = filtered();

    let index = visible.findIndex(
      player => player.id === previousId
    );

    if (index < 0) index = 0;

    activeIndex = index;

    if (count) {
      count.textContent = visible.length;
    }

    wrapper.innerHTML = visible.map(card).join('');

    bindCards();
    setupSwiper(index);
  }

  // Filtros.
  filters.forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.collectionFilter;

      if (!(selected in categories)) return;

      current = selected;
      activeIndex = 0;

      filters.forEach(item => {
        const active = item === button;

        item.classList.toggle('is-active', active);
        item.setAttribute(
          'aria-pressed',
          String(active)
        );
      });

      clearMessage();
      render();
    });
  });

  // Flechas de escritorio.
  prevBtn?.addEventListener('click', () => {
    if (!swiper) moveFallback(activeIndex - 1);
  });

  nextBtn?.addEventListener('click', () => {
    if (!swiper) moveFallback(activeIndex + 1);
  });

  // Iniciar.
  render(initialFocus);
})();
