import * as THREE from 'three';

import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import {
  MindARThree
} from 'mindar-image-three';


const cards =
  window.STRIKEZONE_AR_CARDS ||
  {};

const modelCatalog =
  window.STRIKEZONE_AR_MODELS ||
  {};


const params =
  new URLSearchParams(
    location.search
  );


const requestedId =
  (
    params.get('card') ||
    ''
  )
    .trim()
    .toLowerCase();


const requestedModelKey =
  (
    params.get('model') ||
    ''
  )
    .trim()
    .toLowerCase();


const modelEntry =
  !requestedId &&
  requestedModelKey
    ? modelCatalog[
        requestedModelKey
      ]
    : null;


const baseCard =
  (
    requestedId &&
    cards[requestedId]
  ) ||
  modelEntry?.card ||
  null;


const modelMode =
  Boolean(
    modelEntry &&
    !requestedId
  );


const card =
  baseCard &&
  modelMode
    ? {
        ...baseCard,

        name:
          `Modelo 3D · ${modelEntry.title}`,

        category:
          'STRIKEZONE · MODELO AR',

        team:
          'Marcador QR por modelo',

        stats: [],

        bio:
          `Este marcador abre el modelo ${modelEntry.title}. El objeto 3D permanece visible mientras la cámara detecte el QR completo.`,

        model:
          modelEntry.model,

        modelKey:
          modelEntry.key,

        modelLabel:
          modelEntry.modelLabel,

        targetImage:
          modelEntry.targetImage,

        markerImage:
          modelEntry.markerImage,

        qr:
          modelEntry.qr
      }

    : baseCard;


/*
  ==========================================================
  VALIDACIÓN
  ==========================================================
*/

if (!card) {
  document.title =
    'StrikeZone | Carta AR';


  const missingId =
    requestedId ||
    requestedModelKey ||
    'sin-identificador';


  document
    .querySelector(
      '[data-ar-name]'
    )
    ?.replaceChildren(
      document.createTextNode(
        'Carta o modelo no disponible'
      )
    );


  document
    .querySelector(
      '[data-start-title]'
    )
    ?.replaceChildren(
      document.createTextNode(
        'Carta o modelo no disponible'
      )
    );


  document
    .querySelector(
      '[data-ar-category]'
    )
    ?.replaceChildren(
      document.createTextNode(
        'STRIKEZONE'
      )
    );


  const error =
    document.querySelector(
      '[data-ar-error]'
    );

  const errorText =
    document.querySelector(
      '[data-ar-error-text]'
    );


  if (errorText) {
    errorText.textContent =
      `No existe una configuración AR para la carta o modelo "${missingId}".`;
  }


  if (error) {
    error.hidden =
      false;
  }


  throw new Error(
    `AR no configurado: ${missingId}`
  );
}


/*
  ==========================================================
  DOM
  ==========================================================
*/

const container =
  document.querySelector(
    '#ar-container'
  );

const startPanel =
  document.querySelector(
    '[data-ar-start-panel]'
  );

const startBtn =
  document.querySelector(
    '[data-ar-start]'
  );

const retryBtn =
  document.querySelector(
    '[data-ar-retry]'
  );

const statusEl =
  document.querySelector(
    '[data-ar-status]'
  );

const helpEl =
  document.querySelector(
    '[data-ar-help]'
  );

const controlsEl =
  document.querySelector(
    '[data-ar-controls]'
  );

const gestureTip =
  document.querySelector(
    '[data-gesture-tip]'
  );

const errorEl =
  document.querySelector(
    '[data-ar-error]'
  );

const errorText =
  document.querySelector(
    '[data-ar-error-text]'
  );

const jumpBtn =
  document.querySelector(
    '[data-jump]'
  );

const confettiBtn =
  document.querySelector(
    '[data-confetti]'
  );

const spinBtn =
  document.querySelector(
    '[data-spin]'
  );

const resetBtn =
  document.querySelector(
    '[data-reset]'
  );

