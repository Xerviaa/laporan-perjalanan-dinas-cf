"use client";

import { useState } from "react";

export default function TtdImage({ nama, getTtdUrl }: { nama: string, getTtdUrl: (n: string) => string }) {
  const [error, setError] = useState(false);

  if (!nama || error) {
    return <span className="text-[10px] text-slate-400 text-center font-mono">(......)</span>;
  }

  return (
    <img 
      src={getTtdUrl(nama)} 
      alt="TTD" 
      className="absolute h-14 object-contain z-10" 
      onError={() => setError(true)} 
    />
  );
}