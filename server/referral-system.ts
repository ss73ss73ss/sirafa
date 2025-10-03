import { db } from "./db";
import { systemSettings, referralRewards, referralBalances, users, commissionLogs, userNotifications, transactionLogs } from "@shared/schema";
import { eq, and, sql, desc, sum } from "drizzle-orm";
import { storage } from "./storage";

// === وظائف إدارة الإعدادات ===

/**
 * جلب إعداد من النظام مع قيمة افتراضية
 */
export async function getSetting(key: string, defaultValue: any) {
  try {
    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    
    if (result.length === 0) {
      return defaultValue;
    }
    
    return result[0].value;
  } catch (error) {
    console.error(`خطأ في جلب الإعداد ${key}:`, error);
    return defaultValue;
  }
}

/**
 * تحديث إعداد النظام
 */
export async function setSetting(key: string, value: any) {
  try {
    await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() }
      });
    
    return true;
  } catch (error) {
    console.error(`خطأ في تحديث الإعداد ${key}:`, error);
    return false;
  }
}

// === وظائف تسجيل المعاملات ===

/**
 * تسجيل معاملة في كشف الحساب
 */
async function logTransactionToStatement(
  userId: number,
  type: string,
  currency: string,
  amount: number,
  direction: 'debit' | 'credit',
  counterparty?: string,
  ref?: string,
  note?: string,
  metadata?: any
): Promise<void> {
  try {
    await db.insert(transactionLogs).values({
      userId,
      type,
      currency,
      amount: amount.toString(),
      commission: "0",
      direction,
      counterparty,
      ref,
      status: 'completed',
      note,
      metadata: metadata || null
    });
  } catch (error) {
    console.error('خطأ في تسجيل المعاملة:', error);
  }
}

// === وظائف نظام الإحالة ===

/**
 * توليد رمز إحالة فريد للمستخدم
 */
export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * التحقق من صحة رمز الإحالة
 */
export async function validateReferralCode(code: string): Promise<{ valid: boolean; referrerId?: number }> {
  try {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);
    
    if (result.length === 0) {
      return { valid: false };
    }
    
    return { valid: true, referrerId: result[0].id };
  } catch (error) {
    console.error('خطأ في التحقق من رمز الإحالة:', error);
    return { valid: false };
  }
}

/**
 * ربط مستخدم جديد بالمُحيل
 */
export async function linkReferral(newUserId: number, referralCode: string): Promise<boolean> {
  try {
    const validation = await validateReferralCode(referralCode);
    if (!validation.valid || !validation.referrerId) {
      return false;
    }
    
    // منع الإحالة الذاتية
    if (validation.referrerId === newUserId) {
      return false;
    }
    
    // ربط المستخدم بالمُحيل (مرة واحدة فقط)
    await db
      .update(users)
      .set({
        referredBy: validation.referrerId,
        referredAt: new Date()
      })
      .where(and(
        eq(users.id, newUserId),
        sql`referred_by IS NULL` // فقط إذا لم يكن مربوطًا من قبل
      ));
    
    return true;
  } catch (error) {
    console.error('خطأ في ربط الإحالة:', error);
    return false;
  }
}

/**
 * حساب مكافأة الإحالة الثابتة حسب نوع العملية والعملة
 * الآن تستخدم إعدادات المكافآت الثابتة من صفحة الإدارة
 */
