"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profilecontroller_js_1 = require("../controllers/profilecontroller.js");
const avatarcontroller_js_1 = require("../controllers/avatarcontroller.js");
const router = express_1.default.Router();
// router.post("/", avatarcontroller);
router.get("/all", avatarcontroller_js_1.getAllAvatars);
router.post("/download", profilecontroller_js_1.downloadAvatars);
router.post("/upload", profilecontroller_js_1.uploadAvatar);
exports.default = router;
