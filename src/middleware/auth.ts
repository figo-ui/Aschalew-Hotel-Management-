import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthRequest extends Request {
  user?: any; // DecodedIdToken
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  // SUPPORT FOR DEMO TOKENS (critical for testing in sandboxed iframe environments)
  if (token === 'demo-guest-token') {
    req.user = {
      uid: 'demo_guest_uid',
      email: 'guest@aschalewhotel.com',
      displayName: 'Chiro Guest',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
    };
    return next();
  }
  
  if (token === 'demo-admin-token') {
    req.user = {
      uid: 'demo_admin_uid',
      email: 'admin@aschalewhotel.com',
      displayName: 'System Admin',
      photoURL: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150'
    };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
