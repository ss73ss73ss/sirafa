import { db } from './db';
import { eq, sql, and, desc } from 'drizzle-orm';
import { 
  userPoints, 
  userBadges, 
  pointsHistory, 
  badgeTypes, 
  rewards,
  userRewards,
  rewardSettings,
  users
} from '@shared/schema';

interface PointsEarnedEvent {
  userId: number;
  points: number;
  action: string;
  description: string;
  descriptionAr: string;
  referenceId?: string;
  referenceType?: string;
}

export class RewardsService {
  
  // إنشاء أو تحديث نقاط المستخدم
  async initializeUserPoints(userId: number) {
    try {
      const existing = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
      
      if (existing.length === 0) {
        await db.insert(userPoints).values({
          userId,
          totalPoints: 0,
          availablePoints: 0,
          level: 1,
          streakDays: 0,
          lastActivityDate: new Date(),
        });
      }
    } catch (error) {
      console.error('Error initializing user points:', error);
    }
  }

  // إضافة نقاط للمستخدم
  async awardPoints(event: PointsEarnedEvent) {
    try {
      // التأكد من وجود سجل نقاط المستخدم
      await this.initializeUserPoints(event.userId);

      // إضافة النقاط
      await db.transaction(async (tx) => {
        // تحديث نقاط المستخدم
        await tx.update(userPoints)
          .set({
            totalPoints: sql`total_points + ${event.points}`,
            availablePoints: sql`available_points + ${event.points}`,
            updatedAt: new Date(),
          })
          .where(eq(userPoints.userId, event.userId));

        // إضافة سجل في تاريخ النقاط
        await tx.insert(pointsHistory).values({
          userId: event.userId,
          points: event.points,
          action: event.action,
          description: event.description,
          descriptionAr: event.descriptionAr,
          referenceId: event.referenceId,
          referenceType: event.referenceType,
        });
      });

      // فحص للشارات الجديدة
      await this.checkForNewBadges(event.userId);
      
      // فحص ترقية المستوى
      await this.checkLevelUp(event.userId);

      console.log(`✅ تم منح ${event.points} نقطة للمستخدم ${event.userId} - ${event.descriptionAr}`);
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  }

  // فحص الشارات الجديدة
  async checkForNewBadges(userId: number) {
    try {
      const userPointsData = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
      if (!userPointsData.length) return;

      const userData = userPointsData[0];
      
      // فحص الشارات المتاحة
      const availableBadges = await db.select().from(badgeTypes).where(eq(badgeTypes.active, true));
      
      for (const badge of availableBadges) {
        // تحقق إذا كان المستخدم يملك الشارة بالفعل
        const existingBadge = await db.select()
          .from(userBadges)
          .where(and(
            eq(userBadges.userId, userId),
            eq(userBadges.badgeTypeId, badge.id)
          ))
          .limit(1);

        if (existingBadge.length > 0) continue;

        // فحص شروط الحصول على الشارة
        const shouldAward = await this.checkBadgeConditions(userId, badge, userData);
        
        if (shouldAward) {
          await this.awardBadge(userId, badge.id);
        }
      }
    } catch (error) {
      console.error('Error checking for new badges:', error);
    }
  }

  // فحص شروط الشارة
  async checkBadgeConditions(userId: number, badge: any, userPointsData: any): Promise<boolean> {
    try {
      // شروط النقاط
      if (badge.pointsRequired > userPointsData.totalPoints) {
        return false;
      }

      // شروط خاصة بكل شارة
      switch (badge.name) {
        case 'first_transfer':
          const transfers = await db.execute(sql`SELECT COUNT(*) as count FROM transfers WHERE sender_id = ${userId}`);
          return (transfers.rows[0] as any).count >= 1;

        case 'transfer_master':
          const transferCount = await db.execute(sql`SELECT COUNT(*) as count FROM transfers WHERE sender_id = ${userId}`);
          return (transferCount.rows[0] as any).count >= 10;

        case 'daily_user':
          return userPointsData.streakDays >= 7;

        case 'loyalty_member':
          return userPointsData.streakDays >= 30;

        case 'level_up':
          return userPointsData.level >= 5;

        case 'early_adopter':
          const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE id <= ${userId}`);
          return (userCount.rows[0] as any).count <= 100;

        case 'active_trader':
          const tradesCount = await db.execute(sql`SELECT COUNT(*) as count FROM market_transactions WHERE buyer_id = ${userId}`);
          return (tradesCount.rows[0] as any).count >= 5;

        case 'trader_pro':
          const proTradesCount = await db.execute(sql`SELECT COUNT(*) as count FROM market_transactions WHERE buyer_id = ${userId}`);
          return (proTradesCount.rows[0] as any).count >= 25;

        case 'offer_creator':
          const offersCount = await db.execute(sql`SELECT COUNT(*) as count FROM market_offers WHERE user_id = ${userId}`);
          return (offersCount.rows[0] as any).count >= 3;

        case 'city_connector':
          const cityTransfersCount = await db.execute(sql`SELECT COUNT(*) as count FROM city_transfers WHERE sender_id = ${userId}`);
          return (cityTransfersCount.rows[0] as any).count >= 5;

        case 'global_sender':
          const intlTransfersCount = await db.execute(sql`SELECT COUNT(*) as count FROM international_transfers_new WHERE sender_agent_id = ${userId}`);
          return (intlTransfersCount.rows[0] as any).count >= 3;

        default:
          return true; // إذا لم تكن هناك شروط خاصة
      }
    } catch (error) {
      console.error('Error checking badge conditions:', error);
      return false;
    }
  }

  // منح شارة للمستخدم
  async awardBadge(userId: number, badgeTypeId: number) {
    try {
      await db.insert(userBadges).values({
        userId,
        badgeTypeId,
        earnedAt: new Date(),
        isVisible: true,
        notificationSent: false,
      });

      // إضافة إشعار للمستخدم
      const badge = await db.select().from(badgeTypes).where(eq(badgeTypes.id, badgeTypeId)).limit(1);
      
      if (badge.length > 0) {
        // إنشاء إشعار للمستخدم عن الشارة الجديدة (معطل مؤقتاً)
        // try {
        //   const { createUserNotification } = await import('./storage');
        //   
        //   await createUserNotification({
        //     userId,
        //     title: "🏆 حصلت على شارة جديدة!",
        //     body: `تهانينا! لقد حصلت على شارة "${badge[0].nameAr}"`,
        //     type: "success",
        //     isRead: false
        //   });
        //   
        //   console.log(`🎉 تم إرسال إشعار الشارة الجديدة للمستخدم ${userId}`);
        // } catch (error) {
        //   console.error('خطأ في إرسال إشعار الشارة:', error);
        // }
        console.log(`🏆 المستخدم ${userId} حصل على شارة جديدة: ${badge[0].nameAr}`);
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  }

  // فحص ترقية المستوى
  async checkLevelUp(userId: number) {
    try {
      const settings = await this.getSettings();
      const userPointsData = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
      
      if (!userPointsData.length) return;

      const userData = userPointsData[0];
      const newLevel = Math.floor(userData.totalPoints / (settings.pointsPerLevel || 100)) + 1;

      if (newLevel > userData.level) {
        await db.update(userPoints)
          .set({
            level: newLevel,
            updatedAt: new Date(),
          })
          .where(eq(userPoints.userId, userId));

        // منح نقاط إضافية للترقية
        await this.awardPoints({
          userId,
          points: settings.levelUpBonus || 50,
          action: 'level_up',
          description: `Level up to ${newLevel}`,
          descriptionAr: `ترقية للمستوى ${newLevel}`,
          referenceId: newLevel.toString(),
          referenceType: 'level',
        });

        console.log(`🆙 المستخدم ${userId} ترقى للمستوى ${newLevel}`);
      }
    } catch (error) {
      console.error('Error checking level up:', error);
    }
  }

  // تحديث سلسلة الأيام المتتالية
  async updateStreakDays(userId: number) {
    try {
      await this.initializeUserPoints(userId);
      
      const userPointsData = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
      if (!userPointsData.length) return;

      const userData = userPointsData[0];
      const today = new Date();
      const lastActivity = userData.lastActivityDate ? new Date(userData.lastActivityDate) : new Date();
      
      // حساب الفرق بالأيام
      const diffTime = today.getTime() - lastActivity.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let newStreakDays = userData.streakDays;
      
      if (diffDays === 1) {
        // يوم واحد منذ آخر نشاط - استمرار السلسلة
        newStreakDays += 1;
      } else if (diffDays > 1) {
        // أكثر من يوم - انقطاع السلسلة
        newStreakDays = 1;
      }
      // إذا كان 0 أيام (نفس اليوم) - لا تغيير

      await db.update(userPoints)
        .set({
          streakDays: newStreakDays,
          lastActivityDate: today,
          updatedAt: new Date(),
        })
        .where(eq(userPoints.userId, userId));

      return newStreakDays;
    } catch (error) {
      console.error('Error updating streak days:', error);
      return 0;
    }
  }

  // الحصول على إعدادات النظام
  async getSettings() {
    try {
      const settings = await db.select().from(rewardSettings).limit(1);
      return settings[0] || {
        transferPoints: 10,
        loginPoints: 5,
        streakBonusPoints: 15,
        levelUpBonus: 100,
        pointsPerLevel: 1000,
        maxStreakDays: 30,
        systemActive: true,
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        transferPoints: 10,
        loginPoints: 5,
        streakBonusPoints: 15,
        levelUpBonus: 100,
        pointsPerLevel: 1000,
        maxStreakDays: 30,
        systemActive: true,
      };
    }
  }

  // الحصول على نقاط ومستوى المستخدم
  async getUserProgress(userId: number) {
    try {
      await this.initializeUserPoints(userId);
      
      const userPointsData = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
      const userBadgesData = await db.select({
        badge: badgeTypes,
        earnedAt: userBadges.earnedAt,
        isVisible: userBadges.isVisible,
      })
      .from(userBadges)
      .innerJoin(badgeTypes, eq(userBadges.badgeTypeId, badgeTypes.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));

      const pointsHistoryData = await db.select()
        .from(pointsHistory)
        .where(eq(pointsHistory.userId, userId))
        .orderBy(desc(pointsHistory.createdAt))
        .limit(20);

      return {
        points: userPointsData[0] || null,
        badges: userBadgesData,
        history: pointsHistoryData,
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      return {
        points: null,
        badges: [],
        history: [],
      };
    }
  }

  // استبدال مكافأة
  async redeemReward(userId: number, rewardId: number) {
    try {
      const reward = await db.select().from(rewards).where(eq(rewards.id, rewardId)).limit(1);
      if (!reward.length) {
        throw new Error('المكافأة غير موجودة');
      }

      const rewardData = reward[0];
      
      if (!rewardData.active) {
        throw new Error('المكافأة غير متاحة');
      }

      const userPointsData = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
      if (!userPointsData.length || userPointsData[0].availablePoints < rewardData.pointsCost) {
        throw new Error('نقاط غير كافية');
      }

      // فحص الحد الأقصى للاستبدال
      if (rewardData.maxRedemptions && (rewardData.currentRedemptions || 0) >= rewardData.maxRedemptions) {
        throw new Error('تم استنفاد الحد الأقصى للاستبدال');
      }

      // فحص تاريخ الانتهاء
      if (rewardData.validUntil && new Date() > new Date(rewardData.validUntil)) {
        throw new Error('المكافأة منتهية الصلاحية');
      }

      const redemptionCode = `RWD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      await db.transaction(async (tx) => {
        // خصم النقاط
        await tx.update(userPoints)
          .set({
            availablePoints: sql`available_points - ${rewardData.pointsCost}`,
            updatedAt: new Date(),
          })
          .where(eq(userPoints.userId, userId));

        // إضافة سجل استبدال
        await tx.insert(userRewards).values({
          userId,
          rewardId,
          pointsSpent: rewardData.pointsCost,
          status: 'active',
          redemptionCode,
          expiresAt: rewardData.validUntil,
        });

        // تحديث عداد الاستبدال
        await tx.update(rewards)
          .set({
            currentRedemptions: sql`current_redemptions + 1`,
          })
          .where(eq(rewards.id, rewardId));

        // إضافة سجل في تاريخ النقاط
        await tx.insert(pointsHistory).values({
          userId,
          points: -rewardData.pointsCost,
          action: 'reward_redeemed',
          description: `Redeemed: ${rewardData.name}`,
          descriptionAr: `استبدال: ${rewardData.nameAr}`,
          referenceId: redemptionCode,
          referenceType: 'reward',
        });
      });

      return { redemptionCode, reward: rewardData };
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  // وظيفة منح النقاط لتسجيل الدخول اليومي
  async awardDailyLoginPoints(userId: number) {
    try {
      const settings = await this.getSettings();
      const today = new Date().toDateString();
      
      // تحقق إذا تم منح النقاط لهذا اليوم بالفعل
      const todayLogin = await db.select()
        .from(pointsHistory)
        .where(and(
          eq(pointsHistory.userId, userId),
          eq(pointsHistory.action, 'daily_login'),
          sql`DATE(created_at) = DATE(${today})`
        ))
        .limit(1);

      if (todayLogin.length > 0) {
        return; // تم منح النقاط بالفعل اليوم
      }

      // تحديث تسلسل الأيام
      await this.updateDailyStreak(userId);

      // منح النقاط
      await this.awardPoints({
        userId,
        points: settings.loginPoints || 5,
        action: 'daily_login',
        description: 'Daily login bonus',
        descriptionAr: 'مكافأة تسجيل الدخول اليومي',
        referenceId: today,
        referenceType: 'daily_login',
      });

      console.log(`✅ تم منح نقاط تسجيل الدخول اليومي للمستخدم ${userId}`);
    } catch (error) {
      console.error('Error awarding daily login points:', error);
    }
  }

  // دالة آمنة لمنح النقاط اليومية مع حماية من التكرار
  async awardDailyLoginPointsSafe(userId: number, userIP?: string) {
    try {
      const settings = await this.getSettings();
      
      // استخدام timezone Libya لضمان دقة التاريخ
      const now = new Date();
      const libyaTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Tripoli"}));
      const today = libyaTime.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      return await db.transaction(async (tx) => {
        // فحص محكم للتأكد من عدم وجود مكافأة يومية مسبقة
        const existingReward = await tx.select()
          .from(pointsHistory)
          .where(and(
            eq(pointsHistory.userId, userId),
            eq(pointsHistory.action, 'daily_login'),
            sql`DATE(created_at AT TIME ZONE 'Africa/Tripoli') = ${today}`
          ))
          .limit(1);

        if (existingReward.length > 0) {
          console.log(`⚠️ محاولة للحصول على مكافأة يومية مكررة - المستخدم: ${userId}, IP: ${userIP || 'غير معروف'}`);
          return {
            success: false,
            message: 'تم الحصول على المكافأة اليومية بالفعل'
          };
        }

        // التأكد من تهيئة نقاط المستخدم
        await this.initializeUserPoints(userId);

        // تحديث تسلسل الأيام
        const streakDays = await this.updateStreakDays(userId);

        const loginPoints = settings.loginPoints || 5;
        const streakBonus = settings.streakBonusPoints || 15;
        const currentStreakDays = streakDays || 0;

        // منح نقاط تسجيل الدخول اليومي
        await tx.update(userPoints)
          .set({
            totalPoints: sql`total_points + ${loginPoints}`,
            availablePoints: sql`available_points + ${loginPoints}`,
            updatedAt: new Date(),
          })
          .where(eq(userPoints.userId, userId));

        // إضافة سجل في تاريخ النقاط
        await tx.insert(pointsHistory).values({
          userId,
          points: loginPoints,
          action: 'daily_login',
          description: 'Daily login bonus',
          descriptionAr: 'مكافأة تسجيل الدخول اليومي',
          referenceId: today,
          referenceType: 'daily_login',
        });

        let totalPointsAwarded = loginPoints;
        let bonusMessage = '';

        // مكافأة إضافية للسلسلة الطويلة (كل 7 أيام)
        if (currentStreakDays > 0 && currentStreakDays % 7 === 0) {
          await tx.update(userPoints)
            .set({
              totalPoints: sql`total_points + ${streakBonus}`,
              availablePoints: sql`available_points + ${streakBonus}`,
              updatedAt: new Date(),
            })
            .where(eq(userPoints.userId, userId));

          await tx.insert(pointsHistory).values({
            userId,
            points: streakBonus,
            action: 'streak_bonus',
            description: `${currentStreakDays} days streak bonus`,
            descriptionAr: `مكافأة سلسلة ${currentStreakDays} يوم`,
            referenceId: currentStreakDays.toString(),
            referenceType: 'streak',
          });

          totalPointsAwarded += streakBonus;
          bonusMessage = ` + ${streakBonus} نقطة مكافأة سلسلة!`;
        }

        console.log(`✅ منح ${totalPointsAwarded} نقطة للمستخدم ${userId} - تسجيل دخول يومي آمن`);

        return {
          success: true,
          message: `تم منح ${loginPoints} نقطة${bonusMessage}`,
          data: { 
            streakDays: currentStreakDays,
            pointsAwarded: totalPointsAwarded,
            loginPoints: loginPoints,
            bonusPoints: currentStreakDays % 7 === 0 ? streakBonus : 0
          }
        };
      });

    } catch (error) {
      console.error('خطأ في منح النقاط اليومية الآمنة:', error);
      return {
        success: false,
        message: 'حدث خطأ في منح المكافأة اليومية'
      };
    }
  }

  // تحديث تسلسل الأيام
  async updateDailyStreak(userId: number) {
    try {
      const userData = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
      
      if (userData.length === 0) return;

      const user = userData[0];
      const today = new Date();
      const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : new Date();
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      let newStreak = user.streakDays;
      
      if (daysDiff === 1) {
        // يوم متتالي - زيادة التسلسل
        newStreak = user.streakDays + 1;
      } else if (daysDiff > 1) {
        // انقطع التسلسل - إعادة البدء
        newStreak = 1;
      }
      // إذا كان daysDiff === 0 فهذا يعني نفس اليوم، لا نغير شيء

      await db.update(userPoints)
        .set({
          streakDays: newStreak,
          lastActivityDate: today,
        })
        .where(eq(userPoints.userId, userId));

    } catch (error) {
      console.error('Error updating daily streak:', error);
    }
  }
}

export const rewardsService = new RewardsService();