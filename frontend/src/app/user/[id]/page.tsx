'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
// FIX: Menggunakan alias import agar path selalu benar dimanapun file berada
import axiosInstance from '@/app/utils/axiosInstance';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'user',
  });

  const [userMeta, setUserMeta] = useState({
    created_at: '',
    updated_at: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!userId) return;

        const response = await axiosInstance.get(`/users/${userId}`);
        const userData = response.data.data;

        setFormData({
          name: userData.name,
          username: userData.username,
          role: userData.role,
        });

        setUserMeta({
            created_at: userData.created_at,
            updated_at: userData.updated_at
        });

      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError('Gagal mengambil data user. User mungkin tidak ditemukan.');
        if (err.response?.status === 404) {
            setTimeout(() => router.push('/dashboard'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await axiosInstance.put(`/users/${userId}`, formData);
      alert(`User '${formData.name}' berhasil diperbarui!`);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Update error:', err);
      const msg = err.response?.data?.message || 'Gagal memperbarui user';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-xl font-semibold text-gray-600">Loading data user...</p>
      </div>
    );
  }

  if (error && !formData.name) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 flex-col">
            <p className="text-xl font-bold text-red-600 mb-4">{error}</p>
            <Link href="/dashboard" className="text-blue-600 underline">Kembali ke Dashboard</Link>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Edit User (ID: {userId})</h1>
          <Link
            href="/dashboard"
            className="rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2">Informasi Pengguna</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm border border-red-200">
              {error}
            </div>
          )}
          
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm text-gray-500 bg-gray-50 p-4 rounded">
            <div>
                <strong>Dibuat pada:</strong><br/>
                {userMeta.created_at ? new Date(userMeta.created_at).toLocaleString() : '-'}
            </div>
            <div>
                <strong>Terakhir update:</strong><br/>
                {userMeta.updated_at ? new Date(userMeta.updated_at).toLocaleString() : '-'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-black"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-black"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 p-3 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-black bg-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100 flex items-center">
                <span className="mr-2">ℹ️</span>
                Password tidak dapat diubah di halaman ini.
            </div>

            <button
              type="submit"
              disabled={saving}
              className={`w-full rounded-md bg-blue-600 px-4 py-3 text-lg font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ${
                saving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}