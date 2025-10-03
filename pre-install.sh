#!/bin/bash

# ====================================== #
#     سكريبت فحص البيئة قبل التثبيت        #
#       Pre-Installation Check Script      #
# ====================================== #

set -e

# ================ الألوان ================ #
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================ المتغيرات ================ #
ISSUES_FOUND=0
WARNINGS_FOUND=0
MIN_NODE_VERSION=18
MIN_NPM_VERSION=9
MIN_DISK_SPACE_GB=5
MIN_RAM_MB=2048

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🔍 فحص البيئة قبل تثبيت منصة الصرافة 🔍              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ================ الفحوصات ================ #

echo "1. فحص نظام التشغيل..."
OS_TYPE=$(uname -s)
OS_VERSION=$(uname -r)
echo -e "   نظام التشغيل: ${BLUE}$OS_TYPE $OS_VERSION${NC}"

if [[ "$OS_TYPE" == "Linux" ]]; then
    echo -e "   ${GREEN}✓ نظام تشغيل متوافق${NC}"
else
    echo -e "   ${YELLOW}⚠ قد تواجه مشاكل على هذا النظام${NC}"
    ((WARNINGS_FOUND++))
fi

echo ""
echo "2. فحص Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    echo -e "   إصدار Node.js: ${BLUE}v$NODE_VERSION${NC}"
    
    if [ "$NODE_MAJOR" -ge "$MIN_NODE_VERSION" ]; then
        echo -e "   ${GREEN}✓ Node.js متوافق${NC}"
    else
        echo -e "   ${RED}✗ يجب ترقية Node.js إلى v$MIN_NODE_VERSION أو أحدث${NC}"
        ((ISSUES_FOUND++))
    fi
else
    echo -e "   ${RED}✗ Node.js غير مثبت${NC}"
    ((ISSUES_FOUND++))
fi

echo ""
echo "3. فحص npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    NPM_MAJOR=$(echo $NPM_VERSION | cut -d'.' -f1)
    
    echo -e "   إصدار npm: ${BLUE}v$NPM_VERSION${NC}"
    
    if [ "$NPM_MAJOR" -ge "$MIN_NPM_VERSION" ]; then
        echo -e "   ${GREEN}✓ npm متوافق${NC}"
    else
        echo -e "   ${YELLOW}⚠ يُنصح بترقية npm إلى v$MIN_NPM_VERSION أو أحدث${NC}"
        ((WARNINGS_FOUND++))
    fi
else
    echo -e "   ${RED}✗ npm غير مثبت${NC}"
    ((ISSUES_FOUND++))
fi

echo ""
echo "4. فحص PostgreSQL..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    echo -e "   إصدار PostgreSQL: ${BLUE}$PSQL_VERSION${NC}"
    echo -e "   ${GREEN}✓ PostgreSQL Client متوفر${NC}"
else
    echo -e "   ${YELLOW}⚠ PostgreSQL Client غير مثبت (اختياري)${NC}"
    echo -e "   سيتم استخدام Drizzle ORM للتعامل مع قاعدة البيانات"
    ((WARNINGS_FOUND++))
fi

echo ""
echo "5. فحص Git..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    echo -e "   إصدار Git: ${BLUE}$GIT_VERSION${NC}"
    echo -e "   ${GREEN}✓ Git متوفر${NC}"
else
    echo -e "   ${YELLOW}⚠ Git غير مثبت (اختياري)${NC}"
    ((WARNINGS_FOUND++))
fi

echo ""
echo "6. فحص PM2..."
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo -e "   إصدار PM2: ${BLUE}v$PM2_VERSION${NC}"
    echo -e "   ${GREEN}✓ PM2 مثبت${NC}"
else
    echo -e "   ${BLUE}ℹ PM2 غير مثبت - سيتم تثبيته تلقائياً${NC}"
fi

echo ""
echo "7. فحص المساحة المتاحة..."
AVAILABLE_SPACE=$(df . | awk 'NR==2 {print int($4/1024/1024)}')
echo -e "   المساحة المتاحة: ${BLUE}${AVAILABLE_SPACE}GB${NC}"

