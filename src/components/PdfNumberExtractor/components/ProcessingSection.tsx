import React from 'react';

type ProcessingSectionProps = {
  statusText: string;
};

export default function ProcessingSection({statusText}: ProcessingSectionProps) {
  return (
    <section className="flex min-h-[520px] flex-col items-center justify-center text-center">
      <div className="mb-6 h-14 w-14 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-300" />
      <h3 className="text-2xl font-semibold text-white">Analyzing documents</h3>
      <p className="mt-3 max-w-xl text-sm text-slate-400">{statusText}</p>
    </section>
  );
}
