import { Request, Response } from 'express';
import { storage } from './storage';
import { upload, handleUploadErrors } from './file-uploads';
import { authMiddleware } from './auth';

// Add this function to your routes.ts file
export const setupVerificationUploadRoute = (app: any) => {
  // إرسال طلب توثيق حساب مع ملفات (باستخدام multipart/form-data)
  app.post("/api/user/verify-account", authMiddleware, upload.fields([
    { name: 'id_photo', maxCount: 1 },
    { name: 'proof_of_address', maxCount: 1 }
  ]), handleUploadErrors, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      console.log("Files received:", files);
      
      // التحقق من توفر الملفات
      if (!files.id_photo || !files.proof_of_address) {
        return res.status(400).json({ 
          message: "يجب توفير صورة الهوية وإثبات العنوان" 
        });
      }
      
      // التحقق من وجود طلب توثيق سابق للمستخدم
      const existingRequest = await storage.getUserVerificationRequest(userId);
      if (existingRequest) {
        return res.status(400).json({ 
          message: "لديك طلب توثيق قيد المراجعة بالفعل",
          request: existingRequest
        });
      }
      
      // استخراج مسارات الملفات
      const idPhotoUrl = `/uploads/verification/id/${files.id_photo[0].filename}`;
      const proofOfAddressUrl = `/uploads/verification/address/${files.proof_of_address[0].filename}`;
      
      // إنشاء طلب توثيق جديد
      const request = await storage.createVerificationRequest({
        userId,
        idPhotoUrl,
        proofOfAddressUrl
      });
      
      res.status(201).json({
        message: "تم إرسال طلب التوثيق بنجاح وسيتم مراجعته من قبل الإدارة",
        request
      });
      
    } catch (error) {
      console.error("خطأ في إنشاء طلب التوثيق:", error);
      res.status(500).json({ message: "حدث خطأ أثناء إنشاء طلب التوثيق" });
    }
  });
};