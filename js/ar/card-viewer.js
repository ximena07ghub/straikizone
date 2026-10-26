import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MindARThree } from 'mindar-image-three';

const cards = window.STRIKEZONE_AR_CARDS || {};
const modelCatalog = window.STRIKEZONE_AR_MODELS || {};
const params = new URLSearchParams(location.search);
const requestedId = (params.get('card') || '').trim().toLowerCase();
const requestedModelKey = (params.get('model') || '').trim().toLowerCase();
const modelEntry = !requestedId && requestedModelKey ? modelCatalog[requestedModelKey] : null;
const baseCard = (requestedId && cards[requestedId]) || modelEntry?.card || null;
const modelMode = Boolean(modelEntry && !requestedId);
const card = baseCard && modelMode ? {
  ...baseCard,
  name: `Modelo 3D · ${modelEntry.title}`,
  category: 'STRIKEZONE · MODELO AR',
  team: 'Marcador QR por modelo',
  stats: [],
  bio: `Este marcador abre el modelo ${modelEntry.title}. El objeto 3D permanece visible mientras la cámara detecte el QR completo.`,
  model: modelEntry.model,
  modelKey: modelEntry.key,
  modelLabel: modelEntry.modelLabel,
  targetImage: modelEntry.targetImage,
  markerImage: modelEntry.markerImage,
  qr: modelEntry.qr
} : baseCard;

if (!card) {
  document.title = 'StrikeZone | Carta AR';
  const missingId = requestedId || requestedModelKey || 'sin-identificador';
  document.querySelector('[data-ar-name]')?.replaceChildren(document.createTextNode('Carta o modelo no disponible'));
  document.querySelector('[data-start-title]')?.replaceChildren(document.createTextNode('Carta o modelo no disponible'));
  document.querySelector('[data-ar-category]')?.replaceChildren(document.createTextNode('STRIKEZONE'));
  const error = document.querySelector('[data-ar-error]');
  const errorText = document.querySelector('[data-ar-error-text]');
  if (errorText) errorText.textContent = `No existe una configuración AR para la carta o modelo "${missingId}".`;
  if (error) error.hidden = false;
  throw new Error(`AR no configurado: ${missingId}`);
}

const container = document.querySelector('#ar-container');
const startPanel = document.querySelector('[data-ar-start-panel]');
const startBtn = document.querySelector('[data-ar-start]');
const retryBtn = document.querySelector('[data-ar-retry]');
const statusEl = document.querySelector('[data-ar-status]');
const helpEl = document.querySelector('[data-ar-help]');
const controlsEl = document.querySelector('[data-ar-controls]');
const gestureTip = document.querySelector('[data-gesture-tip]');
const errorEl = document.querySelector('[data-ar-error]');
const errorText = document.querySelector('[data-ar-error-text]');
const jumpBtn = document.querySelector('[data-jump]');
const confettiBtn = document.querySelector('[data-confetti]');
const spinBtn = document.querySelector('[data-spin]');
const resetBtn = document.querySelector('[data-reset]');
const infoBtn = document.querySelector('[data-info]');
const infoPanel = document.querySelector('[data-info-panel]');
const infoClose = document.querySelector('[data-info-close]');

let mindarThree = null;
let renderer = null;
let scene = null;
let camera = null;
let anchor = null;
let root = null;
let modelPivot = null;
let mixer = null;
let embeddedAction = null;
let clock = new THREE.Clock();
let confettiGroup = null;
let compiledBlobUrl = '';
let started = false;
let targetVisible = false;
let jumping = false;
let jumpStart = 0;
let spinning = false;
let spinStart = 0;
let confettiOn = false;
let baseScale = 1;
const pointers = new Map();
let lastSingle = null;
let lastPinchDistance = 0;
let lastPinchCenter = null;
let tapCandidate = null;
let userScale = 1;
let userRotX = 0;
let userRotY = 0;
let userPosX = 0;
let userPosY = 0;

// Dirección del salto expresada en coordenadas locales del target.
// Se calcula al iniciar el salto usando el "arriba" de la pantalla para que,
// aunque la tarjeta esté ligeramente girada, la pelota suba visualmente y no
// se desplace de lado.
const jumpDirection = new THREE.Vector3(0, 1, 0);

