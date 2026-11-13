const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const puppeteer = require('puppeteer'); // Library untuk HTML to PDF

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

function extractFileKey(rawData) {
  if (!rawData) return null;
  let str = String(rawData).trim();
  if (!str || str === '[]' || str === 'null') return null;
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0]).trim();
    } catch (e) {}
  }
  str = str.replace(/[\[\]"]/g, '').trim();
  if (str.includes(',')) str = str.split(',')[0].trim();
  return str || null;
}

async function generatePdfFromUrl(url, destPath) {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  // Buka halaman cetak
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  
  // Cetak ke PDF
  await page.pdf({ 
    path: destPath, 
    format: 'A4', 
    printBackground: true,
    margin: { top: '0cm', right: '0cm', bottom: '0cm', left: '0cm' }
  });
  
  await browser.close();
}

async function main() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();

  console.log('Mengambil data dari database...');
  
  const res = await client.query(`
    SELECT * FROM reports 
    WHERE surat_tugas IS NOT NULL 
      AND surat_tugas != '[]'
    ORDER BY tanggal DESC
  `);
  
  const reports = res.rows;

  if (reports.length === 0) {
    console.log('Tidak ada data untuk di-backup.');
    await client.end();
    return;
  }

  const baseLocalFolder = './backup-temp';
  const baseUrl = 'https://laporan-dinas-cf.vickyariesta-id.workers.dev/api/r2/';
  const cetakUrl = 'https://laporan-dinas-cf.vickyariesta-id.workers.dev/cetak/';
  
  if (fs.existsSync(baseLocalFolder)) {
    fs.rmSync(baseLocalFolder, { recursive: true, force: true });
  }

  for (const report of reports) {
    let date = new Date();
    if (report.tanggal) {
      const parsedDate = new Date(report.tanggal);
      if (!isNaN(parsedDate.getTime())) date = parsedDate;
    }

    const year = date.getFullYear();
    const month = date.toLocaleString('id-ID', { month: 'long', timeZone: 'Asia/Makassar' });
    
    // --- 1. TENTUKAN JENIS UTAMA (Anti-Typo) ---
    const rawJenis = (report.jenis_kegiatan || '').trim().toLowerCase();
    let jenisUtama = 'Lainnya';
    
    if (rawJenis.includes('inspeksi')) {
      jenisUtama = 'Inspeksi';
    } else if (rawJenis.includes('surveilan') || rawJenis.includes('survailen') || rawJenis.includes('surveilans')) {
      jenisUtama = 'Surveilan';
    } else if (rawJenis.includes('inpres')) {
      jenisUtama = 'Inpres';
    }

    // --- 2. TENTUKAN DETAIL KEGIATAN (Anti-Typo) ---
    let detailKegiatan = 'Lainnya';
    
    if (rawJenis.includes('cpib kapal')) {
      detailKegiatan = 'CPIB Kapal';
    } else if (rawJenis.includes('cpib')) {
      detailKegiatan = 'CPIB';
    } else if (rawJenis.includes('cbib')) {
      detailKegiatan = 'CBIB';
    } else if (rawJenis.includes('haccp')) {
      detailKegiatan = 'HACCP';
    } else if (rawJenis.includes('skp')) {
      detailKegiatan = 'SKP';
    } else if (rawJenis.includes('spdi')) {
      detailKegiatan = 'SPDI';
    }

    // Sanitasi nama folder
    const namaPerusahaan = (report.nama_perusahaan || `Laporan-ID-${report.id}`).replace(/[\/\\?%*:|"<>]/g, '-');

    // --- LOGIKA BARU: MEMBUAT SUB-FOLDER TANGGAL & KETUA PETUGAS ---
    // Format Tanggal untuk nama folder (DD-MM-YYYY)
    const tglFolderStr = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    
    // Ambil Nama Ketua dari data petugas (format string: "Nama (Ketua)|Nama2 (Anggota)")
    let namaKetua = 'Tanpa-Ketua';
    if (report.petugas_pelaksana) {
      const petugasArr = String(report.petugas_pelaksana).split('|');
      const ketuaData = petugasArr.find(p => p.toLowerCase().includes('(ketua)'));
      if (ketuaData) {
        namaKetua = ketuaData.split('(')[0].trim();
      } else if (petugasArr.length > 0) {
        // Jika tidak ada yang ditandai ketua, ambil nama pertama
        namaKetua = petugasArr[0].split('(')[0].trim();
      }
    }
    
    // Sanitasi nama ketua untuk nama folder
    namaKetua = namaKetua.replace(/[\/\\?%*:|"<>]/g, '-');

    // Gabungkan menjadi nama sub-folder
    const namaSubFolder = `${tglFolderStr}_${namaKetua}`;

    // STRUKTUR FOLDER FINAL (Ditambah Sub-folder)
    const folderPath = path.join(baseLocalFolder, String(year), month, jenisUtama, detailKegiatan, namaPerusahaan, namaSubFolder);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // --- 3. PROSES UNDUH FILE ASLI (Surat Tugas, dll) ---
    const fileColumns = [
      { key: report.surat_tugas },
      { key: report.berkas_kegiatan },
      { key: report.berkas_perbaikan },
      { key: report.berkas_pemeriksaan_tindakan_perbaikan }
    ];

    for (const fileInfo of fileColumns) {
      if (!fileInfo.key) continue;

      let fileKeys = [];
      let rawStr = String(fileInfo.key).trim();
      
      if (rawStr.startsWith('[') && rawStr.endsWith(']')) {
        try {
          const parsed = JSON.parse(rawStr);
          fileKeys = Array.isArray(parsed) ? parsed : [rawStr];
        } catch (e) { fileKeys = [rawStr]; }
      } else {
        fileKeys = [rawStr];
      }

      for (let i = 0; i < fileKeys.length; i++) {
        const key = extractFileKey(fileKeys[i]);
        if (!key) continue;

        const fileName = key.split('/').pop();
        const destPath = path.join(folderPath, fileName);
        
        try {
          await downloadFile(baseUrl + key, destPath);
        } catch (error) {
          console.error(`Gagal mengunduh ${fileName}: ${error.message}`);
        }
      }
    }

    // --- 4. PROSES GENERATE PDF LAPORAN DARI TEMPLATE HTML ---
    // Kita tetap tambahkan ID di nama file agar jika ada 2 laporan di hari yang sama oleh ketua yang sama, tidak tertimpa
    const namaFilePdf = `Laporan_${report.id}_${namaPerusahaan}.pdf`;
    const pdfLaporanPath = path.join(folderPath, namaFilePdf);
    const urlCetak = `${cetakUrl}${report.id}`;
    
    try {
      console.log(`Membuat PDF Laporan dari ${urlCetak}...`);
      await generatePdfFromUrl(urlCetak, pdfLaporanPath);
      console.log(`BERHASIL: ${namaFilePdf}`);
    } catch (error) {
      console.error(`Gagal membuat PDF Laporan: ${error.message}`);
    }

    // --- 5. BUAT FILE CSV ---
    const csvHeader = 'ID,Nama Perusahaan,Tanggal,Pelaksana,Hasil,Kendala\n';
    const csvRow = `"${report.id}","${report.nama_perusahaan || ''}","${report.tanggal || ''}","${report.petugas_pelaksana || ''}","${report.hasil_kegiatan || ''}","${report.kendala || ''}"`;
    const namaFileCsv = `data_${report.id}.csv`;
    fs.writeFileSync(path.join(folderPath, namaFileCsv), csvHeader + csvRow, 'utf8');
  }

  await client.end();
  console.log(`Berhasil memproses ${reports.length} laporan.`);

  console.log('Mengunggah ke Google Drive...');
  try {
    // PERUBAHAN ADA DI BARIS INI (Ditambah tanda kutip dua karena ada spasi)
    execSync(`rclone copy ${baseLocalFolder} "gdrive:BACKUP MONICA IMUT"`, { stdio: 'inherit' });
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