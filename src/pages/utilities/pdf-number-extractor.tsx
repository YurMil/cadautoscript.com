import React, {Suspense, lazy} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import UtilityShellPage from '@site/src/components/Utilities/UtilityShellPage';
import {utilityPageConfigs} from '@site/src/data/utilityShellPages';

const PdfNumberExtractor = lazy(
  () => import('@site/src/components/PdfNumberExtractor'),
);

export default function PdfNumberExtractorPage() {
  const config = utilityPageConfigs['pdf-number-extractor'];
  if (!config) {
    throw new Error('Utility page configuration missing for slug "pdf-number-extractor"');
  }

  return (
    <UtilityShellPage
      {...config}
      tool={
        <BrowserOnly fallback={<div className="utility-loading" aria-busy="true" />}>
          {() => (
            <Suspense fallback={<div className="utility-loading" aria-busy="true" />}>
              <PdfNumberExtractor />
            </Suspense>
          )}
        </BrowserOnly>
      }
    />
  );
}
