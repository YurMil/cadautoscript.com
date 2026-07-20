import React from 'react';
import {useI18n} from '@site/src/contexts/I18nContext';
import {logger} from '../../lib/logger';

type FallbackProps = {utilityName: string; onReset: () => void};

function UtilityErrorFallback({utilityName, onReset}: FallbackProps) {
  const {t} = useI18n();
  return (
    <div className="utility-locked" role="alert">
      <p className="utility-locked__eyebrow">{t('utility.errorEyebrow')}</p>
      <h2>{t('utility.errorTitle')}</h2>
      <p className="utility-locked__copy">{t('utility.errorCopy', {name: utilityName})}</p>
      <div className="utility-locked__actions">
        <button type="button" className="button primary" onClick={onReset}>
          {t('utility.reloadTool')}
        </button>
      </div>
    </div>
  );
}

type BoundaryProps = {utilityName: string; children: React.ReactNode};
type BoundaryState = {hasError: boolean; resetKey: number};

/**
 * Catches render/lifecycle crashes of an embedded utility (WASM init failure,
 * WebGL context loss handlers, corrupt input parsing) so the site shell,
 * comments, and navigation stay usable. Reset remounts the utility subtree.
 */
export default class UtilityErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = {hasError: false, resetKey: 0};

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return {hasError: true};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error(
      `[UtilityErrorBoundary] "${this.props.utilityName}" crashed`,
      error,
      info.componentStack,
    );
  }

  handleReset = () => {
    this.setState((prev) => ({hasError: false, resetKey: prev.resetKey + 1}));
  };

  render() {
    if (this.state.hasError) {
      return <UtilityErrorFallback utilityName={this.props.utilityName} onReset={this.handleReset} />;
    }
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}
