---
sidebar_position: 1
---

# Descripción general de CAD AutoScript

CAD AutoScript es un hogar centrado en la documentación para macros de SolidWorks, calculadoras de fabricación y herramientas de control de calidad (QA). Este sitio está construido sobre **Docusaurus + MDX**, por lo que cada utilidad se documenta junto a su componente interactivo React.

## Qué hay aquí

- **Macros de SolidWorks** que cubren exportaciones de BOM, verificaciones de bloques de título y ayudantes de configuración.
- **Calculadoras web** que se ejecutan completamente en Chromium (Pipe Cutter, Shell Rolling, etiquetas QR y más).
- **Generadores de QA** para análisis de PDF, seguimiento de series y automatización de informes.
- **Notas de lanzamiento y recetas** para que los ingenieros de planta sepan cómo y cuándo usar cada herramienta.

:::tip Solo Chromium
Todas las utilidades se distribuyen como activos estáticos y requieren un navegador basado en Chromium (Chrome, Edge, Arc, etc.) con WebGL 2 y WebAssembly habilitados.
:::

## Inicio rápido para colaboradores

1. **Instalar dependencias**
   ```bash
   npm install
   ```
2. **Ejecutar la documentación localmente**
   ```bash
   npm start
   ```
3. **Editar contenido**
   - Las páginas de Markdown viven en `docs/`
   - Los componentes de React viven en `src/`
   - Los paquetes de utilidades independientes viven en `static/utility-apps/`
   - Los activos de la carcasa de utilidades compartidas viven en `static/utilities/`

Docusaurus recarga los cambios instantáneamente. Cuando estés listo para publicar, ejecuta `npm run build` y despliega la salida de `build/` en GitHub Pages.

## Incrustación de utilidades en vivo

MDX nos permite importar componentes de React o utilidades tipo iframe directamente dentro de las páginas de documentación. Consulta [Incrustación de calculadoras](utilities/embed-calculators.md) para ver un tutorial sobre cómo envolver aplicaciones `/utilities/*` o crear widgets de React personalizados.

## Qué sigue

Explora el [Catálogo de utilidades](./utilities/overview.mdx) para ver cada calculadora con especificaciones, estándares compatibles y enlaces de lanzamiento. Cada entrada explica cuándo usarla y cómo incrustarla dentro de MDX.
