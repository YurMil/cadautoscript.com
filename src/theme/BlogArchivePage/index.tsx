import React from 'react';
import Original from '@theme-original/BlogArchivePage';
import type BlogArchivePageType from '@theme/BlogArchivePage';
import type {WrapperProps} from '@docusaurus/types';
import NoindexUntranslated from '@site/src/components/SEO/NoindexUntranslated';

type Props = WrapperProps<typeof BlogArchivePageType>;

// Untranslated locales render the English fallback for blog routes; keep
// those copies out of the index (issue #58, remove with #66).
export default function BlogArchivePageWrapper(props: Props): React.JSX.Element {
  return (
    <>
      <NoindexUntranslated />
      <Original {...props} />
    </>
  );
}
