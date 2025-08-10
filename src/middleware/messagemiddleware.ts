import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/message';

export const validateMessageParticipants = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid user ID format'
      });
    }

    // Convert to ObjectId
    req.params.userId = new mongoose.Types.ObjectId(userId).toString();
    next();
  } catch (error) {
    next(error);
  }
};

export const persistWebSocketMessages = async (
  ws: any, // WebSocket connection
  user: any, // Authenticated user
  next: NextFunction
) => {
  try {
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.text && data.recipient) {
          // Validate recipient
          if (!mongoose.Types.ObjectId.isValid(data.recipient)) {
            return ws.send(JSON.stringify({
              status: 'error',
              message: 'Invalid recipient ID'
            }));
          }

          // Create and save message
          const newMessage = await Message.create({
            sender: user._id,
            recipient: new mongoose.Types.ObjectId(data.recipient),
            text: data.text,
            createdAt: new Date()
          });

          // Broadcast to sender
          ws.send(JSON.stringify({
            type: 'message',
            status: 'success',
            message: newMessage
          }));

          // TODO: Implement broadcast to recipient
        }
      } catch (error) {
        ws.send(JSON.stringify({
          status: 'error',
          message: 'Failed to process message'
        }));
      }
    });
  } catch (error) {
    next(error);
  }
};