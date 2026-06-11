const fs = require('fs');
const path = require('path');

const unusedJsonPath = path.join(__dirname, 'unused_assets.json');
if (!fs.existsSync(unusedJsonPath)) {
  console.error('Error: unused_assets.json not found! Please run find_unused.cjs first.');
  process.exit(1);
}

const unusedFiles = JSON.parse(fs.readFileSync(unusedJsonPath, 'utf8'));

// Dynamic assets exclusions
const preserveList = [
  't-maru.png',
  't-batu.png',
  't-hatena.png'
];

let deletedCount = 0;
let skippedCount = 0;

unusedFiles.forEach(file => {
  const baseName = path.basename(file);
  if (preserveList.includes(baseName)) {
    console.log(`Skipping (preserved dynamic asset): ${baseName}`);
    skippedCount++;
    return;
  }

  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`Deleted: ${path.relative(path.join(__dirname, '../client/my-app/public'), file)}`);
    deletedCount++;
  } else {
    console.log(`File not found, skipping: ${file}`);
  }
});

console.log(`\nDeletion complete: ${deletedCount} files deleted, ${skippedCount} files skipped.`);
