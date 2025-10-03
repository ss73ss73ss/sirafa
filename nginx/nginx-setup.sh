#!/bin/bash

# ===============================================
# سكريبت إعداد Nginx لمنصة الصرافة
# Exchange Platform Nginx Setup Script
# ===============================================

set -e

# الألوان للإخراج
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# الإعدادات
DOMAIN=""
APP_DIR="/var/www/exchange-platform"
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
CONFIG_NAME="exchange-platform"

# دالة لطباعة الرسائل الملونة
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# دالة للتحقق من الصلاحيات
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_message $RED "❌ يجب تشغيل هذا السكريبت بصلاحيات root"
        print_message $YELLOW "استخدم: sudo ./nginx-setup.sh"
        exit 1
    fi
}

# دالة للتحقق من تثبيت Nginx
check_nginx() {
    print_message $BLUE "🔍 التحقق من تثبيت Nginx..."
    
    if ! command -v nginx &> /dev/null; then
        print_message $YELLOW "📦 Nginx غير مثبت. سيتم التثبيت..."
        apt-get update
        apt-get install -y nginx
        print_message $GREEN "✅ تم تثبيت Nginx بنجاح"
    else
        print_message $GREEN "✅ Nginx مثبت بالفعل"
    fi
}

# دالة للحصول على معلومات الدومين
get_domain() {
    if [ -z "$DOMAIN" ]; then
        print_message $BLUE "🌐 أدخل اسم الدومين (مثال: yourdomain.com):"
        read -r DOMAIN
    fi
}

# دالة لإنشاء مجلدات المشروع
create_directories() {
    print_message $BLUE "📁 إنشاء مجلدات المشروع..."
    
    # إنشاء المجلدات الرئيسية
    mkdir -p "$APP_DIR"
    mkdir -p "$APP_DIR/client/dist"
    mkdir -p "$APP_DIR/public/uploads"
    mkdir -p "$APP_DIR/public/receipts"
    mkdir -p "$APP_DIR/logs"
    
    # تعيين الصلاحيات
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    print_message $GREEN "✅ تم إنشاء المجلدات بنجاح"
}

# دالة لنسخ وتكوين ملف Nginx
configure_nginx() {
    print_message $BLUE "⚙️  تكوين Nginx..."
    
    # نسخ ملف التكوين
    if [ -f "exchange-platform.conf" ]; then
        cp exchange-platform.conf "$NGINX_CONF_DIR/$CONFIG_NAME"
    else
        print_message $RED "❌ ملف exchange-platform.conf غير موجود!"
        exit 1
    fi
    
    # استبدال الدومين
    sed -i "s/yourdomain.com/$DOMAIN/g" "$NGINX_CONF_DIR/$CONFIG_NAME"
    
    # استبدال مسار التطبيق
    sed -i "s|/var/www/exchange-platform|$APP_DIR|g" "$NGINX_CONF_DIR/$CONFIG_NAME"
    
    # تفعيل الموقع
    ln -sf "$NGINX_CONF_DIR/$CONFIG_NAME" "$NGINX_ENABLED_DIR/$CONFIG_NAME"
    
    # تعطيل الموقع الافتراضي إن وجد
    if [ -L "$NGINX_ENABLED_DIR/default" ]; then
        rm "$NGINX_ENABLED_DIR/default"
    fi
    
    print_message $GREEN "✅ تم تكوين Nginx بنجاح"
}

# دالة لاختبار التكوين
test_nginx_config() {
    print_message $BLUE "🧪 اختبار تكوين Nginx..."
    
    if nginx -t; then
        print_message $GREEN "✅ التكوين صحيح"
        return 0
    else
        print_message $RED "❌ خطأ في التكوين!"
        return 1
    fi
}

# دالة لإعادة تشغيل Nginx
restart_nginx() {
    print_message $BLUE "🔄 إعادة تشغيل Nginx..."
    
    systemctl restart nginx
    systemctl enable nginx
    
    if systemctl is-active --quiet nginx; then
        print_message $GREEN "✅ Nginx يعمل بنجاح"
    else
        print_message $RED "❌ فشل تشغيل Nginx!"
        exit 1
    fi
}

# دالة لتثبيت شهادة SSL
install_ssl() {
    print_message $BLUE "🔒 هل تريد تثبيت شهادة SSL؟ (y/n)"
    read -r INSTALL_SSL
    
    if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
        print_message $BLUE "📥 تثبيت Certbot..."
        
        # تثبيت Certbot
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
        
        print_message $BLUE "🔐 الحصول على شهادة SSL..."
        
        # الحصول على الشهادة
        certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
            --non-interactive \
            --agree-tos \
            --email "admin@$DOMAIN" \
            --redirect
        
        # إعداد التجديد التلقائي
        print_message $BLUE "⏰ إعداد التجديد التلقائي..."
        
        # إضافة cron job للتجديد
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        
        print_message $GREEN "✅ تم تثبيت SSL بنجاح"
    fi
}

