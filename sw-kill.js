// Service Worker Kill Switch - يزيل SW القديم و caches
self.addEventListener('install', e => {
  console.log('🔥 SW Kill Switch: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', async (event) => {
  console.log('🔥 SW Kill Switch: Activating...');
  
  event.waitUntil((async () => {
    try {
      // مسح جميع caches
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      console.log('🔥 SW Kill Switch: Cleared all caches');
    } catch (error) {
      console.log('🔥 SW Kill Switch: Cache clear failed:', error);
    }
    
    try {
      // إلغاء تسجيل SW
      await self.registration.unregister();
      console.log('🔥 SW Kill Switch: Unregistered SW');
    } catch (error) {
      console.log('🔥 SW Kill Switch: Unregister failed:', error);
    }
    
    // إعادة تحميل جميع التبويبات المفتوحة
    const clientsList = await self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    });
    
    clientsList.forEach(client => {
      console.log('🔥 SW Kill Switch: Reloading client:', client.url);
      client.navigate(client.url);
    });
  })());
});