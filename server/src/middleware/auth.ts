import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role: 'reporter' | 'validator' | 'admin';
  };
}

export async function verifyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    
    // Support mock tokens for local testing and demo fallback session
    if (token.startsWith('demo_token_')) {
      if (env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Mock authentication is disabled in production.' });
      }
      const uid = token.replace('demo_token_', '');
      req.user = {
        uid: uid,
        email: `${uid}@communityhero.org`,
        role: 'reporter',
      };
      return next();
    }

    const decoded = await auth.verifyIdToken(token);
    
    // Default role is reporter if custom claims are not set yet
    const role = (decoded.role as 'reporter' | 'validator' | 'admin') || 'reporter';

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: role,
    };
    next();
  } catch (err) {
    logger.warn({ err }, 'Invalid auth token verification attempt');
    return res.status(401).json({ error: 'Invalid auth token' });
  }
}

export function requireRole(roles: ('reporter' | 'validator' | 'admin')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}
