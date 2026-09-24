# Corrección AR 02 — Yadier Molina

## Cambios
- Se eliminó la sección “¿Cómo funciona?” del reverso y se reorganizó el QR en una sola columna.
- El QR queda grande, centrado y con instrucciones mínimas.
- El salto usa el eje vertical del target (`+Y`), por lo que la pelota sube y baja respecto a la tarjeta.
- Para compilar el frente de la tarjeta en el navegador se carga el core de MindAR 1.1.4, que expone `window.MINDAR.Compiler`.
- El tracking y render 3D siguen usando MindAR/Three 1.2.5 + Three.js 0.160.
- El modelo propio sigue en `assets/models/pelota-yadier.glb`.

## Prueba
1. Publica la carpeta completa en Netlify.
2. Imprime `tarjeta-provisional.html?card=yadier-molina`.
3. Escanea el QR del reverso.
4. Activa cámara. La primera compilación del frente puede tardar unos segundos.
5. Voltea la tarjeta y apunta al frente completo.
