import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import config from '../config';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const userType = req.user.userType || req.user.type;
    if (!roles.includes(userType)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
      });
    }

    next();
  };
};
