from pathlib import Path
import subprocess,re,json,shutil
import imageio_ffmpeg
P=Path(__file__).resolve().parent; FF=imageio_ffmpeg.get_ffmpeg_exe()
(P/'dist').mkdir(exist_ok=True)
T=json.loads((P/'timeline.json').read_text(encoding='utf-8'));out=P/'dist/codex-make-it-happen.mp4'
subprocess.run([FF,'-y','-hide_banner','-loglevel','error','-i',str(P/'picture.mp4'),'-i',str(P/'audio/master.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000','-t',str(T['duration']),'-movflags','+faststart','-metadata','title=Codex - Make It Happen',str(out)],check=True)
subprocess.run([FF,'-y','-hide_banner','-loglevel','error','-i',str(P/'preview-picture.mp4'),'-i',str(P/'audio/master.wav'),'-c:v','copy','-c:a','aac','-b:a','192k','-t',str(T['duration']),'-movflags','+faststart',str(P/'dist/codex-preview.mp4')],check=True)
r=subprocess.run([FF,'-hide_banner','-nostats','-i',str(out),'-vf','blackdetect=d=0.10:pix_th=0.01','-af','loudnorm=I=-14:TP=-1:LRA=9:print_format=json','-progress','pipe:1','-f','null','-'],capture_output=True,text=True,check=True)
measure=json.loads(re.findall(r'\{[^{}]+\}',r.stderr)[-1]); frames=int(re.findall(r'^frame=(\d+)',r.stdout,re.M)[-1]);meta=next(imageio_ffmpeg.read_frames(str(out)))
report={'file':out.name,'duration':meta['duration'],'size':meta['size'],'fps':meta['fps'],'decoded_frames':frames,'expected_frames':T['fps']*T['duration'],'full_decode_pass':True,'integrated_lufs':float(measure['input_i']),'true_peak_dbtp':float(measure['input_tp']),'loudness_range_lu':float(measure['input_lra']),'black_intervals':re.findall(r'black_start:[^\n]+',r.stderr),'scope':'Automated technical checks only; visual and listening reviews must be recorded separately.'}
assert frames==T['fps']*T['duration'] and meta['size']==(1920,1080) and meta['fps']==60
assert abs(report['integrated_lufs']+14)<1 and report['true_peak_dbtp']<=-1
(P/'dist/verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
(P/'dist/ffmpeg-verification.log').write_text(r.stderr,encoding='utf-8')
def stamp(t):
    n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
srt='\n\n'.join(f"{i+1}\n{stamp(s['start'])} --> {stamp(s['end'])}\n{s['title']}" for i,s in enumerate(T['scenes']))+'\n'
(P/'dist/codex-titles.srt').write_text(srt,encoding='utf-8')
print(json.dumps(report,indent=2))
