# Guía de desarrollo AR — StrikeZone v5

Esta guía explica dónde continuar el trabajo AR sin mezclarlo con navegación, login, colección o filtros multimedia.

## Estructura

```text
assets/ar/
├── models/      modelos .glb
├── targets/     targets .mind, imágenes de reconocimiento y notas
├── audio/       narraciones o efectos de audio
├── videos/      videos históricos/promocionales usados dentro de AR
└── effects/     texturas, sprites o recursos de partículas

js/ar/
├── cards.js         configuración de cartas AR
├── card-viewer.js   motor MindAR + Three.js de carta/marker tracking
├── model-viewer.js  lógica de experiencias con <model-viewer>
├── qr.js            generación/soporte de QR
├── scanner.js       lector QR
└── card-print.js    tarjeta imprimible

css/ar/
├── card.css
├── hub.css
├── model.css
└── print-card.css
```

## Agregar o sustituir un modelo de carta

1. Coloca el `.glb` en `assets/ar/models/`.
2. Abre `js/ar/cards.js`.
3. Busca la entrada de la carta o crea una nueva.
4. Configura `model`, `modelScale`, `baseZ`, `markerImage` y los datos de la carta.
5. Si el modelo incluye clips de animación, activa `features.animations`.

Ejemplo conceptual:

```js
'nueva-carta': {
  id: 'nueva-carta',
  name: 'Nombre',
  targetImage: 'assets/cards/nueva-carta-back.png',
  model: 'assets/ar/models/nuevo-modelo.glb',
  modelScale: 0.4,
  baseZ: 0.2,
  features: {
    animations: true,
    info: true,
    narration: true,
    video: true,
    effects: true
  }
}
```

## Animaciones GLB

`js/ar/card-viewer.js` ya crea `THREE.AnimationMixer` cuando el GLB contiene `animations`. Actualmente el botón **Animar** usa la animación embebida si existe y mantiene un movimiento de respaldo para modelos sin clip.

Para múltiples animaciones conviene extender la configuración con nombres de clips:

```js
animations: {
  celebration: 'Celebrate',
  dance: 'Dance',
  idle: 'Idle'
}
```

Después se puede resolver cada nombre contra `gltf.animations` y conectar botones separados.

## Información, narración y rotación

La pantalla de carta ya tiene un panel **Info** que muestra biografía y estadísticas. Para la siguiente etapa:

- Mantener el panel dentro de `ar-carta.html` para conservar el mismo lenguaje visual.
- Al abrir información, activar una rotación 360° usando el `modelPivot` existente.
- Para narración, preferir archivos en `assets/ar/audio/` o Web Speech API como respaldo.
- Añadir control de pausa y volumen si se incorpora audio largo.

## Video dentro de AR

Guardar el archivo en `assets/ar/videos/` y asociarlo desde la configuración de la carta. La opción recomendada es un panel/modal superpuesto a la cámara en vez de insertar video directamente como textura del modelo en la primera iteración.

## Efectos visuales

El visor actual ya tiene un sistema de confeti/partículas de ejemplo. Para efectos nuevos:

- colocar sprites/texturas en `assets/ar/effects/`;
- mantener el código de partículas dentro de `js/ar/card-viewer.js` o extraerlo después a `js/ar/effects.js` si crece;
- evitar que el efecto tape completamente el marcador, porque MindAR necesita conservar el reconocimiento.

## Targets / marcadores

Las cartas actuales pueden compilar el target en navegador a partir de la imagen configurada. Si más adelante se compilan archivos `.mind` previamente, colócalos en `assets/ar/targets/` y usa `mindFile` en `js/ar/cards.js` para evitar recompilar cada vez.

## Premio

El concepto de recompensa ya no está limitado al trofeo. `js/collection/rewards.js` registra la carta y si cuenta con AR. En una etapa posterior puede ampliarse a:

- carta;
- experiencia AR;
- insignia;
- video o contenido histórico;
- modelo 3D especial.

Conviene mantener la recompensa como datos y no crear un HTML diferente por cada premio.

## Recomendación de trabajo en equipo

Antes de modificar el motor AR, registrar la experiencia en `js/ar/cards.js`. Así el resto del sitio puede saber qué carta tiene AR sin depender de detalles internos de Three.js/MindAR.
