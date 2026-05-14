/**
 * Stub locale files for German and Spanish.
 * These return English strings until proper translations are provided.
 * Add translations gradually — only keys present here will override English.
 */
import type {TranslationDict} from './en';
import {en} from './en';

export const de: TranslationDict = {
  ...en,
  nav: {
    ...en.nav,
    docs: 'Dokumentation',
    blog: 'Blog',
    miniGames: 'Mini-Spiele',
    settings: 'Einstellungen',
    signIn: 'Anmelden',
    signOut: 'Abmelden',
  },
  settings: {
    ...en.settings,
    title: 'Einstellungen',
    eyebrow: 'Einstellungen',
    subtitle: 'Verwalten Sie Ihre Website-Präferenzen.',
    saved: 'Einstellungen erfolgreich gespeichert.',
    save: 'Speichern',
    language: 'Sprache',
  },
};
