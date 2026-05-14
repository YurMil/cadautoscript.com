import type {TranslationDict} from './en';

export const de: TranslationDict = {
  nav: {
    docs: 'Dokumentation',
    blog: 'Blog',
    miniGames: 'Mini-Spiele',
    settings: 'Einstellungen',
    signIn: 'Anmelden',
    signOut: 'Abmelden',
    profile: 'Profil',
  },
  home: {
    heroTitle: 'Ingenieurwerkzeuge,\nfür den Browser gebaut',
    heroSubtitle:
      'Kostenlose Web-Dienstprogramme für Maschinenbauer — Rohrschneider, Blechwalzen, Gewindeatlas und mehr. Keine Installation erforderlich.',
    liveUtilities: 'Live-Dienstprogramme',
    runtime: 'Laufzeit',
    formats: 'Formate',
    launchApp: 'App starten',
    locked: 'Anmelden, um dieses Tool freizuschalten',
    signInToUnlock: 'Zum Freischalten anmelden',
    viewAll: 'Alle Dienstprogramme anzeigen',
    getAccess: 'Vollzugriff erhalten',
    free: 'Kostenlos',
    featuredTools: 'Ausgewählte Tools',
    allTools: 'Alle Tools',
    compactView: 'Kompakt',
    detailedView: 'Detailliert',
  },
  utility: {
    fullScreen: 'Vollbild',
    exitFullScreen: 'Vollbild beenden',
    hideInfo: 'Info ausblenden',
    showInfo: 'Info anzeigen',
    about: 'Über dieses Tool',
    keyActions: 'Hauptfunktionen',
    signInRequired: 'Anmeldung erforderlich',
    unlockTitle: 'Dieses Tool freischalten',
    unlockCopy:
      'Gäste können die ersten drei Tools öffnen. Melden Sie sich an, um {name} und den Rest des Katalogs zu starten.',
    checkingAccess: 'Zugang wird geprüft…',
    holdOn: 'Bitte warten',
    verifyingSession: 'Ihre Sitzung für {name} wird überprüft.',
    backToUtilities: 'Zurück zu den Web-Dienstprogrammen',
    macroCatalog: 'Makro-Katalog',
    viewFreeUtilities: 'Kostenlose Tools anzeigen',
  },
  settings: {
    title: 'Einstellungen',
    eyebrow: 'Einstellungen',
    subtitle: 'Verwalten Sie Ihre Website-Präferenzen und Personalisierung.',
    saved: 'Einstellungen erfolgreich gespeichert.',
    saving: 'Speichern...',
    save: 'Einstellungen speichern',
    loading: 'Einstellungen werden geladen...',
    errorLoad: 'Einstellungen konnten nicht geladen werden. Bitte erneut versuchen.',
    errorSave: 'Einstellungen konnten nicht gespeichert werden. Bitte erneut versuchen.',
    smartSorting: 'Intelligente Sortierung der Dienstprogramme auf der Startseite aktivieren',
    smartSortingHint: 'Dienstprogramme werden nach Ihrer Nutzungshäufigkeit sortiert.',
    theme: 'Standard-Design',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeAuto: 'Automatisch (System)',
    displayMode: 'Anzeigemodus für Dienstprogramme',
    displayCompact: 'Kompaktansicht',
    displayDetailed: 'Detailansicht',
    displayHint: 'Diese Option kann auch direkt von der Startseite aus umgeschaltet werden.',
    language: 'Oberflächensprache',
    languageHint: 'Wählen Sie die Sprache für die Website-Oberfläche.',
    fullscreen: 'Dienstprogramme im Vollbild öffnen',
    fullscreenHint:
      'Jedes von der Startseite geöffnete Dienstprogramm wird sofort im Vollbildmodus gestartet.',
    signInTitle: 'Anmelden, um die Einstellungen anzuzeigen',
    signInCopy:
      'Diese Seite ist geschützt. Starten Sie eine Sitzung, um Ihre persönlichen Einstellungen anzuzeigen oder zu bearbeiten.',
    returnHome: 'Zur Startseite',
    openSignIn: 'Anmelden',
  },
  auth: {
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    signOut: 'Abmelden',
    email: 'E-Mail',
    password: 'Passwort',
    continueWith: 'Weiter mit',
    orContinueWith: 'Oder weiter mit',
  },
  common: {
    loading: 'Laden...',
    learnMore: 'Mehr erfahren',
    close: 'Schließen',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    error: 'Fehler',
    success: 'Erfolgreich',
  },
  utilities: {
    'pipe-cutter': {
      name: 'Pipe Cutter Visualizer',
      description: 'Sattelschnitte vorschauen, Versätze einstellen und CNC-fertige DXF-Vorlagen exportieren.',
    },
    'shell-rolling': {
      name: 'Cylindrical Shell Rolling',
      description: 'Walzenabstand, Biegetoleranz und abgewickelte Längen nach EN / ASME berechnen.',
    },
    'metal-bending': {
      name: 'Sheet-metal Bending',
      description: 'K-Faktoren, Entlastungskerben und Biegeabzüge vor dem CAM-Programm simulieren.',
    },
    'thread-atlas': {
      name: 'Interactive Thread Atlas',
      description: 'ISO / UNC / UNF-Serien filtern, Bohrdurchmesser nachschlagen und Beschriftungen kopieren.',
    },
    'doc-parser': {
      name: 'PDF Number Extractor',
      description: 'QA-Seriennummern, BOM-IDs und Prüfnummern lokal per WASM hervorheben.',
    },
    'qr-nameplate': {
      name: '3D QR Nameplate',
      description: 'Geräteschilder mit QR-Codes modellieren; Dicke, Materialien und Gravur in Echtzeit vorschauen.',
    },
    'dxf-editor': {
      name: 'WebDXF Editor',
      description: 'DXF-Dateien im Browser zuschneiden, kommentieren und für schnelle QA-Prüfungen neu speichern.',
    },
    'pdf-master': {
      name: 'PDF Master',
      description: 'Zeichnungspakete neu anordnen, drehen und zu einem sauberen PDF zusammenführen — vollständig offline.',
    },
    'pdf-batch-signer': {
      name: 'PDF Batch Signer',
      description: 'Eine wiederverwendbare Unterschrift auf jede Seite mehrerer PDFs auf einmal aufstempeln.',
    },
    'qr-master': {
      name: 'QR Master',
      description: 'QR-/Barcodes scannen, benutzerdefinierte Codes generieren und den Scanverlauf lokal verwalten.',
    },
    'pdf-bom-extractor': {
      name: 'PDF BOM Extractor',
      description: 'Stücklistentabellen aus CAD-PDFs in saubere CSVs mit Masterberichtexport extrahieren.',
    },
    'file-renamer': {
      name: 'Batch File Renamer',
      description: 'Dateien massenweise mit Suchen/Ersetzen, Präfixen, Nummerierung und ZIP-Export umbenennen.',
    },
    'folder-structure-builder': {
      name: 'Folder Structure Builder',
      description: 'Ordnerbäume aus JSON oder ZIP entwerfen; bash/PowerShell-Skripte exportieren.',
    },
    'magnetic-level-gauge-configurator': {
      name: 'Magnetic Level Gauge',
      description: 'Verbindungen, Abmessungen und Optionen konfigurieren; PDF-Datenblatt exportieren.',
    },
    'bourdon-gauge-configurator': {
      name: 'Bourdon Gauge Configurator',
      description: 'Druckmessgeräte mit Bereichen, Anschlüssen und Zubehör konfigurieren; PDF exportieren.',
    },
    'industrial-thermometer-configurator': {
      name: 'Industrial Thermometer',
      description: 'Bimetallthermometer konfigurieren: Bereiche, Stäbe, Tauchhülsen; PDF-Datenblatt exportieren.',
    },
    'tube-sheet-generator': {
      name: 'Tube Sheet Generator',
      description: 'Rohrlochbilder anordnen und DXF- oder STEP-Dateien lokal exportieren.',
    },
    'webstep-viewer': {
      name: 'WebSTEP Viewer',
      description: 'STEP-Baugruppen inspizieren, Teile isolieren und Geometrie im Browser messen.',
    },
    'engineering-prompt-catalog': {
      name: 'Engineering Prompt Catalog',
      description: 'Prompt-Vorlagen für MSR, Maschinenbau und Beschaffung durchsuchen, filtern und exportieren.',
    },
    'business-calendar-generator': {
      name: 'Business Calendar',
      description: 'Jahreskalender mit regionalen Feiertagen erstellen und als PDF oder PNG exportieren.',
    },
    'react-table-editor': {
      name: 'React Table Editor',
      description: 'Tabellendaten mit CSV-/XLSX-Import und -Export öffnen, bearbeiten und validieren.',
    },
    'focus-planner': {
      name: 'Focus Planner',
      description: 'Aufgaben planen, eigenständige oder aufgabengebundene Timer ausführen und Analysen im lokalen Browser-Arbeitsbereich überprüfen.',
    },
    'blind-flange-calculator': {
      name: 'Blind Flange Calculator',
      description: 'PN-Klasse automatisch auswählen und EN 13445-3-Wanddicke mit Gewichtsschätzungen berechnen.',
    },
    'pressure-vessel-dished-end-calc': {
      name: 'Dished End Calculator',
      description: 'DIN 28011/28013-Böden dimensionieren, Stutzenbeschriftungen hinzufügen und QC-Arbeitsblatt drucken.',
    },
    'wikalog-analyzer': {
      name: 'WIKA Log Analyzer',
      description: 'WIKA CPG1500-Kalibriererprotokolle parsen, Messdaten prüfen und QC-Berichte lokal drucken.',
    },
  },
};
