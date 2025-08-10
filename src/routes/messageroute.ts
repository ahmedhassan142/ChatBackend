const express=require('express')
import { NextFunction } from 'express';
import {
  getMessages,
  deleteMessage,
  clearConversation
} from '../controllers/messagecontroller';
import { authenticate } from '../middleware/authmiddleware';
import { Request } from 'express';
import { validateMessageParticipants } from '../middleware/messagemiddleware';
import mongoose from 'mongoose';
import { persistWebSocketMessages } from '../middleware/messagemiddleware';
interface JWTUserData {
  _id: mongoose.Types.ObjectId;
  [key: string]: any;
}
interface ExpressRequest extends Request{
user:JWTUserData
}

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// WebSocket route
router.ws(
  '/ws',
  authenticate,
  (ws:any, req:ExpressRequest, next:NextFunction) => {
    persistWebSocketMessages(ws, req.user, next);
  }
);

// REST API routes
router.get(
  '/:userId',
  validateMessageParticipants,
  getMessages
);

router.delete(
  '/:messageId',
  deleteMessage
);

router.delete(
  '/clear-conversation/:userId',
  validateMessageParticipants,
  clearConversation
);

export default router;