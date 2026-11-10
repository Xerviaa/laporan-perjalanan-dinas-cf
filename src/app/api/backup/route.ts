import { NextResponse } from 'next/server';
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST() {
  let GITHUB_TOKEN;

  try {
    // Ambil token dari Environment Variable Cloudflare
    const { env } = getCloudflareContext();
    // TAMBAHKAN (env as any) DI SINI 👇
    GITHUB_TOKEN = (env as any).GITHUB_PAT; 
  } catch (error) {
    // Fallback untuk localhost
    GITHUB_TOKEN = process.env.GITHUB_PAT;
  }
  
  const OWNER = 'Xerviaa'; 
  const REPO = 'laporan-perjalanan-dinas-cf'; 

  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GitHub Token belum disetting.' }, { status: 500 });
  }

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