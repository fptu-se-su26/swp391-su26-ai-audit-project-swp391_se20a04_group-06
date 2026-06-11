const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../client/my-app/public');
const srcDir = path.join(__dirname, '../client/my-app/src');
const indexHtml = path.join(__dirname, '../client/my-app/index.html');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

// 1. Get all public files
const publicFiles = getFiles(publicDir);

// 2. Read all source files
const srcFiles = getFiles(srcDir);
srcFiles.push(indexHtml);

let allSrcContent = '';
srcFiles.forEach(file => {
  if (['.js', '.jsx', '.css', '.html', '.json'].includes(path.extname(file))) {
    allSrcContent += fs.readFileSync(file, 'utf8') + '\n';
  }
});

console.log(`Scanning ${publicFiles.length} public assets against ${srcFiles.length} source files...`);

const unusedFiles = [];
const usedFiles = [];

publicFiles.forEach(fullPath => {
  const relPath = path.relative(publicDir, fullPath).replace(/\\/g, '/');
  const baseName = path.basename(fullPath);

  // We check if the filename is referenced in the source content
  // We use negative lookbehind to ensure it's not part of another word (e.g. "08.png" shouldn't match "n_ryo08.png")
  const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp('(?<![a-zA-Z0-9_-])' + escaped);
  const isUsed = regex.test(allSrcContent);
  
  if (isUsed) {
    usedFiles.push(relPath);
  } else {
    unusedFiles.push(fullPath);
  }
});

console.log(`\nFound ${usedFiles.length} used files.`);
console.log(`Found ${unusedFiles.length} unused files:`);
unusedFiles.forEach(f => {
  console.log(`  - ${path.relative(publicDir, f)} (${fs.statSync(f).size} bytes)`);
});

// Write list to a json so we can easily delete them later if needed
fs.writeFileSync(path.join(__dirname, 'unused_assets.json'), JSON.stringify(unusedFiles, null, 2));
console.log('\nUnused assets list saved to scratch/unused_assets.json');
