'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // MENGARAHKAN LANGSUNG KE DASHBOARD MONITORING SETELAH LOGIN BERHASIL
        router.push('/monitoring-dashboard');
        router.refresh();
      } else {
        setError(data.message || 'Login gagal');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      
      {/* KIRI: Branding & Logo (Garis Lurus Tegas) */}
      <div className="hidden lg:flex w-1/2 bg-[#1a252f] text-white flex-col justify-center items-center p-12 relative overflow-hidden border-r-2 border-slate-700 shadow-2xl z-20">
        
        {/* Pola Latar Belakang Elegan */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          
          {/* Logo Instansi - DIPERBARUI */}
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-slate-600/50 shadow-2xl mb-8 bg-white p-2 flex items-center justify-center">
            <img 
              src="/logo-monica.png" 
              alt="Logo MONICA IMUT" 
              className="w-full h-full object-contain scale-110 rounded-full" 
            />
          </div>

          <h1 className="text-5xl font-extrabold mb-3 tracking-wider text-slate-200 drop-shadow-md">MONICA IMUT</h1>
          <h2 className="text-xl font-bold text-blue-400 mb-6 tracking-wide">Monitoring Capaian Sertifikasi Mutu Terpadu</h2>
          
          <p className="text-slate-400 text-lg max-w-md leading-relaxed mt-4">
            Platform terpusat untuk pengelolaan, pengarsipan, dan pelaporan kegiatan sertifikasi mutu secara efisien dan aman.
          </p>
        </div>
      </div>

      {/* KANAN: Form Login dengan Efek Kaca */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-200 p-8 relative">
        
        {/* Ornamen Latar Belakang */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

        {/* Kotak Form (Glassmorphism) */}
        <div className="max-w-md w-full bg-white/60 backdrop-blur-lg border border-white/40 p-8 rounded-3xl shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Selamat Datang</h1>
            <p className="text-slate-500 mt-2 text-sm">Silakan masuk menggunakan akun dinas Anda.</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/50 border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800"
                placeholder="admin.id"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/50 border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-800"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full font-bold p-3 rounded-xl transition-all shadow-md mt-4 flex justify-center items-center gap-2
                ${isLoading 
                  ? 'bg-blue-400 cursor-not-allowed text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer text-white hover:shadow-lg'
                }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                'Masuk ke Sistem'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}