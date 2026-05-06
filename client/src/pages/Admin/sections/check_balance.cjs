const fs = require('fs');
const content = fs.readFileSync('c:/Users/kunno/OneDrive/Documents/guesto_project/guest-o-project/client/src/pages/Admin/sections/OrderSection.jsx', 'utf8');

const lines = content.split('\n');
let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div/g) || []).length;
  balance += opens - closes;
  if (opens > 0 || closes > 0) {
    // console.log(`Line ${i + 1}: ${line.trim()} | Balance: ${balance}`);
  }
}
console.log(`Final Balance: ${balance}`);
