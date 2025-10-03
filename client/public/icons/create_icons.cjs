const fs = require('fs');

// إنشاء أيقونة بسيطة كـ SVG صالح للتحويل
const createIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- خلفية ذهبية -->
  <rect width="${size}" height="${size}" fill="#FFD700" rx="64"/>
  
  <!-- دائرة بيضاء في الوسط -->
  <circle cx="${size/2}" cy="${size/2}" r="${size*0.25}" fill="white"/>
  
  <!-- رمز الدولار -->
  <text x="${size/2}" y="${size/2 + size*0.08}" 
        font-family="Arial, sans-serif" 
        font-size="${size*0.15}" 
        font-weight="bold" 
        text-anchor="middle" 
        fill="#B8860B">$</text>
  
  <!-- نص عربي -->
  <text x="${size/2}" y="${size*0.85}" 
        font-family="Arial, sans-serif" 
        font-size="${size*0.08}" 
        font-weight="bold" 
        text-anchor="middle" 
        fill="white">صرافة</text>
</svg>
`;

// كتابة الأيقونات
fs.writeFileSync('icon-192.svg', createIcon(192));
fs.writeFileSync('icon-512.svg', createIcon(512));
fs.writeFileSync('maskable-192.svg', createIcon(192));
fs.writeFileSync('maskable-512.svg', createIcon(512));

console.log('تم إنشاء الأيقونات بنجاح');
