
import { Request, Response } from "express";
import { Message } from "../models/message.js";
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { protect } from "../middleware/protect.js";

interface JWTUserData {
  _id: string;
  [key: string]: any;
}

export const getMessages = async (req: Request, res: Response) => {
  try {
    console.log('\n=== STARTING MESSAGE FETCH ===');
    
    // 1. Extract and log the target user ID
    const { userId } = req.params;
    console.log('[1] Requested userId from params:', userId);
    if (!userId) {
      console.error('No userId provided in request parameters');
      return res.status(400).json({ error: "User ID is required" });
    }

    // 2. Extract and verify authentication token
    const token = req.cookies?.authToken || req.headers.authorization?.split(" ")[1];
    console.log('[2] Token extracted from request:', token ? '*****' : 'NOT FOUND');
    
    if (!token) {
      console.error('No authentication token provided');
      return res.status(401).json({ error: "Authentication required" });
    }

    // 3. Verify and decode the JWT token
    let userData: JWTUserData;
    try {
      userData = jwt.verify(token, process.env.JWTPRIVATEKEY as string) as JWTUserData;
      console.log('[3] Decoded token data:', {
        userId: userData._id,
        tokenIssuedAt: new Date(userData.iat * 1000),
        tokenExpiresAt: userData.exp ? new Date(userData.exp * 1000) : 'No expiration'
      });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const ourUserId = userData._id;
    console.log('[4] Our userId from token:', ourUserId);
    console.log('[5] Target userId from params:', userId);

    // 4. Prepare the query with additional logging
    const query = {
      $or: [
        { sender: ourUserId, recipient: userId },
        { sender: userId, recipient: ourUserId }
      ],
      deleted: { $ne: true }
    };
    console.log('[6] Final MongoDB query:', JSON.stringify(query, null, 2));

    // 5. Execute the query with timing
    console.time('[7] Message query execution time');
    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .lean(); // Convert to plain JS objects
    console.timeEnd('[7] Message query execution time');
    
    console.log('[8] Number of messages found:', messages.length);
    if (messages.length > 0) {
      console.log('[9] First message sample:', {
        id: messages[0]._id,
        sender: messages[0].sender,
        recipient: messages[0].recipient,
        createdAt: messages[0].createdAt
      });
    }

    // 6. Verify ObjectId formatting if still empty
    if (messages.length === 0) {
      console.log('[10] Checking for ID format issues...');
      try {
        const objectIdQuery = {
          $or: [
            { 
              sender: new mongoose.Types.ObjectId(ourUserId), 
              recipient: new mongoose.Types.ObjectId(userId) 
            },
            { 
              sender: new mongoose.Types.ObjectId(userId), 
              recipient: new mongoose.Types.ObjectId(ourUserId) 
            }
          ],
          deleted: { $ne: true }
        };
        
        console.log('[11] ObjectId formatted query:', JSON.stringify(objectIdQuery, null, 2));
        
        const objectIdMessages = await Message.find(objectIdQuery)
          .sort({ createdAt: 1 })
          .limit(1)
          .lean();
          
        console.log('[12] Messages found with ObjectId format:', objectIdMessages.length);
      } catch (idError) {
        console.error('[13] ObjectId conversion error:', idError);
      }
    }

    console.log('=== END OF MESSAGE FETCH ===\n');
    res.status(200).json(messages);
  } catch (error) {
    console.error("\n!!! ERROR IN MESSAGE CONTROLLER !!!", error);
    res.status(500).json({ 
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};



export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userData = await protect(req);
    
    // Find and validate the message
    const message = await Message.findOne({
      _id: messageId,
      sender: userData._id // Only sender can delete
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found or unauthorized" });
    }

    // Soft delete (recommended)
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ 
      success: true, 
      message: "Message deleted successfully",
      deletedMessageId: messageId
    });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// Add this to your backend controller
// controllers/messages.controller.ts
export const clearConversation = async (req: Request, res: Response) => {
  try {
    console.log('Clear conversation endpoint hit'); // Debug log
    const { recipientId } = req.query;
    const userData = await protect(req);
    
    console.log(`Recipient ID: ${recipientId}`); // Debug log
    
    if (!recipientId || typeof recipientId !== 'string') {
      console.log('Invalid recipient ID'); // Debug log
      return res.status(400).json({ 
        success: false,
        message: "Valid recipient ID is required" 
      });
    }

    const result = await Message.updateMany(
      {
        $or: [
          { sender: userData._id, recipient: recipientId },
          { sender: recipientId, recipient: userData._id }
        ]
      },
      {
        $set: {
          deleted: true,
          deletedAt: new Date()
        }
      }
    );

    console.log(`Modified ${result.modifiedCount} messages`); // Debug log
    
    res.json({ 
      success: true,
      message: "Conversation cleared successfully",
      deletedCount: result.modifiedCount
    });
  } catch (error:any) {
    console.error("Error in clearConversation:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};