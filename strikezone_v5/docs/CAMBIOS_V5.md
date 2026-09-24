# Inventario de cambios — StrikeZone v5

Este documento indica qué se modificó respecto a `strikezone_v4`, qué se creó, qué se movió/reorganizó y qué se eliminó por ser duplicado o haber sido sustituido.

## Resumen funcional

- Navegación principal: **Inicio · Galería · Novedades · Historia · Estadísticas · Colección**.
- Galería actual pasa a ser multimedia: imágenes + videos con el mismo editor de filtros.
- La antigua galería de cartas se convierte en **Colección**.
- Trivia y minijuego se abren desde cartas como requisito de desbloqueo.
- AR deja de ser una opción principal de navegación y se abre desde cartas compatibles ya desbloqueadas.
- Perfil reúne cartas y medios guardados.
- Foto Fan incorpora cámara, accesorios temáticos y captura.
- Novedades se amplía y se mantiene independiente de Galería/Colección fuera de la navegación general.
- Se reduce el redondeo y se usa una estética más editorial, deportiva y limpia.

---

# 1. Archivos existentes modificados

| Archivo | Para qué sirve / cambio realizado |
|---|---|
| `index.html` | Landing completamente reorganizada. Da acceso a Galería, Novedades, Historia, Estadísticas y Colección; explica el flujo de cartas y AR. |
| `galeria.html` | Ya no contiene las cartas. Ahora es Galería multimedia con fotos, videos y acceso a Foto Fan. |
| `novedades.html` | Se amplió con bloque destacado, agenda de partidos y noticias en una jerarquía similar a la referencia, sin relacionarlo con Galería/Colección. |
| `historia-beisbol.html` | Se convierte en la ruta de historia general del béisbol y enlaza a la historia del equipo mediante navegación secundaria. |
| `historia-equipo.html` | Queda como ruta específica de Sultanes de Monterrey. |
| `estadisticas.html` | Se normalizó el archivo real y se rediseñó la tabla y sus módulos de contexto. |
| `cuenta.html` | Se convierte en “Mi perfil”; muestra resumen de colección y medios guardados. |
| `login.html` | Nuevo diseño y soporte para regresar a la acción que requería iniciar sesión mediante `?next=`. |
| `registro.html` | Nuevo diseño; conserva registro local simulado y retorno mediante `?next=`. |
| `mis-fotos.html` | Evoluciona a “Mis medios”: admite imágenes, videos filtrados y Foto Fan. |
| `trivia.html` | Se convierte en reto contextual de colección, con progreso y retroalimentación inmediata. |
| `juego.html` | Se reorganiza el reto de bateo y se conecta con recompensas/cartas. |
| `ar-carta.html` | Se conserva MindAR, se cambia el regreso hacia Colección y se agrega panel Info y controles preparados para evolución. |
| `ar.html` | Se mantiene como **centro técnico AR**, fuera de la navegación pública principal. |
| `ar-estadio.html` | Se actualizan rutas de modelos, navegación y estructura organizada de JS/CSS. |
| `ar-pelota.html` | Se actualizan rutas de modelos, navegación y estructura organizada de JS/CSS. |
| `ar-premio.html` | Se mantiene como prueba técnica/recompensa futura y se actualizan rutas. |
| `escaner.html` | Se conserva como herramienta técnica QR y se actualizan rutas. |
| `tarjeta-provisional.html` | Regresa a Colección y usa los archivos AR reorganizados. |
| `css/base.css` | Nuevo sistema visual global: navegación completa, botones, cards con menor radio, espaciado, responsive y feedback. |
| `css/index.css` | Nueva composición del landing page. |
| `css/gallery.css` | Ahora da estilo a la Galería multimedia, medios editables y bloque Foto Fan. |
| `css/simple.css` | Se reutiliza como estilo específico de Novedades. |
| `css/history.css` | Rediseño de historia general/equipo y líneas de tiempo. |
| `css/stats.css` | Nueva tabla responsive y tarjetas estadísticas. |
| `css/auth.css` | Nuevo layout de login/registro. |
| `css/trivia.css` | Nueva interfaz de trivia con estados correcto/incorrecto y progreso. |
| `css/game.css` | Nueva interfaz del minijuego con marcador y campo más claro. |

---

# 2. Archivos nuevos

## Páginas

