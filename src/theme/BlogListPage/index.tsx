import React from 'react';
import Original from '@theme-original/BlogListPage';
import type BlogListPageType from '@theme/BlogListPage';
import type {WrapperProps} from '@docusaurus/types';
import NoindexUntranslated from '@site/src/components/SEO/NoindexUntranslated';

type Props = WrapperProps<typeof BlogListPageType>;

// Untranslated locales render the English fallback for blog routes; keep
// those copies out of the index (issue #58, remove with #66).
export default function BlogListPageWrapper(props: Props): React.JSX.Element {
  return (
    <>
      <NoindexUntranslated />
      <Original {...props} />
    </>
  );
}
