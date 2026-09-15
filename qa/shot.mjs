import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root=new URL('../dist/', import.meta.url).pathname;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const srv=http.createServer((q,r)=>{let p=path.join(root,q.url.split('?')[0]);if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'index.html');r.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r);});
await new Promise(r=>srv.listen(4173,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const errs=[];
for(const [name,w,h] of [['desktop',1440,900],['tablet',820,1100],['mobile',390,844]]){
  const pg=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:name==='mobile'});
  pg.on('console',m=>{if(m.type()==='error'&&!m.text().includes('TUNNEL'))errs.push(`[${name}] ${m.text()}`)});
  pg.on('pageerror',e=>errs.push(`[${name}] PAGEERROR ${e.message}`));
  await pg.goto('http://localhost:4173',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(2500);
  await pg.screenshot({path:`/tmp/${name}-hero.png`});
  if(await pg.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1))errs.push(`[${name}] H-OVERFLOW`);
  for(const id of ['about','experience','projects','skills','education','contact']){
    await pg.evaluate(i=>document.getElementById(i)?.scrollIntoView(),id);
    await pg.waitForTimeout(id==='experience'?3000:1100);
    await pg.screenshot({path:`/tmp/${name}-${id}.png`});
  }
  // anchor-offset check: does the heading clear the fixed nav?
  await pg.evaluate(()=>location.hash='#projects'); await pg.waitForTimeout(900);
  const clear=await pg.evaluate(()=>{const h=document.querySelector('#projects h2').getBoundingClientRect();const n=document.querySelector('.nav').getBoundingClientRect();return h.top>n.bottom;});
  if(!clear)errs.push(`[${name}] anchor scroll hides heading under nav`);
  // tab-order check: closed mobile menu must not be focusable
  const leak=await pg.evaluate(()=>{const m=document.getElementById('mobile-menu');return !m.classList.contains('open')&&!m.hasAttribute('inert');});
  if(leak)errs.push(`[${name}] closed mobile menu still focusable`);
  await pg.close();
}
await b.close(); srv.close();
console.log(errs.length?errs.join('\n'):'CLEAN: no console errors, no overflow, anchors clear nav, no focus leak');
