// PWA Installation - Global Singleton Pattern
const pwa = (globalThis as any).__pwa ?? ((globalThis as any).__pwa = {});

if (!pwa.init) {
  pwa.deferredPrompt = pwa.deferredPrompt ?? null;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pwa.deferredPrompt = e;
    console.log('✅ PWA: Install prompt captured');
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA: App installed successfully');
    pwa.deferredPrompt = null;
  });

  pwa.init = true;
  console.log('✅ PWA: Singleton initialized');
}

export async function triggerInstall(): Promise<boolean> {
  const dp = (globalThis as any).__pwa?.deferredPrompt;
  
  if (!dp) {
    // Fallback instructions for manual install
    alert('لتثبيت التطبيق على الهاتف:\n\n• أندرويد: قائمة المتصفح ← تثبيت التطبيق\n• iPhone: زر المشاركة ← Add to Home Screen');
    return false;
  }

  try {
    dp.prompt();
    const { outcome } = await dp.userChoice;
    (globalThis as any).__pwa.deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('PWA install error:', error);
    return false;
  }
}

export function showAppSearchTips(): void {
  alert('للعثور على التطبيق المثبت:\n\n• ابحث في الشاشة الرئيسية عن "الصرافة"\n• أو استخدم البحث في الهاتف');
}

export function isInstallAvailable(): boolean {
  return !!(globalThis as any).__pwa?.deferredPrompt;
}