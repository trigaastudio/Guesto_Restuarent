const fs = require('fs');

let content = fs.readFileSync('client/src/components/ProtectedRoute/ProtectedRoute.jsx', 'utf8');

// Replace token checks with user presence checks
content = content.replace(/let token;/g, 'let hasAuth = false;');
content = content.replace(/token = localStorage\.getItem\('admin_token'\);/g, 'hasAuth = !!localStorage.getItem(\'admin_user\');');
content = content.replace(/token = localStorage\.getItem\('staff_token'\);/g, 'hasAuth = !!localStorage.getItem(\'staff_user\');');
content = content.replace(/const customerToken = localStorage\.getItem\('token'\);/g, 'const customerAuth = !!localStorage.getItem(\'user\');');
content = content.replace(/const adminToken = localStorage\.getItem\('admin_token'\);/g, 'const adminAuth = !!localStorage.getItem(\'admin_user\');');
content = content.replace(/if \(customerToken\)/g, 'if (customerAuth)');
content = content.replace(/token = customerToken;/g, 'hasAuth = customerAuth;');
content = content.replace(/else if \(adminToken\)/g, 'else if (adminAuth)');
content = content.replace(/token = adminToken;/g, 'hasAuth = adminAuth;');
content = content.replace(/if \(!token\)/g, 'if (!hasAuth)');

fs.writeFileSync('client/src/components/ProtectedRoute/ProtectedRoute.jsx', content);
console.log('Updated ProtectedRoute');
