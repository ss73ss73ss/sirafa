import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { DatabaseStorage } from './storage.js';

export interface SocketUser {
  userId: number;
  fullName: string;
  type: 'user' | 'agent' | 'admin';
  officeId?: number;
}

export interface AuthenticatedSocket extends Socket {
  user: SocketUser;
}

export class WebSocketService {
  private io: SocketIOServer;
  private storage: DatabaseStorage;

  constructor(httpServer: HttpServer, storage: DatabaseStorage) {
    this.storage = storage;
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        credentials: true
      },
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    this.setupAuthentication();
    this.setupConnectionHandlers();
  }

  private setupAuthentication() {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        
        if (!token) {
          return next(new Error('No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Get user details from database
        const user = await this.storage.getUser(decoded.userId);
        if (!user || !user.active) {
          return next(new Error('User not found or inactive'));
        }

        // Attach user info to socket
        socket.user = {
          userId: user.id,
          fullName: user.fullName,
          type: user.type as 'user' | 'agent' | 'admin',
          officeId: user.officeId
        };

        console.log(`🔌 User connected: ${user.fullName} (${user.id}) - ${user.type}`);
        next();
      } catch (error) {
        console.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupConnectionHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const authenticatedSocket = socket as AuthenticatedSocket;
      const user = authenticatedSocket.user;

      // Auto-join user-specific rooms
      socket.join(`user-${user.userId}`);
      socket.join(`type-${user.type}`);
      
      if (user.officeId) {
        socket.join(`office-${user.officeId}`);
      }

      // Handle manual subscriptions
      socket.on('subscribe', (room: string) => {
        if (this.canJoinRoom(user, room)) {
          socket.join(room);
          console.log(`📡 User ${user.userId} joined room: ${room}`);
        } else {
          console.warn(`🚫 User ${user.userId} denied access to room: ${room}`);
        }
      });

      socket.on('unsubscribe', (room: string) => {
        socket.leave(room);
        console.log(`📡 User ${user.userId} left room: ${room}`);
      });

      socket.on('disconnect', async (reason: string) => {
        console.log(`🔌 User disconnected: ${user.fullName} (${user.userId}) - Reason: ${reason}`);
        
        // تنظيف شامل: إزالة المستخدم من جميع غرف المجموعات
        try {
          // الحصول على جميع الغرف التي ينتمي إليها هذا Socket
          const rooms = Array.from(socket.rooms);
          
          for (const room of rooms) {
            // التحقق من كون الغرفة مجموعة (group-X format)
            if (room.startsWith('group-')) {
              const groupId = parseInt(room.split('-')[1]);
              
              // إرسال حدث مغادرة العضو للآخرين في الغرفة
              socket.to(room).emit('memberLeftGroup', {
                groupId: groupId,
                userId: user.userId,
                userName: user.fullName
              });
              
              console.log(`🧹 تنظيف: إزالة ${user.fullName} من ${room} عند قطع الاتصال`);
              
              // إرسال قائمة محدثة من الأعضاء المتصلين للغرفة بعد قليل
              setTimeout(async () => {
                try {
                  const roomSockets = await this.io.in(room).fetchSockets();
                  const uniqueUsers = new Map(); // لتجنب المستخدمين المكررين
                  
                  for (const sock of roomSockets) {
                    const sockUser = (sock as any).user;
                    if (sockUser && sockUser.userId && !uniqueUsers.has(sockUser.userId)) {
                      uniqueUsers.set(sockUser.userId, {
                        userId: sockUser.userId,
                        fullName: sockUser.fullName
                      });
                    }
                  }
                  
                  const onlineMembers = Array.from(uniqueUsers.values());
                  
                  // إرسال القائمة المحدثة لجميع الأعضاء في الغرفة
                  this.io.to(room).emit('onlineMembersUpdate', {
                    groupId: groupId,
                    members: onlineMembers
                  });
                  
                  console.log(`📋 تحديث قائمة الأعضاء المتصلين للغرفة ${room}: ${onlineMembers.length} أعضاء`);
                } catch (error) {
                  console.error(`خطأ في تحديث قائمة الأعضاء المتصلين للغرفة ${room}:`, error);
                }
              }, 100);
            }
          }
        } catch (error) {
          console.error('خطأ في تنظيف المستخدم عند قطع الاتصال:', error);
        }
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'مرحباً! تم الاتصال بالنظام اللحظي بنجاح',
        userId: user.userId,
        type: user.type
      });
    });
  }

  // Authorization check for room access
  private canJoinRoom(user: SocketUser, room: string): boolean {
    // Public rooms - everyone can join
    if (room.startsWith('public-') || room === 'market-general') {
      return true;
    }

    // User-specific rooms - only the owner
    if (room.startsWith('user-')) {
      const roomUserId = parseInt(room.split('-')[1]);
      return roomUserId === user.userId;
    }

    // Balance rooms - only the owner
    if (room.startsWith('balance-')) {
      const roomUserId = parseInt(room.split('-')[1]);
      return roomUserId === user.userId;
    }

    // Office rooms - only members of that office
    if (room.startsWith('office-')) {
      const roomOfficeId = parseInt(room.split('-')[1]);
      return user.officeId === roomOfficeId;
    }

    // Market rooms - everyone can join
    if (room.startsWith('market-')) {
      return true;
    }

    // Admin rooms - only admins
    if (room.startsWith('admin-')) {
      return user.type === 'admin';
    }

    // Agent rooms - agents and admins
    if (room.startsWith('agent-')) {
      return user.type === 'agent' || user.type === 'admin';
    }

    return false;
  }

  // Event broadcasting methods
  emitToUser(userId: number, event: string, payload: any) {
    console.log(`📤 Broadcasting to user ${userId}: ${event}`);
    this.io.to(`user-${userId}`).emit(event, payload);
  }

  emitToRoom(room: string, event: string, payload: any) {
    console.log(`📤 Broadcasting to room ${room}: ${event}`);
    this.io.to(room).emit(event, payload);
  }

  emitToUsers(userIds: number[], event: string, payload: any) {
    userIds.forEach(userId => this.emitToUser(userId, event, payload));
  }

  emitToOffice(officeId: number, event: string, payload: any) {
    this.emitToRoom(`office-${officeId}`, event, payload);
  }

  emitToMarket(baseCurrency: string, quoteCurrency: string, event: string, payload: any) {
    this.emitToRoom(`market-${baseCurrency}-${quoteCurrency}`, event, payload);
  }

  emitToAdmins(event: string, payload: any) {
    this.emitToRoom('type-admin', event, payload);
  }

  emitToAgents(event: string, payload: any) {
    this.emitToRoom('type-agent', event, payload);
  }

  // Balance update events
  emitBalanceUpdate(userId: number, currency: string, amount: string) {
    const payload = { userId, currency, amount, timestamp: new Date().toISOString() };
    
    this.emitToUser(userId, 'balance.updated', payload);
    this.emitToRoom(`balance-${userId}-${currency}`, 'balance.updated', payload);
  }

  // Transfer events
  emitTransferCreated(type: 'internal' | 'city' | 'international', transfer: any) {
    const event = `transfer.${type}.created`;
    
    // Notify sender
    this.emitToUser(transfer.senderId || transfer.userId, event, transfer);
    
    // Notify receiver if internal transfer
    if (type === 'internal' && transfer.receiverId) {
      this.emitToUser(transfer.receiverId, event, transfer);
    }
    
    // Notify target office for city/international transfers
    if ((type === 'city' || type === 'international') && transfer.toOfficeId) {
      this.emitToOffice(transfer.toOfficeId, event, transfer);
    }

    // Notify admins
    this.emitToAdmins(event, transfer);
  }

  emitTransferCompleted(type: 'city' | 'international', transfer: any) {
    const event = `transfer.${type}.completed`;
    
    // Notify original sender
    if (transfer.senderId || transfer.userId) {
      this.emitToUser(transfer.senderId || transfer.userId, event, transfer);
    }
    
    // Notify offices involved
    if (transfer.fromOfficeId) {
      this.emitToOffice(transfer.fromOfficeId, event, transfer);
    }
    if (transfer.toOfficeId) {
      this.emitToOffice(transfer.toOfficeId, event, transfer);
    }

    // Notify admins
    this.emitToAdmins(event, transfer);
  }

  // Market events
  emitMarketOrderCreated(order: any) {
    this.emitToUser(order.userId, 'market.order.created', order);
    this.emitToMarket(order.baseCurrency, order.quoteCurrency, 'market.order.created', order);
  }

  emitMarketTradeExecuted(trade: any) {
    // Notify both parties
    this.emitToUser(trade.buyerId, 'market.trade.executed', trade);
    this.emitToUser(trade.sellerId, 'market.trade.executed', trade);
    
    // Notify market watchers
    this.emitToMarket(trade.baseCurrency, trade.quoteCurrency, 'market.trade.executed', trade);
  }

  emitMarketOrderCanceled(order: any) {
    this.emitToUser(order.userId, 'market.order.canceled', order);
    this.emitToMarket(order.baseCurrency, order.quoteCurrency, 'market.order.canceled', order);
  }

  emitOrderbookUpdate(baseCurrency: string, quoteCurrency: string, orderbook: any) {
    this.emitToMarket(baseCurrency, quoteCurrency, 'market.orderbook.updated', orderbook);
  }

  // Notification events
  emitNotification(userId: number, notification: any) {
    this.emitToUser(userId, 'notification.created', notification);
  }

  // Admin events
  emitSettingsUpdated(settings: any) {
    this.emitToRoom('public-hub', 'admin.settings.updated', settings);
  }

  emitRequestStatusUpdated(userId: number, request: any) {
    this.emitToUser(userId, 'request.status.updated', request);
    this.emitToAdmins('request.status.updated', request);
  }

  // Utility methods
  getConnectedUsers(): number {
    return this.io.sockets.sockets.size;
  }

  getUsersInRoom(room: string): number {
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    return roomSockets ? roomSockets.size : 0;
  }
}

// Global WebSocket service instance
let wsService: WebSocketService | null = null;

export function initializeWebSocket(httpServer: HttpServer, storage: DatabaseStorage): WebSocketService {
  wsService = new WebSocketService(httpServer, storage);
  console.log('🚀 WebSocket service initialized');
  return wsService;
}

export function getWebSocketService(): WebSocketService {
  if (!wsService) {
    throw new Error('WebSocket service not initialized');
  }
  return wsService;
}