function setText(sel, text){const el=document.querySelector(sel);if(el)el.textContent=text;}
setText('[data-ar-name]', card.name);
setText('[data-start-title]', card.name);
setText('[data-ar-category]', card.category);
setText('[data-model-label]', card.modelLabel);
setText('[data-target-side]', card.targetSide || 'reverso');
const preview = document.querySelector('[data-target-preview]');
if(preview){preview.src=card.targetImage || card.markerImage;preview.alt=`Marcador QR del modelo ${card.modelLabel || card.name}`;}
const printLink = document.querySelector('[data-print-link]');
if(printLink){printLink.href = `tarjeta-provisional.html?card=${encodeURIComponent(card.id)}`;printLink.hidden=modelMode;}
document.title = `StrikeZone | ${card.name} AR`;
setText('[data-info-title]', card.name);
setText('[data-info-copy]', card.bio || 'Información de la carta.');
const infoStats=document.querySelector('[data-info-stats]');
if(infoStats) infoStats.innerHTML=(card.stats||[]).map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('');
infoBtn?.addEventListener('click',()=>{if(infoPanel) infoPanel.hidden=!infoPanel.hidden;});
infoClose?.addEventListener('click',()=>{if(infoPanel) infoPanel.hidden=true;});

function status(message){if(statusEl)statusEl.textContent=message;}
function showError(message){
  if(errorText)errorText.textContent=message;
  if(errorEl)errorEl.hidden=false;
  status('AR no disponible');
}
function hideError(){if(errorEl)errorEl.hidden=true;}

function loadImageElement(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error('No se pudo cargar la imagen de la tarjeta para AR.'));
    img.src=src;
  });
}

async function prepareTarget(){
  // Si hay un .mind definitivo se usa directamente; por ahora compilamos el marcador QR compuesto del modelo.
  if(card.mindFile){
    status('Cargando marcador QR del modelo…');
    return card.mindFile;
  }

  // El marcador contiene un QR real más un marco/título que mejora los detalles visuales
  // para MindAR. La misma imagen aparece impresa en el reverso de las cartas asociadas al GLB.
  if(!card.compileTarget || !card.targetImage){
    throw new Error('Falta configurar el marcador AR de esta tarjeta.');
  }

  const Compiler = window.MINDAR?.Compiler || window.MINDAR?.IMAGE?.Compiler;
  if(!Compiler){
    throw new Error('No cargó el compilador de la tarjeta AR. Actualiza la página y vuelve a intentar con conexión a internet.');
  }

  status('Preparando reconocimiento del QR… 0%');
  const img=await loadImageElement(card.targetImage);
  const compiler=new Compiler();
  await compiler.compileImageTargets([img], progress=>{
    const pct=Math.max(0,Math.min(100,Math.round(progress || 0)));
    status(`Preparando reconocimiento del QR… ${pct}%`);
  });
  const buffer=await compiler.exportData();
  if(compiledBlobUrl) URL.revokeObjectURL(compiledBlobUrl);
  compiledBlobUrl=URL.createObjectURL(new Blob([buffer],{type:'application/octet-stream'}));
  status('Tarjeta preparada ✓');
  return compiledBlobUrl;
}

function createConfetti(){
  const group = new THREE.Group();
  const palette = [0xe7d55a,0xf7f4e8,0x4d8d56,0xc94a43,0x77a6d8];
  const geo = new THREE.BoxGeometry(0.028,0.012,0.006);
  for(let i=0;i<54;i++){
    const mat = new THREE.MeshStandardMaterial({color:palette[i%palette.length],roughness:.72,metalness:.05});
    const piece = new THREE.Mesh(geo,mat);
    piece.userData.x = (Math.random()-.5)*.9;
    piece.userData.startY = (Math.random()*.9)-.3;
    piece.userData.z = .12 + Math.random()*.52;
    piece.userData.speed = .22 + Math.random()*.36;
    piece.userData.phase = Math.random()*1.2;
    piece.userData.spin = (Math.random()-.5)*5;
    group.add(piece);
  }
  group.visible = false;
  return group;
}

async function loadModel(){
  status(`Cargando ${card.modelLabel || 'modelo 3D'}…`);
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(card.model);
  modelPivot = new THREE.Group();
  const visual = gltf.scene;
  const box = new THREE.Box3().setFromObject(visual);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x,size.y,size.z) || 1;
  visual.position.sub(center);
  baseScale = (card.modelScale || .46) / maxDim;
  modelPivot.scale.setScalar(baseScale);
  modelPivot.add(visual);
  root.add(modelPivot);
  if(gltf.animations?.length){
    mixer = new THREE.AnimationMixer(visual);
    embeddedAction = mixer.clipAction(gltf.animations[0]);
    embeddedAction.setLoop(THREE.LoopOnce,1);
    embeddedAction.clampWhenFinished = true;
  }
}

