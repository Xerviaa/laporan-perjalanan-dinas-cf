'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(`Gagal: ${error.message}`);
    } else {
      setMessage('Link reset password telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Lupa Password?</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Masukkan email Anda untuk menerima link reset password.</p>

        {message && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg mb-4 text-center border border-green-100">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center border border-red-100">{error}</div>}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              placeholder="Masukkan email terdaftar" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Ingat password? <Link href="/login" className="text-blue-600 font-bold hover:underline">Kembali ke Login</Link>
        </p>
      </div>
    </div>
  );
}