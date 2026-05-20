const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');

const newHandleLogoutStr = `  const handleLogout = React.useCallback(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || '{}');
    if (currentUser.role === 'admin') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('/admin/login', { replace: true });
    } else if (currentUser.role === 'kitchen' || currentUser.role === 'waiter') {
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_user');
      navigate('/staff/login', { replace: true });
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  }, [navigate]);`;

const newHandleLogoutNoCallback = `  const handleLogout = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || '{}');
    if (currentUser.role === 'admin') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      navigate('/admin/login', { replace: true });
    } else if (currentUser.role === 'kitchen' || currentUser.role === 'waiter') {
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_user');
      navigate('/staff/login', { replace: true });
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };`;

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Simple regex replacement strategy, we need to be careful.
            // Better to match the start of handleLogout to the end of it.
            // We'll use a regex that captures the entire handleLogout block
            const handleLogoutRegexCallback = /const handleLogout = useCallback\(\(\) => \{[\s\S]*?\}, \[navigate(, user)?\]\);/g;
            const handleLogoutRegexReactCallback = /const handleLogout = React\.useCallback\(\(\) => \{[\s\S]*?\}, \[navigate\]\);/g;
            const handleLogoutRegexArrow = /const handleLogout = \(\) => \{[\s\S]*?navigate\('\/.*?login'.*?\);[\s\S]*?\};/g;

            // WaiterDashboard, KitchenDashboard, AdminDashboard have their own specific handleLogouts which we should NOT touch.
            if (fullPath.includes('WaiterDashboard.jsx') || 
                fullPath.includes('KitchenDashboard.jsx') || 
                fullPath.includes('AdminDashboard.jsx') ||
                fullPath.includes('AdminLogin.jsx') ||
                fullPath.includes('StaffLogin.jsx') ||
                fullPath.includes('LoginPage.jsx')) {
                continue;
            }

            if (handleLogoutRegexCallback.test(content)) {
                content = content.replace(handleLogoutRegexCallback, newHandleLogoutStr);
                modified = true;
            } else if (handleLogoutRegexReactCallback.test(content)) {
                content = content.replace(handleLogoutRegexReactCallback, newHandleLogoutStr);
                modified = true;
            } else if (handleLogoutRegexArrow.test(content)) {
                content = content.replace(handleLogoutRegexArrow, newHandleLogoutNoCallback);
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Modified', fullPath);
            }
        }
    }
}

traverse(pagesDir);
