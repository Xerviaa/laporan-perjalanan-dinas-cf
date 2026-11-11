import { redirect } from 'next/navigation';

export default function Home() {
  // Otomatis arahkan ke dashboard guest saat link utama dibuka
  redirect('/monitoring-dashboard');
}