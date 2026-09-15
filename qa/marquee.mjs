import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root=new URL('../dist/', import.meta.url).pathname;
const t={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const srv=http.createServer((q,r)=>{let p=path.join(root,q.url.split('?')[0]);if(!fs.existsSync(p)||fs.statSync(p).isDirectory())p=path.join(root,'index.html');r.writeHead(200,{'Content-Type':t[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r);});
await new Promise(r=>srv.listen(4177,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const bad=[];
for(const [n,w,h] of [['desktop',1440,900],['tablet',820,1100],['mobile',390,844]]){
  const pg=await b.newPage({viewport:{width:w,height:h}});
  pg.on('pageerror',e=>bad.push(`[${n}] ${e.message}`));
  await pg.goto('http://localhost:4177',{waitUntil:'domcontentloaded'});
  await pg.waitForTimeout(1000);
  await pg.evaluate(()=>document.querySelector('.mq-band').scrollIntoView({block:'center'}));
  await pg.waitForTimeout(2600);  // let the scroll kick decay to zero first
  await pg.screenshot({path:`/tmp/mq-${n}.png`});
  const r=await pg.evaluate(async ()=>{
    const rows=[...document.querySelectorAll('.mq-track')];
    const setW=rows.map(t=>t.scrollWidth/2);
    const x0=rows.map(t=>new DOMMatrix(getComputedStyle(t).transform).m41);
    await new Promise(r=>setTimeout(r,900));
    const x1=rows.map(t=>new DOMMatrix(getComputedStyle(t).transform).m41);
    // the track wraps by exactly one set width, so unwrap before reading direction
    const delta=x1.map((v,i)=>{let d=v-x0[i];const w=setW[i];
      if(d>w/2)d-=w; if(d<-w/2)d+=w; return d;});
    const vpw=rows.map(t=>t.parentElement.clientWidth);
    // is there ever a visible gap? one set must be at least as wide as the viewport
    const tooShort=setW.map((s,i)=>s<vpw[i]).some(Boolean);
    return {x0,x1,setW,vpw,tooShort,
      delta, moving:delta.map(d=>Math.abs(d)>2), dir:delta.map(d=>Math.sign(d))};
  });
  if(!r.moving.every(Boolean)) bad.push(`[${n}] a row is not animating: ${JSON.stringify(r.moving)}`);
  if(r.dir[0]===r.dir[1]) bad.push(`[${n}] both rows travel the same direction ${JSON.stringify(r.dir)}`);
  if(r.tooShort) bad.push(`[${n}] a set (${r.setW.map(Math.round)}) is narrower than its viewport (${r.vpw}) — gap will show`);
  // overflow must stay contained
  if(await pg.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)) bad.push(`[${n}] H-OVERFLOW`);
  await pg.close();
}
await b.close(); srv.close();
console.log(bad.length?bad.join('\n'):'MARQUEE OK');
