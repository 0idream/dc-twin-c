import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/addons/controls/OrbitControls.js';

const $=s=>document.querySelector(s);
const C={cool:0x22d3ee,power:0x3b82f6,hvac:0x2dd4bf,net:0xa855f7,sup:0x2f8cff,ret:0xff7a3c,edge:0x38e1ff};
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
let maxDpr=2;
renderer.setPixelRatio(Math.min(devicePixelRatio,maxDpr));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x07141a);
scene.fog=new THREE.Fog(0x0a1a20,220,620);
const camera=new THREE.PerspectiveCamera(50,1,0.5,900);
const HOME={pos:new THREE.Vector3(30,80,118),tgt:new THREE.Vector3(0,0,2)};
camera.position.copy(HOME.pos);
const controls=new OrbitControls(camera,canvas);
controls.target.copy(HOME.tgt);controls.enableDamping=true;controls.dampingFactor=.08;
controls.maxPolarAngle=1.42;controls.minDistance=25;controls.maxDistance=320;
controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};

// lights
scene.add(new THREE.HemisphereLight(0xb8c8d0,0x18242a,1.25));
const moon=new THREE.DirectionalLight(0xe8eef0,1.6);
moon.position.set(-60,110,50);moon.castShadow=true;
moon.shadow.mapSize.set(1024,1024);
Object.assign(moon.shadow.camera,{left:-70,right:70,top:70,bottom:-70,near:10,far:300});
moon.shadow.bias=-0.0008;scene.add(moon);
const fill=new THREE.DirectionalLight(0x3cc8ff,.35);fill.position.set(80,40,-60);scene.add(fill);

// ---------- textures ----------
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const gridTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#08141f';g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(56,225,255,.16)';g.lineWidth=1;for(let i=0;i<=8;i++){g.beginPath();g.moveTo(i*32,0);g.lineTo(i*32,h);g.stroke();g.beginPath();g.moveTo(0,i*32);g.lineTo(w,i*32);g.stroke();}
  g.strokeStyle='rgba(56,225,255,.35)';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);});
gridTex.wrapS=gridTex.wrapT=THREE.RepeatWrapping;gridTex.repeat.set(40,40);
const winTex=canvasTex(128,256,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);
  for(let y=6;y<h;y+=10)for(let x=5;x<w;x+=9){const r=Math.random();if(r<.42){g.fillStyle=r<.08?'#ffd9a0':r<.25?'#ffe7b8':'#9fd8ff';g.globalAlpha=.4+Math.random()*.6;g.fillRect(x,y,5,6);}}g.globalAlpha=1;});
winTex.wrapS=winTex.wrapT=THREE.RepeatWrapping;
const glowTex=canvasTex(128,128,(g,w,h)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.4,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
const rectGlow=canvasTex(256,256,(g,w,h)=>{for(let i=0;i<40;i++){g.strokeStyle=`rgba(56,225,255,${.5*(1-i/40)**2})`;g.lineWidth=2;g.strokeRect(40-i,40-i,w-80+2*i,h-80+2*i);}g.fillStyle='rgba(56,225,255,.05)';g.fillRect(40,40,w-80,h-80);});

// ---------- ground ----------
const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshPhongMaterial({map:gridTex,color:0x9bb4c8,specular:0x2a5a7a,shininess:80}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const pad=new THREE.Mesh(new THREE.PlaneGeometry(116,96),new THREE.MeshLambertMaterial({color:0x1a2632}));
pad.rotation.x=-Math.PI/2;pad.position.set(0,.03,2);pad.receiveShadow=true;scene.add(pad);
const siteGlow=new THREE.Mesh(new THREE.PlaneGeometry(128,108),new THREE.MeshBasicMaterial({map:rectGlow,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
siteGlow.rotation.x=-Math.PI/2;siteGlow.position.set(0,.06,2);scene.add(siteGlow);

// roads
const roadM=new THREE.MeshLambertMaterial({color:0x111a24});
const roads=[[0,54,150,8],[0,-50,150,8],[-62,2,8,112],[62,2,8,112],[-1.5,2,6,88]];
const dashPos=[];
roads.forEach(([x,z,w,d])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),roadM);m.rotation.x=-Math.PI/2;m.position.set(x,.05,z);m.receiveShadow=true;scene.add(m);
  const horiz=w>d;const L=horiz?w:d;if(w<7&&d<7)return;for(let s=-L/2+2;s<L/2-2;s+=5){dashPos.push(horiz?[x+s,z]:[x,z+s],horiz);}});
{const g=new THREE.PlaneGeometry(2.2,.25);const im=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xd9e6f0}),dashPos.length/2|0);
 let k=0;const o=new THREE.Object3D();for(let i=0;i<dashPos.length;i+=2){const [p,h]=[dashPos[i],dashPos[i+1]];o.position.set(p[0],.08,p[1]);o.rotation.set(-Math.PI/2,0,h?0:Math.PI/2);o.updateMatrix();im.setMatrixAt(k++,o.matrix);}scene.add(im);}