| Archivo | Para qué sirve |
|---|---|
| `coleccion.html` | Reemplaza la función que antes tenía `galeria.html`: cartas, categorías, retos, recompensas y acceso a AR. Integra Swiper con fallback. |
| `editor-media.html` | Editor común para imágenes y videos de la Galería. |
| `foto-fan.html` | Cámara temática para aficionados con casco, gorra y pintura facial visual. |

## CSS

| Archivo | Para qué sirve |
|---|---|
| `css/collection.css` | Estilos del carrusel/Swiper de cartas y reversos. |
| `css/media.css` | Estilos del editor, Foto Fan, Mis medios y Perfil. |
| `css/ar/card.css` | CSS de la experiencia MindAR de carta, movido y mejorado. |
| `css/ar/hub.css` | CSS del centro técnico AR. |
| `css/ar/model.css` | CSS compartido de experiencias `<model-viewer>`. |
| `css/ar/print-card.css` | CSS de tarjeta imprimible. |

## JavaScript — núcleo

| Archivo | Para qué sirve |
|---|---|
| `js/core/nav.js` | Navegación responsive y estado de cuenta. |
| `js/core/feedback.js` | Toasts visuales y sonido corto de interacción. |
| `js/core/session.js` | Utilidad para consultar/requerir sesión y volver a la acción original. |
| `js/core/auth.js` | Login/registro simulado con `localStorage`. |
| `js/core/account.js` | Renderiza perfil, conteos y colección guardada. |

## JavaScript — colección y retos

| Archivo | Para qué sirve |
|---|---|
| `js/collection/players.js` | Datos de jugadores/cartas, reorganizados desde `js/players.js`. |
| `js/collection/collection.js` | Renderiza cartas, filtra categorías, controla Swiper y bloqueos. |
| `js/collection/rewards.js` | Centraliza cartas desbloqueadas y recompensas. |
| `js/challenges/trivia.js` | Lógica de trivia, feedback y desbloqueo. |
| `js/challenges/game.js` | Lógica del reto de bateo y desbloqueo. |

## JavaScript — multimedia

| Archivo | Para qué sirve |
|---|---|
| `js/media/gallery.js` | Filtros de visualización de Galería y preview de videos al pasar el cursor. |
| `js/media/editor.js` | Motor Canvas de filtros para imagen y video; exporta video con `MediaRecorder`. |
| `js/media/fan-camera.js` | Cámara Fan, accesorios visuales, intento de detección facial y captura. |
| `js/media/photo-db.js` | IndexedDB para imágenes y videos guardados. |
| `js/media/profile-media.js` | Lista, reproduce, descarga y elimina medios guardados. |

## JavaScript — AR reorganizado

| Archivo | Para qué sirve |
|---|---|
| `js/ar/cards.js` | Registro/configuración de cartas AR; incluye `features` para futuras animaciones, info, narración, video y efectos. |
| `js/ar/card-viewer.js` | Motor MindAR + Three.js de la carta. |
| `js/ar/model-viewer.js` | Acciones comunes para modelos de superficie. |
| `js/ar/qr.js` | Lógica QR. |
| `js/ar/scanner.js` | Escáner QR. |
| `js/ar/card-print.js` | Selección y render de la tarjeta imprimible. |

## Assets multimedia nuevos

| Archivo | Para qué sirve |
|---|---|
| `assets/media/gallery/gallery-hero.jpg` | Hero visual de Galería/Landing. |
| `assets/media/gallery/yadier-molina.jpg` | Imagen editable local de Yadier. |
| `assets/media/gallery/ichiro-suzuki.jpg` | Imagen editable local de Ichiro. |
| `assets/media/gallery/derek-jeter.jpg` | Imagen editable local de Jeter. |
| `assets/media/gallery/hector-espino.jpg` | Imagen editable local de Héctor Espino. |
| `assets/media/gallery/yadier-highlight.mp4` | Clip demostrativo local para validar filtros de video. |
| `assets/media/gallery/ichiro-highlight.mp4` | Clip demostrativo local para validar filtros de video. |
| `assets/media/gallery/jeter-highlight.mp4` | Clip demostrativo local para validar filtros de video. |

> Los videos son material demostrativo generado a partir de los assets del propio proyecto para validar edición/exportación. Pueden sustituirse por videos finales manteniendo las mismas rutas o actualizando los enlaces de `galeria.html`.

## Documentación nueva

