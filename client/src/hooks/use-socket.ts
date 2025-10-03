import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketManager, type ServerToClientEvents } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

export function useSocket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const connectedRef = useRef(false);
  const authenticatedRef = useRef(false);

  // تهيئة الاتصال
  const connect = useCallback((token?: string) => {
    try {
      const socket = socketManager.connect(token);
      
      if (socket) {
        // تحديث حالة الاتصال
        socket.on('connect', () => {
          console.log('🟢 Socket.IO متصل');
          setIsConnected(true);
          connectedRef.current = true;
          
          // مصادقة تلقائية عند الاتصال
          if (token) {
            console.log('🔑 إرسال رمز المصادقة...');
            socketManager.authenticate(token);
            setIsAuthenticated(true);
            authenticatedRef.current = true;
          }
        });

        socket.on('disconnect', () => {
          console.log('🔴 Socket.IO منقطع');
          setIsConnected(false);
          setIsAuthenticated(false);
          connectedRef.current = false;
          authenticatedRef.current = false;
        });

        // إذا كان متصلاً بالفعل ولديه رمز
        if (socket.connected && token) {
          console.log('🔗 Socket.IO متصل بالفعل، إرسال المصادقة...');
          socketManager.authenticate(token);
          setIsConnected(true);
          setIsAuthenticated(true);
          connectedRef.current = true;
          authenticatedRef.current = true;
        }
      }
    } catch (error) {
      console.error('خطأ في الاتصال بـ Socket.IO:', error);
    }
  }, []);

  // قطع الاتصال
  const disconnect = useCallback(() => {
    socketManager.disconnect();
    setIsConnected(false);
    setIsAuthenticated(false);
    connectedRef.current = false;
    authenticatedRef.current = false;
  }, []);

  // انضمام للغرفة
  const joinRoom = useCallback((roomId: string) => {
    if (connectedRef.current && authenticatedRef.current) {
      socketManager.joinRoom(roomId);
    }
  }, []);

  // مغادرة الغرفة
  const leaveRoom = useCallback((roomId: string) => {
    socketManager.leaveRoom(roomId);
  }, []);

  // إضافة مستمع للأحداث
  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K, 
    callback: ServerToClientEvents[K]
  ) => {
    socketManager.on(event, callback);
  }, []);

  // إزالة مستمع الأحداث
  const off = useCallback(<K extends keyof ServerToClientEvents>(
    event: K, 
    callback: ServerToClientEvents[K]
  ) => {
    socketManager.off(event, callback);
  }, []);

  // الحصول على Socket مباشرة
  const getSocket = useCallback(() => {
    return socketManager.getSocket();
  }, []);

  return {
    // الحالة
    isConnected,
    isAuthenticated,
    
    // الطرق
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    on,
    off,
    getSocket,
  };
}

// خطاف متخصص للسوق اللحظي
export function useMarketSocket() {
  const { on, off, joinRoom } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // الانضمام لغرف السوق
    joinRoom('market-general');
    joinRoom('market-USD-LYD');
    joinRoom('market-LYD-USD');
    console.log('🏠 انضم لغرف السوق');

    // معالج إنشاء العروض
    const handleOrderCreated = (data: any) => {
      console.log('🚀 عرض جديد تم استلامه:', data);
      
      // تحديث قائمة العروض
      queryClient.invalidateQueries({ queryKey: ['/api/market'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market/offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market/my-offers'] });
      
      // إشعار المستخدم
      toast({
        title: "عرض جديد",
        description: `تم إنشاء عرض ${data.side === 'buy' ? 'شراء' : 'بيع'} ${data.amount} ${data.baseCurrency}`,
        duration: 3000,
      });
    };

    // معالج إلغاء العروض
    const handleOrderCanceled = (data: any) => {
      console.log('❌ إلغاء عرض:', data);
      
      // تحديث قائمة العروض
      queryClient.invalidateQueries({ queryKey: ['/api/market'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market/offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market/my-offers'] });
    };

    // معالج تنفيذ الصفقات
    const handleTradeExecuted = (data: any) => {
      console.log('💰 صفقة منفذة:', data);
      
      // تحديث قائمة العروض والأرصدة
      queryClient.invalidateQueries({ queryKey: ['/api/market'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market/offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market/my-offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      
      // إشعار المستخدم
      toast({
        title: "تم تنفيذ الصفقة",
        description: `صفقة ${data.amount} ${data.baseCurrency} بسعر ${data.price}`,
        duration: 5000,
      });
    };

    // معالج تحديث دفتر الأوامر
    const handleOrderbookUpdated = (data: any) => {
      console.log('📊 تحديث دفتر الأوامر:', data);
      
      // تحديث قائمة العروض
      queryClient.invalidateQueries({ queryKey: ['/api/market'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market/offers'] });
    };

    // تسجيل المعالجات
    on('market.order.created', handleOrderCreated);
    on('market.order.canceled', handleOrderCanceled);
    on('market.trade.executed', handleTradeExecuted);
    on('market.orderbook.updated', handleOrderbookUpdated);

    // تنظيف المعالجات عند الإلغاء
    return () => {
      off('market.order.created', handleOrderCreated);
      off('market.order.canceled', handleOrderCanceled);
      off('market.trade.executed', handleTradeExecuted);
      off('market.orderbook.updated', handleOrderbookUpdated);
    };
  }, [on, off, queryClient, toast]);

  return {
    // يمكن إضافة طرق متخصصة للسوق هنا إذا لزم الأمر
  };
}

// خطاف متخصص للأرصدة اللحظية
export function useBalanceSocket() {
  const { on, off } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // معالج تحديث الرصيد
    const handleBalanceUpdated = (data: any) => {
      console.log('💳 تحديث الرصيد تم استلامه:', data);
      
      // تحديث بيانات الرصيد
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      
      // إشعار المستخدم للتأكد من وصول الحدث
      toast({
        title: "تحديث الرصيد",
        description: `${data.currency}: ${data.amount}`,
        duration: 2000,
      });
    };

    // تسجيل المعالج
    on('balance.updated', handleBalanceUpdated);

    // تنظيف المعالج عند الإلغاء
    return () => {
      off('balance.updated', handleBalanceUpdated);
    };
  }, [on, off, queryClient, toast]);

  return {
    // يمكن إضافة طرق متخصصة للأرصدة هنا إذا لزم الأمر
  };
}

// خطاف متخصص للإشعارات اللحظية
export function useNotificationSocket() {
  const { on, off } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // معالج الإشعارات الجديدة
    const handleNotificationCreated = (data: any) => {
      console.log('🔔 إشعار جديد:', data);
      
      // تحديث قائمة الإشعارات
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      // عرض الإشعار للمستخدم
      toast({
        title: data.title,
        description: data.message,
        duration: 5000,
      });
    };

    // تسجيل المعالج
    on('notification.created', handleNotificationCreated);

    // تنظيف المعالج عند الإلغاء
    return () => {
      off('notification.created', handleNotificationCreated);
    };
  }, [on, off, queryClient, toast]);

  return {
    // يمكن إضافة طرق متخصصة للإشعارات هنا إذا لزم الأمر
  };
}

// خطاف شامل يجمع كل الوظائف اللحظية
export function useRealtimeUpdates() {
  const socket = useSocket();
  const market = useMarketSocket();
  const balance = useBalanceSocket();
  const notification = useNotificationSocket();

  // تهيئة تلقائية عند وجود رمز المصادقة
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !socket.isConnected) {
      socket.connect(token);
    }
  }, [socket]);

  return {
    socket,
    market,
    balance,
    notification,
  };
}