function resetTransform(){
  userScale=1;userRotX=0;userRotY=0;userPosX=0;userPosY=0;
  jumping=false;spinning=false;
  if(root){root.position.set(0,0,card.baseZ ?? .20);root.rotation.set(0,0,0);}
  if(modelPivot){modelPivot.rotation.set(0,0,0);modelPivot.scale.setScalar(baseScale);}
}

function applyUserTransform(){
  if(root&&!jumping){root.position.x=userPosX;root.position.y=userPosY;root.position.z=card.baseZ??.20;}
  if(!modelPivot)return;
  modelPivot.rotation.x=userRotX;
  modelPivot.rotation.y=userRotY;
  modelPivot.scale.setScalar(baseScale*userScale);
}

function captureScreenUpDirection(){
  // En image tracking, +Y del target corresponde al eje vertical del diseño impreso.
  // Usar este eje fijo hace que el salto sea siempre "arriba/abajo" respecto a la
  // tarjeta, en vez de verse horizontal por una conversión de coordenadas de cámara.
  jumpDirection.set(0,1,0);
}

function startJump(){
  if(!root || !targetVisible || jumping)return;
  captureScreenUpDirection();
  jumping=true;
  jumpStart=performance.now();
  if(embeddedAction){embeddedAction.reset();embeddedAction.play();}
}
function startSpin(){if(!modelPivot||!targetVisible)return;spinning=true;spinStart=performance.now();}
function toggleConfetti(){
  confettiOn=!confettiOn;
  if(confettiGroup)confettiGroup.visible=confettiOn;
  confettiBtn?.setAttribute('aria-pressed',String(confettiOn));
  if(confettiBtn) confettiBtn.innerHTML=`<span>✦</span>Efectos ${confettiOn?'ON':'OFF'}`;
}

function updateAnimations(now, delta){
  mixer?.update(delta);
  if(jumping&&root){
    const p=Math.min(1,(now-jumpStart)/760);
    const arc=Math.sin(Math.PI*p);
    const jumpHeight=.34;
    root.position.set(userPosX,userPosY,card.baseZ??.20)
      .addScaledVector(jumpDirection,arc*jumpHeight);
    if(p>=1){jumping=false;applyUserTransform();}
  }
  if(spinning&&modelPivot){
    const p=Math.min(1,(now-spinStart)/1500);
    const eased=1-Math.pow(1-p,3);
    modelPivot.rotation.y=userRotY+(Math.PI*2*eased);
    if(p>=1){spinning=false;applyUserTransform();}
  }
  if(confettiGroup?.visible){
    const t=now/1000;
    confettiGroup.children.forEach((piece,i)=>{
      const u=piece.userData;
      const cycle=(u.phase+t*u.speed)%1.25;
      piece.position.set(u.x,.62-cycle,u.z+Math.sin(t*1.6+i)*.035);
      piece.rotation.x=t*(1.1+u.speed*2);
      piece.rotation.y=t*u.spin;
      piece.rotation.z=t*(.7+u.speed);
    });
  }
}

