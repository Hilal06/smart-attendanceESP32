import fs from 'fs';
import path from 'path';

const searchDirectory = 'd:/Workspace/ESP32 CAM/Web UI/smart-attendanceESP32/resources/js';

// The Replacements Map
// We want to deepen the colors and increase contrast
// We target `dark:` classes specifically so we don't mess up light mode.
const replacements = [
    // 1. Shift the main background from 900 to 950
    { from: /dark:bg-slate-900\b/g, to: 'dark:bg-slate-950' },
    // 2. Shift the generic cards from 800 to 900
    { from: /dark:bg-slate-800\b/g, to: 'dark:bg-slate-900' },
    // 3. Shift "glass" cards and hover states
    { from: /dark:bg-slate-800\/50\b/g, to: 'dark:bg-slate-900/50' },
    { from: /dark:hover:bg-slate-700\b/g, to: 'dark:hover:bg-slate-800' },
    { from: /dark:bg-slate-700\b/g, to: 'dark:bg-slate-800' },
    // 4. Shift borders from 700 to 800
    { from: /dark:border-slate-700\b/g, to: 'dark:border-slate-800' },
    { from: /dark:border-slate-600\b/g, to: 'dark:border-slate-700' },
    // 5. Shift generic dividers
    { from: /dark:divide-slate-700\b/g, to: 'dark:divide-slate-800' }
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
            if (fullPath.includes('Sidebar.tsx')) continue; // Already manually styled Sidebar for absolute perfect contrast, ignore it.

            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            for (const rule of replacements) {
                content = content.replace(rule.from, rule.to);
            }

            if (content !== originalContent) {
                console.log(`Updated theme in: ${file}`);
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

console.log('Starting global dark mode update...');
processDirectory(searchDirectory);
console.log('Complete!');
