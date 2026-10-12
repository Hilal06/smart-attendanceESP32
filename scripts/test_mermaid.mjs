import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const mermaidBlocks = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    mermaidBlocks.push(match[1]);
  }

  console.log(`\nValidating ${filePath} (${mermaidBlocks.length} blocks)...`);

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script></head>
    <body><script>mermaid.initialize({ startOnLoad: false });</script></body>
    </html>
  `;
  await page.setContent(html);

  let allValid = true;
  for (let i = 0; i < mermaidBlocks.length; i++) {
    const code = mermaidBlocks[i];
    const result = await page.evaluate(async (diagramCode) => {
      try {
        return await mermaid.parse(diagramCode);
      } catch (e) {
        return { error: e.message || String(e) };
      }
    }, code);

    if (result && result.error) {
      allValid = false;
      console.error(`❌ Diagram ${i + 1} Error:`, result.error);
    } else {
      console.log(`✅ Diagram ${i + 1} is valid.`);
    }
  }

  await browser.close();
  return allValid;
}

(async () => {
  await validateFile('README.md');
  await validateFile('documentation/DEVELOPER_GUIDE.md');
})();