export async function calculateFixedReferralReward(
  operationType: 'transfer_lyd' | 'transfer_usd' | 'market_sell',
  commissionAmount: number,
  currency: string
): Promise<{ rewardAmount: number; deductedFromCommission: number; exchangeRate?: number }> {
  try {
    // جلب إعدادات المكافآت الثابتة من قاعدة البيانات مباشرة
    let fixedRewardAmount = 0;
    
    try {
      // تحديد المكافأة الثابتة حسب نوع العملية
      let settingKey = '';
      switch (operationType) {
        case 'transfer_lyd':
          settingKey = 'referral.fixed_reward_lyd';
          break;
        case 'transfer_usd':
          settingKey = 'referral.fixed_reward_usd';
          break;
        case 'market_sell':
          settingKey = 'referral.fixed_reward_market_sell';
          break;
        default:
          return { rewardAmount: 0, deductedFromCommission: 0 };
      }
      
      const rewardConfig = await getSetting(settingKey, { amount: operationType === 'transfer_lyd' ? 1.00 : 0.50 });
      fixedRewardAmount = rewardConfig.amount || (operationType === 'transfer_lyd' ? 1.00 : 0.50);
      
      console.log(`💰 جلب المكافأة الثابتة للعملية ${operationType}: ${fixedRewardAmount} ${currency}`);
    } catch (error) {
      // استخدام القيم الافتراضية في حالة عدم توفر الإعدادات
      console.log('⚠️ تعذر جلب إعدادات المكافآت الثابتة، استخدام القيم الافتراضية:', error);
      switch (operationType) {
        case 'transfer_lyd':
          fixedRewardAmount = 1.00;
          break;
        case 'transfer_usd':
          fixedRewardAmount = 0.50;
          break;
        case 'market_sell':
          fixedRewardAmount = 0.005;
          break;
        default:
          return { rewardAmount: 0, deductedFromCommission: 0 };
      }
    }

    // التأكد من أن المكافأة لا تتجاوز العمولة المتاحة
    const actualReward = Math.min(fixedRewardAmount, commissionAmount);
    
    // منع المكافآت السالبة
    if (actualReward <= 0 || commissionAmount <= 0) {
      return { rewardAmount: 0, deductedFromCommission: 0 };
    }

    console.log(`💰 حساب المكافأة الثابتة: النوع=${operationType}, المبلغ المحدد=${fixedRewardAmount}, العمولة المتاحة=${commissionAmount}, المكافأة الفعلية=${actualReward}`);

    return {
      rewardAmount: actualReward,
      deductedFromCommission: actualReward
    };
  } catch (error) {
    console.error('خطأ في حساب مكافأة الإحالة الثابتة:', error);
    return { rewardAmount: 0, deductedFromCommission: 0 };
  }
}

/**
 * حساب مكافأة الإحالة من عمولة النظام (النظام القديم - للتوافق مع الكود الموجود)
 */
export async function calculateReferralReward(commissionAmount: number): Promise<number> {
  try {
    const rewardRateConfig = await getSetting('referral.reward_rate', { rate: 0.20 });
    const rewardRate = rewardRateConfig.rate || 0.20; // افتراضي 20%
    
    return Math.round((commissionAmount * rewardRate) * 1000000) / 1000000; // دقة 6 خانات عشرية
  } catch (error) {
    console.error('خطأ في حساب مكافأة الإحالة:', error);
    return 0;
  }
}

/**
 * توزيع مكافأة الإحالة الثابتة للمُحيل
 * تُخصم المكافأة من عمولة النظام ولا تُضاف كمبلغ إضافي
 */
