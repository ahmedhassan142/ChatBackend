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
exports.createWebSocketServer = void 0;
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const usermodel_js_1 = require("./models/usermodel.js");
const message_js_1 = require("./models/message.js");
const createWebSocketServer = (server) => {
    const wss = new ws_1.WebSocketServer({
        server,
        path: '/ws', // ✅ Changed from '/wss' to '/ws'
        verifyClient: (info, done) => {
            try {
                if (!info.req.url || !info.req.headers.host) {
                    return done(false, 400, 'Bad request');
                }
                // Secure token extraction
                const getToken = (req) => {
                    try {
                        const host = req.headers['x-forwarded-host'] || req.headers.host || 'chatapp-backend-jyt9.onrender.com';
                        const url = new URL(req.url || '', `https://${host}`); // ✅ Force HTTPS
                        const tokenParam = url.searchParams.get('token');
                        if (tokenParam)
                            return tokenParam;
                        const cookieHeader = req.headers.cookie;
                        if (!cookieHeader)
                            return null;
                        const cookies = cookieHeader.split(';').map(c => c.trim());
                        const authCookie = cookies.find(c => c.startsWith('authToken='));
                        return (authCookie === null || authCookie === void 0 ? void 0 : authCookie.split('=')[1]) || null;
                    }
                    catch (error) {
                        console.error('Token extraction error:', error);
                        return null;
                    }
                };
                const token = getToken(info.req);
                if (!token) {
                    return done(false, 401, 'Authentication token required');
                }
                jsonwebtoken_1.default.verify(token, process.env.JWTPRIVATEKEY, (err, decoded) => {
                    if (err) {
                        console.error('Token verification failed:', err);
                        return done(false, 403, 'Invalid token');
                    }
                    done(true);
                });
            }
            catch (error) {
                console.error('Client verification error:', error);
                done(false, 400, 'Bad request');
            }
        }
    });
    // Configure heartbeat
    const HEARTBEAT_INTERVAL = 30000; // 30 seconds
    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach((client) => {
            const ws = client;
            if (!ws.isAlive) {
                console.log(`Terminating inactive connection for user ${ws.userId}`);
                ws.terminate();
                return;
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, HEARTBEAT_INTERVAL);
    wss.on('connection', (connection, req) => {
        const ws = connection;
        ws.isAlive = true;
        // Initialize all CustomWebSocket properties
        ws.userId = undefined;
        ws.username = undefined;
        ws.pingInterval = undefined;
        ws.timeout = undefined;
        // Token verification and user assignment
        try {
            const getToken = (req) => {
                var _a, _b;
                const url = new URL(req.url || '', `http://${req.headers.host}`);
                const tokenParam = url.searchParams.get('token');
                if (tokenParam)
                    return tokenParam;
                const cookies = (_a = req.headers.cookie) === null || _a === void 0 ? void 0 : _a.split(';').map(c => c.trim());
                return ((_b = cookies === null || cookies === void 0 ? void 0 : cookies.find(c => c.startsWith('authToken='))) === null || _b === void 0 ? void 0 : _b.split('=')[1]) || null;
            };
            const token = getToken(req);
            if (!token)
                throw new Error('No token provided');
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWTPRIVATEKEY);
            ws.userId = decoded._id;
            ws.username = `${decoded.firstName} ${decoded.lastName}`;
        }
        catch (error) {
            console.error('Connection authentication failed:', error);
            ws.close(4001, 'Authentication failed');
            return;
        }
        // Setup heartbeat
        ws.on('pong', () => {
            ws.isAlive = true;
            if (ws.timeout) {
                clearTimeout(ws.timeout);
            }
        });
        // Setup ping interval for this connection
        ws.pingInterval = setInterval(() => {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.ping();
                // Set timeout to detect unresponsive connections
                ws.timeout = setTimeout(() => {
                    if (ws.readyState === ws_1.WebSocket.OPEN) {
                        ws.terminate();
                    }
                }, 5000);
            }
        }, HEARTBEAT_INTERVAL);
        // Message handler
        ws.on('message', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === 'ping') {
                    return ws.send(JSON.stringify({ type: 'pong' }));
                }
                if (message.recipient && message.text) {
                    const msgDoc = yield message_js_1.Message.create({
                        sender: ws.userId,
                        recipient: message.recipient,
                        text: message.text
                    });
                    // Broadcast to recipient
                    wss.clients.forEach((client) => {
                        const c = client;
                        if (c.userId === message.recipient && c.readyState === ws_1.WebSocket.OPEN) {
                            c.send(JSON.stringify({
                                _id: msgDoc._id,
                                sender: ws.userId,
                                text: message.text,
                                recipient: message.recipient,
                                createdAt: msgDoc.createdAt
                            }));
                        }
                    });
                }
            }
            catch (error) {
                console.error('Message handling error:', error);
            }
        }));
        // Online users notification
        const notifyOnlineUsers = () => __awaiter(void 0, void 0, void 0, function* () {
            const clients = Array.from(wss.clients);
            const onlineUsers = yield Promise.all(clients
                .filter(client => client.readyState === ws_1.WebSocket.OPEN && client.userId)
                .map((client) => __awaiter(void 0, void 0, void 0, function* () {
                const user = yield usermodel_js_1.User.findById(client.userId);
                return {
                    userId: client.userId,
                    username: client.username,
                    avatarLink: user === null || user === void 0 ? void 0 : user.avatarLink
                };
            })));
            clients.forEach(client => {
                if (client.readyState === ws_1.WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        online: onlineUsers.filter(user => user !== null)
                    }));
                }
            });
        });
        // Initial notification
        notifyOnlineUsers();
        // Cleanup on close
        ws.on('close', () => {
            if (ws.pingInterval)
                clearInterval(ws.pingInterval);
            if (ws.timeout)
                clearTimeout(ws.timeout);
            notifyOnlineUsers();
        });
        // Error handling
        ws.on('error', (error) => {
            console.error(`WebSocket error for user ${ws.userId}:`, error);
            if (ws.pingInterval)
                clearInterval(ws.pingInterval);
            if (ws.timeout)
                clearTimeout(ws.timeout);
        });
    });
    // Cleanup on server close
    server.on('close', () => {
        clearInterval(heartbeatInterval);
        wss.clients.forEach((client) => {
            const ws = client;
            if (ws.pingInterval)
                clearInterval(ws.pingInterval);
            if (ws.timeout)
                clearTimeout(ws.timeout);
            ws.close();
        });
        wss.close();
    });
    return wss;
};
exports.createWebSocketServer = createWebSocketServer;
