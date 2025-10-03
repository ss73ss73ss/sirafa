# دليل نشر منصة الصرافة على Hostinger
## Exchange Platform Deployment Guide

---

## 📁 الملفات المنشأة

### 1. **nginx/exchange-platform.conf**
ملف تكوين Nginx الرئيسي يحتوي على:
- ✅ Reverse proxy للمنفذ 5000
- ✅ دعم WebSocket للـ Socket.IO
- ✅ ضغط Gzip للأداء الأمثل
- ✅ Security headers للحماية
- ✅ تخزين مؤقت للملفات الثابتة
- ✅ إعدادات SSL (قسم اختياري)
- ✅ معالجة رفع ملفات حتى 100MB
- ✅ تعليقات تفصيلية بالعربية

### 2. **env.production.template**
نموذج ملف البيئة الإنتاجية يحتوي على:
- ✅ إعدادات قاعدة البيانات PostgreSQL
- ✅ مفاتيح الأمان (JWT, Session, Encryption)
- ✅ إعدادات الخادم (PORT=5000, HOST=0.0.0.0)
- ✅ إعدادات البريد الإلكتروني SMTP
- ✅ إعدادات التخزين والأداء
- ✅ تعليقات واضحة بالعربية

### 3. **nginx/nginx-setup.sh**
سكريبت تلقائي للإعداد يقوم بـ:
- ✅ تثبيت Nginx (إذا لم يكن مثبتاً)
- ✅ إنشاء مجلدات المشروع
- ✅ نسخ وتكوين ملف Nginx
- ✅ اختبار التكوين
- ✅ إعادة تشغيل Nginx
- ✅ خيار تثبيت شهادة SSL تلقائياً

---

## 🚀 خطوات النشر على Hostinger

### الخطوة 1: رفع الملفات
```bash
# رفع الملفات إلى خادم Hostinger عبر SSH أو FTP
scp -r * user@your-hostinger-server:/home/user/exchange-platform/
```

### الخطوة 2: الاتصال بالخادم
```bash
ssh user@your-hostinger-server
cd /home/user/exchange-platform
```

### الخطوة 3: إعداد ملف البيئة
```bash
# نسخ القالب وإنشاء ملف البيئة الفعلي
cp env.production.template .env.production

# تحرير الملف وإضافة البيانات الحقيقية
nano .env.production
```

**تحديث المتغيرات المطلوبة:**
- `DATABASE_URL`: بيانات PostgreSQL من Hostinger
- `JWT_SECRET`: توليد مفتاح آمن
- `yourdomain.com`: استبدلها بالدومين الخاص بك
- معلومات SMTP للبريد الإلكتروني

### الخطوة 4: تشغيل سكريبت الإعداد
```bash
# نقل إلى مجلد nginx
cd nginx

# جعل السكريبت قابل للتنفيذ (إذا لم يكن كذلك)
chmod +x nginx-setup.sh

# تشغيل السكريبت بصلاحيات root
sudo ./nginx-setup.sh
```

السكريبت سيطلب منك:
- إدخال اسم الدومين
- اختيار تثبيت SSL (موصى به)

### الخطوة 5: نقل ملفات التطبيق
```bash
# العودة للمجلد الرئيسي
cd /var/www/exchange-platform

# نقل ملفات المشروع (إذا لم تكن موجودة)
# أو استخدام git clone
git clone your-repository-url .

# تثبيت التبعيات
npm install --production

# بناء التطبيق
npm run build
```

### الخطوة 6: إعداد PM2 لإدارة التطبيق
```bash
# تثبيت PM2 عالمياً
npm install -g pm2

# تشغيل التطبيق
pm2 start npm --name "exchange-platform" -- start

# حفظ إعدادات PM2
pm2 save

# إعداد التشغيل التلقائي عند إعادة تشغيل الخادم
pm2 startup
```

---

## 🔧 إعدادات إضافية

### تكوين قاعدة البيانات في Hostinger

1. انتقل إلى لوحة تحكم Hostinger
2. اذهب إلى **Databases** → **PostgreSQL**
3. أنشئ قاعدة بيانات جديدة
4. احصل على:
   - Database name
   - Username
   - Password
   - Host
5. أضف هذه البيانات في `.env.production`

### إعداد البريد الإلكتروني

1. في لوحة تحكم Hostinger، اذهب إلى **Email**
2. أنشئ بريد إلكتروني: `noreply@yourdomain.com`
3. احصل على إعدادات SMTP:
   - SMTP Host: `smtp.hostinger.com`
   - SMTP Port: `587`
   - SMTP User: البريد الإلكتروني الكامل
   - SMTP Pass: كلمة مرور البريد

### تفعيل SSL المجاني

إذا لم تختر تثبيت SSL تلقائياً، يمكنك تثبيته لاحقاً:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔍 استكشاف الأخطاء

### فحص سجلات Nginx
```bash
# سجلات الأخطاء
sudo tail -f /var/log/nginx/exchange-platform-error.log

# سجلات الوصول
sudo tail -f /var/log/nginx/exchange-platform-access.log
```

### فحص تكوين Nginx
```bash
sudo nginx -t
```

### إعادة تشغيل الخدمات
```bash
# Nginx
sudo systemctl restart nginx

# التطبيق (PM2)
pm2 restart exchange-platform
```

### فحص حالة الخدمات
```bash
# Nginx
sudo systemctl status nginx

# التطبيق
pm2 status
pm2 logs exchange-platform
```

---

## ⚠️ ملاحظات أمنية مهمة

1. **لا تشارك ملف `.env.production`** مع أي شخص
2. **احتفظ بنسخ احتياطية** من الملفات الحساسة
3. **قم بتحديث كلمات المرور** الافتراضية فوراً
4. **فعّل جدار الحماية** على الخادم
5. **قم بإعداد النسخ الاحتياطي التلقائي** للقاعدة والملفات

---

## 📞 الدعم

في حالة واجهت أي مشاكل:
1. راجع سجلات الأخطاء
2. تحقق من إعدادات الخادم
3. تأكد من تحديث جميع المتغيرات في `.env.production`
4. تواصل مع دعم Hostinger للمساعدة في إعدادات الخادم

---

## ✅ قائمة التحقق النهائية

- [ ] رفع جميع الملفات للخادم
- [ ] تحديث ملف `.env.production` بالبيانات الحقيقية
- [ ] تشغيل سكريبت الإعداد `nginx-setup.sh`
- [ ] نقل ملفات التطبيق إلى `/var/www/exchange-platform`
- [ ] تثبيت التبعيات `npm install --production`
- [ ] بناء التطبيق `npm run build`
- [ ] تشغيل التطبيق بـ PM2
- [ ] تثبيت شهادة SSL
- [ ] اختبار الموقع على الدومين
- [ ] إعداد النسخ الاحتياطي

---

**تم الإعداد بنجاح! 🎉**