"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Create a new file: routes/verifyRoute.ts
const express_1 = __importDefault(require("express"));
const verfiyemail_js_1 = require("../controllers/verfiyemail.js");
const router = express_1.default.Router();
router.get("/verify", verfiyemail_js_1.verifyEmail); // Now accessible at /api/user/verify
exports.default = router;
