import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  
  // Redact potential API keys (e.g. AIzaSy...)
  const rawMessage = err.message || 'Internal error';
  const safeMessage = rawMessage.replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED]');

  logger.error({ 
    err: {
      message: safeMessage,
      stack: err.stack ? err.stack.replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED]') : undefined
    },
    path: req.path,
    method: req.method,
    ip: req.ip
  }, 'Unhandled request error');

  res.status(status).json({ 
    error: status === 500 ? 'Internal server error' : safeMessage 
  });
}
