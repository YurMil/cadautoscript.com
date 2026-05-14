import React, {Suspense, lazy} from 'react';
import Root from '@theme-original/Root';
import type {Props} from '@theme/Root';
import LoginModal from '@site/src/components/Auth/LoginModal';
import {AuthModalProvider} from '@site/src/contexts/AuthModalContext';

import {UserSettingsProvider} from '@site/src/contexts/UserSettingsContext';

// Lazy load SpeedInsights component (client-side only)
const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then((module) => ({
    default: module.SpeedInsights,
  }))
);

// Lazy load Analytics component (client-side only)
const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((module) => ({
    default: module.Analytics,
  }))
);

export default function RootWrapper(props: Props) {
  return (
    <AuthModalProvider>
      <UserSettingsProvider>
        <Root {...props} />
        <LoginModal />
        <Suspense fallback={null}>
          <SpeedInsights />
          <Analytics />
        </Suspense>
      </UserSettingsProvider>
    </AuthModalProvider>
  );
}