const infoBtn =
  document.querySelector(
    '[data-info]'
  );

const infoPanel =
  document.querySelector(
    '[data-info-panel]'
  );

const infoClose =
  document.querySelector(
    '[data-info-close]'
  );


/*
  ==========================================================
  ESTADO THREE / AR
  ==========================================================
*/

let mindarThree =
  null;

let renderer =
  null;

let scene =
  null;

let camera =
  null;

let anchor =
  null;

let root =
  null;

let modelPivot =
  null;

let mixer =
  null;

let embeddedAction =
  null;

const clock =
  new THREE.Clock();

let confettiGroup =
  null;

let compiledBlobUrl =
  '';

let started =
  false;

let targetVisible =
  false;

let jumping =
  false;

let jumpStart =
  0;

let spinning =
  false;

let spinStart =
  0;

let confettiOn =
  false;

let baseScale =
  1;


const pointers =
  new Map();

let lastSingle =
  null;

let lastPinchDistance =
  0;

let lastPinchCenter =
  null;

let tapCandidate =
  null;

let userScale =
  1;

let userRotX =
  0;

let userRotY =
  0;

let userPosX =
  0;

let userPosY =
  0;


const jumpDirection =
  new THREE.Vector3(
    0,
    1,
    0
  );


/*
  ==========================================================
  TEXTOS
  ==========================================================
*/

function setText(
  selector,
  text
) {
  const element =
    document.querySelector(
      selector
    );

  if (element) {
    element.textContent =
      text;
  }
}


setText(
  '[data-ar-name]',
  card.name
);

setText(
  '[data-start-title]',
  card.name
);

setText(
  '[data-ar-category]',
  card.category
);

setText(
  '[data-model-label]',
  card.modelLabel
);

setText(
  '[data-target-side]',
  card.targetSide ||
    'reverso'
);


const preview =
  document.querySelector(
    '[data-target-preview]'
  );


if (preview) {
  preview.src =
    card.targetImage ||
    card.markerImage;

  preview.alt =
    `Marcador QR del modelo ${
      card.modelLabel ||
      card.name
    }`;
}


const printLink =
  document.querySelector(
    '[data-print-link]'
  );


if (printLink) {
  printLink.href =
    `tarjeta-provisional.html?card=${
      encodeURIComponent(
        card.id
      )
    }`;

  printLink.hidden =
    modelMode;
}


document.title =
  `StrikeZone | ${card.name} AR`;


setText(
  '[data-info-title]',
  card.name
);


setText(
  '[data-info-copy]',
  card.bio ||
  'Información de la carta.'
);


const infoStats =
  document.querySelector(
    '[data-info-stats]'
  );


if (infoStats) {
  infoStats.innerHTML =
    (
      card.stats ||
      []
    )
      .map(
        ([key, value]) =>
          `<div><span>${key}</span><b>${value}</b></div>`
      )
      .join('');
}


/*
  ==========================================================
  UI
  ==========================================================
*/

infoBtn?.addEventListener(
  'click',
  () => {
    if (infoPanel) {
      infoPanel.hidden =
        !infoPanel.hidden;
    }
  }
);


infoClose?.addEventListener(
  'click',
  () => {
    if (infoPanel) {
      infoPanel.hidden =
        true;
    }
  }
);


function status(message) {
  if (statusEl) {
    statusEl.textContent =
      message;
  }
}


function showError(message) {
  if (errorText) {
    errorText.textContent =
      message;
  }

  if (errorEl) {
    errorEl.hidden =
      false;
  }

  status(
    'AR no disponible'
  );
}


function hideError() {
  if (errorEl) {
    errorEl.hidden =
      true;
  }
}


/*
  ==========================================================
  TARGET
  ==========================================================
*/

function loadImageElement(src) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image();

      image.onload =
        () => resolve(
          image
        );

      image.onerror =
        () => {
          reject(
            new Error(
              'No se pudo cargar la imagen de la tarjeta para AR.'
            )
          );
        };

      image.src =
        src;
    }
  );
}