export async function allocateFixedReferralReward(
  txId: number, 
  operationType: 'transfer_lyd' | 'transfer_usd' | 'market_sell',
  commissionAmount: number,
  currency: string,
  referredUserId: number
): Promise<{ hasReferral: boolean; rewardAmount: number; netSystemCommission: number }> {
  try {
    // التحقق من تفعيل النظام
    const enabledConfig = await getSetting('referral.enabled', { enabled: false });
    if (!enabledConfig.enabled) {
      return { hasReferral: false, rewardAmount: 0, netSystemCommission: commissionAmount };
    }

    // التحقق من وجود مُحيل للمستخدم
    const userResult = await db
      .select({
        referredBy: users.referredBy,
        verified: users.verified
      })
      .from(users)
      .where(eq(users.id, referredUserId))
      .limit(1);

    if (userResult.length === 0 || !userResult[0].referredBy) {
      return { hasReferral: false, rewardAmount: 0, netSystemCommission: commissionAmount };
    }

    const referrerId = userResult[0].referredBy;

    // التحقق من عدم وجود مكافأة مسبقة لنفس المعاملة
    const existingReward = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.txId, txId))
      .limit(1);

    if (existingReward.length > 0) {
      return { hasReferral: false, rewardAmount: 0, netSystemCommission: commissionAmount };
    }

    // حساب المكافأة الثابتة
    const rewardCalculation = await calculateFixedReferralReward(operationType, commissionAmount, currency);
    
    if (rewardCalculation.rewardAmount <= 0) {
      return { hasReferral: false, rewardAmount: 0, netSystemCommission: commissionAmount };
    }

    // جلب نسبة رسوم النظام من إعدادات المكافآت الثابتة مباشرة من قاعدة البيانات
    let systemFeeRate = 0.10; // افتراضي 10%
    try {
      const systemFeeConfig = await getSetting('referral.system_fee_rate', { rate: 0.10 });
      systemFeeRate = systemFeeConfig.rate || 0.10;
      console.log(`💰 جلب نسبة رسوم النظام: ${systemFeeRate * 100}%`);
    } catch (error) {
      console.log('⚠️ تعذر جلب نسبة رسوم النظام، استخدام القيمة الافتراضية 10%:', error);
    }
    
    const systemFeeAmount = rewardCalculation.rewardAmount * systemFeeRate;
    const finalRewardAmount = rewardCalculation.rewardAmount - systemFeeAmount;
    
    console.log(`📊 حساب رسوم النظام على المكافأة: المكافأة الأصلية=${rewardCalculation.rewardAmount}, رسوم النظام=${systemFeeAmount.toFixed(6)}, المكافأة النهائية=${finalRewardAmount.toFixed(6)}`);
    
    if (finalRewardAmount <= 0) {
      console.log(`⚠️ المكافأة النهائية صفر أو أقل بعد خصم رسوم النظام، تم إلغاء توزيع المكافأة`);
      return { hasReferral: false, rewardAmount: 0, netSystemCommission: commissionAmount };
    }

    // إنشاء سجل مكافأة الإحالة مع وضعها كـ "مخصومة من العمولة" وبعد خصم رسوم النظام
    await db.insert(referralRewards).values({
      txId: txId,
      referrerId: referrerId,
      referredUserId: referredUserId,
      commissionBase: commissionAmount.toString(),
      rewardAmount: finalRewardAmount.toString(),
      currency: currency, // استخدام نفس عملة العمولة
      status: 'paid',
      paidAt: new Date(),
      operationType: operationType,
      deductedFromCommission: rewardCalculation.rewardAmount.toString() // المبلغ المخصوم من العمولة قبل رسوم النظام
    });

    // إضافة المكافأة النهائية (بعد خصم رسوم النظام) إلى رصيد المُحيل
    await addReferralBalance(referrerId, currency, finalRewardAmount);

    // جلب بيانات المستخدمين للإشعارات وتسجيل المعاملات
    const referrerUser = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, referrerId))
      .limit(1);

    const referredUser = await db
      .select({ fullName: users.fullName })
      .from(users)
      .where(eq(users.id, referredUserId))
      .limit(1);

    // تسجيل المعاملة في كشف الحساب
    await logTransactionToStatement(
      referrerId,
      'referral_reward_received',
      currency,
      finalRewardAmount,
      'credit',
      referredUser[0]?.fullName || 'مستخدم محال',
      `REF-${txId}`,
      `مكافأة إحالة بعد خصم رسوم النظام (${(systemFeeRate * 100).toFixed(1)}%) - ${operationType}`,
      {
        operationType,
        referredUserId,
        commissionBase: commissionAmount,
        originalRewardAmount: rewardCalculation.rewardAmount,
        systemFeeRate,
        systemFeeAmount,
        finalRewardAmount,
        txId,
        deductedFromCommission: true
      }
    );

    if (referrerUser.length > 0 && referredUser.length > 0) {
      await db.insert(userNotifications).values({
        userId: referrerId,
        title: '🎁 مكافأة إحالة من عمولة النظام',
        body: `حصلت على ${finalRewardAmount.toFixed(2)} ${currency} بعد خصم رسوم النظام (${(systemFeeRate * 100).toFixed(1)}%) عبر ${referredUser[0].fullName}`,
        type: 'success',
        isRead: false
      });
    }

    console.log(`✅ تم توزيع مكافأة إحالة: ${finalRewardAmount.toFixed(6)} ${currency} للمستخدم ${referrerId} (بعد خصم رسوم النظام ${systemFeeAmount.toFixed(6)} ${currency})`);
    
    // إرجاع صافي عمولة النظام بعد خصم المكافأة النهائية (التي ستُدفع للمُحيل)
    const netSystemCommission = commissionAmount - finalRewardAmount;
    console.log(`💰 صافي عمولة النظام: ${commissionAmount} - ${finalRewardAmount} = ${netSystemCommission}`);
    return { hasReferral: true, rewardAmount: finalRewardAmount, netSystemCommission };
  } catch (error) {
    console.error('خطأ في توزيع مكافأة الإحالة الثابتة:', error);
    return { hasReferral: false, rewardAmount: 0, netSystemCommission: commissionAmount };
  }
}

/**
 * توزيع مكافأة الإحالة للمُحيل (النظام القديم)
 */
