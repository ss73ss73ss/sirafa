import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

// التأكد من وجود مجلد التحميل في المجلد العام
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('تم إنشاء مجلد التحميلات:', uploadDir);
}

// تكوين التخزين
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    // إنشاء اسم ملف فريد باستخدام الطابع الزمني واسم الملف الأصلي
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// تصفية أنواع الملفات المسموح بها
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  // السماح بالصور والمستندات والملفات المضغوطة فقط
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-rar-compressed'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مسموح به. يرجى تحميل صورة أو مستند أو ملف مضغوط فقط.'), false);
  }
};

// إعداد multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // الحد الأقصى 10 ميجابايت
  },
  fileFilter: fileFilter
});

// معالج الأخطاء
export const handleUploadErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'حجم الملف كبير جدًا. الحد الأقصى هو 10 ميجابايت.' });
    }
    return res.status(400).json({ message: `خطأ في رفع الملف: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message || 'خطأ في رفع الملف' });
  }
  next();
};