// ---------- materials ----------
const shellM=new THREE.MeshLambertMaterial({color:0xf2f2ee,transparent:true,opacity:1});
const roofM=new THREE.MeshLambertMaterial({color:0xc9cdcc,transparent:true,opacity:1});
const darkM=new THREE.MeshLambertMaterial({color:0x5a6873,transparent:true,opacity:1});
const winM=new THREE.MeshBasicMaterial({color:0x7fe9ff,transparent:true,opacity:.9});
const edgeM=new THREE.LineBasicMaterial({color:C.edge,transparent:true,opacity:.75});
const seamM=new THREE.LineBasicMaterial({color:0x8696a3,transparent:true,opacity:.6});
const shellMats=[shellM,roofM,darkM];
const xrayGroup=new THREE.Group();xrayGroup.visible=false;scene.add(xrayGroup);
const fans=[];const highlights={};
function addEdges(mesh,mat=edgeM){const e=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,30),mat);e.position.copy(mesh.position);e.rotation.copy(mesh.rotation);scene.add(e);return e;}
function box(w,h,d,x,y,z,m,edge=true,shadow=true){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=shadow;b.receiveShadow=true;scene.add(b);if(edge)addEdges(b);return b;}

// fan geometry
const fanBladeG=(()=>{const s=new THREE.Shape();for(let i=0;i<5;i++){const a=i/5*Math.PI*2;s.moveTo(0,0);s.absarc(0,0,1,a,a+.7,false);s.lineTo(0,0);}return new THREE.ShapeGeometry(s);})();
const fanM=new THREE.MeshLambertMaterial({color:0x2b3640,side:THREE.DoubleSide});
const ringG=new THREE.TorusGeometry(1.05,.08,6,20);const ringM=new THREE.MeshLambertMaterial({color:0x9aa8b3});
function fan(x,y,z,r){const g=new THREE.Group();g.position.set(x,y,z);const bl=new THREE.Mesh(fanBladeG,fanM);bl.rotation.x=-Math.PI/2;bl.scale.setScalar(r*.92);const ri=new THREE.Mesh(ringG,ringM);ri.rotation.x=Math.PI/2;ri.scale.setScalar(r);g.add(bl,ri);scene.add(g);fans.push(bl);return g;}

