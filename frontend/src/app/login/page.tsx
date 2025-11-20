'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true); // Mulai dengan true untuk cek sesi
  const router = useRouter();

  // 1. Cek apakah user sudah login saat halaman dibuka
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Jika ada token, langsung lempar ke dashboard
      router.push('/dashboard');
    } else {
      // Jika tidak ada token, tampilkan form login
      setLoading(false);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Loading saat submit

    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        username,
        password,
      });

      const { token, refreshToken, user } = response.data.data;

      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      alert(`Login Berhasil! Selamat datang, ${user.name}`);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login Error:', error);
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat login';
      alert(`Login Gagal: ${errorMessage}`);
      setLoading(false); // Matikan loading jika gagal
    }
  };

  // Tampilkan loader hanya saat mengecek sesi awal
  if (loading && !username) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Memeriksa sesi...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">Login ke Aplikasi</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-black focus:border-blue-500 focus:ring-blue-500"
              placeholder="Masukkan username"
            />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-black focus:border-blue-500 focus:ring-blue-500"
              placeholder="Masukkan password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md px-4 py-2 text-white ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
