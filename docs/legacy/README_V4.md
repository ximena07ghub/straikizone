# StrikeZone Build v4

## Qué ya funciona

- Navegación unificada con logo original, inicio de sesión y registro.
- Home reacomodado sin círculo de fondo; imagen del lanzador con realce suave al pasar el cursor.
- Galería horizontal con swipe, reverso, estadísticas, colección y QR en cartas que ya tienen experiencia 3D asignada.
- Trivia: 3/3 desbloquea una Leyenda y guarda la carta en `strikezoneCollection`.
- Minijuego: 45 segundos, 3 strikes, dificultad creciente, meta de 3,000 puntos y desbloqueo de la carta internacional.
- Cámara y filtros en tiempo real: Original, Desenfoque, Pixelado, Térmico, Ajuste de color y Pastel.
- Captura, guardado local (IndexedDB), descarga y ventana `mis-fotos.html`.
- Escáner QR con cámara en `escaner.html`.
- Pelota, estadio y trofeo en visor 3D con `<model-viewer>` y botón de AR para dispositivos compatibles.
- Giro 360°, rebote de pelota en la vista 3D y confeti de celebración.

## Modelos GLB

Colócalos siempre aquí:

```
assets/models/pelota.glb
assets/models/estadio.glb
assets/models/trofeo.glb
```

El proyecto ya incluye un GLB ligero de pelota de respaldo y los modelos de estadio/trofeo disponibles en esta revisión. Si quieres usar otro modelo, reemplaza el archivo conservando exactamente el mismo nombre; no tienes que cambiar HTML ni JavaScript.

## Códigos QR

Los QR estáticos incluidos apuntan al sitio usado en la revisión:

- `https://willowy-crisp-7d943a.netlify.app/ar-pelota.html`
- `https://willowy-crisp-7d943a.netlify.app/ar-estadio.html`
- `https://willowy-crisp-7d943a.netlify.app/ar-premio.html`

Cuando las páginas se abren desde otro dominio HTTP/HTTPS, `js/ar-qr.js` genera los QR con el dominio actual automáticamente.

## Cómo probar AR

1. Publica la carpeta completa en Netlify (HTTPS).
2. Abre `ar.html` en computadora y escanea uno de los QR con un teléfono, o abre `escaner.html` desde un teléfono y apunta a un QR impreso/en otra pantalla.
3. En `ar-pelota.html` o `ar-estadio.html`, toca el botón **Ver ... en AR**.
4. Apunta a una superficie bien iluminada y coloca el modelo.

`model-viewer` usa WebXR/Scene Viewer/Quick Look según el dispositivo. La disponibilidad exacta depende del navegador y del teléfono.

## Partículas

No hace falta descargar un paquete de partículas para la celebración actual. Están creadas por CSS + JavaScript:

- `css/particles.css`
- `js/particles.js`

La función global es:

```js
window.strikezoneConfetti();
```

Se usa al ganar el minijuego/trivia y en `ar-premio.html`.

## Tecnologías del proyecto

- HTML5: estructura y navegación.
- CSS3: responsive, blur, transiciones, cards y animaciones.
- JavaScript Vanilla: carrusel, trivia, minijuego, filtros, almacenamiento y QR.
- Canvas API: procesamiento de cámara/video y exportación de fotos.
- MediaDevices / getUserMedia: cámara frontal/trasera.
- IndexedDB: almacenamiento local de capturas.
- localStorage: cuenta local y cartas desbloqueadas.
- `<model-viewer>`: visualización GLB y AR de superficie.
- html5-qrcode: lector QR dentro de la web.
- QRCode.js: generación de códigos según el dominio desplegado.

## Próximo nivel para el requisito de reconocimiento de imagen

El flujo QR ya es funcional. Si el profesor exige específicamente que una fotografía de la carta, y no un QR, sea el marcador, el siguiente paso es agregar MindAR y compilar las imágenes de cartas a `targets.mind`. Esto puede convivir con el flujo QR actual.

## Avance v4.1 · Carta física + MindAR + Three.js

Se agregó `ar-carta.html`, una experiencia reutilizable de image tracking. El QR abre una carta específica mediante `?card=...`, MindAR reconoce el frente físico y Three.js renderiza el GLB, el salto, giro/zoom y confeti 3D dentro del ancla AR.

Para esta entrega, Yadier Molina es la prueba principal. Derek Jeter e Ichiro Suzuki también quedaron configurados con foto, frente provisional y QR. Consulta `README_AR_MINDAR.md` para el flujo completo y para escalar después a 10 modelos propios.
