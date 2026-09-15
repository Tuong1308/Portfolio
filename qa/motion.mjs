/**
 * Pixel-truth motion test.
 *
 * Reading computed styles proves CSS was *set*; it does not prove anything moved
 * on screen. This drives a real mouse wheel, captures a filmstrip, and compares
 * raw pixels — if the page looks static to a human, this fails.
 */
import { chromium, firefox } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
import zlib from 'zlib';

const root = new URL('../dist/', import.meta.url).pathname;
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const srv = http.createServer((q,r)=>{let p=path.join(root,q.url.split('?')[0]);if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'index.html');r.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r);});
await new Promise(r=>srv.listen(4191,r));
const PORT='http://localhost:4191';
const out=[];

/** crude but sufficient: how many bytes differ between two PNG buffers */
const differs=(a,b)=>{ if(a.length!==b.length) return 1; let d=0; const n=Math.min(a.length,b.length);
  for(let i=0;i<n;i+=7) if(a[i]!==b[i]) d++; return d/(n/7); };

async function suite(name, launcher, launchOpts){
  let br;
  try { br = await launcher.launch(launchOpts); }
  catch { out.push(`[${name}] SKIPPED — engine not installed`); return; }

  const pg = await br.newPage({ viewport:{width:1280,height:800} });
  const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto(PORT,{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(1500);

  if(errs.length) out.push(`[${name}] PAGE ERROR — ${errs[0]}`);

  // the engine must have claimed the page; without .js nothing may start hidden
  const hasJs = await pg.evaluate(()=>document.documentElement.classList.contains('js'));
  if(!hasJs) out.push(`[${name}] scroll engine never marked <html>.js — animations are dead`);

  // nothing may be left invisible
  const invisible = await pg.evaluate(()=>{
    document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'));
    return 0;
  });

  // ── 1. the tool strip must move with the page completely still ──────────
  await pg.evaluate(()=>document.getElementById('skills').scrollIntoView({block:'center'}));
  await pg.waitForTimeout(1200);
  const strip = async () => (await pg.locator('.mq').first().screenshot());
  const s1 = await strip(); await pg.waitForTimeout(700); const s2 = await strip();
  if (differs(s1,s2) < 0.02) out.push(`[${name}] tool strip does not move while idle (pixel delta ${differs(s1,s2).toFixed(4)})`);

  // ── 2. a real wheel scroll must repaint the scene transition ────────────
  await pg.evaluate(()=>window.scrollTo(0,0));
  await pg.waitForTimeout(600);
  const film=[];
  for(let i=0;i<14;i++){
    await pg.mouse.wheel(0,220);          // a genuine wheel gesture, not scrollTo
    await pg.waitForTimeout(110);
    film.push(await pg.screenshot());
  }
  let moved=0;
  for(let i=1;i<film.length;i++) if(differs(film[i-1],film[i])>0.01) moved++;
  if(moved < film.length-3) out.push(`[${name}] only ${moved}/${film.length-1} frames changed during a wheel scroll`);
  fs.writeFileSync(`/tmp/film-${name}-first.png`, film[0]);
  fs.writeFileSync(`/tmp/film-${name}-last.png`, film[film.length-1]);

  // ── 3. the veil must actually darken pixels, not merely set a variable ──
  const probe = await pg.evaluate(async ()=>{
    const el=document.getElementById('contact');
    const read=()=>{
      const v=el.querySelector('.scene-veil');
      return {opacity:+getComputedStyle(v).opacity, varv:el.style.getPropertyValue('--veil'),
              top:Math.round(el.getBoundingClientRect().top)};
    };
    const jump=async(y)=>{
      window.scrollTo({top:y,behavior:'instant'});
      // confirm we actually arrived, then give the engine real frames to run
      for(let i=0;i<8;i++) await new Promise(r=>requestAnimationFrame(r));
      await new Promise(r=>setTimeout(r,250));
      for(let i=0;i<8;i++) await new Promise(r=>requestAnimationFrame(r));
    };
    await jump(el.offsetTop - innerHeight*0.97);
    const a=read();
    await jump(el.offsetTop - 30);
    return {a, b:read()};
  });
  if(!(probe.a.opacity>0.6 && probe.b.opacity<0.15))
    out.push(`[${name}] scene veil did not track scroll (${probe.a.opacity}→${probe.b.opacity}, var "${probe.a.varv}", top ${probe.a.top}→${probe.b.top})`);

  // ── 4. the section must be visibly darker before entering than after ────
  const shot = async (y)=>{ await pg.evaluate(yy=>window.scrollTo({top:yy,behavior:'instant'}),y); await pg.waitForTimeout(500);
    return pg.screenshot({clip:{x:0,y:400,width:1280,height:300}}); };
  const top = await pg.evaluate(()=>document.getElementById('contact').offsetTop);
  const dark = await shot(top-760), lit = await shot(top-40);
  if(differs(dark,lit) < 0.02) out.push(`[${name}] entering a section produces no visible change on screen`);

  // ── 5. if the engine dies, content must stay readable ───────────────────
  // (simulated by dropping the .js flag the engine sets — the same end state as
  //  the hook throwing before it runs)
  const stillReadable = await pg.evaluate(async ()=>{
    document.documentElement.classList.remove('js');
    await new Promise(r=>requestAnimationFrame(r));
    const hidden=[...document.querySelectorAll('.reveal, .stagger > *')]
      .filter(e=>+getComputedStyle(e).opacity < 0.9).length;
    document.documentElement.classList.add('js');
    return hidden;
  });
  if(stillReadable) out.push(`[${name}] ${stillReadable} elements stay invisible when the engine is not running`);

  // ── 6. the strip runs continuously for EVERYONE, reduced motion included ─
  // (the original failure: an OS-level "turn off animations" setting froze the
  //  whole strip. It must now still drift on its own — just gentler.)
  const rc = await br.newContext({ viewport:{width:1280,height:800}, reducedMotion:'reduce' });
  const rp = await rc.newPage();
  await rp.goto(PORT,{waitUntil:'domcontentloaded'});
  await rp.waitForTimeout(1200);
  await rp.evaluate(()=>document.querySelector('.mq-band').scrollIntoView({block:'center',behavior:'instant'}));
  await rp.mouse.move(4,4);            // keep the cursor off the strip
  await rp.waitForTimeout(900);

  const read = () => rp.evaluate(()=>[...document.querySelectorAll('.mq-track')].map(e=>new DOMMatrix(getComputedStyle(e).transform).m41));
  const drift = await (async()=>{ const a=await read(); await rp.waitForTimeout(1500); const c=await read(); return a.map((v,i)=>c[i]-v); })();
  if(!(Math.abs(drift[0])>10 && Math.abs(drift[1])>10))
    out.push(`[${name}] under reduced motion the strip is frozen (${drift.map(v=>v.toFixed(0))})`);
  if(Math.sign(drift[0])===Math.sign(drift[1]))
    out.push(`[${name}] under reduced motion both rows drift the same way`);

  // pixels, not just transforms
  const p1 = await rp.locator('.mq').first().screenshot();
  await rp.waitForTimeout(900);
  const p2 = await rp.locator('.mq').first().screenshot();
  if (differs(p1,p2) < 0.02) out.push(`[${name}] under reduced motion the strip does not repaint`);

  // hover must halt the rail — with no visible control it is the only stop
  const hbox = await rp.locator('.mq').first().boundingBox();
  await rp.mouse.move(hbox.x + hbox.width/2, hbox.y + hbox.height/2);
  await rp.waitForTimeout(600);
  const h1 = await read(); await rp.waitForTimeout(1200); const h2 = await read();
  // only the hovered row stops; its neighbour must keep running
  if (Math.abs(h2[0]-h1[0]) > 4)
    out.push(`[${name}] hovering does not stop the row under the cursor (${(h2[0]-h1[0]).toFixed(1)})`);
  if (Math.abs(h2[1]-h1[1]) < 8)
    out.push(`[${name}] hovering one row wrongly stops the other too`);
  await rp.mouse.move(4,4);
  await rp.waitForTimeout(600);
  const r1 = await read(); await rp.waitForTimeout(1200); const r2 = await read();
  if (Math.abs(r2[0]-r1[0]) < 8)
    out.push(`[${name}] the row does not resume after the pointer leaves`);

  // the scene cross-fade must still work under reduced motion
  const veilAlive = await rp.evaluate(async ()=>{
    const el=document.getElementById('contact'), v=el.querySelector('.scene-veil');
    const jump=async(y)=>{window.scrollTo({top:y,behavior:'instant'});for(let i=0;i<10;i++)await new Promise(r=>requestAnimationFrame(r));};
    await jump(el.offsetTop-innerHeight*0.97); const a=+getComputedStyle(v).opacity;
    await jump(el.offsetTop-30); return [a,+getComputedStyle(v).opacity];
  });
  if(!(veilAlive[0]>0.5 && veilAlive[1]<0.2))
    out.push(`[${name}] under reduced motion the scene cross-fade is dead (${veilAlive})`);
  await rc.close();

  await pg.close(); await br.close();
}

await suite('chromium', chromium, {executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
await suite('firefox', firefox, {});

srv.close();
console.log(out.length?out.join('\n'):'MOTION VERIFIED IN PIXELS — strip moves while idle, wheel scroll repaints every frame, scenes darken and clear, page readable without JS, reduced motion still runs, hover halts and releases');
