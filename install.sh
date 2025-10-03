#!/bin/bash

# ====================================== #
#     سكريبت التثبيت الاحترافي لمنصة الصرافة     #
#         Hostinger Production Deployment       #
# ====================================== #

set -e  # إيقاف السكريبت عند أي خطأ
set -o pipefail  # إيقاف السكريبت عند فشل أي أمر في pipeline

# ================ الإعدادات ================ #
SCRIPT_VERSION="2.0.0"
REQUIRED_NODE_VERSION=18
REQUIRED_NPM_VERSION=9
APP_NAME="exchange-platform"
LOG_FILE="install_$(date +%Y%m%d_%H%M%S).log"
PM2_CONFIG_FILE="ecosystem.config.js"

# ================ الألوان ================ #
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ================ الوظائف المساعدة ================ #

# وظيفة لطباعة الرسائل مع تسجيلها في ملف
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ [SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  [WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}❌ [ERROR]${NC} $message"
            ;;
        "STEP")
            echo -e "${CYAN}➤ [STEP]${NC} $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# وظيفة للتحقق من الأوامر المطلوبة
check_command() {
    local cmd=$1
    local name=$2
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n 1)
        log_message "SUCCESS" "$name موجود: $version"
        return 0
    else
        log_message "ERROR" "$name غير مثبت!"
        return 1
    fi
}

# وظيفة للتحقق من إصدار Node.js
check_node_version() {
    local current_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$current_version" -lt "$REQUIRED_NODE_VERSION" ]; then
        log_message "ERROR" "إصدار Node.js يجب أن يكون $REQUIRED_NODE_VERSION أو أحدث (الحالي: v$current_version)"
        return 1
    fi
    return 0
}

# وظيفة للتحقق من إصدار npm
check_npm_version() {
    local current_version=$(npm -v | cut -d'.' -f1)
    if [ "$current_version" -lt "$REQUIRED_NPM_VERSION" ]; then
        log_message "WARNING" "يُنصح بترقية npm إلى الإصدار $REQUIRED_NPM_VERSION أو أحدث (الحالي: v$current_version)"
    fi
    return 0
}

# وظيفة لإنشاء نسخة احتياطية
create_backup() {
    local backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
    
    log_message "INFO" "إنشاء نسخة احتياطية..."
    
    if [ -f ".env" ]; then
        mkdir -p "$backup_dir"
        cp .env "$backup_dir/.env.backup"
        log_message "SUCCESS" "تم حفظ نسخة احتياطية من .env"
    fi
    
    if [ -d "public/uploads" ]; then
        cp -r public/uploads "$backup_dir/uploads_backup" 2>/dev/null || true
        log_message "SUCCESS" "تم حفظ نسخة احتياطية من الملفات المرفوعة"
    fi
}

# وظيفة للتعامل مع الأخطاء
handle_error() {
    local line_number=$1
    log_message "ERROR" "حدث خطأ في السطر $line_number"
    log_message "INFO" "يرجى مراجعة ملف السجل: $LOG_FILE"
    
    # محاولة التنظيف عند الخطأ
    log_message "INFO" "محاولة التنظيف..."
    npm cache clean --force 2>/dev/null || true
    
    exit 1
}

# إعداد trap للأخطاء
trap 'handle_error $LINENO' ERR

# ================ البداية ================ #

clear
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║        🚀 سكريبت التثبيت الاحترافي لمنصة الصرافة 🚀           ║"
echo "║                                                              ║"
echo "║                    Hostinger Production                     ║"
echo "║                      Version $SCRIPT_VERSION                         ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📅 التاريخ: $(date '+%Y-%m-%d %H:%M:%S')"
echo "📝 سيتم حفظ السجل في: $LOG_FILE"
echo ""
echo "=========================================================="
echo ""

# ================ الخطوة 1: فحص النظام ================ #
log_message "STEP" "[1/12] فحص متطلبات النظام..."
echo ""

