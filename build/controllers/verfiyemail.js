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
exports.verifyEmail = void 0;
const usermodel_js_1 = require("../models/usermodel.js");
const token_js_1 = require("../models/token.js");
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, token } = req.query;
        if (!userId || !token) {
            return res.status(400).json({
                success: false,
                message: "Missing verification parameters"
            });
        }
        const verificationToken = yield token_js_1.Token.findOneAndDelete({
            userId,
            token,
            expiresAt: { $gt: new Date() }
        });
        if (!verificationToken) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification link"
            });
        }
        const user = yield usermodel_js_1.User.findByIdAndUpdate(userId, { verified: true, verificationLinkSent: false }, { new: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });
    }
    catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during verification"
        });
    }
});
exports.verifyEmail = verifyEmail;
