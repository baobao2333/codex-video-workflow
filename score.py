"""Original deterministic electronic cue. No model, account, samples or API."""
import numpy as np
from scipy import signal


def compose(bpm=144, duration=40, sr=48000, seed=20260927):
    """Return stereo float audio and an auditable beat/arrangement description."""
    if bpm != 144 or duration != 40:
        raise ValueError('This example is arranged for 144 BPM / 40 seconds. Re-arrange for other lengths.')
    rng = np.random.default_rng(seed)
    n = round(duration * sr)
    beat = 60 / bpm
    stems = {k: np.zeros((n, 2), np.float32) for k in ('drums', 'bass', 'keys')}

    def time(d): return np.arange(round(d * sr)) / sr
    def hz(note): return 440 * 2 ** ((note - 69) / 12)
    def noise(t): return rng.normal(0, 1, len(t))
    def filt(x, cutoff, kind='lowpass'):
        return signal.sosfilt(signal.butter(2, cutoff, kind, fs=sr, output='sos'), x)

    def put(stem, sound, at, gain=1, pan=0):
        start = round(at * sr)
        end = min(n, start + len(sound))
        if start < 0 or start >= end: return
        sound = sound[:end-start]
        if sound.ndim == 1:
            sound = sound[:, None] * np.array([np.sqrt((1-pan)/2), np.sqrt((1+pan)/2)])
        stems[stem][start:end] += (sound * gain).astype(np.float32)

    def kick():
        t = time(.46)
        phase = np.cumsum(48 + 122*np.exp(-t*58)) * 2*np.pi / sr
        return np.tanh((np.sin(phase)*np.exp(-t*10) + filt(noise(t), 4500, 'highpass')*np.exp(-t*390)*.12)*1.4) * (1-np.exp(-t*2000))

    def clap():
        t = time(.24)
        envelope = sum(np.where(t >= at, np.exp(-np.maximum(t-at, 0)*90), 0) for at in (0, .012, .025))
        envelope += np.exp(-np.maximum(t-.035, 0)*27) * (t > .035)*.6
        return filt(noise(t), [800, 7400], 'bandpass') * envelope * .5

    def hat(opened=False):
        t = time(.19 if opened else .06)
        return filt(noise(t), 7400, 'highpass') * np.exp(-t*(22 if opened else 85))*.23

    def bass(note, d=.28):
        t = time(d+.08)
        cutoff = 2+11*np.exp(-t*18)
        wave = sum(np.sin(2*np.pi*hz(note)*h*t)*np.exp(-h/cutoff)/h for h in range(1, 14))
        env = (1-np.exp(-t*450))*np.exp(-t*4)*np.clip((d+.08-t)/.07, 0, 1)
        return np.tanh(wave*2)*env*.43

    def keys(notes, d=.43):
        t = time(d+.3)
        env = (1-np.exp(-t*350))*np.exp(-t*5.3)*np.clip((d+.3-t)/.2, 0, 1)
        channels = []
        for detune in (-.0015, .0015):
            wave = sum(np.sin(2*np.pi*hz(note)*(1+detune)*t + 1.3*np.exp(-t*9)*np.sin(2*np.pi*hz(note)*2*t)) for note in notes)
            channels.append(wave*env/len(notes)*.32)
        return np.column_stack(channels)

    # 24 bars / 12 scenes. A break at 20s, restart at 23 1/3s, brand at 33 1/3s.
    roots = [38, 41, 36, 34]
    harmony = [[50, 53, 57, 64], [53, 57, 60, 64], [48, 52, 55, 62], [46, 50, 53, 60]]
    k, c = kick(), clap()
    downbeats = []
    for bar in range(24):
        at = bar*4*beat
        scene = bar//2
        root, notes = roots[(bar//2)%4], harmony[(bar//2)%4]
        intro, breath, outro = bar < 2, 12 <= bar < 14, bar >= 22
        drum_beats = ([0] if bar == 22 else []) if outro else ([0, 2] if intro else ([] if breath else [0, 1, 2, 3]))
        for b in drum_beats:
            put('drums', k, at+b*beat, .55 if intro else .72)
            downbeats.append(round(at+b*beat, 6))
        if not breath and not outro:
            for b in ([2] if intro else [1, 3]): put('drums', c, at+b*beat, .48, .03)
            for h in (range(8) if not intro else [1, 3, 5, 7]):
                put('drums', hat(), at+h*beat/2, .7 if h%2 else .36, .22 if h%2 else -.22)
            if scene in (3, 4, 5, 7, 8, 9, 10):
                for b in (.5, 2.5): put('drums', hat(True), at+b*beat, .48, .3)
        if 1 <= bar < 22 and not breath:
            for b, interval, d, gain in [(0, 0, .35, 1), (1.5, 0, .22, .8), (2.25, 12, .16, .55), (2.75, 0, .25, .85), (3.5, 7, .16, .6)]:
                put('bass', bass(root+interval, d), at+b*beat, gain)
        if bar >= 2 and not outro:
            for b in ([.5] if breath else [1.5, 3.25]):
                sound = keys(notes, .75 if breath else .38)
                put('keys', sound, at+b*beat, .42 if breath else .8)
                put('keys', sound[:, ::-1], at+(b+.75)*beat, .16)
        if scene in (4, 5, 8, 9, 10):
            for i, interval in enumerate([0, 7, 12, 10]):
                put('keys', keys([root+24+interval], .13), at+(i+.5)*beat, .23, 0)
        if bar in (5, 9, 11, 17, 19, 21):
            for i in range(4): put('drums', hat(), at+(3+i*.25)*beat, .4+i*.12, (i-1.5)*.2)
    put('bass', bass(38, 1.3), 22*4*beat, .8)
    put('keys', keys([50, 57, 62, 65], 2.0), 22*4*beat, .9)
    times = np.arange(n)/sr
    # Sidechain the harmonic layers to leave room for the kick transient.
    duck = np.ones(n)
    for at in downbeats:
        start = round(at*sr); length = min(round(.23*sr), n-start)
        duck[start:start+length] *= 1-.44*np.exp(-np.arange(length)/sr*17)
    stems['bass'] *= duck[:, None]
    stems['keys'] *= duck[:, None]
    music = sum(stems.values())
    envelope = np.interp(times, [0, .012, 3.04, 3.20, 3.333333, 19.85, 20, 23.1, 23.333333, 36.666667, 38.7, 40], [.7, .85, .85, .18, 1, 1, .28, .28, 1, .9, .7, 0])
    music *= envelope[:, None]
    # Preserve headroom before Foley and loudness mastering.
    music *= .78/max(float(np.max(np.abs(music))), .78)
    return music, {'provider': 'procedural', 'seed': seed, 'bpm': bpm, 'duration': duration,
                   'sample_rate': sr, 'bars': 24, 'key': 'D minor', 'kick_times': downbeats,
                   'synthesis': 'Local NumPy/SciPy synthesis; no downloaded samples, model or API.',
                   'arrangement': 'intro → groove → layered motif → break (20s) → restart (23.333s) → brand → decay'}
