'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false); // Status apakah form siap diisi
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 1. Cek apakah ada event PASSWORD_RECOVERY dari URL (Supabase otomatis mendeteksi ini)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true); // Buka form jika token valid
      }
    });

    // 2. Cek sesi saat ini. Jika user sudah punya sesi aktif (misal dari login sebelumnya), 
    // kita bisa asumsikan mereka berhak mengganti password.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true);
      } else {
        // Jika tidak ada sesi dan tidak ada event recovery setelah 2 detik, 
        // beri pesan error link tidak valid.
        const timer = setTimeout(() => {
          setError('Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru.');
        }, 2000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(`Gagal: ${error.message}`);
    } else {
      setMessage('Password berhasil diubah! Anda akan diarahkan ke halaman login.');
      // Hapus sesi setelah ganti password agar user login ulang dengan password baru
      await supabase.auth.signOut(); 
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">Buat Password Baru</h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          {isReady ? "Silakan masukkan password baru Anda." : "Memverifikasi tautan..."}
        </p>

        {message && <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg mb-4 text-center border border-green-100">{message}</div>}
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center border border-red-100">{error}</div>}

        {/* Tampilkan form HANYA jika isReady bernilai true */}
        {isReady && (
          <form onSubmit={handleUpdate} className="space-y-4">
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
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}