import React from 'react';
import {handleBoundaryError} from '@site/src/lib/boundaryErrors';

type Props = {
  /** Short tag stored with the error report, e.g. "blog-feedback". */
  context: string;
  children: React.ReactNode;
};

type State = {hasError: boolean};

/**
 * For secondary UI (comments, reactions, widgets) that the page is still worth
 * reading without: a crash there is reported and the section disappears,
 * instead of reaching the layout boundary and replacing the whole page.
 */
export default class OptionalBoundary extends React.Component<Props, State> {
  state: State = {hasError: false};

  static getDerivedStateFromError(): State {
    return {hasError: true};
  }

  componentDidCatch(error: Error) {
    handleBoundaryError(error, this.props.context);
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
