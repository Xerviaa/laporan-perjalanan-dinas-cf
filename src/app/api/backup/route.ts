import { NextResponse } from 'next/server';
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST() {
  let GITHUB_TOKEN = '';

  try {
    // 1. Coba ambil dari context Cloudflare (cara standar)
    const { env } = getCloudflareContext();
    GITHUB_TOKEN = (env as any).GITHUB_PAT;
  } catch (e) {
    // Abaikan error jika getCloudflareContext tidak tersedia (misal di localhost)
  }

  // 2. Jika kosong, coba ambil dari process.env (fallback)
  if (!GITHUB_TOKEN) {
    GITHUB_TOKEN = process.env.GITHUB_PAT || '';
  }

  // 3. Cek apakah token ada
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub Token belum disetting.' }, { status: 500 });
  }
  
  const OWNER = 'Xerviaa'; 
  const REPO = 'laporan-perjalanan-dinas-cf'; 

  try {
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'Monica-App'
      },
      body: JSON.stringify({
        event_type: 'backup_trigger',
      }),
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Sinyal backup terkirim!' });
    } else {
      const errorData = await response.json();
      return NextResponse.json({ error: 'Gagal memicu backup.', detail: errorData }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}