function attachGestures(){
  const centerOfPointers=()=>{
    const pts=[...pointers.values()];
    if(!pts.length)return null;
    return {x:pts.reduce((a,p)=>a+p.x,0)/pts.length,y:pts.reduce((a,p)=>a+p.y,0)/pts.length};
  };
  container.addEventListener('pointerdown',e=>{
    if(e.target.closest('.ar-controls,.ar-topbar,.ar-start,.ar-error'))return;
    container.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===1){
      lastSingle={x:e.clientX,y:e.clientY};
      tapCandidate={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),moved:false};
    }
    if(pointers.size===2){
      tapCandidate=null;
      const pts=[...pointers.values()];
      lastPinchDistance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      lastPinchCenter=centerOfPointers();
    }
  });
  container.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId)||!targetVisible)return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(tapCandidate&&tapCandidate.id===e.pointerId&&Math.hypot(e.clientX-tapCandidate.x,e.clientY-tapCandidate.y)>8)tapCandidate.moved=true;
    if(pointers.size===1&&lastSingle){
      const dx=e.clientX-lastSingle.x,dy=e.clientY-lastSingle.y;
      userRotY+=dx*.009;
      userRotX=Math.max(-1.05,Math.min(1.05,userRotX+dy*.007));
      lastSingle={x:e.clientX,y:e.clientY};
      applyUserTransform();
    }else if(pointers.size===2){
      const pts=[...pointers.values()];
      const dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      const ctr=centerOfPointers();
      if(lastPinchDistance>0){
        userScale=Math.max(.38,Math.min(2.5,userScale*(dist/lastPinchDistance)));
      }
      if(lastPinchCenter&&ctr){
        userPosX=Math.max(-.65,Math.min(.65,userPosX+(ctr.x-lastPinchCenter.x)*.0028));
        userPosY=Math.max(-.70,Math.min(.70,userPosY-(ctr.y-lastPinchCenter.y)*.0028));
      }
      lastPinchDistance=dist;
      lastPinchCenter=ctr;
      applyUserTransform();
    }
  });
  const end=e=>{
    const doTap=tapCandidate&&tapCandidate.id===e.pointerId&&!tapCandidate.moved&&(performance.now()-tapCandidate.t)<360&&targetVisible;
    pointers.delete(e.pointerId);
    lastSingle=pointers.size===1?[...pointers.values()][0]:null;
    if(pointers.size<2){lastPinchDistance=0;lastPinchCenter=null;}
    if(doTap)startJump();
    tapCandidate=null;
  };
  container.addEventListener('pointerup',end);
  container.addEventListener('pointercancel',end);
  container.addEventListener('wheel',e=>{
    if(!targetVisible)return;e.preventDefault();
    userScale=Math.max(.38,Math.min(2.5,userScale*(e.deltaY>0?.92:1.08)));applyUserTransform();
  },{passive:false});
}

async function startAR(){
  if(started)return;
  hideError();
  startBtn.disabled=true;
  try{
    const targetSrc=await prepareTarget();
    status('Inicializando cámara…');
    mindarThree=new MindARThree({
      container,
      imageTargetSrc:targetSrc,
      maxTrack:1,
      uiLoading:'no',
      uiScanning:'no',
      uiError:'no'
    });
    ({renderer,scene,camera}=mindarThree);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    scene.add(new THREE.HemisphereLight(0xffffff,0x315b3d,2.2));
    const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(1.4,2,2.3);scene.add(key);
    anchor=mindarThree.addAnchor(0);
    root=new THREE.Group();root.visible=false;root.position.z=card.baseZ??.24;anchor.group.add(root);
    confettiGroup=createConfetti();root.add(confettiGroup);
    await loadModel();
    resetTransform();
    anchor.onTargetFound=()=>{
      targetVisible=true;
      root.visible=true;
      status('QR del modelo detectado ✓');
      helpEl.hidden=true;controlsEl.hidden=false;gestureTip.hidden=false;
      setTimeout(()=>{if(gestureTip)gestureTip.hidden=true;},4200);
    };
    anchor.onTargetLost=()=>{
      targetVisible=false;
      if(root)root.visible=false;
      status('Apunta al QR completo del modelo');
      helpEl.hidden=false;controlsEl.hidden=true;gestureTip.hidden=true;
    };
    await mindarThree.start();
    started=true;
    startPanel.hidden=true;
    helpEl.hidden=false;
    status('Apunta al QR completo del modelo');
    clock.start();
    renderer.setAnimationLoop(()=>{
      const now=performance.now();
      const delta=Math.min(clock.getDelta(),.05);
      updateAnimations(now,delta);
      renderer.render(scene,camera);
    });
  }catch(err){
    console.error(err);
    try{await mindarThree?.stop?.();}catch{}
    container.querySelectorAll(':scope > video, :scope > canvas').forEach(el=>el.remove());
    mindarThree=null;renderer=null;scene=null;camera=null;anchor=null;root=null;modelPivot=null;mixer=null;embeddedAction=null;
    startBtn.disabled=false;
    showError(err?.message||'No se pudo iniciar la cámara o preparar la tarjeta.');
  }
}

jumpBtn?.addEventListener('click',startJump);
spinBtn?.addEventListener('click',startSpin);
confettiBtn?.addEventListener('click',toggleConfetti);
resetBtn?.addEventListener('click',()=>{resetTransform();if(confettiOn)toggleConfetti();});
startBtn?.addEventListener('click',startAR);
retryBtn?.addEventListener('click',()=>{hideError();startAR();});
attachGestures();

window.addEventListener('beforeunload',()=>{
  renderer?.setAnimationLoop(null);
  mindarThree?.stop?.();
  if(compiledBlobUrl)URL.revokeObjectURL(compiledBlobUrl);
});
