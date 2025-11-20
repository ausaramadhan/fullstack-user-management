'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '../utils/axiosInstance';

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirm_password: '',
    role: 'user', // Default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle perubahan input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validasi sederhana di frontend
    if (formData.password !== formData.confirm_password) {
      setError('Password dan Konfirmasi Password tidak cocok!');
      setLoading(false);
      return;
    }

    try {
      // Panggil API Backend via Axios Instance (Otomatis ada Token)
      await axiosInstance.post('/users', formData);
      
      alert('User berhasil dibuat!');
      router.push('/dashboard'); // Kembali ke dashboard
    } catch (err: any) {
      console.error('Create Error:', err);
      const msg = err.response?.data?.message || 'Gagal membuat user';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Tambah User Baru</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 w-full p-2 border rounded text-black"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              required
              className="mt-1 w-full p-2 border rounded text-black"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded text-black"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="mt-1 w-full p-2 border rounded text-black"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
            <input
              type="password"
              name="confirm_password"
              required
              className="mt-1 w-full p-2 border rounded text-black"
              value={formData.confirm_password}
              onChange={handleChange}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-1/2 py-2 px-4 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`w-1/2 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}