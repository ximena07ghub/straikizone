# StrikeZone Build v2

## Navegación
- index.html — portada
- galeria.html — cartas (leyendas, capitanes, internacionales)
- historia-beisbol.html — línea del tiempo
- historia-equipo.html — equipo + estadio
- estadisticas.html — LMB Zona Norte 2026 (snapshot)
- novedades.html — editorial
- trivia.html — flujo de leyendas
- juego.html — flujo internacionales
- filtros.html — estructura de procesamiento de imágenes
- ar.html — visor GLB / AR de superficie
- ar-marcador.html — MindAR para escaneo de imágenes

## GLB
Copia en assets/models:
- estadio.glb
- pelota.glb
- trofeo.glb

## Marcadores
Genera assets/markers/targets.mind con 3 imágenes en este orden:
0. Héctor Espino
1. Ichiro Suzuki
2. Imagen del estadio

## Importante
Usa VS Code + Live Server o cualquier servidor localhost. La cámara y model-viewer no deben probarse con file://.

## Jugadores
Todos están definidos en js/players.js. Las estadísticas no verificadas se muestran con guiones en lugar de inventar datos.
