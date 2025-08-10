import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

interface JWTUserData {
  _id: mongoose.Types.ObjectId;
  [key: string]: any;
}
interface ExpressRequest extends Request{
user:JWTUserData
}

export const authenticate = async (req: ExpressRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from cookies, Authorization header, or x-access-token
    const token = req.cookies?.authToken || 
                 req.headers.authorization?.split(" ")[1] || 
                 req.headers['x-access-token'];

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY as string) as JWTUserData;
    
    // Convert to ObjectId
    decoded._id = new mongoose.Types.ObjectId(decoded._id);
    
    // Attach user to request
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired token'
    });
  }
};