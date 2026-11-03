export default function TemplateHACCP({ data }: { data: any }) {
  return (
    <div className="font-serif text-[11pt] leading-relaxed text-justify text-black">
      <h1 className="text-center font-bold text-lg mb-4">TES TEMPLATE HACCP</h1>
      <p>Nama Perusahaan: {data.namaPerusahaan}</p>
      <p>Tanggal: {data.tanggal}</p>
      <p>Petugas: {data.petugasPelaksana}</p>
      <p>Jenis Kegiatan: {data.jenisKegiatan}</p>
      <p>Foto: {data.fotoKegiatan}</p>
    </div>
  );
}