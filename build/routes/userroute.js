"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Controllers
const registercontroller_js_1 = __importDefault(require("../controllers/registercontroller.js"));
const peoplecontroller_js_1 = require("../controllers/peoplecontroller.js");
const logincontroller_js_1 = __importDefault(require("../controllers/logincontroller.js"));
const profilecontroller_js_1 = require("../controllers/profilecontroller.js");
const messagecontroller_js_1 = require("../controllers/messagecontroller.js");
// Middleware
const authmiddleware_js_1 = require("../middleware/authmiddleware.js");
const messagemiddleware_js_1 = require("../middleware/messagemiddleware.js");
const router = express_1.default.Router();
// Authentication Routes
router.post("/register", registercontroller_js_1.default);
router.post("/login", logincontroller_js_1.default);
router.post("/logout", (req, res) => {
    try {
        res.clearCookie('authToken', {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            path: '/'
        });
        res.status(200).json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Logout failed' });
    }
});
// Profile Routes
router.get("/profile", profilecontroller_js_1.profileController);
router.put("/profile/update", profilecontroller_js_1.profileUpdate);
// People Routes
router.get("/people", peoplecontroller_js_1.peoplecontroller);
// Message Routes
router.get('/messages/:userId', authmiddleware_js_1.authenticate, messagemiddleware_js_1.validateMessageParticipants, messagecontroller_js_1.getMessages);
router.delete('/messages/:messageId', authmiddleware_js_1.authenticate, messagecontroller_js_1.deleteMessage);
router.delete('/messages/clear-conversation/:userId', authmiddleware_js_1.authenticate, messagemiddleware_js_1.validateMessageParticipants, messagecontroller_js_1.clearConversation);
exports.default = router;
