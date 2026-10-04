# Recompensas de cartas coleccionables + AR

## Flujo

1. El jugador gana el reto de bateo en `juego.html`.
2. El sistema toma una carta marcada con `gameReward:true` en `js/collection/players.js` y que tenga AR (`arCard` o `ar`).
3. Primero elige cartas que todavía no estén desbloqueadas. Cuando ya están todas desbloqueadas, puede entregar una repetida.
4. La carta se guarda en `localStorage` mediante `js/collection/rewards.js`.
5. La pantalla de victoria muestra la carta, permite verla en AR y abrir su tarjeta imprimible.

## Para añadir otra recompensa AR

Agrega al jugador `gameReward:true` y define `arCard:'id-de-carta'`. Después crea su entrada en `js/ar/cards.js` con su propia imagen target, QR y ruta de modelo `.glb`.

Ejemplo de modelo:

```js
model: 'assets/ar/models/jugador-nuevo.glb'
```

El visor es el mismo: `ar-carta.html?card=jugador-nuevo`. El QR de cada carta debe apuntar a esa URL pública.

### Nota sobre los recursos actuales

El sistema queda preparado para rutas de modelos distintas por carta. En esta entrega los recursos de Jeter e Ichiro siguen usando el modelo 3D provisional existente del proyecto; sustituye esas rutas por sus `.glb` individuales cuando estén listos. Yadier conserva `pelota-yadier.glb`.
