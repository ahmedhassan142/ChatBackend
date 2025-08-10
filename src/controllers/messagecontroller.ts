import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/message';
interface JWTUserData {
  _id: mongoose.Types.ObjectId;
  [key: string]: any;
}

interface ExpressRequest extends Request{
user:JWTUserData
}

export const getMessages = async (req: ExpressRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const ourUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: ourUserId, recipient: userId },
        { sender: userId, recipient: ourUserId }
      ],
      deleted: { $ne: true }
    })
    .sort({ createdAt: 1 })
    .lean();

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: { messages }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages'
    });
  }
};

export const deleteMessage = async (req: ExpressRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
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
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete message'
    });
  }
};

export const clearConversation = async (req: ExpressRequest, res: Response) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      {
        $or: [
          { sender: req.user._id, recipient: userId },
          { sender: userId, recipient: req.user._id }
        ]
      },
      { deleted: true }
    );

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear conversation'
    });
  }
};