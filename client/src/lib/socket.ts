import { io, Socket } from 'socket.io-client';

// تعريف أنواع الأحداث اللحظية
export interface MarketOrderEvent {
  id: number;
  userId: number;
  side: 'buy' | 'sell';
  baseCurrency: string;
  quoteCurrency: string;
  amount: number;
  price: number;
  total: number;
}

export interface TradeExecutedEvent {
  tradeId: number;
  buyUserId: number;
  sellUserId: number;
  baseCurrency: string;
  quoteCurrency: string;
  amount: number;
  price: number;
  total: number;
  executedAt: string;
}

export interface BalanceUpdateEvent {
  userId: number;
  currency: string;
  amount: string;
  timestamp?: string;
}

export interface OrderbookUpdateEvent {
  baseCurrency: string;
  quoteCurrency: string;
  timestamp?: string;
}

export interface NotificationEvent {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  timestamp: string;
}

// تعريف أنواع الأحداث الواردة من الخادم
export interface ServerToClientEvents {
  // أحداث السوق
  'market.order.created': (data: MarketOrderEvent) => void;
  'market.order.canceled': (data: { id: number; userId: number; baseCurrency: string; quoteCurrency: string }) => void;
  'market.trade.executed': (data: TradeExecutedEvent) => void;
  'market.orderbook.updated': (data: OrderbookUpdateEvent) => void;
  
  // أحداث الأرصدة
  'balance.updated': (data: BalanceUpdateEvent) => void;
  
  // أحداث الإشعارات
  'notification.created': (data: NotificationEvent) => void;
  
  // أحداث التحويلات
  'transfer.completed': (data: any) => void;
  'transfer.received': (data: any) => void;
  
  // أحداث الإعدادات والإدارة
  'settings.updated': (data: any) => void;
  'user.status.changed': (data: any) => void;
  
  // أحداث المحادثة (موجودة مسبقاً)
  newMessage: (message: any) => void;
  messageDeleted: (data: { messageId: number; roomId: number }) => void;
  messageEdited: (data: { messageId: number; newContent: string; roomId: number }) => void;
  userJoined: (data: { userId: number; fullName: string; roomId: number }) => void;
  userLeft: (data: { userId: number; fullName: string; roomId: number }) => void;
  userTyping: (data: { userId: number; fullName: string; roomId: number }) => void;
  userStoppedTyping: (data: { userId: number; fullName: string; roomId: number }) => void;
  messageLiked: (data: { messageId: number; userId: number; liked: boolean; count: number }) => void;
}

// تعريف أنواع الأحداث المرسلة إلى الخادم
export interface ClientToServerEvents {
  // مصادقة المستخدم
  authenticate: (token: string) => void;
  
