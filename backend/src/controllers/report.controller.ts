// src/controllers/report.controller.ts

import { Request, Response } from 'express';
import { getActiveUserReport } from '../services/report.service';

export const getReport = async (req: Request, res: Response) => {
    try {
        // FIX: Gunakan (req as any).user untuk bypass pengecekan tipe TS
        const user = (req as any).user; 

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied' });
        }
    } catch (error) {
        // Tangani error
        return res.status(500).json({ message: 'Failed to generate report' });
    }
};