async function prepareTarget() {
  if (card.mindFile) {
    status(
      'Cargando marcador QR del modelo…'
    );

    return card.mindFile;
  }


  if (
    !card.compileTarget ||
    !card.targetImage
  ) {
    throw new Error(
      'Falta configurar el marcador AR de esta tarjeta.'
    );
  }


  const Compiler =
    window.MINDAR?.Compiler ||
    window.MINDAR?.IMAGE?.Compiler;


  if (!Compiler) {
    throw new Error(
      'No cargó el compilador de la tarjeta AR. Actualiza la página y vuelve a intentar con conexión a internet.'
    );
  }


  status(
    'Preparando reconocimiento del QR… 0%'
  );


  const image =
    await loadImageElement(
      card.targetImage
    );


  const compiler =
    new Compiler();


  await compiler.compileImageTargets(
    [image],

    progress => {
      const value =
        Number(progress);

      const percentage =
        Number.isFinite(value)
          ? Math.round(
              value <= 1
                ? value * 100
                : value
            )
          : 0;

      status(
        `Preparando reconocimiento del QR… ${
          Math.max(
            0,
            Math.min(
              100,
              percentage
            )
          )
        }%`
      );
    }
  );


  const buffer =
    await compiler.exportData();


  if (compiledBlobUrl) {
    URL.revokeObjectURL(
      compiledBlobUrl
    );
  }


  compiledBlobUrl =
    URL.createObjectURL(
      new Blob(
        [buffer],
        {
          type:
            'application/octet-stream'
        }
      )
    );


  status(
    'Tarjeta preparada ✓'
  );


  return compiledBlobUrl;
}


/*
  ==========================================================
  CONFETI
  ==========================================================
*/

function createConfetti() {
  const group =
    new THREE.Group();


  const palette = [
    0xe7d55a,
    0xf7f4e8,
    0x4d8d56,
    0xc94a43,
    0x77a6d8
  ];


  const geometry =
    new THREE.BoxGeometry(
      0.028,
      0.012,
      0.006
    );


  for (
    let index = 0;
    index < 54;
    index += 1
  ) {
    const material =
      new THREE.MeshStandardMaterial({
        color:
          palette[
            index %
            palette.length
          ],

        roughness:
          0.72,

        metalness:
          0.05
      });


    const piece =
      new THREE.Mesh(
        geometry,
        material
      );


    piece.userData.x =
      (
        Math.random() -
        0.5
      ) *
      0.9;


    piece.userData.z =
      0.12 +
      Math.random() *
      0.52;


    piece.userData.speed =
      0.22 +
      Math.random() *
      0.36;


    piece.userData.phase =
      Math.random() *
      1.2;


    piece.userData.spin =
      (
        Math.random() -
        0.5
      ) *
      5;


    group.add(
      piece
    );
  }


  group.visible =
    false;


  return group;
}


/*
  ==========================================================
  MODELO
  ==========================================================
*/

async function loadModel() {
  status(
    `Cargando ${
      card.modelLabel ||
      'modelo 3D'
    }…`
  );


  const loader =
    new GLTFLoader();


  const gltf =
    await loader.loadAsync(
      card.model
    );


  modelPivot =
    new THREE.Group();


  const visual =
    gltf.scene;


  const box =
    new THREE.Box3()
      .setFromObject(
        visual
      );


  const center =
    box.getCenter(
      new THREE.Vector3()
    );


  const size =
    box.getSize(
      new THREE.Vector3()
    );


  const maxDimension =
    Math.max(
      size.x,
      size.y,
      size.z
    ) || 1;


  visual.position.sub(
    center
  );


  baseScale =
    (
      card.modelScale ||
      0.46
    ) /
    maxDimension;


  modelPivot
    .scale
    .setScalar(
      baseScale
    );


  modelPivot.add(
    visual
  );


  root.add(
    modelPivot
  );


  if (
    gltf.animations &&
    gltf.animations.length
  ) {
    mixer =
      new THREE.AnimationMixer(
        visual
      );


    embeddedAction =
      mixer.clipAction(
        gltf.animations[0]
      );


    embeddedAction.setLoop(
      THREE.LoopOnce,
      1
    );


    embeddedAction.clampWhenFinished =
      true;
  }
}


