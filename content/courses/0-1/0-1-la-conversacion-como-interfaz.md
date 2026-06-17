---
slug: 0-1-la-conversacion-como-interfaz
---

**Objetivo:** entender que hablar con Claude es una conversación con memoria del hilo —no preguntas sueltas—, y aprovecharlo.

## La idea clara

Cada chat es un **hilo**, y dentro de ese hilo Claude recuerda lo que ya os habéis dicho. Por eso no tienes que repetir el contexto en cada mensaje: puedes ir construyendo encima.

Le pides algo, lo lee, y tú respondes con un ajuste: *"más corto"*, *"ahora en inglés"*, *"añade un ejemplo"*. Claude entiende que te refieres a lo anterior. Esa ida y vuelta es la forma normal —y la buena— de trabajar.

Ojo a una cosa importante: la memoria es **de ese hilo**. Si abres un chat nuevo, empieza de cero y no sabe nada de la conversación anterior. (Más adelante verás la memoria entre conversaciones y los Proyectos, que cambian esto a propósito.)

## Ejemplo

1. *"Escríbeme un haiku sobre el lunes por la mañana."*
2. *"Más melancólico."* → lo reescribe con ese tono.
3. *"Ponle un título."* → añade título sobre el mismo haiku.

No has repetido el haiku en ningún momento: el hilo lo recuerda.

## Errores comunes

- **Abrir un chat nuevo para cada pregunta relacionada.** Pierdes el contexto. Si es el mismo tema, sigue en el mismo hilo.
- **Esperar que recuerde otra conversación.** Por defecto, cada hilo es independiente.
- **Meterlo todo en un único mensaje kilométrico.** Mejor empieza con lo esencial y refina en los siguientes turnos.

## Para profundizar

- [Centro de ayuda de Claude](https://support.claude.com) (Anthropic)
