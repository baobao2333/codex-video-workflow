import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

await document.fonts.load('600 24px Inter');
const W=1920,H=1080,TAU=Math.PI*2,beat=60/144;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,p)=>a+(b-a)*p;
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const seg=(t,a,b)=>smooth((t-a)/(b-a));
const scene=new THREE.Scene();scene.background=new THREE.Color('#ddd9d0');
scene.fog=new THREE.Fog('#ddd9d0',35,85);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});
renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.getElementById('stage').prepend(renderer.domElement);
const camera=new THREE.PerspectiveCamera(36,W/H,.05,110);
camera.setViewOffset(W,H,0,70,W,H);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
scene.environmentIntensity=.7;
const hemi=new THREE.HemisphereLight('#fff6df','#746f60',2.4);scene.add(hemi);
const key=new THREE.DirectionalLight('#fff9ee',4.1);key.position.set(-5,12,7);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-13;key.shadow.camera.right=13;key.shadow.camera.top=10;key.shadow.camera.bottom=-10;key.shadow.bias=-.00025;key.shadow.normalBias=.035;scene.add(key);
const fill=new THREE.DirectionalLight('#d8e8ff',1.7);fill.position.set(8,5,-9);scene.add(fill);
const M={
  ink:new THREE.MeshStandardMaterial({color:'#222a28',roughness:.33,metalness:.72}),
  dark:new THREE.MeshStandardMaterial({color:'#36403b',roughness:.54,metalness:.35}),
  orange:new THREE.MeshStandardMaterial({color:'#ed652d',roughness:.26,metalness:.24}),
  cream:new THREE.MeshStandardMaterial({color:'#f0eadb',roughness:.62,metalness:.08}),
  silver:new THREE.MeshStandardMaterial({color:'#b8bcb3',roughness:.26,metalness:.92}),
  rubber:new THREE.MeshStandardMaterial({color:'#111917',roughness:.85,metalness:0}),
  green:new THREE.MeshStandardMaterial({color:'#cbff84',emissive:'#b6e56e',emissiveIntensity:.5,roughness:.3}),
  paper:new THREE.MeshStandardMaterial({color:'#faf5e4',roughness:.9,side:THREE.DoubleSide}),
};
function mesh(geometry,material,parent=scene,x=0,y=0,z=0){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(w,h,d,mat,parent=scene,x=0,y=0,z=0,r=.07){return mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),mat,parent,x,y,z);}
function cylinder(r,len,mat,parent=scene,x=0,y=0,z=0){const o=mesh(new THREE.CylinderGeometry(r,r,len,64),mat,parent,x,y,z);o.rotation.x=Math.PI/2;return o;}
function textTexture(text,fg='#e9ebd7',bg='#222a28',size=40){const c=document.createElement('canvas');c.width=1024;c.height=128;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.font=`600 ${size}px Inter`;g.textBaseline='middle';g.fillText(text,28,64);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx;}
function label(text,w,parent,x,y,z,rx=0,fg,bg){const o=mesh(new THREE.PlaneGeometry(w,w/8),new THREE.MeshStandardMaterial({map:textTexture(text,fg,bg),roughness:.72}),parent,x,y,z);o.rotation.x=rx;return o;}
const floor=mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#d5d1c7',roughness:.88}));floor.rotation.x=-Math.PI/2;floor.position.y=-.17;
const machine=new THREE.Group();scene.add(machine);
box(16.7,.55,5.5,M.ink,machine,0,.35,0,.17);
box(16.1,.055,4.9,M.dark,machine,0,.655,0,.015);
for(const x of [-7.5,7.5])for(const z of [-2.05,2.05])cylinder(.31,.30,M.rubber,machine,x,.06,z).rotation.x=0;
for(let i=0;i<45;i++)box(.12,.035,.5,M.ink,machine,-7.3+i*.33,.704,-2.04,.01);
label('V / W     FRAME PROCESSOR — 01',6,machine,-3.8,.39,2.79);
label('REFERENCE    /    STORY    /    MOTION    /    SOUND',6.2,machine,3.3,.39,2.79,0,'#a6b59b');
for(const x of [-7.9,7.9])for(const z of [-2.3,2.3]){const s=cylinder(.075,.04,M.silver,machine,x,.714,z);s.rotation.x=0;box(.08,.014,.018,M.ink,machine,x,.74,z,.005);}
// Two physical sprocket rollers. Belt travel and roller rotation share one distance.
const rollers=[];
for(const [x,material] of [[-6,M.orange],[6,M.cream]]){
  box(.85,1.6,.55,M.silver,machine,x,1.25,-1.5,.13);
  box(.85,1.6,.55,M.silver,machine,x,1.25,1.5,.13);
  const group=new THREE.Group();group.position.set(x,2.1,0);machine.add(group);rollers.push(group);
  cylinder(1.245,2.18,M.rubber,group);
  for(const z of [-1.15,1.15]){
    cylinder(1.33,.12,material,group,0,0,z);
    cylinder(.69,.15,M.ink,group,0,0,z+Math.sign(z)*.09);
    cylinder(.22,.23,M.silver,group,0,0,z+Math.sign(z)*.2);
    for(let k=0;k<12;k++){
      const a=k/12*TAU;
      cylinder(.068,.04,M.silver,group,Math.cos(a)*1.03,Math.sin(a)*1.03,z+Math.sign(z)*.08);
      const spoke=box(.12,.63,.035,material,group,Math.cos(a)*.56,Math.sin(a)*.56,z+Math.sign(z)*.18,.03);spoke.rotation.z=a-Math.PI/2;
    }
  }
  for(let k=0;k<48;k++){const a=k/48*TAU;for(const z of [-.84,.84]){const tooth=box(.07,.10,.12,M.silver,group,Math.cos(a)*1.3,Math.sin(a)*1.3,z,.02);tooth.rotation.z=a;}}
}
// Texture is painted with distinct frame content, perforations, registration and frame numbers.
function filmTexture(){
  const c=document.createElement('canvas');c.width=4096;c.height=512;const g=c.getContext('2d');
  g.fillStyle='#25332b';g.fillRect(0,0,4096,512);
  const palette=['#ec6d36','#c4d97c','#75949e','#ddcda2'];
  for(let i=0;i<16;i++){
    const x=i*256;g.clearRect(x+30,14,34,28);g.clearRect(x+112,14,34,28);g.clearRect(x+194,14,34,28);
    g.clearRect(x+30,470,34,28);g.clearRect(x+112,470,34,28);g.clearRect(x+194,470,34,28);
    g.fillStyle='#eae5d5';g.fillRect(x+10, 60,236,382);
    g.save();g.beginPath();g.rect(x+10,60,236,382);g.clip();g.translate(x+128,248);
    g.fillStyle=palette[Math.floor(i/4)];g.beginPath();g.arc(Math.sin(i*.3)*38,Math.cos(i*.2)*32,80,0,TAU);g.fill();
    g.strokeStyle='#25332b';g.lineWidth=5;
    for(let j=0;j<7;j++){g.beginPath();g.ellipse(0,0,30+j*12,95-j*6,.3+i*.14,0,TAU);g.stroke();}
    g.fillStyle='#ec6d36';g.fillRect(-118,130,236,26);g.restore();
    g.fillStyle='#d4ddbe';g.font='19px monospace';g.fillText(String(i+1).padStart(3,'0')+'  VW  144',x+17,462);
  }
  const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.wrapS=THREE.RepeatWrapping;tx.repeat.x=2.5;tx.anisotropy=8;return tx;
}
const beltTexture=filmTexture(),radius=1.3,length=24+TAU*radius;
function beltPoint(q){let s=((q%1)+1)%1*length;
  if(s<12)return new THREE.Vector3(-6+s,3.4,0);s-=12;
  if(s<Math.PI*radius){const a=s/radius;return new THREE.Vector3(6+radius*Math.sin(a),2.1+radius*Math.cos(a),0);}s-=Math.PI*radius;
  if(s<12)return new THREE.Vector3(6-s,.8,0);s-=12;
  const a=s/radius;return new THREE.Vector3(-6-radius*Math.sin(a),2.1-radius*Math.cos(a),0);
}
const positions=[],uv=[],indices=[];
for(let i=0;i<=400;i++){const p=beltPoint(i/400);for(const z of [-1.02,1.02]){positions.push(p.x,p.y,z);uv.push(i/400,z<0?0:1);}if(i<400){let a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
const belt=mesh(geo,new THREE.MeshStandardMaterial({map:beltTexture,side:THREE.DoubleSide,roughness:.38,metalness:.12,alphaTest:.5}),machine);
// Perforated belt shadow uses the same cutout texture.
belt.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:beltTexture,alphaTest:.5});
// Reference filters: three frames with colored inserts, cantilevered above the strip.
const filters=[];
for(let i=0;i<3;i++){
  const group=new THREE.Group();group.position.set(-3.6+i*.60,3.7,-.05);machine.add(group);filters.push(group);
  box(.12,2.05,2.8,M.silver,group,0,0,0,.03);
  const insert=box(.14,1.68,2.35,new THREE.MeshPhysicalMaterial({color:['#e86232','#d2dba8','#81a5a2'][i],roughness:.12,metalness:0,transmission:.48,thickness:.08,transparent:true,opacity:.88}),group,0,0,.03,.03);
  box(.18,.2,.68,M.orange,group,0,1.10,1.0,.03);
}
// Storyboard panels rise like drafting-table leaves, each has visible paper edges.
const panels=[];
for(let i=0;i<3;i++){
  const g=new THREE.Group();g.position.set(-1.6+i*1.6,3.52,-.3);machine.add(g);panels.push(g);
  box(1.42,.05,1.94,M.paper,g,0,0,-.97,.025);
  const tx=filmTexture();tx.repeat.set(1/16,1);tx.offset.x=i/16;
  const art=mesh(new THREE.PlaneGeometry(1.20,1.65),new THREE.MeshStandardMaterial({map:tx,roughness:.78,side:THREE.DoubleSide}),g,0,.034,-.97);art.rotation.x=-Math.PI/2;
  cylinder(.1,1.5,M.silver,g,0,0,0).rotation.z=Math.PI/2;
}
// Sound station: tuned pins and metal rails; their envelopes follow the 144 BPM grid.
const pins=[];
box(4.4,.32,.8,M.cream,machine,2.5,.92,1.66,.1);
for(let i=0;i<24;i++){
  const p=box(.11,.9,.21,i%4===0?M.orange:M.ink,machine,.45+i*.176,1.5,1.66,.035);pins.push(p);
  cylinder(.025,.82,M.silver,machine,.45+i*.176,1.32,1.66).rotation.x=0;
}
label('SCORE / LOCAL SYNTHESIS',3.1,machine,2.4,.90,2.12,0,'#263829','#f0eadb');
// A real shutter with eight metal blades, mounted above the output roller.
const shutter=new THREE.Group();shutter.position.set(5.1,4.1,-.15);machine.add(shutter);
const ring=mesh(new THREE.TorusGeometry(1.23,.12,16,80),M.ink,shutter);ring.rotation.y=Math.PI/2;
const blades=[];
for(let i=0;i<8;i++){const g=new THREE.Group();g.rotation.x=i/8*TAU;shutter.add(g);const b=box(.045,.91,.45,M.silver,g,0,.65,0,.08);b.rotation.x=.3;blades.push(g);}
// A fine copper route and illuminated registration lights on the base.
for(let i=0;i<48;i++)box(.18,.025,.038,i%4===0?M.orange:M.silver,machine,-7.1+i*.30,.71,2.23,.01);
const leds=[];for(let i=0;i<9;i++)leds.push(box(.25,.035,.10,M.green.clone(),machine,-1.2+i*.36,.72,2.23,.025));
label('01 — LOOK',2,machine,-4.6,.73,-1.88,-Math.PI/2,'#c7d1bd');
label('02 — STORY',2,machine,-1.0,.73,-1.88,-Math.PI/2,'#c7d1bd');
label('03 — PLAY',2,machine,2.6,.73,-1.88,-Math.PI/2,'#c7d1bd');
const orb=mesh(new THREE.SphereGeometry(.22,32,24),M.orange,machine,-4,3.7,.35);

