import React, {useState, useRef, useEffect} from 'react';
import {useI18n} from '@site/src/contexts/I18nContext';
import type {LocaleMeta} from '@site/src/i18n';

type LanguageSwitcherProps = {
  /** When true, shows only the flag + current lang code (compact for navbar) */
  compact?: boolean;
};

export default function LanguageSwitcher({compact = false}: LanguageSwitcherProps) {
  const {locale, setLocale, availableLocales} = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = availableLocales.find((l) => l.code === locale) ?? availableLocales[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (meta: LocaleMeta) => {
    setLocale(meta.code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="lang-switcher" style={styles.wrapper}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.label}`}
        onClick={() => setOpen((v) => !v)}
        style={styles.trigger}
        className="lang-switcher__trigger"
      >
        <span aria-hidden="true">{current.flag}</span>
        {compact ? (
          <span style={styles.code}>{current.code.toUpperCase()}</span>
        ) : (
          <span style={styles.label}>{current.label}</span>
        )}
        <span aria-hidden="true" style={{...styles.caret, transform: open ? 'rotate(180deg)' : 'none'}}>
          ▾
        </span>
      </button>

      {open && (
        <ul role="listbox" style={styles.menu} className="lang-switcher__menu">
          {availableLocales.map((meta) => (
            <li
              key={meta.code}
              role="option"
              aria-selected={meta.code === locale}
              onClick={() => handleSelect(meta)}
              style={{
                ...styles.item,
                ...(meta.code === locale ? styles.itemActive : {}),
              }}
              className={`lang-switcher__item${meta.code === locale ? ' lang-switcher__item--active' : ''}`}
            >
              <span aria-hidden="true">{meta.flag}</span>
              <span>{meta.label}</span>
              {meta.code === locale && <span style={styles.check} aria-hidden="true">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '8px',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'background 0.15s ease',
    whiteSpace: 'nowrap',
  },
  label: {
    fontSize: '0.85rem',
  },
  code: {
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  caret: {
    fontSize: '0.7rem',
    lineHeight: 1,
    transition: 'transform 0.2s ease',
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    minWidth: '160px',
    padding: '6px 0',
    margin: 0,
    listStyle: 'none',
    background: 'var(--ifm-navbar-background-color, #1a1f35)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    zIndex: 9999,
    overflow: 'hidden',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'background 0.12s ease',
    userSelect: 'none',
  },
  itemActive: {
    color: '#64ffda',
    fontWeight: 600,
  },
  check: {
    marginLeft: 'auto',
    fontSize: '0.75rem',
    color: '#64ffda',
  },
};