if [ "$AVAILABLE_SPACE" -ge "$MIN_DISK_SPACE_GB" ]; then
    echo -e "   ${GREEN}✓ المساحة كافية${NC}"
else
    echo -e "   ${RED}✗ المساحة غير كافية (مطلوب ${MIN_DISK_SPACE_GB}GB على الأقل)${NC}"
    ((ISSUES_FOUND++))
fi

echo ""
echo "8. فحص الذاكرة المتاحة..."
if [[ "$OS_TYPE" == "Linux" ]]; then
    AVAILABLE_RAM=$(free -m | awk 'NR==2 {print $7}')
    echo -e "   الذاكرة المتاحة: ${BLUE}${AVAILABLE_RAM}MB${NC}"
    
    if [ "$AVAILABLE_RAM" -ge "$MIN_RAM_MB" ]; then
        echo -e "   ${GREEN}✓ الذاكرة كافية${NC}"
    else
        echo -e "   ${YELLOW}⚠ الذاكرة قد تكون غير كافية (موصى به ${MIN_RAM_MB}MB)${NC}"
        ((WARNINGS_FOUND++))
    fi
else
    echo -e "   ${BLUE}ℹ لا يمكن فحص الذاكرة على هذا النظام${NC}"
fi

echo ""
echo "9. فحص الصلاحيات..."
if [ -w "." ]; then
    echo -e "   ${GREEN}✓ لديك صلاحيات الكتابة في المجلد الحالي${NC}"
else
    echo -e "   ${RED}✗ لا توجد صلاحيات كتابة في المجلد الحالي${NC}"
    ((ISSUES_FOUND++))
fi

echo ""
echo "10. فحص المنافذ..."
PORT=${PORT:-5000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "   ${YELLOW}⚠ المنفذ $PORT مستخدم بالفعل${NC}"
    echo -e "   قد تحتاج لتغيير المنفذ في ملف .env"
    ((WARNINGS_FOUND++))
else
    echo -e "   ${GREEN}✓ المنفذ $PORT متاح${NC}"
fi

echo ""
echo "11. فحص الاتصال بالإنترنت..."
if ping -c 1 google.com &> /dev/null; then
    echo -e "   ${GREEN}✓ الاتصال بالإنترنت يعمل${NC}"
else
    echo -e "   ${RED}✗ لا يوجد اتصال بالإنترنت${NC}"
    ((ISSUES_FOUND++))
fi

echo ""
echo "12. فحص ملفات المشروع..."
REQUIRED_FILES=("package.json" "package-lock.json" "drizzle.config.ts")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✓ $file موجود${NC}"
    else
        if [ "$file" == "package-lock.json" ]; then
            echo -e "   ${YELLOW}⚠ $file غير موجود (سيتم إنشاؤه)${NC}"
        else
            echo -e "   ${RED}✗ $file مفقود${NC}"
            ((ISSUES_FOUND++))
        fi
    fi
done

# ================ النتيجة ================ #
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ البيئة جاهزة تماماً للتثبيت!${NC}"
    echo ""
    echo "يمكنك الآن تشغيل: ${BLUE}./install.sh${NC}"
    exit 0
elif [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${YELLOW}⚠️  البيئة جاهزة للتثبيت مع $WARNINGS_FOUND تحذيرات${NC}"
    echo ""
    echo "يمكنك المتابعة بتشغيل: ${BLUE}./install.sh${NC}"
    echo "لكن راجع التحذيرات أعلاه"
    exit 0
else
    echo -e "${RED}❌ توجد $ISSUES_FOUND مشاكل حرجة يجب حلها قبل التثبيت${NC}"
    
    if [ $WARNINGS_FOUND -gt 0 ]; then
        echo -e "${YELLOW}بالإضافة إلى $WARNINGS_FOUND تحذيرات${NC}"
    fi
    
    echo ""
    echo "يرجى حل المشاكل المذكورة أعلاه قبل تشغيل التثبيت"
    exit 1
fi