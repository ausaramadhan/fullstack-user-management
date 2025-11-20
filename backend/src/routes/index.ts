import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import * as UserController from '../controllers/user.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Auth
router.post('/auth/login', AuthController.login);
router.post('/auth/logout', AuthController.logout);

// Users
router.get('/users', authenticateToken, authorizeRole(['admin']), UserController.getUsers);
router.post('/users', authenticateToken, authorizeRole(['admin']), UserController.create);
router.delete('/users/:id', authenticateToken, authorizeRole(['admin']), UserController.remove);
router.get('/users/export', authenticateToken, authorizeRole(['admin']), UserController.exportData);
router.get('/users/:id', authenticateToken, authorizeRole(['admin']), UserController.getOne);
router.put('/users/:id', authenticateToken, authorizeRole(['admin']), UserController.update);

export default router;