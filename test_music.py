"""Focused checks for the account-free music path and optional-input behavior."""
from pathlib import Path
import tempfile
import unittest
import numpy as np
from scipy.io import wavfile
from music import select_provider, make_music
from score import compose


class MusicTests(unittest.TestCase):
    def test_no_subscription_or_input_required(self):
        self.assertEqual(select_provider('auto', None), 'code')
        self.assertEqual(select_provider('auto', 'missing-track.wav'), 'code')
        with self.assertRaises(FileNotFoundError): select_provider('file', None)

    def test_original_score_is_deterministic_and_finite(self):
        a, metadata = compose(sr=16000)
        b, _ = compose(sr=16000)
        self.assertTrue(np.array_equal(a, b))
        self.assertEqual(a.shape, (640000, 2))
        self.assertTrue(np.isfinite(a).all())
        self.assertLessEqual(np.max(np.abs(a)), .781)
        self.assertGreater(np.sqrt(np.mean(a*a)), .02)
        self.assertLess(np.max(np.abs(a[-160:])), .005)
        self.assertEqual(metadata['provider'], 'procedural')

    def test_supplied_audio_is_used_and_extended(self):
        with tempfile.TemporaryDirectory() as tmp:
            f = Path(tmp)/'input.wav'
            t = np.arange(4800)/48000
            wavfile.write(f, 48000, (.1*np.sin(2*np.pi*440*t)).astype(np.float32))
            a, metadata = make_music('auto', f, {'bpm': 144, 'duration': .5}, tmp)
            self.assertEqual(a.shape, (24000, 2))
            self.assertEqual(metadata['provider'], 'file')
            self.assertGreater(metadata['repeats'], 0)
            self.assertTrue(np.isfinite(a).all())
            self.assertEqual(select_provider('code', f), 'code')

    def test_bad_optional_audio_falls_back_but_strict_file_errors(self):
        with tempfile.TemporaryDirectory() as tmp:
            f = Path(tmp)/'bad.wav'
            f.write_text('not an audio file')
            a, metadata = make_music('auto', f, {'bpm': 144, 'duration': 40}, tmp)
            self.assertEqual(metadata['provider'], 'procedural')
            self.assertEqual(len(a), 1920000)
            with self.assertRaises(Exception):
                make_music('file', f, {'bpm': 144, 'duration': 40}, tmp)


if __name__ == '__main__': unittest.main()
