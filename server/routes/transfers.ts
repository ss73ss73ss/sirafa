import { Request, Response } from 'express';
import { db } from '../db';
import { AuthRequest } from '../auth-middleware';
import { sql } from 'drizzle-orm';

/**
 * API لجلب تفاصيل التحويل بمعرف المعاملة
 */
export async function getTransferDetails(req: AuthRequest, res: Response) {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    // جلب تفاصيل المعاملة مع معلومات الأطراف
    const result = await db.execute(sql`
      SELECT 
        t.id as transaction_id,
        t.txn_type,
        t.amount,
        t.currency,
        t.commission,
        t.status,
        t.created_at,
        t.note,
        tr.id as transfer_id,
        tr.created_at as transfer_date,
        sender.id as sender_id,
        sender.full_name as sender_name,
        sender.account_number as sender_account,
        receiver.id as receiver_id,
        receiver.full_name as receiver_name,
        receiver.account_number as receiver_account
      FROM transactions t
      LEFT JOIN transfers tr ON t.related_transfer_id = tr.id
      LEFT JOIN users sender ON tr.sender_id = sender.id
      LEFT JOIN users receiver ON tr.receiver_id = receiver.id
      WHERE t.id = ${transactionId}
        AND (tr.sender_id = ${userId} OR tr.receiver_id = ${userId})
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "المعاملة غير موجودة أو ليس لديك صلاحية للوصول إليها" });
    }

    const transaction = result.rows[0];

    // تنسيق البيانات للإيصال
    const receiptData = {
      id: transaction.transfer_id,
      transferId: transaction.transfer_id,
      transactionId: transaction.transaction_id,
      fromUser: {
        id: transaction.sender_id,
        fullName: transaction.sender_name,
        accountNumber: transaction.sender_account
      },
      toUser: {
        id: transaction.receiver_id,
        fullName: transaction.receiver_name,
        accountNumber: transaction.receiver_account
      },
      currency: transaction.currency,
      amount: parseFloat(transaction.amount),
      fee: parseFloat(transaction.commission || '0'),
      netAmount: parseFloat(transaction.amount),
      status: transaction.status === 'completed' ? 'مكتمل' : transaction.status,
      ref: `INT-${transaction.transfer_id}`,
      createdAt: transaction.transfer_date || transaction.created_at,
      note: transaction.note,
      hash: `hash_${transaction.transaction_id}_${Date.now()}`
    };

    res.json(receiptData);

  } catch (error) {
    console.error('خطأ في جلب تفاصيل التحويل:', error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب تفاصيل التحويل" });
  }
}