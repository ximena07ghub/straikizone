
(() => {
  const startBtn = document.querySelector('[data-scan-start]');
  const stopBtn = document.querySelector('[data-scan-stop]');
  const result = document.querySelector('[data-scan-result]');

  const cards = window.STRIKEZONE_AR_CARDS || {};
  const models = window.STRIKEZONE_AR_MODELS || {};

  const legacyHosts = new Set([
    'willowy-crisp-7d943a.netlify.app'
  ]);

  const legacyPages = new Set([
    'ar-pelota.html',
    'ar-estadio.html',
    'ar-premio.html'
  ]);

  let scanner = null;
  let active = false;
  let processing = false;

  function message(text) {
    if (result) result.textContent = text;
  }

  // Validar el origen del QR.
  function trusted(url) {
    return (
      url.origin === location.origin ||
      (
        url.protocol === 'https:' &&
        legacyHosts.has(url.hostname)
      )
    );
  }

  // Evitar parámetros duplicados o vacíos.
  function singleParam(url, key) {
    const values = url.searchParams.getAll(key);

    return values.length === 1 && values[0].trim()
      ? values[0].trim()
      : null;
  }

  // Resolver únicamente identificadores del catálogo.
  function resolveQR(decoded) {
    let url;

    try {
      url = new URL(decoded.trim(), location.href);
    } catch {
      return {
        error: 'El QR no contiene un enlace válido.'
      };
    }

    if (!trusted(url)) {
      return {
        error: 'El QR no pertenece a una dirección conocida de StrikeZone.'
      };
    }

    const page = url.pathname.split('/').pop();

    // Conservar experiencias AR antiguas.
    if (legacyPages.has(page)) {
      if (url.search || url.hash) {
        return {
          error: 'El enlace contiene parámetros no reconocidos.'
        };
      }

      return { href: page, label: page };
    }

    if (page !== 'ar-carta.html') {
      return {
        error: 'El QR no corresponde a una experiencia AR conocida.'
      };
    }

    if (url.hash) {
      return {
        error: 'El enlace AR contiene un fragmento inválido.'
      };
    }

    const keys = [...url.searchParams.keys()];

    if (
      keys.some(key => !['card', 'model'].includes(key)) ||
      keys.length !== 1
    ) {
      return {
        error: 'El enlace debe identificar una carta o un modelo.'
      };
    }

    const cardId = singleParam(url, 'card');
    const modelKey = singleParam(url, 'model');

    // Carta identificada expresamente.
    if (cardId) {
      const card = cards[cardId];

      if (!card) {
        return {
          error: 'La carta del QR no está registrada.'
        };
      }

      return {
        href:
          `ar-carta.html?card=${encodeURIComponent(cardId)}` +
          '&from=scanner',
        label: card.name
      };
    }

    if (!modelKey || !models[modelKey]) {
      return {
        error: 'El modelo del QR no está registrado.'
      };
    }

    const model = models[modelKey];

    // No asignar arbitrariamente un modelo compartido.
    const related = Object.values(cards).filter(
      card => card.modelKey === modelKey
    );

    if (related.length === 1) {
      return {
        href:
          `ar-carta.html?card=${encodeURIComponent(related[0].id)}` +
          '&from=scanner',
        label: related[0].name
      };
    }

    return {
      href:
        `ar-carta.html?model=${encodeURIComponent(modelKey)}` +
        '&from=scanner',
      label: model.title || modelKey,
      shared: related.length > 1
    };
  }

  // Detener la cámara y liberar recursos.
  async function stopScan() {
    if (scanner) {
      try {
        if (active) await scanner.stop();
      } catch (error) {
        console.warn('Error al detener cámara:', error);
      }

      try {
        await scanner.clear();
      } catch (error) {
        console.warn('Error al limpiar lector:', error);
      }
    }

    scanner = null;
    active = false;

    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
  }

  // Abrir la experiencia existente.
  async function onDetected(decoded) {
    if (processing) return;

    const resolved = resolveQR(decoded);

    if (resolved.error) {
      message(resolved.error);
      return;
    }

    processing = true;

    message(
      resolved.shared
        ? `Modelo compartido reconocido: ${resolved.label}.`
        : `Experiencia reconocida: ${resolved.label}.`
    );

    await stopScan();
    location.href = resolved.href;
  }

  // Pedir permiso únicamente después del clic.
  async function startScan() {
    if (active || processing) return;

    if (typeof Html5Qrcode === 'undefined') {
      message(
        'El lector QR no se cargó. Comprueba tu conexión.'
      );
      return;
    }

    if (!window.isSecureContext) {
      message(
        'La cámara requiere HTTPS o localhost.'
      );
      return;
    }

    if (startBtn) startBtn.disabled = true;

    try {
      scanner = new Html5Qrcode('reader', {
        verbose: false
      });

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (width, height) => {
            const side = Math.min(width, height, 260);

            return {
              width: Math.floor(side),
              height: Math.floor(side)
            };
          }
        },
        onDetected,
        () => {}
      );

      active = true;

      if (stopBtn) stopBtn.disabled = false;

      message('Cámara activa. Apunta al QR de StrikeZone.');
    } catch (error) {
      console.error('Error de cámara:', error);
      await stopScan();

      message(
        'No se pudo iniciar la cámara. Revisa el permiso y el dispositivo.'
      );
    }
  }

  startBtn?.addEventListener('click', startScan);

  stopBtn?.addEventListener('click', async () => {
    processing = false;
    await stopScan();
    message('Cámara detenida.');
  });

  window.addEventListener('pagehide', () => {
    void stopScan();
  });
})();