// ---------- halls ----------
const halls=[{n:'A',x:-26,z:-18,w:30,d:20,h:9},{n:'B',x:24,z:-18,w:28,d:20,h:8},{n:'C',x:-26,z:22,w:30,d:20,h:8},{n:'D',x:24,z:22,w:28,d:20,h:9}];
const rackSlots=[];
halls.forEach(H=>{
  const b=box(H.w,H.h,H.d,H.x,H.h/2,H.z,shellM);H.mesh=b;
  // parapet roof
  box(H.w-.6,.5,H.d-.6,H.x,H.h+.25,H.z,roofM,false);
  // panel seams
  const pts=[];const hw=H.w/2+.02,hd=H.d/2+.02;
  for(let s=-H.w/2+2;s<H.w/2;s+=2){pts.push(H.x+s,0,H.z+hd,H.x+s,H.h,H.z+hd,H.x+s,0,H.z-hd,H.x+s,H.h,H.z-hd);}
  for(let s=-H.d/2+2;s<H.d/2;s+=2){pts.push(H.x+hw,0,H.z+s,H.x+hw,H.h,H.z+s,H.x-hw,0,H.z+s,H.x-hw,H.h,H.z+s);}
  [H.h*.33,H.h*.66].forEach(y=>pts.push(H.x-hw,y,H.z+hd,H.x+hw,y,H.z+hd,H.x-hw,y,H.z-hd,H.x+hw,y,H.z-hd,H.x+hw,y,H.z-hd,H.x+hw,y,H.z+hd,H.x-hw,y,H.z-hd,H.x-hw,y,H.z+hd));
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const seams=new THREE.LineSegments(sg,seamM);scene.add(seams);
  // window strips
  [[0,H.d/2+.05,0],[0,-H.d/2-.05,Math.PI]].forEach(([dx,dz,ry])=>{const w=new THREE.Mesh(new THREE.PlaneGeometry(H.w*.8,.45),winM);w.position.set(H.x+dx,H.h*.8,H.z+dz);w.rotation.y=ry;scene.add(w);});
  [1,-1].forEach(sx=>{const w=new THREE.Mesh(new THREE.PlaneGeometry(H.d*.75,.45),winM);w.position.set(H.x+sx*(H.w/2+.05),H.h*.8,H.z);w.rotation.y=sx*Math.PI/2;scene.add(w);});
  // louvers band on long side
  for(let i=0;i<6;i++){const l=new THREE.Mesh(new THREE.BoxGeometry(H.w*.5,.08,.25),darkM);l.position.set(H.x-H.w*.15,1.4+i*.35,H.z+H.d/2+.12);scene.add(l);}
  // door
  box(3,3.2,.2,H.x+H.w*.3,1.6,H.z+H.d/2+.1,darkM,false,false);
  // rooftop units with fans
  const cols=Math.floor(H.w/7),rows=2;
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const ux=H.x-H.w/2+3.5+i*7,uz=H.z-H.d/4+j*H.d/2;
    box(5.4,1.4,4,ux,H.h+1.2,uz,roofM,true);fan(ux-1.3,H.h+1.95,uz,1.05);fan(ux+1.3,H.h+1.95,uz,1.05);}
  // glow footprint
  const fg=new THREE.Mesh(new THREE.PlaneGeometry(H.w+8,H.d+8),new THREE.MeshBasicMaterial({map:rectGlow,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));fg.rotation.x=-Math.PI/2;fg.position.set(H.x,.09,H.z);scene.add(fg);
  // interior racks slots
  for(let r=0;r<5;r++)for(let k=0;k<Math.floor((H.w-6)/1.2);k++)rackSlots.push([H.x-H.w/2+3.6+k*1.2,H.z-H.d/2+3.5+r*3.2,H,r]);
});
// admin/lobby small building
box(10,5,8,-50,2.5,-40,shellM);box(6,6,5,46,3,-40,darkM);

// ---------- cooling yard (chillers + towers) ----------
const yard={x:-1.5,z:2};
box(12,.4,34,yard.x,.2,yard.z,darkM,false);
const chillers=[];
for(let i=0;i<4;i++){const z=yard.z-12+i*8;const c=box(9,2.6,5,yard.x,1.7,z,shellM);chillers.push(c);fan(yard.x-2.2,3.05,z,1.5);fan(yard.x+2.2,3.05,z,1.5);
  for(let k=0;k<5;k++){const l=new THREE.Mesh(new THREE.BoxGeometry(.06,1.8,4.4),darkM);l.position.set(yard.x-4.53,1.7,z-0+(k-2)*0);l.position.x=yard.x+4.53;l.position.z=z;l.scale.z=1;scene.add(l);}}
highlights[1]=chillers;
// generators east
const gens=[];for(let i=0;i<4;i++){const g=box(7,3,3,49,1.5,-14+i*8,darkM);gens.push(g);box(.5,2,.5,51.5,4,-14+i*8,darkM,false);}
// tanks
[[-50,8],[-50,16]].forEach(([x,z])=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(3,3,7,20),shellM);t.position.set(x,3.5,z);t.castShadow=true;scene.add(t);addEdges(t);});

// ---------- pipes ----------
const pipes={};const flowSets=[];
function pipe(name,pts,color,r=.45,y=0){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2])),false,'catmullrom',.05);
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,140,r,8,false),new THREE.MeshLambertMaterial({color,emissive:color,emissiveIntensity:.35}));m.castShadow=true;scene.add(m);
  // particles
  const N=60;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(N*3),3));
  const p=new THREE.Points(g,new THREE.PointsMaterial({color,size:1.6,map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}));scene.add(p);
  const o={name,mesh:m,points:p,curve,N,speed:.06,color};flowSets.push(o);pipes[name]=o;return o;}
