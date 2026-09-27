import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import {render,ROOT,T,FPS,W,H} from './film.mjs';
const ffmpeg=execFileSync(process.env.PYTHON || 'python',['-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8'}).trim();
const start=Number(process.argv[2]||0),end=Number(process.argv[3]||T.duration),name=process.argv[4]||'picture.mp4',preview=process.argv.includes('--preview');
const fps=preview?30:FPS,file=path.join(ROOT,name);
const ff=spawn(ffmpeg,['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an','-vf',`${preview?'scale=1280:720:':'scale='}in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p`,'-c:v','libx264','-preset',preview?'veryfast':'fast','-crf',preview?'22':'17','-r',String(fps),'-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-movflags','+faststart',file],{stdio:['pipe','ignore','pipe']});
let errors='';ff.stderr.on('data',b=>errors+=b.toString());
const done=new Promise((res,rej)=>{ff.on('error',rej);ff.on('close',c=>c===0?res():rej(Error(errors)));});
const n=Math.round((end-start)*fps),now=Date.now();
for(let f=0;f<n;f++){
  const c=render(Math.round((start+f/fps)*FPS));const data=c.toBuffer('image/jpeg',preview?91:98);
  if(!ff.stdin.write(data))await once(ff.stdin,'drain');
  if(f%240===0)console.log(`${f}/${n} frames | ${((f+1)/((Date.now()-now)/1000)).toFixed(1)} fps`);
}
ff.stdin.end();await done;fs.writeFileSync(file+'.json',JSON.stringify({start,end,fps,frames:n,width:preview?1280:W,height:preview?720:H,renderSeconds:(Date.now()-now)/1000},null,2));console.log(file);
