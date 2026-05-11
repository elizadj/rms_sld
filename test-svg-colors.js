const { chromium } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');
const OUT  = path.join(__dirname, 'test-output');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const fileUrl = 'file:///' + __dirname.replace(/\\/g, '/') + '/sld_builder.html';
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Import Excel
  const xlsxPath = path.join(__dirname, 'WENDOUREE_Schematic_CORRECTED.xlsx');
  await page.locator('#excelFile').setInputFiles(xlsxPath);
  await page.waitForTimeout(3000);

  // Click the first page in sidebar
  const firstPage = page.locator('.tree-page-name').first();
  if (await firstPage.count()) {
    await firstPage.click();
    await page.waitForTimeout(1500);
  }

  // Screenshot the canvas
  await page.screenshot({ path: path.join(OUT, 'sld-themed.png'), fullPage: false });
  console.log('Saved sld-themed.png');

  // Inspect SVG colors
  const svgColors = await page.evaluate(() => {
    const svg = document.querySelector('svg.schematic-svg');
    if (!svg) return { error: 'No SVG found' };

    // Check specific elements
    const titleRect = svg.querySelector('rect:nth-child(2)');  // second rect = title bar
    const busLine = [...svg.querySelectorAll('line')].find(l => l.getAttribute('stroke-width') === '5');
    const spineLines = [...svg.querySelectorAll('line')].filter(l => l.getAttribute('stroke-width') === '1.5');
    const footerRect = [...svg.querySelectorAll('rect')].find(r => {
      const y = parseFloat(r.getAttribute('y') || '0');
      return y > 200 && r.getAttribute('fill') === '#232C63';
    });

    return {
      titleFill:   titleRect?.getAttribute('fill'),
      busFill:     busLine?.getAttribute('stroke'),
      spineStroke: spineLines[0]?.getAttribute('stroke'),
      footerFound: !!footerRect,
      svgFont:     svg.getAttribute('font-family'),
    };
  });

  console.log('SVG color check:', JSON.stringify(svgColors, null, 2));

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
