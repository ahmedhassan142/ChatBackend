import express from "express";
import { Request, Response } from 'express';
import mongoose from 'mongoose';

// Controllers
import registerController from '../controllers/registercontroller.js';
import { peoplecontroller } from '../controllers/peoplecontroller.js';
import loginController from '../controllers/logincontroller.js';
import { profileController, profileUpdate } from '../controllers/profilecontroller.js';
import { getMessages, deleteMessage, clearConversation } from '../controllers/messagecontroller.js';

// Middleware
import { authenticate } from '../middleware/authmiddleware.js';
import { validateMessageParticipants } from '../middleware/messagemiddleware.js';

const router = express.Router();

// Authentication Routes
router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", (req: Request, res: Response) => {
  try {
    res.clearCookie('authToken', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/'
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// Profile Routes
router.get("/profile",  profileController);
router.put("/profile/update", profileUpdate);

// People Routes
router.get("/people", peoplecontroller);

// Message Routes
router.get(
  '/messages/:userId',
  authenticate,
  validateMessageParticipants,
  getMessages
);

router.delete(
  '/messages/:messageId',
  authenticate,
  deleteMessage
);

router.delete(
  '/messages/clear-conversation/:userId',
  authenticate,
  validateMessageParticipants,
  clearConversation
);

export default router;