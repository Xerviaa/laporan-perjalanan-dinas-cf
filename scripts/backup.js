const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

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
      file.on('finish', () => { file.close(resolve); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// FUNGSI BARU: Membersihkan nama file dari karakter aneh
function cleanFileName(rawKey) {
  if (!rawKey) return '';
  // Hapus tanda kutip, kurung siku, dan spasi di awal/akhir
  let cleaned = rawKey.replace(/[\[\]"]/g, '').trim();
  // Jika ada koma (array), ambil elemen pertama
  if (cleaned.includes(',')) {
    cleaned = cleaned.split(',')[0].trim();
  }
  return cleaned;
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

  const jenisUtamaList = ['Inspeksi', 'Survailen', 'Inpres', 'Selfdecare Kapal'];

  for (const report of reports) {
    let date = new Date();
    if (report.tanggal) {
      const parsedDate = new Date(report.tanggal);
      if (!isNaN(parsedDate.getTime())) date = parsedDate;
    } else if (report.created_at) {
      const parsedDate = new Date(report.created_at);
      if (!isNaN(parsedDate.getTime())) date = parsedDate;
    }

    const year = date.getFullYear();
    const month = date.toLocaleString('id-ID', { month: 'long' });
    
    let jenisUtama = 'Lainnya';
    let subKegiatan = 'Umum';
    const rawJenis = (report.jenis_kegiatan || '').trim();

    if (rawJenis) {
      let found = false;
      for (const ju of jenisUtamaList) {
        if (rawJenis.toLowerCase().startsWith(ju.toLowerCase())) {
          jenisUtama = ju;
          let sisa = rawJenis.substring(ju.length).trim();
          sisa = sisa.replace(/^[-:\s]+/, '');
          subKegiatan = sisa || 'Umum';
          found = true;
          break;
        }
      }
      if (!found) {
        const parts = rawJenis.split(/\s+/);
        jenisUtama = parts[0];
        subKegiatan = parts.length > 1 ? parts.slice(1).join(' ') : 'Umum';
      }
    }

    jenisUtama = jenisUtama.replace(/[\/\\?%*:|"<>]/g, '-').trim() || 'Lainnya';
    subKegiatan = subKegiatan.replace(/[\/\\?%*:|"<>]/g, '-').trim() || 'Umum';
    const namaPerusahaan = (report.nama_perusahaan || `Laporan-ID-${report.id}`).replace(/[\/\\?%*:|"<>]/g, '-');

    const folderPath = path.join(baseLocalFolder, String(year), month, jenisUtama, subKegiatan, namaPerusahaan);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // --- PROSES UNDUH FILE (DIPERBAIKI) ---
    const filesToDownload = [
      { key: report.surat_tugas, isArray: false },
      { key: report.berkas_kegiatan, isArray: true },
      { key: report.berkas_perbaikan, isArray: true },
      { key: report.berkas_pemeriksaan_tindakan_perbaikan, isArray: false }
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

      // Pastikan fileKeys adalah array
      if (!Array.isArray(fileKeys)) fileKeys = [fileKeys];

      for (let i = 0; i < fileKeys.length; i++) {
        const rawKey = fileKeys[i];
        const key = cleanFileName(rawKey); // Bersihkan nama file
        if (!key || key === '[]') continue;

        const fileName = key.split('/').pop();
        const destPath = path.join(folderPath, fileName);
        
        try {
          console.log(`Mengunduh: ${fileName}`);
          await downloadFile(baseUrl + key, destPath);
        } catch (error) {
          console.error(`Gagal mengunduh ${fileName}:`, error.message);
        }
      }
    }

    // --- BUAT FILE CSV ---
    const csvHeader = 'ID,Nama Perusahaan,Tanggal,Pelaksana,Hasil,Kendala\n';
    const csvRow = `"${report.id}","${report.nama_perusahaan || ''}","${report.tanggal || ''}","${report.petugas_pelaksana || ''}","${report.hasil_kegiatan || ''}","${report.kendala || ''}"`;
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