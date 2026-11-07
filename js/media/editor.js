
(() => {
  const $ = selector => document.querySelector(selector);

  const canvas = $('[data-editor-canvas]');
  const video = $('[data-editor-video]');
  const image = $('[data-editor-image]');
  const panel = $('[data-video-only]');

  if (!canvas || !video || !image) return;

  const ctx = canvas.getContext('2d', {
    willReadFrequently: true
  });

  if (!ctx) return;

  const titleEl = $('[data-editor-title]');
  const kindEl = $('[data-editor-kind]');
  const statusEl = $('[data-editor-status]');
  const intensityEl = $('[data-intensity]');
  const intensityValue = $('[data-intensity-value]');
  const playBtn = $('[data-video-play]');
  const seekEl = $('[data-video-seek]');
  const currentEl = $('[data-video-current]');
  const durationEl = $('[data-video-duration]');
  const recordBtn = $('[data-record-video]');
  const saveBtn = $('[data-save-media]');
  const downloadBtn = $('[data-download-media]');

  const filterButtons = [
    ...document.querySelectorAll('[data-edit-filter]')
  ];

  const viewButtons = [
    ...document.querySelectorAll('[data-video-view]')
  ];

  const params = new URLSearchParams(location.search);

  const type = params.get('type') === 'video'
    ? 'video'
    : 'image';

  const source = params.get('src') || '';
  const title = params.get('title') || 'Contenido StrikeZone';

  const filterNames = {
    normal: 'Original',
    blur: 'Desenfoque',
    pixel: 'Pixelado',
    thermal: 'Cámara térmica',
    color: 'Ajuste de color',
    pastel: 'Pastel',
    soft: 'Suavizado',
    saturate: 'Alta saturación'
  };

  let filter = 'normal';
  let view = type === 'video' ? 'original' : 'filtered';
  let loaded = false;
  let frameId = 0;
  let exporting = false;
  let recorder = null;
  let recordingStream = null;
  let recordingChunks = [];
  let recordingForDownload = false;
  let recordingFailed = false;
  let recordingMime = 'video/webm';
  let closing = false;

  titleEl.textContent = title;
  kindEl.textContent = type === 'video'
    ? 'VIDEO EDITABLE'
    : 'IMAGEN EDITABLE';

  // Mostrar controles cuando el recurso es video.
  panel.hidden = type !== 'video';

  function setStatus(message) {
    if (statusEl) statusEl.textContent = message;
  }

  // Permitir únicamente recursos locales.
  function resolveSource(path) {
    try {
      const url = new URL(path, location.href);

      if (url.origin !== location.origin) return null;
      if (url.search || url.hash) return null;

      const pathname = url.pathname;
      const assetIndex = pathname.indexOf('/assets/');

      if (assetIndex === -1) return null;

      const assetPath = pathname.slice(assetIndex);

      if (type === 'video') {
        if (!assetPath.startsWith('/assets/media/gallery/')) {
          return null;
        }

        if (!/\.mp4$/i.test(assetPath)) return null;
      } else {
        if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(assetPath)) {
          return null;
        }
      }

      return url.href;
    } catch {
      return null;
    }
  }

  const sourceUrl = resolveSource(source);

  function setCanvasSize(width, height) {
    if (!width || !height) return;

    const scale = Math.min(1, 1280 / width);

    canvas.width = Math.max(2, Math.round(width * scale));
    canvas.height = Math.max(2, Math.round(height * scale));
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '00:00';
    }

    const value = Math.floor(seconds);

    return (
      String(Math.floor(value / 60)).padStart(2, '0') +
      ':' +
      String(value % 60).padStart(2, '0')
    );
  }

  function updateProgress() {
    if (type !== 'video') return;

    const duration = Number.isFinite(video.duration)
      ? video.duration
      : 0;

    currentEl.textContent = formatTime(video.currentTime);
    durationEl.textContent = formatTime(duration);

    seekEl.value = duration > 0
      ? String(Math.round(video.currentTime / duration * 1000))
      : '0';
  }

  // Aplicar el efecto térmico al fotograma.
  function thermalEffect(frame, intensity) {
    const data = frame.data;
    const amount = intensity / 100;

    for (let i = 0; i < data.length; i += 4) {
      const originalR = data[i];
      const originalG = data[i + 1];
      const originalB = data[i + 2];

      const brightness =
        .299 * originalR +
        .587 * originalG +
        .114 * originalB;

      let r = 0;
      let g = 0;
      let b = 0;

      if (brightness < 64) {
        g = brightness * 2;
        b = 150 + brightness * 1.6;
      } else if (brightness < 128) {
        const t = (brightness - 64) / 64;
        g = 128 + 127 * t;
        b = 255 - 210 * t;
      } else if (brightness < 192) {
        const t = (brightness - 128) / 64;
        r = 255 * t;
        g = 255;
        b = 45 * (1 - t);
      } else {
        const t = (brightness - 192) / 63;
        r = 255;
        g = 255 - 220 * t;
      }

      data[i] = originalR * (1 - amount) + r * amount;
      data[i + 1] = originalG * (1 - amount) + g * amount;
      data[i + 2] = originalB * (1 - amount) + b * amount;
    }

    return frame;
  }

  // Dibujar el medio con el filtro seleccionado.
  function drawFrame(forceFiltered = false) {
    if (!loaded || !canvas.width || !canvas.height) return;

    if (type === 'video' && video.readyState < 2) return;

    const sourceElement = type === 'video' ? video : image;

    const activeFilter =
      type === 'video' &&
      view === 'original' &&
      !forceFiltered
        ? 'normal'
        : filter;

    const amount = Number(intensityEl.value);
    const strength = amount / 100;
    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.filter = 'none';
    ctx.imageSmoothingEnabled = true;

    try {
      if (activeFilter === 'pixel') {
        const blocks = Math.max(
          10,
          Math.round(48 - strength * 34)
        );

        const smallWidth = Math.max(
          20,
          Math.round(width / blocks)
        );

        const smallHeight = Math.max(
          15,
          Math.round(height / blocks)
        );

        const temp = document.createElement('canvas');
        temp.width = smallWidth;
        temp.height = smallHeight;

        const tempCtx = temp.getContext('2d');

        tempCtx.drawImage(
          sourceElement,
          0, 0, smallWidth, smallHeight
        );

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(temp, 0, 0, width, height);

      } else if (activeFilter === 'thermal') {
        ctx.drawImage(sourceElement, 0, 0, width, height);

        const frame = ctx.getImageData(
          0, 0, width, height
        );

        ctx.putImageData(
          thermalEffect(frame, amount),
          0, 0
        );

      } else {
        switch (activeFilter) {
          case 'blur':
            ctx.filter = `blur(${(1 + strength * 11).toFixed(1)}px)`;
            break;

          case 'color':
            ctx.filter =
              `saturate(${1 + strength * .9}) ` +
              `contrast(${1 + strength * .18}) ` +
              `brightness(${1 + strength * .05})`;
            break;

          case 'pastel':
            ctx.filter =
              `saturate(${1 - strength * .35}) ` +
              `contrast(${1 - strength * .18}) ` +
              `brightness(${1 + strength * .15})`;
            break;

          case 'soft':
            ctx.filter =
              `blur(${strength * 2.2}px) ` +
              `saturate(${1 - strength * .12})`;
            break;

          case 'saturate':
            ctx.filter =
              `saturate(${1 + strength * 1.65}) ` +
              `contrast(${1 + strength * .08})`;
            break;

          default:
            ctx.filter = 'none';
        }

        ctx.drawImage(
          sourceElement,
          0, 0, width, height
        );

        if (activeFilter === 'pastel') {
          ctx.filter = 'none';
          ctx.fillStyle =
            `rgba(255,236,221,${.06 + strength * .13})`;

          ctx.fillRect(0, 0, width, height);
        }
      }
    } catch (error) {
      console.error('Error al dibujar:', error);
      setStatus('No se pudo procesar este fotograma.');
    } finally {
      ctx.restore();
    }
  }

  // Un solo ciclo de dibujo durante la reproducción.
  function stopRenderLoop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function renderLoop() {
    frameId = 0;
    drawFrame(exporting);
    updateProgress();

    if (
      type === 'video' &&
      loaded &&
      !video.paused &&
      !video.ended
    ) {
      frameId = requestAnimationFrame(renderLoop);
    }
  }

  function startRenderLoop() {
    if (!frameId) {
      frameId = requestAnimationFrame(renderLoop);
    }
  }

  function updatePlayButton() {
    if (!playBtn) return;

    playBtn.textContent = video.paused
      ? 'Reproducir'
      : 'Pausar';
  }

  // Comparar sin reiniciar la reproducción.
  viewButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (exporting) return;

      view = button.dataset.videoView;

      viewButtons.forEach(item => {
        const active = item === button;

        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      drawFrame();
    });
  });

  // Cambiar el filtro.
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (exporting) return;

      const selected = button.dataset.editFilter;

      if (!(selected in filterNames)) return;

      filter = selected;

      filterButtons.forEach(item => {
        item.classList.toggle(
          'is-active',
          item === button
        );
      });

      // Mostrar inmediatamente el filtro elegido.
      if (type === 'video' && filter !== 'normal') {
        view = 'filtered';

        viewButtons.forEach(item => {
          const active =
            item.dataset.videoView === 'filtered';

          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
      }

      drawFrame();
      setStatus(`Filtro seleccionado: ${filterNames[filter]}.`);
    });
  });

  intensityEl.addEventListener('input', () => {
    if (exporting) return;

    intensityValue.textContent = `${intensityEl.value}%`;
    drawFrame();
  });

  // Reproducir o pausar.
  playBtn?.addEventListener('click', async () => {
    if (!loaded || exporting) return;

    if (!video.paused) {
      video.pause();
      return;
    }

    try {
      await video.play();
    } catch (error) {
      console.error('Error de reproducción:', error);
      setStatus('No se pudo reproducir el video.');
    }
  });

  // Moverse por la línea de tiempo.
  seekEl?.addEventListener('input', () => {
    if (
      !loaded ||
      exporting ||
      !Number.isFinite(video.duration)
    ) {
      return;
    }

    video.currentTime =
      Number(seekEl.value) / 1000 * video.duration;

    updateProgress();
  });

  // Cargar la imagen.
  if (type === 'image') {
    if (!sourceUrl) {
      setStatus('La ruta de la imagen no es válida.');
    } else {
      image.onload = () => {
        setCanvasSize(
          image.naturalWidth,
          image.naturalHeight
        );

        loaded = true;
        drawFrame();
        setStatus('Imagen lista para editar.');
      };

      image.onerror = () => {
        loaded = false;
        setStatus('Imagen pendiente o no disponible.');
      };

      image.src = sourceUrl;
    }
  }

  // Cargar el video.
  if (type === 'video') {
    if (!sourceUrl) {
      setStatus('La ruta del video no es válida.');
    } else {
      video.addEventListener('loadedmetadata', () => {
        setCanvasSize(
          video.videoWidth,
          video.videoHeight
        );

        updateProgress();
      });

      video.addEventListener('loadeddata', () => {
        loaded = true;
        drawFrame();
        updateProgress();
        setStatus('Video listo para reproducir.');
      });

      video.addEventListener('play', () => {
        updatePlayButton();
        startRenderLoop();
      });

      video.addEventListener('pause', () => {
        stopRenderLoop();
        drawFrame(exporting);
        updatePlayButton();
      });

      video.addEventListener('seeked', () => {
        drawFrame(exporting);
        updateProgress();
      });

      video.addEventListener('timeupdate', updateProgress);

      video.addEventListener('ended', () => {
        stopRenderLoop();
        updatePlayButton();

        if (exporting) {
          finishRecording();
        }
      });

      video.addEventListener('error', () => {
        loaded = false;
        stopRenderLoop();

        setStatus(
          'Video pendiente o formato no compatible.'
        );

        if (exporting) {
          recordingFailed = true;
          finishRecording();
        }
      });

      video.src = sourceUrl;
      video.load();
    }
  }

  function slug(value) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function toBlob(mime) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob?.size) {
          resolve(blob);
        } else {
          reject(new Error('No se pudo crear el archivo.'));
        }
      }, mime, .93);
    });
  }

  // Validar sesión antes de guardar.
  function requireSession() {
    const returnUrl =
      location.pathname.split('/').pop() +
      location.search;

    const sessionApi = window.StrikeZoneSession;

    if (typeof sessionApi?.require === 'function') {
      return Boolean(sessionApi.require(returnUrl));
    }

    setStatus('No se pudo validar la sesión activa.');
    return false;
  }

  async function saveToProfile(blob, mediaType) {
    if (!window.StrikeZonePhotos?.add) {
      throw new Error('El almacenamiento no está disponible.');
    }

    const id = await window.StrikeZonePhotos.add(
      blob,
      filterNames[filter],
      {
        type: mediaType,
        title,
        source: 'galeria'
      }
    );

    if (id === null || id === undefined || id === false) {
      throw new Error('No se confirmó el guardado.');
    }

    return id;
  }

  // Guardar o descargar imagen.
  async function processImage(downloadOnly) {
    if (!loaded) {
      setStatus('No hay una imagen disponible.');
      return;
    }

    if (!downloadOnly && !requireSession()) return;

    try {
      const blob = await toBlob('image/jpeg');

      if (downloadOnly) {
        downloadBlob(
          blob,
          `strikezone-${slug(title)}-${filter}.jpg`
        );

        setStatus('Descarga de imagen iniciada.');
      } else {
        await saveToProfile(blob, 'image');

        setStatus('Imagen guardada en Mis Medios.');
        window.StrikeZoneFeedback?.show('Imagen guardada.');
      }
    } catch (error) {
      console.error('Error de imagen:', error);
      setStatus('No se pudo guardar o descargar la imagen.');
    }
  }

  // Bloquear controles durante la exportación.
  function setExportControls(busy) {
    [
      playBtn,
      seekEl,
      saveBtn,
      downloadBtn,
      intensityEl,
      ...filterButtons,
      ...viewButtons
    ].forEach(element => {
      if (element) element.disabled = busy;
    });

    if (recordBtn) {
      recordBtn.textContent = busy
        ? 'Detener exportación'
        : 'Guardar video filtrado';
    }
  }

  function stopRecordingTracks() {
    recordingStream?.getTracks().forEach(track => track.stop());
    recordingStream = null;
  }

  function finishRecording() {
    if (!recorder || recorder.state === 'inactive') return;

    try {
      recorder.stop();
    } catch (error) {
      console.error('Error al detener exportación:', error);
      recordingFailed = true;
      stopRecordingTracks();
      exporting = false;
      setExportControls(false);
      setStatus('No se pudo finalizar la exportación.');
    }
  }

  // Volver al principio antes de exportar.
  function rewindVideo() {
    return new Promise((resolve, reject) => {
      if (video.readyState < 2) {
        reject(new Error('El video no está listo.'));
        return;
      }

      if (video.currentTime === 0) {
        resolve();
        return;
      }

      const onSeeked = () => {
        video.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        video.removeEventListener('seeked', onSeeked);
        reject(new Error('No se pudo reiniciar el video.'));
      };

      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });

      video.currentTime = 0;
    });
  }

  // Exportar el canvas filtrado como WebM.
  async function exportVideo(downloadOnly) {
    if (!loaded || exporting || type !== 'video') return;

    if (!downloadOnly && !requireSession()) return;

    if (
      typeof canvas.captureStream !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      setStatus('Tu navegador no admite exportación de video.');
      return;
    }

    const mime = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ].find(value => MediaRecorder.isTypeSupported(value));

    if (!mime) {
      setStatus('Tu navegador no admite exportación WebM.');
      return;
    }

    exporting = true;
    recordingFailed = false;
    recordingForDownload = downloadOnly;
    recordingMime = mime;
    recordingChunks = [];

    setExportControls(true);

    try {
      video.pause();
      await rewindVideo();

      drawFrame(true);

      recordingStream = canvas.captureStream(30);

      recorder = new MediaRecorder(recordingStream, {
        mimeType: mime
      });

      recorder.ondataavailable = event => {
        if (event.data?.size) {
          recordingChunks.push(event.data);
        }
      };

      recorder.onerror = error => {
        console.error('Error de grabación:', error);
        recordingFailed = true;
        finishRecording();
      };

      recorder.onstop = async () => {
        stopRecordingTracks();

        if (closing) return;

        try {
          if (recordingFailed) {
            throw new Error('La grabación falló.');
          }

          const blob = new Blob(recordingChunks, {
            type: recordingMime
          });

          if (!blob.size) {
            throw new Error('El archivo exportado está vacío.');
          }

          if (recordingForDownload) {
            downloadBlob(
              blob,
              `strikezone-${slug(title)}-${filter}.webm`
            );

            setStatus('Descarga del video iniciada.');
          } else {
            await saveToProfile(blob, 'video');

            setStatus('Video guardado en Mis Medios.');
            window.StrikeZoneFeedback?.show('Video guardado.');
          }
        } catch (error) {
          console.error('Error de exportación:', error);
          setStatus('No se pudo guardar el video filtrado.');
        } finally {
          exporting = false;
          setExportControls(false);
          drawFrame();
        }
      };

      // Iniciar grabación antes de reproducir.
      recorder.start(250);

      await video.play();
      startRenderLoop();

      setStatus('Exportando video filtrado…');
    } catch (error) {
      console.error('Error al exportar:', error);

      recordingFailed = true;
      video.pause();

      if (recorder?.state === 'recording') {
        finishRecording();
      } else {
        stopRecordingTracks();
        exporting = false;
        setExportControls(false);
      }

      setStatus('No se pudo iniciar la exportación.');
    }
  }

  recordBtn?.addEventListener('click', () => {
    if (exporting) {
      video.pause();
      finishRecording();
    } else {
      exportVideo(false);
    }
  });

  saveBtn?.addEventListener('click', () => {
    if (type === 'image') {
      processImage(false);
    } else {
      exportVideo(false);
    }
  });

  downloadBtn?.addEventListener('click', () => {
    if (type === 'image') {
      processImage(true);
    } else {
      exportVideo(true);
    }
  });

  // Liberar recursos al salir.
  window.addEventListener('pagehide', () => {
    closing = true;
    stopRenderLoop();
    video.pause();

    try {
      if (recorder?.state === 'recording') {
        recorder.stop();
      }
    } catch {
      // Liberar los recursos restantes.
    }

    stopRecordingTracks();
  });
})();
