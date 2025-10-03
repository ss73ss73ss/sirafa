/**
 * مولد الأرقام المرجعية للعمليات المالية
 */

export class ReferenceGenerator {
  /**
   * توليد رقم مرجعي فريد للتحويلات الداخلية
   */
  static generateInternalTransferReference(transferId: number, direction: 'OUT' | 'IN'): string {
    const timestamp = Date.now();
    return `REF-INT-${transferId}-${direction}`;
  }

  /**
   * توليد رقم مرجعي للتحويلات بين المكاتب
   */
  static generateInterOfficeTransferReference(transferId: number): string {
    return `REF-IOT-${transferId}-${Date.now().toString().slice(-6)}`;
  }

  /**
   * توليد رقم مرجعي للتحويلات الدولية
   */
  static generateInternationalTransferReference(transferId: number): string {
    return `REF-ITL-${transferId}-${Date.now().toString().slice(-6)}`;
  }

  /**
   * توليد رقم مرجعي لعمليات السوق
   */
  static generateMarketTransactionReference(transactionId: number): string {
    return `REF-MKT-${transactionId}-${Date.now().toString().slice(-6)}`;
  }

  /**
   * توليد رقم مرجعي عام للمعاملات
   */
  static generateTransactionReference(transactionId: number, type: string): string {
    const typePrefix = type.toUpperCase().substring(0, 3);
    return `REF-${typePrefix}-${transactionId}-${Date.now().toString().slice(-6)}`;
  }

  /**
   * التحقق من صحة تنسيق الرقم المرجعي
   */
  static validateReferenceFormat(reference: string): boolean {
    const pattern = /^REF-[A-Z]{3}-\d+-([A-Z0-9]+)$/;
    return pattern.test(reference);
  }

  /**
   * استخراج معرف العملية من الرقم المرجعي
   */
  static extractTransactionId(reference: string): number | null {
    const match = reference.match(/^REF-[A-Z]{3}-(\d+)-/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * استخراج نوع العملية من الرقم المرجعي
   */
  static extractTransactionType(reference: string): string | null {
    const match = reference.match(/^REF-([A-Z]{3})-/);
    return match ? match[1] : null;
  }
}