"""Synthesize the music bed and sound effects for the explainer. Everything is generated
here from sine waves and noise, so the video uses no samples or third-party audio.

Usage (from the repo root): uv run python video/scripts/sound.py
Reads video/src/narration.json and timings.json for scene starts; writes
video/public/audio/music.wav and sfx-*.wav."""

from __future__ import annotations

import json
import math
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 48_000
FPS, PAD = 30, 0.55  # keep in sync with video/src/theme.ts
BPM = 84
BED_LUFS = -32.0  # music under narration; the voice sits at about -16.5 LUFS
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/audio"
rng = np.random.default_rng(7)


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def osc(freq: float, n: int, harmonics: list[tuple[int, float]], cents: float = 0.0) -> np.ndarray:
    t = np.arange(n) / SR
    f = freq * 2 ** (cents / 1200)
    return sum(a * np.sin(2 * np.pi * f * h * t) for h, a in harmonics)


def swell(n: int, attack: float, release: float) -> np.ndarray:
    env = np.ones(n)
    a, r = int(attack * SR), int(release * SR)
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    env[-r:] = np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return env


def add(buf: np.ndarray, start: float, sig: np.ndarray, pan: float = 0.0, gain: float = 1.0) -> None:
    i = int(start * SR)
    if i >= len(buf) or i < 0:
        return
    n = min(len(sig), len(buf) - i)
    left, right = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
    buf[i : i + n, 0] += sig[:n] * left * gain
    buf[i : i + n, 1] += sig[:n] * right * gain


def fftconvolve(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    n = len(a) + len(b) - 1
    size = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(a, size) * np.fft.rfft(b, size), size)[:n]


def reverb(x: np.ndarray, seconds: float = 2.4, mix: float = 0.3) -> np.ndarray:
    n = int(seconds * SR)
    t = np.arange(n) / SR
    wet = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / 0.55)
        ir = np.convolve(ir, np.ones(32) / 32, mode="same")  # darken the tail
        ir /= np.sqrt((ir**2).sum())
        wet[:, ch] = fftconvolve(x[:, ch], ir)[: len(x)]
    return x * (1 - mix) + wet * mix


def band(noise: np.ndarray, center: float, octaves: float) -> np.ndarray:
    spec = np.fft.rfft(noise)
    f = np.maximum(np.fft.rfftfreq(len(noise), 1 / SR), 1.0)
    spec *= np.exp(-0.5 * (np.log2(f / center) / octaves) ** 2)
    return np.fft.irfft(spec, len(noise))


def write_wav(path: Path, sig: np.ndarray, peak: float | None = None) -> None:
    if sig.ndim == 1:
        sig = np.stack([sig, sig], axis=1)
    if peak is not None:
        sig = sig * (peak / max(1e-9, np.abs(sig).max()))
    pcm = (np.clip(sig, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())


def lufs(path: Path) -> float:
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    ).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])


# --- music -------------------------------------------------------------------------------

PROGRESSIONS = {
    # each: four bars of (pad chord, bass root) as MIDI notes
    "curious": [([50, 57, 60, 64, 65], 38), ([46, 53, 57, 62, 65], 34), ([53, 57, 60, 64, 69], 41), ([48, 55, 62, 64, 67], 36)],
    "tense": [([50, 57, 62, 65], 38), ([48, 57, 62, 65], 36), ([46, 53, 57, 62], 34), ([45, 52, 57, 62], 33)],
    "resolve": [([53, 57, 60, 65, 69], 41), ([52, 55, 60, 64, 67], 40), ([50, 57, 60, 65], 38), ([46, 53, 58, 60, 65], 34)],
}
# scene -> (progression, pad, arp, bass, pulse, level relative to the bed)
MOODS = {
    "cold": ("curious", 1.0, 0.0, 0.5, 0.0, 1.0),
    "title": ("curious", 1.0, 1.0, 1.0, 0.0, 2.3),
    "why": ("curious", 1.0, 0.8, 0.8, 0.0, 1.0),
    "game": ("curious", 1.0, 1.0, 0.8, 0.0, 1.0),
    "easy": ("curious", 1.0, 0.6, 0.8, 0.0, 1.0),
    "hard": ("tense", 1.0, 0.0, 0.9, 1.0, 1.05),
    "final": ("tense", 1.0, 0.3, 0.9, 1.0, 1.05),
    "tags": ("tense", 1.0, 0.7, 0.8, 0.5, 1.0),
    "tagfake": ("tense", 1.0, 0.5, 0.8, 0.8, 1.0),
    "checker": ("resolve", 1.0, 1.0, 0.9, 0.0, 1.05),
    "twist": ("curious", 1.0, 0.8, 0.8, 0.0, 1.0),
    "ending": ("resolve", 1.0, 1.0, 1.0, 0.0, 1.15),
    "credits": ("resolve", 1.0, 1.0, 1.0, 0.0, 1.7),
}
PAD_TONE = [(1, 1.0), (2, 0.32), (3, 0.14), (4, 0.06)]
ARP_TONE = [(1, 1.0), (2, 0.22), (3, 0.06)]
BASS_TONE = [(1, 1.0), (2, 0.18)]


