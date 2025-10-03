import { generateKeyPairSync, createHash } from 'crypto';
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { db } from '../db';
import { signingKeys } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export interface CanonicalTransaction {
  txn_id: string;
  txn_type: string;
  executed_at: string;
  timezone: string;
  amount_src: { ccy: string; value: string };
  amount_dst?: { ccy: string; value: string };
  fx_rate?: string;
  fees: Array<{ name: string; ccy: string; value: string }>;
  taxes: Array<{ name: string; ccy: string; value: string }>;
  net_to_beneficiary: { ccy: string; value: string };
  sender_ref: string;
  beneficiary_ref: string;
  office_ref: string;
  version: number;
}

export class CryptoService {
  /**
   * إنشاء تمثيل قانوني (canonical) للمعاملة
   */
  static createCanonicalJson(transaction: CanonicalTransaction): string {
    // ترتيب المفاتيح أبجدياً لضمان الثبات
    const canonical = {
      amount_dst: transaction.amount_dst,
      amount_src: transaction.amount_src,
      beneficiary_ref: transaction.beneficiary_ref,
      executed_at: transaction.executed_at,
      fees: transaction.fees.sort((a, b) => a.name.localeCompare(b.name)),
      fx_rate: transaction.fx_rate,
      net_to_beneficiary: transaction.net_to_beneficiary,
      office_ref: transaction.office_ref,
      sender_ref: transaction.sender_ref,
      taxes: transaction.taxes.sort((a, b) => a.name.localeCompare(b.name)),
      timezone: transaction.timezone,
      txn_id: transaction.txn_id,
      txn_type: transaction.txn_type,
      version: transaction.version
    };

    // إزالة الحقول الفارغة أو غير المعرفة
    Object.keys(canonical).forEach(key => {
      if (canonical[key] === undefined || canonical[key] === null) {
        delete canonical[key];
      }
    });

    return JSON.stringify(canonical);
  }

  /**
   * حساب SHA-256 hash للتمثيل القانوني
   */
  static calculateHash(canonicalJson: string): string {
    const hash = createHash('sha256').update(canonicalJson, 'utf8').digest();
    return hash.toString('base64url');
  }

  /**
   * إنشاء مفتاح توقيع جديد
   */
  static async generateSigningKey(): Promise<{ kid: string; publicKey: string; privateKey: string }> {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    const kid = `key_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return { kid, publicKey, privateKey };
  }

  /**
   * الحصول على المفتاح النشط الحالي
   */
  static async getActiveSigningKey(): Promise<{ kid: string; privateKey: string } | null> {
    try {
      const [activeKey] = await db
        .select({ kid: signingKeys.kid, privateKey: signingKeys.privateKey })
        .from(signingKeys)
        .where(and(eq(signingKeys.active, true)))
        .limit(1);

      return activeKey || null;
    } catch (error) {
      console.error('خطأ في الحصول على المفتاح النشط:', error);
      return null;
    }
  }

  /**
   * إنشاء مفتاح جديد وحفظه في قاعدة البيانات
   */
  static async createAndStoreSigningKey(): Promise<string> {
    const { kid, publicKey, privateKey } = await this.generateSigningKey();

    // إلغاء تفعيل المفاتيح السابقة
    await db
      .update(signingKeys)
      .set({ active: false })
      .where(eq(signingKeys.active, true));

    // إدراج المفتاح الجديد
    await db.insert(signingKeys).values({
      kid,
      publicKey,
      privateKey,
      active: true,
      algorithm: 'RS256',
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 180 يوم
    });

    return kid;
  }

  /**
   * إنشاء JWS token
   */
  static async createJWS(payload: any): Promise<string> {
    let activeKey = await this.getActiveSigningKey();

    // إنشاء مفتاح جديد إذا لم يوجد
    if (!activeKey) {
      const kid = await this.createAndStoreSigningKey();
      activeKey = await this.getActiveSigningKey();
      if (!activeKey) {
        throw new Error('فشل في إنشاء مفتاح التوقيع');
      }
    }

    const privateKey = await importPKCS8(activeKey.privateKey, 'RS256');

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ 
        alg: 'RS256', 
        kid: activeKey.kid,
        typ: 'JWT' 
      })
      .setIssuedAt()
      .setExpirationTime('1y')
      .setIssuer('exchange-platform')
      .setAudience('receipt-verification')
      .sign(privateKey);

    return jwt;
  }

  /**
   * التحقق من صحة JWS token
   */
  static async verifyJWS(token: string): Promise<{ valid: boolean; payload?: any; error?: string }> {
    try {
      // استخراج معرف المفتاح من header
      const [header] = token.split('.');
      const decodedHeader = JSON.parse(Buffer.from(header, 'base64url').toString());
      const kid = decodedHeader.kid;

      if (!kid) {
        return { valid: false, error: 'معرف المفتاح مفقود' };
      }

      // الحصول على المفتاح العام من قاعدة البيانات
      const [signingKey] = await db
        .select({ publicKey: signingKeys.publicKey })
        .from(signingKeys)
        .where(eq(signingKeys.kid, kid))
        .limit(1);

      if (!signingKey) {
        return { valid: false, error: 'مفتاح التوقيع غير موجود' };
      }

      const publicKey = await importSPKI(signingKey.publicKey, 'RS256');
      const { payload } = await jwtVerify(token, publicKey, {
        issuer: 'exchange-platform',
        audience: 'receipt-verification'
      });

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * الحصول على JWKS للتحقق الخارجي
   */
  static async getJWKS(): Promise<{ keys: any[] }> {
    try {
      const activeKeys = await db
        .select({
          kid: signingKeys.kid,
          publicKey: signingKeys.publicKey,
          algorithm: signingKeys.algorithm
        })
        .from(signingKeys)
        .where(eq(signingKeys.active, true));

      const keys = await Promise.all(
        activeKeys.map(async (key) => {
          const publicKey = await importSPKI(key.publicKey, 'RS256');
          return {
            kty: 'RSA',
            kid: key.kid,
            use: 'sig',
            alg: key.algorithm,
            // هنا يجب تحويل المفتاح العام إلى تنسيق JWK
            // للبساطة، سنعيد المفتاح بتنسيق PEM
            x5c: [key.publicKey.replace(/-----BEGIN PUBLIC KEY-----|\n|-----END PUBLIC KEY-----/g, '')]
          };
        })
      );

      return { keys };
    } catch (error) {
      console.error('خطأ في إنشاء JWKS:', error);
      return { keys: [] };
    }
  }
}