import React, {Suspense, lazy} from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import BrowserOnly from '@docusaurus/BrowserOnly';

const MdxPostEditor = lazy(() => import('@site/src/components/DocParser/MdxPostEditor'));

export default function DocParserPage() {
  return (
    <Layout title="MDX Post Editor" description="Author MDX with live preview and snippets.">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <BrowserOnly fallback={<div className="utility-loading" aria-busy="true" />}>
        {() => (
          <Suspense fallback={<div className="utility-loading" aria-busy="true" />}>
            <MdxPostEditor />
          </Suspense>
        )}
      </BrowserOnly>
    </Layout>
  );
}
