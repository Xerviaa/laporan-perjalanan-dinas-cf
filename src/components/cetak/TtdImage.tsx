"use client";

import { useState, useEffect } from "react";

export default function TtdImage({ nama, getTtdUrl }: { nama: string, getTtdUrl: (n: string) => string }) {
  const [error, setError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Pastikan gambar baru dirender setelah komponen terpasang di browser
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!nama || error) {
    return <span className="text-[10px] text-slate-400 text-center font-mono">(......)</span>;
  }

  // Jangan render gambar sampai kita yakin berada di client-side
  if (!isClient) {
    return <span className="text-[10px] text-slate-300">-</span>;
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