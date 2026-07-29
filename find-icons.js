import fs from 'fs';
const txt = fs.readFileSync('node_modules/reicon-react/index.d.ts', 'utf8');
const exports = [...txt.matchAll(/export \{ (\w+) \}/g)].map(m => m[1]);
const keys = ['lock', 'padlock', 'secure', 'safe'];
console.log(exports.filter(e => keys.some(k => e.toLowerCase().includes(k))));
