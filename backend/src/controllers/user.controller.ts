import { Request, Response } from 'express';
import * as UserService from '../services/user.service';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await UserService.getAllUsers(req.query);
    res.json(result);
  } catch (e) {
    res.status(500).json(e);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const result = await UserService.createUser(req.body, (req as any).user.id);
    res.status(201).json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await UserService.deleteUser(
      Number(req.params.id),
      req.body.confirm_password,
      (req as any).user.id,
    );
    res.json({ message: 'Deleted' });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

export const exportData = async (req: Request, res: Response) => {
  try {
    const csv = await UserService.exportCsv(req.query);
    res.header('Content-Type', 'text/csv');
    res.attachment('users.csv');
    res.send(csv);
  } catch (e) {
    res.status(500).send(e);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await UserService.getUserById(id);
    res.json({ data: result });
  } catch (e: any) {
    // Jika error 'User not found', kirim 404
    if (e.message === 'User not found') {
      res.status(404).json({ message: e.message });
    } else {
      res.status(500).json({ message: e.message });
    }
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await UserService.updateUser(id, req.body, (req as any).user.id);
    res.json({ data: result });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};
