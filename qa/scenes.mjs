import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root=new URL('../dist/', import.meta.url).pathname;
const t={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const srv=http.createServer((q,r)=>{let p=path.join(root,q.url.split('?')[0]);if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'index.html');r.writeHead(200,{'Content-Type':t[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r);});
await new Promise(r=>srv.listen(4179,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const out=[];

const veilAt = (pg, id) => pg.evaluate(i=>{
  const v=document.querySelector(`#${i} .scene-veil`);
  return v ? +getComputedStyle(v).opacity : null;
}, id);

async function run(label, forceFallback){
  const pg=await b.newPage({viewport:{width:1440,height:900}});
  if(forceFallback) await pg.addInitScript(()=>{});
  pg.on('pageerror',e=>out.push(`[${label}] ${e.message}`));
  await pg.goto('http://localhost:4179',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(1000);

  for(const id of ['about','experience','projects','skills','education','contact']){
    // park the section's top edge just below the fold: the veil should be near-opaque
    await pg.evaluate(i=>{const e=document.getElementById(i);window.scrollTo({top:e.offsetTop-window.innerHeight*0.95,behavior:'instant'})},id);
    await pg.waitForTimeout(450);
    const before=await veilAt(pg,id);
    // now bring it fully into frame: the veil must have lifted
    await pg.evaluate(i=>{const e=document.getElementById(i);window.scrollTo({top:e.offsetTop-40,behavior:'instant'})},id);
    await pg.waitForTimeout(650);
    const after=await veilAt(pg,id);
    if(before===null){out.push(`[${label}] #${id} has no scene layer`);continue;}
    if(before<0.5) out.push(`[${label}] #${id} veil only ${before.toFixed(2)} before entering (expected ~1)`);
    if(after>0.12) out.push(`[${label}] #${id} veil stuck at ${after.toFixed(2)} after entering (expected ~0)`);
    if(!(before-after>0.5)) out.push(`[${label}] #${id} veil did not track scroll (${before.toFixed(2)}→${after.toFixed(2)})`);
  }
  // the veil must never swallow clicks
  const blocked=await pg.evaluate(()=>{
    const v=document.querySelector('#contact .scene-veil');
    return getComputedStyle(v).pointerEvents!=='none';
  });
  if(blocked) out.push(`[${label}] scene veil is not pointer-events:none`);
  // links under a settled scene must still be reachable
  await pg.evaluate(()=>document.getElementById('contact').scrollIntoView());
  await pg.waitForTimeout(700);
  // the controls under a settled scene must still receive the pointer
  const hit=await pg.evaluate(async ()=>{
    const targets=['#contact .cf-send','#contact .copy-btn','#contact .contact-social a'];
    const probs=[];
    for(const sel of targets){
      const a=document.querySelector(sel);
      if(!a){ probs.push(`${sel}: missing`); continue; }
      // hit-test only makes sense once the control is actually on screen
      a.scrollIntoView({block:'center',behavior:'instant'});
      await new Promise(r=>requestAnimationFrame(r));
      await new Promise(r=>setTimeout(r,120));
      const r=a.getBoundingClientRect();
      if(r.width===0){ probs.push(`${sel}: not rendered`); continue; }
      const el=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
      if(!(el && (a.contains(el)||a===el)))
        probs.push(`${sel}: covered by <${el?.tagName.toLowerCase()||'nothing'}${el?.className?` class="${el.className}"`:''}>`);
    }
    return probs;
  });
  hit.forEach(h=>out.push(`[${label}] ${h}`));
  await pg.screenshot({path:`/tmp/scene-${label}.png`});
  await pg.close();
}

await run('engine', false);

// reduced motion: the scene layers must be gone, content fully visible
const pr=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
await pr.goto('http://localhost:4179',{waitUntil:'domcontentloaded'});
await pr.waitForTimeout(800);
await pr.evaluate(()=>document.getElementById('projects').scrollIntoView());
await pr.waitForTimeout(600);
const rm=await pr.evaluate(()=>{
  const c=document.querySelector('#projects .scene-cut');
  const h=document.querySelector('#projects h2');
  return {cut:getComputedStyle(c).display, head:+getComputedStyle(h.closest('.reveal')).opacity};
});
// reduce keeps the opacity cross-fade; only the travelling line is dropped
if(rm.cut!=='none') out.push(`REDUCED-MOTION: the sweeping cut line is still drawn (${rm.cut})`);
if(rm.head<0.99) out.push(`REDUCED-MOTION: section content at opacity ${rm.head}`);
await pr.close();

await b.close(); srv.close();
console.log(out.length?out.join('\n'):'SCENES OK — veil tracks scroll on every section, no click blocking, reduced-motion clean');
