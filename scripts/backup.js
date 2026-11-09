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

// FUNGSI BARU: Ekstrak nama file dari berbagai format database
function extractFileKey(rawData) {
  if (!rawData) return null;
  
  let str = String(rawData).trim();
  if (!str || str === '[]' || str === 'null') return null;

  // 1. Coba parse sebagai JSON Array
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return String(parsed[0]).trim(); // Ambil elemen pertama
      }
    } catch (e) {
      // Jika gagal parse, lanjut ke pembersihan manual
    }
  }

  // 2. Pembersihan manual (hapus [, ], ", spasi, dan koma)
  str = str.replace(/[\[\]"]/g, '').trim();
  if (str.includes(',')) {
    str = str.split(',')[0].trim();
  }
  
  return str || null;
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
    const fileColumns = [
      { key: report.surat_tugas },
      { key: report.berkas_kegiatan },
      { key: report.berkas_perbaikan },
      { key: report.berkas_pemeriksaan_tindakan_perbaikan }
    ];

    for (const fileInfo of fileColumns) {
      if (!fileInfo.key) continue;

      // Ekstrak semua file yang mungkin ada (jika array)
      let fileKeys = [];
      let rawStr = String(fileInfo.key).trim();
      
      if (rawStr.startsWith('[') && rawStr.endsWith(']')) {
        try {
          const parsed = JSON.parse(rawStr);
          if (Array.isArray(parsed)) {
            fileKeys = parsed;
          } else {
            fileKeys = [rawStr];
          }
        } catch (e) {
          fileKeys = [rawStr];
        }
      } else {
        fileKeys = [rawStr];
      }

      for (let i = 0; i < fileKeys.length; i++) {
        const key = extractFileKey(fileKeys[i]);
        if (!key) continue;

        const fileName = key.split('/').pop();
        const destPath = path.join(folderPath, fileName);
        
        try {
          console.log(`Mengunduh: ${fileName} dari ${baseUrl + key}`);
          await downloadFile(baseUrl + key, destPath);
          console.log(`BERHASIL: ${fileName}`);
        } catch (error) {
          console.error(`Gagal mengunduh ${fileName}: ${error.message}`);
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