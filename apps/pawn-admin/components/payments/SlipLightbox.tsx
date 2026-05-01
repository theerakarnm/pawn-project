'use client';

import { useState } from 'react';

interface SlipLightboxProps {
  slipUrl: string;
}

export function SlipLightbox({ slipUrl }: SlipLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="size-12 shrink-0 overflow-hidden rounded border"
      >
        <img
          src={slipUrl}
          alt="Slip"
          className="size-full object-cover"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        >
          <img
            src={slipUrl}
            alt="Slip full size"
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </>
  );
}
