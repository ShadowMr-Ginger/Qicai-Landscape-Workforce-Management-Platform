const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source not found: ${src}`);
    return;
  }
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  fs.readdirSync(src).forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Next.js standalone output requires static assets to be copied manually on some versions
const staticSrc = path.join(__dirname, '..', '.next', 'static');
const staticDest = path.join(__dirname, '..', '.next', 'standalone', '.next', 'static');
copyDir(staticSrc, staticDest);
console.log(`Copied ${staticSrc} -> ${staticDest}`);

const publicSrc = path.join(__dirname, '..', 'public');
const publicDest = path.join(__dirname, '..', '.next', 'standalone', 'public');
copyDir(publicSrc, publicDest);
console.log(`Copied ${publicSrc} -> ${publicDest}`);