/*
  ==========================================================
  TRANSFORMACIONES
  ==========================================================
*/

function resetTransform() {
  userScale = 1;

  userRotX = 0;
  userRotY = 0;

  userPosX = 0;
  userPosY = 0;

  jumping = false;
  spinning = false;


  if (root) {
    root.position.set(
      0,
      0,
      card.baseZ ??
        0.20
    );

    root.rotation.set(
      0,
      0,
      0
    );
  }


  if (modelPivot) {
    modelPivot.rotation.set(
      0,
      0,
      0
    );

    modelPivot
      .scale
      .setScalar(
        baseScale
      );
  }
}


function applyUserTransform() {
  if (
    root &&
    !jumping
  ) {
    root.position.x =
      userPosX;

    root.position.y =
      userPosY;

    root.position.z =
      card.baseZ ??
      0.20;
  }


  if (!modelPivot) {
    return;
  }


  modelPivot.rotation.x =
    userRotX;

  modelPivot.rotation.y =
    userRotY;


  modelPivot
    .scale
    .setScalar(
      baseScale *
      userScale
    );
}


/*
  ==========================================================
  ANIMACIONES
  ==========================================================
*/

function startJump() {
  if (
    !root ||
    !targetVisible ||
    jumping
  ) {
    return;
  }


  jumpDirection.set(
    0,
    1,
    0
  );


  jumping =
    true;


  jumpStart =
    performance.now();


  if (embeddedAction) {
    embeddedAction.reset();
    embeddedAction.play();
  }
}


function startSpin() {
  if (
    !modelPivot ||
    !targetVisible
  ) {
    return;
  }


  spinning =
    true;


  spinStart =
    performance.now();
}


function toggleConfetti() {
  confettiOn =
    !confettiOn;


  if (confettiGroup) {
    confettiGroup.visible =
      confettiOn;
  }


  confettiBtn?.setAttribute(
    'aria-pressed',
    String(
      confettiOn
    )
  );


  if (confettiBtn) {
    confettiBtn.innerHTML =
      `<span>✦</span>Efectos ${
        confettiOn
          ? 'ON'
          : 'OFF'
      }`;
  }
}


function updateAnimations(
  now,
  delta
) {
  mixer?.update(
    delta
  );


  if (
    jumping &&
    root
  ) {
    const progress =
      Math.min(
        1,
        (
          now -
          jumpStart
        ) / 760
      );


    const arc =
      Math.sin(
        Math.PI *
        progress
      );


    const jumpHeight =
      0.34;


    root.position
      .set(
        userPosX,
        userPosY,
        card.baseZ ??
          0.20
      )
      .addScaledVector(
        jumpDirection,
        arc *
        jumpHeight
      );


    if (
      progress >= 1
    ) {
      jumping =
        false;

      applyUserTransform();
    }
  }


  if (
    spinning &&
    modelPivot
  ) {
    const progress =
      Math.min(
        1,
        (
          now -
          spinStart
        ) / 1500
      );


    const eased =
      1 -
      Math.pow(
        1 -
        progress,
        3
      );


    modelPivot.rotation.y =
      userRotY +
      Math.PI *
      2 *
      eased;


    if (
      progress >= 1
    ) {
      spinning =
        false;

      applyUserTransform();
    }
  }


  if (
    confettiGroup?.visible
  ) {
    const time =
      now /
      1000;


    confettiGroup
      .children
      .forEach(
        (
          piece,
          index
        ) => {
          const data =
            piece.userData;


          const cycle =
            (
              data.phase +
              time *
              data.speed
            ) %
            1.25;


          piece.position.set(
            data.x,

            0.62 -
              cycle,

            data.z +
              Math.sin(
                time *
                1.6 +
                index
              ) *
              0.035
          );


          piece.rotation.x =
            time *
            (
              1.1 +
              data.speed *
              2
            );


          piece.rotation.y =
            time *
            data.spin;


          piece.rotation.z =
            time *
            (
              0.7 +
              data.speed
            );
        }
      );
  }
}


