import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function CetakSuratTugas({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const idLaporan = Number(resolvedParams.id);

  const db = getDb(); 
  const result = await db.select().from(reports).where(eq(reports.id, idLaporan));
  const data = result[0];

  if (!data || !data.suratTugas) {
    return <div className="p-10 text-center">Surat Tugas tidak ditemukan.</div>;
  }

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-white">
      <iframe 
        src={`/api/r2/${data.suratTugas}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
        className="w-full h-full border-0 block"
        style={{ width: '100vw', height: '100vh' }}
        title="Surat Tugas"
      />
      
      {/* Script otomatis Print lalu pindah ke halaman Laporan */}
      <script dangerouslySetInnerHTML={{
        __html: `
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.location.href = '/cetak/${idLaporan}?mode=pdf';
              }, 500);
            }, 1000);
          };
        `
      }} />
    </div>
  );
}