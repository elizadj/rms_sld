/**
 * SLD Builder — Playwright visual inspection script
 * Run with: node test-sld.js
 *
 * What it does:
 *  1. Opens sld_builder.html in a headed Chromium window
 *  2. Imports WENDOUREE_Schematic_CORRECTED.xlsx
 *  3. Screenshots every MSB page in the canvas
 *  4. Captures the "Print All" output as a PDF
 *  5. Writes everything to test-output/
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const PROJECT = path.resolve(__dirname);
const OUT     = path.join(PROJECT, 'test-output');
const HTML    = path.join(PROJECT, 'sld_builder.html');
const XLSX    = path.join(PROJECT, 'WENDOUREE_Schematic_CORRECTED.xlsx');

// Convert Windows path to file:/// URL
function toFileUrl(p) {
  return 'file:///' + p.replace(/\\/g, '/');
}

function safe(s) {
  return (s || '').trim().replace(/[^a-z0-9_-]/gi, '_').substring(0, 40);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    headless: false,       // visible window so we can see what's happening
    slowMo: 150,
  });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
  });
  const page = await context.newPage();

  // ── Capture all console messages from the app ─────────────────────────────
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[pageerror] ${err.message}`));

  // ── Handle alert / confirm dialogs automatically ──────────────────────────
  const dialogs = [];
  page.on('dialog', async dlg => {
    dialogs.push({ type: dlg.type(), message: dlg.message() });
    await dlg.accept();
  });

  // ── 1. Load the app ───────────────────────────────────────────────────────
  console.log('Loading sld_builder.html …');
  await page.goto(toFileUrl(HTML));
  // Wait for the xlsx CDN script to finish loading
  await page.waitForFunction(() => typeof XLSX !== 'undefined', { timeout: 15000 }).catch(() => {
    console.warn('WARNING: xlsx CDN script may not have loaded — Excel import could fail');
  });
  await page.screenshot({ path: path.join(OUT, '00-app-loaded.png') });
  console.log('  → Screenshot: 00-app-loaded.png');

  // ── 2. Import the Excel file ──────────────────────────────────────────────
  console.log('Importing Excel file …');
  await page.locator('#excelFile').setInputFiles(XLSX);
  // The import is synchronous (FileReader) — wait for the alert that confirms it
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, '01-after-import.png') });
  console.log('  → Screenshot: 01-after-import.png');
  if (dialogs.length) {
    console.log('  Import dialog:', dialogs.map(d => d.message).join(' | '));
  }

  // ── 3. Collect all page entries from the sidebar ──────────────────────────
  const pageItems = await page.locator('.tree-page-name').all();
  console.log(`Found ${pageItems.length} MSB page(s) in the sidebar`);

  const issues = [];    // collect text descriptions of problems found

  for (let i = 0; i < pageItems.length; i++) {
    const item = pageItems[i];

    // Re-query each time — DOM may have re-rendered
    const pageLinks = await page.locator('.tree-page-name').all();
    const thisItem  = pageLinks[i];

    const rawText  = await thisItem.textContent();
    const pageName = (rawText || `page-${i+1}`).trim().replace(/\s+/g, ' ');
    console.log(`\nPage ${i + 1}: "${pageName}"`);

    await thisItem.click();
    await page.waitForTimeout(600);

    const fname = `page-${String(i + 1).padStart(2, '0')}-${safe(pageName)}.png`;
    await page.screenshot({ path: path.join(OUT, fname), fullPage: false });
    console.log(`  → Screenshot: ${fname}`);

    // ── Inspect the SVG for common rendering problems ─────────────────────
    const svgInfo = await page.evaluate(() => {
      const svg = document.querySelector('.schematic-svg');
      if (!svg) return { found: false };

      const svgW    = parseFloat(svg.getAttribute('width')  || 0);
      const svgH    = parseFloat(svg.getAttribute('height') || 0);
      const allText = [...svg.querySelectorAll('text')].map(t => t.textContent.trim());
      const circles = svg.querySelectorAll('circle').length;
      const lines   = svg.querySelectorAll('line').length;
      const rects   = svg.querySelectorAll('rect').length;

      // Check for clipped/ellipsis text (indicates a column is too narrow)
      const clipped = allText.filter(t => t.endsWith('…'));

      // Check for empty load-name boxes (text array is empty for a column)
      const boxRects = [...svg.querySelectorAll('rect[onclick]')];

      // Check for any text that is an empty string (invisible label)
      const emptyText = allText.filter(t => t === '');

      // Check viewBox vs width/height consistency
      const vb = svg.getAttribute('viewBox');

      // Grab all bus-section labels (look for Section A / Section B text)
      const sectionLabels = allText.filter(t => /^Section\s+[A-Z]/.test(t));

      // Look for "OUTSIDE EN" / "INSIDE EN" boundary labels
      const boundaryLabels = allText.filter(t => /EN$/.test(t));

      // Check for any text containing "undefined" or "null" (JS rendering bug)
      const badText = allText.filter(t => t.includes('undefined') || t.includes('null') || t.includes('[object'));

      return {
        found: true,
        svgW, svgH, vb,
        textCount: allText.length,
        circles, lines, rects,
        clipped,
        emptyText: emptyText.length,
        sectionLabels,
        boundaryLabels,
        boxCount: boxRects.length,
        badText,
        allText,
      };
    });

    if (!svgInfo.found) {
      issues.push(`Page ${i + 1} "${pageName}": SVG not found in canvas`);
      continue;
    }

    console.log(`  SVG: ${svgInfo.svgW} × ${svgInfo.svgH}px  |  ${svgInfo.boxCount} load boxes  |  ${svgInfo.circles} circles  |  ${svgInfo.textCount} text nodes`);

    if (svgInfo.clipped.length) {
      const clip = svgInfo.clipped.join(', ');
      issues.push(`Page ${i + 1} "${pageName}": text clipped (truncated with …): ${clip}`);
      console.log(`  ⚠ Clipped text: ${clip}`);
    }
    if (svgInfo.badText.length) {
      issues.push(`Page ${i + 1} "${pageName}": JS rendering bug — text contains "undefined"/"null": ${svgInfo.badText.join(', ')}`);
      console.log(`  ⚠ Bad text values: ${svgInfo.badText.join(', ')}`);
    }
    if (svgInfo.sectionLabels.length) {
      console.log(`  Bus sections: ${svgInfo.sectionLabels.join(', ')}`);
    }
    if (svgInfo.boundaryLabels.length) {
      console.log(`  Boundary bands: ${svgInfo.boundaryLabels.join(', ')}`);
    }
    if (svgInfo.boxCount === 0) {
      issues.push(`Page ${i + 1} "${pageName}": no circuit/sub-board boxes rendered — page may be empty`);
      console.log('  ⚠ No load boxes found');
    }

    // ── Check: does the canvas title bar show the right page? ────────────
    const canvasTitle = await page.locator('#canvas-title').textContent();
    console.log(`  Canvas title: "${canvasTitle}"`);
    if (!canvasTitle || canvasTitle.includes('Select a page')) {
      issues.push(`Page ${i + 1} "${pageName}": canvas title bar still shows placeholder after clicking the page`);
    }

    // Write the full text dump for this page to a log file
    fs.writeFileSync(
      path.join(OUT, `page-${String(i + 1).padStart(2, '0')}-text-dump.txt`),
      svgInfo.allText.join('\n'),
      'utf8'
    );
  }

  // ── 4. Capture Print All output as a PDF ──────────────────────────────────
  console.log('\nGenerating "Print All" PDF …');
  const [printPage] = await Promise.all([
    context.waitForEvent('page'),
    page.click('button:has-text("Print All")'),
  ]);
  await printPage.waitForLoadState('domcontentloaded');
  await printPage.waitForTimeout(1000);

  // Save the print window as a PDF
  const pdfPath = path.join(OUT, 'wendouree-print-all.pdf');
  await printPage.pdf({
    path: pdfPath,
    format: 'A3',
    landscape: true,
    printBackground: true,
    margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' },
  });
  console.log(`  → PDF saved: wendouree-print-all.pdf`);

  // Screenshot of the print preview too
  await printPage.screenshot({ path: path.join(OUT, 'print-preview.png'), fullPage: true });
  console.log('  → Screenshot: print-preview.png');

  // ── Inspect the print page SVGs ───────────────────────────────────────────
  const printInfo = await printPage.evaluate(() => {
    const svgs = [...document.querySelectorAll('svg')];
    return svgs.map((svg, idx) => {
      const allText = [...svg.querySelectorAll('text')].map(t => t.textContent.trim());
      const clipped = allText.filter(t => t.endsWith('…'));
      const badText = allText.filter(t => t.includes('undefined') || t.includes('null'));
      return {
        idx,
        w: parseFloat(svg.getAttribute('width')  || 0),
        h: parseFloat(svg.getAttribute('height') || 0),
        textCount: allText.length,
        clipped,
        badText,
      };
    });
  });

  printInfo.forEach(p => {
    console.log(`  Print page SVG ${p.idx + 1}: ${p.w} × ${p.h}px  |  ${p.textCount} text nodes`);
    if (p.clipped.length)  { issues.push(`Print SVG ${p.idx + 1}: text clipped: ${p.clipped.join(', ')}`); console.log(`    ⚠ Clipped: ${p.clipped.join(', ')}`); }
    if (p.badText.length)  { issues.push(`Print SVG ${p.idx + 1}: bad text: ${p.badText.join(', ')}`);    console.log(`    ⚠ Bad text: ${p.badText.join(', ')}`); }
  });

  await printPage.close();

  // ── 5. Final screenshot of the main app ───────────────────────────────────
  await page.bringToFront();
  await page.screenshot({ path: path.join(OUT, '99-final-state.png') });

  // ── 6. Write summary report ───────────────────────────────────────────────
  const reportLines = [
    '# SLD Builder — Visual Inspection Report',
    `Date: ${new Date().toISOString()}`,
    `Source: ${XLSX}`,
    '',
    `## Pages inspected: ${pageItems.length}`,
    '',
    '## Issues found',
    issues.length ? issues.map(i => `- ${i}`).join('\n') : '- None detected',
    '',
    '## Console / JS errors',
    consoleLogs.filter(l => l.startsWith('[error') || l.startsWith('[pageerror')).length
      ? consoleLogs.filter(l => l.startsWith('[error') || l.startsWith('[pageerror')).join('\n')
      : '- None',
    '',
    '## Import dialogs',
    dialogs.map(d => `- [${d.type}] ${d.message}`).join('\n') || '- None',
  ];

  const reportPath = path.join(OUT, 'report.md');
  fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf8');
  console.log('\n─────────────────────────────────────────────');
  console.log(`Issues found: ${issues.length}`);
  issues.forEach(i => console.log(`  • ${i}`));
  console.log(`\nFull report: ${reportPath}`);
  console.log(`Output folder: ${OUT}`);
  console.log('─────────────────────────────────────────────');

  await browser.close();
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