const Y=3.4;
pipe('sup',[[yard.x-4,Y,yard.z-14],[yard.x-6,Y,-18],[-11,Y,-18],[-11,Y,-26],[-8,Y,30]].slice(0,3).concat([[-11,Y,-18],[-11,4.5,-14]]),C.sup);
pipe('sup2',[[yard.x-4,Y,yard.z+14],[yard.x-6,Y,22],[-11,Y,22],[-11,4.5,26]],C.sup);
pipe('ret',[[10,4.2,-14],[10,Y+.9,-18],[yard.x+6,Y+.9,-18],[yard.x+4,Y+.9,yard.z-14]],C.ret);
pipe('ret2',[[10,4.2,26],[10,Y+.9,22],[yard.x+6,Y+.9,22],[yard.x+4,Y+.9,yard.z+14]],C.ret);
// power trunk from gens
pipe('pw',[[45.5,1.2,-14],[40,1.2,-14],[40,1.2,22],[38,1.2,22]],C.power,.3);
pipe('pw2',[[40,1.2,-18],[-11,1.2,-30],[-41,1.2,-30],[-41,1.2,-18]],C.power,.3);
// pipe racks supports
for(let z=-14;z<=18;z+=4){box(.25,Y,.25,yard.x-6,Y/2,z,darkM,false,false);box(.25,Y,.25,yard.x+6,Y/2,z,darkM,false,false);}
highlights[2]=[pipes.sup.mesh,pipes.sup2.mesh];highlights[4]=[pipes.ret.mesh,pipes.ret2.mesh];

