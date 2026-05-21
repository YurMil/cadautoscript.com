import React, {Suspense, lazy} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import UtilityShellPage from '@site/src/components/Utilities/UtilityShellPage';
import {utilityPageConfigs} from '@site/src/data/utilityShellPages';

const VesselHeadCalculator = lazy(
  () => import('@site/src/components/tools/VesselHeadCalculator'),
);

export default function PressureVesselDishedEndCalcPage() {
  const config = utilityPageConfigs['pressure-vessel-dished-end-calc'];
  if (!config) {
    throw new Error('Utility page configuration missing for slug "pressure-vessel-dished-end-calc"');
  }

  return (
    <UtilityShellPage
      {...config}
      tool={
        <BrowserOnly fallback={<div className="utility-loading" aria-busy="true" />}>
          {() => (
            <Suspense fallback={<div className="utility-loading" aria-busy="true" />}>
              <VesselHeadCalculator />
            </Suspense>
          )}
        </BrowserOnly>
      }
    />
  );
}
