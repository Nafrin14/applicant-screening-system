const fs = require('fs');
const path = require('path');

const results = [];

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(filePath);
      }
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Let's search for "notes" table usage or query
      if (content.toLowerCase().includes('notes') || content.toLowerCase().includes('note')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes('notes') || line.toLowerCase().includes('note')) {
            results.push(`${filePath}:${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('./src');
fs.writeFileSync('./scratch/search_output.txt', results.join('\n'));
console.log('Search finished');
