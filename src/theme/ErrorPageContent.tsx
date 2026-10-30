import React, {useEffect} from 'react';
import OriginalErrorPageContent from '@theme-original/ErrorPageContent';
import type ErrorPageContentType from '@theme/ErrorPageContent';
import type {WrapperProps} from '@docusaurus/types';
import {handleBoundaryError} from '@site/src/lib/boundaryErrors';

type Props = WrapperProps<typeof ErrorPageContentType>;

/** Per-page crash screen inside the layout: report the error (or recover from a stale chunk). */
export default function ErrorPageContentWrapper(props: Props): React.JSX.Element {
  useEffect(() => {
    handleBoundaryError(props.error, 'error-boundary:page');
  }, [props.error]);
  return <OriginalErrorPageContent {...props} />;
}
