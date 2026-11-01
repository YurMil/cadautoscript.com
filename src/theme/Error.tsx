import React, {useEffect} from 'react';
import OriginalError from '@theme-original/Error';
import type ErrorType from '@theme/Error';
import type {WrapperProps} from '@docusaurus/types';
import {handleBoundaryError} from '@site/src/lib/boundaryErrors';

type Props = WrapperProps<typeof ErrorType>;

/** Top-level crash screen: report the error (or recover from a stale chunk). */
export default function ErrorWrapper(props: Props): React.JSX.Element {
  useEffect(() => {
    handleBoundaryError(props.error, 'error-boundary:root');
  }, [props.error]);
  return <OriginalError {...props} />;
}
