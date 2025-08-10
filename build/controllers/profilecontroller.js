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
exports.downloadAvatars = exports.getAllAvatars = exports.profileUpdate = exports.profileController = exports.uploadAvatar = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const usermodel_js_1 = require("../models/usermodel.js");
const uuid_1 = require("uuid");
const uploadconfig_js_1 = require("../utils/uploadconfig.js");
// Configure multer for avatar uploads
exports.uploadAvatar = [
    uploadconfig_js_1.upload.single('avatar'),
    uploadconfig_js_1.handleUploadErrors,
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.authToken;
            if (!token) {
                // Clean up the uploaded file if auth fails
                if (req.file) {
                    const fs = require('fs');
                    fs.unlinkSync(req.file.path);
                }
                return res.status(401).json({ error: "Authentication required" });
            }
            const userData = jsonwebtoken_1.default.verify(token, process.env.JWTPRIVATEKEY);
            const newAvatar = {
                _id: (0, uuid_1.v4)(),
                link: `/uploads/avatars/${req.file.filename}`,
            };
            yield usermodel_js_1.User.updateOne({ _id: userData._id }, { $set: { avatarLink: newAvatar.link } });
            res.json({
                success: true,
                avatar: newAvatar,
                message: 'Avatar uploaded successfully'
            });
        }
        catch (err) {
            // Clean up the uploaded file if error occurs
            if (req.file) {
                const fs = require('fs');
                fs.unlinkSync(req.file.path);
            }
            console.error('Avatar upload error:', err);
            if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                return res.status(403).json({ error: "Invalid token" });
            }
            res.status(500).json({ error: "Server error" });
        }
    })
];
// Default avatars (could be moved to a model or config)
const defaultAvatars = [
    { _id: '1', link: '/avatar1.jpg' },
    { _id: '2', link: '/avatar2.jpg' },
    { _id: '3', link: '/avatar3.jpg' },
    { _id: '4', link: '/avatar4.jpg' },
    { _id: '5', link: '/avatar5.jpg' },
    { _id: '6', link: '/avatar6.jpg' }
];
// Profile Controller
const profileController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.authToken) || ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1]);
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const userData = jsonwebtoken_1.default.verify(token, process.env.JWTPRIVATEKEY);
        const user = yield usermodel_js_1.User.findOne({ _id: userData._id }).select('-password');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatarLink: user.avatarLink
        });
    }
    catch (err) {
        console.error('Profile error:', err);
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(403).json({ error: "Invalid token" });
        }
        res.status(500).json({ error: "Server error" });
    }
});
exports.profileController = profileController;
// Profile Update Controller
const profileUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.authToken;
    if (!token) {
        return res.status(401).json("no token");
    }
    try {
        jsonwebtoken_1.default.verify(token, process.env.JWTPRIVATEKEY);
        const { firstName, lastName, email, avatarLink } = req.body;
        const user = yield usermodel_js_1.User.findOne({ email });
        if (!user) {
            return res.status(404).json("User not found");
        }
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        if (avatarLink)
            user.avatarLink = avatarLink;
        yield user.save();
        res.json(user);
    }
    catch (err) {
        res.status(401).json("invalid token");
    }
});
exports.profileUpdate = profileUpdate;
// Avatar Controllers
const getAllAvatars = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // In a real app, you might want to combine default avatars with user-uploaded ones
        res.json({ avatars: defaultAvatars });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
exports.getAllAvatars = getAllAvatars;
const downloadAvatars = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.authToken;
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const { urls } = req.body;
        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: 'Invalid URLs provided' });
        }
        const newAvatars = urls.map((url, i) => ({
            _id: `downloaded-${i}`,
            link: url
        }));
        // In a real app, you would save these to your database
        res.json({
            message: 'Default avatars downloaded',
            avatars: newAvatars
        });
    }
    catch (err) {
        console.error('Download avatars error:', err);
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(403).json({ error: "Invalid token" });
        }
        res.status(500).json({ error: "Server error" });
    }
});
exports.downloadAvatars = downloadAvatars;
