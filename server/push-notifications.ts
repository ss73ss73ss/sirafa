import webpush from 'web-push';
import { db } from './db';
import { sql } from 'drizzle-orm';

// إعداد VAPID keys للإشعارات
const VAPID_PUBLIC_KEY = 'BIOBQqLPWUKpu_E8ZEjqdDY4HyaJ5AeE2URlnHyam3ZSFe-BmodrswOM5-mCrwmQrAkIHOPkrubKcBWTBE2_Gr0';
const VAPID_PRIVATE_KEY = 'hXfgrT9wIwcScZ9e6-YTLOTgKssgG6YuyKOuamHomXU';

webpush.setVapidDetails(
  'mailto:admin@exchange-platform.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// إنشاء جدول الاشتراكات إذا لم يكن موجوداً
export async function initializePushSubscriptions() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL,
        keys_p256dh TEXT NOT NULL,
        keys_auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, endpoint)
      )
    `);
    console.log('✅ جدول اشتراكات الإشعارات جاهز');
  } catch (error) {
    console.error('❌ خطأ في إنشاء جدول اشتراكات الإشعارات:', error);
    console.log('🔄 سيتم تشغيل نظام الإشعارات بدون قاعدة البيانات مؤقتاً');
    // لا نوقف التطبيق، نكمل التشغيل بدون الجدول
  }
}

// حفظ اشتراك push notification
export async function savePushSubscription(userId: number, subscription: any) {
  try {
    await db.execute(sql`
      INSERT INTO push_subscriptions (user_id, endpoint, keys_p256dh, keys_auth)
      VALUES (${userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
      ON CONFLICT (user_id, endpoint) DO UPDATE SET
        keys_p256dh = EXCLUDED.keys_p256dh,
        keys_auth = EXCLUDED.keys_auth
    `);
    console.log(`✅ تم حفظ اشتراك الإشعارات للمستخدم ${userId}`);
  } catch (error) {
    console.error('❌ خطأ في حفظ اشتراك الإشعارات:', error);
    throw error;
  }
}

// إزالة اشتراك push notification
export async function removePushSubscription(userId: number, endpoint: string) {
  try {
    await db.execute(sql`
      DELETE FROM push_subscriptions 
      WHERE user_id = ${userId} AND endpoint = ${endpoint}
    `);
    console.log(`✅ تم إزالة اشتراك الإشعارات للمستخدم ${userId}`);
  } catch (error) {
    console.error('❌ خطأ في إزالة اشتراك الإشعارات:', error);
    throw error;
  }
}

// جلب اشتراكات المستخدم
export async function getUserPushSubscriptions(userId: number) {
  try {
    console.log(`🔍 جلب اشتراكات المستخدم ${userId} من قاعدة البيانات...`);
    const result = await db.execute(sql`
      SELECT endpoint, keys_p256dh, keys_auth 
      FROM push_subscriptions 
      WHERE user_id = ${userId}
    `);
    
    console.log(`📊 تم العثور على ${result.rows.length} اشتراك في قاعدة البيانات`);
    if (result.rows.length > 0) {
      result.rows.forEach((row, index) => {
        const endpoint = row.endpoint as string;
        console.log(`  📱 اشتراك ${index + 1}: ${endpoint?.substring(0, 50)}...`);
      });
    }
    
    return result.rows.map(row => ({
      endpoint: row.endpoint as string,
      keys: {
        p256dh: row.keys_p256dh as string,
        auth: row.keys_auth as string
      }
    }));
  } catch (error) {
    console.error('❌ خطأ في جلب اشتراكات الإشعارات:', error);
    return [];
  }
}

// إرسال إشعار push لمستخدم محدد
export async function sendPushNotificationToUser(
  userId: number, 
  payload: {
    title: string;
    body: string;
    data?: any;
    url?: string;
    tag?: string;
  }
) {
  try {
    console.log(`🚀 بدء إرسال إشعار push للمستخدم ${userId}`);
    console.log(`📝 محتوى الإشعار: ${payload.title} - ${payload.body}`);
    
    const subscriptions = await getUserPushSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.log(`ℹ️ لا توجد اشتراكات إشعارات للمستخدم ${userId}`);
      return;
    }
    
    console.log(`📱 تم العثور على ${subscriptions.length} اشتراك للمستخدم ${userId}`);

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      url: payload.url || '/',
      tag: payload.tag || 'notification'
    });

    const promises = subscriptions.map(async (subscription, index) => {
      try {
        console.log(`🔄 محاولة إرسال إشعار للمستخدم ${userId} - الاشتراك ${index + 1}/${subscriptions.length}`);
        console.log(`📡 Endpoint: ${(subscription.endpoint as string).substring(0, 50)}...`);
        
        const result = await webpush.sendNotification(subscription, pushPayload);
        console.log(`✅ تم إرسال إشعار push للمستخدم ${userId} - الاشتراك ${index + 1} بنجاح`);
        console.log(`📊 Response status: ${result?.statusCode || 'unknown'}`);
        
        return { success: true, subscription: index + 1 };
      } catch (error: any) {
        console.error(`❌ خطأ في إرسال إشعار push للمستخدم ${userId} - الاشتراك ${index + 1}:`);
        console.error(`   Status: ${error.statusCode || 'unknown'}`);
        console.error(`   Message: ${error.message || 'unknown'}`);
        console.error(`   Body: ${JSON.stringify(error.body || {})}`);
        
        // إذا كان الاشتراك غير صالح، احذفه
        if (error.statusCode === 410) {
          console.log(`🗑️ حذف الاشتراك غير الصالح للمستخدم ${userId}`);
          await removePushSubscription(userId, subscription.endpoint as string);
        }
        
        return { success: false, subscription: index + 1, error: error.message };
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('❌ خطأ في إرسال إشعارات push:', error);
  }
}

// إرسال إشعار لمجموعة من المستخدمين
export async function sendPushNotificationToUsers(
  userIds: number[], 
  payload: {
    title: string;
    body: string;
    data?: any;
    url?: string;
    tag?: string;
  }
) {
  const promises = userIds.map(userId => 
    sendPushNotificationToUser(userId, payload)
  );
  
  await Promise.all(promises);
}

// إرسال إشعار لجميع المستخدمين (للإشعارات العامة)
export async function sendPushNotificationToAll(
  payload: {
    title: string;
    body: string;
    data?: any;
    url?: string;
    tag?: string;
  }
) {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT user_id FROM push_subscriptions
    `);
    
    const userIds = result.rows.map(row => row.user_id as number);
    await sendPushNotificationToUsers(userIds, payload);
    
    console.log(`✅ تم إرسال إشعار عام لـ ${userIds.length} مستخدم`);
  } catch (error) {
    console.error('❌ خطأ في إرسال إشعار عام:', error);
  }
}