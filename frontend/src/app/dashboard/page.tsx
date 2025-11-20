'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link untuk navigasi
import axiosInstance from '@/app/utils/axiosInstance';

// Definisi Tipe Data sesuai Response Backend
interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
}

export default function DashboardPage() {
  // State Data
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // State Filter & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);

  // State Sorting
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const router = useRouter();

  // 1. Fetch Data dari Backend
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const roleParam = filterRole !== 'all' ? filterRole : undefined;

        const response = await axiosInstance.get('/users', {
          params: {
            page: currentPage,
            limit: 10,
            q: searchTerm,
            role: roleParam,
            sortBy: sortKey,
            sortDir: sortDirection,
          },
        });

        const { data, metadata } = response.data;
        setUsers(data);
        setTotalPages(metadata.totalPage);
        setTotalData(metadata.totalData);
      } catch (error: any) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchTerm, filterRole, sortKey, sortDirection]);

  // 2. Handler Logout
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axiosInstance.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.clear();
      router.push('/login');
    }
  };

  // 3. Handler Delete
  const handleDelete = async (id: number) => {
    const password = window.prompt(
      `PENTING: Masukkan Password Admin Anda untuk menghapus User ID ${id}:`,
    );

    if (!password) return;

    try {
      await axiosInstance.delete(`/users/${id}`, {
        data: { confirm_password: password },
      });

      alert('User berhasil dihapus!');
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gagal menghapus user';
      alert(`Gagal: ${msg}`);
    }
  };

  // 4. Handler Export CSV
  const handleExport = async () => {
    try {
      const roleParam = filterRole !== 'all' ? filterRole : undefined;
      const response = await axiosInstance.get('/users/export', {
        params: {
          role: roleParam,
          q: searchTerm,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error', error);
      alert('Gagal export CSV');
    }
  };

  // Helper Sort UI
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortIndicator = (key: string) => {
    if (sortKey === key) {
      return sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <h1 className="text-3xl font-bold text-gray-800">Manajemen Pengguna</h1>
        <div className="flex space-x-3">
          <Link
            href="/create"
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            + Tambah User Baru
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-xl">
        {/* Filter Bar */}
        <div className="mb-4 flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Cari nama / username..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value as 'all' | 'admin' | 'user');
                setCurrentPage(1);
              }}
              className="rounded-md border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Download CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  ID {sortIndicator('id')}
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Name {sortIndicator('name')}
                </th>
                <th
                  onClick={() => handleSort('username')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Username {sortIndicator('username')}
                </th>
                <th
                  onClick={() => handleSort('role')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Role {sortIndicator('role')}
                </th>
                <th
                  onClick={() => handleSort('created_at')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Created At {sortIndicator('created_at')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-black">
                    Loading data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-black">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.username}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      {/* TOMBOL EDIT */}
                      <Link
                        href={`/user/${user.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4 font-bold"
                      >
                        Edit
                      </Link>
                      {/* TOMBOL DELETE */}
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Page {currentPage} of {totalPages} (Total: {totalData})
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded bg-white text-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded bg-white text-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
