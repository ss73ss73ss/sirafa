# 📋 دليل النشر الشامل لمنصة الصرافة على Hostinger

## 📌 نظرة عامة
هذا الدليل يوضح كيفية نشر منصة الصرافة على خادم Hostinger بشكل احترافي وآمن.

## 🗂️ الملفات المتوفرة

### 1. **install.sh** - السكريبت الرئيسي للتثبيت
السكريبت الشامل لتثبيت وإعداد المنصة بالكامل.

#### الميزات:
- ✅ تنظيف npm cache بشكل كامل
- ✅ استخدام npm ci للتثبيت النظيف
- ✅ التحقق من جميع المتطلبات
- ✅ إعداد PM2 تلقائياً
- ✅ استيراد قاعدة البيانات
- ✅ معالجة شاملة للأخطاء
- ✅ رسائل واضحة بالعربية
- ✅ حفظ السجلات التفصيلية

### 2. **pre-install.sh** - فحص البيئة قبل التثبيت
يفحص جميع المتطلبات قبل البدء في التثبيت.

#### الفحوصات:
- نظام التشغيل
- Node.js (الإصدار 18+)
- npm (الإصدار 9+)
- PostgreSQL (اختياري)
- Git (اختياري)
- PM2
- المساحة المتاحة (5GB+)
- الذاكرة المتاحة (2GB+)
- المنافذ المتاحة
- الاتصال بالإنترنت

### 3. **cleanup.sh** - تنظيف البيئة
ينظف البيئة من الملفات المؤقتة والقديمة.

#### يقوم بحذف:
- node_modules
- package-lock.json
- dist (ملفات البناء)
- npm cache
- PM2 logs
- الملفات المؤقتة

### 4. **ecosystem.config.js** - إعدادات PM2
ملف تكوين PM2 المتقدم للإنتاج.

#### الميزات:
- Cluster mode للاستفادة من جميع النوى
- إعادة التشغيل التلقائي
- مراقبة استهلاك الذاكرة
- السجلات المنظمة
- الإيقاف الآمن
- تحسينات الأداء

### 5. **health-check.js** - فحص صحة التطبيق
سكريبت Node.js لفحص صحة التطبيق والنظام.

#### يفحص:
- HTTP endpoints
- عملية PM2
- قاعدة البيانات
- موارد النظام (CPU, RAM, Disk)

---

## 🚀 خطوات النشر

### الخطوة 1: التحضير

```bash
# 1. الاتصال بخادم Hostinger عبر SSH
ssh username@your-server.hostinger.com

# 2. الانتقال إلى مجلد المشروع
cd /home/username/exchange-platform

# 3. رفع ملفات المشروع (إذا لم تكن موجودة)
git clone https://github.com/your-username/exchange-platform.git .
# أو استخدم FTP/SFTP لرفع الملفات
```

### الخطوة 2: إعطاء الصلاحيات للسكريبتات

```bash
# إعطاء صلاحيات التنفيذ لجميع السكريبتات
chmod +x install.sh
chmod +x pre-install.sh
chmod +x cleanup.sh
chmod +x health-check.js
```

### الخطوة 3: فحص البيئة

```bash
# فحص البيئة قبل التثبيت
./pre-install.sh
```

إذا ظهرت أي مشاكل، قم بحلها قبل المتابعة.

### الخطوة 4: إعداد ملف البيئة

```bash
# نسخ ملف البيئة
cp .env.example .env

# تعديل ملف البيئة
nano .env
```

#### المتغيرات المطلوبة:
```env
# قاعدة البيانات
DATABASE_URL=postgresql://user:password@host:5432/database

# الأمان
JWT_SECRET=your-secret-key-here

# الخادم
PORT=5000
HOST=0.0.0.0
NODE_ENV=production

# العميل
CLIENT_ORIGIN=https://your-domain.com
VITE_API_URL=https://your-domain.com/api

# PM2 (اختياري)
PM2_INSTANCES=max
PM2_MAX_MEMORY=2G
```

### الخطوة 5: التثبيت

```bash
# تشغيل التثبيت الكامل
./install.sh
```

السكريبت سيقوم بـ:
1. التحقق من جميع المتطلبات
2. تنظيف npm cache
3. تثبيت التبعيات باستخدام npm ci
4. إنشاء ملف .env إذا لم يكن موجوداً
5. استيراد قاعدة البيانات
6. بناء المشروع للإنتاج
7. تثبيت وإعداد PM2
8. إنشاء ملفات التكوين

### الخطوة 6: تشغيل التطبيق

```bash
# تشغيل التطبيق باستخدام PM2
pm2 start ecosystem.config.js

# أو للتشغيل في وضع الإنتاج
pm2 start ecosystem.config.js --env production

# حفظ قائمة العمليات
pm2 save

# إعداد التشغيل التلقائي عند إعادة تشغيل الخادم
pm2 startup
# اتبع التعليمات المعروضة
```

