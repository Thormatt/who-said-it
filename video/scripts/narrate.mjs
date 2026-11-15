// Render each scene's narration with ElevenLabs TTS (with character timestamps), convert it
// to 48 kHz WAV, and write src/timings.json: per-scene length plus the start and end of
// every spoken word. The scenes time their animation against those words.
// Usage: ELEVENLABS_API_KEY=… [VOICE_ID=…] node scripts/narrate.mjs
// Responses are cached by sha256(model, voice, settings, text), so re-runs only bill changed lines.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");

// George (warm British narrator); override with VOICE_ID.
const voiceId = process.env.VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";
const modelId = "eleven_multilingual_v2";
const voiceSettings = { stability: 0.45, similarity_boost: 0.8, style: 0.3 };

const audioDir = join(root, "public/audio");
const cacheDir = join(audioDir, ".cache");
mkdirSync(cacheDir, { recursive: true });

const scenes = JSON.parse(readFileSync(join(root, "src/narration.json"), "utf8"));

async function synthesize(text) {
  const key = createHash("sha256")
    .update(JSON.stringify([modelId, voiceId, voiceSettings, text, "timestamps"]))
    .digest("hex");
  const cached = join(cacheDir, `${key}.json`);
  if (existsSync(cached)) return { ...JSON.parse(readFileSync(cached, "utf8")), key, billed: 0 };
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: modelId, voice_settings: voiceSettings }),
    },
  );
  if (!response.ok) {
    throw new Error(`ElevenLabs ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const { audio_base64, alignment } = await response.json();
  writeFileSync(cached, JSON.stringify({ audio_base64, alignment }));
  return { audio_base64, alignment, key, billed: text.length };
}

/** Group the character alignment into words with start and end times. */
function toWords(alignment) {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment;
  const words = [];
  let current = null;
  characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      current = null;
      return;
    }
    if (!current) {
      current = { w: "", s: starts[i], e: ends[i] };
      words.push(current);
    }
    current.w += ch;
    current.e = ends[i];
  });
  return words.map(({ w, s, e }) => ({ w, s: Math.round(s * 1000) / 1000, e: Math.round(e * 1000) / 1000 }));
}

const timings = {};
let billed = 0;
for (const { id, text, seconds: fixedSeconds } of scenes) {
  if (text == null) {
    timings[id] = { seconds: fixedSeconds, words: [] };
    console.log(`${id.padEnd(10)} ${fixedSeconds.toFixed(2)}s (silent)`);
    continue;
  }
  const clip = await synthesize(text);
  billed += clip.billed;
  const mp3 = join(cacheDir, `${clip.key}.mp3`);
  writeFileSync(mp3, Buffer.from(clip.audio_base64, "base64"));
  const wav = join(audioDir, `${id}.wav`);
  // ElevenLabs output lands near -25 LUFS; normalize to the usual -16 LUFS for spoken web video.
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp3,
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "2", wav]);
  const seconds = Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", wav]).toString().trim(),
  );
  timings[id] = { seconds: Math.round(seconds * 100) / 100, words: toWords(clip.alignment) };
  console.log(`${id.padEnd(10)} ${seconds.toFixed(2)}s  ${timings[id].words.length} words${clip.billed ? "" : " (cached)"}`);
}
writeFileSync(join(root, "src/timings.json"), JSON.stringify(timings) + "\n");
const total = Object.values(timings).reduce((sum, t) => sum + t.seconds, 0);
console.log(`total ${total.toFixed(1)}s · ElevenLabs voice ${voiceId} · ${billed} characters billed`);