export async function allocateReferralReward(txId: number): Promise<boolean> {
  try {
    // التحقق من تفعيل النظام
    const enabledConfig = await getSetting('referral.enabled', { enabled: false });
    if (!enabledConfig.enabled) {
      return false;
    }

    // البحث عن عمولة النظام في سجلات العمولة
    const commissionResult = await db
      .select({
        userId: commissionLogs.userId,
        commissionAmount: commissionLogs.commissionAmount,
        currency: commissionLogs.commissionCurrency,
      })
      .from(commissionLogs)
      .where(and(
        eq(commissionLogs.sourceId, txId),
        eq(commissionLogs.action, 'system_commission') // أو أي نوع يمثل عمولة النظام
      ))
      .limit(1);

    if (commissionResult.length === 0) {
      return false; // لا توجد عمولة نظام
    }

    const commission = commissionResult[0];
    
    // التحقق من وجود مُحيل للمستخدم
    const userResult = await db
      .select({
        referredBy: users.referredBy,
        verified: users.verified
      })
      .from(users)
      .where(eq(users.id, commission.userId))
      .limit(1);

    if (userResult.length === 0 || !userResult[0].referredBy) {
      return false; // المستخدم غير مُحال أو لا يوجد مُحيل
    }

    const referrerId = userResult[0].referredBy;
    const userVerified = userResult[0].verified;

    // (اختياري) التحقق من توثيق المستخدم المُحال
    // يمكن تعطيل هذا الشرط حسب سياسة الموقع
    // if (!userVerified) {
    //   return false;
    // }

    // حساب مكافأة الإحالة الثابتة
    const commissionAmountNum = parseFloat(commission.commissionAmount.toString());
    const operationType = commission.currency === 'LYD' ? 'transfer_lyd' : 'transfer_usd';
    const rewardCalculation = await calculateFixedReferralReward(operationType, commissionAmountNum, commission.currency);
    const rewardAmount = rewardCalculation.rewardAmount;
    
    if (rewardAmount <= 0) {
      return false;
    }

    // التحقق من عدم وجود مكافأة مسبقة لنفس المعاملة
    const existingReward = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.txId, txId))
      .limit(1);

    if (existingReward.length > 0) {
      return false; // مكافأة موجودة مسبقاً
    }

    // إنشاء سجل مكافأة الإحالة
    await db.insert(referralRewards).values({
      txId,
      referrerId,
      referredUserId: commission.userId,
      commissionBase: commissionAmountNum.toString(),
      rewardAmount: rewardAmount.toString(),
      currency: commission.currency,
      status: 'paid',
      paidAt: new Date()
    });

    // إضافة المكافأة إلى رصيد المُحيل
    await addReferralBalance(referrerId, commission.currency, rewardAmount);

    console.log(`✅ تم توزيع مكافأة إحالة بقيمة ${rewardAmount} ${commission.currency} للمستخدم ${referrerId}`);
    return true;

  } catch (error) {
    console.error('خطأ في توزيع مكافأة الإحالة:', error);
    return false;
  }
}

/**
 * إضافة مكافأة إلى رصيد الإحالة للمستخدم
 */
export async function addReferralBalance(userId: number, currency: string, amount: number): Promise<boolean> {
  try {
    await db
      .insert(referralBalances)
      .values({
        userId,
        currency,
        amount: amount.toString()
      })
      .onConflictDoUpdate({
        target: [referralBalances.userId, referralBalances.currency],
        set: {
          amount: sql`${referralBalances.amount} + ${amount.toString()}`
        }
      });

    return true;
  } catch (error) {
    console.error('خطأ في إضافة رصيد الإحالة:', error);
    return false;
  }
}

/**
 * جلب رصيد مكافآت الإحالة للمستخدم
 */
export async function getReferralBalances(userId: number) {
  try {
    // العملات المدعومة في النظام
    const supportedCurrencies = ['LYD', 'USD', 'EUR', 'TRY', 'AED', 'EGP', 'TND', 'GBP'];
    
    const result = await db
      .select()
      .from(referralBalances)
      .where(eq(referralBalances.userId, userId));

    // إنشاء خريطة للأرصدة الموجودة
    const existingBalances = new Map(
      result.map(balance => [balance.currency, balance.amount])
    );

    // إرجاع جميع العملات المدعومة مع أرصدة افتراضية 0.00 للعملات غير الموجودة
    return supportedCurrencies.map(currency => ({
      currency,
      amount: existingBalances.get(currency) || '0.000000'
    }));
  } catch (error) {
    console.error('خطأ في جلب أرصدة الإحالة:', error);
    return [];
  }
}

