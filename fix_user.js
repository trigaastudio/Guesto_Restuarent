const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            const regex1 = /const user = JSON\.parse\(localStorage\.getItem\('user'\) \|\| 'null'\);/g;
            const replacement1 = `const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || 'null');`;

            const regex2 = /const user = JSON\.parse\(localStorage\.getItem\('user'\) \|\| '\{\}'\);/g;
            const replacement2 = `const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || '{}');`;

            const regex3 = /const user = JSON\.parse\(localStorage\.getItem\('user'\) \|\| localStorage\.getItem\('admin_user'\) \|\| 'null'\);/g;
            const replacement3 = `const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || 'null');`;

            const regex4 = /const \[user, setUser\] = useState\(\(\) => JSON\.parse\(localStorage\.getItem\('user'\) \|\| '\{\}'\)\);/g;
            const replacement4 = `const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || localStorage.getItem('staff_user') || localStorage.getItem('admin_user') || '{}'));`;

            if (regex1.test(content)) {
                content = content.replace(regex1, replacement1);
                modified = true;
            }
            if (regex2.test(content)) {
                content = content.replace(regex2, replacement2);
                modified = true;
            }
            if (regex3.test(content)) {
                content = content.replace(regex3, replacement3);
                modified = true;
            }
            if (regex4.test(content)) {
                content = content.replace(regex4, replacement4);
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
