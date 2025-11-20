import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 100,
  message: { message: 'Too many requests from this IP, please try again later' },
});
