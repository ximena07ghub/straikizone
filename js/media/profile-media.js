
(async () => {
  const grid = document.querySelector('[data-media-grid]');
  const empty = document.querySelector('[data-empty-media]');
  const count = document.querySelector('[data-media-count]');

  if (!grid) return;

  const photos = window.StrikeZonePhotos;

  const urls = [];

  function escape(value) {
    return String(value ?? '').replace(
      /[&<>"']/g,
      char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]
    );
  }

  // Evitar referencias de imágenes acumuladas.
  function releaseUrls() {
    urls.forEach(url => URL.revokeObjectURL(url));
    urls.length = 0;
  }

  function showError(text) {
    if (empty) {
      empty.hidden = false;
      empty.textContent = text;
    }
  }

  function fileExtension(item) {
    const type = item.blob?.type || '';

    if (type === 'image/png') return 'png';
    if (type === 'image/webp') return 'webp';
    if (type === 'video/mp4') return 'mp4';
    if (type.startsWith('video/')) return 'webm';

    return 'jpg';
  }

  // Mostrar solamente los medios propios.
  async function render() {
    releaseUrls();
    grid.replaceChildren();

    try {
      const items = await photos.all();

      if (count) {
        count.textContent =
          `${items.length} ${
            items.length === 1 ? 'elemento' : 'elementos'
          }`;
      }

      if (empty) {
        empty.hidden = items.length > 0;
      }

      for (const item of items) {
        const type = item.type ||
          (item.blob?.type?.startsWith('video')
            ? 'video'
            : 'image');

        const url = URL.createObjectURL(item.blob);
        urls.push(url);

        const card = document.createElement('article');
        card.className = 'saved-card';

        const preview = type === 'video'
          ? `
            <video controls playsinline
                   src="${escape(url)}"></video>
          `
          : `
            <img src="${escape(url)}"
                 alt="${escape(item.title || 'Captura StrikeZone')}">
          `;

        card.innerHTML = `
          <div class="saved-preview">
            ${preview}
          </div>

          <div class="saved-body">
            <strong>${escape(item.title || 'StrikeZone')}</strong>

            <small>
              ${escape(item.filter || 'Original')} ·
              ${new Date(item.createdAt).toLocaleDateString('es-MX')}
            </small>

            <div class="saved-actions">
              <button class="button" type="button"
                      data-download>
                Descargar
              </button>

              <button class="button" type="button"
                      data-delete>
                Eliminar
              </button>
            </div>
          </div>
        `;

        card.querySelector('[data-download]').addEventListener(
          'click',
          () => {
            const link = document.createElement('a');
            link.href = url;
            link.download =
              `strikezone-${item.id}.${fileExtension(item)}`;

            document.body.appendChild(link);
            link.click();
            link.remove();
          }
        );

        card.querySelector('[data-delete]').addEventListener(
          'click',
          async event => {
            const button = event.currentTarget;
            button.disabled = true;

            try {
              const removed = await photos.remove(item.id);

              if (!removed) {
                throw new Error(
                  'No se confirmó la eliminación.'
                );
              }

              await render();

              window.StrikeZoneFeedback?.show(
                'Elemento eliminado.'
              );

            } catch (error) {
              console.error('Error al eliminar medio:', error);

              button.disabled = false;

              showError(
                'No se pudo eliminar el archivo. Inténtalo nuevamente.'
              );
            }
          }
        );

        grid.appendChild(card);
      }

    } catch (error) {
      console.error('Error de Mis Medios:', error);

      if (count) count.textContent = 'No disponible';

      showError(
        'No se pudieron consultar tus medios. Comprueba tu sesión y el almacenamiento.'
      );
    }
  }

  window.addEventListener('pagehide', releaseUrls);

  await render();
})();
