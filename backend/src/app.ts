import express from 'express';
import cors from 'cors';
import routes from './routes';
import { apiLimiter } from './middlewares/rateLimit.middleware';
import { logger } from './utils/logger';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger'; // Import dari file yang baru dibuat

const app = express();

app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// Dokumentasi Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Request Logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use('/api', routes);

export default app;
