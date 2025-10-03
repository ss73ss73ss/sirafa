# 🚀 دليل النشر السريع لمنصة الصرافة على Hostinger

<div dir="rtl">

## 📋 معلومات الإصدار
- **رقم الإصدار:** v2.0.0
- **تاريخ التحديث:** 2025-01-02
- **الحزمة:** HOSTINGER_DEPLOYMENT_COMPLETE.tar.gz

---

## ⚡ خطوات النشر السريعة (7 خطوات فقط)

### الخطوة 1️⃣: رفع الحزمة إلى الخادم
```bash
# رفع الحزمة عبر File Manager أو استخدم:
scp HOSTINGER_DEPLOYMENT_COMPLETE.tar.gz user@your-server:/home/user/
```

### الخطوة 2️⃣: فك ضغط الحزمة
```bash
cd /home/user
tar -xzf HOSTINGER_DEPLOYMENT_COMPLETE.tar.gz
cd exchange-platform
```

### الخطوة 3️⃣: تشغيل سكريبت ما قبل التثبيت
```bash
chmod +x pre-install.sh
./pre-install.sh
```

### الخطوة 4️⃣: إعداد ملف البيئة
```bash
cp env.production.template .env
nano .env
# قم بتحديث:
# - DATABASE_URL (من Hostinger Database)
# - JWT_SECRET (اتركه فارغاً لتوليد تلقائي)
# - CLIENT_ORIGIN (دومينك)
```

### الخطوة 5️⃣: تشغيل سكريبت التثبيت الرئيسي
```bash
chmod +x install.sh
./install.sh
```

### الخطوة 6️⃣: إعداد Nginx
```bash
cd nginx
chmod +x nginx-setup.sh
sudo ./nginx-setup.sh
```

### الخطوة 7️⃣: بدء التطبيق
```bash
npm run start:production
# أو باستخدام PM2:
pm2 start ecosystem.config.js --env production
```

---

## ✅ قائمة التحقق النهائية

### قبل النشر:
- [ ] نسخة احتياطية من الموقع الحالي (إن وجد)
- [ ] معلومات قاعدة البيانات من Hostinger
- [ ] دومين مُعد ومُشار إلى الخادم
- [ ] SSH Access مُفعل

### بعد النشر:
- [ ] الموقع يعمل على الدومين
- [ ] قاعدة البيانات متصلة
- [ ] SSL شهادة مُفعلة
- [ ] WebSocket يعمل بشكل صحيح
- [ ] رفع الملفات يعمل
- [ ] البريد الإلكتروني يعمل

---

## 📁 الملفات المساعدة

| الملف | الوصف | المسار |
|-------|-------|---------|
| دليل التثبيت الكامل | شرح مفصل خطوة بخطوة | `DEPLOYMENT_GUIDE.md` |
| إعدادات Nginx | تكوين الخادم | `nginx/README-DEPLOYMENT.md` |
| سكريبت التثبيت | أتمتة العملية | `install.sh` |
| فحص الصحة | التحقق من التشغيل | `health-check.js` |
| التنظيف | حذف الملفات الزائدة | `cleanup.sh` |

---

## 🔧 حل المشاكل الشائعة

### ❌ خطأ: npm install فشل
```bash
# حل:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ خطأ: قاعدة البيانات لا تتصل
```bash
# تحقق من:
1. DATABASE_URL صحيح في .env
2. قاعدة البيانات مُفعلة في Hostinger
3. IP الخادم مسموح في Firewall
```

### ❌ خطأ: Permission denied
```bash
# حل:
chmod +x *.sh
sudo chown -R $USER:$USER .
```

### ❌ خطأ: Port already in use
```bash
# حل:
lsof -i :5000
kill -9 [PID]
# أو غيّر PORT في .env
```

### ❌ خطأ: Nginx 502 Bad Gateway
```bash
# حل:
sudo systemctl restart nginx
pm2 restart all
pm2 logs # لمراجعة السجلات
```

---

## 📞 معلومات الدعم الفني

### للمساعدة الفورية:
- **البريد الإلكتروني:** support@exchange-platform.com
- **واتساب:** +966 XX XXX XXXX
- **التوثيق الكامل:** [docs.exchange-platform.com](https://docs.exchange-platform.com)

### أوقات الدعم:
- الأحد - الخميس: 9 صباحاً - 6 مساءً
- الجمعة - السبت: 10 صباحاً - 2 ظهراً
- **دعم طوارئ 24/7:** emergency@exchange-platform.com

---

## 🎯 أوامر سريعة للنسخ

### تثبيت كامل (نسخة واحدة):
```bash
tar -xzf HOSTINGER_DEPLOYMENT_COMPLETE.tar.gz && \
cd exchange-platform && \
chmod +x pre-install.sh install.sh && \
./pre-install.sh && \
cp env.production.template .env && \
echo "⚠️ قم بتحديث .env الآن!" && \
read -p "اضغط Enter بعد تحديث .env..." && \
./install.sh && \
cd nginx && chmod +x nginx-setup.sh && \
sudo ./nginx-setup.sh && \
cd .. && \
pm2 start ecosystem.config.js --env production
```

### إعادة تشغيل سريعة:
```bash
pm2 restart all && pm2 logs
```

### فحص الحالة:
```bash
pm2 status && curl http://localhost:5000/health
```

### عرض السجلات:
```bash
pm2 logs --lines 50
```

---

## 🔄 التحديثات المستقبلية

لتحديث المنصة مستقبلاً:
1. احفظ نسخة احتياطية: `./backup.sh`
2. حدّث الكود: `git pull origin main`
3. ثبّت التبعيات: `npm ci --production`
4. ابني المشروع: `npm run build`
5. أعد تشغيل: `pm2 reload all`

---

## ⚠️ ملاحظات هامة

1. **الأمان:** غيّر جميع كلمات المرور الافتراضية فوراً
2. **SSL:** فعّل شهادة SSL عبر Hostinger أو Let's Encrypt
3. **النسخ الاحتياطي:** فعّل النسخ الاحتياطي اليومي
4. **المراقبة:** استخدم `pm2 monit` للمراقبة المباشرة
5. **الصيانة:** راجع السجلات أسبوعياً

---

## 📊 مؤشرات النجاح

بعد إتمام التثبيت، يجب أن ترى:
- ✅ الصفحة الرئيسية تعمل
- ✅ تسجيل الدخول يعمل
- ✅ لوحة التحكم تظهر البيانات
- ✅ WebSocket متصل (رسائل فورية)
- ✅ رفع الصور يعمل

---

## 🏆 تهانينا!
منصة الصرافة جاهزة الآن للعمل! 🎉

للمساعدة أو الاستفسارات، لا تتردد في التواصل معنا.

</div>

---

<div align="center">

**منصة الصرافة © 2025 - جميع الحقوق محفوظة**

</div>