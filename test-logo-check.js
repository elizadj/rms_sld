const { chromium } = require('@playwright/test');
const path = require('path');
const OUT  = path.join(__dirname, 'test-output');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const fileUrl = 'file:///' + __dirname.replace(/\\/g, '/') + '/sld_builder.html';
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  await page.locator('#excelFile').setInputFiles(path.join(__dirname, 'WENDOUREE_Schematic_CORRECTED.xlsx'));
  await page.waitForTimeout(3000);

  // Click MSB-4 page (first page, which has an incomer with CT and meter)
  const pages = page.locator('.tree-page-name');
  await pages.nth(0).click();
  await page.waitForTimeout(1500);

  const check = await page.evaluate(() => {
    const svg = document.querySelector('svg.schematic-svg');
    if (!svg) return { error: 'no svg' };

    // Check for lightning bolt polygon in title area (fill #CC3366)
    const boltPoly = [...svg.querySelectorAll('polygon')].find(p => p.getAttribute('fill') === '#CC3366');
    // Check for "Remote Metering Solutions" text
    const rmsText = [...svg.querySelectorAll('text')].find(t => t.textContent.includes('Remote Metering Solutions'));
    // Check meter label offset — find the first circle with r=12, then check next text x
    const meterCircle = [...svg.querySelectorAll('circle')].find(c => c.getAttribute('r') === '12');
    const meterLabels = [...svg.querySelectorAll('text')].filter(t => {
      const x = parseFloat(t.getAttribute('x') || '0');
      const transform = t.getAttribute('transform') || '';
      return transform.includes('rotate(-90') && x > 0;
    });

    return {
      boltFound:   !!boltPoly,
      boltFill:    boltPoly?.getAttribute('fill'),
      rmsText:     rmsText?.textContent?.trim(),
      rmsFont:     rmsText?.getAttribute('font-family'),
      meterCx:     meterCircle ? parseFloat(meterCircle.getAttribute('cx')) : null,
      meterR:      meterCircle ? parseFloat(meterCircle.getAttribute('r'))  : null,
      labelCount:  meterLabels.length,
      firstLabelX: meterLabels[0] ? parseFloat(meterLabels[0].getAttribute('x')) : null,
    };
  });

  console.log('Logo + label check:', JSON.stringify(check, null, 2));

  // Screenshot this page specifically
  const wrap = page.locator('.schematic-wrap').first();
  if (await wrap.count()) {
    await wrap.screenshot({ path: path.join(OUT, 'sld-logo-check.png') });
    console.log('Saved sld-logo-check.png');
  }

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
