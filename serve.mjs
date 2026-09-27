import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),port=Number(process.argv[2]||8765);
const types={'.html':'text/html; charset=utf-8','.json':'application/json','.mp4':'video/mp4','.jpg':'image/jpeg','.png':'image/png','.wav':'audio/wav','.md':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  const size=fs.statSync(file).size;let a=0,b=size-1;const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  if(range){a=Number(range[1]);b=range[2]?Math.min(Number(range[2]),b):b;if(a>b){res.writeHead(416);res.end();return;}res.writeHead(206,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':b-a+1,'Content-Range':`bytes ${a}-${b}/${size}`,'Accept-Ranges':'bytes'});}
  else res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':size,'Accept-Ranges':'bytes'});
  fs.createReadStream(file,{start:a,end:b}).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}`));
