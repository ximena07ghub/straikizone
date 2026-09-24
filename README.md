# StrikeZone v5

Rediseño de la versión `strikezone_v4` enfocado en navegación clara, coherencia visual de béisbol, multimedia editable, colección de cartas, retos y una arquitectura AR preparada para crecer.

## Abrir el proyecto

Sirve la carpeta con un servidor web local (recomendado para cámara, IndexedDB, módulos y AR):

```bash
python -m http.server 8000
```

Después abre `http://localhost:8000/`.

> La cámara, algunas APIs de navegador y las experiencias AR funcionan mejor desde `localhost` o HTTPS. Abrir los HTML directamente con `file://` puede limitar permisos.

## Navegación principal

- `index.html` — landing page.
- `galeria.html` — galería multimedia de imágenes y videos editables.
- `novedades.html` — módulo editorial de novedades.
- `historia-beisbol.html` — historia general del béisbol.
- `historia-equipo.html` — historia de Sultanes de Monterrey.
- `estadisticas.html` — estadísticas del corte incluido en el proyecto.
- `coleccion.html` — cartas, retos, recompensas y acceso a AR de cartas desbloqueadas.
- `cuenta.html` — perfil con colección y medios guardados.

## Galería y filtros

`editor-media.html` usa el mismo motor de Canvas para imágenes y video. Incluye:

- Desenfoque
- Pixelado
- Cámara térmica
- Ajuste de color
- Pastel
- Suavizado
- Alta saturación

No se incluyeron blanco y negro, escala de grises, sepia, exposición ni colores invertidos.

En imágenes, el resultado puede guardarse o descargarse como JPG. En video, el lienzo filtrado se exporta como WebM mediante `MediaRecorder`; los clips demostrativos incluidos son cortos para facilitar la validación del flujo.

## Foto Fan

`foto-fan.html` ofrece casco, gorra y pintura de afición. Si el navegador implementa `FaceDetector`, el accesorio intenta seguir el rostro; en caso contrario se usa un ajuste centrado. La captura puede guardarse en el perfil o descargarse.

## Perfil y almacenamiento

- Login/registro: simulación con `localStorage`.
- Cartas: `localStorage` (`strikezoneCollection`, `strikezoneRewards`).
- Imágenes y videos guardados: IndexedDB (`strikezone-media`).
- Guardar en el perfil requiere sesión; descargar no.

## Colección y retos

La colección usa Swiper cuando la librería CDN está disponible y tiene un modo de respaldo horizontal si no carga. Trivia y minijuego se abren desde las cartas que los requieren, no desde la navegación principal.

Flujo previsto:

`Colección → carta → login si hace falta → trivia/minijuego → recompensa → Mi perfil → carta → AR`

## AR

La experiencia de carta se mantiene con MindAR + Three.js. Los modelos de superficie continúan con `<model-viewer>`.

Los recursos 3D ahora viven en `assets/ar/models/` y el código relacionado en `js/ar/`. Revisa `docs/AR_DESARROLLO.md` antes de agregar modelos, animaciones, narración, videos o efectos.

## Swiper y framework visual

Para evitar introducir un proceso de compilación adicional en esta entrega, el rediseño visual usa un sistema CSS propio y modular. Swiper sí se integra para la colección. Tailwind puede incorporarse después si el equipo decide añadir un pipeline de build, pero no es requisito para mantener este proyecto estático.

## Documentación

- `docs/CAMBIOS_V5.md` — inventario de archivos modificados, nuevos, movidos y eliminados.
- `docs/AR_DESARROLLO.md` — guía para que otro integrante continúe las mejoras AR.
- `docs/legacy/` — documentación histórica de la v4, conservada fuera de la raíz para no perderla.