// ---------- interior (x-ray) ----------
{const rackG=new THREE.BoxGeometry(.9,2.2,1);const im=new THREE.InstancedMesh(rackG,new THREE.MeshLambertMaterial({color:0x1d2a36}),rackSlots.length);
 const ledG=new THREE.PlaneGeometry(.12,1.9);const led=new THREE.InstancedMesh(ledG,new THREE.MeshBasicMaterial({color:0xffffff}),rackSlots.length);
 const o=new THREE.Object3D();const col=new THREE.Color();
 rackSlots.forEach(([x,z,H,r],i)=>{o.position.set(x,1.1,z);o.rotation.set(0,0,0);o.updateMatrix();im.setMatrixAt(i,o.matrix);
   o.position.set(x,1.1,z+(r%2?-.51:.51));o.rotation.y=r%2?Math.PI:0;o.updateMatrix();led.setMatrixAt(i,o.matrix);
   col.set(Math.random()<.06?0xff9f43:(r%2?0x2ee6a6:0x38e1ff));led.setColorAt(i,col);});
 xrayGroup.add(im,led);
 halls.forEach(H=>{for(let r=0;r<4;r++){const cold=r%2===0;const a=new THREE.Mesh(new THREE.PlaneGeometry(H.w-6,1.9),new THREE.MeshBasicMaterial({color:cold?0x2f8cff:0xff6a3c,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending}));
   a.rotation.x=-Math.PI/2;a.position.set(H.x,.15,H.z-H.d/2+5.1+r*3.2);xrayGroup.add(a);}
   // CRAH units
   const crs=[];for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.4,2.4),new THREE.MeshLambertMaterial({color:0x2dd4bf,emissive:0x0e5a54}));c.position.set(H.x-H.w/2+1.3,1.2,H.z-6+k*6);xrayGroup.add(c);crs.push(c);}
   H.crah=crs;
   // cable trays (network)
   const t=new THREE.Mesh(new THREE.BoxGeometry(H.w-5,.15,.4),new THREE.MeshBasicMaterial({color:C.net}));t.position.set(H.x,3.2,H.z);xrayGroup.add(t);
   const t2=new THREE.Mesh(new THREE.BoxGeometry(H.w-5,.15,.4),new THREE.MeshBasicMaterial({color:C.power}));t2.position.set(H.x,3.6,H.z-4);xrayGroup.add(t2);
 });
 highlights[3]=halls[0].crah;
}
// ---------- parking / cars / trees / lights ----------
const carCols=[0xd9dee3,0x2c3440,0x8a1f24,0x4a5a6a,0xf0f0f0,0x1f3d5c];
{const pos=[];for(let i=0;i<14;i++)for(let j=0;j<2;j++)if(Math.random()<.75)pos.push([-30+i*4.4,40+j*6]);
 for(let i=0;i<10;i++)if(Math.random()<.7)pos.push([-56,-34+i*5]);
 const body=new THREE.InstancedMesh(new THREE.BoxGeometry(1.9,.8,4),new THREE.MeshLambertMaterial(),pos.length);
 const cab=new THREE.InstancedMesh(new THREE.BoxGeometry(1.7,.6,2.1),new THREE.MeshLambertMaterial({color:0x14202b}),pos.length);
 const o=new THREE.Object3D();const col=new THREE.Color();
 pos.forEach(([x,z],i)=>{const side=x===-56;o.position.set(x,.5,z);o.rotation.set(0,side?Math.PI/2:0,0);o.updateMatrix();body.setMatrixAt(i,o.matrix);
   o.position.y=1.15;o.updateMatrix();cab.setMatrixAt(i,o.matrix);body.setColorAt(i,col.set(carCols[i%carCols.length]));});
 body.castShadow=true;scene.add(body,cab);
 // lot lines
 const lg=new THREE.PlaneGeometry(.15,5);const lines=new THREE.InstancedMesh(lg,new THREE.MeshBasicMaterial({color:0x8fa3b3}),30);
 for(let i=0;i<15;i++)for(let j=0;j<2;j++){o.position.set(-32.2+i*4.4,.07,40+j*6);o.rotation.set(-Math.PI/2,0,0);o.updateMatrix();lines.setMatrixAt(i*2+j,o.matrix);}scene.add(lines);
}
{const tp=[];for(let x=-72;x<=72;x+=6){tp.push([x,-58],[x,62]);}for(let z=-44;z<=50;z+=6){tp.push([-70,z],[70,z]);}
 const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.25,1.6,5),new THREE.MeshLambertMaterial({color:0x3a2c20}),tp.length);
 const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.6,0),new THREE.MeshLambertMaterial({color:0x1f4a33}),tp.length);
 const o=new THREE.Object3D();tp.forEach(([x,z],i)=>{const s=.8+Math.random()*.5;o.position.set(x+Math.random(),.8,z+Math.random());o.scale.set(1,1,1);o.updateMatrix();trunk.setMatrixAt(i,o.matrix);o.position.y=2.4*s;o.scale.setScalar(s);o.updateMatrix();crown.setMatrixAt(i,o.matrix);});
 crown.castShadow=true;scene.add(trunk,crown);}
{const lp=[];for(let x=-66;x<=66;x+=12){lp.push([x,50],[x,-46]);}for(let z=-36;z<=44;z+=12){lp.push([-58,z],[58,z]);}
 const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.1,5,4),new THREE.MeshLambertMaterial({color:0x56626d}),lp.length);
 const head=new THREE.InstancedMesh(new THREE.SphereGeometry(.3,6,4),new THREE.MeshBasicMaterial({color:0xffe2a8}),lp.length);
 const pool=new THREE.InstancedMesh(new THREE.PlaneGeometry(9,9),new THREE.MeshBasicMaterial({map:glowTex,color:0xffc879,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending}),lp.length);
 const o=new THREE.Object3D();lp.forEach(([x,z],i)=>{o.rotation.set(0,0,0);o.position.set(x,2.5,z);o.updateMatrix();pole.setMatrixAt(i,o.matrix);o.position.y=5;o.updateMatrix();head.setMatrixAt(i,o.matrix);o.position.y=.1;o.rotation.x=-Math.PI/2;o.updateMatrix();pool.setMatrixAt(i,o.matrix);});
 scene.add(pole,head,pool);}

