---
sidebar_position: 1
---

# CAD AutoScript Übersicht

CAD AutoScript ist eine Dokumentations-fokussierte Plattform für SolidWorks Makros, Fertigungsrechner und QA-Tools. Diese Seite basiert auf **Docusaurus + MDX**, sodass jedes Utility direkt neben seiner interaktiven React-Komponente dokumentiert ist.

## Inhalt

- **SolidWorks Makros**, die BOM-Exporte, Title Block Prüfungen und Konfigurations-Helper abdecken.
- **Web-Rechner**, die vollständig in Chromium laufen (Pipe Cutter, Shell Rolling, QR-Tags und mehr).
- **QA-Generatoren** für PDF-Parsing, Serienverfolgung und Berichtsautomatisierung.
- **Versionshinweise und Anleitungen**, damit Ingenieure in der Werkstatt wissen, wie und wann sie jedes Tool verwenden sollten.

:::tip Nur Chromium
Alle Utilities sind als statische Assets gebündelt und setzen einen Chromium-basierten Browser (Chrome, Edge, Arc etc.) mit aktiviertem WebGL 2 und WebAssembly voraus.
:::

## Schnellstart für Mitwirkende

1. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```
2. **Docs lokal ausführen**
   ```bash
   npm start
   ```
3. **Inhalt bearbeiten**
   - Markdown-Seiten befinden sich unter `docs/`
   - React-Komponenten befinden sich unter `src/`
   - Standalone Utility-Bundles befinden sich unter `static/utility-apps/`
   - Geteilte Utility Shell Assets befinden sich unter `static/utilities/`

Docusaurus lädt Änderungen sofort neu. Wenn du bereit zur Veröffentlichung bist, führe `npm run build` aus und stelle den Inhalt von `build/` auf GitHub Pages bereit.

## Live-Utilities einbetten

MDX ermöglicht es uns, React-Komponenten oder iframe-ähnliche Utilities direkt in Dokumentationsseiten zu importieren. Siehe [Kalkulatoren einbetten](utilities/embed-calculators.md) für eine Anleitung zum Einbinden von `/utilities/*` Apps oder zum Erstellen maßgeschneiderter React-Widgets.

## Nächste Schritte

Durchsuche den [Utility-Katalog](./utilities/overview.mdx), um jeden Rechner mit Spezifikationen, unterstützten Standards und Launch-Links zu sehen. Jeder Eintrag erklärt, wann er zu verwenden ist und wie er in MDX eingebettet wird.
