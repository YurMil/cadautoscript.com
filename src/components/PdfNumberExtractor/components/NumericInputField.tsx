import React, {useEffect, useMemo, useState} from 'react';

type NumericInputFieldProps = {
  label: string;
  value: number;
  min: number;
  max?: number;
  step?: number;
  onCommit: (value: number) => void;
  align?: 'center' | 'left';
};

function isValidInteger(value: string, min: number, max?: number) {
  if (!/^\d+$/.test(value.trim())) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min) {
    return null;
  }
  if (typeof max === 'number' && parsed > max) {
    return null;
  }

  return parsed;
}

export default function NumericInputField({
  label,
  value,
  min,
  max,
  onCommit,
  align = 'left',
}: NumericInputFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(String(value));
    }
  }, [focused, value]);

  const parsedDraft = useMemo(() => isValidInteger(draft, min, max), [draft, min, max]);

  function commitOrReset() {
    if (parsedDraft === null) {
      setDraft(String(value));
      return;
    }

    onCommit(parsedDraft);
    setDraft(String(parsedDraft));
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        value={draft}
        className={[
          'w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/60 focus:bg-slate-950',
          align === 'center' ? 'text-center' : 'text-left',
        ].join(' ')}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          commitOrReset();
        }}
        onChange={(event) => {
          const nextValue = event.target.value.replace(/[^\d]/g, '');
          setDraft(nextValue);

          const parsedValue = isValidInteger(nextValue, min, max);
          if (parsedValue !== null) {
            onCommit(parsedValue);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            setDraft(String(value));
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}
