"""Compose or import optional music, add picture cues, and master the mix."""
from pathlib import Path
import argparse,json,subprocess,re
import numpy as np
from scipy.io import wavfile
from scipy import signal
import imageio_ffmpeg
from music import make_music
P=Path(__file__).resolve().parent
T=json.loads((P/'timeline.json').read_text(encoding='utf-8'))
FF=imageio_ffmpeg.get_ffmpeg_exe(); SR=48000; D=T['duration']; N=round(D*SR)
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--music',choices=['auto','code','file'],default='auto')
parser.add_argument('--input',help='Optional licensed audio, including a downloaded Suno track')
args=parser.parse_args()
music,info=make_music(args.music,args.input,T,P/'audio')
print(info['selection_reason'])
times=np.arange(N)/SR
sfx=np.zeros((N,2),dtype=np.float64);rng=np.random.default_rng(49017);events=[]
def add(sound,at,gain=.2,pan=0,kind='click'):
    start=round(at*SR);end=min(N,start+len(sound))
    if start<0 or start>=N:return
    sound=sound[:end-start]*gain
    sfx[start:end,0]+=sound*np.sqrt((1-pan)/2)
    sfx[start:end,1]+=sound*np.sqrt((1+pan)/2)
    events.append({'time':round(at,6),'frame':round(at*T['fps']),'type':kind,'gain':gain})
def click(n=.07):
    t=np.arange(round(n*SR))/SR
    return (rng.normal(0,1,len(t))*.2+np.sin(2*np.pi*2450*t)*.5)*np.exp(-t*95)*np.minimum(t/.0008,1)
def thump():
    t=np.arange(round(.42*SR))/SR;phase=2*np.pi*(48*t+58*.021*(1-np.exp(-t/.021)))
    return np.sin(phase)*np.exp(-t*12)*np.minimum(t/.001,1)
def whoosh():
    t=np.arange(round(.32*SR))/SR;n=rng.normal(0,1,len(t));n=signal.sosfilt(signal.butter(2,[500,6500],fs=SR,btype='bandpass',output='sos'),n)
    return n*np.sin(np.pi*t/.32)**2*.42
for j,s in enumerate(T['scenes']):
    at=round(s['start']*T['fps'])/T['fps']
    if j in [1,3,5,7,9,10,11]:add(thump(),at,.34 if j!=6 else .1,0,'impact')
    else:add(click(),at,.23,0,'cut')
    if j in [1,2,3,4,7,10,11]:add(whoosh(),max(0,at-.27),.22,(-.3 if j%2 else .3),'sweep')
for i in range(11):add(click(.027),6.68+i*.125,.060,(i/10-.5)*.5,'type')
for i in range(5):add(click(),10.1+i*(60/144)*.5,.085,i*.18-.35,'assembly')
add(click(),20,.23,-.2,'reset');add(thump(),23.333333,.38,0,'restart')
# A short broadband brand signature, then a musical decay from the original cue.
add(click(.11),36.666667,.2,.1,'logo');add(thump(),36.666667,.34,0,'logo-sub')
endfade=np.minimum(1,np.maximum(0,(40-times)/.15));sfx*=endfade[:,None]
mix_audio=music+sfx
for name,a in [('music',music),('sfx',sfx),('mix',mix_audio)]:wavfile.write(P/f'audio/{name}.wav',SR,a.astype(np.float32))
info.update({'output_bpm':T['bpm'],'output_duration':D,'events':events})
(P/'audio/music-edit.json').write_text(json.dumps(info,ensure_ascii=False,indent=2),encoding='utf-8')
base=[FF,'-hide_banner','-i',str(P/'audio/mix.wav')]
r=subprocess.run(base+['-af','loudnorm=I=-14:TP=-2:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
m=json.loads(re.findall(r'\{[^{}]+\}',r.stderr)[-1])
flt=('loudnorm=I=-14:TP=-2:LRA=9:linear=false:'+f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:print_format=json")
r=subprocess.run([FF,'-y',*base[1:],'-af',flt,'-ar',str(SR),'-c:a','pcm_s24le',str(P/'audio/master.wav')],capture_output=True,text=True,check=True)
master=json.loads(re.findall(r'\{[^{}]+\}',r.stderr)[-1])
(P/'audio/loudness.json').write_text(json.dumps({'analysis':m,'master':master},indent=2),encoding='utf-8')
print(json.dumps({'edit':{k:v for k,v in info.items() if k!='events'},'master':master},indent=2))
