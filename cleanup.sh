#!/bin/bash

# ====================================== #
#         سكريبت تنظيف البيئة              #
#       Environment Cleanup Script         #
# ====================================== #

set -e

# ================ الألوان ================ #
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🧹 تنظيف بيئة منصة الصرافة 🧹                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ================ التحذير ================ #
echo -e "${YELLOW}⚠️  تحذير: هذا السكريبت سيقوم بحذف:${NC}"
echo "   • node_modules"
echo "   • package-lock.json"
echo "   • dist (ملفات البناء)"
echo "   • npm cache"
echo "   • PM2 logs"
echo "   • ملفات السجلات المؤقتة"
echo ""
read -p "هل تريد المتابعة؟ (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}تم الإلغاء${NC}"
    exit 0
fi

echo ""

# ================ إيقاف PM2 ================ #
echo -e "${BLUE}1. إيقاف عمليات PM2...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 stop all 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    echo -e "${GREEN}✓ تم إيقاف PM2${NC}"
else
    echo -e "${YELLOW}⚠ PM2 غير مثبت${NC}"
fi

# ================ حذف node_modules ================ #
echo -e "${BLUE}2. حذف node_modules...${NC}"
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo -e "${GREEN}✓ تم حذف node_modules${NC}"
else
    echo -e "${YELLOW}⚠ node_modules غير موجود${NC}"
fi

# ================ حذف package-lock.json ================ #
echo -e "${BLUE}3. حذف package-lock.json...${NC}"
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo -e "${GREEN}✓ تم حذف package-lock.json${NC}"
else
    echo -e "${YELLOW}⚠ package-lock.json غير موجود${NC}"
fi

# ================ حذف ملفات البناء ================ #
echo -e "${BLUE}4. حذف ملفات البناء...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}✓ تم حذف dist${NC}"
else
    echo -e "${YELLOW}⚠ dist غير موجود${NC}"
fi

if [ -d "server-dist" ]; then
    rm -rf server-dist
    echo -e "${GREEN}✓ تم حذف server-dist${NC}"
fi

if [ -d ".vite" ]; then
    rm -rf .vite
    echo -e "${GREEN}✓ تم حذف .vite cache${NC}"
fi

# ================ تنظيف npm cache ================ #
echo -e "${BLUE}5. تنظيف npm cache...${NC}"
npm cache clean --force 2>/dev/null
echo -e "${GREEN}✓ تم تنظيف npm cache${NC}"

# ================ تنظيف السجلات ================ #
echo -e "${BLUE}6. تنظيف السجلات...${NC}"

# سجلات PM2
if [ -d "logs" ]; then
    echo -e "${YELLOW}   حذف سجلات PM2...${NC}"
    rm -rf logs/*.log
    echo -e "${GREEN}   ✓ تم حذف سجلات PM2${NC}"
fi

# سجلات npm
if [ -d ".npm" ]; then
    rm -rf .npm
    echo -e "${GREEN}   ✓ تم حذف .npm${NC}"
fi

# سجلات التثبيت
rm -f install_*.log 2>/dev/null || true
echo -e "${GREEN}   ✓ تم حذف سجلات التثبيت${NC}"

# ================ تنظيف الملفات المؤقتة ================ #
echo -e "${BLUE}7. تنظيف الملفات المؤقتة...${NC}"

# ملفات نسخ احتياطية قديمة
if ls backup_* 1> /dev/null 2>&1; then
    echo -e "${YELLOW}   وجدت نسخ احتياطية قديمة${NC}"
    read -p "   هل تريد حذف النسخ الاحتياطية؟ (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf backup_*
        echo -e "${GREEN}   ✓ تم حذف النسخ الاحتياطية${NC}"
    else
        echo -e "${BLUE}   تم الاحتفاظ بالنسخ الاحتياطية${NC}"
    fi
fi

# ملف معلومات التثبيت
if [ -f "install_info.json" ]; then
    rm -f install_info.json
    echo -e "${GREEN}✓ تم حذف install_info.json${NC}"
fi

# ================ تنظيف الذاكرة ================ #
echo -e "${BLUE}8. تحرير ذاكرة النظام...${NC}"
if [[ "$(uname -s)" == "Linux" ]]; then
    sync
    echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
    echo -e "${GREEN}✓ تم تحرير الذاكرة${NC}"
else
    echo -e "${YELLOW}⚠ تحرير الذاكرة متاح فقط على Linux${NC}"
fi

# ================ التحقق من المساحة ================ #
echo ""
echo -e "${BLUE}معلومات المساحة بعد التنظيف:${NC}"
df -h . | head -2

# ================ النتيجة ================ #
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ تم تنظيف البيئة بنجاح!${NC}"
echo ""
echo -e "${CYAN}الخطوات التالية:${NC}"
echo "1. تشغيل فحص البيئة: ${BOLD}./pre-install.sh${NC}"
echo "2. تشغيل التثبيت: ${BOLD}./install.sh${NC}"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""