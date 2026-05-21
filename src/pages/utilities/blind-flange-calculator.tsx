import React, {Suspense, lazy} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import UtilityShellPage from '@site/src/components/Utilities/UtilityShellPage';
import {utilityPageConfigs} from '@site/src/data/utilityShellPages';

const BlindFlangeCalculator = lazy(
  () => import('@site/src/components/tools/BlindFlangeCalculator'),
);

export default function BlindFlangeCalculatorPage() {
  const config = utilityPageConfigs['blind-flange-calculator'];
  if (!config) {
    throw new Error('Utility page configuration missing for slug "blind-flange-calculator"');
  }

  return (
    <UtilityShellPage
      {...config}
      tool={
        <BrowserOnly fallback={<div className="utility-loading" aria-busy="true" />}>
          {() => (
            <Suspense fallback={<div className="utility-loading" aria-busy="true" />}>
              <BlindFlangeCalculator />
            </Suspense>
          )}
        </BrowserOnly>
      }
    />
  );
}
