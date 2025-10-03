import { Server as SocketIOServer } from 'socket.io';

/**
 * خدمة الأحداث اللحظية - تستخدم Socket.IO الحالي لبث الأحداث
 */
export class RealtimeEvents {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  // ================================
  // أحداث الأرصدة
  // ================================
  emitBalanceUpdate(userId: number, currency: string, amount: string) {
    const payload = { 
      userId, 
      currency, 
      amount, 
      timestamp: new Date().toISOString() 
    };
    
    console.log(`💰 Broadcasting balance update: User ${userId}, ${currency}: ${amount}`);
    
    // إرسال للمستخدم مباشرة
    this.io.to(`user-${userId}`).emit('balance.updated', payload);
    
    // إرسال لغرفة رصيد العملة المحددة
    this.io.to(`balance-${userId}-${currency}`).emit('balance.updated', payload);
  }

  // ================================
  // أحداث التحويلات الداخلية
  // ================================
  emitInternalTransferCreated(transfer: any) {
    const payload = {
      id: transfer.id,
      senderId: transfer.senderId,
      receiverId: transfer.receiverId,
      amount: transfer.amount,
      currency: transfer.currency,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Broadcasting internal transfer: ${transfer.senderId} → ${transfer.receiverId}`);

    // إشعار المرسل
    this.io.to(`user-${transfer.senderId}`).emit('transfer.internal.created', {
      ...payload,
      type: 'sent',
      message: `تم إرسال ${transfer.amount} ${transfer.currency} إلى المستخدم ${transfer.receiverId}`
    });

    // إشعار المستقبل
    this.io.to(`user-${transfer.receiverId}`).emit('transfer.internal.created', {
      ...payload,
      type: 'received',
      message: `تم استلام ${transfer.amount} ${transfer.currency} من المستخدم ${transfer.senderId}`
    });

    // إشعار الإدارة
    this.io.to('type-admin').emit('transfer.internal.created', payload);
  }

  // ================================
  // أحداث تحويلات المدن
  // ================================
  emitCityTransferCreated(transfer: any) {
    const payload = {
      id: transfer.id,
      senderId: transfer.senderId,
      amount: transfer.amount,
      currency: transfer.currency,
      toOfficeId: transfer.toOfficeId,
      code: transfer.code,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    console.log(`🏢 Broadcasting city transfer: ${transfer.senderId} → Office ${transfer.toOfficeId}`);

    // إشعار المرسل
    this.io.to(`user-${transfer.senderId}`).emit('transfer.city.created', payload);

    // إشعار المكتب المستقبل
    this.io.to(`office-${transfer.toOfficeId}`).emit('transfer.city.created', payload);

    // إشعار جميع الوكلاء
    this.io.to('type-agent').emit('transfer.city.created', payload);

    // إشعار الإدارة
    this.io.to('type-admin').emit('transfer.city.created', payload);
  }

  emitCityTransferCompleted(transfer: any) {
    const payload = {
      id: transfer.id,
      senderId: transfer.senderId,
      code: transfer.code,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Broadcasting city transfer completed: ${transfer.code}`);

    // إشعار المرسل الأصلي
    this.io.to(`user-${transfer.senderId}`).emit('transfer.city.completed', payload);

    // إشعار المكاتب المشاركة
    if (transfer.fromOfficeId) {
      this.io.to(`office-${transfer.fromOfficeId}`).emit('transfer.city.completed', payload);
    }
    if (transfer.toOfficeId) {
      this.io.to(`office-${transfer.toOfficeId}`).emit('transfer.city.completed', payload);
    }

    // إشعار الإدارة
    this.io.to('type-admin').emit('transfer.city.completed', payload);
  }

