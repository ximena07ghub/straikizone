
(() => {
    const container = document.querySelector('#ar-container');
    const button = document.querySelector('[data-ar-capture]');
    const message = document.querySelector('[data-capture-message]');
    const loginBox = document.querySelector('[data-capture-login]');
    const loginLink = document.querySelector('[data-capture-login-link]');
    const closeLogin = document.querySelector('[data-capture-login-close]');
  
    if (!container || !button) return;
  
    const params = new URLSearchParams(location.search);
    const cardId = params.get('card');
    const modelId = params.get('model');
  
    const cards = window.STRIKEZONE_AR_CARDS || {};
    const models = window.STRIKEZONE_AR_MODELS || {};
  
    const selectedCard = cardId && cards[cardId]
      ? cards[cardId]
      : null;
  
    const selectedModel = selectedCard
      ? models[selectedCard.modelKey]
      : models[modelId];
  
    let saving = false;
  
    function notify(text, error = false) {
      if (!message) return;
  
      message.textContent = text;
      message.hidden = false;
      message.classList.toggle('is-error', error);
    }
  
    function validSession() {
      return window.StrikeZoneRewards?.session?.() || null;
    }
  
    // Solicitar sesión antes de guardar.
    function requestLogin() {
      if (!loginBox) return;
  
      const next =
        `ar-carta.html${location.search}`;
  
      if (loginLink) {
        loginLink.href =
          `login.html?next=${encodeURIComponent(next)}`;
      }
  
      loginBox.hidden = false;
    }
  
    closeLogin?.addEventListener('click', () => {
      loginBox.hidden = true;
    });
  
    // Encontrar cámara y render del visor existente.
    function getLayers() {
      const video = container.querySelector('video');
      const canvases = [
        ...container.querySelectorAll('canvas')
      ];
  
      const overlay = canvases.find(
        canvas =>
          canvas.width > 0 &&
          canvas.height > 0 &&
          getComputedStyle(canvas).display !== 'none'
      );
  
      return { video, overlay };
    }
  
    // Dibujar el video respetando object-fit: cover.
    function drawVideo(ctx, video, rect, baseRect, ratio) {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
  
      if (!vw || !vh) {
        throw new Error('La cámara todavía no tiene imagen.');
      }
  
      const destX = (rect.left - baseRect.left) * ratio;
      const destY = (rect.top - baseRect.top) * ratio;
      const destW = rect.width * ratio;
      const destH = rect.height * ratio;
  
      const scale = Math.max(destW / vw, destH / vh);
      const cropW = destW / scale;
      const cropH = destH / scale;
  
      const sx = (vw - cropW) / 2;
      const sy = (vh - cropH) / 2;
  
      ctx.drawImage(
        video,
        sx, sy, cropW, cropH,
        destX, destY, destW, destH
      );
    }
  
    // Obtener cámara y modelo superpuestos.
    function composeCapture() {
      const { video, overlay } = getLayers();
  
      if (
        !video ||
        !overlay ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        throw new Error(
          'La cámara y el modelo AR todavía no están listos.'
        );
      }
  
      const bounds = container.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
  
      if (
        !bounds.width ||
        !bounds.height ||
        !overlayRect.width ||
        !overlayRect.height
      ) {
        throw new Error('No se pudo obtener el encuadre AR.');
      }
  
      const ratio = Math.min(devicePixelRatio || 1, 2);
  
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
  
      const ctx = canvas.getContext('2d', {
        alpha: false
      });
  
      if (!ctx) {
        throw new Error('No se pudo crear la fotografía.');
      }
  
      // Primero el frame real de cámara.
      drawVideo(ctx, video, videoRect, bounds, ratio);
  
      // Después el render AR.
      ctx.drawImage(
        overlay,
        (overlayRect.left - bounds.left) * ratio,
        (overlayRect.top - bounds.top) * ratio,
        overlayRect.width * ratio,
        overlayRect.height * ratio
      );
  
      return canvas;
    }
  
    function toBlob(canvas) {
      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob?.size) {
            resolve(blob);
          } else {
            reject(new Error('No se generó la imagen AR.'));
          }
        }, 'image/png');
      });
    }
  
    // Capturar y guardar únicamente en la cuenta activa.
    async function capture() {
      if (saving) return;
  
      const session = validSession();
  
      if (!session?.id) {
        requestLogin();
        notify(
          'Inicia sesión para guardar capturas en Mis Medios.',
          true
        );
        return;
      }
  
      if (!window.StrikeZonePhotos?.add) {
        notify(
          'El almacenamiento de fotografías no está disponible.',
          true
        );
        return;
      }
  
      saving = true;
      button.disabled = true;
  
      try {
        const canvas = composeCapture();
        const blob = await toBlob(canvas);
  
        // No inventar identificadores de jugador.
        const modelKey =
          selectedCard?.modelKey ||
          selectedModel?.key ||
          null;
  
        const title = selectedCard
          ? `AR · ${selectedCard.name}`
          : `AR · ${selectedModel?.title || 'Modelo 3D'}`;
  
        const metadata = {
          source: 'ar',
          type: 'image',
          ownerId: session.id,
          title,
          createdAt: Date.now()
        };
  
        if (selectedCard) {
          metadata.cardId = selectedCard.id;
        }
  
        if (modelKey) {
          metadata.modelKey = modelKey;
        }
  
        // add() confirma la transacción de IndexedDB.
        const id = await window.StrikeZonePhotos.add(
          blob,
          'AR',
          metadata
        );
  
        if (id == null) {
          throw new Error('IndexedDB no confirmó el guardado.');
        }
  
        notify('Foto guardada en Mis Medios.');
  
      } catch (error) {
        console.error('Error al capturar AR:', error);
  
        notify(
          error?.message ||
          'No se pudo guardar la fotografía AR.',
          true
        );
      } finally {
        saving = false;
        button.disabled = false;
      }
    }
  
    button.addEventListener('click', capture);
  })();
  