import { NextResponse } from 'next/server';

export async function POST() {
  // --- TES HARCODE: KITA TULIS LANGSUNG TOKENNYA ---
  const GITHUB_TOKEN = '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'; // <--- PASTE TOKEN ASLI ANDA
  
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