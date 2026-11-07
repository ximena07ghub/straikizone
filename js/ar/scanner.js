(() => {
  const start=document.querySelector('[data-scan-start]'),stop=document.querySelector('[data-scan-stop]'),result=document.querySelector('[data-scan-result]');let scanner=null,active=false;
  const allowed=['ar-pelota.html','ar-estadio.html','ar-premio.html','ar-carta.html'];
  function message(t){result.textContent=t}
  function handle(decoded){let target='',destination='';try{const u=new URL(decoded,location.href);target=u.pathname.split('/').pop();destination=target+(u.search||'')}catch{target=decoded.split('?')[0].split('/').pop();destination=decoded}if(allowed.includes(target)){message('Código reconocido. Abriendo experiencia…');stopScan().finally(()=>location.href=destination)}else{message('Código leído, pero no corresponde a una experiencia StrikeZone.') }}
  async function startScan(){if(active)return;if(typeof Html5Qrcode==='undefined'){message('El lector no pudo cargarse. Usa la cámara del teléfono sobre uno de los QR de StrikeZone.');return}scanner=new Html5Qrcode('reader');try{await scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:250,height:250}},handle,()=>{});active=true;start.disabled=true;stop.disabled=false;message('Cámara activa. Coloca el QR dentro del recuadro.')}catch{message('No se pudo abrir la cámara. Revisa el permiso del navegador.')}}
  async function stopScan(){if(scanner&&active){try{await scanner.stop();await scanner.clear()}catch{}active=false;start.disabled=false;stop.disabled=true}}
  start?.addEventListener('click',startScan);stop?.addEventListener('click',stopScan);window.addEventListener('beforeunload',stopScan);
})();

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

  // Comprobar el dominio de un QR.
  function trusted(url) {
    return (
      url.origin === location.origin ||
      (
        url.protocol === 'https:' &&
        legacyHosts.has(url.hostname)
      )
    );
  }

  // Evitar parámetros duplicados o desconocidos.
  function singleParam(url, key) {
    const values = url.searchParams.getAll(key);

    return values.length === 1 && values[0].trim()
      ? values[0].trim()
      : null;
  }

  // Resolver exclusivamente identificadores del catálogo.
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

    // Conservar las experiencias AR antiguas.
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
      return { error: 'El enlace AR contiene un fragmento inválido.' };
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

    // Identificador único de carta.
    if (cardId) {
      const card = cards[cardId];

      if (!card) {
        return { error: 'La carta del QR no está registrada.' };
      }

      return {
        href: `ar-carta.html?card=${encodeURIComponent(cardId)}`,
        label: card.name
      };
    }

    if (!modelKey || !models[modelKey]) {
      return { error: 'El modelo del QR no está registrado.' };
    }

    const model = models[modelKey];

    // No elegir jugadores arbitrariamente.
    const related = Object.values(cards).filter(
      card => card.modelKey === modelKey
    );

    if (related.length === 1) {
      return {
        href: `ar-carta.html?card=${encodeURIComponent(related[0].id)}`,
        label: related[0].name
      };
    }

    return {
      href: `ar-carta.html?model=${encodeURIComponent(modelKey)}`,
      label: model.title || modelKey,
      shared: related.length > 1
    };
  }

  // Detener cámara y liberar recursos.
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

  // Abrir el visor existente.
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

  // Solicitar cámara tras interacción.
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
