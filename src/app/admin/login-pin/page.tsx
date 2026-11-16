'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLoginPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      router.push('/admin/admin-monitoring-dashboard');
      router.refresh();
    } else {
      setError('PIN Admin salah!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Akses Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Masukkan PIN Rahasia untuk melanjutkan</p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleLoginPin} className="space-y-4">
          <input
            type="password"
            placeholder="Masukkan 6 Digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={6}
            required
          />
          <button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
            {loading ? 'Memverifikasi...' : 'Masuk sebagai Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}