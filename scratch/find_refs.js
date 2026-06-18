const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(filePath, pattern);
      }
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(pattern)) {
        console.log(`Found pattern "${pattern}" in: ${filePath}`);
      }
    }
  }
}

console.log('Searching for candidate-profile:');
searchDir('./src', 'candidate-profile');
console.log('Searching for CandidateProfile:');
searchDir('./src', 'CandidateProfile');
console.log('Searching for candidate-details:');
searchDir('./src', 'candidate-details');