/*
  ==========================================================
  GESTOS
  ==========================================================
*/

function attachGestures() {
  const centerOfPointers =
    () => {
      const points =
        [...pointers.values()];


      if (!points.length) {
        return null;
      }


      return {
        x:
          points.reduce(
            (
              total,
              point
            ) =>
              total +
              point.x,
            0
          ) /
          points.length,

        y:
          points.reduce(
            (
              total,
              point
            ) =>
              total +
              point.y,
            0
          ) /
          points.length
      };
    };


  container.addEventListener(
    'pointerdown',
    event => {
      if (
        event.target.closest(
          '.ar-controls, .ar-topbar, .ar-start, .ar-error, .ar-info-panel, .ar-capture-login'
        )
      ) {
        return;
      }


      container
        .setPointerCapture
        ?.(
          event.pointerId
        );


      pointers.set(
        event.pointerId,
        {
          x:
            event.clientX,

          y:
            event.clientY
        }
      );


      if (
        pointers.size === 1
      ) {
        lastSingle = {
          x:
            event.clientX,

          y:
            event.clientY
        };


        tapCandidate = {
          id:
            event.pointerId,

          x:
            event.clientX,

          y:
            event.clientY,

          t:
            performance.now(),

          moved:
            false
        };
      }


      if (
        pointers.size === 2
      ) {
        tapCandidate =
          null;


        const points =
          [...pointers.values()];


        lastPinchDistance =
          Math.hypot(
            points[0].x -
              points[1].x,

            points[0].y -
              points[1].y
          );


        lastPinchCenter =
          centerOfPointers();
      }
    }
  );


  container.addEventListener(
    'pointermove',
    event => {
      if (
        !pointers.has(
          event.pointerId
        ) ||
        !targetVisible
      ) {
        return;
      }


      pointers.set(
        event.pointerId,
        {
          x:
            event.clientX,

          y:
            event.clientY
        }
      );


      if (
        tapCandidate &&
        tapCandidate.id ===
          event.pointerId &&
        Math.hypot(
          event.clientX -
            tapCandidate.x,

          event.clientY -
            tapCandidate.y
        ) > 8
      ) {
        tapCandidate.moved =
          true;
      }


      if (
        pointers.size === 1 &&
        lastSingle
      ) {
        const dx =
          event.clientX -
          lastSingle.x;


        const dy =
          event.clientY -
          lastSingle.y;


        userRotY +=
          dx *
          0.009;


        userRotX =
          Math.max(
            -1.05,
            Math.min(
              1.05,
              userRotX +
                dy *
                0.007
            )
          );


        lastSingle = {
          x:
            event.clientX,

          y:
            event.clientY
        };


        applyUserTransform();


      } else if (
        pointers.size === 2
      ) {
        const points =
          [...pointers.values()];


        const distance =
          Math.hypot(
            points[0].x -
              points[1].x,

            points[0].y -
              points[1].y
          );


        const center =
          centerOfPointers();


        if (
          lastPinchDistance >
          0
        ) {
          userScale =
            Math.max(
              0.38,
              Math.min(
                2.5,

                userScale *
                  (
                    distance /
                    lastPinchDistance
                  )
              )
            );
        }


        if (
          lastPinchCenter &&
          center
        ) {
          userPosX =
            Math.max(
              -0.65,
              Math.min(
                0.65,

                userPosX +
                  (
                    center.x -
                    lastPinchCenter.x
                  ) *
                  0.0028
              )
            );


          userPosY =
            Math.max(
              -0.70,
              Math.min(
                0.70,

                userPosY -
                  (
                    center.y -
                    lastPinchCenter.y
                  ) *
                  0.0028
              )
            );
        }


        lastPinchDistance =
          distance;


        lastPinchCenter =
          center;


        applyUserTransform();
      }
    }
  );


  const end =
    event => {
      const doTap =
        tapCandidate &&
        tapCandidate.id ===
          event.pointerId &&
        !tapCandidate.moved &&
        (
          performance.now() -
          tapCandidate.t
        ) < 360 &&
        targetVisible;


      pointers.delete(
        event.pointerId
      );


      lastSingle =
        pointers.size === 1
          ? [...pointers.values()][0]
          : null;


      if (
        pointers.size < 2
      ) {
        lastPinchDistance = 0;
        lastPinchCenter = null;
      }


      if (doTap) {
        startJump();
      }


      tapCandidate =
        null;
    };


  container.addEventListener(
    'pointerup',
    end
  );


  container.addEventListener(
    'pointercancel',
    end
  );


  container.addEventListener(
    'wheel',
    event => {
      if (!targetVisible) {
        return;
      }


      event.preventDefault();


      userScale =
        Math.max(
          0.38,
          Math.min(
            2.5,

            userScale *
              (
                event.deltaY >
                0
                  ? 0.92
                  : 1.08
              )
          )
        );


      applyUserTransform();
    },
    {
      passive:
        false
    }
  );
}


