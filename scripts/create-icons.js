/**
 * Icon Dosyaları Oluşturma Script'i
 * 
 * Bu script, basit placeholder icon'lar oluşturur.
 * Production için gerçek logo dosyalarınızı kullanmanız önerilir.
 * 
 * Kullanım:
 * node scripts/create-icons.js
 */

const fs = require('fs');
const path = require('path');

// Basit SVG icon oluştur (placeholder)
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4f46e5"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white" opacity="0.9"/>
  <text x="${size/2}" y="${size/2}" font-family="Arial, sans-serif" font-size="${size/4}" font-weight="bold" fill="#4f46e5" text-anchor="middle" dominant-baseline="middle">OS</text>
</svg>`;
};

const publicDir = path.join(__dirname, '..', 'public');

// public klasörünü oluştur (yoksa)
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// SVG icon'ları oluştur
const icon192SVG = createSVGIcon(192);
const icon512SVG = createSVGIcon(512);

// SVG dosyalarını kaydet
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), icon192SVG);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), icon512SVG);

console.log('✅ SVG icon\'lar oluşturuldu:');
console.log('   - public/icon-192.svg');
console.log('   - public/icon-512.svg');
console.log('');
console.log('⚠️  Not: Production için PNG formatında icon\'lar önerilir.');
console.log('   Online converter kullanabilirsiniz:');
console.log('   https://www.pwabuilder.com/imageGenerator');
console.log('   https://convertio.co/svg-png/');
console.log('');
console.log('   Veya SVG\'leri manuel olarak PNG\'ye çevirebilirsiniz.');
console.log('   Gerekli boyutlar: 192x192 ve 512x512 piksel');
