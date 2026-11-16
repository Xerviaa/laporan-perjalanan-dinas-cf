'use client';

import { useState, useEffect, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function VerifyOtpForm() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Efek untuk hitung mundur
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Email tidak ditemukan.');
    
    setLoading(true);
    setError('');
    setSuccessMsg('');

    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'signup',
    });

    if (error) {
      setError(`Kode salah atau kedaluwarsa: ${error.message}`);
      setLoading(false);
    } else {
      router.push('/upload');
      router.refresh();
    }
  };

  const handleResend = async () => {
    if (!email || countdown > 0) return;

    setResendLoading(true);
    setError('');
    setSuccessMsg('');

    // Mengirim ulang OTP dengan tipe signup
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      setError(`Gagal mengirim ulang: ${error.message}`);
    } else {
      setSuccessMsg('Kode OTP baru telah dikirim ke email Anda.');
      setCountdown(60); // Mulai hitung mundur 60 detik
    }
    setResendLoading(false);
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

      {/* BAGIAN KANAN: Form Verifikasi OTP */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-4 md:p-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Verifikasi Email</h1>
            <p className="text-sm text-slate-500 mt-2">
              Kode 6 digit telah dikirim ke <br/>
              <strong className="text-blue-600">{email || 'email anda'}</strong>
            </p>
          </div>

          {/* Pesan Error */}
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center border border-red-100">{error}</div>}
          
          {/* Pesan Sukses Kirim Ulang */}
          {successMsg && <div className="bg-emerald-50 text-emerald-600 text-sm p-3 rounded-lg mb-4 text-center border border-emerald-100">{successMsg}</div>}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <input 
                type="text" 
                placeholder="• • • • • •" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                className="w-full px-4 py-4 rounded-xl border border-slate-300 text-center text-3xl tracking-[0.5em] font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-blue-50/50 placeholder:text-slate-300 placeholder:tracking-normal" 
                maxLength={6} 
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
            </button>
          </form>

          {/* BAGIAN KIRIM ULANG OTP */}
          <div className="mt-8 text-center border-t border-slate-100 pt-6">
             <p className="text-sm text-slate-500 mb-2">Tidak menerima kode?</p>
             
             {countdown > 0 ? (
                <p className="text-sm font-semibold text-slate-400">
                  Kirim ulang dalam <span className="text-blue-600">{countdown}</span> detik
                </p>
             ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendLoading ? 'Mengirim...' : 'Kirim Ulang Kode OTP'}
                </button>
             )}
          </div>

        </div>
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