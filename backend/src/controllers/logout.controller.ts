import { Request, Response } from "express";
import redis from "../config/redis";

export async function logoutController(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "refreshToken is required" });
  }

  const keys = await redis.keys("refresh:*");

  for (const key of keys) {
    const value = await redis.get(key);
    if (value === refreshToken) {
      await redis.del(key);
      return res.json({ message: "Logged out" });
    }
  }

  return res.status(400).json({ message: "Invalid refresh token" });
}
