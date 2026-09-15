import { chromium } from 'playwright';
import fs from 'fs';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const out = '/tmp/parity'; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const res = {};
const tf = (p) => p.evaluate(() => document.querySelector('.mq-track').style.transform);

for (const [tag, port] of [['before', 4101], ['after', 4102]]) for (const vw of [1280, 390]) {
  const ctx = await b.newContext({ viewport: { width: vw, height: 860 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts/.test(m.text())) errs.push(m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto(`http://localhost:${port}/`); await p.waitForTimeout(1500);
  const r = { errs };
  for (const id of ['top', 'about', 'experience', 'projects', 'skills', 'education', 'contact']) {
    await p.evaluate(i => document.getElementById(i).scrollIntoView({ block: 'start' }), id);
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${out}/${tag}-${vw}-${id}.png` });
  }
  await p.evaluate(() => document.getElementById('skills').scrollIntoView());
  await p.waitForTimeout(800);
  r.dom = await p.evaluate(() => ({
    text: document.querySelector('main').innerText,
    canvases: document.querySelectorAll('canvas').length,
    pipeLabels: [...document.querySelectorAll('.pipe-label')].map(e => e.innerText),
    chips: document.querySelectorAll('.mq-chip').length > 0,
    navLinks: [...document.querySelectorAll('.nav-link')].map(a => a.getAttribute('href')),
    eduKinds: [...document.querySelectorAll('.edu-card .yr')].map(e => e.textContent),
    xpHeadings: [...document.querySelectorAll('.xp-item h4')].map(e => e.textContent),
  }));
  const t1 = await tf(p); await p.waitForTimeout(800); r.dom.mqMoving = t1 !== await tf(p);
  // scroll kick reacts (skew appears after a scroll)
  await p.mouse.wheel(0, 300); await p.waitForTimeout(60);
  r.dom.scrollSkew = /skewX\((?!0\.00)/.test(await tf(p));
  if (vw === 1280) {
    const box = await (await p.$('.mq')).boundingBox();
    await p.mouse.move(box.x + 50, box.y + box.height / 2); await p.waitForTimeout(400);
    const h1 = await tf(p); await p.waitForTimeout(600);
    r.dom.hoverPaused = h1 === await tf(p);
    await p.mouse.move(5, 5); await p.waitForTimeout(400);
    const h3 = await tf(p); await p.waitForTimeout(600);
    r.dom.resumesAfterLeave = h3 !== await tf(p);
    // orb hover label
    const ob = await (await p.$('.skills-canvas canvas')).boundingBox();
    let labelSeen = false;
    for (let gx = 0.2; gx <= 0.8 && !labelSeen; gx += 0.05) for (let gy = 0.2; gy <= 0.8 && !labelSeen; gy += 0.05) {
      await p.mouse.move(ob.x + ob.width * gx, ob.y + ob.height * gy); await p.waitForTimeout(40);
      labelSeen = await p.evaluate(() => document.querySelector('.orb-label').classList.contains('show'));
    }
    r.dom.orbHoverLabel = labelSeen;
  }
  if (vw === 390) {
    await p.click('.burger'); await p.waitForTimeout(300);
    r.dom.menuOpen = await p.evaluate(() => !document.getElementById('mobile-menu').hasAttribute('inert'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    r.dom.menuClosedByEsc = await p.evaluate(() => document.getElementById('mobile-menu').hasAttribute('inert'));
  }
  r.dom.toTopShown = await p.evaluate(() => document.querySelector('.to-top').classList.contains('show'));
  await p.evaluate(() => document.getElementById('contact').scrollIntoView());
  await p.click('.cf-send'); await p.waitForTimeout(200);
  r.dom.formErrors = await p.evaluate(() => [...document.querySelectorAll('.contact-form em')].map(e => e.textContent));
  // unmount/cleanup: navigate away should not throw
  await p.goto('about:blank');
  r.errsAfterUnload = errs.length;
  res[`${tag}-${vw}`] = r; await ctx.close();
}
await b.close();
for (const k of [1280, 390]) {
  const a = res[`before-${k}`], z = res[`after-${k}`], diff = {};
  for (const key of Object.keys(a.dom)) if (JSON.stringify(a.dom[key]) !== JSON.stringify(z.dom[key])) diff[key] = [a.dom[key], z.dom[key]];
  console.log(`[${k}] DOM/behaviour diff:`, JSON.stringify(diff), '| errors before:', a.errs, 'after:', z.errs);
  console.log(`[${k}] after:`, JSON.stringify({ ...z.dom, text: z.dom.text.length + ' chars' }));
}
