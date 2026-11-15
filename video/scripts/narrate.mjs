// Render each scene's narration with ElevenLabs TTS, convert to 48 kHz WAV and
// record durations for the composition.
// Usage: ELEVENLABS_API_KEY=… [VOICE_ID=…] [PREVIEW=1] node scripts/narrate.mjs
// Clips are cached by sha256(model, voice, settings, text), so re-runs only bill changed lines.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");

// Same voice and model as the Presenter project (packages/compiler/src/tts.ts).
const voiceId = process.env.VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
const modelId = "eleven_multilingual_v2";
const voiceSettings = { stability: 0.5, similarity_boost: 0.75, style: 0.2 };

const audioDir = join(root, "public/audio");
const cacheDir = join(audioDir, ".cache");
mkdirSync(cacheDir, { recursive: true });

const scenes = JSON.parse(readFileSync(join(root, "src/narration.json"), "utf8"));
const preview = process.env.PREVIEW === "1";

async function synthesize(text) {
  const key = createHash("sha256")
    .update(JSON.stringify([modelId, voiceId, voiceSettings, text]))
    .digest("hex");
  const cached = join(cacheDir, `${key}.mp3`);
  if (existsSync(cached)) return { path: cached, billed: 0 };
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: modelId, voice_settings: voiceSettings }),
  });
  if (!response.ok) {
    throw new Error(`ElevenLabs ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  writeFileSync(cached, Buffer.from(await response.arrayBuffer()));
  return { path: cached, billed: text.length };
}

const durations = {};
let billed = 0;
for (const { id, text: raw } of scenes) {
  // PREVIEW=1 drops unfilled follow-up sentences so layout can be checked early.
  const text = preview ? raw.replace(/\s*FOLLOWUP_\w+/g, "") : raw;
  if (text.includes("FOLLOWUP_")) {
    throw new Error(`scene ${id} still has a FOLLOWUP placeholder; fill it from the results first`);
  }
  const clip = await synthesize(text);
  billed += clip.billed;
  const wav = join(audioDir, `${id}.wav`);
  // ElevenLabs output lands near -25 LUFS; normalize to the usual -16 LUFS for spoken web video.
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", clip.path,
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "2", wav]);
  const seconds = Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", wav]).toString().trim(),
  );
  durations[id] = Math.round(seconds * 100) / 100;
  console.log(`${id.padEnd(14)} ${durations[id].toFixed(2)}s${clip.billed ? "" : " (cached)"}`);
}
writeFileSync(join(root, "src/durations.json"), JSON.stringify(durations, null, 2) + "\n");
const total = Object.values(durations).reduce((a, b) => a + b, 0);
console.log(`total narration ${total.toFixed(1)}s · ElevenLabs voice ${voiceId} · ${billed} characters billed`);
