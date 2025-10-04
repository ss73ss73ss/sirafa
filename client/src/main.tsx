import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

// RTL
document.documentElement.dir = "rtl";
document.documentElement.lang = "ar";

// ----- Router via hash (الأضمن على GitHub Pages) -----
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

// ----- لا تسجّل Service Worker على GitHub Pages -----
if ("serviceWorker" in navigator) {
  const onGitHubPages = location.host.endsWith("github.io");
  if (!onGitHubPages) {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(
  <Router base="/" hook={useHashLocation()}>
    <App />
  </Router>
);
