"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const connect_js_1 = __importDefault(require("./db/connect.js"));
const userroute_js_1 = __importDefault(require("./routes/userroute.js"));
const avatarroute_js_1 = __importDefault(require("./routes/avatarroute.js"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const wsserver_js_1 = require("./wsserver.js");
const verifyroute_js_1 = __importDefault(require("./routes/verifyroute.js"));
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
dotenv_1.default.config();
// Database connection
(0, connect_js_1.default)();
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: [process.env.NEXT_PUBLIC_BASE_URL || 'https://chat-app-frontend-git-main-ahmed-hassans-projects-96c42d63.vercel.app', process.env.NEXT_PUBLIC_SMART_REPLY_API || "http://localhost:8000"],
    methods: ["GET", "POST", "PUT", "DELETE"], // Your Next.js URL
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'] // Required for cookies/sessions
}));
// Routes
app.use("/api/user", userroute_js_1.default);
app.use("/api/avatar", avatarroute_js_1.default);
app.use("/api/contact", avatarroute_js_1.default);
// Add this with other routes
app.use("/api/user", verifyroute_js_1.default); // ✅ Now routes to /api/user/verify
// Serve static files
// const staticPath = join(__dirname, "..", "frontend", "dist");
// app.use(express.static(staticPath));
// Verify frontend files exist
// const indexPath = path.join(staticPath, "index.html");
// if (!fs.existsSync(indexPath)) {
//   console.error("Frontend index.html not found at:", indexPath);
//   process.exit(1);
// }
// // Handle SPA
// app.get("/*", (req: Request, res: Response) => {
//   res.sendFile(indexPath, (err: Error | null) => {
//     if (err) {
//       console.error("Error sending file:", err);
//       if (!res.headersSent) {
//         res.status(500).send("Error loading application");
//       }
//     }
//   });
// });
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});
const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
    console.log(`Application running on port ${port}`);
});
(0, wsserver_js_1.createWebSocketServer)(server);
