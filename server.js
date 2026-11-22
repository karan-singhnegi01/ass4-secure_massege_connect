require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const EventEmitter = require('events');
const { load } = require('./store');
const { authenticate, requireAdmin } = require('./middleware/auth');

if (!process.env.JWT_SECRET) { console.error('Set JWT_SECRET in .env'); process.exit(1); }
const app = express(); const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const events = new EventEmitter();
app.use(express.json());
app.get('/', (req, res) => res.json({ message: 'Secure Connect server is running' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.get('/api/profile', authenticate, (req, res) => res.json({ user: req.user }));
app.get('/api/admin', authenticate, requireAdmin, (req, res) => res.json({ message: 'Admin-only route' }));

// Demonstration of Node.js EventEmitter
 events.on('chatMessage', ({ username, message, room }) => console.log(`[${room}] ${username}: ${message}`));


io.use((socket, next) => {
  const authToken = socket.handshake.auth && socket.handshake.auth.token;
  const headerToken = socket.handshake.headers.authorization;

  const token = authToken || (headerToken && headerToken.startsWith('Bearer ')
    ? headerToken.split(' ')[1]
    : null);

  if (!token) return next(new Error('Authentication token required'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = load().users.find(u => u.id === decoded.id);
    if (!user) return next(new Error('User not found'));
    socket.user = { id: user.id, username: user.username };
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', socket => {
  console.log(`User connected: ${socket.user.username}`);
  socket.on('joinRoom', room => {
    if (typeof room !== 'string' || !room.trim() || room.length > 50) return;
    socket.join(room); socket.emit('joinedRoom', room);
  });
  socket.on('chatMessage', data => {
    if (!data || typeof data.message !== 'string' || typeof data.room !== 'string' || !data.message.trim() || data.message.length > 1000) return;
    const message = { username: socket.user.username, message: data.message.trim(), room: data.room };
    events.emit('chatMessage', message);
    io.to(data.room).emit('chatMessage', message);
  });
  socket.on('disconnect', () => console.log(`User disconnected: ${socket.user.username}`));
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
