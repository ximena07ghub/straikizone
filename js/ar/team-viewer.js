import * as THREE from 'three';

import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import {
  MindARThree
} from 'mindar-image-three';


const teams = (
  window.STRIKEZONE_TEAMS || []
).filter(team =>
  team.targetImage &&
  team.model
);


const container =
  document.querySelector('#ar-container');

const startPanel =
  document.querySelector('[data-ar-start-panel]');

const startBtn =
  document.querySelector('[data-ar-start]');

const retryBtn =
  document.querySelector('[data-ar-retry]');

const statusEl =
  document.querySelector('[data-ar-status]');

const helpEl =
  document.querySelector('[data-ar-help]');

const controlsEl =
  document.querySelector('[data-ar-controls]');

const resetBtn =
  document.querySelector('[data-reset]');

const infoBtn =
  document.querySelector('[data-info]');

const infoPanel =
  document.querySelector('[data-info-panel]');

const infoClose =
  document.querySelector('[data-info-close]');

const infoTitle =
  document.querySelector('[data-info-title]');

const infoCity =
  document.querySelector('[data-info-city]');

const infoCopy =
  document.querySelector('[data-info-copy]');

const teamName =
  document.querySelector('[data-team-name]');

const historyLink =
  document.querySelector('[data-team-history-link]');


let mindarThree = null;
let renderer = null;
let scene = null;
let camera = null;

let compiledBlobUrl = '';

let started = false;

let currentTeam = null;
let currentRoot = null;

const entries = [];


window.STRIKEZONE_TEAM_AR_STATE = {
  team: null,
  targetVisible: false
};


function status(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}


function showError(message) {
  const box =
    document.querySelector('[data-ar-error]');

  const text =
    document.querySelector('[data-ar-error-text]');

  if (text) {
    text.textContent = message;
  }

  if (box) {
    box.hidden = false;
  }

  status('AR no disponible');
}


function hideError() {
  const box =
    document.querySelector('[data-ar-error]');

  if (box) {
    box.hidden = true;
  }
}


function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(
        new Error(
          `No se pudo cargar el logo AR: ${src}`
        )
      );
    };

    image.src = src;
  });
}


/*
  Preparar los logos registrados como targets MindAR.

  En esta primera prueba solo Sultanes tiene
  targetImage + model, por lo que solo se compilará
  ese logo.
*/
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

  status('Preparando reconocimiento del logo…');

  const images =
    await Promise.all(
      teams.map(team =>
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
        `Preparando reconocimiento… ${
          Math.max(
            0,
            Math.min(100, percentage)
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


async function loadTeamModel(entry) {
  if (entry.loaded) {
    return;
  }

  if (entry.loading) {
    return entry.loading;
  }

  entry.loading = (async () => {
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
        .setFromObject(visual);

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

    visual.position.sub(center);

    const requestedScale =
      Number.isFinite(
        entry.team.modelScale
      )
        ? entry.team.modelScale
        : 0.55;

    const normalizedScale =
      requestedScale /
      maxDimension;

    entry.modelPivot.scale.setScalar(
      normalizedScale
    );

    entry.modelPivot.add(
      visual
    );

    entry.loaded = true;
  })();

  try {
    await entry.loading;
  } finally {
    entry.loading = null;
  }
}


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
      team.city || '';
  }

  if (infoCopy) {
    infoCopy.textContent =
      team.intro || '';
  }

  if (historyLink) {
    historyLink.href =
      `historia-equipo.html?team=${
        encodeURIComponent(team.id)
      }`;
  }

  document.title =
    `StrikeZone | ${team.name} AR`;
}


function resetCurrentModel() {
  if (!currentRoot) {
    return;
  }

  currentRoot.position.set(
    0,
    0,
    0.18
  );

  currentRoot.rotation.set(
    0,
    0,
    0
  );

  const entry =
    entries.find(
      item =>
        item.team === currentTeam
    );

  if (entry?.modelPivot) {
    entry.modelPivot.rotation.set(
      0,
      0,
      0
    );
  }
}


async function teamFound(entry) {
  currentTeam =
    entry.team;

  currentRoot =
    entry.root;

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

  entries.forEach(item => {
    if (item !== entry) {
      item.root.visible = false;
    }
  });

  try {
    await loadTeamModel(
      entry
    );

    if (
      currentTeam !== entry.team ||
      !window
        .STRIKEZONE_TEAM_AR_STATE
        .targetVisible
    ) {
      return;
    }

    entry.root.visible = true;

    if (helpEl) {
      helpEl.hidden = true;
    }

    if (controlsEl) {
      controlsEl.hidden = false;
    }

    status(
      `${entry.team.name} reconocido ✓`
    );

  } catch (error) {
    console.error(
      'Error cargando modelo del equipo:',
      error
    );

    entry.root.visible = false;

    status(
      `No se pudo cargar el modelo de ${entry.team.name}.`
    );
  }
}


function teamLost(entry) {
  entry.root.visible = false;

  if (
    currentTeam === entry.team
  ) {
    window
      .STRIKEZONE_TEAM_AR_STATE
      .targetVisible =
        false;

    currentRoot = null;

    if (controlsEl) {
      controlsEl.hidden = true;
    }

    if (infoPanel) {
      infoPanel.hidden = true;
    }

    if (helpEl) {
      helpEl.hidden = false;
    }

    status(
      'Apunta nuevamente al logo del equipo'
    );
  }
}


function configureAnchors() {
  teams.forEach(
    (team, index) => {
      const anchor =
        mindarThree.addAnchor(
          index
        );

      const root =
        new THREE.Group();

      root.visible = false;

      root.position.z =
        0.18;

      const modelPivot =
        new THREE.Group();

      root.add(
        modelPivot
      );

      anchor.group.add(
        root
      );

      const entry = {
        team,
        anchor,
        root,
        modelPivot,
        loaded: false,
        loading: null
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


async function startAR() {
  if (started) {
    return;
  }

  hideError();

  if (startBtn) {
    startBtn.disabled = true;
  }

  try {
    const targetSource =
      await prepareTargets();

    status(
      'Inicializando cámara…'
    );

    mindarThree =
      new MindARThree({
        container,
        imageTargetSrc:
          targetSource,
        maxTrack: 1,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no'
      });

    ({
      renderer,
      scene,
      camera
    } = mindarThree);

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
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

    await mindarThree.start();

    started = true;

    if (startPanel) {
      startPanel.hidden = true;
    }

    if (helpEl) {
      helpEl.hidden = false;
    }

    status(
      'Apunta al logo del equipo'
    );

    renderer.setAnimationLoop(
      () => {
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

    try {
      await mindarThree?.stop?.();
    } catch (stopError) {
      console.warn(
        'No se pudo detener MindAR:',
        stopError
      );
    }

    container
      ?.querySelectorAll(
        ':scope > video, :scope > canvas'
      )
      .forEach(
        element =>
          element.remove()
      );

    mindarThree = null;
    renderer = null;
    scene = null;
    camera = null;

    if (startBtn) {
      startBtn.disabled = false;
    }

    showError(
      error?.message ||
      'No se pudo iniciar la cámara AR.'
    );
  }
}


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
      infoPanel.hidden = true;
    }
  }
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


window.addEventListener(
  'pagehide',
  () => {
    renderer?.setAnimationLoop(
      null
    );

    mindarThree
      ?.stop
      ?.();

    if (compiledBlobUrl) {
      URL.revokeObjectURL(
        compiledBlobUrl
      );

      compiledBlobUrl = '';
    }
  }
);