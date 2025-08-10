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
exports.persistWebSocketMessages = exports.validateMessageParticipants = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const message_1 = require("../models/message");
const validateMessageParticipants = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid user ID format'
            });
        }
        // Convert to ObjectId
        req.params.userId = new mongoose_1.default.Types.ObjectId(userId).toString();
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.validateMessageParticipants = validateMessageParticipants;
const persistWebSocketMessages = (ws, // WebSocket connection
user, // Authenticated user
next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ws.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const data = JSON.parse(message);
                if (data.text && data.recipient) {
                    // Validate recipient
                    if (!mongoose_1.default.Types.ObjectId.isValid(data.recipient)) {
                        return ws.send(JSON.stringify({
                            status: 'error',
                            message: 'Invalid recipient ID'
                        }));
                    }
                    // Create and save message
                    const newMessage = yield message_1.Message.create({
                        sender: user._id,
                        recipient: new mongoose_1.default.Types.ObjectId(data.recipient),
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
            }
            catch (error) {
                ws.send(JSON.stringify({
                    status: 'error',
                    message: 'Failed to process message'
                }));
            }
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.persistWebSocketMessages = persistWebSocketMessages;
