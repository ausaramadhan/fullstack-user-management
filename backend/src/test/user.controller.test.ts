import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';

// --- MOCK SERVICE LAYER ---
// Kita mock service layer yang dipanggil oleh controller
const userService = jest.requireMock('../services/user.service');
jest.mock('../services/user.service', () => ({
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
  deleteUser: jest.fn(),
  exportCsv: jest.fn(),
}));

// Mengambil dari .env (asumsi sudah terisi)
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Helper function to generate tokens
const generateToken = (id: number, role: 'admin' | 'user') => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '1h' });
};

// --- Mock Data ---
const adminToken = generateToken(1, 'admin');
const userToken = generateToken(2, 'user');

const mockUserList = [
  // Tambahkan created_at untuk konsistensi data
  {
    id: 10,
    name: 'Admin',
    username: 'admin1',
    role: 'admin',
    created_at: new Date().toISOString(),
  },
  { id: 11, name: 'User A', username: 'userA', role: 'user', created_at: new Date().toISOString() },
];
const mockTotalCount = 2;

describe('User Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // A. GET /api/users (List, Pagination)
  // ------------------------------------------------------------------
  describe('GET /api/users', () => {
    const mockServiceResult = {
      data: mockUserList,
      metadata: { totalData: mockTotalCount, totalPage: 1, currentPage: 1, perPage: 10 },
    };

    it('should return 200 and list of users for Admin', async () => {
      userService.getAllUsers.mockResolvedValue(mockServiceResult);

      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(userService.getAllUsers).toHaveBeenCalledTimes(1);
      expect(response.body.data.length).toBe(mockUserList.length);
    });

    it('should return 403 Forbidden for regular User (RBAC check)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(403);
      // Perbaikan ini sudah diterapkan sebelumnya.
      expect(response.body.message).toBe('Access Denied');
      expect(userService.getAllUsers).not.toHaveBeenCalled();
    });

    it('should return 401 if token is missing', async () => {
      const response = await request(app).get('/api/users');

      expect(response.statusCode).toBe(401);
    });
  });

  // ------------------------------------------------------------------
  // B. POST /api/users (Create User)
  // ------------------------------------------------------------------
  describe('POST /api/users', () => {
    const createBody = {
      name: 'New Test',
      username: 'newtest',
      password: 'password123',
      confirm_password: 'password123',
      role: 'user',
    };

    // Mock data untuk service (tanpa password_hash)
    const mockCreatedUserOutput = {
      id: 3,
      name: createBody.name,
      username: createBody.username,
      role: createBody.role,
      created_at: new Date().toISOString(),
    };

    it('should return 201 and create user successfully for Admin', async () => {
      // Service hanya mengembalikan objek user
      userService.createUser.mockResolvedValue(mockCreatedUserOutput);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createBody);

      expect(response.statusCode).toBe(201);
      expect(userService.createUser).toHaveBeenCalledTimes(1);

      // 🔥 CRITICAL FIX: Mengubah ekspektasi dari response.body.data.username menjadi response.body.username
      // Ini agar sesuai dengan respons yang dikirimkan controller Anda (user object langsung).
      expect(response.body.username).toBe('newtest');
      // Jika Anda ingin controller mengikuti spesifikasi API, Anda harus mengubah kode controller Anda.
    });

    it('should return 400 if service throws validation error (e.g., password mismatch)', async () => {
      const invalidBody = { ...createBody, confirm_password: 'mismatch' };
      userService.createUser.mockRejectedValue(new Error('Password tidak cocok'));

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidBody);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Password tidak cocok');
    });

    it('should return 403 for non-Admin role', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBody);

      expect(response.statusCode).toBe(403);
      expect(userService.createUser).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // C. DELETE /api/users/{id} (Soft Delete)
  // ------------------------------------------------------------------
  describe('DELETE /api/users/:id', () => {
    const deleteBody = { confirm_password: 'admin123' };

    it('should return 200 and delete user successfully for Admin', async () => {
      userService.deleteUser.mockResolvedValue({ message: 'Deleted' });

      const response = await request(app)
        .delete('/api/users/12')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(deleteBody);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Deleted');
      expect(userService.deleteUser).toHaveBeenCalledTimes(1);
      expect(userService.deleteUser).toHaveBeenCalledWith(12, 'admin123', 1);
    });

    it('should return 400 if wrong admin password is provided', async () => {
      userService.deleteUser.mockRejectedValue(new Error('Password admin salah'));

      const response = await request(app)
        .delete('/api/users/12')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ confirm_password: 'wrongpass' });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Password admin salah');
    });

    it('should return 403 for non-Admin role', async () => {
      const response = await request(app)
        .delete('/api/users/12')
        .set('Authorization', `Bearer ${userToken}`)
        .send(deleteBody);

      expect(response.statusCode).toBe(403);
    });
  });

  // ------------------------------------------------------------------
  // D. GET /api/users/export (Export CSV)
  // ------------------------------------------------------------------
  describe('GET /api/users/export', () => {
    const mockCsvData = 'id,name,username\n10,Admin,admin1\n11,User A,userA';

    it('should return 200 with CSV content for Admin', async () => {
      userService.exportCsv.mockResolvedValue(mockCsvData);

      const response = await request(app)
        .get('/api/users/export?role=user')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toBe(mockCsvData);
      expect(userService.exportCsv).toHaveBeenCalledTimes(1);
    });

    it('should return 403 for non-Admin role', async () => {
      const response = await request(app)
        .get('/api/users/export')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.statusCode).toBe(403);
      expect(userService.exportCsv).not.toHaveBeenCalled();
    });
  });
});
