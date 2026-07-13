'use client';

import { useRef, useState } from 'react';

export function SaleSectionClient() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <>
      <button
        className="sale__btn btn anim-center"
        onClick={() => setOpen(o => !o)}
      >
        UPLOAD YOUR SALES SLIP
      </button>

      {open && (
        <div className="sale__form">
          <label
            className="sale__dropzone"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <span>{file.name}</span>
            ) : (
              <span>Drag &amp; drop your sales slip here, or click to select</span>
            )}
          </label>
          <button className="btn sale__form-submit">SUBMIT</button>
        </div>
      )}
    </>
  );
}
