# Corrección AR por carta

La experiencia `ar-carta.html` ahora toma obligatoriamente el parámetro `?card=` y actualiza la interfaz antes de iniciar el módulo AR.

Los enlaces de `coleccion.html` y el premio del minijuego usan el `id` exacto de la carta cuando existe configuración en `STRIKEZONE_AR_CARDS`.

Ejemplos:
- `ar-carta.html?card=yadier-molina`
- `ar-carta.html?card=derek-jeter`
- `ar-carta.html?card=ichiro-suzuki`

No existe un jugador de respaldo automático para una carta válida.