# التحقق من Node.js
if ! check_command "node" "Node.js"; then
    log_message "ERROR" "يجب تثبيت Node.js أولاً!"
    echo ""
    echo "📌 لتثبيت Node.js على Hostinger:"
    echo "   1. استخدم nvm لتثبيت Node.js 18+"
    echo "   2. أو قم بتحميله من https://nodejs.org"
    exit 1
fi

if ! check_node_version; then
    exit 1
fi

# التحقق من npm
if ! check_command "npm" "npm"; then
    log_message "ERROR" "npm غير مثبت!"
    exit 1
fi

check_npm_version

# التحقق من PostgreSQL (اختياري)
log_message "INFO" "التحقق من PostgreSQL..."
if check_command "psql" "PostgreSQL Client"; then
    POSTGRES_AVAILABLE=true
else
    POSTGRES_AVAILABLE=false
    log_message "WARNING" "PostgreSQL Client غير مثبت - لن يتم استيراد قاعدة البيانات مباشرة"
fi

# التحقق من Git (اختياري)
check_command "git" "Git" || log_message "WARNING" "Git غير متوفر"

echo ""

# ================ الخطوة 2: تنظيف npm cache ================ #
log_message "STEP" "[2/12] تنظيف npm cache بشكل كامل..."
echo ""

# تنظيف npm cache
log_message "INFO" "تنظيف npm cache..."
npm cache clean --force 2>&1 | tee -a "$LOG_FILE"
if [ $? -eq 0 ]; then
    log_message "SUCCESS" "تم تنظيف npm cache بنجاح"
else
    log_message "WARNING" "فشل تنظيف cache ولكن سنستمر..."
fi

# حذف node_modules القديمة إن وجدت
if [ -d "node_modules" ]; then
    log_message "INFO" "حذف node_modules القديمة..."
    rm -rf node_modules
    log_message "SUCCESS" "تم حذف node_modules القديمة"
fi

# حذف package-lock.json القديم إذا كنا سنستخدم npm ci
if [ -f "package-lock.json" ]; then
    log_message "INFO" "تم العثور على package-lock.json"
else
    log_message "WARNING" "package-lock.json غير موجود - سيتم إنشاؤه"
fi

echo ""

# ================ الخطوة 3: إنشاء النسخة الاحتياطية ================ #
log_message "STEP" "[3/12] إنشاء نسخة احتياطية..."
echo ""
create_backup
echo ""

# ================ الخطوة 4: إعداد ملف البيئة ================ #
log_message "STEP" "[4/12] إعداد ملف البيئة (.env)..."
echo ""

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_message "SUCCESS" "تم إنشاء ملف .env من .env.example"
        log_message "WARNING" "يرجى تحديث القيم في ملف .env!"
    else
        log_message "ERROR" "ملف .env.example غير موجود!"
        log_message "INFO" "يرجى إنشاء ملف .env يدوياً"
        exit 1
    fi
else
    log_message "SUCCESS" "ملف .env موجود"
fi

# التحقق من المتغيرات المطلوبة
log_message "INFO" "التحقق من المتغيرات البيئية المطلوبة..."
source .env 2>/dev/null || true

MISSING_VARS=()

if [ -z "$DATABASE_URL" ]; then
    MISSING_VARS+=("DATABASE_URL")
fi

if [ -z "$JWT_SECRET" ]; then
    log_message "INFO" "توليد JWT_SECRET جديد..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    echo "JWT_SECRET=$JWT_SECRET" >> .env
    log_message "SUCCESS" "تم توليد وحفظ JWT_SECRET"
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    log_message "ERROR" "المتغيرات التالية مفقودة في .env:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

log_message "SUCCESS" "جميع المتغيرات البيئية المطلوبة موجودة"
echo ""

# ================ الخطوة 5: تثبيت التبعيات ================ #
log_message "STEP" "[5/12] تثبيت تبعيات المشروع..."
echo ""

# تحديد أمر التثبيت المناسب
if [ -f "package-lock.json" ]; then
    log_message "INFO" "استخدام npm ci للتثبيت النظيف والسريع..."
    npm ci --prefer-offline --no-audit --progress=true 2>&1 | tee -a "$LOG_FILE"
    INSTALL_RESULT=$?
