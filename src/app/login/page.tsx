'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // --- STATE & REF UNTUK CANVAS CAPTCHA ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  // Fungsi untuk menghasilkan teks acak dan menggambarnya ke Canvas
  const generateCanvasCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Karakter yang jelas (tanpa huruf/angka yang mirip seperti 0/O, 1/I)
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput('');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Bersihkan canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Latar belakang gradasi/warna lembut
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tambahkan garis-garis noise (gangguan) agar sulit dibaca bot OCR
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, 0.5)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Tambahkan titik-titik noise
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 200}, ${Math.random() * 200}, ${Math.random() * 200}, 0.7)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gambar teks karakter satu per satu dengan sedikit kemiringan (rotation)
    ctx.font = 'bold 28px monospace';
    for (let i = 0; i < result.length; i++) {
      ctx.save();
      const x = 25 + i * 30;
      const y = 32 + (Math.random() * 8 - 4);
      
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4); // Miringkan sedikit
      
      ctx.fillStyle = '#1e293b';
      ctx.fillText(result[i], 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCanvasCaptcha();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. VALIDASI CAPTCHA
    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Kode Verifikasi CAPTCHA salah! Silakan coba lagi.');
      generateCanvasCaptcha(); // Buat captcha baru
      setLoading(false);
      return;
    }

    // Menggunakan AbortController untuk mencegah loading menggantung (timeout 10 detik)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await res.json();

      if (res.ok && data.status === "success") {
        router.push('/upload'); 
        router.refresh();
      } else {
        setError(data.message || 'Email atau password salah.');
        generateCanvasCaptcha(); // Reset captcha jika login gagal dari server
        setLoading(false);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('Koneksi timeout: Server terlalu lama merespons.');
      } else {
        setError('Terjadi kesalahan pada server.');
      }
      generateCanvasCaptcha();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      {/* BAGIAN KIRI: Branding Monica Imut */}
      <div className="hidden md:flex md:w-1/2 bg-[#1a2332] text-white p-12 flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-md">
          <div className="mb-8 w-52 h-52 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-2xl border-4 border-slate-700">
            <Image 
              src="/logo-monica.png" 
              alt="Logo Monica Imut" 
              width={200} 
              height={200} 
              className="object-cover w-full h-full rounded-full" 
            />
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-widest mb-3 uppercase">
            MONICA IMUT
          </h1>
          <p className="text-sm md:text-base text-slate-400 tracking-wide leading-relaxed">
            Monitoring Capaian Sertifikasi Mutu Terpadu
          </p>
        </div>
      </div>

      {/* BAGIAN KANAN: Form Login */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-4 md:p-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Selamat Datang</h1>
            <p className="text-sm text-slate-500 mt-2">Silakan masuk menggunakan akun dinas Anda.</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center border border-red-100">{error}</div>}

          <form onSubmit={handleLogin} autoComplete="off" className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                name="login-email"
                autoComplete="off"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-blue-50/50 placeholder:text-slate-400 placeholder:opacity-70 placeholder:italic" 
                placeholder="Gunakan email anda (contoh@bppmhkp.go.id)" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  name="login-password"
                  autoComplete="new-password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-blue-50/50 placeholder:text-slate-400 placeholder:opacity-70 placeholder:italic" 
                  placeholder="••••••••" 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                Lupa password?
              </Link>
            </div>

            {/* --- KOTAK CANVAS CAPTCHA --- */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Verifikasi Keamanan (CAPTCHA)
              </label>
              
              <div className="flex items-center gap-3">
                {/* Elemen HTML5 Canvas untuk Gambar Captcha Ber-noise */}
                <canvas 
                  ref={canvasRef} 
                  width={140} 
                  height={45} 
                  className="rounded-lg border border-slate-300 shadow-inner bg-white cursor-pointer"
                  onClick={generateCanvasCaptcha}
                  title="Klik untuk memuat ulang gambar"
                />
                
                <button
                  type="button"
                  onClick={generateCanvasCaptcha}
                  className="px-3 py-2 text-slate-600 hover:text-blue-600 bg-white border border-slate-300 rounded-xl transition-colors text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  title="Ganti Gambar"
                >
                  🔄 Refresh
                </button>
              </div>

              <input
                type="text"
                autoComplete="off"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono uppercase bg-white tracking-widest placeholder:tracking-normal placeholder:normal-case placeholder:font-sans"
                placeholder="Masukkan 4 karakter di atas"
                maxLength={4}
                required
              />
            </div>
            {/* --------------------------- */}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>
          
          <p className="text-center text-sm text-slate-500 mt-6">
            Belum punya akun? <Link href="/register" className="text-blue-600 font-bold hover:underline">Daftar di sini</Link>
          </p>
        </div>
      </div>

    </div>
  );
}