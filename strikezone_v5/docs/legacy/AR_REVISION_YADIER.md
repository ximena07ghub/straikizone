# StrikeZone — entrega AR Yadier Molina

Esta versión integra el modelo propio `assets/models/pelota-yadier.glb` y elimina el cuadro azul/amarillo provisional.

## Tarjeta física
- Tamaño: 63.5 × 88.9 mm.
- Frente: `assets/cards/yadier-molina-front.png`.
- Reverso: estadísticas + instrucciones + QR de alto contraste.
- QR: `https://willowy-crisp-7d943a.netlify.app/ar-carta.html?card=yadier-molina`.
- Página para imprimir: `tarjeta-provisional.html?card=yadier-molina`.

IMPORTANTE: el frente que se imprime es exactamente la misma imagen que MindAR usa como target. Por eso, después de escanear el QR del reverso, se voltea la tarjeta y se apunta al frente completo.

## Flujo de la experiencia
1. Escanear el QR del reverso.
2. Abrir `ar-carta.html?card=yadier-molina`.
3. Pulsar **Activar cámara AR**.
4. Esperar unos segundos mientras MindAR prepara el reconocimiento del frente.
5. Voltear la tarjeta y apuntar al frente completo.
6. Aparece la pelota 3D propia.

## Interacción
- La pelota queda quieta al ser detectada.
- Toque corto en la escena o botón **Saltar**: salto vertical en pantalla y regreso a la misma posición.
- Un dedo: giro manual del modelo.
- Dos dedos: mover el modelo; gesto de pinza para acercar/alejar.
- **360°**: vuelta automática completa.
- **Confeti ON/OFF**: partículas 3D dentro de la escena AR.
- **Reiniciar**: restaura posición, escala, giro y confeti.

## Cómo se eliminó el marcador provisional
`ar-carta.html` carga el core de MindAR y `js/ar-carta.js` usa `window.MINDAR.IMAGE.Compiler` para preparar en memoria el frente de la tarjeta (`targetImage`). Después esa compilación se entrega a MindARThree mediante un Blob URL.

Esto permite usar la propia tarjeta como marcador sin mantener el recuadro azul. Para la versión final del proyecto, cuando estén cerrados los 10 diseños, conviene precompilar cada imagen a un archivo `.mind` para reducir el tiempo de inicio en el teléfono. La arquitectura ya deja el campo `mindFile` listo para ese cambio.

## Para la revisión
Publica la carpeta completa en el mismo sitio de Netlify. El QR está preparado para el dominio `willowy-crisp-7d943a.netlify.app`.

Al imprimir, usa escala 100 %. Puedes imprimir frente y reverso, recortarlos y pegarlos espalda con espalda para la prueba física.
