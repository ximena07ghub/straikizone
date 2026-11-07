
(() => {
  const chips = [
    ...document.querySelectorAll('[data-gallery-filter]')
  ];

  const cards = [
    ...document.querySelectorAll('[data-media-card]')
  ];

  const videos = [];

  // Crear el marcador pendiente.
  function createPending(type) {
    const box = document.createElement('div');
    box.className = 'media-pending';
    box.setAttribute('role', 'status');

    const symbol = document.createElement('span');
    symbol.className = 'media-pending-symbol';
    symbol.setAttribute('aria-hidden', 'true');
    symbol.textContent = '◇';

    const title = document.createElement('strong');
    title.textContent = type === 'video'
      ? 'VIDEO PENDIENTE'
      : 'IMAGEN PENDIENTE';

    const note = document.createElement('small');
    note.textContent = 'StrikeZone · Próximamente';

    box.append(symbol, title, note);

    return box;
  }

  // Comprobar que la ruta pertenece al proyecto.
  function validSource(path, type) {
    if (!path) return null;

    try {
      const url = new URL(path, location.href);

      if (url.origin !== location.origin) return null;
      if (url.search || url.hash) return null;

      const pathname = url.pathname;

      if (type === 'video') {
        if (!pathname.includes('/assets/media/gallery/')) {
          return null;
        }

        if (!/\.mp4$/i.test(pathname)) return null;
      } else {
        if (!pathname.includes('/assets/')) return null;

        if (!/\.(png|jpe?g|webp|gif)$/i.test(pathname)) {
          return null;
        }
      }

      return url;
    } catch {
      return null;
    }
  }

  // Desactivar edición mientras el archivo no exista.
  function setPending(card) {
    const type = card.dataset.mediaType;
    const preview = card.querySelector('[data-media-preview]');
    const tag = card.querySelector('[data-media-tag]');
    const action = card.querySelector('[data-media-edit]');

    card.classList.add('is-pending');

    if (preview) {
      preview.replaceChildren(createPending(type));
    }

    if (tag) {
      tag.textContent = type === 'video'
        ? 'VIDEO · PENDIENTE'
        : 'IMAGEN · PENDIENTE';
    }

    if (action) {
      action.removeAttribute('href');
      action.removeAttribute('target');
      action.setAttribute('aria-disabled', 'true');
      action.setAttribute('tabindex', '-1');
      action.classList.add('is-unavailable');
      action.textContent = 'No disponible';
    }
  }

  // Habilitar el editor cuando el recurso carga.
  function setAvailable(card, path) {
    const type = card.dataset.mediaType;
    const tag = card.querySelector('[data-media-tag]');
    const action = card.querySelector('[data-media-edit]');
    const title = card.querySelector('h3')?.textContent.trim()
      || 'Contenido de béisbol';

    card.classList.remove('is-pending');

    if (tag) {
      tag.textContent = type === 'video'
        ? 'VIDEO · EDITABLE'
        : 'IMAGEN · EDITABLE';
    }

    if (action) {
      const params = new URLSearchParams({
        type,
        src: path,
        title
      });

      action.href = `editor-media.html?${params.toString()}`;
      action.removeAttribute('aria-disabled');
      action.removeAttribute('tabindex');
      action.classList.remove('is-unavailable');
      action.textContent = 'Aplicar filtro';
    }
  }

  // Preparar cada imagen o video.
  function initializeCard(card) {
    const type = card.dataset.mediaType;
    const path = (card.dataset.src || '').trim();
    const preview = card.querySelector('[data-media-preview]');

    if (!preview || !['image', 'video'].includes(type)) {
      return;
    }

    const url = validSource(path, type);

    if (!url) {
      setPending(card);
      return;
    }

    // Mantener la ruta original para el editor.
    const editorPath = path;

    if (type === 'image') {
      const img = document.createElement('img');

      img.alt = card.querySelector('h3')?.textContent.trim()
        || 'Imagen de béisbol';

      img.loading = 'lazy';

      img.addEventListener('load', () => {
        if (img.naturalWidth > 0) {
          setAvailable(card, editorPath);
        } else {
          setPending(card);
        }
      });

      img.addEventListener('error', () => {
        setPending(card);
      });

      preview.replaceChildren(img);
      img.src = url.href;
      return;
    }

    const video = document.createElement('video');

    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';

    video.setAttribute(
      'aria-label',
      `Reproducir ${card.querySelector('h3')?.textContent.trim() || 'video'}`
    );

    let failed = false;

    function failVideo() {
      if (failed) return;
      failed = true;

      video.pause();
      video.removeAttribute('src');
      video.load();

      setPending(card);
    }

    video.addEventListener('loadedmetadata', () => {
      if (failed) return;

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setAvailable(card, editorPath);
      } else {
        failVideo();
      }
    });

    video.addEventListener('error', failVideo);

    video.addEventListener('play', () => {
      videos.forEach(other => {
        if (other !== video && !other.paused) {
          other.pause();
        }
      });
    });

    videos.push(video);

    preview.replaceChildren(video);
    video.src = url.href;
    video.load();
  }

  // Mostrar Todo, Imágenes o Videos.
  function filterCards(value) {
    chips.forEach(chip => {
      const active = chip.dataset.galleryFilter === value;

      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });

    cards.forEach(card => {
      const visible = value === 'all'
        || card.dataset.mediaType === value;

      card.hidden = !visible;

      if (!visible) {
        card.querySelector('video')?.pause();
      }
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const value = chip.dataset.galleryFilter;

      if (!['all', 'image', 'video'].includes(value)) {
        return;
      }

      filterCards(value);

      const messages = {
        all: 'Mostrando toda la galería',
        image: 'Mostrando imágenes',
        video: 'Mostrando videos'
      };

      window.StrikeZoneFeedback?.show(messages[value]);
    });
  });

  // Evitar navegación de enlaces deshabilitados.
  document.addEventListener('click', event => {
    const action = event.target.closest(
      '[data-media-edit][aria-disabled="true"]'
    );

    if (action) event.preventDefault();
  });

  cards.forEach(initializeCard);
  filterCards('all');
})();
