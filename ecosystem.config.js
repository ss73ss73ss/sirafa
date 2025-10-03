require('dotenv').config();

module.exports = {
  apps: [{
    // معلومات التطبيق الأساسية
    name: 'exchange-platform',
    script: './dist/index.js', // تم التعديل للمسار الصحيح
    
    // إعدادات الـ Cluster Mode للاستفادة من جميع النوى
    instances: process.env.PM2_INSTANCES || 'max', // يمكن التحكم عبر .env
    exec_mode: 'cluster',
    
    // متغيرات البيئة للإنتاج
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.PORT || 5000,
      HOST: process.env.HOST || '0.0.0.0',
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
      VITE_API_URL: process.env.VITE_API_URL,
      // إضافة كل متغيرات البيئة
      ...process.env
    },
    
    // إعدادات السجلات المحسنة
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true, // إضافة التوقيت للسجلات
    log_type: 'json', // سجلات JSON للتحليل السهل
    
    // إعدادات إعادة التشغيل التلقائي
    autorestart: true,
    watch: false, // تعطيل المراقبة في الإنتاج
    max_memory_restart: process.env.PM2_MAX_MEMORY || '2G', // زيادة الحد الأقصى
    
    // استراتيجية إعادة التشغيل المتقدمة
    min_uptime: '10s', // الحد الأدنى للوقت قبل اعتبار التطبيق مستقر
    max_restarts: 10, // عدد محاولات إعادة التشغيل
    restart_delay: 4000, // التأخير بين محاولات إعادة التشغيل (ms)
    exp_backoff_restart_delay: 100, // زيادة التأخير تدريجياً
    
    // إعدادات الإيقاف الآمن (Graceful Shutdown)
    kill_timeout: 5000, // الوقت المسموح للإيقاف الآمن
    listen_timeout: 10000, // الوقت المسموح لبدء التطبيق
    shutdown_with_message: false,
    wait_ready: true, // انتظار إشارة process.send('ready')
    
    // تحسينات الأداء
    node_args: [
      '--max-old-space-size=2048', // زيادة حجم الذاكرة المتاحة
      '--optimize-for-size', // تحسين حجم الكود
      '--max-semi-space-size=1024' // تحسين garbage collection
    ].join(' '),
    
    // معلومات إضافية للمراقبة
    instance_var: 'INSTANCE_ID',
    combine_logs: true,
    
    // متغيرات البيئة للإنتاج
    env_production: {
      NODE_ENV: 'production',
      PM2_SERVE_PATH: '.',
      PM2_SERVE_PORT: process.env.PORT || 5000,
      PM2_SERVE_SPA: 'true',
      PM2_SERVE_HOMEPAGE: '/index.html'
    },
    
    // متغيرات البيئة للتطوير (اختياري)
    env_development: {
      NODE_ENV: 'development',
      DEBUG: 'app:*',
      VERBOSE: true
    },
    
    // إعدادات الصحة والمراقبة
    health: {
      port: 3001, // منفذ فحص الصحة
      path: '/health',
      check_interval: 30000 // فحص كل 30 ثانية
    },
    
    // معالجة الأخطاء
    error_handlers: {
      uncaughtException: true,
      unhandledRejection: true
    },
    
    // أوامر ما بعد البدء
    post_start: [
      'echo "تطبيق منصة الصرافة يعمل الآن على المنفذ ${PORT}"'
    ],
    
    // أوامر ما قبل الإيقاف
    pre_stop: [
      'echo "إيقاف تطبيق منصة الصرافة..."'
    ]
  }],
  
  // إعدادات النشر المحسنة (Deploy)
  deploy: {
    production: {
      user: process.env.SSH_USER || 'deploy',
      host: process.env.SSH_HOST || 'your-hostinger-server.com',
      ref: 'origin/main',
      repo: process.env.GIT_REPO || 'git@github.com:your-username/exchange-platform.git',
      path: process.env.DEPLOY_PATH || '/var/www/exchange-platform',
      'pre-deploy-local': 'echo "بدء النشر إلى خادم الإنتاج..."',
      'post-deploy': [
        'npm cache clean --force',
        'npm ci --production',
        'npm run build',
        'npm run db:push',
        'pm2 reload ecosystem.config.js --env production',
        'pm2 save',
        'echo "تم النشر بنجاح!"'
      ].join(' && '),
      'pre-setup': 'echo "إعداد بيئة الخادم..."',
      ssh_options: ['StrictHostKeyChecking=no', 'PasswordAuthentication=no'],
      env: {
        NODE_ENV: 'production'
      }
    },
    
    // بيئة التطوير (اختياري)
    development: {
      user: process.env.SSH_USER || 'deploy',
      host: process.env.DEV_SSH_HOST || 'dev-server.com',
      ref: 'origin/develop',
      repo: process.env.GIT_REPO || 'git@github.com:your-username/exchange-platform.git',
      path: process.env.DEV_DEPLOY_PATH || '/var/www/exchange-platform-dev',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env development',
      env: {
        NODE_ENV: 'development'
      }
    }
  }
};
