"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearConversation = exports.deleteMessage = exports.getMessages = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const message_1 = require("../models/message");
// Remove the custom ExpressRequest interface since we're using global type extension
// The Request type is already properly extended in authmiddleware.ts
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Authentication required'
            });
        }
        const { userId } = req.params;
        const ourUserId = req.user._id;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid user ID format'
            });
        }
        const messages = yield message_1.Message.find({
            $or: [
                { sender: ourUserId, recipient: new mongoose_1.default.Types.ObjectId(userId) },
                { sender: new mongoose_1.default.Types.ObjectId(userId), recipient: ourUserId }
            ],
            deleted: { $ne: true }
        })
            .sort({ createdAt: 1 })
            .lean();
        // Return consistent structure - array directly in data property
        res.status(200).json({
            status: 'success',
            data: messages // Changed from 'messages' to 'data'
        });
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch messages',
            data: [] // Always return array even on error
        });
    }
});
exports.getMessages = getMessages;
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Authentication required'
            });
        }
        const { messageId } = req.params;
        // Validate messageId format
        if (!mongoose_1.default.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid message ID format'
            });
        }
        const message = yield message_1.Message.findOneAndUpdate({
            _id: new mongoose_1.default.Types.ObjectId(messageId),
            $or: [
                { sender: req.user._id },
                { recipient: req.user._id }
            ]
        }, { deleted: true }, { new: true });
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
    }
    catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete message'
        });
    }
});
exports.deleteMessage = deleteMessage;
const clearConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Authentication required'
            });
        }
        const { userId } = req.params;
        // Validate userId format
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid user ID format'
            });
        }
        yield message_1.Message.updateMany({
            $or: [
                { sender: req.user._id, recipient: new mongoose_1.default.Types.ObjectId(userId) },
                { sender: new mongoose_1.default.Types.ObjectId(userId), recipient: req.user._id }
            ]
        }, { deleted: true });
        res.status(200).json({
            status: 'success',
            data: null
        });
    }
    catch (error) {
        console.error('Error clearing conversation:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to clear conversation'
        });
    }
});
exports.clearConversation = clearConversation;
