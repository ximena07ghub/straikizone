import * as THREE from 'three';

import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import {
  MindARThree
} from 'mindar-image-three';


const teams = (
  window.STRIKEZONE_TEAMS || []
).filter(
  team =>
    team.targetImage &&
    team.model
);


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

const infoTitle =
  document.querySelector(
    '[data-info-title]'
  );

const infoCity =
  document.querySelector(
    '[data-info-city]'
  );

const infoCopy =
  document.querySelector(
    '[data-info-copy]'
  );

const teamName =
  document.querySelector(
    '[data-team-name]'
  );

const historyLink =
  document.querySelector(
    '[data-team-history-link]'
  );


let mindarThree = null;
let renderer = null;
let scene = null;
let camera = null;

let compiledBlobUrl = '';

let started = false;

/*
  Solo será true cuando
  await mindarThree.start()
  termine correctamente.
*/
let mindarStarted = false;

let currentTeam = null;
let currentEntry = null;

const entries = [];

const clock =
  new THREE.Clock();

const pointers =
  new Map();

let lastSingle = null;
let lastPinchDistance = 0;
let lastPinchCenter = null;
let tapCandidate = null;


window.STRIKEZONE_TEAM_AR_STATE = {
  team: null,
  targetVisible: false
};


/* =========================================================
   INTERFAZ
   ========================================================= */

function status(message) {
  if (statusEl) {
    statusEl.textContent =
      message;
  }
}


function showError(message) {
  const box =
    document.querySelector(
      '[data-ar-error]'
    );

  const text =
    document.querySelector(
      '[data-ar-error-text]'
    );

  if (text) {
    text.textContent =
      message;
  }

  if (box) {
    box.hidden =
      false;
  }

  status(
    'AR no disponible'
  );
}


function hideError() {
  const box =
    document.querySelector(
      '[data-ar-error]'
    );

  if (box) {
    box.hidden =
      true;
  }
}


/* =========================================================
   TARGETS
   ========================================================= */

function loadImageElement(src) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const image =
        new Image();

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
              `No se pudo cargar el logo AR: ${src}`
            )
          );
        };

      image.src =
        src;
    }
  );
}


