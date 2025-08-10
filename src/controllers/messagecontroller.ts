import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/message';

// Remove the custom ExpressRequest interface since we're using global type extension
// The Request type is already properly extended in authmiddleware.ts

export const getMessages = async (req: Request, res: Response) => {
  try {
    // Add null check for req.user
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
    }

    const { userId } = req.params;
    const ourUserId = req.user._id;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid user ID format'
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: ourUserId, recipient: new mongoose.Types.ObjectId(userId) },
        { sender: new mongoose.Types.ObjectId(userId), recipient: ourUserId }
      ],
      deleted: { $ne: true }
    })
    .sort({ createdAt: 1 })
    .lean();

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data:  messages 
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages'
    });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
    }

    const { messageId } = req.params;

    // Validate messageId format
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid message ID format'
      });
    }

    const message = await Message.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(messageId),
        $or: [
          { sender: req.user._id },
          { recipient: req.user._id }
        ]
      },
      { deleted: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        status: 'fail',
        message: 'Message not found or unauthorized'
      });
    }

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete message'
    });
  }
};

export const clearConversation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
    }

    const { userId } = req.params;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid user ID format'
      });
    }

    await Message.updateMany(
      {
        $or: [
          { sender: req.user._id, recipient: new mongoose.Types.ObjectId(userId) },
          { sender: new mongoose.Types.ObjectId(userId), recipient: req.user._id }
        ]
      },
      { deleted: true }
    );

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear conversation'
    });
  }
};