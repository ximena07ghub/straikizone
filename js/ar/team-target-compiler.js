const COMPILER_URL =
  'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js';


function createRequestId() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === 'function'
  ) {
    return window.crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2)
  );
}


function absoluteUrl(path) {
  return new URL(
    path,
    window.location.href
  ).href;
}


export function compileTeamTargets(
  targetImages,
  onProgress = () => {}
) {
  if (
    !Array.isArray(targetImages) ||
    !targetImages.length
  ) {
    return Promise.reject(
      new Error(
        'No hay logos para compilar.'
      )
    );
  }


  const requestId =
    createRequestId();


  const sources =
    targetImages.map(
      absoluteUrl
    );


  return new Promise(
    (
      resolve,
      reject
    ) => {
      const frame =
        document.createElement(
          'iframe'
        );


      frame.hidden =
        true;


      frame.setAttribute(
        'aria-hidden',
        'true'
      );


      /*
        El compiler vive en su propio window.

        Por ello TensorFlow/MindAR Compiler
        no registra kernels en la página
        donde después vive MindARThree.
      */
      frame.srcdoc = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">

  <script
    src="${COMPILER_URL}"
  ></script>
</head>

<body>

<script>
(() => {
  const send = (
    message,
    transfer = []
  ) => {
    window.parent.postMessage(
      message,
      '*',
      transfer
    );
  };


  function loadImage(src) {
    return new Promise(
      (resolve, reject) => {
        const image =
          new Image();

        image.onload =
          () => resolve(image);

        image.onerror =
          () => reject(
            new Error(
              'No se pudo cargar el target: ' +
              src
            )
          );

        image.src =
          src;
      }
    );
  }


  window.addEventListener(
    'message',

    async event => {
      const data =
        event.data;

      if (
        !data ||
        data.type !==
          'STRIKEZONE_COMPILE_TARGETS'
      ) {
        return;
      }


      const id =
        data.id;


      try {
        const Compiler =
          window.MINDAR?.Compiler ||
          window.MINDAR?.IMAGE?.Compiler;


        if (!Compiler) {
          throw new Error(
            'MindAR Compiler no está disponible.'
          );
        }


        const images =
          await Promise.all(
            data.sources.map(
              loadImage
            )
          );


        const compiler =
          new Compiler();


        await compiler.compileImageTargets(
          images,

          progress => {
            send({
              type:
                'STRIKEZONE_COMPILE_PROGRESS',

              id,

              progress
            });
          }
        );


        const exported =
          await compiler.exportData();


        let buffer;


        if (
          exported instanceof ArrayBuffer
        ) {
          buffer =
            exported;

        } else if (
          ArrayBuffer.isView(
            exported
          )
        ) {
          buffer =
            exported.buffer.slice(
              exported.byteOffset,

              exported.byteOffset +
              exported.byteLength
            );

        } else {
          throw new Error(
            'MindAR devolvió un target inválido.'
          );
        }


        send(
          {
            type:
              'STRIKEZONE_COMPILE_DONE',

            id,

            buffer
          },

          [buffer]
        );

      } catch (error) {
        send({
          type:
            'STRIKEZONE_COMPILE_ERROR',

          id,

          message:
            error?.message ||
            'No se pudo compilar el target.'
        });
      }
    }
  );


  send({
    type:
      'STRIKEZONE_COMPILER_READY'
  });
})();
</script>

</body>
</html>
      `;


      let settled =
        false;


      let timeoutId =
        null;


      function cleanup() {
        window.removeEventListener(
          'message',
          handleMessage
        );


        if (timeoutId) {
          clearTimeout(
            timeoutId
          );
        }


        frame.remove();
      }


      function finishError(
        error
      ) {
        if (settled) {
          return;
        }


        settled =
          true;


        cleanup();


        reject(
          error instanceof Error
            ? error
            : new Error(
                String(error)
              )
        );
      }


      function finishSuccess(
        buffer
      ) {
        if (settled) {
          return;
        }


        settled =
          true;


        cleanup();


        resolve(
          buffer
        );
      }


      function handleMessage(
        event
      ) {
        if (
          event.source !==
          frame.contentWindow
        ) {
          return;
        }


        const data =
          event.data;


        if (!data) {
          return;
        }


        if (
          data.type ===
          'STRIKEZONE_COMPILER_READY'
        ) {
          frame.contentWindow
            ?.postMessage(
              {
                type:
                  'STRIKEZONE_COMPILE_TARGETS',

                id:
                  requestId,

                sources
              },

              '*'
            );


          return;
        }


        if (
          data.id !==
          requestId
        ) {
          return;
        }


        if (
          data.type ===
          'STRIKEZONE_COMPILE_PROGRESS'
        ) {
          const raw =
            Number(
              data.progress
            );


          const value =
            Number.isFinite(raw)
              ? (
                  raw <= 1
                    ? raw * 100
                    : raw
                )
              : 0;


          onProgress(
            Math.max(
              0,

              Math.min(
                100,
                Math.round(value)
              )
            )
          );


          return;
        }


        if (
          data.type ===
          'STRIKEZONE_COMPILE_DONE'
        ) {
          finishSuccess(
            data.buffer
          );


          return;
        }


        if (
          data.type ===
          'STRIKEZONE_COMPILE_ERROR'
        ) {
          finishError(
            new Error(
              data.message ||
              'No se pudo compilar el logo AR.'
            )
          );
        }
      }


      window.addEventListener(
        'message',
        handleMessage
      );


      timeoutId =
        window.setTimeout(
          () => {
            finishError(
              new Error(
                'El compilador AR tardó demasiado.'
              )
            );
          },

          120000
        );


      document.body.appendChild(
        frame
      );
    }
  );
}