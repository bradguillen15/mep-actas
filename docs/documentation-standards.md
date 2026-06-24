---
description: Estándares y buenas prácticas para la documentación técnica de este proyecto, incluyendo estructura, proceso de actualización y reglas de idioma.
globs:
alwaysApply: true
---
# Reglas y patrones para documentación y specs de IA

## Introducción
La documentación técnica abarca toda la documentación del proyecto: el modelo de datos, el README, las specs de API y demás documentos MD que describen cómo está estructurado, cómo corre y cómo opera el proyecto.
Las specs de IA son los documentos que explican a los agentes cómo comportarse, documentar, planificar, programar, etc.; incluyen acuerdos del equipo, estándares y convenciones.

## Reglas generales
- **ESCRIBE SIEMPRE EN ESPAÑOL (Costa Rica)**, incluyendo comentarios y cualquier explicación en los archivos. Aplica tanto al crear documentación nueva como al actualizar la existente, e incluye la documentación dentro del código (comentarios, explicaciones de funciones o campos). Es un producto del Gobierno de Costa Rica.
- Excepción: las palabras reservadas de lenguajes/frameworks y los nombres de paquetes de terceros se mantienen en su forma original.

## Documentación técnica
Antes de cualquier commit o git push, o si te piden documentar un commit, SIEMPRE debes revisar qué documentación técnica debería actualizarse.

Al actualizar la documentación:
1. Revisa todos los cambios recientes en el código.
2. Identifica qué archivos de documentación necesitan actualización según los cambios. Ejemplos claros:
   - Cambios en el modelo de datos: actualiza `docs/data-model.md` y el esquema de Drizzle.
   - Cambios de API: actualiza `docs/api-spec.yml`.
   - Cambios en librerías, migraciones de base de datos o cualquier cosa que altere la instalación: actualiza los `*-standards.md`.
3. Actualiza cada archivo afectado en español, manteniendo la consistencia con la documentación existente.
4. Asegura que la documentación esté bien formateada y siga la estructura establecida.
5. Verifica que todos los cambios se reflejen con precisión en la documentación.
6. Reporta qué archivos se actualizaron y qué cambios se hicieron.

## Specs de IA

Esta regla establece un proceso obligatorio para que la IA:
*   Aprenda de la retroalimentación, guía y sugerencias del usuario durante las interacciones.
*   Identifique proactivamente oportunidades para mejorar las reglas de desarrollo existentes a partir de esos aprendizajes.
*   Mantenga su asistencia alineada con las necesidades cambiantes del proyecto y las expectativas del usuario.
*   Incorpore la retroalimentación del usuario en su marco operativo para maximizar su valor.

Aplica después de cualquier interacción donde el usuario brinde retroalimentación explícita o implícita, sugerencias, correcciones, información nueva o preferencias. **La IA DEBE analizar activamente todas las interacciones en busca de estas oportunidades de aprendizaje, no solo esperar pasivamente la retroalimentación directa.**

### Errores comunes y antipatrones que la IA debe evitar

*   **Saltarse la aprobación:** Aplicar modificaciones de reglas sin obtener primero la revisión y aprobación explícita del usuario.
*   **Propuestas sin vínculo:** Proponer cambios de reglas sin conectarlos claramente con la retroalimentación específica o los aprendizajes de la interacción.
*   **Modificaciones imprecisas:** Sugerir cambios sin identificar con precisión qué regla o sección debe cambiar, dificultando la revisión.
*   **Retroalimentación desatendida:** No iniciar el proceso de aprendizaje y revisión cuando el usuario da retroalimentación relevante.
*   **Alcance excesivo:** Actualizar múltiples reglas no relacionadas a la vez o exceder el alcance de la retroalimentación recibida.
*   **Cambios no solicitados:** Modificar reglas proactivamente sin una conexión directa con la retroalimentación. Las actualizaciones deben ser reactivas y guiadas por la retroalimentación.
*   **Falta de confirmación:** No notificar al usuario tras implementar con éxito una modificación de regla aprobada.
