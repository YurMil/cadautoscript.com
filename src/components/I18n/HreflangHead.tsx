import React from 'react';
import Head from '@docusaurus/Head';
import {LOCALES} from '@site/src/i18n';

type HreflangHeadProps = {
  /** Current page path, e.g. "/" or "/utilities/pipe-cutter/" */
  path?: string;
  /** Base URL without trailing slash */
  baseUrl?: string;
};

/**
 * Renders <link rel="alternate" hreflang="..."> tags for every supported locale.
 * Include this in pages where multi-language SEO matters (homepage, utility pages, etc.).
 */
export default function HreflangHead({
  path = '/',
  baseUrl = 'https://cadautoscript.com',
}: HreflangHeadProps) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return (
    <Head>
      {/* x-default points to the canonical English version */}
      <link rel="alternate" hrefLang="x-default" href={`${cleanBase}${cleanPath}`} />
      {LOCALES.map((locale) => (
        <link
          key={locale.code}
          rel="alternate"
          hrefLang={locale.htmlLang}
          href={`${cleanBase}${cleanPath}`}
        />
      ))}
    </Head>
  );
}
