import dotenv from 'dotenv';
dotenv.config({path: './.env.local'});

import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer';

// The site builds without Supabase credentials (Dependabot PRs run without
// repository secrets, and a missing value must not break the build) — but a
// real deploy without them ships with auth, comments and reactions disabled,
// so say so loudly in the build log.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  process.emitWarning(
    'SUPABASE_URL / SUPABASE_ANON_KEY are not set. Building without Supabase: ' +
      'authentication, comments, reactions and usage stats will be inactive ' +
      'in this build.',
    'SupabaseConfig',
  );
}

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
    TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY,
  },
  // CI sets DOCUSAURUS_ONBROKENLINKS=throw so broken links fail the build
  // there without slowing down local iteration.
  onBrokenLinks:
    (process.env.DOCUSAURUS_ONBROKENLINKS as 'warn' | 'throw' | undefined) ?? 'warn',
  // Share Tech Mono is self-hosted via @font-face in src/css/custom.css
  // (see static/fonts) and only used by the homepage hero SVG, so there is no
  // render-blocking Google Fonts stylesheet/preconnect on any page.
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
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
  clientModules: ['./src/clientModules/errorReporting.ts'],
  plugins: [
    async function siteWebpackPlugin(_context, _options) {
      return {
        name: 'site-webpack-config',
        configureWebpack(_config, isServer) {
          // ANALYZE=1 npm run build → writes build/bundle-report.html (client bundle).
          // The replicad/OpenCascade WASM webpack config that used to live here
          // was removed with the last in-bundle CAD tool (issues #93/#94/#99):
          // every WASM consumer now runs as a standalone utility app.
          const analyzerPlugins =
            process.env.ANALYZE && !isServer
              ? [
                  new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    reportFilename: '../bundle-report.html',
                    openAnalyzer: false,
                  }),
                ]
              : [];
          return {
            plugins: analyzerPlugins,
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
          // Search result pages are noindex-style utility pages, keep them
          // out of the sitemap (locale variants included).
          ignorePatterns: ['/admin/**', '/search/**', '/*/search/**'],
        },
        theme: {
          customCss: ['./src/css/custom.css', './src/css/light-theme.css'],
        },
      } satisfies Preset.Options,
    ],
  ],
  themes: [
    [
      // Offline full-text search over docs, blog and pages (issue #62).
      // Replaces the hand-maintained src/data/searchIndex.ts.
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        // lunr stemmers exist for these; ua/et content still gets indexed,
        // just without language-specific stemming.
        language: ['en', 'ru', 'de', 'es'],
        indexDocs: true,
        indexBlog: true,
        indexPages: true,
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
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
        // The homepage is the utilities catalog; give the main product an
        // explicit navbar entry (issue #61).
        {to: '/', label: 'Utilities', position: 'left'},
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog/', label: 'Blog', position: 'left'},
        {to: '/mini-games/', label: 'Mini Games', position: 'left'},
        {type: 'search', position: 'right'},
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
            {label: 'Calculators', to: '/?category=calculators'},
            {label: 'Configurators', to: '/?category=configurators'},
            {label: 'PDF Tools', to: '/?category=pdf-tools'},
            {label: 'CAD & 3D', to: '/?category=cad-tools'},
            {label: 'Productivity', to: '/?category=productivity'},
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
