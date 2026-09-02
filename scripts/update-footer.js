const fs = require('fs');
let footer = fs.readFileSync('components/storefront/Footer.tsx', 'utf8');
footer = footer.replace(
  /In 2018 when we started this bakery in Mumbai it was buzzing with people full of desire\. Pure vegetarian bakery crafting freshly baked cakes and celebration products in Demo City\./,
  'Established in 2021, Velvet Crumb Bakery is a pure vegetarian bakery crafting freshly baked, beautifully made cakes and celebration products.'
);
footer = footer.replace('Aarav Mehta</span>\n                  <span className="text-[10px] text-gray-400 font-mono">Co-founder</span>', 'Aarav Mehta</span>\n                  <span className="text-[10px] text-gray-400 font-mono">Head Baker</span>');
fs.writeFileSync('components/storefront/Footer.tsx', footer, 'utf8');
console.log('Footer updated');
