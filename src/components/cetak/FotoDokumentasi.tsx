"use client";

import { useState } from "react";

export default function FotoDokumentasi({ fotoArray }: { fotoArray: string[] }) {
  const [errorIds, setErrorIds] = useState<number[]>([]);

  if (!fotoArray || fotoArray.length === 0) {
    return (
      <div className="col-span-2 text-center text-gray-500 italic mt-4 border p-10 border-dashed">
        (Belum ada foto dokumentasi yang di-upload)
      </div>
    );
  }

  return (
    <>
      {fotoArray.map((key, i) => (
        <div key={i} className="mb-4">
          {errorIds.includes(i) ? (
            <div className="w-full h-40 bg-slate-100 border border-gray-300 flex items-center justify-center text-gray-400 text-sm">
              Gagal memuat gambar
            </div>
          ) : (
            <img 
              src={`/api/r2/${key}`} 
              alt={`Dokumentasi ${i}`} 
              className="w-full h-auto object-cover border border-gray-300" 
              onError={() => setErrorIds(prev => [...prev, i])}
            />
          )}
        </div>
      ))}
    </>
  );
}