// ---------- skyline ----------
const city=new THREE.Group();scene.add(city);
{const N=260;const g=new THREE.BoxGeometry(1,1,1);g.translate(0,.5,0);
 const m=new THREE.MeshLambertMaterial({color:0x101b27,emissive:0xffffff,emissiveMap:winTex,emissiveIntensity:1.25});
 const im=new THREE.InstancedMesh(g,m,N);const o=new THREE.Object3D();
 for(let i=0;i<N;i++){let a=Math.random()*Math.PI*2;while(a>0.05&&a<1.95)a=Math.random()*Math.PI*2;const r=110+Math.random()*170;const far=r>200;
   const w=8+Math.random()*16,h=(far?40:15)+Math.random()*(far?110:55),d=8+Math.random()*14;
   // skew more height behind (north-west) like mockup skyline
   o.position.set(Math.cos(a)*r,0,Math.sin(a)*r-(Math.sin(a)<0?30:0));o.scale.set(w,h,d);o.rotation.y=Math.random()*Math.PI;o.updateMatrix();im.setMatrixAt(i,o.matrix);}
 city.add(im);
 // antenna lights
 const sky=new THREE.Mesh(new THREE.SphereGeometry(600,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){float h=normalize(p).y;vec3 top=vec3(.02,.04,.08);vec3 hor=vec3(.10,.17,.26);gl_FragColor=vec4(mix(hor,top,smoothstep(0.,.45,h)),1.);}'}));
 scene.add(sky);}

// ---------- step markers ----------
const marker=new THREE.Mesh(new THREE.RingGeometry(3,3.6,40),new THREE.MeshBasicMaterial({color:0x38e1ff,transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);

// ---------- C UI ----------
// security fence + cameras
const fenceM=new THREE.LineBasicMaterial({color:0x38e1ff,transparent:true,opacity:.0});
{const p=[[-56,-44],[56,-44],[56,48],[-56,48],[-56,-44]].map(([x,z])=>new THREE.Vector3(x,1.2,z));
 const f=new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),fenceM);scene.add(f);}
const camDots=[];[[-56,-44],[56,-44],[56,48],[-56,48],[0,-44],[0,48]].forEach(([x,z])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.8,8,6),new THREE.MeshBasicMaterial({color:0x2ee6a6}));m.position.set(x,4,z);m.visible=false;scene.add(m);camDots.push(m);});
const powerTray=[],netTray=[];xrayGroup.children.forEach(c=>{if(c.material&&c.material.color){const h=c.material.color.getHex();if(h===C.net)netTray.push(c);if(h===C.power)powerTray.push(c);}});
const sets={
 cool:()=>[...chillers,pipes.sup.mesh,pipes.sup2.mesh,pipes.ret.mesh,pipes.ret2.mesh,...halls.flatMap(h=>h.crah||[])],
 power:()=>[...gens,pipes.pw.mesh,pipes.pw2.mesh,...powerTray],
 it:()=>[],net:()=>netTray,sec:()=>camDots,energy:()=>[...halls.map(h=>h.mesh)]};
const tint={cool:0x22d3ee,power:0x3b82f6,it:0x2ee6a6,net:0xa855f7,sec:0x2ee6a6,energy:0xff9f43};
let saved=new Map(),cur='all';
function setFilter(f){cur=f;saved.forEach((m,o)=>o.material=m);saved.clear();
 const inner=f==='it'||f==='net'||f==='cool'&&false;
 xrayGroup.visible=f==='it'||f==='net';shellMats.forEach(m=>{m.opacity=xrayGroup.visible?.12:1;m.depthWrite=!xrayGroup.visible;});
 edgeM.color.set(f==='all'?C.edge:tint[f]);fenceM.opacity=f==='sec'?1:0;camDots.forEach(d=>d.visible=f==='sec');
 flowSets.forEach(s=>{const sys=s.name.startsWith('pw')?'power':'cool';const on=f==='all'||f==='energy'||sys===f;s.points.visible=on;});
 if(f==='all'){flyTo(HOME.pos.toArray(),HOME.tgt.toArray());return;}
 const col=new THREE.Color(tint[f]);
 (sets[f]()).forEach(o=>{saved.set(o,o.material);o.material=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:f==='energy'?.45:.9,depthWrite:f!=='energy'});});
 flyTo(HOME.pos.toArray().map(v=>v*.85),HOME.tgt.toArray());}
