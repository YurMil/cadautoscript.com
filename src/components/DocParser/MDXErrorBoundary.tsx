import React, {type ReactNode} from 'react';
import {AlertTriangle} from 'lucide-react';
import styles from './MdxPostEditor.module.css';

export default class MDXErrorBoundary extends React.Component<{children: ReactNode}, {hasError: boolean; error?: any}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error: any) {
    return {hasError: true, error};
  }

  componentDidCatch(error: any) {
    // noop, UI handles messaging
    void error;
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.alert}>
          <div style={{display: 'flex', gap: 8}}>
            <AlertTriangle size={14} />
            <div>
              <div style={{fontWeight: 700}}>Render error</div>
              <div className={styles.small}>
                {String(this.state.error?.message ?? this.state.error ?? 'Unknown error')}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