/**
 * جلب إحصائيات الإحالة للمستخدم
 */
export async function getReferralStats(userId: number) {
  try {
    // عدد المُحالين
    const referredUsersResult = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .where(eq(users.referredBy, userId));

    const referredCount = referredUsersResult[0]?.count || 0;

    // إجمالي المكافآت حسب العملة
    const rewardsResult = await db
      .select({
        currency: referralRewards.currency,
        totalReward: sql<number>`SUM(${referralRewards.rewardAmount})`
      })
      .from(referralRewards)
      .where(eq(referralRewards.referrerId, userId))
      .groupBy(referralRewards.currency);

    return {
      referredCount,
      totalRewards: rewardsResult
    };
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الإحالة:', error);
    return {
      referredCount: 0,
      totalRewards: []
    };
  }
}

/**
 * جلب سجل مكافآت الإحالة للمستخدم
 */
export async function getReferralHistory(userId: number, limit: number = 50) {
  try {
    const result = await db
      .select({
        id: referralRewards.id,
        txId: referralRewards.txId,
        referredUserId: referralRewards.referredUserId,
        commissionBase: referralRewards.commissionBase,
        rewardAmount: referralRewards.rewardAmount,
        currency: referralRewards.currency,
        status: referralRewards.status,
        createdAt: referralRewards.createdAt,
        paidAt: referralRewards.paidAt,
        referredUserName: users.fullName
      })
      .from(referralRewards)
      .leftJoin(users, eq(users.id, referralRewards.referredUserId))
      .where(eq(referralRewards.referrerId, userId))
      .orderBy(desc(referralRewards.createdAt))
      .limit(limit);

    return result;
  } catch (error) {
    console.error('خطأ في جلب سجل مكافآت الإحالة:', error);
    return [];
  }
}

/**
 * تحويل رصيد مكافآت الإحالة إلى الرصيد الأساسي
 */
export async function transferReferralBalance(userId: number, currency: string, amount: number): Promise<boolean> {
  try {
    // التحقق من وجود رصيد كافي
    const balanceResult = await db
      .select({ amount: referralBalances.amount })
      .from(referralBalances)
      .where(and(
        eq(referralBalances.userId, userId),
        eq(referralBalances.currency, currency)
      ))
      .limit(1);

    if (balanceResult.length === 0) {
      return false; // لا يوجد رصيد
    }

    const currentBalance = parseFloat(balanceResult[0].amount.toString());
    if (currentBalance < amount) {
      return false; // رصيد غير كافي
    }

    // خصم من رصيد الإحالة
    await db
      .update(referralBalances)
      .set({
        amount: (currentBalance - amount).toString()
      })
      .where(and(
        eq(referralBalances.userId, userId),
        eq(referralBalances.currency, currency)
      ));

    // تسجيل عملية السحب من رصيد المكافآت (خصم)
    await logTransactionToStatement(
      userId,
      'referral_balance_withdrawal',
      currency,
      amount,
      'debit',
      'نظام المكافآت',
      `RW-${Date.now()}`,
      'سحب رصيد مكافآت إحالة',
      {
        withdrawalType: 'referral_balance',
        originalBalance: currentBalance
      }
    );

    // إضافة المبلغ للرصيد الرئيسي بالعملة الصحيحة
    await storage.createOrUpdateBalance({
      userId,
      currency,
      amount: amount.toString()
    });

    // تسجيل إضافة المبلغ للرصيد الرئيسي (إيداع)
    await logTransactionToStatement(
      userId,
      'referral_balance_deposit',
      currency,
      amount,
      'credit',
      'نظام المكافآت',
      `RD-${Date.now()}`,
      'إيداع مكافآت إحالة للرصيد الرئيسي',
      {
        depositType: 'referral_balance_transfer',
        originalBalance: currentBalance
      }
    );
    
    return true;
  } catch (error) {
    console.error('خطأ في تحويل رصيد الإحالة:', error);
    return false;
  }
}

/**
 * جلب إحصائيات الإحالة للمستخدم
 */