// The printed motif becomes a dimensional moving object: the storyboard comes alive.
const sculpture=new THREE.Group();sculpture.position.set(.5,4.45,0);machine.add(sculpture);
mesh(new THREE.SphereGeometry(.69,64,40),new THREE.MeshStandardMaterial({color:'#e86530',roughness:.22,metalness:.34}),sculpture);
const orbits=[];
for(let i=0;i<7;i++){
  const o=mesh(new THREE.TorusGeometry(1.10+i*.075,.019,8,120),i%3===0?M.silver:M.ink,sculpture);
  o.rotation.x=.75+i*.13;o.rotation.y=i*.18;orbits.push(o);
}
const motifHalo=mesh(new THREE.TorusGeometry(1.72,.035,12,120),M.orange,sculpture);motifHalo.rotation.x=Math.PI/2;

const states=[
  {a:0,b:4,over:'01 / THE FIRST FRAME',title:'一个想法，开始转动。',detail:'从意图，到真正可播放的影片。'},
  {a:4,b:9,over:'02 / ART DIRECTION',title:'先决定，画面为什么好看。',detail:'参考 → 视觉规则 → 创意方向'},
  {a:9,b:14,over:'03 / STORY BEFORE MOTION',title:'把故事，放进画格。',detail:'三种叙事 · 实际静帧 · 先修改，再动画'},
  {a:14,b:20,over:'04 / GIVE IT TIME',title:'让动作，讲清楚变化。',detail:'镜头、主体、节奏，共用一条时间轴。'},
  {a:20,b:23.333333,over:'05 / DIRECT THE CHANGE',title:'停一下。改这一处。',detail:'具体时间码，具体导演笔记。'},
  {a:23.333333,b:28,over:'06 / MAKE YOUR OWN SOUND',title:'音乐，也能本地生成。',detail:'代码作曲与合成 · 无需 Suno 会员'},
  {a:28,b:33.333333,over:'07 / READY TO RENDER',title:'画面、声音，一起成片。',detail:'可播放 MP4 + 可修改源码 + 重建命令'},
];
const shots=[
  [0,[-7.2,3.8,4.4],[-6.1,2.45,.1]], [3.7,[-6.5,4.7,6.1],[-5.5,2.75,0]],
  [4.4,[-4.6,6.1,7.6],[-2.7,3.6,0]], [8.3,[-.4,5.7,6.7],[-2.2,3.5,-.1]],
  [9.3,[1.3,8.5,8.2],[.1,3.4,-.2]], [13.2,[4.4,8.4,8.7],[.5,3.2,-.2]],
  [14.2,[-2.0,5.6,6.5],[.3,4.4,0]], [19.7,[3.8,6.2,7.0],[.8,4.5,0]],
  [20.5,[1,5.5,5.4],[.5,3.5,-.5]], [22.8,[.7,5.3,5.2],[.4,3.6,-.5]],
  [23.5,[4.9,3.7,5.3],[2.4,1.65,1.65]], [27.4,[5.8,5.7,7.4],[3.7,2.7,.7]],
  [28.2,[8.6,5.4,5.9],[5.2,3.8,0]], [30.0,[9.2,8.8,12.5],[2,2.4,0]],
  [33.333333,[14.0,14.0,26.5],[1.4,1.8,0]], [36.6,[14.0,14.0,26.5],[3.4,1.8,0]],
  [40,[14.0,14.0,26.5],[3.4,1.8,0]],
];
const caption=document.querySelector('.caption'),hero=document.getElementById('hero'),lab=document.getElementById('label');
function cameraAt(t){let i=0;while(i<shots.length-2&&shots[i+1][0]<=t)i++;const [a,pa,ta]=shots[i],[b,pb,tb]=shots[i+1];const u=seg(t,a,b);camera.position.set(...pa.map((v,k)=>lerp(v,pb[k],u)));camera.lookAt(new THREE.Vector3(...ta.map((v,k)=>lerp(v,tb[k],u))));}
function distance(t){return .7*Math.min(t,14)+Math.max(0,Math.min(t,20)-14)*2.3+Math.max(0,Math.min(t,23.333333)-20)*.02+Math.max(0,Math.min(t,33.333333)-23.333333)*1.6+Math.max(0,t-33.333333)*.16;}
window.render=t=>{
  t=clamp(t,0,39.999);const move=distance(t),stopped=seg(t,19.7,20.05)*(1-seg(t,23.05,23.333333));
  beltTexture.offset.x=-move/length*2.5;
  rollers.forEach(r=>r.rotation.z=-move/radius);
  filters.forEach((f,i)=>{const v=seg(t,4+i*.35,5.3+i*.35)*(1-seg(t,8.3,9.5));f.position.y=4.7-v*.85;f.rotation.z=.13*(i-1)*(1-v);f.visible=t>3.5&&t<10;});
  panels.forEach((p,i)=>{const rise=seg(t,9+i*.21,10.3+i*.21)*(1-seg(t,13,14));const edit=seg(t,20.2,20.9)*(1-seg(t,22.75,23.333));p.rotation.x=(rise*.85+edit*(i===1?.9:.45));p.position.y=3.48+rise*.3+edit*.5;p.visible=(t>8.6&&t<14.1)||(t>19.9&&t<23.4);p.children[1].material.color.set(i===1&&stopped>.5?'#b9e192':'#ffffff');});
  pins.forEach((p,i)=>{const active=seg(t,23.15,23.5)*(1-seg(t,33,35));const pulse=Math.exp(-((t/beat+i*.137)%1)*7);const h=.35+active*(.3+Math.sin(i*.8)**2*.8)*pulse;p.scale.y=h/.9;p.position.y=1.10+h/2;});
  blades.forEach((b,i)=>b.rotation.x=i/8*TAU+.26*Math.sin(t*1.5)*(1-stopped));shutter.rotation.z=.09;
  leds.forEach((l,i)=>l.material.emissiveIntensity=.08+.7*clamp(1-Math.abs((t*2%10)-i)/2));
  const p=beltPoint((move/length+.09)%1);orb.position.copy(p).add(new THREE.Vector3(0,.21,.3));orb.visible=t<4||t>13.5&&t<20||t>28&&t<33;
  const lift=seg(t,13.7,14.7)*(1-seg(t,19.2,20.0));
  sculpture.visible=lift>.001;sculpture.scale.setScalar(Math.max(.001,lift));sculpture.position.y=3.42+lift*1.15;
  sculpture.rotation.y=(t-14)*.65;sculpture.rotation.z=.08*Math.sin(t*1.5);
  orbits.forEach((o,i)=>{o.rotation.x=.75+i*.13+(t-14)*.15;o.rotation.y=i*.18+(t-14)*.20;});
  cameraAt(t);
  const selected=states.find(s=>t>=s.a&&t<s.b);
  caption.style.opacity=selected?String(seg(t,selected.a+.1,selected.a+.5)*(1-seg(t,selected.b-.35,selected.b))):'0';
  if(selected){document.getElementById('over').textContent=selected.over;document.getElementById('caption').textContent=selected.title;document.getElementById('detail').textContent=selected.detail;}
  hero.style.opacity=String(seg(t,33.333333,34.2));
  // Final layout shifts the machine left as the title appears on the right.
  machine.position.x=-seg(t,33.3,35.5)*4.8;
  lab.style.opacity='0';
  if(t>=20.6&&t<22.9){const pp=new THREE.Vector3(.5,4.6,-.6).add(machine.position).project(camera);lab.style.left=`${(pp.x*.5+.5)*W}px`;lab.style.top=`${(-pp.y*.5+.5)*H-24}px`;lab.textContent='00:21.0  /  留出停顿，调整这一格';lab.style.opacity=String(seg(t,20.6,21));}
  document.getElementById('time').textContent=`${String(Math.floor(t)).padStart(2,'0')} / 40`;
  document.getElementById('progress').style.width=`${t/40*1760}px`;
  renderer.render(scene,camera);
  renderer.getContext().finish();
};
await document.fonts.ready;
cameraAt(0);await renderer.compileAsync(scene,camera);
window.render(0);window.READY=true;
const resize=()=>document.getElementById('stage').style.transform=`scale(${Math.min(innerWidth/W,innerHeight/H)})`;
addEventListener('resize',resize);resize();
if(new URLSearchParams(location.search).has('live')){const began=performance.now();function tick(){window.render(((performance.now()-began)/1000)%40);requestAnimationFrame(tick);}tick();}