### الخطوة 7: التحقق من التشغيل

```bash
# عرض حالة العمليات
pm2 status

# عرض السجلات
pm2 logs exchange-platform

# مراقبة الأداء
pm2 monit

# فحص صحة التطبيق
node health-check.js
```

---

## 🔧 إدارة التطبيق

### أوامر PM2 الأساسية

```bash
# إعادة تشغيل التطبيق
pm2 restart exchange-platform

# إيقاف التطبيق
pm2 stop exchange-platform

# حذف التطبيق من PM2
pm2 delete exchange-platform

# إعادة تحميل بدون توقف (Zero-downtime)
pm2 reload exchange-platform

# عرض معلومات تفصيلية
pm2 describe exchange-platform

# عرض السجلات المباشرة
pm2 logs exchange-platform --lines 100
```

### التحديثات

```bash
# 1. سحب التحديثات من Git
git pull origin main

# 2. تثبيت التبعيات الجديدة
npm ci --production

# 3. بناء المشروع
npm run build

# 4. تحديث قاعدة البيانات
npm run db:push

# 5. إعادة تشغيل PM2
pm2 reload ecosystem.config.js
```

### النسخ الاحتياطي

```bash
# نسخ احتياطي لقاعدة البيانات
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# نسخ احتياطي للملفات المرفوعة
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads

# نسخ احتياطي لملف البيئة
cp .env .env.backup_$(date +%Y%m%d)
```

---

## 🔍 حل المشاكل الشائعة

### 1. مشكلة "npm ERR! EEXIST"
```bash
# الحل: تنظيف npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 2. مشكلة "EADDRINUSE: Port already in use"
```bash
# الحل: تغيير المنفذ في .env
PORT=5001  # أو أي منفذ آخر متاح
```

### 3. مشكلة الذاكرة "JavaScript heap out of memory"
```bash
# الحل: زيادة حجم الذاكرة
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 4. مشكلة قاعدة البيانات
```bash
# التحقق من الاتصال
psql $DATABASE_URL -c "SELECT 1"

# إعادة إنشاء Schema
npm run db:push -- --force
```

### 5. مشكلة PM2 لا يعمل
```bash
# إعادة تثبيت PM2
npm uninstall -g pm2
npm install -g pm2@latest

# أو استخدام PM2 المحلي
npx pm2 start ecosystem.config.js
```

---

## 📊 المراقبة والسجلات

### مواقع السجلات
- **PM2 Logs**: `./logs/pm2-*.log`
- **Install Logs**: `./install_*.log`
- **Health Check**: `./logs/health-check-*.json`

### أوامر المراقبة
```bash
# مراقبة استخدام الموارد
pm2 monit

# عرض معلومات النظام
pm2 info exchange-platform

# فحص صحة التطبيق
node health-check.js

# مراقبة السجلات المباشرة
tail -f logs/pm2-out.log
```

---

## 🔐 الأمان

### نصائح مهمة:
1. **تأمين ملف .env**
   ```bash
   chmod 600 .env
   ```

2. **تحديث التبعيات بانتظام**
   ```bash
   npm audit
   npm audit fix
   ```

3. **استخدام HTTPS**
   - قم بإعداد SSL certificate
   - استخدم Cloudflare أو Let's Encrypt

4. **تقييد الوصول SSH**
   - استخدم SSH keys بدلاً من كلمات المرور
   - قم بتغيير المنفذ الافتراضي لـ SSH

5. **النسخ الاحتياطي المنتظم**
   - قم بعمل نسخ احتياطية يومية
   - احتفظ بالنسخ في مكان آمن خارج الخادم

---

## 📞 الدعم

في حالة وجود أي مشاكل:
1. راجع ملفات السجلات في `./logs/`
2. تأكد من اتباع جميع الخطوات بالترتيب
3. تحقق من متطلبات النظام باستخدام `./pre-install.sh`
4. استخدم `./cleanup.sh` لتنظيف البيئة وإعادة المحاولة

---

## ✅ قائمة التحقق النهائية

- [ ] Node.js 18+ مثبت
- [ ] npm 9+ مثبت
- [ ] PostgreSQL متاح (أو DATABASE_URL صحيح)
- [ ] ملف .env محدّث بالقيم الصحيحة
- [ ] المنفذ 5000 متاح (أو المنفذ المحدد)
- [ ] مساحة كافية على القرص (5GB+)
- [ ] ذاكرة كافية (2GB+)
- [ ] PM2 مثبت ويعمل
- [ ] التطبيق يعمل بدون أخطاء
- [ ] النسخ الاحتياطي مُعد

---

**آخر تحديث:** $(date)
**الإصدار:** 2.0.0