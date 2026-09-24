> HISTÓRICO: este documento describe la prueba anterior con el marcador azul. La entrega actual está documentada en `LEEME_ENTREGA_AR.md`.

# Corrección AR 01 — marcador precompilado

## Qué falló
La primera versión intentaba usar `window.MINDAR.Compiler` desde `mindar-image.prod.js`. La distribución de producción de MindAR 1.2.5 no expone el compilador de imágenes de esa forma. Por eso el teléfono mostraba “No cargó el compilador de MindAR”.

## Qué hace esta corrección
- `ar-carta.html` conserva MindAR + Three.js.
- Ya no compila una imagen en el teléfono.
- Las tres tarjetas provisionales usan temporalmente el target precompilado oficial de ejemplo de MindAR (`card.mind`).
- El frente imprimible muestra un recuadro azul/amarillo **AR PROVISIONAL** que corresponde a ese target.
- El QR sigue decidiendo qué tarjeta/modelo cargar; el marcador solo da la referencia espacial para colocar el objeto 3D.

## Cómo probar
1. Vuelve a desplegar toda la carpeta en Netlify.
2. En una computadora abre `tarjeta-provisional.html?card=yadier-molina`.
3. Desde el celular abre o escanea el QR.
4. Pulsa **Activar cámara AR** y concede permiso de cámara.
5. Apunta al recuadro azul/amarillo **AR PROVISIONAL** del frente de la tarjeta mostrada/impresa.
6. Al detectarlo deben aparecer el modelo y los controles.

## Cuando estén las tarjetas finales
No conservaremos el marcador azul/amarillo. Se compilará cada diseño final a `.mind` y se guardará en `assets/markers/`. Después `js/ar-cards.js` apuntará al `.mind` propio de cada tarjeta.
