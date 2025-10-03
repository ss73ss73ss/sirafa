#!/usr/bin/env node

/**
 * سكريبت فحص صحة التطبيق
 * Health Check Script for Exchange Platform
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// الإعدادات
const CONFIG = {
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 5000,
  timeout: 5000,
  retries: 3,
  retryDelay: 2000
};

// الألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// وظائف المساعدة
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`)
};

// فحص HTTP endpoint
async function checkHttpEndpoint(path = '/api/health') {
  return new Promise((resolve) => {
    const options = {
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: path,
      method: 'GET',
      timeout: CONFIG.timeout,
      headers: {
        'User-Agent': 'Health-Check/1.0'
      }
    };

    const protocol = CONFIG.port === 443 ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({
            success: true,
            statusCode: res.statusCode,
            data: data,
            responseTime: Date.now() - startTime
          });
        } else {
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: `HTTP ${res.statusCode}`,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });

    const startTime = Date.now();
    req.end();
  });
}

// فحص عملية PM2
async function checkPM2Process() {
  try {
    const { stdout } = await execPromise('pm2 jlist');
    const processes = JSON.parse(stdout);
    
    const appProcess = processes.find(p => p.name === 'exchange-platform');
    
    if (!appProcess) {
      return { success: false, error: 'Process not found' };
    }
    
    return {
      success: appProcess.pm2_env.status === 'online',
      status: appProcess.pm2_env.status,
      cpu: appProcess.monit.cpu,
      memory: Math.round(appProcess.monit.memory / 1024 / 1024) + ' MB',
      uptime: appProcess.pm2_env.pm_uptime,
      restarts: appProcess.pm2_env.restart_time,
      instances: appProcess.pm2_env.instances || 1
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// فحص قاعدة البيانات
async function checkDatabase() {
  try {
    // محاولة الاتصال بقاعدة البيانات عبر API
    const result = await checkHttpEndpoint('/api/health/db');
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// فحص استخدام الموارد
async function checkSystemResources() {
  try {
    const results = {};
    
    // فحص استخدام الذاكرة
    const { stdout: memInfo } = await execPromise("free -m | awk 'NR==2{printf \"%d %d %d\", $3, $2, $7}'");
    const [usedMem, totalMem, availMem] = memInfo.split(' ').map(Number);
    
    results.memory = {
      used: usedMem,
      total: totalMem,
      available: availMem,
      percentage: Math.round((usedMem / totalMem) * 100)
    };
    
    // فحص استخدام المعالج
    const { stdout: loadAvg } = await execPromise('cat /proc/loadavg');
    const [load1, load5, load15] = loadAvg.split(' ').slice(0, 3).map(parseFloat);
    
    results.cpu = {
      load1,
      load5,
      load15
    };
    
    // فحص المساحة على القرص
    const { stdout: diskInfo } = await execPromise("df . | awk 'NR==2{printf \"%d %d %d\", $3, $2, $4}'");
    const [usedDisk, totalDisk, availDisk] = diskInfo.split(' ').map(Number);
    
    results.disk = {
      used: Math.round(usedDisk / 1024 / 1024),
      total: Math.round(totalDisk / 1024 / 1024),
      available: Math.round(availDisk / 1024 / 1024),
      percentage: Math.round((usedDisk / totalDisk) * 100)
    };
    
    return { success: true, ...results };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// الفحص الرئيسي
async function performHealthCheck() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║             🏥 فحص صحة منصة الصرافة 🏥                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    checks: {},
    overall: 'healthy'
  };
  
  // 1. فحص HTTP Endpoint
  log.info('فحص HTTP Endpoint...');
  const httpResult = await checkHttpEndpoint('/');
  results.checks.http = httpResult;
  
  if (httpResult.success) {
    log.success(`HTTP Endpoint يعمل (${httpResult.responseTime}ms)`);
  } else {
    log.error(`HTTP Endpoint لا يعمل: ${httpResult.error}`);
    results.overall = 'unhealthy';
  }
  
  // 2. فحص عملية PM2
  log.info('فحص عملية PM2...');
  const pm2Result = await checkPM2Process();
  results.checks.pm2 = pm2Result;
  
  if (pm2Result.success) {
    log.success(`PM2 Process: ${pm2Result.status} | Memory: ${pm2Result.memory} | Restarts: ${pm2Result.restarts}`);
  } else {
    log.warning(`PM2 Process غير موجود أو متوقف`);
    if (results.overall === 'healthy') results.overall = 'degraded';
  }
  
  // 3. فحص قاعدة البيانات
  log.info('فحص قاعدة البيانات...');
  const dbResult = await checkDatabase();
  results.checks.database = dbResult;
  
  if (dbResult.success) {
    log.success('قاعدة البيانات تعمل بشكل طبيعي');
  } else {
    log.warning(`قاعدة البيانات: ${dbResult.error || 'غير متاحة'}`);
    if (results.overall === 'healthy') results.overall = 'degraded';
  }
  
  // 4. فحص موارد النظام
  log.info('فحص موارد النظام...');
  const resourcesResult = await checkSystemResources();
  results.checks.resources = resourcesResult;
  
  if (resourcesResult.success) {
    log.success(`الذاكرة: ${resourcesResult.memory.percentage}% | المعالج: ${resourcesResult.cpu.load1} | القرص: ${resourcesResult.disk.percentage}%`);
    
    // تحذيرات الموارد
    if (resourcesResult.memory.percentage > 90) {
      log.warning('⚠ استخدام الذاكرة مرتفع جداً!');
      if (results.overall === 'healthy') results.overall = 'degraded';
    }
    
    if (resourcesResult.cpu.load1 > 4) {
      log.warning('⚠ حمل المعالج مرتفع!');
      if (results.overall === 'healthy') results.overall = 'degraded';
    }
    
    if (resourcesResult.disk.percentage > 90) {
      log.warning('⚠ مساحة القرص تقترب من الامتلاء!');
      if (results.overall === 'healthy') results.overall = 'degraded';
    }
  }
  
  // النتيجة النهائية
  console.log('\n════════════════════════════════════════════════════════════');
  
  switch (results.overall) {
    case 'healthy':
      log.success('✅ النظام يعمل بشكل ممتاز!');
      process.exit(0);
      break;
    case 'degraded':
      log.warning('⚠️ النظام يعمل مع بعض المشاكل');
      process.exit(1);
      break;
    case 'unhealthy':
      log.error('❌ النظام يواجه مشاكل حرجة!');
      process.exit(2);
      break;
  }
  
  // حفظ النتائج في ملف JSON
  const fs = require('fs');
  const logDir = './logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  
  fs.writeFileSync(
    `${logDir}/health-check-${Date.now()}.json`,
    JSON.stringify(results, null, 2)
  );
}

// تشغيل الفحص
if (require.main === module) {
  performHealthCheck().catch(error => {
    log.error(`خطأ في فحص الصحة: ${error.message}`);
    process.exit(3);
  });
}

module.exports = { checkHttpEndpoint, checkPM2Process, checkDatabase, checkSystemResources };