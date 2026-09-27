import {createCanvas,GlobalFonts} from '@napi-rs/canvas';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const ROOT=path.dirname(fileURLToPath(import.meta.url));
export const T=JSON.parse(fs.readFileSync(path.join(ROOT,'timeline.json'),'utf8'));
export const W=T.width,H=T.height,FPS=T.fps;
for(const [n,f] of [['Inter','Inter.ttf'],['Heavy','NotoHeavy.ttf'],['Medium','NotoMedium.ttf']]){
  if(!GlobalFonts.registerFromPath(path.join(ROOT,'assets',f),n))throw Error('Missing font '+f);
}
export const C={paper:'#F2F1EB',ink:'#151617',blue:'#244BFF',red:'#FF5136',grey:'#B9BBB7',dark:'#252729'};
const TAU=Math.PI*2,beat=60/T.bpm,bar=beat*4;
const canvas=createCanvas(W,H);let g=canvas.getContext('2d');
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=v=>1-Math.pow(1-clamp(v),5);
const io=v=>{v=clamp(v);return v<.5?16*v**5:1-(-2*v+2)**5/2;};
const p=(t,a,b)=>ease((t-a)/(b-a));
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
function circ(x,y,r,c){if(r<=0)return;g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
function line(x,y,X,Y,c=C.ink,w=2){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(X,Y);g.stroke();}
function poly(v,c,stroke=null,w=1){g.beginPath();v.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=c;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=w;g.stroke();}}
function pathLine(v,c,w=2){g.beginPath();v.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=c;g.lineWidth=w;g.stroke();}
function tr(x,y,s=1,r=0,fn){g.save();g.translate(x,y);g.rotate(r);g.scale(s,s);fn();g.restore();}
function clip(x,y,w,h,fn){g.save();g.beginPath();g.rect(x,y,w,h);g.clip();fn();g.restore();}
function alpha(a,fn){g.save();g.globalAlpha*=clamp(a);fn();g.restore();}
function txt(s,x,y,size=100,c=C.ink,font='Heavy',weight=900,align='left'){
  weight=Math.round(weight/100)*100;
  g.font=`${weight} ${size}px ${font}`;g.textAlign=align;g.textBaseline='alphabetic';g.fillStyle=c;
  g.fillText(s,x,y+g.measureText(s).actualBoundingBoxAscent);
}
function en(s,x,y,size=24,c=C.ink,weight=600,align='left'){txt(s,x,y,size,c,'Inter',weight,align);}
function reveal(s,x,y,size,c,t,delay=0,font='Heavy',weight=900){
  const a=p(t,delay,delay+.45);clip(x-10,y-10,1900-x,size*1.35+20,()=>txt(s,x,y+(1-a)*size*1.4,size,c,font,weight));
}
function meta(n,label,c=C.ink){en('Codex',72,51,31,c,650);en('—',196,52,27,c);en('MAKE IT HAPPEN',244,57,18,c,600);en(String(n+1).padStart(2,'0')+' / 12',1848,57,18,c,550,'right');}
function bottom(label,c=C.ink){en(label,76,1005,19,c,500);en('IDEA → REALITY',1844,1005,19,c,500,'right');}
function grid(c=C.ink,a=.09,step=120){alpha(a,()=>{for(let x=0;x<=W;x+=step)line(x,0,x,H,c,1);for(let y=0;y<=H;y+=step)line(0,y,W,y,c,1);});}
function cross(x,y,s,c=C.ink){line(x-s,y,x+s,y,c,1.5);line(x,y-s,x,y+s,c,1.5);}
function cursor(x,y,s=1,c=C.blue,r=0){tr(x,y,s,r,()=>poly([[0,0],[0,140],[36,103],[67,163],[96,149],[64,91],[118,82]],c));}
function chevron(x,y,s=1,c=C.blue,r=0){tr(x,y,s,r,()=>poly([[-110,-160],[-40,-160],[120,0],[-40,160],[-110,160],[50,0]],c));}
function tickline(y,t,c=C.ink){for(let i=0;i<80;i++)line(72+i*22.4,y,72+i*22.4,y+(i%8===0?15:5),c,1);rect(72+clamp(t/40)*1776,y-5,5,26,C.red);}
function colour(a,b,t){const A=a.match(/\w\w/g).map(n=>parseInt(n,16)),B=b.match(/\w\w/g).map(n=>parseInt(n,16));return '#'+A.map((v,i)=>Math.round(mix(v,B[i],clamp(t))).toString(16).padStart(2,'0')).join('');}
function project(x,y,z,rx,ry,rz=0){let Y=y*Math.cos(rx)-z*Math.sin(rx),Z=y*Math.sin(rx)+z*Math.cos(rx);let X=x*Math.cos(ry)+Z*Math.sin(ry);Z=-x*Math.sin(ry)+Z*Math.cos(ry);const a=X*Math.cos(rz)-Y*Math.sin(rz),b=X*Math.sin(rz)+Y*Math.cos(rz);const q=1100/(1100+Z);return [a*q,b*q,Z];}

