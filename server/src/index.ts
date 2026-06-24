import express from 'express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { helmetMiddleware, corsMiddleware } from './middleware/security';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import healthRouter from './routes/health';
import issuesRouter from './routes/issues';
import verificationsRouter from './routes/verifications';
import usersRouter from './routes/users';
import open311Router from './routes/open311';

const app = express();

// 1. Helmet security headers
app.use(helmetMiddleware);

// 2. CORS configurations
app.use(corsMiddleware);

// 3. Body parsers with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 4. Rate limiting for general protection
app.use(generalLimiter);

// 5. Connect Routes
app.use(healthRouter); // GET /health is public at root
app.use('/api/issues', issuesRouter);
app.use('/api/verifications', verificationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/open311', open311Router);

// 6. Global error handler
app.use(errorHandler);

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 Community Hero Server listening on port ${PORT} in ${env.NODE_ENV} mode`);
});
