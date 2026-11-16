'use client';

import { useState, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyOtpForm() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Email tidak ditemukan.');
    
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'signup',
    });

    if (error) {
      setError(`Kode salah atau kedaluwarsa: ${error.message}`);
      setLoading(false);
    } else {
      router.push('/admin/upload');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <h1 className="text-2xl font-bold text-center mb-2">Verifikasi Email</h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          Kode 6 digit telah dikirim ke <strong>{email}</strong>
        </p>
        
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleVerify} className="space-y-4">
          <input type="text" placeholder="Masukkan 6 digit kode" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center text-2xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none" maxLength={6} required />
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50">
            {loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}