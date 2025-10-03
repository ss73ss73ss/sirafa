import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set the document direction for RTL support
document.documentElement.dir = "rtl";
document.documentElement.lang = "ar";

// Service Worker Management
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // في التطوير: تسجيل kill-switch SW لمسح SW القديم
    (async () => {
      try {
        console.log('🔥 PWA: Registering kill-switch SW...');
        await navigator.serviceWorker.register('/sw-kill.js', { scope: '/' });
        
        // انتظار قليل ثم مسح registrations
        setTimeout(async () => {
          const registrations = await navigator.serviceWorker.getRegistrations();
          registrations.forEach(r => r.unregister());
          
          if ('caches' in window) {
            const keys = await caches.keys();
            keys.forEach(k => caches.delete(k));
          }
          
          console.log('🔧 PWA: Development cleanup complete');
        }, 1000);
        
      } catch (error) {
        console.error('🔥 PWA: Kill-switch failed:', error);
      }
    })();
  } else {
    // في Production: تسجيل SW عادي
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('✅ PWA: Service Worker registered'))
      .catch(error => console.error('❌ PWA: SW registration failed:', error));
  }
}

createRoot(document.getElementById("root")!).render(<App />);
