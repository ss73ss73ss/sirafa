import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

async function createAdmin() {
  console.log("بدء إنشاء حساب مدير النظام...");
  
  const email = 'ss73ss73ss73@gmail.com';
  const password = 'Sa73*37As123';
  const fullName = 'System Admin';
  
  // توليد رقم الحساب الفريد (سنستخدمه كرقم هاتف لتجنب تغيير هيكل قاعدة البيانات)
  // رقم الحساب سيبدأ بـ 9 للمسؤولين
  const accountNumber = '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
  
  try {
    // التحقق مما إذا كان المستخدم موجودًا بالفعل
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (existingUser) {
      console.log("✅ حساب المدير موجود بالفعل:", existingUser.email);
      return;
    }
    
    // تشفير كلمة المرور
    const hashedPassword = await hashPassword(password);
    
    // إنشاء حساب المدير
    const [admin] = await db
      .insert(users)
      .values({
        fullName,
        email,
        password: hashedPassword,
        type: 'admin',
        phone: accountNumber, // نستخدم حقل الهاتف لتخزين رقم الحساب
        createdAt: new Date()
      })
      .returning();
    
    console.log("✅ تم إنشاء حساب المدير بنجاح:", admin.email);
    console.log("معرف المدير:", admin.id);
    console.log("رقم الحساب:", admin.phone);
  } catch (error) {
    console.error("❌ حدث خطأ أثناء إنشاء حساب المدير:", error);
  } finally {
    process.exit(0);
  }
}

createAdmin();