import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Ensure upload directories exist
const createDirectories = () => {
  const dirs = [
    './public/uploads',
    './public/uploads/verification',
    './public/uploads/verification/id',
    './public/uploads/verification/address'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Create upload directories on startup
createDirectories();

// Configure storage for multer
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb) {
    // Determine the upload path based on field name
    let uploadPath = './public/uploads/verification/';
    
    if (file.fieldname === 'id_photo') {
      uploadPath += 'id';
    } else if (file.fieldname === 'proof_of_address') {
      uploadPath += 'address';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req: Request, file: Express.Multer.File, cb) {
    // Create a unique filename with userId, timestamp and original extension
    const userId = (req as any).user?.id || 'unknown';
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    
    cb(null, `${userId}_${timestamp}${fileExt}`);
  }
});

// File filter to only allow image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  // Only accept images and PDFs
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('يُسمح فقط بملفات الصور (JPG, PNG, GIF, WEBP) وملفات PDF وWord'));
  }
};

// Create the multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter
});

// Middleware for handling file upload errors
export const handleUploadErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'حجم الملف كبير جدًا. الحد الأقصى هو 5 ميغابايت.' });
    }
    return res.status(400).json({ message: `خطأ في رفع الملف: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message || 'حدث خطأ أثناء رفع الملف' });
  }
  next();
};