document.querySelectorAll('.fl button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.fl button').forEach(x=>x.classList.toggle('on',x===b));setFilter(b.dataset.f);});
let fly=null;
function flyTo(pos,tgt,dur=1000){fly={p0:camera.position.clone(),t0:controls.target.clone(),p1:new THREE.Vector3(...pos),t1:new THREE.Vector3(...tgt),s:performance.now(),dur};}
// charts
function line(id,vals,color){const el=document.getElementById(id);const [W,H]=el.getAttribute('viewBox').split(' ').slice(2).map(Number);const mn=Math.min(...vals),mx=Math.max(...vals);
 const d='M'+vals.map((v,i)=>`${(i/(vals.length-1)*W).toFixed(1)},${(H-2-(v-mn)/(mx-mn)*(H-6)).toFixed(1)}`).join('L');
 el.innerHTML=`<defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${W},${H}L0,${H}Z" fill="url(#g${id})" stroke="none"/><path d="${d}" stroke="${color}" stroke-width="1.6"/>`;}
line('c1',Array.from({length:26},(_,i)=>i*.4+Math.sin(i*1.3)*1.4+Math.random()),'#3ee6d9');
{const el=document.getElementById('c2');let h='';const v=[.35,.45,.3,.55,.6,.4,.7,.5,.85,.6,.75,.95,.55,.8,.9,1];v.forEach((k,i)=>{h+=`<rect x="${i*6.2+1}" y="${30-k*28}" width="3.6" height="${k*28}" rx=".8" fill="url(#gb)"/>`;});el.innerHTML=`<defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4af0e0"/><stop offset="1" stop-color="#0e6e74"/></linearGradient></defs>`+h;}
{const el=document.getElementById('c3');let h='';for(let i=0;i<70;i++){const x=Math.random()*100,y=26-x*.2-Math.random()*10;h+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.5+Math.random()*.7).toFixed(2)}" fill="#7ff3e6" opacity="${(.3+Math.random()*.7).toFixed(2)}"/>`;}el.innerHTML=h;}
const pad2=n=>String(n).padStart(2,'0');
const tk=()=>{const d=new Date();document.getElementById('clock').textContent=pad2(d.getHours())+':'+pad2(d.getMinutes());document.getElementById('stT').textContent=d.toTimeString().slice(0,8);};tk();setInterval(tk,1000);
// tabs
document.querySelector('.tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));const t=b.dataset.t;document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!=='p-'+t);};
let touched=false;canvas.addEventListener('pointerdown',()=>touched=true);
function resize(){const w=innerWidth,h=innerHeight;const pt=w<h;
 HOME.pos.set(...(pt?[20,96,236]:[14,72,150]));HOME.tgt.set(...(pt?[4,0,-4]:[6,0,-6]));if(!touched){camera.position.copy(HOME.pos);controls.target.copy(HOME.tgt);}renderer.setSize(w,h,false);camera.aspect=w/h;
 const port=w<h;camera.fov=port?40:38;camera.updateProjectionMatrix();
 // shift scene into visible window between UI blocks
 const top=port?.22:.24,bot=port?.36:.33;camera.setViewOffset(w,h,0,(bot-top)/2*h,w,h);}
addEventListener('resize',resize);resize();
const clk=new THREE.Clock();const v=new THREE.Vector3();
function frame(){const dt=Math.min(clk.getDelta(),.05),t=clk.elapsedTime;
 fans.forEach((f,i)=>f.rotation.z+=dt*(6+i%3));
 flowSets.forEach(s=>{if(!s.points.visible)return;const a=s.points.geometry.attributes.position;for(let i=0;i<s.N;i++){const u=(i/s.N+t*s.speed)%1;s.curve.getPointAt(u,v);a.setXYZ(i,v.x,v.y+.1,v.z);}a.needsUpdate=true;});
 saved.forEach((_,o)=>o.material.opacity=(cur==='energy'?.3:.6)+.3*Math.sin(t*4));
 if(fly){const k=Math.min(1,(performance.now()-fly.s)/fly.dur),e=k<.5?2*k*k:1-(-2*k+2)**2/2;camera.position.lerpVectors(fly.p0,fly.p1,e);controls.target.lerpVectors(fly.t0,fly.t1,e);if(k>=1)fly=null;}
 siteGlow.material.opacity=.8+.2*Math.sin(t*1.5);
 controls.update();renderer.render(scene,camera);requestAnimationFrame(frame);}
frame();
window.__MTC__={setFilter};window.__MT2_READY__=true;
