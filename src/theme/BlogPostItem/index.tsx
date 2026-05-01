import React, {Suspense, lazy} from 'react';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import type {Props} from '@theme/BlogPostItem';
import BlogPostItem from '@theme-original/BlogPostItem';
import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';
import styles from './styles.module.css';

const Comments = lazy(() => import('@site/src/components/Comments'));

export default function BlogPostItemWrapper(props: Props): React.JSX.Element {
  const {metadata, isBlogPostPage} = useBlogPost();

  return (
    <>
      <BlogPostItem {...props} />
      {isBlogPostPage ? (
        <div className={styles.feedbackSection}>
          <hr className={styles.divider} />
          <div className={styles.reactions}>
            <ReactionsBar slug={metadata.permalink} />
          </div>
          <Suspense fallback={null}>
            <Comments slug={metadata.permalink} />
          </Suspense>
        </div>
      ) : null}
    </>
  );
}
