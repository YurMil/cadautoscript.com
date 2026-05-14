import type {TranslationDict} from './en';

export const et: TranslationDict = {
  nav: {
    docs: 'Dokumentatsioon',
    blog: 'Blogi',
    miniGames: 'Minimängud',
    settings: 'Seaded',
    signIn: 'Logi sisse',
    signOut: 'Logi välja',
    profile: 'Profiil',
  },
  home: {
    heroTitle: 'Inseneririistad,\nveebilehitsejale loodud',
    heroSubtitle:
      'Tasuta veebirakendused mehaanikainseneridele — torulejad, silindrite valtsimisarvutus, keermeatlas ja palju muud. Ei vaja paigaldamist.',
    liveUtilities: 'Reaalajas tööriistad',
    runtime: 'Käitusaeg',
    formats: 'Formaadid',
    launchApp: 'Käivita rakendus',
    locked: 'Logi sisse, et see tööriist avada',
    signInToUnlock: 'Avamiseks logi sisse',
    viewAll: 'Vaata kõiki tööriistu',
    getAccess: 'Hangi täielik juurdepääs',
    free: 'Tasuta',
    featuredTools: 'Esiletõstetud tööriistad',
    allTools: 'Kõik tööriistad',
    compactView: 'Kompaktne',
    detailedView: 'Üksikasjalik',
  },
  utility: {
    fullScreen: 'Täisekraan',
    exitFullScreen: 'Välju täisekraanilt',
    hideInfo: 'Peida teave',
    showInfo: 'Kuva teave',
    about: 'Selle tööriista kohta',
    keyActions: 'Põhitoimingud',
    signInRequired: 'Sisselogimine on vajalik',
    unlockTitle: 'Ava see tööriist',
    unlockCopy:
      'Külalised saavad avada esimesed kolm tööriista. Logi sisse, et käivitada {name} ja ülejäänud kataloog.',
    checkingAccess: 'Juurdepääsu kontrollimine…',
    holdOn: 'Oota hetk',
    verifyingSession: 'Kontrollime sinu seansi kehtivust rakendusele {name}.',
    backToUtilities: 'Tagasi veebitööriistade juurde',
    macroCatalog: 'Makrokataloog',
    viewFreeUtilities: 'Vaata tasuta tööriistu',
  },
  settings: {
    title: 'Seaded',
    eyebrow: 'Eelistused',
    subtitle: 'Halda oma saidi eelistusi ja isikupärastamist.',
    saved: 'Seaded salvestati edukalt.',
    saving: 'Salvestamine...',
    save: 'Salvesta seaded',
    loading: 'Seadete laadimine...',
    errorLoad: 'Seadeid ei õnnestunud laadida. Palun proovi uuesti.',
    errorSave: 'Seadeid ei õnnestunud salvestada. Palun proovi uuesti.',
    smartSorting: 'Luba tööriistade nutikas sortimine avalehel',
    smartSortingHint: 'Tööriistad sorditakse sinu kasutussageduse alusel.',
    theme: 'Vaikimisi teema',
    themeLight: 'Hele',
    themeDark: 'Tume',
    themeAuto: 'Automaatne (süsteem)',
    displayMode: 'Tööriistade kuvamisrežiim',
    displayCompact: 'Kompaktne vaade',
    displayDetailed: 'Üksikasjalik vaade',
    displayHint: 'Seda valikut saab ka otse avalehelt vahetada.',
    language: 'Liidese keel',
    languageHint: 'Vali saidi liidese keel.',
    fullscreen: 'Ava tööriistad täisekraanirežiimis',
    fullscreenHint:
      'Iga avaleheküljelt avatud tööriist käivitatakse kohe täisekraanirežiimis.',
    signInTitle: 'Seadete vaatamiseks logi sisse',
    signInCopy:
      'See leht on kaitstud. Alusta seanssi, et vaadata või muuta oma isiklikke seadeid.',
    returnHome: 'Tagasi avalehele',
    openSignIn: 'Ava sisselogimine',
  },
  auth: {
    signIn: 'Logi sisse',
    signUp: 'Registreeru',
    signOut: 'Logi välja',
    email: 'E-post',
    password: 'Parool',
    continueWith: 'Jätka kasutajaga',
    orContinueWith: 'Või jätka kasutajaga',
  },
  common: {
    loading: 'Laadimine...',
    learnMore: 'Loe edasi',
    close: 'Sulge',
    cancel: 'Tühista',
    confirm: 'Kinnita',
    error: 'Viga',
    success: 'Edukalt',
  },
  utilities: {
    'pipe-cutter': {
      name: 'Pipe Cutter Visualizer',
      description: 'Eelvaatle sadulõikeid, reguleeri nihkeid ja ekspordi CNC-valmis DXF-mallid.',
    },
    'shell-rolling': {
      name: 'Cylindrical Shell Rolling',
      description: 'Arvuta valtsimissamm, paindetolerands ja laotus EN / ASME presetide järgi.',
    },
    'metal-bending': {
      name: 'Sheet-metal Bending',
      description: 'Simuleeri K-tegureid, leevendussooni ja paindevähendusi enne CAM-programmide lukustamist.',
    },
    'thread-atlas': {
      name: 'Interactive Thread Atlas',
      description: 'Filtreeri ISO / UNC / UNF seeriad, otsi puurimõõtmeid ja kopeeri tähistused.',
    },
    'doc-parser': {
      name: 'PDF Number Extractor',
      description: 'Tõsta esile QA seerianumbrid, BOM ID-d ja kontrollnumbrid lokaalselt WASM abil.',
    },
    'qr-nameplate': {
      name: '3D QR Nameplate',
      description: 'Modelleeri seadmete silte QR-koodidega; eelvaatle paksust, materjale ja graveeringut reaalajas.',
    },
    'dxf-editor': {
      name: 'WebDXF Editor',
      description: 'Lõika, annoteeeri ja salvesta DXF-faile brauseris kiireks QA-kontrolliks.',
    },
    'pdf-master': {
      name: 'PDF Master',
      description: 'Järjesta ümber, pööra ja ühenda joonisekomplekte puhtaks PDF-iks — täielikult võrguühenduseta.',
    },
    'pdf-batch-signer': {
      name: 'PDF Batch Signer',
      description: 'Templi korduvkasutatav allkiri igale lehele mitmes PDF-is korraga.',
    },
    'qr-master': {
      name: 'QR Master',
      description: 'Skanneeri QR-/vöötkoode, genereeri kohandatud koode ja halda skaneerimisajalugu lokaalselt.',
    },
    'pdf-bom-extractor': {
      name: 'PDF BOM Extractor',
      description: 'Eralda CAD PDF-idest BOM-tabelid puhtasse CSV-formaati koos koondraportiga.',
    },
    'file-renamer': {
      name: 'Batch File Renamer',
      description: 'Nimeta faile ümber otsimise/asendamise, eesliidete, nummerdamise ja ZIP-ekspordiga.',
    },
    'folder-structure-builder': {
      name: 'Folder Structure Builder',
      description: 'Kaustapuude kujundamine JSON-ist või ZIP-ist; bash/PowerShell-skriptide eksport.',
    },
    'magnetic-level-gauge-configurator': {
      name: 'Magnetic Level Gauge',
      description: 'Konfigureeri ühendused, mõõtmed ja valikud; ekspordi PDF-andmeleht.',
    },
    'bourdon-gauge-configurator': {
      name: 'Bourdon Gauge Configurator',
      description: 'Konfigureeri rõhumõõturid vahemike, ühenduste ja lisaseadmetega; ekspordi PDF.',
    },
    'industrial-thermometer-configurator': {
      name: 'Industrial Thermometer',
      description: 'Konfigureeri bimetaltermomeetreid: vahemikud, varred, termokaevud; ekspordi PDF-andmeleht.',
    },
    'tube-sheet-generator': {
      name: 'Tube Sheet Generator',
      description: 'Paiguta torude augumustrid ja ekspordi DXF- või STEP-failid lokaalselt.',
    },
    'webstep-viewer': {
      name: 'WebSTEP Viewer',
      description: 'Tutvu STEP-komplektidega, erista osi ja mõõda geomeetriat brauseris.',
    },
    'engineering-prompt-catalog': {
      name: 'Engineering Prompt Catalog',
      description: 'Sirvi, filtreeri ja ekspordi küsimuste malle instrumentatsiooni, masinaehituse ja hangete jaoks.',
    },
    'business-calendar-generator': {
      name: 'Business Calendar',
      description: 'Genereeri aastane kalender piirkondlike riigipühadega ja ekspordi PDF- või PNG-formaati.',
    },
    'react-table-editor': {
      name: 'React Table Editor',
      description: 'Ava, redigeeri ja valideeri tabeliandmeid CSV / XLSX impordiga ja ekspordiga.',
    },
    'focus-planner': {
      name: 'Focus Planner',
      description: 'Planeerida ülesandeid, käivita taimereid ja vaata analüütikat kohalikus brauseri tööruumis.',
    },
    'blind-flange-calculator': {
      name: 'Blind Flange Calculator',
      description: 'Vali automaatselt PN-klass ja arvuta EN 13445-3 seina paksus koos kaaluhinnangu.',
    },
    'pressure-vessel-dished-end-calc': {
      name: 'Dished End Calculator',
      description: 'Arvuta DIN 28011/28013 põhjad, lisa stutserite tähistused ja prindi QC-tööleht.',
    },
    'wikalog-analyzer': {
      name: 'WIKA Log Analyzer',
      description: 'Parseeri WIKA CPG1500 kalibreerimisloge, vaata mõõteandmeid ja prindi QC-raportid lokaalselt.',
    },
  },
};
