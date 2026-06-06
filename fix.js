const fs = require('fs');
const file = 'client/src/pages/Admin/sections/OrderSection.jsx';
let text = fs.readFileSync(file, 'utf8');
text = text.replace(/api\.get\(\`/g, 'api.get(`/api');
text = text.replace(/api\.delete\(\`/g, 'api.delete(`/api');
text = text.replace(/api\.patch\(\`/g, 'api.patch(`/api');
text = text.replace(/api\.post\(\`/g, 'api.post(`/api');
text = text.replace(/\/api\/api/g, '/api');
fs.writeFileSync(file, text);