else
    log_message "INFO" "إنشاء package-lock.json وتثبيت التبعيات..."
    npm install --package-lock-only 2>&1 | tee -a "$LOG_FILE"
    npm ci --prefer-offline --no-audit --progress=true 2>&1 | tee -a "$LOG_FILE"
    INSTALL_RESULT=$?
fi

if [ $INSTALL_RESULT -eq 0 ]; then
    log_message "SUCCESS" "تم تثبيت جميع التبعيات بنجاح"
else
    log_message "ERROR" "فشل تثبيت التبعيات!"
    log_message "INFO" "محاولة التثبيت مرة أخرى مع تنظيف أعمق..."
    
    # تنظيف أعمق
    rm -rf node_modules package-lock.json
    npm cache clean --force
    npm install 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -ne 0 ]; then
        log_message "ERROR" "فشل التثبيت نهائياً!"
        exit 1
    fi
    
    log_message "SUCCESS" "تم التثبيت في المحاولة الثانية"
fi

echo ""

# ================ الخطوة 6: التحقق من قاعدة البيانات ================ #
log_message "STEP" "[6/12] إعداد قاعدة البيانات..."
echo ""

# استيراد قاعدة البيانات إن أمكن
if [ -f "database/full_dump.sql" ]; then
    log_message "INFO" "تم العثور على ملف قاعدة البيانات"
    
    if [ "$POSTGRES_AVAILABLE" = true ]; then
        log_message "INFO" "محاولة استيراد قاعدة البيانات..."
        
        # محاولة الاستيراد
        psql "$DATABASE_URL" < database/full_dump.sql 2>>"$LOG_FILE"
        
        if [ $? -eq 0 ]; then
            log_message "SUCCESS" "تم استيراد قاعدة البيانات بنجاح"
        else
            log_message "WARNING" "فشل الاستيراد - سيتم استخدام db:push"
            npm run db:push -- --force 2>&1 | tee -a "$LOG_FILE"
        fi
    else
        log_message "INFO" "استخدام Drizzle لإعداد Schema..."
        npm run db:push -- --force 2>&1 | tee -a "$LOG_FILE"
        
        if [ $? -eq 0 ]; then
            log_message "SUCCESS" "تم إعداد Schema بنجاح"
        else
            log_message "WARNING" "قد تحتاج لإعداد قاعدة البيانات يدوياً"
        fi
    fi
else
    log_message "INFO" "إنشاء Schema باستخدام Drizzle..."
    npm run db:push -- --force 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_message "SUCCESS" "تم إنشاء Schema"
    else
        log_message "WARNING" "فشل إنشاء Schema - تحقق من DATABASE_URL"
    fi
fi

echo ""

# ================ الخطوة 7: بناء المشروع للإنتاج ================ #
log_message "STEP" "[7/12] بناء المشروع للإنتاج..."
echo ""

log_message "INFO" "بناء Frontend و Backend..."
npm run build 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    log_message "SUCCESS" "تم بناء المشروع بنجاح"
    
    # التحقق من وجود ملفات البناء
    if [ -d "dist" ]; then
        log_message "SUCCESS" "مجلد dist موجود وجاهز"
    fi
else
    log_message "ERROR" "فشل بناء المشروع!"
    exit 1
fi

echo ""

# ================ الخطوة 8: تثبيت PM2 ================ #
log_message "STEP" "[8/12] إعداد PM2 لإدارة العمليات..."
echo ""

# التحقق من PM2
if ! command -v pm2 &> /dev/null; then
    log_message "INFO" "تثبيت PM2 globally..."
    npm install -g pm2 2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_message "SUCCESS" "تم تثبيت PM2 بنجاح"
    else
        log_message "WARNING" "فشل تثبيت PM2 globally - محاولة التثبيت محلياً..."
        npm install pm2 --save 2>&1 | tee -a "$LOG_FILE"
        
        # إضافة alias للـ PM2 المحلي
        alias pm2='npx pm2'
    fi
