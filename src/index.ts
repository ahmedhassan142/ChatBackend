

import dotenv from "dotenv";

import express from "express"
import  { Request, Response, NextFunction } from "express";
import cors from "cors";
import connectDB from "./db/connect.js";
import userroute from "./routes/userroute.js";
import avatarroute from "./routes/avatarroute.js";
import cookieParser from "cookie-parser";
import { createWebSocketServer } from "./wsserver.js";

import verifyroute from "./routes/verifyroute.js";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);



dotenv.config();
// Database connection
connectDB();

const app = express();
const corsOptions = {
  origin: [
    "https://chatfrontend-yqkc.vercel.app", // Production URL
    "https://chatfrontend-git-main-ahmed-hassans-projects-96c42d63.vercel.app" // Preview URL
     // For local testing
  ],
  credentials: true, // Required for cookies
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
};

// Middleware
app.use(express.json());
app.use(cookieParser());

// Handle preflight requests
app.options("*", cors(corsOptions)); // Allow all OPTIONS requests

// Routes
app.use("/api/user", userroute);
app.use("/api/avatar", avatarroute);
app.use("/api/contact", avatarroute);

// Add this with other routes
app.use("/api/user", verifyroute);  // ✅ Now routes to /api/user/verify


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
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "https://chatfrontend-git-main-ahmed-hassans-projects-96c42d63.vercel.app");
//   res.header("Access-Control-Allow-Credentials", "true");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
//   next();
// });

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`Application running on port ${port}`);
});

createWebSocketServer(server);