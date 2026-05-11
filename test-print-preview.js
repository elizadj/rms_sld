const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname);
const OUT     = path.join(PROJECT, 'test-output');
const HTML    = path.join(PROJECT, 'sld_builder.html');
const XLSX    = path.join(PROJECT, 'WENDOUREE_Schematic_CORRECTED.xlsx');

function toFileUrl(p){ return 'file:///' + p.replace(/\\/g, '/'); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1800, height: 900 } });
  const page    = await context.newPage();

  page.on('dialog', async d => await d.accept());

  await page.goto(toFileUrl(HTML));
  await page.waitForFunction(() => typeof XLSX !== 'undefined', { timeout: 15000 }).catch(() => {});
  await page.locator('#excelFile').setInputFiles(XLSX);
  await page.waitForTimeout(2500);

  // Capture print-all popup as screenshot
  const [printPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 10000 }),
    page.click('button:has-text("Print All")'),
  ]);
  await printPage.waitForLoadState('domcontentloaded');
  await printPage.waitForTimeout(1500);

  // Full-page screenshot of the print HTML (before browser print dialog fires)
  await printPage.screenshot({
    path: path.join(OUT, 'print-preview-full.png'),
    fullPage: true,
    timeout: 45000,
  });
  console.log('Print preview screenshot saved.');

  // Also get per-SVG sizes from the print page
  const svgData = await printPage.evaluate(() =>
    [...document.querySelectorAll('svg')].map((svg, i) => ({
      idx: i,
      w:   parseFloat(svg.getAttribute('width')  || 0),
      h:   parseFloat(svg.getAttribute('height') || 0),
      texts: [...svg.querySelectorAll('text')].map(t => t.textContent.trim()).filter(Boolean),
    }))
  );
  const A3_PX = 1526; // approx 404mm @ 96dpi
  svgData.forEach(s => {
    const scale = s.w > A3_PX ? (A3_PX / s.w * 100).toFixed(1) : '100.0';
    const clipped = s.texts.filter(t => t.endsWith('…'));
    console.log(`SVG ${s.idx+1}: ${s.w}×${s.h}px → prints at ~${scale}%${clipped.length ? '  CLIPPED: '+clipped.join(', ') : ''}`);
  });

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
