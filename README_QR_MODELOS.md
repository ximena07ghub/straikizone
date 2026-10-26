# QR por modelo 3D · StrikeZone

## Cómo funciona
- Cada modelo GLB tiene un QR real único en `assets/qr/models/`.
- La imagen de seguimiento de MindAR está en `assets/ar/markers/`. Incluye el QR, un marco y el nombre del modelo para que tenga más detalles visuales que seguir.
- El mismo marcador aparece en el reverso de todas las cartas que usan ese modelo.
- `Ver AR` abre la experiencia de la carta (`ar-carta.html?card=...`) y carga el marcador QR correspondiente a su GLB.
- Cuando la cámara detecta el marcador, muestra el objeto. Cuando lo pierde, el grupo 3D se oculta.
- Si un lector QR normal escanea el código, el enlace abre `ar-carta.html?model=...` para ese modelo.

## Marcadores por modelo

| Modelo | Archivo GLB | QR / marcador | Cartas que lo usan |
|---|---|---|---|
| BATE | `bate.glb` | `assets/qr/models/bate.png` / `assets/ar/markers/bate.png` | Ichiro Suzuki, Ramiro Peña |
| CAMISA | `camisa.glb` | `assets/qr/models/camisa.png` / `assets/ar/markers/camisa.png` | Babe Ruth, Daniel Ríos, Miguel Flores |
| CASCO DE BASEBALL | `CASCO DE BASEBALL.glb` | `assets/qr/models/casco-de-baseball.png` / `assets/ar/markers/casco-de-baseball.png` | Aaron Judge |
| ESTADIO | `estadio.glb` | `assets/qr/models/estadio.png` / `assets/ar/markers/estadio.png` | Isaac Rodríguez, Henry Urrutia, Kennys Vargas |
| GORRA | `GORRA.glb` | `assets/qr/models/gorra.png` / `assets/ar/markers/gorra.png` | Derek Jeter |
| GUANTE | `guante.glb` | `assets/qr/models/guante.png` / `assets/ar/markers/guante.png` | Miguel Cabrera, Juan Navarrete |
| PELOTA | `pelota.glb` | `assets/qr/models/pelota.png` / `assets/ar/markers/pelota.png` | Didi Gregorius |
| PELOTA YADIER | `pelota-yadier.glb` | `assets/qr/models/pelota-yadier.png` / `assets/ar/markers/pelota-yadier.png` | Yadier Molina |
| TACHONES | `tachones.glb` | `assets/qr/models/tachones.png` / `assets/ar/markers/tachones.png` | Epitacio “La Mala” Torres |
| TARJETA HÉCTOR | `tarjeta_Hector.glb` | `assets/qr/models/tarjeta-hector.png` / `assets/ar/markers/tarjeta-hector.png` | Héctor Espino |
| TROFEO | `trofeo.glb` | `assets/qr/models/trofeo.png` / `assets/ar/markers/trofeo.png` | Shohei Ohtani, Arturo González, Manny Rodríguez, Wilmer Ríos |
| ZONA HOME | `zona_home.glb` | `assets/qr/models/zona-home.png` / `assets/ar/markers/zona-home.png` | Andrés Mora |

## Nota de impresión
Imprime el frente y el reverso al mismo tamaño. El marcador del reverso debe quedar plano, sin reflejos y con el QR completo visible. Para mejor seguimiento, apunta a la zona cuadrada completa que incluye el código y su marco, no solo a una esquina del QR.

## Publicación
Los QR abren `https://strikezonev4.netlify.app/ar-carta.html?model=<id>`. Si cambias el dominio de producción en Netlify, regenera los QR o actualiza las URLs en el script de generación.
