# StrikeZone Build v3 — Index acomodado + estadio GLB + QR provisional

## 1) Modelo del estadio

El archivo del usuario `estadio2.glb` ya fue copiado y renombrado a:

`assets/models/estadio.glb`

Si después exportas una versión nueva del estadio, reemplaza ese archivo conservando el mismo nombre. No necesitas cambiar el HTML.

La página principal del estadio es:

`ar-estadio.html`

El componente que lo carga es:

```html
<model-viewer
  src="assets/models/estadio.glb"
  camera-controls
  auto-rotate
  ar
  ar-modes="webxr scene-viewer quick-look"
  ar-placement="floor"
  ar-scale="auto">
  <button slot="ar-button">Ver estadio en AR</button>
</model-viewer>
```

## 2) QR provisional

El QR aparece en `historia-equipo.html`.

- Si abres la web como `file:///...`, el QR muestra una URL provisional de GitHub Pages.
- Si publicas el proyecto en una URL `http://` o `https://`, `js/stadium-qr.js` genera el QR apuntando automáticamente a `ar-estadio.html` en ese mismo dominio.
- Para WebXR en teléfono se recomienda HTTPS.

Archivo que controla el QR:

`js/stadium-qr.js`

Fallback gráfico:

`assets/qr/estadio-provisional.png`

## 3) Cómo probar 3D en tu computadora

Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Abre:

`http://localhost:8000/ar-estadio.html`

Para Live Server en VS Code también funciona el visor 3D.

## 4) Cómo probar AR en el teléfono

Para una prueba real en el teléfono, publica la carpeta con HTTPS (por ejemplo GitHub Pages). Después:

1. Abre `historia-equipo.html` en la computadora.
2. Escanea el QR con el teléfono.
3. Se abre `ar-estadio.html`.
4. Pulsa `Ver estadio en AR`.
5. Mueve el teléfono para detectar el piso y coloca el estadio.

El QR es un detonador provisional. El requisito final de reconocimiento de imágenes se desarrollará en `ar-marcador.html` con MindAR y `assets/markers/targets.mind`.

## 5) Index

La portada usa:

`assets/players/hero-pitcher.png`

La composición se controla en:

`css/index.css`

El HTML está organizado en dos columnas: texto a la izquierda y visual del jugador a la derecha. `BASEBALL` está detrás del PNG mediante z-index.

## 6) Datos y contenidos

- `estadisticas.html`: standings reales de la Zona Norte 2026 como snapshot, más referencias de jugadores/equipos de LMB.
- `novedades.html`: contexto de la Serie de Campeonato del Norte y avances del proyecto.
- `historia-equipo.html`: diez clubes del Norte + modelo/QR de estadio.
- `historia-beisbol.html`: línea del tiempo ya conectada al presente de Zona Norte.
- `js/players.js`: ningún reverso queda vacío; cuando una cifra no está verificada se muestra como `SIMULACIÓN · PROTOTIPO`, nunca como dato oficial.
