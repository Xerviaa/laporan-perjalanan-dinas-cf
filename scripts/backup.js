const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  // 1. Koneksi ke Database Supabase
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();

  console.log('Mengambil data dari database...');
  const res = await client.query('SELECT * FROM reports ORDER BY tanggal DESC');
  const reports = res.rows;

  if (reports.length === 0) {
    console.log('Tidak ada data untuk di-backup.');
    await client.end();
    return;
  }

  // 2. Buat Folder dan File CSV untuk setiap laporan
  const baseLocalFolder = './backup-temp';
  
  // Hapus folder lama jika ada (untuk menghindari duplikasi saat run ulang)
  if (fs.existsSync(baseLocalFolder)) {
    fs.rmSync(baseLocalFolder, { recursive: true, force: true });
  }

  for (const report of reports) {
    const date = report.tanggal ? new Date(report.tanggal) : new Date(report.createdAt);
    const year = date.getFullYear();
    const month = date.toLocaleString('id-ID', { month: 'long' });
    
    // Pisahkan nama kegiatan (contoh: "Inspeksi CPIB Kapal" -> "CPIB Kapal")
    const jenisParts = (report.jenisKegiatan || '').split(' ');
    const jenisKegiatan = jenisParts.slice(1).join(' ') || jenisParts[0] || 'Lainnya';
    
    const namaPerusahaan = (report.namaPerusahaan || 'Tanpa Nama').replace(/[\/\\?%*:|"<>]/g, '-'); // Sanitasi nama folder

    // Struktur Folder: Tahun/Bulan/Jenis Kegiatan/Nama Perusahaan
    const folderPath = path.join(baseLocalFolder, String(year), month, jenisKegiatan, namaPerusahaan);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Buat konten CSV
    const csvHeader = 'ID,Nama Perusahaan,Jenis Kegiatan,Tanggal,Pelaksana,Hasil,Kendala\n';
    const csvRow = `"${report.id}","${report.namaPerusahaan || ''}","${report.jenisKegiatan || ''}","${report.tanggal || ''}","${report.petugasPelaksana || ''}","${report.hasilKegiatan || ''}","${report.kendala || ''}"`;
    
    const fileName = `detail-${report.id}.csv`;
    fs.writeFileSync(path.join(folderPath, fileName), csvHeader + csvRow, 'utf8');
  }

  await client.end();
  console.log(`Berhasil membuat ${reports.length} file CSV.`);

  // 3. Upload ke Google Drive via Rclone
  console.log('Mengunggah ke Google Drive...');
  try {
    // Menyalin isi folder local ke folder 'gdrive:supabase-backups'
    execSync(`rclone copy ${baseLocalFolder} gdrive:supabase-backups`, { stdio: 'inherit' });
    console.log('Upload ke Google Drive BERHASIL!');
  } catch (error) {
    console.error('Gagal upload ke Google Drive:', error.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Terjadi kesalahan:", err);
  process.exit(1);
});