import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api', // URL Backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Otomatis tempel token di setiap request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 2. Response Interceptor: Handle Error 401 (Token Expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika Error 401 dan belum pernah retry sebelumnya
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Tandai agar tidak looping infinite

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // Panggil Endpoint Refresh Token
        const { data } = await axios.post('http://localhost:8000/api/auth/refresh', {
          refreshToken,
        });

        // Simpan Token Baru
        const { token: newToken, refreshToken: newRefreshToken } = data.data;
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update header request yang gagal tadi dengan token baru
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        // Ulangi request awal
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Jika refresh gagal juga (misal refresh token expired), paksa logout
        console.error('Session expired:', refreshError);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