def scene_starts() -> tuple[list[tuple[str, float]], float]:
    scenes = json.loads((ROOT / "src/narration.json").read_text())
    timings = json.loads((ROOT / "src/timings.json").read_text())
    starts, clock = [], 0.0
    for scene in scenes:
        starts.append((scene["id"], clock))
        clock += math.ceil((timings[scene["id"]]["seconds"] + PAD) * FPS) / FPS
    return starts, clock


def music(starts: list[tuple[str, float]], total: float) -> np.ndarray:
    bar = 4 * 60 / BPM
    beat = bar / 4
    buf = np.zeros((int((total + 6) * SR), 2))

    def scene_at(t: float) -> str:
        return [sid for sid, start in starts if start <= t + 1e-6][-1]

    for b in range(int(math.ceil((total + 2) / bar))):
        t0 = b * bar
        prog, pad, arp, bass, pulse, _ = MOODS[scene_at(min(t0, total - 0.01))]
        chord, root = PROGRESSIONS[prog][b % 4]
        for k, note in enumerate(chord):
            n = int((bar + 1.1) * SR)
            for cents, pan in ((-5, -0.55), (5, 0.55)):
                add(buf, t0, osc(hz(note), n, PAD_TONE, cents) * swell(n, 1.0, 1.1), pan * (0.5 + 0.1 * k), 0.05 * pad)
        if arp:
            n = int(0.9 * SR)
            tt = np.arange(n) / SR
            pluck = np.exp(-tt / 0.2) * (1 - np.exp(-tt / 0.004))
            for i, idx in enumerate([0, 2, 1, 3, 2, 4, 3, 1]):
                sig = osc(hz(chord[idx % len(chord)] + 12), n, ARP_TONE) * pluck
                pan = 0.6 if i % 2 else -0.6
                add(buf, t0 + i * beat / 2, sig, pan, 0.06 * arp)
                add(buf, t0 + i * beat / 2 + 0.75 * beat, sig, -pan, 0.022 * arp)
                add(buf, t0 + i * beat / 2 + 1.5 * beat, sig, pan, 0.009 * arp)
        if bass:
            n = int(2.2 * beat * SR)
            tt = np.arange(n) / SR
            add(buf, t0, osc(hz(root), n, BASS_TONE) * np.exp(-tt / 0.9) * (1 - np.exp(-tt / 0.01)), 0.0, 0.16 * bass)
        if pulse:
            n = int(0.3 * SR)
            tt = np.arange(n) / SR
            for i in range(8):
                add(buf, t0 + i * beat / 2, osc(hz(root + 12), n, BASS_TONE) * np.exp(-tt / 0.09) * (1 - np.exp(-tt / 0.005)), 0.0, 0.07 * pulse)

    buf = reverb(buf)[: int((total + 2.5) * SR)]

    # Level the bed to BED_LUFS, then apply the per-scene automation.
    probe = OUT / ".music-probe.wav"
    write_wav(probe, buf, peak=0.5)
    scale = 0.5 / np.abs(buf).max() * 10 ** ((BED_LUFS - lufs(probe)) / 20)
    probe.unlink()
    points_t, points_g = [], []
    for (sid, start), nxt in zip(starts, [s for _, s in starts[1:]] + [total], strict=True):
        level = MOODS[sid][5]
        points_t += [start + 0.35, nxt - 0.35]
        points_g += [level, level]
    t = np.arange(len(buf)) / SR
    gain = np.interp(t, points_t, points_g)
    gain *= np.clip(t / 1.5, 0, 1) * np.clip((total + 2.0 - t) / 3.0, 0, 1)  # fade in and out
    return np.tanh(buf * scale * gain[:, None])


