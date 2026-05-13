import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "DELETE"]
    }
  });

  io.on('connection', (socket) => {
    // Client connected log removed for cleaner terminal output

    socket.on('joinOrder', (orderId) => {
      socket.join(orderId);
      // Joined order room log removed
    });

    socket.on('joinUser', (userId) => {
      socket.join(userId);
      // Joined user room log removed
    });

    socket.on('disconnect', () => {
      // Client disconnected log removed
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const emitOrderStatusUpdate = (orderId, status) => {
  if (io) {
    io.to(orderId).emit('orderStatusUpdated', { orderId, status });
  }
};

export const emitAccountStatusUpdate = (userId, isActive) => {
  if (io) {
    io.to(userId).emit('accountStatusChanged', { userId, isActive });
  }
};