/*
  ==========================================================
  CAPTURA WEBGL
  ==========================================================
*/

function captureOverlay() {
  if (
    !renderer ||
    !scene ||
    !camera
  ) {
    return null;
  }


  /*
    Render fresco inmediatamente antes de leer
    el framebuffer.
  */
  renderer.render(
    scene,
    camera
  );


  const source =
    renderer.domElement;


  const width =
    source.width;


  const height =
    source.height;


  if (
    !width ||
    !height
  ) {
    return null;
  }


  const gl =
    renderer.getContext();


  const pixels =
    new Uint8Array(
      width *
      height *
      4
    );


  gl.readPixels(
    0,
    0,
    width,
    height,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels
  );


  const snapshot =
    document.createElement(
      'canvas'
    );


  snapshot.width =
    width;


  snapshot.height =
    height;


  const context =
    snapshot.getContext(
      '2d'
    );


  if (!context) {
    return null;
  }


  const imageData =
    context.createImageData(
      width,
      height
    );


  const rowBytes =
    width *
    4;


  /*
    WebGL utiliza origen inferior izquierdo.
    Canvas 2D utiliza origen superior izquierdo.
  */
  for (
    let y = 0;
    y < height;
    y += 1
  ) {
    const sourceStart =
      (
        height -
        1 -
        y
      ) *
      rowBytes;


    const destinationStart =
      y *
      rowBytes;


    imageData.data.set(
      pixels.subarray(
        sourceStart,
        sourceStart +
          rowBytes
      ),

      destinationStart
    );
  }


  context.putImageData(
    imageData,
    0,
    0
  );


  const rect =
    source.getBoundingClientRect();


  return {
    canvas:
      snapshot,

    rect: {
      left:
        rect.left,

      top:
        rect.top,

      width:
        rect.width,

      height:
        rect.height
    }
  };
}


/*
  API consumida por capture.js.
*/
window.STRIKEZONE_AR_CAPTURE = {
  captureOverlay
};


/*
  ==========================================================
  INICIO AR
  ==========================================================
*/

