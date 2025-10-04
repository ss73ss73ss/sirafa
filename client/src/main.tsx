import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

// RTL
document.documentElement.dir = "rtl";
document.documentElement.lang = "ar";

// ===== Service Worker (جيت هب بيجز) =====
// استخدم مسارات نسبية حتى تشتغل تحت /sirafa/
if ("serviceWorker" in navigator) {
  if (import.meta.env.DEV) {
    // خلال التطوير: إزالة أي SW قديم
    (async () => {
      try {
        console.log("🔥 PWA: registering dev kill-switch SW…");
        await navigator.serviceWorker.register("sw-kill.js", { scope: "./" });

        setTimeout(async () => {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          console.log("🔧 PWA: dev cleanup done");
        }, 800);
      } catch (e) {
        console.error("🔥 PWA: kill-switch failed:", e);
      }
    })();
  } else {
    // في الإنتاج على GitHub Pages
    navigator.serviceWorker
      .register("sw.js", { scope: "./" })
      .then(() => console.log("✅ PWA: SW registered"))
      .catch((e) => console.error("❌ PWA: SW registration failed:", e));
  }
}

// ===== Mount with wouter base =====
createRoot(document.getElementById("root")!).render(
  <Router base="/sirafa">
    <App />
  </Router>
);
