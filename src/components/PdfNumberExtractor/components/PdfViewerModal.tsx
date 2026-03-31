import React, {useEffect, useState} from 'react';
import type {ViewerState} from '../types';

type PdfViewerModalProps = {
  viewer: ViewerState;
  onClose: () => void;
};

export default function PdfViewerModal({viewer, onClose}: PdfViewerModalProps) {
  const [objectUrl, setObjectUrl] = useState('');

  useEffect(() => {
    if (!viewer.open || !viewer.file) {
      setObjectUrl('');
      return undefined;
    }

    const nextUrl = URL.createObjectURL(viewer.file);
    setObjectUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [viewer.file, viewer.open]);

  if (!viewer.open || !viewer.file) {
    return null;
  }

  const hashParts: string[] = [];
  if (viewer.pageNumber) {
    hashParts.push(`page=${viewer.pageNumber}`);
  }
  if (viewer.searchText) {
    hashParts.push(`search=${encodeURIComponent(viewer.searchText)}`);
  }
  const src = objectUrl ? `${objectUrl}${hashParts.length ? `#${hashParts.join('&')}` : ''}` : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex h-full w-full max-w-[96vw] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl md:h-[90vh] md:w-[92vw]">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/95 px-4 py-3">
          <h3 className="truncate pr-4 text-lg font-semibold text-white">{viewer.title}</h3>
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <iframe className="min-h-0 w-full flex-1 bg-white/5" src={src} title={viewer.title} />
      </div>
    </div>
  );
}
