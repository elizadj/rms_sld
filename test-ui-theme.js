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
  await page.waitForTimeout(2000);

  // Screenshot of the default (empty) UI
  await page.screenshot({ path: path.join(OUT, 'ui-empty.png') });
  console.log('Saved ui-empty.png');

  // Check computed styles
  const styles = await page.evaluate(() => {
    const get = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return { missing: sel };
      const cs = getComputedStyle(el);
      return {
        bg:    cs.backgroundColor,
        color: cs.color,
        font:  cs.fontFamily.slice(0, 60),
        text:  el.textContent?.trim().slice(0, 50),
      };
    };
    return {
      toolbar:    get('#toolbar'),
      logo:       get('.logo'),
      primaryBtn: get('.tbtn.primary'),
      sidebar:    get('#sidebar'),
      canvasArea: get('#canvas-area'),
    };
  });
  console.log('Computed styles:', JSON.stringify(styles, null, 2));

  // Now import the Excel file and screenshot a page
  const xlsxPath = path.join(__dirname, 'WENDOUREE_Schematic_CORRECTED.xlsx');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles(xlsxPath);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT, 'ui-after-import.png') });
    console.log('Saved ui-after-import.png');

    // Click first page in sidebar
    const firstPage = await page.$('#page-list li');
    if (firstPage) {
      await firstPage.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUT, 'ui-page-01.png') });
      console.log('Saved ui-page-01.png');
    }
  }

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
