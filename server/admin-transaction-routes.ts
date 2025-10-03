import { Express } from 'express';
import { AdminTransactionService, TransactionType, TransactionStatus } from './admin-transactions';
import { AdminTransactionsFixed } from './admin-transactions-fixed';
import { UnifiedAdminTransactions } from './unified-admin-transactions';
import { pool } from './db';

// دوال مساعدة للتصدير
async function generateTransactionsCSV(transactions: any[]): Promise<string> {
  if (transactions.length === 0) {
    return '';
  }

  const headers = [
    'الرقم المرجعي',
    'النوع',
    'الحالة',
    'تاريخ الإنشاء',
    'تاريخ التنفيذ',
    'المستخدم',
    'من حساب',
    'إلى حساب',
    'المبلغ',
    'العملة',
    'صافي المبلغ',
    'العمولة',
    'القناة',
    'مستوى KYC',
    'درجة المخاطرة',
    'الملاحظات'
  ];

  const csvRows = [headers.join(',')];

  for (const tx of transactions) {
    const row = [
      `"${tx.refNo || ''}"`,
      `"${tx.type || ''}"`,
      `"${tx.status || ''}"`,
      `"${tx.createdAt || ''}"`,
      `"${tx.executedAt || ''}"`,
      `"${tx.userName || ''}"`,
      `"${tx.fromAccountId || ''}"`,
      `"${tx.toAccountId || ''}"`,
      `"${tx.amount || '0'}"`,
      `"${tx.currency || ''}"`,
      `"${tx.netAmount || '0'}"`,
      `"${tx.feeSystem || '0'}"`,
      `"${tx.channel || ''}"`,
      `"${tx.kycLevel || ''}"`,
      `"${tx.riskScore || ''}"`,
      `"${tx.notes || ''}"`
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

async function generateTransactionsPDF(transactions: any[]): Promise<Buffer> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  
  try {
    // إنشاء مستند PDF جديد
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // حجم A4 بالنقاط
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // إعدادات الصفحة
    const fontSize = 10;
    const lineHeight = 14;
    let yPosition = 750;
    const margin = 50;
    
    // عنوان الوثيقة
    page.drawText('تقرير المعاملات - منصة الصرافة', {
      x: margin,
      y: yPosition,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 30;
    
    // معلومات التاريخ
    const currentDate = new Date().toLocaleDateString('ar-EG');
    page.drawText(`تاريخ التقرير: ${currentDate}`, {
      x: margin,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    yPosition -= 20;
    page.drawText(`عدد المعاملات: ${transactions.length}`, {
      x: margin,
      y: yPosition,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    yPosition -= 30;
    
    // عناوين الأعمدة
    const headers = ['ID', 'Reference', 'Type', 'Status', 'Date', 'Amount', 'Currency', 'User', 'Source'];
    let xPosition = margin;
    const columnWidth = (612 - 2 * margin) / headers.length;
    
    headers.forEach((header, index) => {
      page.drawText(header, {
        x: xPosition + (index * columnWidth),
        y: yPosition,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });
    
    yPosition -= lineHeight;
    
    // خط فاصل تحت العناوين
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: 612 - margin, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 10;
    
    // بيانات المعاملات
    transactions.forEach((tx, index) => {
      if (yPosition < 80) {
        // إضافة صفحة جديدة إذا انتهت المساحة
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = 750;
        // إعادة رسم العناوين في الصفحة الجديدة
        headers.forEach((header, headerIndex) => {
          newPage.drawText(header, {
            x: margin + (headerIndex * columnWidth),
            y: yPosition,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        });
        yPosition -= lineHeight + 10;
      }
      
      const rowData = [
        tx.id?.toString().substring(0, 8) || '',
        tx.refNo?.substring(0, 10) || '',
        tx.type?.substring(0, 12) || '',
        tx.status?.substring(0, 10) || '',
        tx.createdAt?.substring(0, 10) || '',
        `${tx.amount || '0'}`,
        tx.currency || '',
        tx.userName?.substring(0, 15) || '',
        tx.source?.substring(0, 8) || ''
      ];
      
      rowData.forEach((cellData, colIndex) => {
        const currentPage = pdfDoc.getPageCount() > 1 ? pdfDoc.getPage(pdfDoc.getPageCount() - 1) : page;
        currentPage.drawText(cellData, {
          x: margin + (colIndex * columnWidth),
          y: yPosition,
          size: fontSize,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
      });
      
      yPosition -= lineHeight;
    });
    
    // حفظ المستند وإرجاعه كـ Buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
    
  } catch (error) {
    console.error('خطأ في إنشاء PDF:', error);
    // في حالة الخطأ، أرجع CSV كـ fallback
    const csvContent = await generateTransactionsCSV(transactions);
    return Buffer.from(csvContent, 'utf-8');
  }
}

// تسجيل API endpoints للمعاملات الموحدة
export function registerAdminTransactionRoutes(app: Express, authMiddleware: any, storage: any) {
  
  // Helper function to check admin access
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "غير مصرح لك بالوصول" });
      }

      const user = await storage.getUser(userId);
      if (user?.type !== 'admin') {
        return res.status(403).json({ message: "غير مصرح لك بالوصول لهذه البيانات" });
      }
      
      next();
    } catch (error) {
      console.error('خطأ في التحقق من صلاحيات الأدمن:', error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  };
  
  // جلب جميع المعاملات مع فلاتر متقدمة
  app.get('/api/admin/transactions', authMiddleware, isAdmin, async (req, res) => {
    try {
      const filters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        useExecutedAt: req.query.useExecutedAt === 'true',
        types: req.query.type ? (Array.isArray(req.query.type) ? req.query.type : [req.query.type]) as string[] : [],
        statuses: req.query.status ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) as string[] : [],
        currencies: req.query.currency ? (Array.isArray(req.query.currency) ? req.query.currency : [req.query.currency]) as string[] : [],
        amountMin: req.query.amountMin as string,
        amountMax: req.query.amountMax as string,
        refNo: req.query.ref_no as string,
        userId: req.query.user_id as string,
        officeId: req.query.office_id as string,
        city: req.query.city as string,
        channels: req.query.channel ? (Array.isArray(req.query.channel) ? req.query.channel : [req.query.channel]) as string[] : [],
        kycLevel: req.query.kyc_level as string,
        riskMin: req.query.risk_min as string,
        riskMax: req.query.risk_max as string,
        flags: req.query.flags ? (Array.isArray(req.query.flags) ? req.query.flags : [req.query.flags]) as string[] : [],
        q: req.query.q as string,
        page: parseInt(req.query.page as string) || 1,
        pageSize: parseInt(req.query.pageSize as string) || 50,
        sortBy: req.query.sortBy as string || 'created_at',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
      };

      // استخدام النظام الموحد الجديد لجلب جميع معاملات المستخدمين
      const simpleFilters = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        q: filters.q,
        page: filters.page,
        pageSize: filters.pageSize
      };

      const result = await UnifiedAdminTransactions.getAllTransactions(simpleFilters);
      
      res.json(result);
    } catch (error) {
      console.error('خطأ في جلب المعاملات للأدمن:', error);
      res.status(500).json({ error: 'حدث خطأ في جلب المعاملات' });
    }
  });

  // جلب معاملة واحدة بالتفصيل
  app.get('/api/admin/transactions/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
      const transaction = await AdminTransactionService.getTransactionById(req.params.id);
      
      if (!transaction) {
        return res.status(404).json({ error: 'المعاملة غير موجودة' });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error('خطأ في جلب تفاصيل المعاملة:', error);
      res.status(500).json({ error: 'حدث خطأ في جلب تفاصيل المعاملة' });
    }
  });

  // تحديث معاملة
  app.patch('/api/admin/transactions/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
      const updates = req.body;
      
      const updatedTransaction = await AdminTransactionService.updateTransaction(req.params.id, updates);
      
      if (!updatedTransaction) {
        return res.status(404).json({ error: 'المعاملة غير موجودة' });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error('خطأ في تحديث المعاملة:', error);
      res.status(500).json({ error: 'حدث خطأ في تحديث المعاملة' });
    }
  });

  // إنشاء إيصال للطباعة
  app.get('/api/admin/transactions/:id/receipt', authMiddleware, isAdmin, async (req, res) => {
    try {
      const transaction = await AdminTransactionService.getTransactionById(req.params.id);
      
      if (!transaction) {
        return res.status(404).json({ error: 'المعاملة غير موجودة' });
      }

      // التحقق من نوع المعاملة للتحويلات الدولية
      let internationalTransferData = null;
      if (transaction.type === TransactionType.OFFICE_REMIT) {
        // البحث عن بيانات التحويل الدولي
        const result = await pool.query(`
          SELECT 
            at.*,
            sender.full_name as sender_name,
            sender.account_number as sender_account,
            dest_agent.full_name as dest_agent_name,
            dest_agent.account_number as dest_agent_account
          FROM agent_transfers at
          LEFT JOIN users sender ON at.sender_id = sender.id
          LEFT JOIN users dest_agent ON at.destination_agent_id = dest_agent.id
          WHERE at.id = $1
          LIMIT 1
        `, [req.params.id]);
        
        if (result.rows.length > 0) {
          internationalTransferData = result.rows[0];
        }
      }

      // إنشاء HTML للإيصال الحراري
      const receiptHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>إيصال معاملة - ${transaction.refNo}</title>
          <style>
            @page {
              size: 72mm 96mm;
              margin: 2mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              line-height: 1.3;
              color: #000;
              background: white;
              width: 68mm;
              padding: 2mm;
            }
            
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 3mm;
              margin-bottom: 3mm;
            }
            
            .logo {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 1mm;
            }
            
            .receipt-info {
              margin-bottom: 3mm;
              text-align: center;
            }
            
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              padding: 0.5mm 0;
            }
            
            .row.border-bottom {
              border-bottom: 1px solid #ddd;
              padding-bottom: 1mm;
              margin-bottom: 2mm;
            }
            
            .label {
              font-weight: bold;
            }
            
            .value {
              text-align: left;
            }
            
            .amount-section {
              background: #f9f9f9;
              padding: 2mm;
              margin: 2mm 0;
              border: 1px solid #ddd;
            }
            
            .footer {
              text-align: center;
              margin-top: 3mm;
              padding-top: 2mm;
              border-top: 1px solid #000;
              font-size: 10px;
            }
            
            .qr-code {
              text-align: center;
              margin: 2mm 0;
            }
            
            .status-badge {
              display: inline-block;
              padding: 1mm 2mm;
              border-radius: 2mm;
              font-size: 10px;
              font-weight: bold;
            }
            
            .status-success { background: #d4edda; color: #155724; }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-failed { background: #f8d7da; color: #721c24; }
            
            @media print {
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">منصة الصرافة</div>
            <div style="font-size: 10px;">إيصال معاملة رقمي</div>
          </div>
          
          <div class="receipt-info">
            <div style="font-weight: bold; margin-bottom: 1mm;">${transaction.refNo}</div>
            <div class="status-badge status-${transaction.status.toLowerCase()}">
              ${transaction.status === 'SUCCESS' ? 'نجحت' : 
                transaction.status === 'PENDING' ? 'معلقة' : 
                transaction.status === 'FAILED' ? 'فشلت' : transaction.status}
            </div>
          </div>
          
          <div class="row border-bottom">
            <span class="label">النوع:</span>
            <span class="value">
              ${transaction.type === TransactionType.INTERNAL_TRANSFER ? 'تحويل داخلي' :
                transaction.type === TransactionType.OFFICE_REMIT ? 'تحويل دولي بين المكاتب' :
                transaction.type === TransactionType.SALE ? 'بيع' :
                transaction.type === TransactionType.PURCHASE ? 'شراء' :
                transaction.type === TransactionType.EXTERNAL_REMIT ? 'حوالة خارجية' :
                transaction.type === TransactionType.DEPOSIT ? 'إيداع' :
                transaction.type === TransactionType.WITHDRAW ? 'سحب' :
                transaction.type === TransactionType.FEE ? 'عمولة' :
                transaction.type === TransactionType.ADJUSTMENT ? 'تسوية' : transaction.type}
            </span>
          </div>
          
          <div class="row">
            <span class="label">المستخدم:</span>
            <span class="value">${transaction.userName || transaction.userId}</span>
          </div>
          
          ${transaction.fromAccountId ? `
          <div class="row">
            <span class="label">من حساب:</span>
            <span class="value">${transaction.fromAccountId}</span>
          </div>
          ` : ''}
          
          ${transaction.toAccountId ? `
          <div class="row">
            <span class="label">إلى حساب:</span>
            <span class="value">${transaction.toAccountId}</span>
          </div>
          ` : ''}

          ${internationalTransferData ? `
          <div style="margin-top: 3mm; padding-top: 2mm; border-top: 1px solid #ddd;">
            <div style="font-weight: bold; margin-bottom: 2mm; text-align: center;">بيانات التحويل الدولي</div>
            
            <div class="row">
              <span class="label">الوكيل المستلم:</span>
              <span class="value">${internationalTransferData.dest_agent_name || 'غير محدد'}</span>
            </div>
            
            <div class="row">
              <span class="label">المستفيد:</span>
              <span class="value">${internationalTransferData.recipient_name || 'غير محدد'}</span>
            </div>
            
            <div class="row">
              <span class="label">هاتف المستفيد:</span>
              <span class="value">${internationalTransferData.recipient_phone || 'غير محدد'}</span>
            </div>
            
            <div class="row">
              <span class="label">البلد المقصود:</span>
              <span class="value">${internationalTransferData.country === 'AU' ? 'أستراليا' : internationalTransferData.country === 'DE' ? 'ألمانيا' : internationalTransferData.country === 'TR' ? 'تركيا' : internationalTransferData.country || 'غير محدد'}</span>
            </div>
            
            <!-- رمز الحوالة بشكل بارز -->
            <div style="background: #f0f8ff; border: 2px solid #0066cc; padding: 3mm; margin: 2mm 0; text-align: center; border-radius: 3mm;">
              <div style="font-weight: bold; font-size: 10px; margin-bottom: 1mm; color: #0066cc;">رمز الحوالة الدولية</div>
              <div style="font-size: 14px; font-weight: bold; letter-spacing: 1px; color: #000;">${internationalTransferData.transfer_code || 'غير محدد'}</div>
              <div style="font-size: 8px; margin-top: 1mm; color: #666;">احتفظ بهذا الرمز لاستلام الحوالة</div>
            </div>
            
            ${internationalTransferData.commission_recipient ? `
            <div class="row">
              <span class="label">عمولة المكتب المستلم:</span>
              <span class="value">${parseFloat(internationalTransferData.commission_recipient).toLocaleString('ar-LY', { minimumFractionDigits: 2 })} ${internationalTransferData.currency}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="amount-section">
            <div class="row">
              <span class="label">المبلغ:</span>
              <span class="value">${parseFloat(transaction.amount).toLocaleString('ar-LY', { minimumFractionDigits: 2 })} ${transaction.currency}</span>
            </div>
            
            ${transaction.feeSystem ? `
            <div class="row">
              <span class="label">العمولة:</span>
              <span class="value">${parseFloat(transaction.feeSystem).toLocaleString('ar-LY', { minimumFractionDigits: 2 })} ${transaction.currency}</span>
            </div>
            ` : ''}
            
            <div class="row" style="font-weight: bold; border-top: 1px solid #ddd; padding-top: 1mm;">
              <span class="label">الصافي:</span>
              <span class="value">${parseFloat(transaction.netAmount).toLocaleString('ar-LY', { minimumFractionDigits: 2 })} ${transaction.currency}</span>
            </div>
          </div>
          
          <div class="row">
            <span class="label">التاريخ:</span>
            <span class="value">${new Date(transaction.createdAt).toLocaleString('ar-LY', { 
              timeZone: 'Africa/Tripoli',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          
          ${transaction.executedAt ? `
          <div class="row">
            <span class="label">وقت التنفيذ:</span>
            <span class="value">${new Date(transaction.executedAt).toLocaleString('ar-LY', { 
              timeZone: 'Africa/Tripoli',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          ` : ''}
          
          <div class="row">
            <span class="label">القناة:</span>
            <span class="value">
              ${transaction.channel === 'WEB' ? 'ويب' :
                transaction.channel === 'MOBILE' ? 'موبايل' :
                transaction.channel === 'DESKTOP' ? 'سطح المكتب' :
                transaction.channel === 'API' ? 'API' : transaction.channel}
            </span>
          </div>
          
          ${transaction.notes ? `
          <div style="margin-top: 2mm; padding-top: 2mm; border-top: 1px solid #ddd;">
            <div class="label">ملاحظات:</div>
            <div style="font-size: 10px; margin-top: 1mm;">${transaction.notes}</div>
          </div>
          ` : ''}
          
          <div class="qr-code">
            <div style="border: 1px solid #ddd; padding: 2mm; font-size: 10px;">
              رمز QR للتحقق: ${transaction.refNo}
            </div>
          </div>
          
          <div class="footer">
            <div>شكراً لاستخدام منصة الصرافة</div>
            <div style="margin-top: 1mm;">للاستفسار: support@platform.ly</div>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(receiptHtml);
    } catch (error) {
      console.error('خطأ في إنشاء إيصال المعاملة:', error);
      res.status(500).json({ error: 'حدث خطأ في إنشاء الإيصال' });
    }
  });

  // تصدير المعاملات
  app.post('/api/admin/transactions/export', authMiddleware, isAdmin, async (req, res) => {
    try {
      const { format, filters, selectedIds } = req.body;
      
      console.log('📊 طلب تصدير المعاملات:', { format, hasFilters: !!filters, selectedCount: selectedIds?.length || 0 });
      
      if (!format || !['csv', 'pdf'].includes(format)) {
        return res.status(400).json({ error: 'صيغة التصدير غير صحيحة' });
      }

      let transactions;
      
      if (selectedIds && selectedIds.length > 0) {
        // تصدير معاملات محددة باستخدام النظام الموحد
        console.log('📤 تصدير معاملات محددة:', selectedIds.length, 'معاملة');
        console.log('🔍 معرفات المعاملات المُرسلة:', selectedIds);
        
        // جلب جميع المعاملات باستخدام النظام الموحد ثم فلترة المطلوبة
        const allTransactionsResult = await UnifiedAdminTransactions.getAllTransactions({
          pageSize: 1000 // رقم كبير للحصول على جميع المعاملات
        });
        
        // فلترة المعاملات المطلوبة حسب المعرفات المُرسلة
        const selectedTransactions = allTransactionsResult.rows.filter(transaction => 
          selectedIds.includes(transaction.id)
        );
        
        console.log('✅ المعاملات الصالحة:', selectedTransactions.length, 'من أصل', selectedIds.length);
        
        transactions = { 
          rows: selectedTransactions, 
          total: selectedTransactions.length 
        };
      } else {
        // تصدير حسب الفلاتر
        console.log('📤 تصدير حسب الفلاتر:', filters);
        transactions = await AdminTransactionService.getTransactions(filters || {});
      }

      console.log('📊 بيانات التصدير المجمعة:', {
        totalRows: transactions.rows?.length || 0,
        firstRow: transactions.rows?.[0] ? Object.keys(transactions.rows[0]) : 'لا توجد بيانات'
      });

      if (!transactions.rows || transactions.rows.length === 0) {
        console.log('⚠️ لا توجد معاملات للتصدير');
        return res.status(404).json({ error: 'لا توجد معاملات للتصدير' });
      }

      if (format === 'csv') {
        const csvContent = await generateTransactionsCSV(transactions.rows);
        console.log('📄 محتوى CSV:', csvContent.length, 'حرف');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="transactions-${Date.now()}.csv"`);
        res.send(csvContent);
      } else {
        // إنشاء ملف PDF حقيقي
        console.log('📄 إنشاء ملف PDF للمعاملات...');
        const pdfBuffer = await generateTransactionsPDF(transactions.rows);
        console.log('✅ تم إنشاء PDF بنجاح، الحجم:', pdfBuffer.length, 'بايت');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="transactions-${Date.now()}.pdf"`);
        res.send(pdfBuffer);
      }
    } catch (error) {
      console.error('❌ خطأ في تصدير المعاملات:', error);
      res.status(500).json({ error: 'حدث خطأ في تصدير المعاملات' });
    }
  });

  // إحصائيات سريعة
  app.get('/api/admin/transactions/stats', authMiddleware, isAdmin, async (req, res) => {
    try {
      const timeframe = (req.query.interval as 'day' | 'week' | 'month') || 'day';
      const stats = await AdminTransactionService.getDashboardStats(timeframe);
      
      res.json(stats);
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
      res.status(500).json({ error: 'حدث خطأ في جلب الإحصائيات' });
    }
  });

  // كشف المعاملات المكررة
  app.get('/api/admin/transactions/duplicates', authMiddleware, isAdmin, async (req, res) => {
    try {
      const timeWindow = parseInt(req.query.timeWindow as string) || 5;
      const duplicates = await AdminTransactionService.findDuplicateTransactions(timeWindow);
      
      res.json(duplicates);
    } catch (error) {
      console.error('خطأ في البحث عن المعاملات المكررة:', error);
      res.status(500).json({ error: 'حدث خطأ في البحث عن المعاملات المكررة' });
    }
  });
}