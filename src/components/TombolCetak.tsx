"use client";

export default function TombolCetak() {
  return (
    <div className="no-print fixed top-4 right-4 z-50">
      <button
        onClick={() => window.print()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all"
      >
        🖨️ Cetak / Save as PDF
      </button>
    </div>
  );
}