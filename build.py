"""Rebuild the example after installing requirements.txt and npm dependencies."""
import argparse
import os
from pathlib import Path
import subprocess
import sys

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--music', choices=['auto', 'code', 'file'], default='auto')
p.add_argument('--input', help='Optional local audio file')
p.add_argument('--audio-only', action='store_true')
a = p.parse_args()
root = Path(__file__).resolve().parent
env = {**os.environ, 'PYTHON': sys.executable}


def run(*command):
    subprocess.run(command, cwd=root, env=env, check=True)


for folder in ('frames', 'dist', 'audio'): (root/folder).mkdir(exist_ok=True)
mix = [sys.executable, 'mix.py', '--music', a.music]
if a.input: mix += ['--input', str(Path(a.input).resolve())]
run(*mix)
if not a.audio_only:
    run('node', 'film.mjs')
    run(sys.executable, 'storyboard.py')
    run('node', 'render.mjs', '0', '40', 'preview-picture.mp4', '--preview')
    run('node', 'render.mjs', '0', '40', 'picture.mp4')
    run('node', 'check.mjs')
    run(sys.executable, 'finish.py')