else
    log_message "SUCCESS" "PM2 مثبت مسبقاً: $(pm2 --version)"
fi

echo ""

# ================ الخطوة 9: إنشاء ملف PM2 ecosystem ================ #
log_message "STEP" "[9/12] إنشاء ملف تكوين PM2..."
echo ""

cat > "$PM2_CONFIG_FILE" << 'EOF'
module.exports = {
  apps: [{
    name: 'exchange-platform',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5000
    },
    
    // استراتيجية إعادة التشغيل
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // مراقبة الصحة
    kill_timeout: 5000,
    listen_timeout: 10000,
    
    // إشارات الإيقاف الآمن
    shutdown_with_message: false,
    wait_ready: true,
    
    // تحسينات الأداء
    node_args: '--max-old-space-size=2048',
    
    // معلومات إضافية
    post_update: ['npm install', 'npm run build'],
    
    // تحديد المسار
    cwd: process.cwd()
  }]
};
EOF

log_message "SUCCESS" "تم إنشاء ملف ecosystem.config.js"

# إنشاء مجلد السجلات
mkdir -p logs
log_message "SUCCESS" "تم إنشاء مجلد السجلات"

echo ""

# ================ الخطوة 10: إعداد التشغيل التلقائي ================ #
log_message "STEP" "[10/12] إعداد التشغيل التلقائي عند إعادة التشغيل..."
echo ""

if command -v pm2 &> /dev/null; then
    log_message "INFO" "إعداد PM2 للتشغيل التلقائي..."
    
    # حفظ قائمة العمليات
    pm2 save 2>&1 | tee -a "$LOG_FILE"
    
    # إعداد startup script
    pm2 startup 2>&1 | tee -a "$LOG_FILE"
    
    log_message "SUCCESS" "تم إعداد التشغيل التلقائي"
    log_message "INFO" "قد تحتاج لتنفيذ الأمر المعروض أعلاه بصلاحيات sudo"
else
    log_message "WARNING" "PM2 غير متوفر - تخطي إعداد التشغيل التلقائي"
fi

echo ""

# ================ الخطوة 11: فحوصات الأمان ================ #
log_message "STEP" "[11/12] فحوصات الأمان والأداء..."
echo ""

# التحقق من الصلاحيات
log_message "INFO" "فحص صلاحيات الملفات..."

# تأمين ملف .env
if [ -f ".env" ]; then
    chmod 600 .env
    log_message "SUCCESS" "تم تأمين ملف .env"
fi

# تأمين مجلد uploads
if [ -d "public/uploads" ]; then
    chmod 755 public/uploads
    log_message "SUCCESS" "تم تعيين صلاحيات مجلد uploads"
fi

# فحص الثغرات الأمنية (اختياري)
log_message "INFO" "فحص الثغرات الأمنية في التبعيات..."
npm audit --audit-level=high 2>&1 | tee -a "$LOG_FILE" || true

echo ""

# ================ الخطوة 12: التحقق النهائي ================ #
log_message "STEP" "[12/12] التحقق النهائي..."
echo ""

# قائمة الفحوصات النهائية
CHECKS_PASSED=0
CHECKS_TOTAL=6

# فحص وجود dist
if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    log_message "SUCCESS" "✓ ملفات الإنتاج جاهزة"
    ((CHECKS_PASSED++))
else
    log_message "ERROR" "✗ ملفات الإنتاج غير موجودة"
fi

# فحص .env
if [ -f ".env" ]; then
    log_message "SUCCESS" "✓ ملف البيئة موجود"
    ((CHECKS_PASSED++))
else
    log_message "ERROR" "✗ ملف البيئة مفقود"
fi

# فحص node_modules
if [ -d "node_modules" ]; then
    log_message "SUCCESS" "✓ التبعيات مثبتة"
    ((CHECKS_PASSED++))
else
    log_message "ERROR" "✗ التبعيات غير مثبتة"
fi