// An original parametric toroidal sculpture. Surface faces are depth-sorted.
function sculpture(cx,cy,scale,t,mode='blue',morph=0){
  const faces=[],nu=96,nv=32,rx=.83+.25*Math.sin(t*.6),ry=t*.36,rz=-.5+t*.10;
  function v(i,j){const u=i/nu*TAU,q=j/nv*TAU,twist=q+u*2;
    const R=245+24*Math.cos(u*3+t*.3),r=65+14*Math.sin(u*3-t*.5);
    const x=(R+r*Math.cos(twist))*Math.cos(u),y=(R+r*Math.cos(twist))*Math.sin(u),z=r*Math.sin(twist)+Math.sin(u*3)*45*morph;
    return project(x,y,z,rx,ry,rz);
  }
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){
    const vs=[v(i,j),v(i+1,j),v(i+1,j+1),v(i,j+1)];
    const l=clamp(.50+.35*Math.sin(j/nv*TAU+i/nu*TAU*2-ry)+.14*Math.cos(i/nu*TAU));
    let col=mode==='blue'?colour('#0C1660','#6484FF',l):mode==='red'?colour('#7B1F1D','#FF8467',l):colour('#515751','#FFFFFF',l);
    if(i%6===0)col=mode==='silver'?C.ink:colour(col,'#F2F1EB',.5);
    faces.push({vs,z:vs.reduce((s,a)=>s+a[2],0)/4,col});
  }
  faces.sort((a,b)=>b.z-a.z);
  tr(cx,cy,scale,0,()=>{for(const f of faces)poly(f.vs,f.col,f.col,.6);});
}
function cube(x,y,z,s,c,t){
  const rx=.6,ry=-.62+t*.12,vs=[];
  for(let i=0;i<8;i++){vs.push(project(x+(i&1?s:-s),y+(i&2?s:-s),z+(i&4?s:-s),rx,ry));}
  return [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]].map((v,i)=>({vs:v.map(i=>vs[i]),z:v.reduce((s,i)=>s+vs[i][2],0)/4,c:colour(c,i%3===0?'#FFFFFF':'#121826',i%3===0?.22:i%3===1?.15:.42)}));
}
function modules(t){const faces=[],spread=1+1.8*(1-p(t,0,1.8))+.5*p(t,2.65,3.33);
  for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){
    const h=(((x+z+5)*7)%5),y=-h*29;const offset=Math.sin((x+2)*4+(z+2))*60*(1-p(t,0,2));
    faces.push(...cube(x*95*spread,y+offset,z*95*spread,37,(x===0&&z===0)?C.red:(x+z)%3===0?C.blue:C.paper,t));
  }
  faces.sort((a,b)=>b.z-a.z);tr(1300,565,1.42,0,()=>faces.forEach(f=>poly(f.vs,f.c,C.ink,1.3)));
}
function wave(cx,cy,w,h,t,c=C.blue,count=38){
  for(let j=0;j<count;j++){
    const pts=[];
    for(let i=0;i<=110;i++){let u=i/110,env=Math.sin(u*Math.PI)**1.4;
      pts.push([cx+u*w,cy+(j-(count-1)/2)*h/count+Math.sin(u*TAU*1.5+t*1.7+j*.12)*env*h*.36]);}
    pathLine(pts,c,2.3);
  }
}
function start(t){
  rect(0,0,W,H,C.paper);meta(0,'SPARK');
  const k=p(t,.1,.7);clip(0,120,W,810,()=>{
    txt('想',-34+(1-k)*-320,105,780,C.ink);
    txt('法',746+(1-p(t,.4,1))*1100,105,780,C.ink);
  });
  rect(1620,224,52,540,C.blue);const yy=224+515*p(t,1.5,2.7);rect(1620,224,52,Math.max(0,yy-224),C.paper);
  if(t>1.4)reveal('有个想法。',87,874,54,C.ink,t,1.4,'Medium',500);
  en('A THOUGHT IS A START.',1848,930,21,C.ink,500,'right');
  cross(1808,845,20);tickline(1040,t);
  if(t>2.84){const s=io((t-2.84)/.493);rect(W*(1-s),0,W*s,H,C.ink);}
}
function happen(t){
  rect(0,0,W,H,C.ink);meta(1,'HAPPEN',C.paper);
  for(let i=0;i<6;i++){alpha(.12,()=>chevron(1180+i*105-t*60,540,1.4,C.paper));}
  reveal('让它',76,195,277,C.paper,t,0);
  reveal('发生',76,519,277,C.paper,t,.15);
  chevron(1470,545,2.3+.13*Math.sin(t*2),C.blue,-.15+.1*Math.sin(t));
  en('MAKE',1128,809,85,C.paper,650);en('IT HAPPEN.',1128,903,85,C.paper,650);
  bottom('WITH CODEX',C.paper);
  if(t>2.8){const q=io((t-2.8)/.533);for(let i=0;i<8;i++)rect(i*240,H*(1-clamp(q*1.3-i*.045)),241,H,C.paper);}
}
function prompt(t){
  rect(0,0,W,H,C.paper);meta(2,'PROMPT');
  en('01',78,189,72,C.blue,500);reveal('从一句话。',220,178,146,C.ink,t,.02);
  const lineText='把这个想法，做出来。';const count=Math.min(lineText.length,Math.floor(t*8));
  rect(81,447,1758,4,C.ink);rect(81,689,1758,4,C.ink);
  txt(lineText.slice(0,count),116,509,90,C.ink,'Medium',500);
  g.font='500 90px Medium';const wid=g.measureText(lineText.slice(0,count)).width;rect(116+wid+12,500,10,103,C.blue);
  wave(83,840,1754,160,t,C.blue,20);bottom('YOUR INTENT. A STARTING POINT.');
  if(t>2.5){const q=io((t-2.5)/.833);rect(0,0,W*q,H,C.blue);}
}
function build(t){
  rect(0,0,W,H,C.blue);grid(C.paper,.085);meta(3,'STRUCTURE',C.paper);
  reveal('拆开',77,253,212,C.paper,t,0);reveal('复杂。',77,498,212,C.paper,t,.13);
  modules(t);en('FIND THE',80,849,32,C.paper,500);en('STRUCTURE.',80,895,32,C.paper,500);
  bottom('02 / UNDERSTAND THE PIECES',C.paper);
  if(t>2.93)rect(0,H*(1-io((t-2.93)/.403)),W,H,C.ink);
}
const codeLines=['const idea = make({','  intent: "something new",','  form: explore(context),','  motion: time => evolve(time),','});','','for (const detail of idea) {','  build(detail);','  run();','  refine();','}'];
function code(t){
  rect(0,0,W,H,C.ink);meta(4,'CODE',C.paper);
  g.save();g.translate(880,490);g.rotate(-.10);g.translate(-880,-490);
  codeLines.forEach((s,i)=>{const yy=120+i*77-(t>1.6?(t-1.6)*95:0),xx=745+160*(1-p(t,i*.035,i*.035+.6));alpha(.2+.8*p(t,i*.035,i*.035+.6),()=>en(s,xx,yy,40,i===2||i===8?C.blue:C.paper,500));});g.restore();
  rect(0,112,680,845,C.ink);reveal('写成',76,264,231,C.paper,t,.02);reveal('代码。',76,529,231,C.paper,t,.13);
  line(674,143,674,930,C.grey,1);en('WORDS',80,865,22,C.grey);en('→',244,856,42,C.blue);en('WORLDS',309,865,22,C.paper);
  bottom('03 / GIVE IT FORM',C.paper);
  if(t>2.45){const a=p(t,2.45,3.1);sculpture(1430,540,1.6*a,t+8,'silver');}
}
function run(t){
  rect(0,0,W,H,C.ink);meta(5,'RUN',C.paper);
  en('RUN',67,130,190,C.dark,700);en('SEE',1420,680,190,C.dark,700);
  sculpture(1070-70*p(t,0,1),527,1.55+.12*Math.sin(t*.8),t+11,'silver',1);
  reveal('运行。',75,444,134,C.paper,t,.02);reveal('看见。',75,610,134,C.paper,t,.17);
  en('r(u,v)',1530,197,29,C.grey,500);en('LIVE FORM',1530,239,18,C.grey,500);line(1430,306,1720,306,C.grey,1);
  bottom('04 / IDEAS BECOME SOMETHING YOU CAN SEE',C.paper);
}
function iterate(t){
  rect(0,0,W,H,C.paper);meta(6,'ITERATE');
  const a=p(t,.5,2.1),lx=128,rx=1785,cy=553;
  for(let j=0;j<17;j++){
    const points=[];
    for(let k=0;k<=140;k++){const u=k/140;let base=Math.sin(u*Math.PI*3+j*.2)*220*Math.sin(u*Math.PI);
      points.push([mix(lx,rx,u),cy+mix(base,Math.sin(u*Math.PI)*-70,a)+(j-8)*10]);}
    pathLine(points,j===8?C.red:'#D3D4D0',j===8?9:2);
  }
  const u=clamp((t-.45)/2.4),xx=mix(lx,rx,u),yy=cy+mix(Math.sin(u*Math.PI*3+8*.2)*220*Math.sin(u*Math.PI),Math.sin(u*Math.PI)*-70,a);
  circ(xx,yy,23,C.red);circ(lx,cy,13,C.ink);circ(rx,cy,13,C.ink);
  reveal('再试一次。',79,167,166,C.ink,t,0);
  en('ITERATION IS PART OF CREATION.',80,834,32,C.ink,500);en('↗',1644,782,121,C.blue,600);
  bottom('05 / REFINE THE DIRECTION');
  if(t>2.9){const q=io((t-2.9)/.433);rect(0,H*(1-q),W,H,C.blue);}
}
function refine(t){
  rect(0,0,W,H,C.blue);meta(7,'REFINE',C.paper);
  const sc=1+.06*Math.sin(t*1.7);
  tr(970,520,sc,-.05,()=>{
    for(let i=8;i>=0;i--)txt('做',-315-i*32,-360+i*14,755,i===0?C.paper:colour(C.blue,'#AAB6FF',.15+(8-i)*.065));
  });
  rect(74,802,946,108,C.ink);reveal('越做，越接近。',99,816,76,C.paper,t,.08,'Medium',500);
  for(let j=0;j<5;j++)chevron(1438+j*64,867,.21,C.paper);
  bottom('KEEP MAKING. KEEP MOVING.',C.paper);
}
function art(which,x,y,w,h,t){
  clip(x,y,w,h,()=>{
    rect(x,y,w,h,which===1?C.ink:which===2?C.blue:C.paper);
    if(which===0){tr(x+w/2,y+h*.53,w/680,-.3,()=>{for(let i=0;i<28;i++){g.save();g.rotate(t*.22+i*.14);g.strokeStyle=i%6===0?C.red:C.ink;g.lineWidth=4;g.strokeRect(-180-i*3,-180-i*3,360+i*6,360+i*6);g.restore();}});}
    if(which===1){sculpture(x+w*.5,y+h*.52,w/610,t,'silver',1);}
    if(which===2){for(let j=0;j<8;j++)for(let i=0;i<6;i++){const px=x+(i+.5)*w/6,py=y+(j+.5)*h/8;tr(px,py,w/900,Math.sin(t+i*.2+j*.2)*1.5,()=>{rect(-40,-35,80,70,(i+j)%5===0?C.red:C.paper);});}}
  });
}
function possibility(t){
  rect(0,0,W,H,C.paper);meta(8,'POSSIBILITIES');
  const gap=26,w=570,hh=650,y=227;
  for(let i=0;i<3;i++){
    const x=79+i*(w+gap),shift=(1-p(t,i*.09,.8+i*.09))*900;
    art(i,x,y+shift,w,hh,t+i);line(x,y+shift,x+w,y+shift,C.ink,2);line(x,y+hh+shift,x+w,y+hh+shift,C.ink,2);
    en(['FORM','MOTION','PLAY'][i],x+22,y+24+shift,20,i===0?C.ink:C.paper,550);
    en(['01','02','03'][i],x+w-22,y+24+shift,20,i===0?C.ink:C.paper,550,'right');
  }
  reveal('把可能，做出来。',77,121,72,C.ink,t,.04);bottom('ONE IDEA. MANY POSSIBILITIES.');
}
const thumbs=[];
function made(t){
  rect(0,0,W,H,C.ink);meta(9,'THIS FILM',C.paper);
  const zoom=mix(1.8,1,p(t,0,1.1));
  tr(960,420,zoom,-.075,()=>{
    const w=618,hh=w*H/W;
    for(let j=0;j<2;j++)for(let i=0;i<4;i++){
      const xx=-1100+i*(w+18)-t*35,yy=-398+j*(hh+20);
      g.drawImage(thumbs[(i+j*3)%thumbs.length],xx,yy,w,hh);
    }
  });
  rect(0,784,W,296,C.ink);reveal('这支片，也是。',81,830,121,C.paper,t,.2);
  en('MADE WITH CODEX',1835,949,23,C.paper,600,'right');
  if(t>2.78){const q=io((t-2.78)/.553);rect(W*(1-q),0,W,H,C.paper);}
}
function brand(t){
  rect(0,0,W,H,C.paper);meta(10,'CODEX');
  wave(-150,520,2190,730,t+17,C.blue,50);
  const a=p(t,.05,.75);rect(0,308,W,459,C.paper);
  clip(70,285,1780,505,()=>txt('Codex',79,322+(1-a)*490,426,C.ink,'Inter',620));
  cursor(1558,354,1.76,C.blue,-.15*p(t,0,1));
  en('THINK IT.',88,866,48,C.ink,600);en('MAKE IT.',410,866,48,C.ink,600);bottom('FROM INTENT TO SOMETHING REAL.');
  if(t>2.84){const q=io((t-2.84)/.493);rect(0,0,W,H*q,C.ink);}
}
function end(t){
  rect(0,0,W,H,C.ink);
  const a=p(t,0,.5);reveal('Codex',80,225,292,C.paper,t,0,'Inter',600);
  reveal('让想法发生。',88,586,125,C.paper,t,.12,'Medium',500);
  chevron(1612,461,1.40*a,C.blue);line(88,850,1830,850,'#4B4C4B',1);
  en('BUILD WITH CODEX',89,889,27,C.paper,500);en('openai.com/codex',1830,889,27,C.paper,500,'right');
  en('AN INDEPENDENT CONCEPT FILM',89,1007,17,'#939591',500);
  en('CREATED WITH CODEX  /  OPEN SOURCE EXAMPLE',1830,1007,17,'#939591',500,'right');
}
const scenes=[start,happen,prompt,build,code,run,iterate,refine,possibility,made,brand,end];
// Thumbnails come from the very same scene renderer, not unrelated placeholders.
for(const i of [0,1,3,4,5,6,7,8]){
  const c=createCanvas(640,360),old=g;g=c.getContext('2d');g.scale(1/3,1/3);scenes[i](1.8);g=old;thumbs.push(c);
}
export function render(frame){
  const t=clamp(frame/FPS,0,T.duration-1/FPS),i=Math.min(11,Math.floor((t+1e-7)/(bar*2))),local=t-i*bar*2;
  g=canvas.getContext('2d');g.resetTransform();g.globalAlpha=1;g.globalCompositeOperation='source-over';g.lineJoin='round';g.lineCap='butt';
  scenes[i](local);return canvas;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  fs.mkdirSync(path.join(ROOT,'frames'),{recursive:true});
  const ts=process.argv.slice(2).map(Number);for(const t of (ts.length?ts:T.scenes.map(s=>s.still))){render(Math.round(t*FPS)).savePng(path.join(ROOT,'frames',`frame-${t.toFixed(3)}.png`));}
  console.log('Style frames rendered');
}
