import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

// RTL
document.documentElement.dir = "rtl";
document.documentElement.lang = "ar";

// ----- Router via hash (يتجنب مشاكل GitHub Pages) -----
function useHashLocation() {
  return {
    subscribe: (cb: (path: string) => void) => {
      const onHash = () => cb(window.location.hash.slice(1) || "/");
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    },
    getLocation: () => window.location.hash.slice(1) || "/",
    navigate: (to: string) => {
      if (!to.startsWith("/")) to = "/" + to;
      window.location.hash = to;
    },
  };
}

// Service Worker بمسارات نسبية (آمن على /sirafa/)
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

createRoot(document.getElementById("root")!).render(
  // base "/" لأننا الآن نوجّه بالهاش
  <Router base="/" hook={useHashLocation()}>
    <App />
  </Router>
);
