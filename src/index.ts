import dotenv from "dotenv";
import express from "express";
import { Request, Response, NextFunction } from "express";
import cors from "cors";
import connectDB from "./db/connect.js";
import userroute from "./routes/userroute.js";
import avatarroute from "./routes/avatarroute.js";
import cookieParser from "cookie-parser";
import { createWebSocketServer } from "./wsserver.js";
import verifyroute from "./routes/verifyroute.js";

dotenv.config();

// Database connection
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://chatfrontend-yqkc-git-main-ahmed-hassans-projects-96c42d63.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// Routes
app.use("/api/user", userroute);
app.use("/api/avatar", avatarroute);
app.use("/api/contact", avatarroute);
app.use("/api/user", verifyroute);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`Application running on port ${port}`);
});

// Initialize WebSocket server
createWebSocketServer(server);