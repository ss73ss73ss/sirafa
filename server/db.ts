import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// التحقق من وجود متغيرات قاعدة البيانات
if (!process.env.PGHOST || !process.env.PGPORT || !process.env.PGUSER || !process.env.PGPASSWORD || !process.env.PGDATABASE) {
  console.warn("⚠️ PostgreSQL environment variables not fully set. App may not function properly.");
}

// متغير لتتبع حالة قاعدة البيانات
let dbConnected = false;

// إنشاء pool الاتصال باستخدام المتغيرات المنفصلة مع معالجة الأخطاء
export const pool = new Pool({ 
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
  ssl: {
    rejectUnauthorized: false
  }
});

// معالجة أحداث الـ pool
pool.on('connect', () => {
  dbConnected = true;
  console.log('✅ قاعدة البيانات متصلة بنجاح');
});

pool.on('error', (err) => {
  dbConnected = false;
  console.error('❌ خطأ في قاعدة البيانات:', err.message);
});

export const db = drizzle({ client: pool, schema });

// دالة للتحقق من حالة قاعدة البيانات
export const isDatabaseConnected = () => dbConnected;

// اختبار الاتصال عند التحميل
pool.query('SELECT 1')
  .then(() => {
    dbConnected = true;
    console.log('✅ اختبار قاعدة البيانات نجح');
  })
  .catch((err) => {
    dbConnected = false;
    console.error('❌ فشل اختبار قاعدة البيانات:', err.message);
    console.log('🔄 التطبيق سيعمل في وضع محدود بدون قاعدة البيانات');
  });
