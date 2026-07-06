const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

const srcRoot = path.join(__dirname, '..', 'src');
const files = walk(srcRoot);
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = content.replace(/from 'src\/([^']+)'/g, (_, importPath) => {
    const target = path.join(srcRoot, importPath);
    let rel = path.relative(path.dirname(file), target).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    return `from '${rel}'`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
}

console.log(`Updated ${changed} files`);
