import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

// RTL
document.documentElement.dir = "rtl";
document.documentElement.lang = "ar";

// Service Worker (مسارات نسبية حتى تعمل تحت /sirafa/)
if ("serviceWorker" in navigator) {
  if (import.meta.env.DEV) {
    (async () => {
      try {
        await navigator.serviceWorker.register("sw-kill.js", { scope: "./" });
        setTimeout(async () => {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        }, 800);
      } catch {}
    })();
  } else {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => {});
  }
}

// 👈 أهم شيء: Router بقاعدة /sirafa
createRoot(document.getElementById("root")!).render(
  <Router base="/sirafa">
    <App />
  </Router>
);
