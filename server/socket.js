import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/userSchema.js';
import Staff from './models/staffSchema.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true
    }
  });

  
  
  io.use(async (socket, next) => {
    try {
      
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split(';')
          .map(c => c.trim())
          .find(c => c.startsWith('token=') || c.startsWith('admin_token=') || c.startsWith('staff_token='))
          ?.split('=')[1];

      if (!token) {
        
        
        socket.isAuthenticated = false;
        socket.userId = null;
        socket.userRole = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      let user = await User.findById(decoded.id).select('_id role isActive');
      if (!user) {
        user = await Staff.findById(decoded.id).select('_id role isActive');
      }

      if (!user || !user.isActive) {
        socket.isAuthenticated = false;
        socket.userId = null;
        socket.userRole = null;
        return next();
      }

      socket.isAuthenticated = true;
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch {
      
      socket.isAuthenticated = false;
      socket.userId = null;
      socket.userRole = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.isAuthenticated && ['admin', 'staff', 'waiter', 'kitchen', 'cashier', 'delivery'].includes(socket.userRole)) {
      socket.join('staff_room');
    }
    
    
    socket.on('joinOrder', (orderId) => {
      if (!socket.isAuthenticated) return;
      
      const isStaff = ['admin', 'staff', 'waiter', 'kitchen', 'cashier', 'delivery'].includes(socket.userRole);
      if (isStaff) {
        socket.join(orderId);
      } else {
        
        socket.join(orderId);
      }
    });

    socket.on('leaveOrder', (orderId) => {
      socket.leave(orderId);
    });

    
    socket.on('joinUser', (userId) => {
      if (!socket.isAuthenticated) return;
      const isStaff = ['admin', 'staff', 'waiter', 'kitchen', 'cashier', 'delivery'].includes(socket.userRole);
      
      if (isStaff || socket.userId === userId.toString()) {
        socket.join(userId);
      }
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
    io.to('staff_room').emit('tablesUpdated');
  }
};
