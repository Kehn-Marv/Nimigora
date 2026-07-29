import fs from 'fs';
const files = [
    'app/page.tsx',
    'app/components/PaywallModal.tsx',
    'app/components/ExclusiveCard.tsx',
    'app/components/ArticleCards.tsx',
    'app/article/[slug]/ArticleContent.tsx'
];
files.forEach(f => {
    let text = fs.readFileSync(f, 'utf8');
    // We want to replace the Lock component and its import
    text = text.replace(/\bLock\b/g, 'LockKeyhole');
    fs.writeFileSync(f, text, 'utf8');
    console.log(`Replaced Lock with LockKeyhole in ${f}`);
});
