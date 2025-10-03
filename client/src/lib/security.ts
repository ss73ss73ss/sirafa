// نظام الأمان المتقدم مع التصوير الصامت الإلزامي
console.log('🔥 [SECURITY SYSTEM] security.ts file loaded!');
import FingerprintJS from '@fingerprintjs/fingerprintjs';

class SecuritySystem {
  constructor() {
    console.log('🏗️ [SECURITY SYSTEM] SecuritySystem constructor called');
  }
  private fingerprint: string = '';
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private permissionGranted: boolean = false;
  private failedLoginAttempts: number = 0;
  private silentCaptureTriggered: boolean = false;
  private backgroundCameraActive: boolean = false;

  // تهيئة بصمة الجهاز
  async initFingerprint(): Promise<string> {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      this.fingerprint = result.visitorId;
      console.log('🔑 تم إنشاء بصمة الجهاز:', this.fingerprint.substring(0, 8) + '...');
      return this.fingerprint;
    } catch (error) {
      console.error('❌ فشل في إنشاء بصمة الجهاز:', error);
      this.fingerprint = 'fallback_' + Date.now().toString();
      return this.fingerprint;
    }
  }

  // الحصول على بصمة الجهاز الحالية
  getFingerprint(): string {
    return this.fingerprint;
  }

  // تشغيل الكاميرا المبكر في الخلفية (للصفحات التي تحتاج تصوير صامت)
  async startBackgroundCamera(): Promise<boolean> {
    try {
      console.log('📹 [SECURITY DEBUG] تشغيل الكاميرا في الخلفية للتصوير الصامت...');
      
      if (this.backgroundCameraActive) {
        console.log('📹 [SECURITY DEBUG] الكاميرا نشطة بالفعل في الخلفية');
        return true;
      }

      // التحقق من دعم mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('⚠️ المتصفح لا يدعم الكاميرا');
        return false;
      }

      try {
        // طلب الوصول للكاميرا مع إعدادات محسنة للاستقرار
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640, min: 320 }, 
            height: { ideal: 480, min: 240 },
            facingMode: 'user',
            frameRate: { ideal: 15, max: 30 } // معدل إطارات معتدل لتوفير الموارد
          },
          audio: false // عدم طلب الصوت لتقليل استهلاك الموارد
        });
        
        console.log('✅ [CAMERA DEBUG] تم تشغيل الكاميرا في الخلفية بنجاح');
        
        // إعداد عناصر التصوير الصامت
        await this.setupBackgroundCameraElements();
        
        this.backgroundCameraActive = true;
        this.permissionGranted = true;
        
        return true;
        
      } catch (mediaError: any) {
        console.error('❌ [CAMERA DEBUG] فشل تشغيل الكاميرا في الخلفية:', mediaError);
        
        // معالجة خاصة للأخطاء الشائعة
        if (mediaError.name === 'NotAllowedError') {
          console.log('🚫 [CAMERA DEBUG] المستخدم رفض إذن الكاميرا - تفعيل النمط البديل');
        } else if (mediaError.name === 'NotFoundError') {
          console.warn('⚠️ [CAMERA DEBUG] لا توجد كاميرا متاحة - تفعيل النمط البديل');
        } else if (mediaError.name === 'NotReadableError') {
          console.warn('⚠️ [CAMERA DEBUG] الكاميرا مستخدمة من تطبيق آخر - تفعيل النمط البديل');
        }
        
        // تفعيل النمط البديل: إنشاء صورة أمنية اصطناعية
        console.log('🔄 [CAMERA DEBUG] تفعيل نظام الأمان البديل...');
        this.enableFallbackSecurityMode();
        
        return false;
      }
      
    } catch (error) {
      console.error('❌ خطأ في تشغيل الكاميرا في الخلفية:', error);
      return false;
    }
  }

  // إعداد عناصر الكاميرا للعمل في الخلفية
  private async setupBackgroundCameraElements(): Promise<void> {
    if (!this.stream) return;
    
    console.log('🔧 بدء إعداد عناصر التصوير المحسنة...');
    
    // إنشاء عنصر فيديو مخفي محسن
    this.videoElement = document.createElement('video');
    this.videoElement.style.display = 'none';
    this.videoElement.style.position = 'absolute';
    this.videoElement.style.top = '-9999px';
    this.videoElement.style.left = '-9999px';
    this.videoElement.style.width = '1px';
    this.videoElement.style.height = '1px';
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true; // مهم للـ iOS
    
    // إضافة معالجات الأحداث أولاً
    this.videoElement.addEventListener('loadedmetadata', () => {
      console.log('📹 تم تحميل بيانات الفيديو - الدقة:', this.videoElement!.videoWidth, 'x', this.videoElement!.videoHeight);
    });
    
    this.videoElement.addEventListener('canplay', () => {
      console.log('✅ الفيديو جاهز للتشغيل');
      this.videoElement!.play().catch(e => console.warn('⚠️ فشل تشغيل الفيديو:', e));
    });
    
    this.videoElement.addEventListener('error', (e) => {
      console.error('❌ خطأ في عنصر الفيديو:', e);
    });
    
    // ربط بث الكاميرا
    this.videoElement.srcObject = this.stream;
    document.body.appendChild(this.videoElement);
    
    // إنشاء canvas للتصوير محسن
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'none';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '-9999px';
    this.canvas.width = 640;
    this.canvas.height = 480;
    document.body.appendChild(this.canvas);
    
    // انتظار جاهزية الفيديو مع مهلة زمنية
    console.log('⏳ انتظار جاهزية بث الفيديو...');
    await new Promise<void>((resolve) => {
      let resolved = false;
      
      const resolveOnce = () => {
        if (!resolved) {
          resolved = true;
          console.log('✅ الفيديو جاهز للتصوير');
          resolve();
        }
      };
      
      // التحقق الفوري
      if (this.videoElement!.readyState >= 2) {
        resolveOnce();
        return;
      }
      
      // معالجات الأحداث
      this.videoElement!.addEventListener('loadeddata', resolveOnce, { once: true });
      this.videoElement!.addEventListener('canplay', resolveOnce, { once: true });
      
      // مهلة احتياطية
      setTimeout(() => {
        if (!resolved) {
          console.warn('⚠️ انتهت مهلة انتظار الفيديو - المتابعة');
          resolveOnce();
        }
      }, 5000);
    });
    
    // تشغيل الفيديو إذا لم يكن يعمل
    if (this.videoElement.paused) {
      try {
        await this.videoElement.play();
        console.log('▶️ تم تشغيل الفيديو يدوياً');
      } catch (playError) {
        console.warn('⚠️ فشل تشغيل الفيديو يدوياً:', playError);
      }
    }
    
    console.log('📸 تم إعداد عناصر التصوير في الخلفية بنجاح');
  }

  // طلب إذن الكاميرا (إجباري)
  async requestCameraPermission(): Promise<boolean> {
    try {
      console.log('📹 طلب إذن الكاميرا الإجباري...');
      
      // التحقق من دعم mediaDevices أولاً
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('⚠️ المتصفح لا يدعم الوصول للكاميرا - السماح بالوصول للأجهزة القديمة');
        this.permissionGranted = true;
        return true;
      }
      
      // التحقق من إذن الكاميرا
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('🔍 حالة إذن الكاميرا الحالية:', permission.state);
        
        if (permission.state === 'denied') {
          console.log('🚫 إذن الكاميرا مرفوض - حظر الوصول الكامل');
          return false;
        }
      } catch (permError) {
        console.warn('⚠️ لا يمكن التحقق من إذن الكاميرا:', permError);
      }
      
      // محاولة الوصول للكاميرا
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        
        console.log('✅ تم الحصول على إذن الكاميرا بنجاح');
        this.permissionGranted = true;
        
        // إعداد عناصر التصوير
        await this.setupCameraElements();
        
        return true;
      } catch (mediaError: any) {
        console.error('❌ فشل الوصول للكاميرا:', mediaError);
        
        // للأجهزة بدون كاميرا أو في البيئة التطويرية - السماح بالوصول
        if (mediaError.name === 'NotFoundError' || 
            mediaError.name === 'DevicesNotFoundError' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1') {
          console.warn('⚠️ لا توجد كاميرا أو بيئة تطويرية - السماح بالوصول');
          this.permissionGranted = true;
          return true;
        }
        
        return false;
      }
      
    } catch (error) {
      console.error('❌ خطأ في طلب إذن الكاميرا:', error);
      // في حالة خطأ غير متوقع - السماح بالوصول لمنع حظر المستخدمين
      this.permissionGranted = true;
      return true;
    }
  }

  // إعداد عناصر الكاميرا للتصوير الصامت
  private async setupCameraElements(): Promise<void> {
    if (!this.stream) return;
    
    // إنشاء عنصر فيديو مخفي
    this.videoElement = document.createElement('video');
    this.videoElement.style.display = 'none';
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.srcObject = this.stream;
    document.body.appendChild(this.videoElement);
    
    // إنشاء canvas للتصوير
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'none';
    this.canvas.width = 640;
    this.canvas.height = 480;
    document.body.appendChild(this.canvas);
    
    console.log('📸 تم إعداد عناصر التصوير الصامت');
  }

  // تسجيل محاولة تسجيل دخول فاشلة
  recordFailedLoginAttempt(): void {
    this.failedLoginAttempts++;
    console.log(`🚨 [SECURITY DEBUG] محاولة تسجيل دخول فاشلة رقم: ${this.failedLoginAttempts}`);
    console.log(`🔍 [SECURITY DEBUG] حالة silentCaptureTriggered: ${this.silentCaptureTriggered}`);
    console.log(`🔍 [SECURITY DEBUG] حالة backgroundCameraActive: ${this.backgroundCameraActive}`);
    
    // تفعيل التصوير الصامت بعد 3 محاولات بالضبط
    if (this.failedLoginAttempts === 3 && !this.silentCaptureTriggered) {
      console.log('📸 [SECURITY DEBUG] تفعيل التصوير الصامت - 3 محاولات فاشلة');
      this.triggerSilentCapture();
    }
  }

  // إعادة تعيين عداد المحاولات عند النجاح
  resetFailedAttempts(): void {
    if (this.failedLoginAttempts > 0) {
      console.log('✅ تم إعادة تعيين عداد المحاولات الفاشلة');
      this.failedLoginAttempts = 0;
      this.silentCaptureTriggered = false;
    }
  }

  // التصوير الصامت المحسن (بدون إشعار المستخدم)
  private async triggerSilentCapture(): Promise<void> {
    try {
      console.log('📸 بدء التصوير الصامت المحسن...');
      
      // التحقق من جاهزية الكاميرا في الخلفية
      if (!this.backgroundCameraActive || !this.videoElement || !this.canvas) {
        console.warn('⚠️ الكاميرا غير نشطة في الخلفية - محاولة تشغيل سريع...');
        
        // محاولة سريعة لتشغيل الكاميرا
        const quickStart = await this.startBackgroundCamera();
        if (!quickStart) {
          console.error('❌ فشل تشغيل الكاميرا للتصوير الصامت');
          return;
        }
        
        // انتظار أطول للتأكد من الجاهزية
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      this.silentCaptureTriggered = true;
      
      // التأكد من تشغيل الفيديو
      if (this.videoElement!.paused) {
        console.log('▶️ تشغيل الفيديو للتصوير...');
        try {
          await this.videoElement!.play();
        } catch (playError) {
          console.warn('⚠️ فشل تشغيل الفيديو:', playError);
        }
      }
      
      // انتظار إضافي لضمان استقرار البث
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // التحقق المتقدم من جاهزية الفيديو
      console.log('🔍 فحص حالة الفيديو:');
      console.log('- readyState:', this.videoElement!.readyState);
      console.log('- videoWidth:', this.videoElement!.videoWidth);
      console.log('- videoHeight:', this.videoElement!.videoHeight);
      console.log('- paused:', this.videoElement!.paused);
      console.log('- currentTime:', this.videoElement!.currentTime);
      
      if (this.videoElement!.readyState < 2) {
        console.log('⏳ انتظار جاهزية بث الفيديو...');
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('⚠️ انتهت مهلة انتظار الفيديو - المتابعة بالتصوير');
            resolve();
          }, 8000); // مهلة أطول
          
          const checkReady = () => {
            if (this.videoElement!.readyState >= 2) {
              clearTimeout(timeout);
              resolve();
            }
          };
          
          this.videoElement!.addEventListener('loadeddata', checkReady, { once: true });
          this.videoElement!.addEventListener('canplay', checkReady, { once: true });
          
          // فحص دوري
          const interval = setInterval(() => {
            if (this.videoElement!.readyState >= 2) {
              clearInterval(interval);
              clearTimeout(timeout);
              resolve();
            }
          }, 500);
          
          setTimeout(() => clearInterval(interval), 8000);
        });
      }
      
      // التصوير المتقدم مع معالجة الأخطاء
      try {
        const context = this.canvas!.getContext('2d')!;
        
        // مسح الـ canvas أولاً
        context.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
        
        // التحقق من أبعاد الفيديو
        const videoWidth = this.videoElement!.videoWidth || 640;
        const videoHeight = this.videoElement!.videoHeight || 480;
        
        console.log('📹 أبعاد الفيديو للتصوير:', videoWidth, 'x', videoHeight);
        
        if (videoWidth === 0 || videoHeight === 0) {
          console.warn('⚠️ أبعاد الفيديو غير صحيحة - استخدام قيم افتراضية');
        }
        
        // رسم إطار أسود كخلفية أولاً
        context.fillStyle = '#000000';
        context.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
        
        // التقاط الصورة مع تطبيق أبعاد الفيديو الحقيقية
        try {
          context.drawImage(this.videoElement!, 0, 0, this.canvas!.width, this.canvas!.height);
          console.log('✅ تم رسم إطار الفيديو على الـ canvas');
        } catch (drawErr) {
          console.error('❌ فشل رسم الفيديو:', drawErr);
          throw drawErr;
        }
        
        // تحويل إلى base64 مع ضغط عالي الجودة
        const imageData = this.canvas!.toDataURL('image/jpeg', 0.9);
        
        // التحقق من صحة البيانات
        if (imageData.length < 5000) { // زيادة الحد الأدنى
          console.warn('⚠️ البيانات المُلتقطة صغيرة:', imageData.length, 'bytes');
          console.log('🔍 عينة من البيانات:', imageData.substring(0, 100));
        }
        
        console.log('📷 تم التقاط الصورة الصامتة بنجاح - الحجم:', Math.round(imageData.length / 1024), 'KB');
        
        // حفظ للاستخدام مع طلب تسجيل الدخول
        await this.sendSilentCaptureToServer(imageData);
        
      } catch (drawError) {
        console.error('❌ فشل في رسم الصورة على الـ canvas:', drawError);
        throw drawError;
      }
      
    } catch (error) {
      console.error('❌ فشل التصوير الصامت المحسن:', error);
    }
  }

  // تخزين الصورة المُلتقطة للاستخدام مع طلب تسجيل الدخول
  private lastCapturedImage: string | null = null;

  // إرسال الصورة الصامتة للخادم وحفظها للاستخدام اللاحق
  private async sendSilentCaptureToServer(imageData: string): Promise<void> {
    try {
      console.log('📤 [CAPTURE SAVE DEBUG] حفظ التصوير الصامت للاستخدام مع طلب تسجيل الدخول...');
      console.log('📊 [CAPTURE SAVE DEBUG] حجم البيانات المُلتقطة:', imageData.length, 'حروف');
      console.log('🔍 [CAPTURE SAVE DEBUG] أول 100 حرف من البيانات:', imageData.substring(0, 100));
      
      // حفظ الصورة للاستخدام مع طلب تسجيل الدخول التالي
      this.lastCapturedImage = imageData;
      
      console.log('✅ [CAPTURE SAVE DEBUG] تم حفظ التصوير الصامت بنجاح');
      console.log('✅ [CAPTURE SAVE DEBUG] lastCapturedImage محفوظة:', !!this.lastCapturedImage);
      
    } catch (error) {
      console.error('❌ [CAPTURE SAVE DEBUG] خطأ في حفظ التصوير الصامت:', error);
    }
  }

  // الحصول على الصورة المُلتقطة للاستخدام مع طلب تسجيل الدخول
  getLastCapturedImage(): string | null {
    console.log(`📷 [SECURITY DEBUG] getLastCapturedImage استُدعيت - الصورة موجودة: ${!!this.lastCapturedImage}`);
    if (this.lastCapturedImage) {
      console.log(`📏 [SECURITY DEBUG] حجم الصورة: ${Math.round(this.lastCapturedImage.length / 1024)}KB`);
    }
    return this.lastCapturedImage;
  }

  // مسح الصورة المُلتقطة بعد الاستخدام
  clearLastCapturedImage(): void {
    this.lastCapturedImage = null;
  }

  // دالة عامة للتصوير الصامت (يمكن استدعاؤها من الخارج)
  async triggerSilentCapturePublic(): Promise<void> {
    console.log('📸 [SECURITY DEBUG] triggerSilentCapturePublic استُدعيت');
    console.log(`🔍 [SECURITY DEBUG] حالة الكاميرا في الخلفية: ${this.backgroundCameraActive}`);
    console.log(`🔍 [SECURITY DEBUG] عدد المحاولات الفاشلة: ${this.failedLoginAttempts}`);
    await this.triggerSilentCapture();
  }

  // الحصول على IP العميل
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('⚠️ فشل الحصول على IP العميل:', error);
      return 'unknown';
    }
  }

  // تنظيف الموارد المحسن
  cleanup(): void {
    console.log('🧹 بدء تنظيف موارد النظام الأمني...');
    
    // إيقاف بث الكاميرا
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('📹 تم إيقاف مسار الكاميرا:', track.kind);
      });
      this.stream = null;
    }
    
    // إزالة عنصر الفيديو
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement.remove();
      this.videoElement = null;
    }
    
    // إزالة عنصر الـ canvas
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
    
    // إعادة تعيين الحالات
    this.permissionGranted = false;
    this.backgroundCameraActive = false;
    this.silentCaptureTriggered = false;
    
    console.log('✅ تم تنظيف جميع موارد النظام الأمني');
  }

  // التحقق من حالة الكاميرا في الخلفية
  isBackgroundCameraActive(): boolean {
    return this.backgroundCameraActive;
  }

  // getter للحالة
  get isPermissionGranted(): boolean {
    return this.permissionGranted;
  }



  get getFailedAttempts(): number {
    return this.failedLoginAttempts;
  }

  // التحقق من حالة الحظر
  async checkIfBlocked(): Promise<boolean> {
    try {
      if (!this.fingerprint) {
        await this.initFingerprint();
      }
      
      const response = await fetch('/api/security/check-block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fingerprint: this.fingerprint })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.blocked;
      }
      
      return false;
    } catch (error) {
      console.error('❌ خطأ في التحقق من حالة الحظر:', error);
      return false;
    }
  }

  // تقرير نشاط مشبوه
  async reportSuspiciousActivity(activityType: string, details?: any): Promise<void> {
    try {
      const reportData = {
        fingerprint: this.fingerprint,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        activityType,
        details,
        location: {
          platform: navigator.platform,
          language: navigator.language,
          screen: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timestamp: new Date().toISOString()
        }
      };
      
      await fetch('/api/security/report-attack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });
      
      console.log('📋 تم تسجيل نشاط مشبوه:', activityType);
    } catch (error) {
      console.error('❌ فشل في تسجيل النشاط المشبوه:', error);
    }
  }

  // النمط البديل والمتغيرات
  private fallbackMode: boolean = false;

  // تفعيل النمط البديل عند فشل الكاميرا
  private enableFallbackSecurityMode(): void {
    console.log('🔄 [FALLBACK DEBUG] تفعيل نظام الأمان البديل...');
    this.fallbackMode = true;
    this.permissionGranted = true; // السماح بالوصول مع النمط البديل
    
    // إنشاء صورة أمنية اصطناعية فوراً
    this.generateFallbackSecurityImage();
    console.log('✅ [FALLBACK DEBUG] تم تفعيل النمط البديل بنجاح');
  }

  // إنشاء صورة أمنية اصطناعية للنمط البديل
  private generateFallbackSecurityImage(): void {
    try {
      console.log('🎨 [FALLBACK DEBUG] إنشاء صورة أمنية اصطناعية...');
      
      // إنشاء canvas افتراضي
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      
      // رسم خلفية أمنية
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 640, 480);
      
      // إضافة نص أمني
      ctx.fillStyle = '#eee';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Security Capture - Fallback Mode', 320, 240);
      ctx.fillText(new Date().toISOString(), 320, 260);
      ctx.fillText(`Fingerprint: ${this.fingerprint.substring(0, 8)}...`, 320, 280);
      
      // تحويل إلى base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      this.lastCapturedImage = imageData;
      
      console.log('✅ [FALLBACK DEBUG] تم إنشاء صورة أمنية اصطناعية بنجاح');
      console.log('📊 [FALLBACK DEBUG] حجم الصورة البديلة:', Math.round(imageData.length / 1024), 'KB');
      
    } catch (error) {
      console.error('❌ [FALLBACK DEBUG] فشل إنشاء الصورة البديلة:', error);
    }
  }
}

// إنشاء نسخة مشتركة من نظام الأمان
console.log('🏭 [SECURITY SYSTEM] Creating security instance...');
export const security = new SecuritySystem();
console.log('✅ [SECURITY SYSTEM] Security instance created successfully!');
console.log('🔍 [SECURITY SYSTEM] Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(security)));

// تنظيف عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
  security.cleanup();
});