# دالة لإعداد جدار الحماية
setup_firewall() {
    print_message $BLUE "🛡️ إعداد جدار الحماية..."
    
    # التحقق من ufw
    if command -v ufw &> /dev/null; then
        # السماح بـ SSH
        ufw allow 22/tcp
        
        # السماح بـ HTTP و HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # السماح بـ Node.js port (إذا لزم)
        ufw allow 5000/tcp
        
        # تفعيل جدار الحماية
        ufw --force enable
        
        print_message $GREEN "✅ تم إعداد جدار الحماية"
    else
        print_message $YELLOW "⚠️ جدار الحماية غير مثبت"
    fi
}

# دالة لإنشاء ملف البيئة الإنتاجية
create_env_file() {
    print_message $BLUE "📝 إنشاء ملف البيئة الإنتاجية..."
    
    if [ -f "env.production.template" ]; then
        cp env.production.template "$APP_DIR/.env.production"
        
        # استبدال الدومين
        sed -i "s/yourdomain.com/$DOMAIN/g" "$APP_DIR/.env.production"
        
        # توليد مفاتيح عشوائية
        JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
        SESSION_SECRET=$(openssl rand -base64 32 | tr -d '\n')
        ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n')
        CSRF_SECRET=$(openssl rand -base64 32 | tr -d '\n')
        
        # استبدال المفاتيح
        sed -i "s/CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET_KEY_IN_PRODUCTION/$JWT_SECRET/g" "$APP_DIR/.env.production"
        sed -i "s/CHANGE_THIS_TO_A_STRONG_SESSION_SECRET_IN_PRODUCTION/$SESSION_SECRET/g" "$APP_DIR/.env.production"
        sed -i "s/CHANGE_THIS_TO_A_STRONG_ENCRYPTION_KEY/$ENCRYPTION_KEY/g" "$APP_DIR/.env.production"
        sed -i "s/CHANGE_THIS_TO_A_RANDOM_SECRET/$CSRF_SECRET/g" "$APP_DIR/.env.production"
        
        # تعيين الصلاحيات
        chmod 600 "$APP_DIR/.env.production"
        
        print_message $GREEN "✅ تم إنشاء ملف البيئة الإنتاجية"
        print_message $YELLOW "⚠️ لا تنس تحديث معلومات قاعدة البيانات والبريد الإلكتروني في $APP_DIR/.env.production"
    else
        print_message $YELLOW "⚠️ ملف env.production.template غير موجود"
    fi
}

# دالة لعرض معلومات الإعداد
show_info() {
    print_message $GREEN "\n========================================="
    print_message $GREEN "✅ تم إعداد Nginx بنجاح!"
    print_message $GREEN "========================================="
    print_message $BLUE "\n📋 معلومات الإعداد:"
    echo "• الدومين: $DOMAIN"
    echo "• مجلد التطبيق: $APP_DIR"
    echo "• ملف التكوين: $NGINX_CONF_DIR/$CONFIG_NAME"
    echo "• السجلات: /var/log/nginx/"
    
    print_message $YELLOW "\n⚙️  الخطوات التالية:"
    echo "1. انقل ملفات التطبيق إلى: $APP_DIR"
    echo "2. حدّث ملف البيئة: $APP_DIR/.env.production"
    echo "3. ثبّت dependencies: cd $APP_DIR && npm install --production"
    echo "4. ابني التطبيق: npm run build"
    echo "5. شغّل التطبيق: npm start"
    
    if [ "$INSTALL_SSL" != "y" ]; then
        print_message $YELLOW "\n🔒 لتثبيت SSL لاحقاً:"
        echo "sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    fi
    
    print_message $GREEN "\n🌐 يمكنك الآن الوصول للموقع عبر:"
    if [ "$INSTALL_SSL" = "y" ]; then
        echo "https://$DOMAIN"
    else
        echo "http://$DOMAIN"
    fi
}

# دالة للتنظيف في حالة الفشل
cleanup_on_error() {
    print_message $RED "\n❌ حدث خطأ أثناء الإعداد"
    print_message $YELLOW "🔄 جاري التنظيف..."
    
    # إزالة الملفات المنشأة
    if [ -L "$NGINX_ENABLED_DIR/$CONFIG_NAME" ]; then
        rm "$NGINX_ENABLED_DIR/$CONFIG_NAME"
    fi
    
    exit 1
}

# تعيين trap للتنظيف عند الخطأ
trap cleanup_on_error ERR

# ===============================================
# البرنامج الرئيسي / Main Program
# ===============================================

print_message $BLUE "========================================="
print_message $BLUE "🚀 سكريبت إعداد Nginx لمنصة الصرافة"
print_message $BLUE "========================================="

# التحقق من الصلاحيات
check_root

# الحصول على معلومات الدومين
get_domain

# التحقق من Nginx وتثبيته
check_nginx

# إنشاء المجلدات
create_directories

# تكوين Nginx
configure_nginx

# اختبار التكوين
if test_nginx_config; then
    # إعادة تشغيل Nginx
    restart_nginx
    
    # إعداد جدار الحماية
    setup_firewall
    
    # إنشاء ملف البيئة
    create_env_file
    
    # تثبيت SSL
    install_ssl
    
    # عرض المعلومات
    show_info
else
    print_message $RED "❌ فشل اختبار تكوين Nginx"
    exit 1
fi

print_message $GREEN "\n✨ انتهى الإعداد بنجاح!"