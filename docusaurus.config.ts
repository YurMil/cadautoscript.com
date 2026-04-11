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
  organizationName: 'biosxxx',
  projectName: 'cadautoscript.com',
  customFields: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    AUTH_REDIRECT_URL: process.env.AUTH_REDIRECT_URL,
  },
  onBrokenLinks: 'ignore',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'ignore',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  plugins: [
    async function myPlugin(_context, _options) {
      return {
        name: 'docusaurus-replicad-config',
        configureWebpack(_config, _isServer) {
          return {
            experiments: {
              asyncWebAssembly: true,
              layers: true,
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
          editUrl: 'https://github.com/biosxxx/cadautoscript.com/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/biosxxx/cadautoscript.com/tree/main/',
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
      disableSwitch: true,
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
        {to: '/blog', label: 'Blog', position: 'left'},
        {to: '/mini-games', label: 'Mini Games', position: 'left'},
        {type: 'custom-search', position: 'right'},
        {type: 'custom-support-button', position: 'right'},
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
            {label: 'Automation overview', to: '/docs/intro'},
            {label: 'Utility catalog', to: '/docs/utilities/overview'},
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
            {label: 'Blog', to: '/blog'},
            {label: 'GitHub', href: 'https://github.com/biosxxx/cadautoscript.com'},
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
