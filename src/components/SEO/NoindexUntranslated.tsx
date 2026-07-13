import React from 'react';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * The blog is not translated yet, so localized blog routes (/ru/blog/…,
 * /de/blog/…) render the English fallback and get flagged in Google Search
 * Console as duplicates. Mark them noindex until real translations land.
 *
 * TODO(issue #66): remove this once the blog is translated.
 */
export default function NoindexUntranslated(): React.JSX.Element | null {
  const {i18n} = useDocusaurusContext();
  if (i18n.currentLocale === i18n.defaultLocale) {
    return null;
  }
  return (
    <Head>
      <meta name="robots" content="noindex" />
    </Head>
  );
}
