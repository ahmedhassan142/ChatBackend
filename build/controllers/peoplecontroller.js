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
exports.peoplecontroller = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const usermodel_js_1 = require("../models/usermodel.js");
const peoplecontroller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.authToken) || ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1]);
        if (!token)
            return res.status(401).json({ error: "Authentication required" });
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWTPRIVATEKEY);
        const currentUserId = decoded._id;
        // Get all users except the current one
        const users = yield usermodel_js_1.User.find({ _id: { $ne: currentUserId } })
            .select('_id firstName lastName avatarLink email')
            .lean();
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching people:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.peoplecontroller = peoplecontroller;
exports.default = exports.peoplecontroller;
