import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: mongoose.Types.ObjectId;
        [key: string]: any;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Get token from cookies, Authorization header, or x-access-token
    const token = req.cookies?.authToken || 
                 req.headers.authorization?.split(" ")[1] 
                

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY as string) as {
      _id: string;
      [key: string]: any;
    };
    
    // Convert to ObjectId and attach user to request
    req.user = {
      ...decoded,
      _id: new mongoose.Types.ObjectId(decoded._id)
    };
    
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired token'
    });
  }
};