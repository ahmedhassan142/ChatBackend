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
const bcrypt_1 = __importDefault(require("bcrypt"));
const usermodel_js_1 = require("../models/usermodel.js");
// Update your login controller to:
// 1. Return token in both cookie and response body
// 2. Set proper CORS headers
const logincontroller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error } = (0, usermodel_js_1.validateLogin)(req.body);
        if (error)
            return res.status(400).send({ message: error.details[0].message });
        const user = yield usermodel_js_1.User.findOne({ email: req.body.email });
        if (!user)
            return res.status(401).send({ message: "Invalid Email" });
        const validPassword = yield bcrypt_1.default.compare(req.body.password, user.password);
        if (!validPassword)
            return res.status(401).send({ message: "Invalid Password" });
        if (!user.verified) {
            return res.status(400).send({ message: "Please verify your email first" });
        }
        const token = user.generateAuthToken();
        // Set cookie
        res.cookie("authToken", token, {
            httpOnly: true, // Recommended for security
            // secure: process.env.NODE_ENV === "production",
            sameSite: "lax", // or "strict" for better security
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        // Also send token in response for clients that prefer that
        res.status(200).json({
            message: "Login successful",
            token, // Optional: only if you want to use token in localStorage
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatarLink: user.avatarLink
            }
        });
    }
    catch (error) {
        console.error("Error in loginController:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});
exports.default = logincontroller;