# --- sound effects -----------------------------------------------------------------------

def chirp(f0: float, f1: float, seconds: float, decay: float, glide: float = 0.05) -> np.ndarray:
    n = int(seconds * SR)
    t = np.arange(n) / SR
    f = f0 + (f1 - f0) * np.minimum(t / glide, 1)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay) * (1 - np.exp(-t / 0.002))


def bell(freq: float, seconds: float) -> np.ndarray:
    n = int(seconds * SR)
    t = np.arange(n) / SR
    partials = [(1, 1.0, 0.5), (2.76, 0.45, 0.28), (5.4, 0.22, 0.16), (8.93, 0.1, 0.09)]
    return sum(a * np.sin(2 * np.pi * freq * m * t) * np.exp(-t / d) for m, a, d in partials)


def sfx() -> dict[str, np.ndarray]:
    out: dict[str, np.ndarray] = {}
    out["pop"] = chirp(420, 900, 0.14, 0.035)
    out["plop"] = chirp(260, 130, 0.2, 0.06)
    out["flip"] = np.concatenate([chirp(660, 660, 0.07, 0.03), chirp(494, 494, 0.12, 0.05)])

    n = int(0.55 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    sweep = (t / t[-1])[:, None]
    whoosh = band(noise, 500, 0.9) * (1 - sweep[:, 0]) + band(noise, 2600, 0.9) * sweep[:, 0]
    out["whoosh"] = whoosh * np.sin(np.pi * t / t[-1]) ** 2

    out["ding"] = bell(1320, 1.3)
    out["chime"] = np.zeros(int(1.6 * SR))
    for i, note in enumerate([84, 88, 91, 96]):
        tone = bell(hz(note), 1.2)
        start = int(i * 0.07 * SR)
        out["chime"][start : start + len(tone)] += tone[: len(out["chime"]) - start] * 0.6

    n = int(0.3 * SR)
    t = np.arange(n) / SR
    thud = chirp(110, 48, 0.3, 0.08, glide=0.08)
    thud[: int(0.012 * SR)] += band(rng.standard_normal(int(0.012 * SR)), 1800, 1.2) * 0.6
    out["thud"] = thud

    n = int(0.8 * SR)
    t = np.arange(n) / SR
    out["wrong"] = (np.sin(2 * np.pi * 110 * t) + np.sin(2 * np.pi * 116.5 * t)) * np.exp(-t / 0.28) * (1 - np.exp(-t / 0.01))

    n = int(1.0 * SR)
    sweep_sig = np.zeros(n)
    tick_n = int(0.02 * SR)
    for i in range(30):
        start = int((i / 30) ** 0.8 * 0.9 * SR)
        tick = chirp(1400 + 60 * i, 1400 + 60 * i, 0.02, 0.006) * (0.4 + 0.6 * i / 30)
        sweep_sig[start : start + tick_n] += tick[: n - start]
    out["sweep"] = sweep_sig

    n = int(1.7 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    mix = (t / t[-1]) ** 1.5
    riser = band(noise, 400, 1.0) * (1 - mix) + band(noise, 4000, 1.0) * mix
    glide = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (2 * t / t[-1])) / SR) * 0.25
    out["riser"] = (riser / np.abs(riser).max() + glide) * (t / t[-1]) ** 2

    n = int(1.8 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t / 0.08)) / SR) * np.exp(-t / 0.5)
    boom[: int(0.2 * SR)] += band(rng.standard_normal(int(0.2 * SR)), 300, 1.2) * np.exp(-np.arange(int(0.2 * SR)) / SR / 0.05) * 0.5
    out["boom"] = boom
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    starts, total = scene_starts()
    write_wav(OUT / "music.wav", music(starts, total))
    for name, sig in sfx().items():
        write_wav(OUT / f"sfx-{name}.wav", sig, peak=0.6)
    print(f"music {total + 2.5:.1f}s at {lufs(OUT / 'music.wav'):.1f} LUFS; {len(sfx())} effects")


if __name__ == "__main__":
    main()
