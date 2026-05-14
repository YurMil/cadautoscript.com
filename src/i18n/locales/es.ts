import type {TranslationDict} from './en';

export const es: TranslationDict = {
  nav: {
    docs: 'Documentación',
    blog: 'Blog',
    miniGames: 'Mini-juegos',
    settings: 'Configuración',
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    profile: 'Perfil',
  },
  home: {
    heroTitle: 'Herramientas de ingeniería,\nconstruidas para el navegador',
    heroSubtitle:
      'Utilidades web gratuitas para ingenieros mecánicos — cortadores de tubos, laminado, atlas de roscas y más. Sin instalación.',
    liveUtilities: 'Utilidades en vivo',
    runtime: 'Tiempo de ejecución',
    formats: 'Formatos',
    launchApp: 'Abrir aplicación',
    locked: 'Inicia sesión para desbloquear esta utilidad',
    signInToUnlock: 'Iniciar sesión para desbloquear',
    viewAll: 'Ver todas las utilidades',
    getAccess: 'Obtener acceso completo',
    free: 'Gratis',
    featuredTools: 'Herramientas destacadas',
    allTools: 'Todas las herramientas',
    compactView: 'Compacto',
    detailedView: 'Detallado',
  },
  utility: {
    fullScreen: 'Pantalla completa',
    exitFullScreen: 'Salir de pantalla completa',
    hideInfo: 'Ocultar información',
    showInfo: 'Mostrar información',
    about: 'Acerca de esta herramienta',
    keyActions: 'Acciones clave',
    signInRequired: 'Se requiere inicio de sesión',
    unlockTitle: 'Desbloquear esta utilidad',
    unlockCopy:
      'Los invitados pueden abrir las primeras tres herramientas. Inicia sesión para lanzar {name} y el resto del catálogo.',
    checkingAccess: 'Verificando acceso…',
    holdOn: 'Un momento',
    verifyingSession: 'Verificando tu sesión para {name}.',
    backToUtilities: 'Volver a las utilidades web',
    macroCatalog: 'Catálogo de macros',
    viewFreeUtilities: 'Ver utilidades gratuitas',
  },
  settings: {
    title: 'Configuración',
    eyebrow: 'Preferencias',
    subtitle: 'Administra tus preferencias del sitio y personalización.',
    saved: 'Configuración guardada correctamente.',
    saving: 'Guardando...',
    save: 'Guardar configuración',
    loading: 'Cargando tu configuración...',
    errorLoad: 'No se puede cargar la configuración. Inténtalo de nuevo.',
    errorSave: 'No se puede guardar la configuración. Inténtalo de nuevo.',
    smartSorting: 'Activar ordenación inteligente en la página principal',
    smartSortingHint: 'Las utilidades se ordenarán según tu frecuencia de uso.',
    theme: 'Tema predeterminado',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeAuto: 'Automático (Sistema)',
    displayMode: 'Modo de visualización',
    displayCompact: 'Vista compacta',
    displayDetailed: 'Vista detallada',
    displayHint: 'Esta opción también se puede alternar desde la página principal.',
    language: 'Idioma de la interfaz',
    languageHint: 'Elige el idioma para la interfaz del sitio.',
    fullscreen: 'Abrir utilidades en pantalla completa',
    fullscreenHint:
      'Cualquier utilidad abierta desde la página principal se lanzará en modo de pantalla completa.',
    signInTitle: 'Inicia sesión para ver la configuración',
    signInCopy:
      'Esta página está protegida. Inicia una sesión para ver o editar tu configuración personal.',
    returnHome: 'Volver al inicio',
    openSignIn: 'Abrir inicio de sesión',
  },
  auth: {
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    signOut: 'Cerrar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    continueWith: 'Continuar con',
    orContinueWith: 'O continuar con',
  },
  common: {
    loading: 'Cargando...',
    learnMore: 'Saber más',
    close: 'Cerrar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    error: 'Error',
    success: 'Éxito',
  },
  utilities: {
    'pipe-cutter': {
      name: 'Visualizador de corte de tubo',
      description: 'Previsualiza intersecciones de silla, ajusta desplazamientos y exporta plantillas DXF para CNC.',
    },
    'shell-rolling': {
      name: 'Laminado de cilindros',
      description: 'Calcula el espaciado de rodillos y las longitudes desarrolladas según presets EN / ASME.',
    },
    'metal-bending': {
      name: 'Doblado de chapa metálica',
      description: 'Simula factores K, alivios y deducciones de doblado antes de bloquear los programas CAM.',
    },
    'thread-atlas': {
      name: 'Atlas interactivo de roscas',
      description: 'Filtra series ISO / UNC / UNF, busca diámetros de brocas y copia denominaciones.',
    },
    'doc-parser': {
      name: 'Extractor de números PDF',
      description: 'Resalta números de serie QA, IDs de BOM y números de inspección localmente via WASM.',
    },
    'qr-nameplate': {
      name: 'Placa de identificación QR 3D',
      description: 'Modela etiquetas de equipos con QR; previsualiza grosor, materiales y grabado en tiempo real.',
    },
    'dxf-editor': {
      name: 'Editor WebDXF',
      description: 'Recorta, anota y guarda archivos DXF en el navegador para verificaciones rápidas de QA.',
    },
    'pdf-master': {
      name: 'PDF Master',
      description: 'Reordena, rota y fusiona paquetes de planos en un PDF limpio — totalmente sin conexión.',
    },
    'pdf-batch-signer': {
      name: 'Firmador de PDF en lote',
      description: 'Estampa una firma reutilizable en cada página de múltiples PDFs a la vez.',
    },
    'qr-master': {
      name: 'QR Master',
      description: 'Escanea QR/códigos de barras, genera códigos personalizados y gestiona el historial localmente.',
    },
    'pdf-bom-extractor': {
      name: 'Extractor de BOM en PDF',
      description: 'Extrae tablas BOM de PDFs CAD en CSVs limpios con exportación de informe maestro.',
    },
    'file-renamer': {
      name: 'Renombrador de archivos en lote',
      description: 'Renombra archivos masivamente con buscar/reemplazar, prefijos, numeración y ZIP.',
    },
    'folder-structure-builder': {
      name: 'Constructor de estructura de carpetas',
      description: 'Diseña árboles de carpetas desde JSON o ZIP; exporta scripts bash/PowerShell.',
    },
    'magnetic-level-gauge-configurator': {
      name: 'Medidor de nivel magnético',
      description: 'Configura conexiones, dimensiones y opciones; exporta una hoja de datos PDF.',
    },
    'bourdon-gauge-configurator': {
      name: 'Configurador de manómetro Bourdon',
      description: 'Configura manómetros con rangos, conexiones y accesorios; exporta PDF.',
    },
    'industrial-thermometer-configurator': {
      name: 'Termómetro industrial',
      description: 'Configura termómetros bimetálicos: rangos, vástagos, termopozo; exporta hoja de datos PDF.',
    },
    'tube-sheet-generator': {
      name: 'Generador de placas tubulares',
      description: 'Distribuye patrones de agujeros para tubos y exporta archivos DXF o STEP localmente.',
    },
    'webstep-viewer': {
      name: 'WebSTEP Viewer',
      description: 'Inspecciona ensamblajes STEP, aísla piezas y mide geometría en el navegador.',
    },
    'engineering-prompt-catalog': {
      name: 'Catálogo de prompts de ingeniería',
      description: 'Navega, filtra y exporta plantillas de prompts para I&C, diseño mecánico y adquisiciones.',
    },
    'business-calendar-generator': {
      name: 'Calendario de negocios',
      description: 'Genera un calendario anual con festivos regionales y exporta PDF o PNG.',
    },
    'react-table-editor': {
      name: 'Editor de tablas',
      description: 'Abre, edita y valida datos tabulares con importación y exportación CSV / XLSX.',
    },
    'focus-planner': {
      name: 'Focus Planner',
      description: 'Planifica tareas, ejecuta temporizadores y revisa análisis en un espacio de trabajo local en el navegador.',
    },
    'blind-flange-calculator': {
      name: 'Calculadora de brida ciega',
      description: 'Selecciona automáticamente la clase PN y calcula el espesor EN 13445-3 con estimaciones de peso.',
    },
    'pressure-vessel-dished-end-calc': {
      name: 'Calculadora de fondos de recipientes',
      description: 'Dimensiona fondos DIN 28011/28013, añade designaciones de boquillas e imprime una hoja QC.',
    },
    'wikalog-analyzer': {
      name: 'Analizador de registros WIKA',
      description: 'Analiza registros del calibrador WIKA CPG1500, revisa datos e imprime informes QC localmente.',
    },
  },
};
