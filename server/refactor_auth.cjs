const fs = require('fs');

let code = fs.readFileSync('controllers/authController.js', 'utf8');

const replacement = `const token = authService.generateToken(user._id);
      const cookieName = user.role === 'admin' ? 'admin_token' : user.role === 'staff' ? 'staff_token' : 'token';
      res.cookie(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.status($1).json({
        success: true,
        message: '$2',
        data: {$3token // Optional: keep for backward compatibility during transition
        }
      });`;

code = code.replace(/res\.status\((201|200)\)\.json\(\{\s+success: true,\s+message: '([^']+)',\s+data: \{([\s\S]*?)token: authService\.generateToken\(user\._id\)\s*\}\s*\}\);/g, replacement);

if (!code.includes('async logout(')) {
    code = code.replace('class AuthController {', `class AuthController {
  async logout(req, res) {
    res.clearCookie('token');
    res.clearCookie('admin_token');
    res.clearCookie('staff_token');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
`);
}

fs.writeFileSync('controllers/authController.js', code);
console.log('Successfully updated authController.js');
