"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contactcontroller_js_1 = require("../controllers/contactcontroller.js");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
// Rate limiting configuration
const contactLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many contact attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply rate limiting to contact route
router.post('/', contactLimiter, contactcontroller_js_1.contactController);
exports.default = router;
