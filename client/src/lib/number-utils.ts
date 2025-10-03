// دالة لتحويل الأرقام من العربية الشرقية إلى العربية الغربية
export function convertToWesternNumerals(text: string | number): string {
  if (typeof text === 'number') {
    text = text.toString();
  }
  
  if (!text) return '';
  
  // خريطة تحويل الأرقام العربية الشرقية إلى الغربية
  const arabicToWesternMap: { [key: string]: string } = {
    '٠': '0',
    '١': '1', 
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9'
  };
  
  return text.replace(/[٠-٩]/g, (match) => arabicToWesternMap[match] || match);
}

// دالة لتنسيق الأرقام مع الفواصل للعملات
export function formatCurrency(amount: number | string, currency: string = 'LYD'): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '0';
  
  // تنسيق الرقم مع الفواصل باستخدام الأرقام الغربية
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
  
  return `${convertToWesternNumerals(formatted)} ${currency}`;
}

// دالة لتنسيق العملة بدون فواصل
export function formatCurrencyNoCommas(amount: number | string, currency: string = 'LYD'): string {
  console.log('🔍 formatCurrencyNoCommas المدخلات:', { amount, currency, typeOfAmount: typeof amount });
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  console.log('🔍 formatCurrencyNoCommas بعد التحويل:', { numericAmount, isNaN: isNaN(numericAmount) });
  
  if (isNaN(numericAmount) || numericAmount === 0) {
    console.log('🔍 formatCurrencyNoCommas: إرجاع 0 بسبب NaN أو قيمة صفر');
    return `0 ${currency}`;
  }
  
  // تنسيق الرقم بدون فواصل مع عرض المنازل العشرية فقط عند الحاجة
  const formatted = numericAmount % 1 === 0 
    ? numericAmount.toString()
    : numericAmount.toFixed(2);
  
  const result = `${convertToWesternNumerals(formatted)} ${currency}`;
  console.log('🔍 formatCurrencyNoCommas النتيجة النهائية:', result);
  
  return result;
}

// دالة لتنسيق الأرقام العادية مع الفواصل
export function formatNumber(num: number | string): string {
  const numericValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numericValue)) return '0';
  
  const formatted = new Intl.NumberFormat('en-US').format(numericValue);
  return convertToWesternNumerals(formatted);
}

// دالة لتنسيق التواريخ مع الأرقام الغربية
export function formatDateWithWesternNumbers(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  
  const formatted = dateObj.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return convertToWesternNumerals(formatted);
}

// دالة لتنسيق الوقت مع الأرقام الغربية
export function formatTimeWithWesternNumbers(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  
  const formatted = dateObj.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return convertToWesternNumerals(formatted);
}

// دالة لتنسيق التاريخ والوقت معًا
export function formatDateTimeWithWesternNumbers(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  
  const formatted = dateObj.toLocaleString('ar-SA');
  return convertToWesternNumerals(formatted);
}

// دالة بديلة لتحويل الأرقام (اسم مختصر)
export function formatNumberToWestern(value: string | number): string {
  return convertToWesternNumerals(value);
}