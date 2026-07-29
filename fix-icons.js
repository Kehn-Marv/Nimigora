import fs from 'fs';
import path from 'path';

const directoryPath = path.join(process.cwd(), 'app');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir(directoryPath);
let modifiedCount = 0;

const replacements = {
    'Newspaper': 'DocumentText',
    'Construction': 'Setting2',
    'ArrowUpDown': 'Sort',
    'Zap': 'Flash',
    'LineChart': 'ChartLine',
    'Loader2': 'Loader',
    'LogOut': 'Logout',
    'RefreshCw': 'Refresh',
    'ScrollText': 'DocumentText'
};

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    Object.keys(replacements).forEach(key => {
        // match word boundary
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, replacements[key]);
            changed = true;
        }
    });
    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed icons in ${file}`);
        modifiedCount++;
    }
});

console.log(`Finished fixing ${modifiedCount} files.`);
