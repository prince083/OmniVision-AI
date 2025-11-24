// simple Node script to copy dist/index.html -> dist/popup.html
const fs = require('fs');
const path = require('path');
const dist = path.resolve(__dirname, '..', 'dist');
const indexFile = path.join(dist, 'index.html');
const popupFile = path.join(dist, 'popup.html');

if (!fs.existsSync(indexFile)) {
  console.error('Build output not found. Run `npm run build` first.');
  process.exit(1);
}

fs.copyFileSync(indexFile, popupFile);
console.log('Created popup.html in dist/');