export async function getUserReferralStats(userId: number) {
  try {
    // جلب رمز الإحالة للمستخدم
    const userResult = await db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const referralCode = userResult[0]?.referralCode || '';

    // عدد الأشخاص الذين أحالهم
    const totalReferralsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.referredBy, userId));

    // إجمالي المكافآت
    const totalRewardsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${referralRewards.rewardAmount}), 0)` })
      .from(referralRewards)
      .where(and(
        eq(referralRewards.referrerId, userId),
        eq(referralRewards.status, 'paid')
      ));

    // المكافآت المعلقة
    const pendingRewardsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${referralRewards.rewardAmount}), 0)` })
      .from(referralRewards)
      .where(and(
        eq(referralRewards.referrerId, userId),
        eq(referralRewards.status, 'pending')
      ));

    // إحالات هذا الشهر
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyReferralsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(and(
        eq(users.referredBy, userId),
        sql`${users.createdAt} >= ${currentMonth}`
      ));

    return {
      referralCode,
      totalReferrals: totalReferralsResult[0]?.count || 0,
      totalRewards: totalRewardsResult[0]?.total || 0,
      pendingRewards: pendingRewardsResult[0]?.total || 0,
      monthlyReferrals: monthlyReferralsResult[0]?.count || 0
    };
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الإحالة:', error);
    return {
      referralCode: '',
      totalReferrals: 0,
      totalRewards: 0,
      pendingRewards: 0,
      monthlyReferrals: 0
    };
  }
}

/**
 * جلب قائمة مكافآت الإحالة للمستخدم
 */
export async function getUserReferralRewards(userId: number) {
  try {
    const result = await db
      .select({
        id: referralRewards.id,
        amount: referralRewards.rewardAmount,
        currency: referralRewards.currency,
        status: referralRewards.status,
        createdAt: referralRewards.createdAt,
        paidAt: referralRewards.paidAt,
        fromUser: users.fullName,
        rewardType: sql<string>`'direct'`
      })
      .from(referralRewards)
      .leftJoin(users, eq(users.id, referralRewards.referredUserId))
      .where(eq(referralRewards.referrerId, userId))
      .orderBy(desc(referralRewards.createdAt));

    return result;
  } catch (error) {
    console.error('خطأ في جلب مكافآت الإحالة:', error);
    return [];
  }
}

/**
 * جلب قائمة الأشخاص الذين أحالهم المستخدم
 */
export async function getUserReferrals(userId: number) {
  try {
    const result = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        createdAt: users.createdAt,
        verified: users.verified
      })
      .from(users)
      .where(eq(users.referredBy, userId))
      .orderBy(desc(users.createdAt));

    return result;
  } catch (error) {
    console.error('خطأ في جلب قائمة الإحالات:', error);
    return [];
  }
}

/**
 * معالجة مكافأة الإحالة عند تسجيل مستخدم جديد
 * هذه الدالة تُستدعى عند تسجيل مستخدم جديد تم إحالته
 */
export async function processNewUserReferral(newUserId: number, referrerId: number): Promise<boolean> {
  try {
    // التحقق من تفعيل نظام الإحالة
    const enabledConfig = await getSetting('referral.enabled', { enabled: false });
    if (!enabledConfig.enabled) {
      console.log('نظام الإحالة معطل');
      return false;
    }

    // التحقق من صحة المعطيات
    if (!newUserId || !referrerId || newUserId === referrerId) {
      console.log('معطيات الإحالة غير صحيحة');
      return false;
    }

    // التحقق من وجود المستخدمين
    const usersResult = await db
      .select({
        id: users.id,
        fullName: users.fullName
      })
      .from(users)
      .where(sql`${users.id} IN (${newUserId}, ${referrerId})`);

    if (usersResult.length !== 2) {
      console.log('المستخدمون غير موجودون');
      return false;
    }

    // إرسال إشعار للمُحيل
    const newUser = usersResult.find(u => u.id === newUserId);
    const referrer = usersResult.find(u => u.id === referrerId);

    if (newUser && referrer) {
      await db.insert(userNotifications).values({
        userId: referrerId,
        title: '🎉 إحالة جديدة مُسجلة',
        body: `تم تسجيل ${newUser.fullName} عبر رمز الإحالة الخاص بك. ستحصل على مكافآت عند إجراء أول معاملة.`,
        type: 'info',
        isRead: false
      });

      console.log(`✅ تم إشعار المُحيل ${referrer.fullName} بالإحالة الجديدة ${newUser.fullName}`);
    }

    return true;
  } catch (error) {
    console.error('خطأ في معالجة مكافأة الإحالة للمستخدم الجديد:', error);
    return false;
  }
}