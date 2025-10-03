import { useState, useEffect } from 'react';
import { triggerInstall, showAppSearchTips, isInstallAvailable } from '@/lib/pwa';

export default function InstallPrompt() {
  const [showBar, setShowBar] = useState(false);
  const [showIOSTips, setShowIOSTips] = useState(false);

  useEffect(() => {
    // Show install bar if PWA prompt is available
    const checkInstallPrompt = () => {
      if (isInstallAvailable()) {
        setShowBar(true);
      }
    };

    // Check initially and listen for beforeinstallprompt
    checkInstallPrompt();
    
    const handleInstallPrompt = () => {
      setShowBar(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', () => setShowBar(false));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', () => setShowBar(false));
    };
  }, []);

  const handleInstall = async () => {
    const success = await triggerInstall();
    if (success) {
      setShowBar(false);
    }
  };

  const handleShowIOSTips = () => {
    setShowIOSTips(true);
    setShowBar(false);
  };

  if (showIOSTips) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 z-[9999] text-sm leading-relaxed" style={{ direction: 'rtl' }}>
        <div className="text-center">
          <div className="mb-3">
            <div className="text-lg mb-2">📱 كيفية تثبيت التطبيق على iPhone</div>
            <div className="text-xs opacity-80">اتبع الخطوات التالية لإضافة التطبيق إلى الشاشة الرئيسية</div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3 my-3 text-center">
            <div className="text-sm mb-2">
              <strong>الخطوة 1:</strong> اضغط على زر المشاركة 
              <span className="px-2 py-1 rounded mx-2 text-white" style={{ backgroundColor: '#FFD700' }}>⬆️</span>
              في أسفل الشاشة
            </div>
            <div className="text-sm">
              <strong>الخطوة 2:</strong> اختر "Add to Home Screen" أو "إضافة إلى الشاشة الرئيسية"
            </div>
          </div>
          
          <button
            onClick={() => setShowIOSTips(false)}
            className="text-white border-none px-5 py-2 rounded cursor-pointer text-sm mt-2 transition-all hover:opacity-90"
            style={{ backgroundColor: '#FFD700' }}
          >
            فهمت، شكراً
          </button>
        </div>
      </div>
    );
  }

  if (!showBar) return null;

  return (
    <div className="fixed left-0 right-0 bottom-0 text-white flex justify-between items-center p-4 z-[9999] text-sm shadow-lg border-t border-white/10" style={{ direction: 'rtl', background: 'linear-gradient(to right, #FFD700, #FFA500)' }}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">📱</div>
        <div>
          <div className="font-bold text-sm">ثبّت منصة الصرافة</div>
          <div className="text-xs opacity-90">للوصول السريع والاستخدام بدون متصفح</div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => setShowBar(false)}
          className="bg-white/10 border border-white/30 text-white px-4 py-2 rounded-full cursor-pointer text-xs transition-all hover:bg-white/20"
        >
          لاحقاً
        </button>
        <button
          onClick={handleInstall}
          className="bg-white border-none px-5 py-2 rounded-full cursor-pointer font-bold text-xs transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ color: '#B8860B' }}
        >
          تثبيت الآن
        </button>
        <button
          onClick={handleShowIOSTips}
          className="bg-white/10 border border-white/30 text-white px-4 py-2 rounded-full cursor-pointer text-xs mr-1"
        >
          بحث عن التطبيق
        </button>
      </div>
    </div>
  );
}