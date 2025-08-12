import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { User } from './models/usermodel.js';
import { Message } from './models/message.js';

interface CustomWebSocket extends WebSocket {
  userId?: string;
  username?: string;
  isAlive?: boolean;
  pingInterval?: NodeJS.Timeout;
  timeout?: NodeJS.Timeout;
}

export const createWebSocketServer = (server: Server) => {

// In your backend WebSocket server creation:
const wss = new WebSocketServer({
  server,
  path: '/ws', // Explicit path
  verifyClient: (info, done) => {
    try {
      const token = new URL(info.req.url || '', `wss://${info.req.headers.host}`)
        .searchParams.get('token');
      
      if (!token) {
        return done(false, 401, 'Token required');
      }

      jwt.verify(token, process.env.JWTPRIVATEKEY!, (err, decoded) => {
        if (err) {
          console.error('JWT verify error:', err);
          return done(false, 403, 'Invalid token');
        }
        done(true);
      });
    } catch (error) {
      console.error('Verify client error:', error);
      done(false, 400, 'Bad request');
    }
  }
});
  // Configure heartbeat
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((client: WebSocket) => {
      const ws = client as CustomWebSocket;
      if (!ws.isAlive) {
        console.log(`Terminating inactive connection for user ${ws.userId}`);
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL);

  wss.on('connection', (connection: WebSocket, req: IncomingMessage) => {
    const ws = connection as CustomWebSocket;
    ws.isAlive = true;

    // Initialize all CustomWebSocket properties
    ws.userId = undefined;
    ws.username = undefined;
    ws.pingInterval = undefined;
    ws.timeout = undefined;

    // Token verification and user assignment
    try {
      const getToken = (req: IncomingMessage): string | null => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const tokenParam = url.searchParams.get('token');
        if (tokenParam) return tokenParam;

        const cookies = req.headers.cookie?.split(';').map(c => c.trim());
        return cookies?.find(c => c.startsWith('authToken='))?.split('=')[1] || null;
      };

      const token = getToken(req);
      if (!token) throw new Error('No token provided');

      const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY!) as JwtPayload & { 
        _id: string;
        firstName: string;
        lastName: string;
      };
      
      ws.userId = decoded._id;
      ws.username = `${decoded.firstName} ${decoded.lastName}`;
    } catch (error) {
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
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
        // Set timeout to detect unresponsive connections
        ws.timeout = setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.terminate();
          }
        }, 5000);
      }
    }, HEARTBEAT_INTERVAL);

    // Message handler
    ws.on('message', async (data: Buffer) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'ping') return ws.send(JSON.stringify({ type: 'pong' }));

    if (message.recipient && message.text) {
      // Save to database
      const msgDoc = await Message.create({
        sender: ws.userId,
        recipient: message.recipient,
        text: message.text
      });

      // Only send to recipient (not back to sender)
      wss.clients.forEach((client: WebSocket) => {
        const c = client as CustomWebSocket;
        if (c.userId === message.recipient && c.readyState === WebSocket.OPEN) {
          c.send(JSON.stringify({
            _id: msgDoc._id,
            sender: ws.userId,
            text: message.text,
            recipient: message.recipient,
            createdAt: msgDoc.createdAt
          }));
        }
      });

      // Send confirmation back to sender with the saved message
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          _id: msgDoc._id,
          sender: ws.userId,
          text: message.text,
          recipient: message.recipient,
          createdAt: msgDoc.createdAt,
          status: 'sent'
        }));
      }
    }
  } catch (error) {
    console.error('Message handling error:', error);
  }
});
    // Online users notification
    const notifyOnlineUsers = async () => {
      const clients = Array.from(wss.clients) as CustomWebSocket[];
      const onlineUsers = await Promise.all(
        clients
          .filter(client => client.readyState === WebSocket.OPEN && client.userId)
          .map(async client => {
            const user = await User.findById(client.userId);
            return {
              userId: client.userId,
              username: client.username,
              avatarLink: user?.avatarLink
            };
          })
      );

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            online: onlineUsers.filter(user => user !== null)
          }));
        }
      });
    };

    // Initial notification
    notifyOnlineUsers();

    // Cleanup on close
    ws.on('close', () => {
      if (ws.pingInterval) clearInterval(ws.pingInterval);
      if (ws.timeout) clearTimeout(ws.timeout);
      notifyOnlineUsers();
    });

    // Error handling
    ws.on('error', (error: Error) => {
      console.error(`WebSocket error for user ${ws.userId}:`, error);
      if (ws.pingInterval) clearInterval(ws.pingInterval);
      if (ws.timeout) clearTimeout(ws.timeout);
    });
  });

  // Cleanup on server close
  server.on('close', () => {
    clearInterval(heartbeatInterval);
    wss.clients.forEach((client: WebSocket) => {
      const ws = client as CustomWebSocket;
      if (ws.pingInterval) clearInterval(ws.pingInterval);
      if (ws.timeout) clearTimeout(ws.timeout);
      ws.close();
    });
    wss.close();
  });

  return wss;
};