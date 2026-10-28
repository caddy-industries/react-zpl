import { PNG } from 'pngjs';
import { readFileSync } from 'node:fs';
const W = JSON.parse(readFileSync(new URL('../src/text/font0-widths.json', import.meta.url)));
const URL_ = 'http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/';
const cases = [['Hello World',30,30],['SHIP TO: 1234-56',60,40],['Order #A-1002',25,25],['----',40,40],['mmmmmm',50,80],['Hello',40,undefined],['iiii|iiii',40,40]];
let zpl = '^XA^CI28';
cases.forEach(([s,h,w],i)=>{ zpl += `^FO20,${20+i*100}^A0N,${h}${w!==undefined?','+w:''}^FD${s}^FS`; });
zpl += '^FO20,800^A0N,200,200^FDHgÉ^FS^XZ';
const res = await fetch(URL_, {method:'POST', body: zpl, headers:{Accept:'image/png','Content-Type':'application/x-www-form-urlencoded'}});
const png = PNG.sync.read(Buffer.from(await res.arrayBuffer()));
const ink = (y0,y1)=>{let minx=1e9,maxx=-1,miny=1e9,maxy=-1;for(let y=y0;y<y1;y++)for(let x=0;x<png.width;x++)if(png.data[(y*png.width+x)*4]<128){minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);}return {minx,maxx,miny,maxy};};
cases.forEach(([s,h,w],i)=>{const b=ink(20+i*100-5, 20+i*100+95); const pred=[...s].reduce((a,c)=>a+(W[c]??0.5)*(w??h),0); console.log(JSON.stringify(s),h,w,'ink',b.minx-20,b.maxx-20+1,'pred',pred.toFixed(1),'y',b.miny-(20+i*100),b.maxy-(20+i*100)+1);});
// vertical metrics for H, g, É
for (const [ch,off] of [['H',0],['g',1],['É',2]]) {}
const b = ink(790, 1100); console.log('HgÉ@200 y', b.miny-800, b.maxy-800+1);
let zpl2='^XA^CI28^FO20,20^A0N,200,200^FDH^FS^FO300,20^A0N,200,200^FDg^FS^FO600,20^A0N,200,200^FDÉ^FS^XZ';
const r2 = await fetch(URL_, {method:'POST', body: zpl2, headers:{Accept:'image/png','Content-Type':'application/x-www-form-urlencoded'}});
const p2 = PNG.sync.read(Buffer.from(await r2.arrayBuffer()));
for (const [x0,x1,n] of [[0,290,'H'],[290,590,'g'],[590,812,'É']]){let miny=1e9,maxy=-1;for(let y=0;y<400;y++)for(let x=x0;x<x1;x++)if(p2.data[(y*p2.width+x)*4]<128){miny=Math.min(miny,y);maxy=Math.max(maxy,y);} console.log(n,'top',miny-20,'bottom',maxy-20+1);}
