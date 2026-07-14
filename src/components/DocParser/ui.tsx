import React, {useEffect, useState, type ReactNode} from 'react';
import clsx, {type ClassValue} from 'clsx';
import styles from './MdxPostEditor.module.css';

export function cn(...values: ClassValue[]) {
  return clsx(values);
}

type ButtonVariant = 'primary' | 'ghost' | 'danger';

export function Button({
  children,
  variant = 'primary',
  onClick,
  title,
  disabled,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(styles.btn, {
        [styles.btnPrimary]: variant === 'primary',
        [styles.btnGhost]: variant === 'ghost',
        [styles.btnDanger]: variant === 'danger',
      })}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={styles.iconBtn}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(styles.input, props.className)} />;
}

export function Badge({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'ok' | 'warn';
}) {
  return (
    <span
      className={cn(styles.chip, {
        [styles.chipOk]: tone === 'ok',
        [styles.chipWarn]: tone === 'warn',
      })}
    >
      {children}
    </span>
  );
}

export function Card({
  title,
  right,
  children,
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.card}>
      {(title || right) && (
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>{title}</div>
          <div>{right}</div>
        </div>
      )}
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
}

export function Separator() {
  return <div style={{height: 12}} />;
}

export function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// MDX preview components
export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warn' | 'success' | 'danger';
  title?: string;
  children: ReactNode;
}) {
  const toneClass =
    type === 'success'
      ? styles.calloutSuccess
      : type === 'warn'
      ? styles.calloutWarn
      : type === 'danger'
      ? styles.calloutDanger
      : styles.calloutInfo;
  return (
    <div className={cn(styles.callout, toneClass)}>
      {title ? <div style={{fontWeight: 700, marginBottom: 8}}>{title}</div> : null}
      <div>{children}</div>
    </div>
  );
}

export function Kbd({children}: {children: ReactNode}) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}

export function Steps({children}: {children: ReactNode}) {
  return <ol style={{margin: '14px 0', paddingLeft: '20px'}}>{children}</ol>;
}

export function YouTube({id, title}: {id: string; title?: string}) {
  return (
    <div style={{margin: '14px 0', overflow: 'hidden', borderRadius: 12, border: '1px solid #1f2937'}}>
      <div style={{position: 'relative', paddingTop: '56.25%'}}>
        <iframe
          title={title ?? 'YouTube'}
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export const mdxComponents = {
  Callout,
  Kbd,
  Steps,
  YouTube,
};
