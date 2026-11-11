(() => {
  const container =
    document.querySelector(
      '#ar-container'
    );

  const button =
    document.querySelector(
      '[data-ar-capture]'
    );

  const message =
    document.querySelector(
      '[data-capture-message]'
    );

  const loginBox =
    document.querySelector(
      '[data-capture-login]'
    );

  const loginLink =
    document.querySelector(
      '[data-capture-login-link]'
    );

  const closeLogin =
    document.querySelector(
      '[data-capture-login-close]'
    );


  if (
    !container ||
    !button
  ) {
    return;
  }


  let saving = false;


  function notify(
    text,
    error = false
  ) {
    if (!message) {
      return;
    }

    message.textContent =
      text;

    message.hidden =
      false;

    message.classList.toggle(
      'is-error',
      error
    );

    clearTimeout(
      notify.timer
    );

    notify.timer =
      setTimeout(
        () => {
          message.hidden =
            true;
        },
        3500
      );
  }


  function validSession() {
    return (
      window
        .StrikeZoneRewards
        ?.session
        ?.() ||
      null
    );
  }


  function requestLogin() {
    if (!loginBox) {
      return;
    }

    if (loginLink) {
      loginLink.href =
        `login.html?next=${
          encodeURIComponent(
            'ar-equipo.html'
          )
        }`;
    }

    loginBox.hidden =
      false;
  }


  closeLogin?.addEventListener(
    'click',
    () => {
      if (loginBox) {
        loginBox.hidden =
          true;
      }
    }
  );


  /*
    Obtener exclusivamente el video real.
    El canvas AR ya no se busca manualmente:
    lo entrega team-viewer.js.
  */
  function getVideo() {
    return container.querySelector(
      'video'
    );
  }


  /*
    Tomar un frame WebGL fresco del viewer.

    Ese frame contiene:
    - modelo 3D
    - animación en su posición actual
    - confeti si está activo

    No contiene:
    - botones HTML
    - barra superior
    - panel Info
  */
  function getAROverlay() {
    return (
      window
        .STRIKEZONE_AR_CAPTURE
        ?.captureOverlay
        ?.() ||
      null
    );
  }


  function drawVideo(
    context,
    video,
    rect,
    baseRect,
    ratio
  ) {
    const videoWidth =
      video.videoWidth;

    const videoHeight =
      video.videoHeight;


    if (
      !videoWidth ||
      !videoHeight
    ) {
      throw new Error(
        'La cámara todavía no tiene imagen.'
      );
    }


    const destinationX =
      (
        rect.left -
        baseRect.left
      ) *
      ratio;

    const destinationY =
      (
        rect.top -
        baseRect.top
      ) *
      ratio;

    const destinationWidth =
      rect.width *
      ratio;

    const destinationHeight =
      rect.height *
      ratio;


    const scale =
      Math.max(
        destinationWidth /
          videoWidth,

        destinationHeight /
          videoHeight
      );


    const cropWidth =
      destinationWidth /
      scale;

    const cropHeight =
      destinationHeight /
      scale;


    const sourceX =
      (
        videoWidth -
        cropWidth
      ) / 2;

    const sourceY =
      (
        videoHeight -
        cropHeight
      ) / 2;


    context.drawImage(
      video,

      sourceX,
      sourceY,
      cropWidth,
      cropHeight,

      destinationX,
      destinationY,
      destinationWidth,
      destinationHeight
    );
  }


  function composeCapture() {
    const video =
      getVideo();

    const overlay =
      getAROverlay();


    if (
      !video ||
      video.readyState <
        HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      throw new Error(
        'La cámara todavía no está lista.'
      );
    }


    const arState =
      window
        .STRIKEZONE_TEAM_AR_STATE;


    if (
      !arState?.team ||
      !arState?.targetVisible
    ) {
      throw new Error(
        'Primero apunta al logo hasta que aparezca el modelo.'
      );
    }


    if (
      !overlay?.canvas ||
      !overlay?.rect
    ) {
      throw new Error(
        'No se pudo capturar el modelo 3D.'
      );
    }


    const bounds =
      container
        .getBoundingClientRect();

    const videoRect =
      video
        .getBoundingClientRect();

    const overlayRect =
      overlay.rect;


    if (
      !bounds.width ||
      !bounds.height ||
      !overlayRect.width ||
      !overlayRect.height
    ) {
      throw new Error(
        'No se pudo obtener el encuadre AR.'
      );
    }


    const ratio =
      Math.min(
        window.devicePixelRatio ||
          1,
        2
      );


    const canvas =
      document.createElement(
        'canvas'
      );


    canvas.width =
      Math.round(
        bounds.width *
        ratio
      );

    canvas.height =
      Math.round(
        bounds.height *
        ratio
      );


    const context =
      canvas.getContext(
        '2d',
        {
          alpha: false
        }
      );


    if (!context) {
      throw new Error(
        'No se pudo crear la fotografía.'
      );
    }


    /*
      1. Cámara real.
    */
    drawVideo(
      context,
      video,
      videoRect,
      bounds,
      ratio
    );


    /*
      2. Modelo 3D + efectos WebGL.
    */
    context.drawImage(
      overlay.canvas,

      (
        overlayRect.left -
        bounds.left
      ) *
      ratio,

      (
        overlayRect.top -
        bounds.top
      ) *
      ratio,

      overlayRect.width *
      ratio,

      overlayRect.height *
      ratio
    );


    return canvas;
  }


  function toBlob(canvas) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        canvas.toBlob(
          blob => {
            if (
              blob &&
              blob.size
            ) {
              resolve(
                blob
              );

            } else {
              reject(
                new Error(
                  'No se generó la imagen AR.'
                )
              );
            }
          },

          'image/png'
        );
      }
    );
  }


  async function capture() {
    if (saving) {
      return;
    }


    const session =
      validSession();


    if (!session?.id) {
      requestLogin();

      notify(
        'Inicia sesión para guardar capturas en Mis Medios.',
        true
      );

      return;
    }


    const arState =
      window
        .STRIKEZONE_TEAM_AR_STATE;


    if (
      !arState?.team ||
      !arState?.targetVisible
    ) {
      notify(
        'Primero enfoca el logo hasta que aparezca el modelo.',
        true
      );

      return;
    }


    if (
      !window
        .StrikeZonePhotos
        ?.add
    ) {
      notify(
        'El almacenamiento de fotografías no está disponible.',
        true
      );

      return;
    }


    saving = true;

    button.disabled =
      true;


    try {
      /*
        composeCapture solicita primero un
        render WebGL fresco.
      */
      const canvas =
        composeCapture();


      const blob =
        await toBlob(
          canvas
        );


      const team =
        arState.team;


      const metadata = {
        source:
          'team-ar',

        type:
          'image',

        ownerId:
          session.id,

        title:
          `AR · ${team.name}`,

        teamId:
          team.id,

        createdAt:
          Date.now()
      };


      const id =
        await window
          .StrikeZonePhotos
          .add(
            blob,
            'AR',
            metadata
          );


      if (id == null) {
        throw new Error(
          'IndexedDB no confirmó el guardado.'
        );
      }


      notify(
        `Foto de ${team.name} guardada en Mis Medios.`
      );

    } catch (error) {
      console.error(
        'Error al capturar Team AR:',
        error
      );


      notify(
        error?.message ||
        'No se pudo guardar la fotografía.',
        true
      );

    } finally {
      saving = false;

      button.disabled =
        false;
    }
  }


  button.addEventListener(
    'click',
    capture
  );
})();