import React from 'react';

type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

const helpSections = [
  {
    title: '1. Adding files',
    body:
      'Click “Add files” or drag and drop PDF files into the drop area. Filenames stay clickable so you can preview the original PDF without leaving the page.',
  },
  {
    title: '2. Configuration',
    body:
      'Set the prefix and max length for the numbers you want to extract. Quick scan summaries refresh automatically when these two values change.',
    bullets: [
      'Latest revision keeps only the highest _rXX_ match inside each filename family.',
      'CSV duplicate removal keeps the longest text match for each number.',
    ],
  },
  {
    title: '3. Screenshot tweaking',
    body:
      'Adjust width, height, and X/Y offsets until the live crop preview matches how your extracted number should appear inside the screenshot.',
  },
  {
    title: '4. Review and export',
    body:
      'Run the analysis, review each result, exclude false positives, edit comments, and export the filtered set as PDF, TXT, or CSV.',
  },
];

export default function HelpModal({open, onClose}: HelpModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h3 className="text-xl font-semibold text-white">Help & instructions</h3>
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-6 text-sm leading-7 text-slate-300">
          {helpSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h4 className="text-lg font-semibold text-cyan-200">{section.title}</h4>
              <p>{section.body}</p>
              {section.bullets ? (
                <ul className="list-disc space-y-1 pl-5 text-slate-400">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
