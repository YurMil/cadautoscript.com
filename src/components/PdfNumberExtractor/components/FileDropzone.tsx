import React, {useState} from 'react';

type FileDropzoneProps = {
  hasFiles: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | File[]) => void;
  children: React.ReactNode;
};

export default function FileDropzone({
  hasFiles,
  inputRef,
  onFiles,
  children,
}: FileDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div
      className={[
        'mb-8 flex min-h-[168px] flex-col justify-center rounded-[28px] border-2 border-dashed px-4 py-5 transition',
        hasFiles ? 'items-stretch' : 'items-center',
        dragActive
          ? 'border-cyan-300 bg-cyan-500/10'
          : 'border-slate-600/70 bg-slate-900/70 hover:border-slate-400/80 hover:bg-slate-900',
      ].join(' ')}
      onClick={() => {
        if (!hasFiles) {
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        if (event.dataTransfer.files.length) {
          onFiles(event.dataTransfer.files);
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        multiple
        onChange={(event) => {
          if (event.target.files?.length) {
            onFiles(event.target.files);
          }
          event.target.value = '';
        }}
      />
      {children}
    </div>
  );
}