  // ================================
  // أحداث التحويلات الدولية
  // ================================
  emitInternationalTransferCreated(transfer: any) {
    const payload = {
      id: transfer.id,
      senderId: transfer.senderId,
      amount: transfer.amount,
      currency: transfer.currency,
      country: transfer.country,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    console.log(`🌍 Broadcasting international transfer: ${transfer.senderId} → ${transfer.country}`);

    // إشعار المرسل
    this.io.to(`user-${transfer.senderId}`).emit('transfer.international.created', payload);

    // إشعار الإدارة (فقط الإدارة تتعامل مع التحويلات الدولية)
    this.io.to('type-admin').emit('transfer.international.created', payload);
  }

  emitInternationalTransferCompleted(transfer: any) {
    const payload = {
      id: transfer.id,
      senderId: transfer.senderId,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Broadcasting international transfer completed: ${transfer.id}`);

    // إشعار المرسل الأصلي
    this.io.to(`user-${transfer.senderId}`).emit('transfer.international.completed', payload);

    // إشعار الإدارة
    this.io.to('type-admin').emit('transfer.international.completed', payload);
  }

  // ================================
  // أحداث السوق
  // ================================
  emitMarketOrderCreated(order: any) {
    const payload = {
      id: order.id,
      userId: order.userId,
      side: order.side,
      baseCurrency: order.baseCurrency,
      quoteCurrency: order.quoteCurrency,
      amount: order.amount,
      price: order.price,
      total: order.total,
      timestamp: new Date().toISOString()
    };

    console.log(`📊 Broadcasting market order: ${order.side} ${order.baseCurrency}/${order.quoteCurrency}`);

    // إشعار صاحب العرض
    this.io.to(`user-${order.userId}`).emit('market.order.created', payload);

    // إشعار متابعي السوق
    this.io.to(`market-${order.baseCurrency}-${order.quoteCurrency}`).emit('market.order.created', payload);

    // بث تحديث دفتر الأوامر
    this.emitOrderbookUpdate(order.baseCurrency, order.quoteCurrency);
  }

  emitMarketTradeExecuted(trade: any) {
    const payload = {
      id: trade.id,
      buyerId: trade.buyerId,
      sellerId: trade.sellerId,
      baseCurrency: trade.baseCurrency,
      quoteCurrency: trade.quoteCurrency,
      amount: trade.amount,
      price: trade.price,
      total: trade.total,
      timestamp: new Date().toISOString()
    };

    console.log(`🤝 Broadcasting market trade: ${trade.buyerId} ↔ ${trade.sellerId}`);

    // إشعار المشتري
    this.io.to(`user-${trade.buyerId}`).emit('market.trade.executed', {
      ...payload,
      type: 'buy',
      message: `تم تنفيذ طلب الشراء: ${trade.amount} ${trade.baseCurrency} بسعر ${trade.price}`
    });

    // إشعار البائع
    this.io.to(`user-${trade.sellerId}`).emit('market.trade.executed', {
      ...payload,
      type: 'sell',
      message: `تم تنفيذ طلب البيع: ${trade.amount} ${trade.baseCurrency} بسعر ${trade.price}`
    });

    // إشعار متابعي السوق
    this.io.to(`market-${trade.baseCurrency}-${trade.quoteCurrency}`).emit('market.trade.executed', payload);

    // بث تحديث دفتر الأوامر
    this.emitOrderbookUpdate(trade.baseCurrency, trade.quoteCurrency);
  }

  emitMarketOrderCanceled(order: any) {
    const payload = {
      id: order.id,
      userId: order.userId,
      baseCurrency: order.baseCurrency,
      quoteCurrency: order.quoteCurrency,
      timestamp: new Date().toISOString()
    };

    console.log(`❌ Broadcasting market order canceled: ${order.id}`);

    // إشعار صاحب العرض
    this.io.to(`user-${order.userId}`).emit('market.order.canceled', payload);

    // إشعار متابعي السوق
    this.io.to(`market-${order.baseCurrency}-${order.quoteCurrency}`).emit('market.order.canceled', payload);

    // بث تحديث دفتر الأوامر
    this.emitOrderbookUpdate(order.baseCurrency, order.quoteCurrency);
  }

  async emitOrderbookUpdate(baseCurrency: string, quoteCurrency: string) {
    // هذه ستحتاج إلى جلب بيانات دفتر الأوامر الحالي
    const payload = {
      baseCurrency,
      quoteCurrency,
      timestamp: new Date().toISOString(),
      // سنضيف بيانات دفتر الأوامر هنا لاحقاً
    };

    console.log(`📋 Broadcasting orderbook update: ${baseCurrency}/${quoteCurrency}`);
    this.io.to(`market-${baseCurrency}-${quoteCurrency}`).emit('market.orderbook.updated', payload);
  }

  // ================================
  // أحداث الإشعارات
  // ================================
  emitNotification(userId: number, notification: any) {
    const payload = {
      id: notification.id,
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      timestamp: new Date().toISOString()
    };

    console.log(`🔔 Broadcasting notification to user ${userId}: ${notification.title}`);

    // إرسال للمستخدم
    this.io.to(`user-${userId}`).emit('notification.created', payload);
  }

  // ================================
  // أحداث الإدارة
  // ================================
  emitSettingsUpdated(settings: any) {
    const payload = {
      type: settings.type || 'general',
      data: settings,
      timestamp: new Date().toISOString()
    };

    console.log(`⚙️ Broadcasting settings update: ${settings.type}`);

    // إرسال لجميع المستخدمين
    this.io.emit('admin.settings.updated', payload);
  }

  emitRequestStatusUpdated(userId: number, request: any) {
    const payload = {
      id: request.id,
      userId,
      type: request.type,
      status: request.status,
      timestamp: new Date().toISOString()
    };

    console.log(`📋 Broadcasting request status update: ${request.id} → ${request.status}`);

    // إشعار المستخدم صاحب الطلب
    this.io.to(`user-${userId}`).emit('request.status.updated', payload);

    // إشعار الإدارة
    this.io.to('type-admin').emit('request.status.updated', payload);
  }

  // ================================
  // أحداث الشحن والسحب
  // ================================
  emitTopupCreated(userId: number, topup: any) {
    const payload = {
      id: topup.id,
      userId,
      amount: topup.amount,
      currency: topup.currency,
      type: 'topup',
      timestamp: new Date().toISOString()
    };

    console.log(`💳 Broadcasting topup: User ${userId}, ${topup.amount} ${topup.currency}`);

    // إشعار المستخدم
    this.io.to(`user-${userId}`).emit('topup.created', payload);

    // إشعار الإدارة
    this.io.to('type-admin').emit('topup.created', payload);
  }

  emitWithdrawCreated(userId: number, withdraw: any) {
    const payload = {
      id: withdraw.id,
      userId,
      amount: withdraw.amount,
      currency: withdraw.currency,
      type: 'withdraw',
      timestamp: new Date().toISOString()
    };

    console.log(`💸 Broadcasting withdraw: User ${userId}, ${withdraw.amount} ${withdraw.currency}`);

    // إشعار المستخدم
    this.io.to(`user-${userId}`).emit('withdraw.created', payload);

    // إشعار الإدارة
    this.io.to('type-admin').emit('withdraw.created', payload);
  }

  // ================================
  // وظائف مساعدة للغرف
  // ================================
  subscribeUserToRoom(userId: number, room: string) {
    // البحث عن جميع sockets للمستخدم والانضمام للغرفة
    const userSockets = this.getUserSockets(userId);
    userSockets.forEach(socket => {
      socket.join(room);
    });
    console.log(`📡 User ${userId} subscribed to room: ${room}`);
  }

  unsubscribeUserFromRoom(userId: number, room: string) {
    const userSockets = this.getUserSockets(userId);
    userSockets.forEach(socket => {
      socket.leave(room);
    });
    console.log(`📡 User ${userId} unsubscribed from room: ${room}`);
  }

  private getUserSockets(userId: number) {
    const sockets: any[] = [];
    this.io.sockets.sockets.forEach((socket: any) => {
      if (socket.userId === userId) {
        sockets.push(socket);
      }
    });
    return sockets;
  }

  // إحصائيات
  getConnectedUsers(): number {
    return this.io.sockets.sockets.size;
  }

  getUsersInRoom(room: string): number {
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    return roomSockets ? roomSockets.size : 0;
  }
}

// متغير عام للخدمة
let realtimeEvents: RealtimeEvents | null = null;

export function initializeRealtimeEvents(io: SocketIOServer): RealtimeEvents {
  realtimeEvents = new RealtimeEvents(io);
  console.log('🚀 Realtime Events service initialized');
  return realtimeEvents;
}

export function getRealtimeEvents(): RealtimeEvents {
  if (!realtimeEvents) {
    throw new Error('Realtime Events service not initialized');
  }
  return realtimeEvents;
}