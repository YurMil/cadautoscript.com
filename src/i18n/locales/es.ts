import type {TranslationDict} from './en';
import {en} from './en';

export const es: TranslationDict = {
  ...en,
  nav: {
    ...en.nav,
    docs: 'Documentación',
    blog: 'Blog',
    miniGames: 'Mini-juegos',
    settings: 'Configuración',
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
  },
  settings: {
    ...en.settings,
    title: 'Configuración',
    eyebrow: 'Preferencias',
    subtitle: 'Administre sus preferencias del sitio.',
    saved: 'Configuración guardada correctamente.',
    save: 'Guardar',
    language: 'Idioma',
  },
};
