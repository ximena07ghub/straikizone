/*
  ============================================================
  STRIKEZONE · TEAM TARGET COMPILER
  ============================================================

  Objetivo:

  Compilar las imágenes target de equipos en un iframe
  completamente separado del runtime AR principal.

  IMPORTANTE:

  - El compiler MindAR 1.1.4 vive únicamente dentro del iframe.
  - mindar-image-three 1.2.5 vive únicamente en ar-equipo.html.
  - No comparten window.
  - No comparten registro TensorFlow.
  - No comparten backend WebGL.
  - Solo intercambian un ArrayBuffer ya compilado.

  Al finalizar:
  - se elimina el iframe;
  - se eliminan listeners;
  - se elimina el timeout;
  - no queda una segunda instancia MindAR viva.
*/


const COMPILER_URL =
  'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.1.4/dist/mindar-image.prod.js';


const COMPILER_TIMEOUT =
  120000;


/*
  Generar un identificador único para que
  una respuesta vieja de otro iframe nunca
  pueda confundirse con la compilación actual.
*/
function createRequestId() {
  if (
    window.crypto &&
    typeof window.crypto.randomUUID === 'function'
  ) {
    return window.crypto.randomUUID();
  }


  return (
    `strikezone-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2)
  );
}


/*
  Convertir cualquier ruta relativa:

  assets/ar/teams/target/sultanes.jpg

  a una URL absoluta:

  https://strikizone.netlify.app/assets/...
*/
function toAbsoluteUrl(path) {
  return new URL(
    path,
    window.location.href
  ).href;
}


/*
  Validar que realmente recibimos un ArrayBuffer.

  postMessage puede mantener ArrayBuffer directamente,
  pero dejamos esta función para evitar aceptar
  valores corruptos.
*/
function normalizeBuffer(value) {
  if (
    value instanceof ArrayBuffer
  ) {
    return value;
  }


  if (
    ArrayBuffer.isView(
      value
    )
  ) {
    return value.buffer.slice(
      value.byteOffset,

      value.byteOffset +
      value.byteLength
    );
  }


  return null;
}


/*
  ============================================================
  API PÚBLICA
  ============================================================
*/

export function compileTeamTargets(
  targetImages,
  onProgress = () => {}
) {
  /*
    Validación inicial.
  */
  if (
    !Array.isArray(
      targetImages
    ) ||
    targetImages.length === 0
  ) {
    return Promise.reject(
      new Error(
        'No hay logos configurados para compilar.'
      )
    );
  }


  const sources =
    targetImages.map(
      toAbsoluteUrl
    );


  const requestId =
    createRequestId();


  return new Promise(
    (
      resolve,
      reject
    ) => {
      /*
        ======================================================
        CREAR IFRAME AISLADO
        ======================================================
      */

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


      frame.setAttribute(
        'tabindex',
        '-1'
      );


      /*
        No usamos sandbox.

        Un srcdoc normal mantiene un contexto window
        separado, pero puede cargar las imágenes del
        mismo sitio sin complicaciones adicionales
        de CORS.
      */


      let settled =
        false;


      let timeoutId =
        null;


      /*
        ======================================================
        LIMPIEZA
        ======================================================
      */

      function cleanup() {
        window.removeEventListener(
          'message',
          handleMessage
        );


        if (timeoutId) {
          window.clearTimeout(
            timeoutId
          );

          timeoutId =
            null;
        }


        try {
          frame.src =
            'about:blank';

        } catch {
          // No bloquear limpieza.
        }


        frame.remove();
      }


      /*
        ======================================================
        ERROR
        ======================================================
      */

      function fail(error) {
        if (settled) {
          return;
        }


        settled =
          true;


        cleanup();


        if (
          error instanceof Error
        ) {
          reject(
            error
          );


          return;
        }


        reject(
          new Error(
            String(error)
          )
        );
      }


      /*
        ======================================================
        ÉXITO
        ======================================================
      */

      function succeed(buffer) {
        if (settled) {
          return;
        }


        const normalized =
          normalizeBuffer(
            buffer
          );


        if (!normalized) {
          fail(
            new Error(
              'MindAR terminó la compilación, pero no devolvió datos válidos.'
            )
          );


          return;
        }


        settled =
          true;


        cleanup();


        resolve(
          normalized
        );
      }


      /*
        ======================================================
        MENSAJES DEL IFRAME
        ======================================================
      */

      function handleMessage(
        event
      ) {
        /*
          Solo aceptar mensajes provenientes
          del iframe que nosotros creamos.
        */
        if (
          event.source !==
          frame.contentWindow
        ) {
          return;
        }


        const data =
          event.data;


        if (
          !data ||
          typeof data !== 'object'
        ) {
          return;
        }


        /*
          El script externo cargó correctamente
          y encontró el Compiler.
        */
        if (
          data.type ===
          'STRIKEZONE_COMPILER_READY'
        ) {
          frame.contentWindow
            ?.postMessage(
              {
                type:
                  'STRIKEZONE_COMPILE_TARGETS',

                requestId,

                sources
              },

              '*'
            );


          return;
        }


        /*
          El CDN no pudo cargarse.
        */
        if (
          data.type ===
          'STRIKEZONE_COMPILER_SCRIPT_ERROR'
        ) {
          fail(
            new Error(
              data.message ||
              'No se pudo descargar MindAR Compiler.'
            )
          );


          return;
        }


        /*
          El archivo JS cargó, pero no expuso
          el Compiler esperado.
        */
        if (
          data.type ===
          'STRIKEZONE_COMPILER_API_ERROR'
        ) {
          fail(
            new Error(
              data.message ||
              'MindAR Compiler cargó, pero su API no está disponible.'
            )
          );


          return;
        }


        /*
          A partir de aquí cada mensaje debe
          pertenecer a nuestra compilación.
        */
        if (
          data.requestId !==
          requestId
        ) {
          return;
        }


        /*
          Progreso.
        */
        if (
          data.type ===
          'STRIKEZONE_COMPILE_PROGRESS'
        ) {
          const raw =
            Number(
              data.progress
            );


          let percentage =
            0;


          if (
            Number.isFinite(
              raw
            )
          ) {
            percentage =
              raw <= 1
                ? raw * 100
                : raw;
          }


          percentage =
            Math.max(
              0,

              Math.min(
                100,

                Math.round(
                  percentage
                )
              )
            );


          try {
            onProgress(
              percentage
            );

          } catch {
            /*
              Un error visual del callback de progreso
              no debe cancelar la compilación.
            */
          }


          return;
        }


        /*
          Target compilado correctamente.
        */
        if (
          data.type ===
          'STRIKEZONE_COMPILE_DONE'
        ) {
          succeed(
            data.buffer
          );


          return;
        }


        /*
          Error real del compiler.
        */
        if (
          data.type ===
          'STRIKEZONE_COMPILE_ERROR'
        ) {
          fail(
            new Error(
              data.message ||
              'MindAR no pudo compilar el logo.'
            )
          );
        }
      }


      window.addEventListener(
        'message',
        handleMessage
      );


      /*
        ======================================================
        TIMEOUT GENERAL
        ======================================================
      */

      timeoutId =
        window.setTimeout(
          () => {
            fail(
              new Error(
                'MindAR Compiler tardó demasiado en responder. Revisa la conexión y vuelve a intentarlo.'
              )
            );
          },

          COMPILER_TIMEOUT
        );


      /*
        ======================================================
        CONTENIDO AISLADO
        ======================================================

        Importante:

        NO escribimos:

          <script src="..."></script>

        y después asumimos que MINDAR existe.

        Creamos el script manualmente para distinguir:

        1. CDN no cargó.
        2. CDN cargó pero API no existe.
        3. Compiler funciona.
      */

      frame.srcdoc = `
<!doctype html>

<html lang="es">

<head>

  <meta charset="utf-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <title>
    StrikeZone AR Compiler
  </title>

</head>


<body>

<script>
(() => {

  /*
    ==========================================================
    COMUNICACIÓN
    ==========================================================
  */

  function send(
    message,
    transfer
  ) {
    try {
      window.parent.postMessage(
        message,
        '*',
        transfer || []
      );

    } catch (error) {
      /*
        Si falla la transferencia directa,
        intentamos sin transfer list.
      */
      try {
        window.parent.postMessage(
          message,
          '*'
        );

      } catch {
        // Ya no hay nada más que hacer.
      }
    }
  }


  /*
    ==========================================================
    CARGAR IMAGEN
    ==========================================================
  */

  function loadImage(src) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const image =
          new Image();


        image.decoding =
          'async';


        image.onload =
          () => {
            resolve(
              image
            );
          };


        image.onerror =
          () => {
            reject(
              new Error(
                'No se pudo cargar el logo AR: ' +
                src
              )
            );
          };


        image.src =
          src;
      }
    );
  }


  /*
    ==========================================================
    OBTENER COMPILER
    ==========================================================
  */

  function getCompilerClass() {
    /*
      1.1.4 puede exponerlo en alguno
      de estos dos espacios.
    */

    if (
      window.MINDAR &&
      typeof window.MINDAR.Compiler ===
        'function'
    ) {
      return window.MINDAR.Compiler;
    }


    if (
      window.MINDAR &&
      window.MINDAR.IMAGE &&
      typeof window.MINDAR.IMAGE.Compiler ===
        'function'
    ) {
      return window.MINDAR.IMAGE.Compiler;
    }


    return null;
  }


  /*
    ==========================================================
    COMPILAR
    ==========================================================
  */

  async function compile(
    requestId,
    sources
  ) {
    try {
      const Compiler =
        getCompilerClass();


      if (!Compiler) {
        send({
          type:
            'STRIKEZONE_COMPILER_API_ERROR',

          message:
            'El script de MindAR cargó, pero no expuso MINDAR.Compiler ni MINDAR.IMAGE.Compiler.'
        });


        return;
      }


      /*
        Descargar las imágenes del sitio.
      */
      const images =
        await Promise.all(
          sources.map(
            loadImage
          )
        );


      /*
        Una sola instancia del compiler
        dentro de este iframe.
      */
      const compiler =
        new Compiler();


      await compiler.compileImageTargets(
        images,

        progress => {
          send({
            type:
              'STRIKEZONE_COMPILE_PROGRESS',

            requestId,

            progress
          });
        }
      );


      const exported =
        await compiler.exportData();


      let buffer =
        null;


      if (
        exported instanceof
          ArrayBuffer
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
      }


      if (!buffer) {
        throw new Error(
          'MindAR exportData() no devolvió un ArrayBuffer válido.'
        );
      }


      /*
        Transferimos el ownership del buffer.

        Después de esto, el iframe puede desaparecer.
      */
      send(
        {
          type:
            'STRIKEZONE_COMPILE_DONE',

          requestId,

          buffer
        },

        [
          buffer
        ]
      );

    } catch (error) {
      send({
        type:
          'STRIKEZONE_COMPILE_ERROR',

        requestId,

        message:
          error &&
          error.message
            ? error.message
            : 'Error desconocido compilando el logo AR.'
      });
    }
  }


  /*
    ==========================================================
    RECIBIR SOLICITUD DEL PADRE
    ==========================================================
  */

  window.addEventListener(
    'message',

    event => {
      const data =
        event.data;


      if (
        !data ||
        data.type !==
          'STRIKEZONE_COMPILE_TARGETS'
      ) {
        return;
      }


      if (
        !Array.isArray(
          data.sources
        ) ||
        data.sources.length === 0
      ) {
        send({
          type:
            'STRIKEZONE_COMPILE_ERROR',

          requestId:
            data.requestId,

          message:
            'No se recibieron imágenes target para compilar.'
        });


        return;
      }


      void compile(
        data.requestId,
        data.sources
      );
    }
  );


  /*
    ==========================================================
    CARGAR MINDAR COMPILER
    ==========================================================
  */

  const compilerScript =
    document.createElement(
      'script'
    );


  compilerScript.src =
    ${JSON.stringify(COMPILER_URL)};


  compilerScript.async =
    false;


  /*
    CDN cargado.
  */
  compilerScript.onload =
    () => {
      const Compiler =
        getCompilerClass();


      if (!Compiler) {
        send({
          type:
            'STRIKEZONE_COMPILER_API_ERROR',

          message:
            'MindAR Compiler se descargó correctamente, pero la versión cargada no expone la API Compiler esperada.'
        });


        return;
      }


      send({
        type:
          'STRIKEZONE_COMPILER_READY'
      });
    };


  /*
    CDN falló.
  */
  compilerScript.onerror =
    () => {
      send({
        type:
          'STRIKEZONE_COMPILER_SCRIPT_ERROR',

        message:
          'No se pudo descargar MindAR Compiler desde jsDelivr.'
      });
    };


  document.head.appendChild(
    compilerScript
  );

})();
<\/script>

</body>

</html>
      `;


      /*
        Finalmente montar el iframe.
      */
      document.body.appendChild(
        frame
      );
    }
  );
}