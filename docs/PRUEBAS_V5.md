# Validación técnica — StrikeZone v5

Antes de empaquetar esta entrega se realizaron las siguientes comprobaciones estáticas sobre la carpeta final:

- Sintaxis de todos los archivos JavaScript con `node --check`: **correcta**.
- Referencias locales `href/src` en HTML: **0 rutas faltantes**.
- IDs duplicados en HTML: **0**.
- Balance de llaves en CSS: **sin incidencias**.
- Navegación principal normalizada en las páginas públicas: **Inicio · Galería · Novedades · Historia · Estadísticas · Colección**.
- No quedan referencias activas a las rutas antiguas `filtros.html`, `js/nav.js`, `css/ar.css` ni `assets/models/`.

## Qué conviene probar en navegador/dispositivo

Las funciones que dependen de APIs o permisos del navegador deben validarse desde `localhost` o HTTPS en el equipo/dispositivo final:

1. Permiso de cámara en `foto-fan.html`.
2. Guardado de imágenes y videos en IndexedDB desde `editor-media.html`.
3. Exportación de video filtrado con `MediaRecorder` (el formato WebM depende del navegador).
4. Detección facial cuando `FaceDetector` esté disponible; existe fallback centrado si no lo está.
5. MindAR/Three.js con la tarjeta física y cámara real en `ar-carta.html`.
6. `<model-viewer>` en las experiencias de estadio, pelota y premio.

Los clips MP4 incluidos en Galería son demostrativos y están pensados para comprobar el flujo imagen/video → filtro → guardar/descargar; pueden sustituirse por los videos definitivos después.


## Recompensa de carta del minijuego
1. Inicia sesión y abre `juego.html`.
2. Completa 3,000 puntos antes de 45 segundos.
3. Verifica que la pantalla de resultado muestre una carta distinta de la seleccionada cuando exista otra disponible.
4. Entra a `cuenta.html#coleccion` y confirma que la carta esté desbloqueada.
5. Usa `Ver en AR` y `Ver tarjeta` desde la recompensa.
6. Repite el reto: mientras queden cartas `gameReward:true` sin desbloquear, se priorizarán las nuevas; después se permiten repetidas.