| Archivo | Para qué sirve |
|---|---|
| `README.md` | Guía general de v5 y forma recomendada de ejecutar el proyecto. |
| `docs/CAMBIOS_V5.md` | Este inventario. |
| `docs/AR_DESARROLLO.md` | Guía para que otro integrante agregue modelos, animaciones, audio, videos y efectos. |
| `docs/ELIMINADOS_V5.txt` | Lista corta de archivos sustituidos/eliminados. |

---

# 3. Archivos movidos / reorganizados

Estos archivos no se perdieron: se movieron para facilitar su localización.

| Antes | Ahora |
|---|---|
| `assets/models/estadio.glb` | `assets/ar/models/estadio.glb` |
| `assets/models/pelota.glb` | `assets/ar/models/pelota.glb` |
| `assets/models/pelota-yadier.glb` | `assets/ar/models/pelota-yadier.glb` |
| `assets/models/trofeo.glb` | `assets/ar/models/trofeo.glb` |
| `assets/models/README_MODELOS.txt` | `assets/ar/models/README_MODELOS.txt` |
| `assets/markers/README_MARCADORES.txt` | `assets/ar/targets/README_MARCADORES.txt` |
| `js/ar-cards.js` | `js/ar/cards.js` |
| `js/ar-carta.js` | `js/ar/card-viewer.js` |
| `js/ar-model.js` | `js/ar/model-viewer.js` |
| `js/ar-qr.js` | `js/ar/qr.js` |
| `js/scanner.js` | `js/ar/scanner.js` |
| `js/tarjeta-provisional.js` | `js/ar/card-print.js` |
| `css/ar-carta.css` | `css/ar/card.css` |
| `css/ar.css` | `css/ar/hub.css` |
| `css/model-ar.css` | `css/ar/model.css` |
| `css/tarjeta-provisional.css` | `css/ar/print-card.css` |
| notas/README AR de la raíz | `docs/legacy/` |

Además se reservaron:

- `assets/ar/audio/`
- `assets/ar/videos/`
- `assets/ar/effects/`
- `assets/ar/targets/`

para el trabajo futuro del compañero que integrará modelos animados y contenido interactivo.

---

# 4. Archivos eliminados por reemplazo o duplicidad

## HTML

- `ar_formatted.html`
- `ar_nuevo.html`
- `cuenta_formatted.html`
- `escaner_formatted.html`
- `estadisticas_formatted.html`
- `filtros_formatted.html`
- `index_formatted.html`
- `filtros.html` — sustituido por `galeria.html` + `editor-media.html` + `foto-fan.html`.

## JavaScript raíz reemplazado/reorganizado

- `js/account.js`
- `js/auth.js`
- `js/filters.js`
- `js/gallery.js`
- `js/game.js`
- `js/nav.js`
- `js/photo-db.js`
- `js/photos.js`
- `js/players.js`
- `js/trivia.js`

Los scripts AR antiguos de raíz también se quitaron después de moverlos a `js/ar/`.

## CSS sin uso o movido

- `css/filters.css`
- `css/photos.css`
- `css/team-zone.css`

Los CSS AR antiguos se retiraron de la raíz después de moverlos a `css/ar/`.

---

# 5. Notas de implementación

### Filtros

El editor utiliza Canvas y permite los mismos filtros para imagen y video. En video, los cuadros se renderizan continuamente y la exportación usa `canvas.captureStream()` + `MediaRecorder`.

### Foto Fan

Usa `getUserMedia`. Si `FaceDetector` está disponible, se intenta seguir el rostro; si no, se usa un encuadre centrado para que el flujo siga siendo demostrable.

### Swiper

`coleccion.html` carga Swiper desde CDN. `js/collection/collection.js` incluye un fallback horizontal si la librería no puede cargarse.

### AR

No se borraron las experiencias anteriores. Se reorganizaron como herramientas técnicas y el acceso público a AR se trasladó a las cartas desbloqueadas. `ar.html` queda disponible para pruebas del equipo.

### Tailwind / Bootstrap

No se agregó Bootstrap ni un build de Tailwind en esta versión. El rediseño usa CSS modular propio para mantener el proyecto estático y evitar introducir un pipeline de compilación. Si más adelante el equipo adopta Tailwind, la estructura de páginas y módulos JS ya está separada para que ese cambio sea visual y no de lógica.
