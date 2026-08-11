const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('http://localhost:5005')) {
                content = content.replace(/http:\/\/localhost:5005/g, '');
                fs.writeFileSync(fullPath, content);
                console.log('Updated ' + fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'src'));
console.log('Done!');
