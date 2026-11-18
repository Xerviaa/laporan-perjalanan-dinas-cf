'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State untuk melihat password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Inisialisasi client (meskipun kita pakai API route, ini tetap diperlukan jika ada pengecekan lain)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleResetTanpaOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Validasi kecocokan password
    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.');
      setLoading(false);
      return;
    }

    // Validasi panjang password
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      setLoading(false);
      return;
    }

    try {
      // Panggil API internal untuk mengganti password via Admin API
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password berhasil diubah! Silakan login dengan password baru Anda.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.message || 'Gagal mereset password. Pastikan email terdaftar.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      
      {/* BAGIAN KIRI: Branding (Sama seperti halaman Login) */}
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

      {/* BAGIAN KANAN: Form Lupa Password */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-4 md:p-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Lupa Password?</h1>
            <p className="text-sm text-slate-500 mt-2">Masukkan email dan password baru Anda.</p>
          </div>

          {message && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg mb-4 text-center border border-green-100">{message}</div>}
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center border border-red-100">{error}</div>}

          <form onSubmit={handleResetTanpaOtp} className="space-y-4">
            
            {/* Input Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Terdaftar</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-blue-50/50 placeholder:text-slate-400 placeholder:opacity-70 placeholder:italic" 
                placeholder="contoh: dedy.arief@bpmhkp.go.id" 
                required 
              />
            </div>

            {/* Input Password Baru */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Password Baru</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-blue-50/50 placeholder:text-slate-400 placeholder:opacity-70 placeholder:italic" 
                  placeholder="Minimal 6 karakter" 
                  required 
                  minLength={6}
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

            {/* Input Konfirmasi Password */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Konfirmasi Password Baru</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-blue-50/50 placeholder:text-slate-400 placeholder:opacity-70 placeholder:italic" 
                  placeholder="Ulangi password baru" 
                  required 
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 mt-2"
            >
              {loading ? 'Menyimpan...' : 'Ubah Password Sekarang'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Ingat password? <Link href="/login" className="text-blue-600 font-bold hover:underline">Kembali ke Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}