async function startAR() {
  if (started) {
    return;
  }


  hideError();


  if (startBtn) {
    startBtn.disabled =
      true;
  }


  try {
    const targetSource =
      await prepareTarget();


    status(
      'Inicializando cámara…'
    );


    mindarThree =
      new MindARThree({
        container,

        imageTargetSrc:
          targetSource,

        maxTrack:
          1,

        uiLoading:
          'no',

        uiScanning:
          'no',

        uiError:
          'no'
      });


    ({
      renderer,
      scene,
      camera
    } = mindarThree);


    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio ||
          1,
        2
      )
    );


    scene.add(
      new THREE.HemisphereLight(
        0xffffff,
        0x315b3d,
        2.2
      )
    );


    const key =
      new THREE.DirectionalLight(
        0xffffff,
        2.4
      );


    key.position.set(
      1.4,
      2,
      2.3
    );


    scene.add(
      key
    );


    anchor =
      mindarThree.addAnchor(
        0
      );


    root =
      new THREE.Group();


    root.visible =
      false;


    root.position.z =
      card.baseZ ??
      0.24;


    anchor.group.add(
      root
    );


    confettiGroup =
      createConfetti();


    root.add(
      confettiGroup
    );


    await loadModel();


    resetTransform();


    anchor.onTargetFound =
      () => {
        targetVisible =
          true;


        root.visible =
          true;


        status(
          'QR del modelo detectado ✓'
        );


        if (helpEl) {
          helpEl.hidden =
            true;
        }


        if (controlsEl) {
          controlsEl.hidden =
            false;
        }


        if (gestureTip) {
          gestureTip.hidden =
            false;


          setTimeout(
            () => {
              if (gestureTip) {
                gestureTip.hidden =
                  true;
              }
            },
            4200
          );
        }
      };


    anchor.onTargetLost =
      () => {
        targetVisible =
          false;


        if (root) {
          root.visible =
            false;
        }


        status(
          'Apunta al QR completo del modelo'
        );


        if (helpEl) {
          helpEl.hidden =
            false;
        }


        if (controlsEl) {
          controlsEl.hidden =
            true;
        }


        if (gestureTip) {
          gestureTip.hidden =
            true;
        }
      };


    await mindarThree.start();


    started =
      true;


    if (startPanel) {
      startPanel.hidden =
        true;
    }


    if (helpEl) {
      helpEl.hidden =
        false;
    }


    status(
      'Apunta al QR completo del modelo'
    );


    clock.start();


    renderer.setAnimationLoop(
      () => {
        const now =
          performance.now();


        const delta =
          Math.min(
            clock.getDelta(),
            0.05
          );


        updateAnimations(
          now,
          delta
        );


        renderer.render(
          scene,
          camera
        );
      }
    );

  } catch (error) {
    console.error(
      error
    );


    try {
      await mindarThree
        ?.stop
        ?.();
    } catch {
      // Sin acción adicional.
    }


    container
      .querySelectorAll(
        ':scope > video, :scope > canvas'
      )
      .forEach(
        element =>
          element.remove()
      );


    mindarThree =
      null;

    renderer =
      null;

    scene =
      null;

    camera =
      null;

    anchor =
      null;

    root =
      null;

    modelPivot =
      null;

    mixer =
      null;

    embeddedAction =
      null;

    started =
      false;


    if (startBtn) {
      startBtn.disabled =
        false;
    }


    showError(
      error?.message ||
      'No se pudo iniciar la cámara o preparar la tarjeta.'
    );
  }
}


/*
  ==========================================================
  EVENTOS
  ==========================================================
*/

jumpBtn?.addEventListener(
  'click',
  startJump
);


spinBtn?.addEventListener(
  'click',
  startSpin
);


confettiBtn?.addEventListener(
  'click',
  toggleConfetti
);


resetBtn?.addEventListener(
  'click',
  () => {
    resetTransform();


    if (confettiOn) {
      toggleConfetti();
    }
  }
);


startBtn?.addEventListener(
  'click',
  startAR
);


retryBtn?.addEventListener(
  'click',
  () => {
    hideError();

    void startAR();
  }
);


attachGestures();


window.addEventListener(
  'pagehide',
  () => {
    renderer
      ?.setAnimationLoop(
        null
      );


    mindarThree
      ?.stop
      ?.();


    if (compiledBlobUrl) {
      URL.revokeObjectURL(
        compiledBlobUrl
      );


      compiledBlobUrl =
        '';
    }
  }
);