# فحص PM2
if command -v pm2 &> /dev/null || [ -f "node_modules/.bin/pm2" ]; then
    log_message "SUCCESS" "✓ PM2 جاهز"
    ((CHECKS_PASSED++))
else
    log_message "WARNING" "⚠ PM2 غير مثبت"
fi

# فحص ecosystem config
if [ -f "$PM2_CONFIG_FILE" ]; then
    log_message "SUCCESS" "✓ ملف تكوين PM2 موجود"
    ((CHECKS_PASSED++))
else
    log_message "ERROR" "✗ ملف تكوين PM2 مفقود"
fi

# فحص مجلد السجلات
if [ -d "logs" ]; then
    log_message "SUCCESS" "✓ مجلد السجلات جاهز"
    ((CHECKS_PASSED++))
else
    log_message "WARNING" "⚠ مجلد السجلات غير موجود"
fi

echo ""
echo "=========================================================="
echo ""

# ================ النتيجة النهائية ================ #
if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    echo -e "${GREEN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║              🎉 تم التثبيت بنجاح كامل! 🎉                    ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
else
    echo -e "${YELLOW}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║            ⚠️  التثبيت اكتمل مع بعض التحذيرات ⚠️              ║"
    echo "║                                                              ║"
    echo "║         نجحت $CHECKS_PASSED من $CHECKS_TOTAL فحوصات                              ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
fi

echo ""
echo -e "${CYAN}${BOLD}📋 خطوات التشغيل:${NC}"
echo ""
echo "1️⃣  تشغيل بـ PM2 (موصى به للإنتاج):"
echo "    ${BOLD}pm2 start ecosystem.config.js${NC}"
echo ""
echo "2️⃣  تشغيل مباشر (للاختبار):"
echo "    ${BOLD}npm start${NC}"
echo ""
echo "3️⃣  عرض السجلات:"
echo "    ${BOLD}pm2 logs exchange-platform${NC}"
echo ""
echo "4️⃣  مراقبة الأداء:"
echo "    ${BOLD}pm2 monit${NC}"
echo ""
echo "5️⃣  إيقاف التطبيق:"
echo "    ${BOLD}pm2 stop exchange-platform${NC}"
echo ""

echo -e "${YELLOW}${BOLD}⚙️  إعدادات مهمة:${NC}"
echo ""
echo "• المنفذ: ${BOLD}$(grep -E "^PORT=" .env | cut -d'=' -f2 || echo "5000")${NC}"
echo "• البيئة: ${BOLD}production${NC}"
echo "• السجلات: ${BOLD}./logs/${NC}"
echo "• ملف السجل التفصيلي: ${BOLD}$LOG_FILE${NC}"
echo ""

if [ "$POSTGRES_AVAILABLE" = false ]; then
    echo -e "${YELLOW}تنبيه:${NC} PostgreSQL Client غير مثبت"
    echo "       قد تحتاج لاستيراد قاعدة البيانات يدوياً"
    echo ""
fi

echo -e "${GREEN}${BOLD}🚀 منصة الصرافة جاهزة للعمل على Hostinger!${NC}"
echo ""
echo "=========================================================="
echo ""
echo -e "${CYAN}للدعم الفني أو الاستفسارات، يرجى مراجعة الوثائق أو التواصل مع فريق الدعم${NC}"
echo ""

# حفظ معلومات التثبيت
cat > "install_info.json" << EOF
{
  "install_date": "$(date -Iseconds)",
  "node_version": "$(node -v)",
  "npm_version": "$(npm -v)",
  "script_version": "$SCRIPT_VERSION",
  "checks_passed": $CHECKS_PASSED,
  "checks_total": $CHECKS_TOTAL,
  "postgres_available": $POSTGRES_AVAILABLE,
  "pm2_installed": $(command -v pm2 &> /dev/null && echo "true" || echo "false"),
  "log_file": "$LOG_FILE"
}
EOF

log_message "INFO" "معلومات التثبيت محفوظة في install_info.json"

# النهاية
exit 0