'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // STATE BARU UNTUK MENAHAN RENDER
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // --- STATE UNTUK POPUP LOGIN PIN ---
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- STATE UNTUK POPUP SELAMAT DATANG ---
  const [showWelcome, setShowWelcome] = useState(false);

  // --- STATE WAKTU REALTIME ---
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // --- STATE UNTUK PWA ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // --- CEK STATUS LOGIN ADMIN ---
  const checkAdminStatus = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      setIsAdmin(false);
    } finally {
      // Selesai mengecek, hilangkan blocker
      setIsCheckingAuth(false); 
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [pathname]);

  // --- CEK POPUP SELAMAT DATANG (HANYA MUNCUL SETELAH LOGIN) ---
  useEffect(() => {
    if (isAdmin && sessionStorage.getItem('justLoggedIn') === 'true') {
      setShowWelcome(true);
      sessionStorage.removeItem('justLoggedIn'); // Hapus agar tidak muncul terus
      
      // Hilangkan pop-up setelah 3 detik
      const timer = setTimeout(() => setShowWelcome(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isAdmin]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // --- LOGIKA WAKTU REALTIME (HH:mm:ss) ---
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
      setCurrentDate(now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- LOGIKA PWA (TANGKAP EVENT SAJA) ---
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // --- EFEK SAAT PINDAH HALAMAN (PWA) ---
  useEffect(() => {
    if ((pathname === '/arsip' || pathname === '/monitoring-dashboard' || pathname === '/admin/admin-monitoring-dashboard') && deferredPrompt) {
      setShowInstallBtn(true);
    } else {
      setShowInstallBtn(false);
    }
  }, [pathname, deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShowInstallBtn(false);
  };

  const handleDismissInstall = () => {
    setShowInstallBtn(false);
  };

  // --- FUNGSI LOGOUT ---
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (error) {
      console.error("Gagal menghapus sesi:", error);
    } finally {
      window.location.href = '/monitoring-dashboard'; 
    }
  };

  // --- LOGIKA SUBMIT PIN ---
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (res.ok) {
        setIsLoginModalOpen(false);
        setPin('');
        
        // TANDAI BAHWA BARU SAJA LOGIN
        sessionStorage.setItem('justLoggedIn', 'true');

        router.push('/admin/admin-monitoring-dashboard'); 
        router.refresh();
      } else {
        setLoginError(data.message || 'PIN Salah!');
      }
    } catch (err) {
      setLoginError('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ==========================================
  // MENU ITEMS DINAMIS
  // ==========================================
  const menuItems = isAdmin 
    ? [
        { name: 'Dashboard Monitoring', path: '/admin/admin-monitoring-dashboard', icon: '📈' },
        { name: 'Upload Laporan', path: '/admin/upload', icon: '📤' },
        { name: 'Arsip Laporan', path: '/admin/arsip', icon: '📁' },
        { name: 'Monitoring Sertifikasi', path: '/admin/monitoring', icon: '📊' },
        { name: 'Backup Google Drive', path: '/admin/backup', icon: '☁️' },
      ]
    : [
        { name: 'Dashboard Monitoring', path: '/monitoring-dashboard', icon: '📈' },
        { name: 'Upload Laporan', path: '/upload', icon: '📤' },
        { name: 'Arsip Laporan', path: '/arsip', icon: '📁' },
        { name: 'Google Drive', path: 'https://drive.google.com/drive/u/1/folders/1KB4yOsjA2SPYjlGF_4YaezMXZC66D4aP', icon: '☁️' },
      ];

  // =======================================================
  // BLOKIR RENDER JIKA MASIH MENGEcek SESI
  // =======================================================
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memeriksa Sesi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans relative overflow-x-hidden">
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#2c3e50] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        
        <div className="h-56 flex flex-col items-center justify-center border-b border-slate-600/50 bg-[#1a252f] p-3">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-600/50 shadow-lg mb-3 bg-white p-1 flex items-center justify-center">
            <img src="/logo-monica.png" alt="Logo MONICA IMUT" className="w-full h-full object-contain scale-110 rounded-full" />
          </div>
          <h1 className="text-lg font-bold tracking-widest text-slate-100 text-center leading-tight">MONICA IMUT</h1>
          <p className="text-[9px] text-slate-400 mt-1 uppercase text-center px-2">Monitoring Capaian Sertifikasi Mutu Terpadu</p>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = !item.path.startsWith('http') && pathname === item.path;
            
            if (item.path.startsWith('http')) {
               return (
                <a key={item.name} href={item.path} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 px-4 py-3 transition-colors border-l-4 border-transparent text-slate-300 hover:bg-[#34495e] hover:text-white`}>
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm">{item.name}</span>
                </a>
               )
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 transition-colors border-l-4 ${
                  isActive ? 'bg-blue-500 border-white text-white font-semibold' : 'border-transparent text-slate-300 hover:bg-[#34495e] hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* BAGIAN BAWAH: TOMBOL LOGIN / LOGOUT */}
        <div className="p-3 border-t border-slate-600/50">
          {isAdmin ? (
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-red-300 hover:bg-red-500/20 hover:text-red-200 rounded transition-colors cursor-pointer">
              <span>🚪</span>
              <span className="text-sm font-semibold">Keluar</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded transition-colors shadow-md cursor-pointer"
            >
              <span>🔑</span>
              <span>Login Admin</span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen">
        
        {/* TOP BAR */}
        <header className="h-14 bg-[#2c3e50] border-b border-slate-700 flex items-center justify-between px-4 md:px-6 shadow-md shrink-0 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500 opacity-80"></div>
          <div className="flex items-center gap-3 relative z-10">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-300 hover:text-white focus:outline-none cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h2 className="text-sm md:text-base font-semibold text-slate-100 tracking-wide truncate">MONICA IMUT - Monitoring Capaian Sertifikasi Mutu Terpadu</h2>
          </div>
          <div className="flex items-center gap-3 md:gap-5 relative z-10">
            <div className="text-right hidden md:block border-r border-slate-600 pr-4">
              <p className="text-sm font-mono font-bold text-white tracking-widest">{currentTime || '...'}</p>
              <p className="text-[10px] text-slate-400">{currentDate}</p>
            </div>
            <div className={`w-7 h-7 md:w-9 md:h-9 ${isAdmin ? 'bg-blue-600 ring-blue-400/50' : 'bg-slate-600 ring-slate-400/50'} text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-md ring-2`}>
              {isAdmin ? 'A' : 'G'}
            </div>
          </div>
        </header>

        {/* RUNNING TEXT (INFO) */}
        <div className="bg-slate-900 text-white text-[10px] md:text-xs py-1.5 overflow-hidden flex items-center border-b border-slate-700 shadow-inner shrink-0">
          <div className="px-3 font-bold flex items-center gap-1.5 bg-slate-800 h-full py-1.5 z-10 shadow-md whitespace-nowrap">
            <span className="animate-pulse text-yellow-400">📢</span> INFO
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="animate-marquee">
              Selamat Datang di MONICA IMUT (Monitoring Capaian Sertifikasi Mutu Terpadu) BPPMHKP Denpasar. Harap unggah laporan maksimal 3 hari setelah perjalanan dinas selesai. Tetap jaga integritas dan profesionalisme kerja!
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto overflow-x-hidden flex-1">
          {children}
        </div>
      </main>

      {/* --- POPUP SELAMAT DATANG ADMIN --- */}
      {showWelcome && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-300">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl border border-emerald-200 flex flex-col items-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Selamat Datang, Admin!</h2>
            <p className="text-slate-500 text-sm text-center max-w-xs">Login berhasil. Anda sekarang memiliki akses penuh ke sistem.</p>
          </div>
        </div>
      )}

      {/* --- POPUP INSTALL PWA --- */}
      {showInstallBtn && (
        <div className="fixed bottom-4 right-4 z-50 bg-white p-3 rounded-xl shadow-2xl border border-slate-200 flex items-center gap-3 animate-bounce-slow">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 overflow-hidden p-1 border border-slate-200">
            <img src="/logo-monica.png" alt="Logo MONICA IMUT" className="w-full h-full object-contain scale-110 rounded-full" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Install Aplikasi</p>
            <p className="text-[10px] text-slate-500 mb-1.5">Akses MONICA IMUT lebih cepat dari layar utama.</p>
            <div className="flex gap-2">
              <button onClick={handleInstallClick} className="bg-blue-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded hover:bg-blue-700 transition-colors cursor-pointer">Install</button>
              <button onClick={handleDismissInstall} className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer">Nanti</button>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL LOGIN PIN --- */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="h-2 w-full bg-blue-600"></div>
            
            <form onSubmit={handlePinSubmit} className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-1">Admin Access</h3>
              <p className="text-slate-500 text-xs mb-6">Masukkan PIN rahasia untuk membuka menu admin.</p>

              {loginError && (
                <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs mb-4 border border-red-100">
                  {loginError}
                </div>
              )}

              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center text-3xl tracking-[0.5em] font-mono border-2 border-slate-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none mb-6"
                placeholder="••••••"
                maxLength={6}
                autoFocus
                required 
              />

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsLoginModalOpen(false); setPin(''); setLoginError(''); }} 
                  className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-70 cursor-pointer"
                >
                  {isLoggingIn ? 'Cek...' : 'Masuk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}