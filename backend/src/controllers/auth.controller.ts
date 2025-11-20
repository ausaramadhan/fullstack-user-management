import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';

export const login = async (req: Request, res: Response) => {
  try {
    // FIX: Kirim sebagai satu objek { username, password }
    const result = await AuthService.login({
      username: req.body.username,
      password: req.body.password,
    });
    res.json({ data: result });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    await AuthService.logout(req.body.refreshToken);
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json(error);
  }
};
