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
    

    socket.on('joinOrder', (orderId) => {
      socket.join(orderId);
    });

    socket.on('leaveOrder', (orderId) => {
      socket.leave(orderId);
    });

    socket.on('joinUser', (userId) => {
      socket.join(userId);
    });

    socket.on('leaveUser', (userId) => {
      socket.leave(userId);
    });

    socket.on('disconnect', () => {
      
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

export const emitOrderStatusUpdate = (orderId, status, kitchenStatus) => {
  if (io) {
    io.to(orderId).emit('orderStatusUpdated', { orderId, status, kitchenStatus });
  }
};

export const emitAccountStatusUpdate = (userId, isActive) => {
  if (io) {
    io.to(userId).emit('accountStatusChanged', { userId, isActive });
  }
};

export const emitStockUpdate = (itemId, totalStock, isBlocked) => {
  if (io) {
    io.emit('stockUpdate', { itemId, totalStock, isBlocked });
  }
};

export const emitCategoryUpdate = () => {
  if (io) {
    io.emit('categoryUpdate');
  }
};

export const emitCategoryStockUpdate = (categoryId, totalStock) => {
  if (io) {
    io.emit('categoryStockUpdate', { categoryId, totalStock });
  }
};

export const emitOfferUpdate = () => {
  if (io) {
    io.emit('offerUpdate');
  }
};

export const emitSettingsUpdate = (settings) => {
  if (io) {
    io.emit('settingsUpdate', settings);
  }
};

export const emitTablesUpdated = () => {
  if (io) {
    io.emit('tablesUpdated');
  }
};
