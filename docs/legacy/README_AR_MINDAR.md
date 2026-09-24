# StrikeZone · avance AR con MindAR + Three.js

Este avance agrega una experiencia de **realidad aumentada basada en la tarjeta física** sin crear un HTML diferente por jugador.

## Flujo implementado

1. El reverso de la tarjeta contiene un QR.
2. El QR abre una URL como:

   ```
   ar-carta.html?card=yadier-molina
   ```

3. En el teléfono se toca **Activar cámara AR**.
4. Se voltea la tarjeta y se apunta al frente.
5. MindAR reconoce el frente provisional de la tarjeta.
6. Three.js coloca el modelo GLB sobre la tarjeta.
7. El usuario puede:
   - girar el modelo arrastrando;
   - acercar/alejar con pellizco;
   - lanzar el salto;
   - hacer un giro de 360°;
   - activar/desactivar confeti 3D;
   - reiniciar la transformación.

El confeti se crea como objetos 3D dentro del mismo `anchor` de MindAR; por eso queda anclado a la tarjeta y no es el confeti HTML de la versión anterior.

---

## ¿Dónde están Three.js y MindAR?

### `ar-carta.html`

Aquí se cargan las librerías desde CDN mediante `importmap`:

- `three` → motor 3D.
- `three/addons/` → `GLTFLoader` para cargar `.glb`.
- `mindar-image-three` → puente entre MindAR y Three.js.
- `mindar-image.prod.js` → se usa temporalmente para compilar el frente provisional de la tarjeta en el navegador.

### `js/ar-carta.js`

Este archivo contiene la lógica real de AR:

- inicia la cámara;
- prepara/carga el marcador;
- crea el `MindARThree`;
- carga el GLB con `GLTFLoader`;
- crea el ancla sobre la tarjeta;
- controla giro, zoom, salto y giro 360°;
- crea y anima el confeti 3D.

### `js/ar-cards.js`

Este es el catálogo de experiencias. Aquí se conecta cada QR con su tarjeta, imagen objetivo y modelo.

Por ahora existen:

- `yadier-molina`
- `derek-jeter`
- `ichiro-suzuki`

Los tres usan `assets/models/pelota.glb` como **modelo provisional**.

Cuando llegue un modelo propio, solo se cambia la propiedad `model` de la tarjeta correspondiente o se reemplaza `pelota.glb` conservando el nombre.

---

## Marcador provisional

Los frentes provisionales están en:

```
assets/cards/yadier-molina-front.png
assets/cards/derek-jeter-front.png
assets/cards/ichiro-suzuki-front.png
```

La página para imprimir frente y reverso es:

```
tarjeta-provisional.html?card=yadier-molina
```

También funcionan:

```
tarjeta-provisional.html?card=derek-jeter
tarjeta-provisional.html?card=ichiro-suzuki
```

Para esta entrega se recomienda usar **Yadier Molina** como prueba principal.

---

## QR

Los QR provisionales están en:

```
assets/qr/yadier-molina-ar.png
assets/qr/derek-jeter-ar.png
assets/qr/ichiro-suzuki-ar.png
```

Esos PNG apuntan al sitio Netlify usado en la versión anterior:

```
https://willowy-crisp-7d943a.netlify.app/
```

Cuando vuelvas a publicar esta carpeta completa en ese mismo sitio, el QR de Yadier abrirá:

```
https://willowy-crisp-7d943a.netlify.app/ar-carta.html?card=yadier-molina
```

`tarjeta-provisional.html` además genera el QR con el dominio actual cuando el proyecto ya está publicado, así que si más adelante cambia el dominio puedes imprimir nuevamente desde esa página.

---

## Importante: `.mind` provisional vs final

En esta revisión **no necesitas generar manualmente un `.mind` para probar**.

`js/ar-carta.js` toma el PNG del frente de la tarjeta y lo compila en el navegador la primera vez que inicias AR. Esto permite avanzar mientras los diseños finales todavía no existen.

Para la entrega final, cuando las 10 tarjetas ya tengan diseño definitivo, conviene hacer esto:

1. Compilar cada frente con el **Image Targets Compiler de MindAR**.
2. Guardar cada archivo, por ejemplo:

   ```
   assets/markers/yadier-molina.mind
   assets/markers/derek-jeter.mind
   ```

3. En `js/ar-cards.js`, cambiar:

   ```js
   mindFile: ''
   ```

   por:

   ```js
   mindFile: 'assets/markers/yadier-molina.mind'
   ```

El código detecta esa propiedad y deja de compilar en tiempo real. La carga será más rápida y adecuada para producción.

---

## Cómo crecer a 10 modelos sin crear 10 páginas

No copies `ar-carta.html` diez veces.

Agrega nuevas entradas a `js/ar-cards.js`:

```js
'nueva-carta': {
  id: 'nueva-carta',
  name: 'Nombre',
  team: 'Equipo',
  category: 'INTERNACIONAL',
  targetImage: 'assets/cards/nueva-carta-front.png',
  mindFile: 'assets/markers/nueva-carta.mind',
  model: 'assets/models/modelo-propio-04.glb',
  modelLabel: 'Nombre del modelo 3D',
  qr: 'assets/qr/nueva-carta-ar.png',
  stats: [['AVG','.000'],['HR','0'],['RBI','0'],['H','0']],
  bio: 'Texto de la tarjeta.',
  modelScale: 0.46,
  baseZ: 0.24
}
```

Su QR debe abrir:

```
ar-carta.html?card=nueva-carta
```

La misma página lee el parámetro `card` y carga lo que corresponde.

---

## Para probar en el teléfono

La cámara necesita HTTPS (o localhost en el mismo dispositivo).

Forma recomendada:

1. Sube/reemplaza la carpeta del proyecto en Netlify.
2. Abre `tarjeta-provisional.html?card=yadier-molina`.
3. Imprime el frente y reverso.
4. Escanea el QR del reverso con el teléfono.
5. Toca **Activar cámara AR**.
6. Voltea la tarjeta y apunta al frente.
7. Prueba **Saltar**, **Confeti**, **360°** y los gestos.

El modelo incluido sigue siendo provisional. Cuando tu compañero entregue la pelota propia en `.glb`, se sustituye sin rehacer el flujo AR.
