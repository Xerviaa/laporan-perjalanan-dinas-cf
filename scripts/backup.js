const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Fungsi untuk mengunduh file dari URL
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`Gagal mengunduh: ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
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

  const baseLocalFolder = './backup-temp';
  const baseUrl = 'https://laporan-dinas-cf.vickyariesta-id.workers.dev/api/r2/';
  
  if (fs.existsSync(baseLocalFolder)) {
    fs.rmSync(baseLocalFolder, { recursive: true, force: true });
  }

  for (const report of reports) {
    // 1. Tentukan Tanggal
    let date = new Date();
    if (report.tanggal) {
      const parsedDate = new Date(report.tanggal);
      if (!isNaN(parsedDate.getTime())) date = parsedDate;
    } else if (report.createdAt) {
      const parsedDate = new Date(report.createdAt);
      if (!isNaN(parsedDate.getTime())) date = parsedDate;
    }

    const year = date.getFullYear();
    const month = date.toLocaleString('id-ID', { month: 'long' });
    
    // 2. Pisahkan Jenis Kegiatan Utama dan Sub-Kegiatan
    let jenisUtama = 'Lainnya';
    let subKegiatan = 'Lainnya';

    if (report.jenisKegiatan) {
      const parts = report.jenisKegiatan.trim().split(/\s+/);
      if (parts.length > 0) {
        jenisUtama = parts[0];
        subKegiatan = parts.length > 1 ? parts.slice(1).join(' ') : 'Umum';
      }
    }

    jenisUtama = jenisUtama.replace(/[\/\\?%*:|"<>]/g, '-').trim() || 'Lainnya';
    subKegiatan = subKegiatan.replace(/[\/\\?%*:|"<>]/g, '-').trim() || 'Lainnya';
    const namaPerusahaan = (report.namaPerusahaan || 'Tanpa Nama').replace(/[\/\\?%*:|"<>]/g, '-');

    // 3. Struktur Folder: Tahun/Bulan/Jenis Utama/Sub-Kegiatan/Nama Perusahaan
    const folderPath = path.join(baseLocalFolder, String(year), month, jenisUtama, subKegiatan, namaPerusahaan);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // 4. Unduh File PDF dari R2
    const filesToDownload = [
      { key: report.suratTugas, name: 'Surat Tugas' },
      { key: report.berkasKegiatan, name: 'Berkas Kegiatan', isArray: true },
      { key: report.berkasPerbaikan, name: 'Berkas Perbaikan', isArray: true },
      { key: report.berkasPemeriksaanTindakanPerbaikan, name: 'Pemeriksaan Perbaikan' }
    ];

    for (const fileInfo of filesToDownload) {
      if (!fileInfo.key) continue;

      let fileKeys = [];
      if (fileInfo.isArray) {
        try {
          fileKeys = JSON.parse(fileInfo.key);
        } catch (e) {
          fileKeys = [fileInfo.key];
        }
      } else {
        fileKeys = [fileInfo.key];
      }

      for (let i = 0; i < fileKeys.length; i++) {
        const key = fileKeys[i];
        if (!key || key === '[]') continue;

        const fileName = key.split('/').pop(); // Ambil nama file dari path
        const destPath = path.join(folderPath, fileName);
        
        try {
          console.log(`Mengunduh: ${fileName}`);
          await downloadFile(baseUrl + key, destPath);
        } catch (error) {
          console.error(`Gagal mengunduh ${fileName}:`, error.message);
        }
      }
    }

    // 5. Buat file data.csv sebagai pelengkap
    const csvHeader = 'ID,Nama Perusahaan,Tanggal,Pelaksana,Hasil,Kendala\n';
    const csvRow = `"${report.id}","${report.namaPerusahaan || ''}","${report.tanggal || ''}","${report.petugasPelaksana || ''}","${report.hasilKegiatan || ''}","${report.kendala || ''}"`;
    fs.writeFileSync(path.join(folderPath, 'data.csv'), csvHeader + csvRow, 'utf8');
  }

  await client.end();
  console.log(`Berhasil memproses ${reports.length} laporan.`);

  console.log('Mengunggah ke Google Drive...');
  try {
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