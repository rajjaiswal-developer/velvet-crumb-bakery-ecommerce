const fs = require('fs');
let nav = fs.readFileSync('components/storefront/Navbar.tsx', 'utf8');
if (!nav.includes('Portfolio Demo Project')) {
  navigation = nav.replace(
    '<header className="sticky top-0 z-40 bg-[var(--bg-base)]/90 backdrop-blur-md border-b border-[var(--border-default)]">',
    '<header className="sticky top-0 z-40 bg-[var(--bg-base)]/90 backdrop-blur-md border-b border-[var(--border-default)]">\n      <div className="bg-amber-900/90 text-amber-100 text-xs py-1.5 px-4 text-center font-semibold tracking-wide border-b border-amber-700/50">Portfolio Demo Project — Not a Real Business</div>'
  );
  fs.readFileSync;fs.writeFileSync('components/storefront/Navbar.tsx', navigation, 'utf8');
  console.log('Navbar banner added');
}
