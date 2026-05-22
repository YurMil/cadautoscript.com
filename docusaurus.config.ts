import dotenv from 'dotenv';
dotenv.config({path: './.env.local'});

import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CAD AutoScript',
  tagline: 'SolidWorks macros, web calculators, and QA generators',
  favicon: 'img/favicon.ico',
  future: {
    v4: true,
  },
  url: 'https://cadautoscript.com',
  baseUrl: '/',
  trailingSlash: true,
  organizationName: 'YurMil',
  projectName: 'cadautoscript.com',
  customFields: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
  },
  onBrokenLinks: 'ignore',
  headTags: [
    {
      tagName: 'link',
      attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
    },
    {
      tagName: 'link',
      attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'},
    },
  ],
  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap',
      rel: 'stylesheet',
    },
  ],
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'ignore',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'ua', 'de', 'es', 'et'],
    localeConfigs: {
      en: {label: 'English', direction: 'ltr', htmlLang: 'en'},
      ru: {label: 'Русский', direction: 'ltr', htmlLang: 'ru'},
      ua: {label: 'Українська', direction: 'ltr', htmlLang: 'uk'},
      de: {label: 'Deutsch', direction: 'ltr', htmlLang: 'de'},
      es: {label: 'Español', direction: 'ltr', htmlLang: 'es'},
      et: {label: 'Eesti', direction: 'ltr', htmlLang: 'et'},
    },
  },
  plugins: [
    async function myPlugin(_context, _options) {
      return {
        name: 'docusaurus-replicad-config',
        configureWebpack(_config, _isServer) {
          return {
            // replicad-opencascadejs requires async-WebAssembly streaming.
            experiments: {
              asyncWebAssembly: true,
            },
            // Vendor wasm bindings reference __filename / __dirname. webpack 5
            // defaults to 'warn-mock', which mocks them AND emits a warning per
            // locale build. 'mock' keeps the same runtime behaviour silently.
            node: {
              __filename: 'mock',
              __dirname: 'mock',
            },
            resolve: {
              fallback: {
                crypto: false,
                fs: false,
                path: false,
              },
            },
          };
        },
      };
    },
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/YurMil/cadautoscript.com/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/YurMil/cadautoscript.com/tree/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
          ignorePatterns: ['/admin/**'],
        },
        theme: {
          customCss: ['./src/css/custom.css', './src/css/light-theme.css'],
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/cadautoscript-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
      disableSwitch: false,
    },
    navbar: {
      title: 'CAD AutoScript',
      logo: {
        alt: 'CAD AutoScript logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog/', label: 'Blog', position: 'left'},
        {to: '/mini-games/', label: 'Mini Games', position: 'left'},
        {type: 'custom-search', position: 'right'},
        {type: 'custom-support-button', position: 'right'},
        {type: 'custom-language-switcher', position: 'right'},
        {type: 'custom-theme-toggle', position: 'right'},
        {type: 'custom-navbar-auth', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Automation overview', to: '/docs/intro/'},
            {label: 'Utility catalog', to: '/docs/utilities/overview/'},
          ],
        },
        {
          title: 'Utilities',
          items: [
            {
              html: '<a class="footer__link-item" href="/utilities/pipe-cutter/" data-nobrokenlinkcheck>Pipe Cutter</a>',
            },
            {
              html: '<a class="footer__link-item" href="/utilities/cylindrical-shell-rolling/" data-nobrokenlinkcheck>Shell Rolling</a>',
            },
            {
              html: '<a class="footer__link-item" href="/utilities/interactive-thread/" data-nobrokenlinkcheck>Thread Atlas</a>',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Blog', to: '/blog/'},
            {label: 'GitHub', href: 'https://github.com/YurMil/cadautoscript.com'},
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} CAD AutoScript. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
