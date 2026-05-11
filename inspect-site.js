const { chromium } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');
const OUT  = path.join(__dirname, 'test-output');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://www.remotemetering.net/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Full-page screenshot
  await page.screenshot({ path: path.join(OUT, 'rms-site.png'), fullPage: false });

  // Extract computed styles from key elements
  const styles = await page.evaluate(() => {
    const get = (sel, props) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const out = { selector: sel };
      props.forEach(p => out[p] = cs.getPropertyValue(p));
      out.tag = el.tagName;
      out.classes = el.className;
      return out;
    };
    const props = [
      'background-color','color','font-family','font-size','font-weight',
      'border','border-radius','padding','margin','letter-spacing','text-transform',
      'box-shadow','line-height'
    ];
    return {
      body:       get('body',           props),
      header:     get('header, #header, .header, [class*="header"]', props),
      nav:        get('nav, .nav, #nav, .navbar, [class*="nav"]',    props),
      navLink:    get('nav a, .nav a, header a',                     props),
      h1:         get('h1',             props),
      h2:         get('h2',             props),
      btn:        get('a.btn, .btn, button, [class*="btn"], [class*="button"]', props),
      footer:     get('footer, #footer, .footer',                    props),
      // Grab CSS custom properties from :root
      cssVars: (() => {
        const sheets = [...document.styleSheets];
        const vars = {};
        sheets.forEach(sheet => {
          try {
            const rules = [...sheet.cssRules||[]];
            rules.forEach(rule => {
              if(rule.selectorText === ':root'){
                const text = rule.cssText;
                const matches = text.matchAll(/--([\w-]+)\s*:\s*([^;]+)/g);
                for(const m of matches) vars['--'+m[1]] = m[2].trim();
              }
            });
          } catch(e){}
        });
        return vars;
      })(),
      // Grab all unique background-color and color values used across key elements
      allColors: (() => {
        const colors = new Set();
        document.querySelectorAll('*').forEach(el => {
          const cs = getComputedStyle(el);
          const bg = cs.backgroundColor;
          const fg = cs.color;
          if(bg && bg !== 'rgba(0, 0, 0, 0)') colors.add('bg:'+bg);
          if(fg) colors.add('fg:'+fg);
        });
        return [...colors].slice(0, 60);
      })(),
      // Font stacks actually in use
      fonts: (() => {
        const fonts = new Set();
        document.querySelectorAll('body, h1, h2, h3, p, a, button').forEach(el => {
          fonts.add(getComputedStyle(el).fontFamily);
        });
        return [...fonts];
      })(),
      // Logo src
      logo: (() => {
        const img = document.querySelector('img[src*="logo"], img[alt*="logo"], img[alt*="Logo"], header img, .logo img');
        return img ? { src: img.src, alt: img.alt, width: img.width, height: img.height } : null;
      })(),
      // Page title
      title: document.title,
    };
  });

  fs.writeFileSync(path.join(OUT, 'rms-site-styles.json'), JSON.stringify(styles, null, 2));
  console.log('Screenshot and styles saved.');
  console.log('Title:', styles.title);
  console.log('CSS vars:', JSON.stringify(styles.cssVars, null, 2));
  console.log('Fonts:', styles.fonts);
  console.log('Body bg:', styles.body?.['background-color'], 'color:', styles.body?.color, 'font:', styles.body?.['font-family']);
  console.log('Nav bg:', styles.nav?.['background-color'], 'color:', styles.nav?.color);
  console.log('H1:', styles.h1?.color, styles.h1?.['font-family'], styles.h1?.['font-size']);
  console.log('Btn:', styles.btn?.['background-color'], styles.btn?.color, styles.btn?.['border-radius']);
  console.log('Unique colors (first 30):', styles.allColors.slice(0,30));

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
