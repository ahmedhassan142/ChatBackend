"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const registercontroller_js_1 = __importDefault(require("../controllers/registercontroller.js"));
const messagecontroller_js_1 = require("../controllers/messagecontroller.js");
const peoplecontroller_js_1 = require("../controllers/peoplecontroller.js");
const logincontroller_js_1 = __importDefault(require("../controllers/logincontroller.js"));
const verfiyemail_js_1 = require("../controllers/verfiyemail.js");
const profilecontroller_js_1 = require("../controllers/profilecontroller.js");
const profilecontroller_js_2 = require("../controllers/profilecontroller.js");
const messagecontroller_js_2 = require("../controllers/messagecontroller.js");
const router = express_1.default.Router();
router.post("/register", registercontroller_js_1.default);
router.post("/login", logincontroller_js_1.default);
// router.get("/:id/verify/:token", verifyEmail);
router.get("/profile", profilecontroller_js_1.profileController);
router.get("/messages/:userId", messagecontroller_js_1.getMessages);
router.get("/people", peoplecontroller_js_1.peoplecontroller);
router.get("/verify", verfiyemail_js_1.verifyEmail);
router.put("/profile/update", profilecontroller_js_2.profileUpdate);
router.delete('/messages/clear-conversation', messagecontroller_js_2.clearConversation);
// In your auth routes
router.post('/logout', (req, res) => {
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
exports.default = router;
