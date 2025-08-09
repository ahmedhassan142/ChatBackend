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
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearConversation = exports.deleteMessage = exports.getMessages = void 0;
const protect_js_1 = require("../middleware/protect.js");
const message_js_1 = require("../models/message.js");
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const userData = yield (0, protect_js_1.protect)(req);
        const ourUserId = userData._id;
        const messages = yield message_js_1.Message.find({
            sender: { $in: [userId, ourUserId] },
            recipient: { $in: [userId, ourUserId] },
            deleted: { $ne: true } // Exclude soft-deleted messages
        }).sort({ createdAt: 1 });
        res.json(messages);
    }
    catch (error) {
        console.error("Error in messageController:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.getMessages = getMessages;
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { messageId } = req.params;
        const userData = yield (0, protect_js_1.protect)(req);
        // Find and validate the message
        const message = yield message_js_1.Message.findOne({
            _id: messageId,
            sender: userData._id // Only sender can delete
        });
        if (!message) {
            return res.status(404).json({ message: "Message not found or unauthorized" });
        }
        // Soft delete (recommended)
        message.deleted = true;
        message.deletedAt = new Date();
        yield message.save();
        res.json({
            success: true,
            message: "Message deleted successfully",
            deletedMessageId: messageId
        });
    }
    catch (error) {
        console.error("Error in deleteMessage:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.deleteMessage = deleteMessage;
// Add this to your backend controller
// controllers/messages.controller.ts
const clearConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Clear conversation endpoint hit'); // Debug log
        const { recipientId } = req.query;
        const userData = yield (0, protect_js_1.protect)(req);
        console.log(`Recipient ID: ${recipientId}`); // Debug log
        if (!recipientId || typeof recipientId !== 'string') {
            console.log('Invalid recipient ID'); // Debug log
            return res.status(400).json({
                success: false,
                message: "Valid recipient ID is required"
            });
        }
        const result = yield message_js_1.Message.updateMany({
            $or: [
                { sender: userData._id, recipient: recipientId },
                { sender: recipientId, recipient: userData._id }
            ]
        }, {
            $set: {
                deleted: true,
                deletedAt: new Date()
            }
        });
        console.log(`Modified ${result.modifiedCount} messages`); // Debug log
        res.json({
            success: true,
            message: "Conversation cleared successfully",
            deletedCount: result.modifiedCount
        });
    }
    catch (error) {
        console.error("Error in clearConversation:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
});
exports.clearConversation = clearConversation;
