import type {TranslationDict} from './en';

export const ru: TranslationDict = {
  nav: {
    docs: 'Документация',
    blog: 'Блог',
    miniGames: 'Мини-игры',
    settings: 'Настройки',
    signIn: 'Войти',
    signOut: 'Выйти',
    profile: 'Профиль',
  },
  home: {
    heroTitle: 'Инженерные инструменты,\nсозданные для браузера',
    heroSubtitle:
      'Бесплатные веб-утилиты для инженеров-механиков — труборезы, вальцовка, атласы резьб и многое другое. Без установки.',
    liveUtilities: 'Утилит',
    runtime: 'Платформа',
    formats: 'Форматы',
    launchApp: 'Открыть',
    locked: 'Войдите, чтобы открыть утилиту',
    signInToUnlock: 'Войти',
    viewAll: 'Все утилиты',
    getAccess: 'Получить доступ',
    free: 'Бесплатно',
    featuredTools: 'Избранные инструменты',
    allTools: 'Все инструменты',
    compactView: 'Компакт',
    detailedView: 'Подробно',
  },
  utility: {
    fullScreen: 'На весь экран',
    exitFullScreen: 'Выйти из полноэкранного',
    hideInfo: 'Скрыть информацию',
    showInfo: 'Показать информацию',
    about: 'Об инструменте',
    keyActions: 'Основные функции',
    signInRequired: 'Требуется вход',
    unlockTitle: 'Откройте эту утилиту',
    unlockCopy:
      'Гости могут открыть первые три инструмента. Войдите, чтобы запустить {name} и остальной каталог.',
    checkingAccess: 'Проверка доступа…',
    holdOn: 'Подождите',
    verifyingSession: 'Проверяем вашу сессию для {name}.',
    backToUtilities: 'Назад к утилитам',
    macroCatalog: 'Каталог макросов',
    viewFreeUtilities: 'Бесплатные утилиты',
  },
  settings: {
    title: 'Настройки',
    eyebrow: 'Предпочтения',
    subtitle: 'Управление предпочтениями и персонализацией сайта.',
    saved: 'Настройки успешно сохранены.',
    saving: 'Сохранение...',
    save: 'Сохранить',
    loading: 'Загрузка настроек...',
    errorLoad: 'Не удалось загрузить настройки. Попробуйте снова.',
    errorSave: 'Не удалось сохранить настройки. Попробуйте снова.',
    smartSorting: 'Умная сортировка утилит на главной',
    smartSortingHint: 'Утилиты будут сортироваться по частоте использования.',
    theme: 'Тема оформления',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    themeAuto: 'Авто (системная)',
    displayMode: 'Режим отображения утилит',
    displayCompact: 'Компактный',
    displayDetailed: 'Подробный',
    displayHint: 'Этот параметр можно также переключать прямо на главной странице.',
    language: 'Язык интерфейса',
    languageHint: 'Выберите язык для интерфейса сайта.',
    fullscreen: 'Открывать утилиты в полноэкранном режиме',
    fullscreenHint: 'Любая утилита, открытая с главной, будет запускаться в полноэкранном режиме.',
    signInTitle: 'Войдите для просмотра настроек',
    signInCopy:
      'Страница защищена. Войдите, чтобы просматривать и редактировать личные настройки.',
    returnHome: 'На главную',
    openSignIn: 'Войти',
  },
  auth: {
    signIn: 'Войти',
    signUp: 'Регистрация',
    signOut: 'Выйти',
    email: 'Email',
    password: 'Пароль',
    continueWith: 'Продолжить с',
    orContinueWith: 'Или продолжить с',
  },
  common: {
    loading: 'Загрузка...',
    learnMore: 'Подробнее',
    close: 'Закрыть',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    error: 'Ошибка',
    success: 'Успешно',
  },
  utilities: {
    'pipe-cutter': {
      name: 'Pipe Cutter Visualizer',
      description: 'Предпросмотр пересечений труб, настройка смещений и экспорт DXF-шаблонов для ЧПУ.',
    },
    'shell-rolling': {
      name: 'Cylindrical Shell Rolling',
      description: 'Расчёт шага вальцевания, допуска на гибку и развёрток по стандартам EN / ASME.',
    },
    'metal-bending': {
      name: 'Sheet-metal Bending',
      description: 'Моделирование K-факторов, разгрузочных пазов и вычетов на гибку перед CAM-обработкой.',
    },
    'thread-atlas': {
      name: 'Interactive Thread Atlas',
      description: 'Фильтрация серий ISO / UNC / UNF, подбор диаметров свёрл и копирование обозначений.',
    },
    'doc-parser': {
      name: 'PDF Number Extractor',
      description: 'Выделение серийных номеров QA, кодов спецификаций и инспекционных номеров локально через WASM.',
    },
    'qr-nameplate': {
      name: '3D QR Nameplate',
      description: 'Моделирование шильдиков с QR-кодами; предпросмотр толщины, материалов и гравировки в реальном времени.',
    },
    'dxf-editor': {
      name: 'WebDXF Editor',
      description: 'Обрезка, аннотирование и пересохранение DXF-файлов в браузере для быстрой проверки QA.',
    },
    'pdf-master': {
      name: 'PDF Master',
      description: 'Перестановка, поворот и объединение чертежей в чистый PDF — полностью офлайн.',
    },
    'pdf-batch-signer': {
      name: 'PDF Batch Signer',
      description: 'Нанесение многоразовой подписи на каждую страницу нескольких PDF одновременно.',
    },
    'qr-master': {
      name: 'QR Master',
      description: 'Сканирование QR и штрихкодов, генерация пользовательских кодов и локальное управление историей.',
    },
    'pdf-bom-extractor': {
      name: 'PDF BOM Extractor',
      description: 'Извлечение таблиц спецификаций из CAD PDF в чистые CSV с экспортом сводного отчёта.',
    },
    'file-renamer': {
      name: 'Batch File Renamer',
      description: 'Массовое переименование файлов с поиском/заменой, префиксами, нумерацией и экспортом в ZIP.',
    },
    'folder-structure-builder': {
      name: 'Folder Structure Builder',
      description: 'Проектирование структуры папок из JSON или ZIP; экспорт bash/PowerShell скриптов.',
    },
    'magnetic-level-gauge-configurator': {
      name: 'Magnetic Level Gauge',
      description: 'Конфигурация соединений, размеров и опций; экспорт PDF-спецификации.',
    },
    'bourdon-gauge-configurator': {
      name: 'Bourdon Gauge Configurator',
      description: 'Настройка манометров с выбором диапазонов, соединений и аксессуаров; экспорт PDF.',
    },
    'industrial-thermometer-configurator': {
      name: 'Industrial Thermometer',
      description: 'Конфигурация биметаллических термометров: диапазоны, гильзы, стержни; экспорт PDF.',
    },
    'tube-sheet-generator': {
      name: 'Tube Sheet Generator',
      description: 'Разметка отверстий трубной доски и локальный экспорт DXF или STEP-файлов.',
    },
    'webstep-viewer': {
      name: 'WebSTEP Viewer',
      description: 'Просмотр STEP-сборок, изоляция деталей и измерение геометрии прямо в браузере.',
    },
    'engineering-prompt-catalog': {
      name: 'Engineering Prompt Catalog',
      description: 'Поиск, фильтрация и экспорт шаблонов промптов для инженерии, проектирования и закупок.',
    },
    'business-calendar-generator': {
      name: 'Business Calendar',
      description: 'Генерация годового календаря с региональными праздниками и экспорт в PDF или PNG.',
    },
    'react-table-editor': {
      name: 'React Table Editor',
      description: 'Открытие, редактирование и валидация табличных данных с импортом/экспортом CSV и XLSX.',
    },
    'focus-planner': {
      name: 'Focus Planner',
      description: 'Планирование задач, автономные таймеры и аналитика в локальном рабочем пространстве браузера.',
    },
    'blind-flange-calculator': {
      name: 'Blind Flange Calculator',
      description: 'Автовыбор класса PN и расчёт толщины по EN 13445-3 с оценкой массы.',
    },
    'pressure-vessel-dished-end-calc': {
      name: 'Dished End Calculator',
      description: 'Расчёт днищ по DIN 28011 / 28013, добавление выносок штуцеров и печать QC-листа.',
    },
    'wikalog-analyzer': {
      name: 'WIKA Log Analyzer',
      description: 'Разбор логов калибратора WIKA CPG1500, анализ данных измерений и локальная печать QC-отчётов.',
    },
  },
};
