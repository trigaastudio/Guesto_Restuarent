import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinOrder', (orderId) => {
      socket.join(orderId);
      console.log(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
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
