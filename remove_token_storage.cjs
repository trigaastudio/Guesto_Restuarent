const fs = require('fs');

function removeTokenStorage(file, tokenKey) {
  let content = fs.readFileSync(file, 'utf8');
  const regex = new RegExp(`localStorage\\.setItem\\('${tokenKey}',[^)]+\\);?\\s*`, 'g');
  content = content.replace(regex, '');
  fs.writeFileSync(file, content);
}

removeTokenStorage('client/src/pages/Login/LoginPage.jsx', 'token');
removeTokenStorage('client/src/pages/Admin/AdminLogin.jsx', 'admin_token');
removeTokenStorage('client/src/pages/Staff/StaffLogin.jsx', 'staff_token');

// Also update App.jsx or ProtectedRoutes if they check localStorage.getItem('token')
// For now, let's just grep where else localStorage.getItem('token') is used.
console.log('Done');
