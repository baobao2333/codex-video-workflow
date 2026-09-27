"""Select optional supplied audio, falling back to a locally composed score."""
from pathlib import Path
import subprocess
import warnings
import numpy as np
from scipy.io import wavfile
import imageio_ffmpeg
from score import compose


def select_provider(mode, source):
    if mode not in ('auto', 'code', 'file'): raise ValueError('Unknown music mode')
    exists = bool(source and Path(source).is_file())
    if mode == 'file' and not exists:
        raise FileNotFoundError('--music file requires an existing --input audio file')
    return 'file' if mode != 'code' and exists else 'code'


def make_music(mode, source, timeline, directory):
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    provider = select_provider(mode, source)
    reason = ('No optional input supplied; composing locally.' if not source else 'Optional input missing; composing locally.') if provider == 'code' else 'Using supplied audio.'
    if provider == 'code':
        audio, info = compose(timeline['bpm'], timeline['duration'])
        info['selection_reason'] = 'Local composition explicitly selected.' if mode == 'code' else reason
        return audio, info
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    decoded = directory/'input-decoded.wav'
    try:
        subprocess.run([ff, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(Path(source).resolve()), '-t', str(timeline['duration']), '-vn', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_f32le', str(decoded)], check=True, capture_output=True)
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            _, raw = wavfile.read(decoded)
        if not len(raw) or not np.isfinite(raw).all() or np.max(np.abs(raw)) < 1e-7:
            raise ValueError('Supplied audio is empty, silent or non-finite')
    except (subprocess.CalledProcessError, ValueError):
        if mode == 'file': raise
        audio, info = compose(timeline['bpm'], timeline['duration'])
        info['selection_reason'] = 'Optional audio could not be decoded or was silent; composed locally.'
        return audio, info
    count = round(timeline['duration']*48000)
    audio = raw.astype(np.float32)
    repeats = 0
    crossfade = min(2400, len(audio)//4)
    while len(audio) < count:
        ramp = np.linspace(0, 1, crossfade, dtype=np.float32)[:, None]
        if crossfade:
            joined = audio[-crossfade:]*(1-ramp)+raw[:crossfade]*ramp
            audio = np.concatenate([audio[:-crossfade], joined, raw[crossfade:]])
        else:
            audio = np.concatenate([audio, raw])
        repeats += 1
    audio = audio[:count].copy()
    ramp = min(2400, count)
    audio[:ramp] *= np.linspace(0, 1, ramp)[:, None]
    end = min(48000, count)
    audio[-end:] *= np.linspace(1, 0, end)[:, None]
    return audio, {'provider': 'file', 'input_name': Path(source).name, 'decoded_seconds': len(raw)/48000,
                   'output_duration': timeline['duration'], 'crossfade_seconds': crossfade/48000,
                   'repeats': repeats, 'selection_reason': reason,
                   'notes': 'Supplied audio trimmed/repeated with crossfades. Tempo is NOT automatically matched; review phrase boundaries.'}
