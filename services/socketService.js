let io = null;

const initializeSocket = (server) => {
  const socketIo = require('socket.io');
  
  io = socketIo(server, {
    cors: {
      origin: function (origin, callback) {
        const allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:3000',
          'https://bristol-admin-frontend.vercel.app',
          'https://bristol-developer-portal.vercel.app',
        ];
        
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
    path: '/socket.io',
  });

  const ticketsNamespace = io.of('/tickets');

  ticketsNamespace.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  ticketsNamespace.on('connection', (socket) => {
    console.log(`User connected to tickets namespace: ${socket.user?.name || socket.id}`);

    socket.on('join-ticket', (ticketId) => {
      socket.join(`ticket:${ticketId}`);
      console.log(`User ${socket.user?.name} joined room: ticket:${ticketId}`);
    });

    socket.on('leave-ticket', (ticketId) => {
      socket.leave(`ticket:${ticketId}`);
      console.log(`User ${socket.user?.name} left room: ticket:${ticketId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user?.name || socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const emitNewReply = (ticketId, data) => {
  try {
    const io = getIO();
    io.of('/tickets').to(`ticket:${ticketId}`).emit('ticket:new-reply', data);
  } catch (err) {
    console.error('Error emitting new reply:', err.message);
  }
};

const emitStatusChange = (ticketId, newStatus) => {
  try {
    const io = getIO();
    io.of('/tickets').to(`ticket:${ticketId}`).emit('ticket:status-change', { ticketId, newStatus });
  } catch (err) {
    console.error('Error emitting status change:', err.message);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitNewReply,
  emitStatusChange,
};
