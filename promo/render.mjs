import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from 'playwright-core';

const root=path.dirname(fileURLToPath(import.meta.url)),workspace=path.dirname(root);
const args=process.argv.slice(2),arg=(name,def)=>args.includes(name)?args[args.indexOf(name)+1]:def;
const start=Number(arg('--start',0)),end=Number(arg('--end',40)),preview=args.includes('--preview'),stills=args.includes('--stills');
const dir=path.join(root,'dist');fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(path.join(root,'frames'),{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.ttf':'font/ttf','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(workspace,'.'+name);if(!file.startsWith(workspace+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch{res.writeHead(400);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||undefined,args:[`--use-angle=${process.env.ANGLE_BACKEND||(process.platform==='win32'?'d3d11':'default')}`,'--enable-unsafe-swiftshader']});
try{
  const width=preview?1280:1920,height=preview?720:1080;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('BROWSER: '+m.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/promo/index.html`);
  await page.waitForFunction(()=>window.READY,null,{timeout:90000});
  const capture=async(t,format='jpeg')=>{await page.evaluate(async t=>{window.render(t);if(document.querySelector('canvas').getContext('webgl2').isContextLost())throw Error('WebGL context lost');await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);},t);if(errors.length)throw Error(errors.join('\n'));return await page.screenshot({type:format,...(format==='jpeg'?{quality:95}:{})});};
  if(stills){
    for(const t of [1.8,5.9,10.8,16.8,21.5,25.2,30.6,35.8,39]){fs.writeFileSync(path.join(root,'frames',`${t.toFixed(1)}.jpg`),await capture(t));console.log(`Still ${t}`);}
    const a=await capture(16.8,'png');await capture(5);const b=await capture(16.8,'png');
    if(!a.equals(b))throw Error('Frame seeking is not deterministic');
    fs.writeFileSync(path.join(dir,'frame-check.json'),JSON.stringify({deterministic:true,frameTime:16.8,errors},null,2));
  }else{
    const fps=30,filename=arg('--output',preview?'proof-picture.mp4':'workflow-picture.mp4');
    const ffmpeg=execFileSync(process.env.PYTHON||'python',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).trim();
    const ff=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an','-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-crf',preview?'22':'18','-preset','fast','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',path.join(dir,filename)],{stdio:['pipe','ignore','pipe']});
    let err='';ff.stderr.on('data',b=>err+=b.toString());const done=new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('close',c=>c===0?resolve():reject(Error(err)));});
    const count=Math.round((end-start)*fps),began=Date.now();
    for(let f=0;f<count;f++){const buffer=await capture(start+f/fps);if(!ff.stdin.write(buffer))await once(ff.stdin,'drain');if(f%120===0)console.log(`${f}/${count} frames, ${((f+1)/(Date.now()-began)*1000).toFixed(1)} fps`);}
    ff.stdin.end();await done;
    fs.writeFileSync(path.join(dir,filename+'.json'),JSON.stringify({start,end,fps,width,height,frames:count,renderSeconds:(Date.now()-began)/1000,errors},null,2));
    console.log(path.join(dir,filename));
  }
}finally{await browser.close();server.close();}
