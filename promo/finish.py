"""Score, synchronize, master, mux and technically verify the workflow film."""
from pathlib import Path
import argparse
import json
import re
import subprocess
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile
import imageio_ffmpeg

P=Path(__file__).resolve().parent
sys.path.insert(0,str(P.parent))
from score import compose

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--proof',action='store_true',help='Mux the 12–20s motion proof only')
args=parser.parse_args()
FF=imageio_ffmpeg.get_ffmpeg_exe();SR=48000;N=40*SR
(P/'audio').mkdir(exist_ok=True);(P/'dist').mkdir(exist_ok=True)
music,info=compose();sfx=np.zeros_like(music);rng=np.random.default_rng(716)
events=[]


def add(a,at,gain,pan=0,kind='mechanism'):
    start=round(at*SR);end=min(N,start+len(a))
    if start>=end:return
    a=a[:end-start]*gain
    sfx[start:end]+=a[:,None]*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])
    events.append({'time':round(at,6),'frame':round(at*30),'type':kind})


def tick(pitch=2100):
    t=np.arange(round(.11*SR))/SR
    return (np.sin(2*np.pi*pitch*t)*np.exp(-t*90)+rng.normal(0,1,len(t))*.2*np.exp(-t*120))*(1-np.exp(-t*2000))


def latch():
    t=np.arange(round(.28*SR))/SR
    return .65*np.sin(2*np.pi*(61*t+2*(1-np.exp(-t*45))))*np.exp(-t*20)+.2*np.sin(2*np.pi*3200*t)*np.exp(-t*110)


for at in [0,4,9,14,20,23.333333,28,33.333333]:add(latch(),at,.3,0,'section-lock')
for i in range(3):add(tick(1400+i*380),4.3+i*.35,.12,(i-1)*.25,'reference-filter')
for i in range(3):add(tick(1900+i*300),9.25+i*.21,.12,(i-1)*.25,'storyboard-hinge')
for at in [20.2,20.9,22.75]:add(tick(1800),at,.13,.12,'revision')
for i in range(24):add(tick(2200+i%4*220),23.333333+i*(60/144)/2,.05,(i%3-1)*.2,'score-pin')
# Soft transport noise. Its amplitude follows the same start, pause and restart.
t=np.arange(N)/SR
motor=signal.sosfilt(signal.butter(2,[180,3200],btype='bandpass',fs=SR,output='sos'),rng.normal(0,1,N))
amp=np.interp(t,[0,.08,13.5,14,19.6,20,23.1,23.333333,32.9,33.333333,39.7,40],[0,.005,.005,.012,.012,0,0,.010,.010,.003,.001,0])
sfx+=motor[:,None]*amp[:,None]
# Short pre-lap sweeps motivate the camera's fast changes.
for at in [3.75,8.75,13.75,23.1,27.75,32.95]:
    u=np.arange(round(.25*SR))/SR
    a=signal.sosfilt(signal.butter(2,[900,6200],btype='bandpass',fs=SR,output='sos'),rng.normal(0,1,len(u)))
    add(a*np.sin(np.pi*u/.25)**2,at,.05,-.15,'camera-air')
mix=music*.87+sfx
for name,data in [('music',music),('sfx',sfx),('mix',mix)]:wavfile.write(P/f'audio/{name}.wav',SR,data.astype(np.float32))
info.update({'visual_events':events,'title':'Video Workflow — Make It Flow','notes':'Original local score plus mechanical Foley. No Suno or samples.'})
(P/'audio/music-edit.json').write_text(json.dumps(info,ensure_ascii=False,indent=2),encoding='utf-8')
base=[FF,'-hide_banner','-i',str(P/'audio/mix.wav')]
r=subprocess.run(base+['-af','loudnorm=I=-14:TP=-2:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
m=json.loads(re.findall(r'\{[^{}]+\}',r.stderr)[-1])
flt='loudnorm=I=-14:TP=-2:LRA=9:linear=false:'+f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}"
subprocess.run([FF,'-y',*base[1:],'-af',flt,'-ar',str(SR),'-c:a','pcm_s24le',str(P/'audio/master.wav')],capture_output=True,check=True)
picture=P/'dist'/('proof-picture.mp4' if args.proof else 'workflow-picture.mp4')
out=P/'dist'/('motion-proof.mp4' if args.proof else 'video-workflow.mp4')
cmd=[FF,'-y','-hide_banner','-loglevel','error','-i',str(picture)]
if args.proof:cmd+=['-ss','12']
cmd+=['-i',str(P/'audio/master.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-t','8' if args.proof else '40','-movflags','+faststart',str(out)]
subprocess.run(cmd,check=True)
if args.proof:
    print(out);sys.exit(0)
subprocess.run([FF,'-y','-hide_banner','-loglevel','error','-i',str(out),'-vf','scale=1280:720','-c:v','libx264','-crf','22','-preset','fast','-c:a','aac','-b:a','160k','-movflags','+faststart',str(P/'dist/workflow-preview.mp4')],check=True)
r=subprocess.run([FF,'-hide_banner','-nostats','-i',str(out),'-vf','blackdetect=d=0.1:pix_th=0.01','-af','loudnorm=I=-14:TP=-1:LRA=9:print_format=json','-progress','pipe:1','-f','null','-'],capture_output=True,text=True,check=True)
measure=json.loads(re.findall(r'\{[^{}]+\}',r.stderr)[-1]);frames=int(re.findall(r'^frame=(\d+)',r.stdout,re.M)[-1]);meta=next(imageio_ffmpeg.read_frames(str(out)))
report={'duration':meta['duration'],'size':meta['size'],'fps':meta['fps'],'decoded_frames':frames,'full_decode_pass':True,'integrated_lufs':float(measure['input_i']),'true_peak_dbtp':float(measure['input_tp']),'black_intervals':re.findall(r'black_start:[^\n]+',r.stderr),'music_provider':'procedural','scope':'Technical checks and key-frame inspection; no claim of complete human listening review.'}
assert meta['size']==(1920,1080) and meta['fps']==30 and frames==1200
assert abs(report['integrated_lufs']+14)<1 and report['true_peak_dbtp']<=-1
assert not report['black_intervals']
(P/'dist/verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
subprocess.run([FF,'-y','-hide_banner','-loglevel','error','-ss','35.8','-i',str(out),'-frames:v','1',str(P/'dist/poster.jpg')],check=True)
print(json.dumps(report,indent=2))
