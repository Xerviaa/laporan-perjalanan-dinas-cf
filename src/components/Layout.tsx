'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- STATE WAKTU REALTIME ---
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // --- STATE UNTUK PWA ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

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
    if ((pathname === '/arsip' || pathname === '/monitoring-dashboard') && deferredPrompt) {
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

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // MENU ITEMS
  const menuItems = [
    { name: 'Dashboard Monitoring', path: '/monitoring-dashboard', icon: '📈' },
    { name: 'Upload Laporan', path: '/upload', icon: '📤' },
    { name: 'Arsip Laporan', path: '/arsip', icon: '📁' }, 
    { name: 'Monitoring Sertifikasi', path: '/monitoring', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans relative overflow-x-hidden">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#2c3e50] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        
        {/* Area Logo & Nama Aplikasi */}
        <div className="h-56 flex flex-col items-center justify-center border-b border-slate-600/50 bg-[#1a252f] p-3">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-600/50 shadow-lg mb-3 bg-white p-1">
            <img 
              src="/logo-monica.png" 
              alt="Logo MONICA IMUT" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="text-lg font-bold tracking-widest text-slate-100 text-center leading-tight">MONICA IMUT</h1>
          <p className="text-[9px] text-slate-400 mt-1 uppercase text-center px-2">Monitoring Capaian Sertifikasi Mutu Terpadu</p>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 transition-colors border-l-4 ${
                  isActive 
                    ? 'bg-blue-500 border-white text-white font-semibold' 
                    : 'border-transparent text-slate-300 hover:bg-[#34495e] hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-600/50">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-red-300 hover:bg-red-500/20 hover:text-red-200 rounded transition-colors cursor-pointer">
            <span>🚪</span>
            <span className="text-sm">Keluar</span>
          </button>
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
            {/* Judul Header Atas Diganti */}
            <h2 className="text-sm md:text-base font-semibold text-slate-100 tracking-wide truncate">
              MONICA IMUT - Monitoring Capaian Sertifikasi Mutu Terpadu
            </h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-5 relative z-10">
            <div className="text-right hidden md:block border-r border-slate-600 pr-4">
              <p className="text-sm font-mono font-bold text-white tracking-widest">{currentTime || '...'}</p>
              <p className="text-[10px] text-slate-400">{currentDate}</p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-white">ADMIN</p>
              <p className="text-[10px] text-slate-400">admin.id</p>
            </div>
            <div className="w-7 h-7 md:w-9 md:h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-md ring-2 ring-blue-400/50">
              A
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
              {/* Teks Running Diganti */}
              Selamat Datang di MONICA IMUT (Monitoring Capaian Sertifikasi Mutu Terpadu) BPPMHKP Denpasar. Harap unggah laporan maksimal 3 hari setelah perjalanan dinas selesai. Tetap jaga integritas dan profesionalisme kerja!
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto overflow-x-hidden flex-1">
          {children}
        </div>
      </main>

      {/* --- POPUP INSTALL PWA --- */}
      {showInstallBtn && (
        <div className="fixed bottom-4 right-4 z-50 bg-white p-3 rounded-xl shadow-2xl border border-slate-200 flex items-center gap-3 animate-bounce-slow">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 overflow-hidden p-1 border border-slate-200">
            <img 
              src="/logo-monica.png" 
              alt="Logo MONICA IMUT" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Install Aplikasi</p>
            <p className="text-[10px] text-slate-500 mb-1.5">Akses MONICA IMUT lebih cepat dari layar utama.</p>
            <div className="flex gap-2">
              <button onClick={handleInstallClick} className="bg-blue-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded hover:bg-blue-700 transition-colors cursor-pointer">
                Install
              </button>
              <button onClick={handleDismissInstall} className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2.5 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer">
                Nanti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}