async function prepareTargets() {
  if (!teams.length) {
    throw new Error(
      'No hay equipos configurados para AR.'
    );
  }

  const Compiler =
    window.MINDAR?.Compiler ||
    window.MINDAR?.IMAGE?.Compiler;


  if (!Compiler) {
    throw new Error(
      'No se pudo cargar el compilador de MindAR.'
    );
  }


  status(
    'Preparando reconocimiento del logo…'
  );


  const images =
    await Promise.all(
      teams.map(
        team =>
          loadImageElement(
            team.targetImage
          )
      )
    );


  const compiler =
    new Compiler();


  await compiler.compileImageTargets(
    images,

    progress => {
      const value =
        Number(
          progress
        );

      const percentage =
        Number.isFinite(
          value
        )
          ? Math.round(
              value <= 1
                ? value * 100
                : value
            )
          : 0;


      status(
        `Preparando reconocimiento… ${
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


  return compiledBlobUrl;
}


/* =========================================================
   CONFETI
   ========================================================= */

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


/* =========================================================
   MODELOS
   ========================================================= */

async function loadTeamModel(entry) {
  if (entry.loaded) {
    return;
  }


  if (entry.loading) {
    return entry.loading;
  }


  entry.loading =
    (async () => {
      status(
        `Cargando modelo de ${entry.team.name}…`
      );


      const loader =
        new GLTFLoader();


      const gltf =
        await loader.loadAsync(
          entry.team.model
        );


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


      const requestedScale =
        Number.isFinite(
          entry.team.modelScale
        )
          ? entry.team.modelScale
          : 0.55;


      entry.baseScale =
        requestedScale /
        maxDimension;


      entry.modelPivot
        .scale
        .setScalar(
          entry.baseScale
        );


      entry.modelPivot.add(
        visual
      );


      if (
        gltf.animations?.length
      ) {
        entry.mixer =
          new THREE.AnimationMixer(
            visual
          );


        entry.embeddedAction =
          entry.mixer.clipAction(
            gltf.animations[0]
          );


        entry.embeddedAction.setLoop(
          THREE.LoopOnce,
          1
        );


        entry.embeddedAction.clampWhenFinished =
          true;
      }


      entry.loaded =
        true;
    })();


  try {
    await entry.loading;

  } finally {
    entry.loading =
      null;
  }
}


/* =========================================================
   INFO EQUIPO
   ========================================================= */

function updateTeamInfo(team) {
  if (!team) {
    return;
  }


  if (teamName) {
    teamName.textContent =
      team.name;
  }


  if (infoTitle) {
    infoTitle.textContent =
      team.name;
  }


  if (infoCity) {
    infoCity.textContent =
      team.city ||
      '';
  }


  if (infoCopy) {
    infoCopy.textContent =
      team.intro ||
      '';
  }


  if (historyLink) {
    historyLink.href =
      `historia-equipo.html?team=${
        encodeURIComponent(
          team.id
        )
      }`;
  }


  document.title =
    `StrikeZone | ${team.name} AR`;
}


/* =========================================================
   TRANSFORMACIÓN DEL MODELO
   ========================================================= */

function applyTransform(entry) {
  if (!entry) {
    return;
  }


  if (
    entry.root &&
    !entry.jumping
  ) {
    entry.root.position.set(
      entry.userPosX,
      entry.userPosY,
      entry.baseZ
    );
  }


  if (!entry.modelPivot) {
    return;
  }


  entry.modelPivot.rotation.x =
    entry.userRotX;


  entry.modelPivot.rotation.y =
    entry.userRotY;


  entry.modelPivot
    .scale
    .setScalar(
      entry.baseScale *
      entry.userScale
    );
}


function resetEntry(entry) {
  if (!entry) {
    return;
  }


  entry.userScale =
    1;


  entry.userRotX =
    0;

  entry.userRotY =
    0;


  entry.userPosX =
    0;

  entry.userPosY =
    0;


  entry.jumping =
    false;

  entry.spinning =
    false;


  entry.root.position.set(
    0,
    0,
    entry.baseZ
  );


  entry.root.rotation.set(
    0,
    0,
    0
  );


  entry.modelPivot
    .rotation
    .set(
      0,
      0,
      0
    );


  entry.modelPivot
    .scale
    .setScalar(
      entry.baseScale
    );


  if (entry.confettiOn) {
    entry.confettiOn =
      false;

    entry.confettiGroup.visible =
      false;
  }


  if (confettiBtn) {
    confettiBtn.setAttribute(
      'aria-pressed',
      'false'
    );

    confettiBtn.innerHTML =
      '<span>✦</span>Efectos OFF';
  }
}


function resetCurrentModel() {
  resetEntry(
    currentEntry
  );
}


/* =========================================================
   ANIMACIÓN
   ========================================================= */

function startJump() {
  const entry =
    currentEntry;


  if (
    !entry ||
    !window
      .STRIKEZONE_TEAM_AR_STATE
      .targetVisible ||
    entry.jumping
  ) {
    return;
  }


  entry.jumping =
    true;


  entry.jumpStart =
    performance.now();


  if (entry.embeddedAction) {
    entry.embeddedAction.reset();

    entry.embeddedAction.play();
  }
}


function startSpin() {
  const entry =
    currentEntry;


  if (
    !entry ||
    !window
      .STRIKEZONE_TEAM_AR_STATE
      .targetVisible
  ) {
    return;
  }


  entry.spinning =
    true;


  entry.spinStart =
    performance.now();
}


function toggleConfetti() {
  const entry =
    currentEntry;


  if (!entry) {
    return;
  }


  entry.confettiOn =
    !entry.confettiOn;


  entry.confettiGroup.visible =
    entry.confettiOn;


  if (confettiBtn) {
    confettiBtn.setAttribute(
      'aria-pressed',
      String(
        entry.confettiOn
      )
    );


    confettiBtn.innerHTML =
      `<span>✦</span>Efectos ${
        entry.confettiOn
          ? 'ON'
          : 'OFF'
      }`;
  }
}


function updateEntryAnimations(
  entry,
  now,
  delta
) {
  if (!entry) {
    return;
  }


  entry.mixer?.update(
    delta
  );


  if (
    entry.jumping &&
    entry.root
  ) {
    const progress =
      Math.min(
        1,
        (
          now -
          entry.jumpStart
        ) /
        760
      );


    const arc =
      Math.sin(
        Math.PI *
        progress
      );


    entry.root.position.set(
      entry.userPosX,

      entry.userPosY +
        arc *
        0.34,

      entry.baseZ
    );


    if (
      progress >= 1
    ) {
      entry.jumping =
        false;


      applyTransform(
        entry
      );
    }
  }


  if (
    entry.spinning &&
    entry.modelPivot
  ) {
    const progress =
      Math.min(
        1,
        (
          now -
          entry.spinStart
        ) /
        1500
      );


    const eased =
      1 -
      Math.pow(
        1 -
        progress,
        3
      );


    entry.modelPivot.rotation.y =
      entry.userRotY +
      Math.PI *
      2 *
      eased;


    if (
      progress >= 1
    ) {
      entry.spinning =
        false;


      applyTransform(
        entry
      );
    }
  }


  if (
    entry.confettiGroup
      ?.visible
  ) {
    const time =
      now /
      1000;


    entry.confettiGroup
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


/* =========================================================
   GESTOS
   ========================================================= */

function attachGestures() {
  const centerOfPointers =
    () => {
      const values =
        [
          ...pointers.values()
        ];


      if (!values.length) {
        return null;
      }


      return {
        x:
          values.reduce(
            (
              total,
              point
            ) =>
              total +
              point.x,
            0
          ) /
          values.length,

        y:
          values.reduce(
            (
              total,
              point
            ) =>
              total +
              point.y,
            0
          ) /
          values.length
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


      if (
        !currentEntry ||
        !window
          .STRIKEZONE_TEAM_AR_STATE
          .targetVisible
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
          [
            ...pointers.values()
          ];


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
      const entry =
        currentEntry;


      if (
        !entry ||
        !pointers.has(
          event.pointerId
        ) ||
        !window
          .STRIKEZONE_TEAM_AR_STATE
          .targetVisible
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


        entry.userRotY +=
          dx *
          0.009;


        entry.userRotX =
          Math.max(
            -1.05,

            Math.min(
              1.05,

              entry.userRotX +
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


        applyTransform(
          entry
        );


        return;
      }


      if (
        pointers.size === 2
      ) {
        const points =
          [
            ...pointers.values()
          ];


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
          entry.userScale =
            Math.max(
              0.38,

              Math.min(
                2.5,

                entry.userScale *
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
          entry.userPosX =
            Math.max(
              -0.65,

              Math.min(
                0.65,

                entry.userPosX +
                  (
                    center.x -
                    lastPinchCenter.x
                  ) *
                  0.0028
              )
            );


          entry.userPosY =
            Math.max(
              -0.70,

              Math.min(
                0.70,

                entry.userPosY -
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


        applyTransform(
          entry
        );
      }
    }
  );


  const endPointer =
    event => {
      const canTap =
        tapCandidate &&
        tapCandidate.id ===
          event.pointerId &&
        !tapCandidate.moved &&
        (
          performance.now() -
          tapCandidate.t
        ) < 360 &&
        window
          .STRIKEZONE_TEAM_AR_STATE
          .targetVisible;


      pointers.delete(
        event.pointerId
      );


      lastSingle =
        pointers.size === 1
          ? [
              ...pointers.values()
            ][0]

          : null;


      if (
        pointers.size < 2
      ) {
        lastPinchDistance =
          0;


        lastPinchCenter =
          null;
      }


      if (canTap) {
        startJump();
      }


      tapCandidate =
        null;
    };


  container.addEventListener(
    'pointerup',
    endPointer
  );


  container.addEventListener(
    'pointercancel',
    endPointer
  );


  container.addEventListener(
    'wheel',

    event => {
      const entry =
        currentEntry;


      if (
        !entry ||
        !window
          .STRIKEZONE_TEAM_AR_STATE
          .targetVisible
      ) {
        return;
      }


      event.preventDefault();


      entry.userScale =
        Math.max(
          0.38,

          Math.min(
            2.5,

            entry.userScale *
              (
                event.deltaY > 0
                  ? 0.92
                  : 1.08
              )
          )
        );


      applyTransform(
        entry
      );
    },

    {
      passive:
        false
    }
  );
}


/* =========================================================
   CAPTURA DEL CANVAS WEBGL
   ========================================================= */

function captureOverlay() {
  if (
    !renderer ||
    !scene ||
    !camera
  ) {
    return null;
  }


  /*
    Render fresco justo antes de leer
    los píxeles del framebuffer.
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
    readPixels entrega las filas
    invertidas verticalmente.
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
    source
      .getBoundingClientRect();


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


window.STRIKEZONE_AR_CAPTURE = {
  captureOverlay
};


/* =========================================================
   TARGET ENCONTRADO
   ========================================================= */

async function teamFound(entry) {
  currentTeam =
    entry.team;


  currentEntry =
    entry;


  window
    .STRIKEZONE_TEAM_AR_STATE
    .team =
      entry.team;


  window
    .STRIKEZONE_TEAM_AR_STATE
    .targetVisible =
      true;


  updateTeamInfo(
    entry.team
  );


  entries.forEach(
    item => {
      if (
        item !== entry
      ) {
        item.root.visible =
          false;
      }
    }
  );


  try {
    await loadTeamModel(
      entry
    );


    if (
      currentEntry !==
        entry ||
      !window
        .STRIKEZONE_TEAM_AR_STATE
        .targetVisible
    ) {
      return;
    }


    entry.root.visible =
      true;


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


      window.setTimeout(
        () => {
          if (gestureTip) {
            gestureTip.hidden =
              true;
          }
        },

        4200
      );
    }


    if (confettiBtn) {
      confettiBtn.setAttribute(
        'aria-pressed',

        String(
          entry.confettiOn
        )
      );


      confettiBtn.innerHTML =
        `<span>✦</span>Efectos ${
          entry.confettiOn
            ? 'ON'
            : 'OFF'
        }`;
    }


    status(
      `${entry.team.name} reconocido ✓`
    );

  } catch (error) {
    console.error(
      'Error cargando modelo del equipo:',
      error
    );


    entry.root.visible =
      false;


    status(
      `No se pudo cargar el modelo de ${entry.team.name}.`
    );
  }
}


/* =========================================================
   TARGET PERDIDO
   ========================================================= */

function teamLost(entry) {
  entry.root.visible =
    false;


  if (
    currentEntry !== entry
  ) {
    return;
  }


  window
    .STRIKEZONE_TEAM_AR_STATE
    .targetVisible =
      false;


  if (controlsEl) {
    controlsEl.hidden =
      true;
  }


  if (gestureTip) {
    gestureTip.hidden =
      true;
  }


  if (infoPanel) {
    infoPanel.hidden =
      true;
  }


  if (helpEl) {
    helpEl.hidden =
      false;
  }


  status(
    'Apunta nuevamente al logo del equipo'
  );
}


/* =========================================================
   ANCHORS
   ========================================================= */

function configureAnchors() {
  entries.length =
    0;


  teams.forEach(
    (
      team,
      index
    ) => {
      const anchor =
        mindarThree.addAnchor(
          index
        );


      const root =
        new THREE.Group();


      root.visible =
        false;


      const baseZ =
        Number.isFinite(
          team.baseZ
        )
          ? team.baseZ
          : 0.18;


      root.position.z =
        baseZ;


      const modelPivot =
        new THREE.Group();


      const confettiGroup =
        createConfetti();


      root.add(
        modelPivot
      );


      root.add(
        confettiGroup
      );


      anchor.group.add(
        root
      );


      const entry = {
        team,
        anchor,
        root,
        modelPivot,
        confettiGroup,

        loaded:
          false,

        loading:
          null,

        mixer:
          null,

        embeddedAction:
          null,

        baseScale:
          1,

        baseZ,

        userScale:
          1,

        userRotX:
          0,

        userRotY:
          0,

        userPosX:
          0,

        userPosY:
          0,

        jumping:
          false,

        jumpStart:
          0,

        spinning:
          false,

        spinStart:
          0,

        confettiOn:
          false
      };


      entries.push(
        entry
      );


      anchor.onTargetFound =
        () => {
          void teamFound(
            entry
          );
        };


      anchor.onTargetLost =
        () => {
          teamLost(
            entry
          );
        };
    }
  );
}


/* =========================================================
   LIMPIEZA DE INICIALIZACIÓN FALLIDA
   ========================================================= */

function clearPartialAR() {
  renderer
    ?.setAnimationLoop(
      null
    );


  /*
    Importante:
    solo removemos nodos creados por MindAR.
    No llamamos stop() aquí.
  */
  container
    ?.querySelectorAll(
      ':scope > video, :scope > canvas'
    )
    .forEach(
      element =>
        element.remove()
    );


  renderer =
    null;

  scene =
    null;

  camera =
    null;

  mindarThree =
    null;


  mindarStarted =
    false;

  started =
    false;


  currentTeam =
    null;

  currentEntry =
    null;


  entries.length =
    0;


  pointers.clear();


  lastSingle =
    null;

  lastPinchDistance =
    0;

  lastPinchCenter =
    null;

  tapCandidate =
    null;


  window
    .STRIKEZONE_TEAM_AR_STATE
    .team =
      null;


  window
    .STRIKEZONE_TEAM_AR_STATE
    .targetVisible =
      false;
}


/* =========================================================
   INICIO AR
   ========================================================= */

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
      await prepareTargets();


    status(
      'Inicializando cámara…'
    );


    /*
      Esta parte mantiene el orden del
      commit que ya funcionaba.
    */
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


    /*
      Valores originales de iluminación
      del commit funcional.
    */
    const directional =
      new THREE.DirectionalLight(
        0xffffff,
        2.3
      );


    directional.position.set(
      1.5,
      2,
      2.5
    );


    scene.add(
      directional
    );


    configureAnchors();


    /*
      Punto crítico:
      no marcamos la cámara como iniciada
      hasta que esta promesa termine.
    */
    await mindarThree.start();


    mindarStarted =
      true;


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
      'Apunta al logo del equipo'
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


        if (
          currentEntry &&
          window
            .STRIKEZONE_TEAM_AR_STATE
            .targetVisible
        ) {
          updateEntryAnimations(
            currentEntry,
            now,
            delta
          );
        }


        renderer.render(
          scene,
          camera
        );
      }
    );

  } catch (error) {
    console.error(
      'Error iniciando Team AR:',
      error
    );


    /*
      NO llamar stop() si start()
      nunca terminó.

      Esto elimina:
      Cannot read properties of undefined
      (reading 'stopProcessVideo')
    */
    if (
      mindarStarted &&
      mindarThree
    ) {
      try {
        await mindarThree.stop();

      } catch (stopError) {
        console.warn(
          'No se pudo detener MindAR:',
          stopError
        );
      }
    }


    clearPartialAR();


    if (startBtn) {
      startBtn.disabled =
        false;
    }


    showError(
      error?.message ||
      'No se pudo iniciar la cámara AR.'
    );
  }
}


/* =========================================================
   EVENTOS
   ========================================================= */

infoBtn?.addEventListener(
  'click',

  () => {
    if (
      !currentTeam ||
      !infoPanel
    ) {
      return;
    }


    infoPanel.hidden =
      !infoPanel.hidden;
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
  resetCurrentModel
);


startBtn?.addEventListener(
  'click',

  () => {
    void startAR();
  }
);


retryBtn?.addEventListener(
  'click',

  () => {
    hideError();

    void startAR();
  }
);


attachGestures();


/* =========================================================
   SALIDA DE LA PÁGINA
   ========================================================= */

window.addEventListener(
  'pagehide',

  () => {
    renderer
      ?.setAnimationLoop(
        null
      );


    /*
      Aquí sí puede detenerse,
      pero únicamente si start()
      había terminado correctamente.
    */
    if (
      mindarStarted &&
      mindarThree
    ) {
      mindarThree
        .stop()
        .catch(
          () => {}
        );
    }


    if (compiledBlobUrl) {
      URL.revokeObjectURL(
        compiledBlobUrl
      );


      compiledBlobUrl =
        '';
    }
  }
);