  // انضمام للغرف
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  
  // أحداث المحادثة
  sendMessage: (data: { roomId: number; content: string; file?: File }) => void;
  deleteMessage: (data: { messageId: number; roomId: number }) => void;
  editMessage: (data: { messageId: number; newContent: string; roomId: number }) => void;
  typing: (data: { roomId: number }) => void;
  stopTyping: (data: { roomId: number }) => void;
  likeMessage: (data: { messageId: number; roomId: number }) => void;
}

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private authenticated = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Function[]> = new Map();

  // إنشاء الاتصال
  connect(token?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket;
    }

    // إنشاء اتصال Socket.IO
    this.socket = io('/', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();

    // مصادقة المستخدم إذا كان هناك رمز
    if (token) {
      this.authenticate(token);
    }

    return this.socket;
  }

  // إعداد معالجات الأحداث
  private setupEventHandlers() {
    if (!this.socket) return;

    // أحداث الاتصال
    this.socket.on('connect', () => {
      console.log('🟢 تم الاتصال بخادم Socket.IO');
      this.reconnectAttempts = 0;
      
      // إعادة المصادقة عند الاتصال المتجدد
      const token = localStorage.getItem('token');
      if (token && !this.authenticated) {
        this.authenticate(token);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 انقطع الاتصال مع خادم Socket.IO:', reason);
      this.authenticated = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ خطأ في الاتصال مع Socket.IO:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ فشل في الاتصال بعد عدة محاولات');
      }
    });

    // إعداد معالجات الأحداث المخصصة
    this.setupCustomEventHandlers();
  }

  // إعداد معالجات الأحداث المخصصة
  private setupCustomEventHandlers() {
    if (!this.socket) return;

    // أحداث السوق
    this.socket.on('market.order.created', (data) => {
      console.log('🚀 عرض جديد تم إنشاؤه:', data);
      this.emitToListeners('market.order.created', data);
    });

    this.socket.on('market.order.canceled', (data) => {
      console.log('❌ تم إلغاء العرض:', data);
      this.emitToListeners('market.order.canceled', data);
    });

    this.socket.on('market.trade.executed', (data) => {
      console.log('💰 تم تنفيذ الصفقة:', data);
      this.emitToListeners('market.trade.executed', data);
    });

    this.socket.on('market.orderbook.updated', (data) => {
      console.log('📊 تحديث دفتر الأوامر:', data);
      this.emitToListeners('market.orderbook.updated', data);
    });

    // أحداث الأرصدة
    this.socket.on('balance.updated', (data) => {
      console.log('💳 تحديث الرصيد:', data);
      this.emitToListeners('balance.updated', data);
    });

    // أحداث الإشعارات
    this.socket.on('notification.created', (data) => {
      console.log('🔔 إشعار جديد:', data);
      this.emitToListeners('notification.created', data);
    });

    // أحداث المحادثة (الموجودة مسبقاً)
    this.socket.on('newMessage', (message) => {
      this.emitToListeners('newMessage', message);
    });

    this.socket.on('messageDeleted', (data) => {
      this.emitToListeners('messageDeleted', data);
    });

    this.socket.on('messageEdited', (data) => {
      this.emitToListeners('messageEdited', data);
    });

    this.socket.on('userTyping', (data) => {
      this.emitToListeners('userTyping', data);
    });

    this.socket.on('userStoppedTyping', (data) => {
      this.emitToListeners('userStoppedTyping', data);
    });

    this.socket.on('messageLiked', (data) => {
      this.emitToListeners('messageLiked', data);
    });
  }

  // مصادقة المستخدم
  authenticate(token: string) {
    if (!this.socket) {
      console.error('❌ لا يوجد اتصال Socket.IO للمصادقة');
      return;
    }

    this.socket.emit('authenticate', token);
    this.authenticated = true;
    console.log('🔑 تم إرسال رمز المصادقة');
  }

  // انضمام للغرفة
  joinRoom(roomId: string) {
    if (!this.socket || !this.authenticated) {
      console.error('❌ يجب المصادقة أولاً قبل الانضمام للغرف');
      return;
    }

    this.socket.emit('joinRoom', roomId);
    console.log(`🏠 انضم للغرفة: ${roomId}`);
  }

  // مغادرة الغرفة
  leaveRoom(roomId: string) {
    if (!this.socket) return;

    this.socket.emit('leaveRoom', roomId);
    console.log(`🚪 غادر الغرفة: ${roomId}`);
  }

  // إضافة مستمع للأحداث
  on<K extends keyof ServerToClientEvents>(event: K, callback: ServerToClientEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // إزالة مستمع الأحداث
  off<K extends keyof ServerToClientEvents>(event: K, callback: ServerToClientEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // بث الحدث للمستمعين
  private emitToListeners(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`خطأ في معالج الحدث ${event}:`, error);
        }
      });
    }
  }

  // الحصول على Socket
  getSocket() {
    return this.socket;
  }

  // حالة الاتصال
  isConnected() {
    return this.socket?.connected || false;
  }

  // حالة المصادقة
  isAuthenticated() {
    return this.authenticated;
  }

  // قطع الاتصال
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.authenticated = false;
      this.eventListeners.clear();
      console.log('🔴 تم قطع اتصال Socket.IO');
    }
  }
}

// إنشاء مثيل مشترك
export const socketManager = new SocketManager();

// تصدير أنواع إضافية
export type { Socket };