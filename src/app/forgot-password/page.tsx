'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

    // Validasi panjang password (Supabase minimal 6-8 karakter)
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      setLoading(false);
      return;
    }

    try {
      // Panggil API internal kita (akan kita buat di Langkah 2)
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Lupa Password?</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Masukkan email dan password baru Anda.</p>

        {message && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg mb-4 text-center border border-green-100">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center border border-red-100">{error}</div>}

        <form onSubmit={handleResetTanpaOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email Terdaftar</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              placeholder="contoh: dedy.arief@bpmhkp.go.id" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password Baru</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              placeholder="Minimal 6 karakter" 
              required 
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Konfirmasi Password Baru</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              placeholder="Ulangi password baru" 
              required 
              minLength={6}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Ubah Password Sekarang'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Ingat password? <Link href="/login" className="text-blue-600 font-bold hover:underline">Kembali ke Login</Link>
        </p>
      </div>
    </div>
  );
}