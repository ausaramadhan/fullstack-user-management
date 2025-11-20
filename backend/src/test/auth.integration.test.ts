import request from 'supertest';
import app from '../app';

// Mock Service Layer
const authService = jest.requireMock('../services/auth.service');
jest.mock('../services/auth.service', () => ({
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
}));

describe('Auth Integration Tests', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('POST /api/auth/login', () => {
        const loginBody = { username: 'testuser', password: 'password123' };
        
        it('should return 200 and tokens on successful login', async () => {
            authService.login.mockResolvedValue({
                token: 'mock_access_token',
                refreshToken: 'mock_refresh_token',
                expiredAt: new Date().toISOString(),
                user: { id: 1, role: 'admin' }
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginBody);

            expect(response.statusCode).toBe(200);
            expect(response.body.data.token).toBe('mock_access_token');
            
            // Verify Called with Object
            expect(authService.login).toHaveBeenCalledWith({
                username: loginBody.username,
                password: loginBody.password
            });
        });

        it('should return 401 on login failure', async () => {
            authService.login.mockRejectedValue(new Error('username atau password salah'));

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginBody);

            expect(response.statusCode).toBe(401);
        });
    });
});