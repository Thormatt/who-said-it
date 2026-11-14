// Render each scene's narration with macOS `say` (local, no external service),
// convert to WAV and record durations for the composition.
// Usage: VOICE="Samantha" RATE=172 node scripts/narrate.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const voice = process.env.VOICE ?? "Samantha";
const rate = process.env.RATE ?? "172";
const scenes = JSON.parse(readFileSync(join(root, "src/narration.json"), "utf8"));

const durations = {};
const preview = process.env.PREVIEW === "1";
for (const { id, text: raw } of scenes) {
  // PREVIEW=1 drops unfilled follow-up sentences so layout can be checked early.
  const text = preview ? raw.replace(/\s*FOLLOWUP_\w+/g, "") : raw;
  if (text.includes("FOLLOWUP_")) {
    throw new Error(`scene ${id} still has a FOLLOWUP placeholder; fill it from the results first`);
  }
  const aiff = join(root, "public/audio", `${id}.aiff`);
  const wav = join(root, "public/audio", `${id}.wav`);
  execFileSync("say", ["-v", voice, "-r", rate, "-o", aiff, text]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", aiff, "-ar", "48000", wav]);
  const seconds = Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", wav]).toString().trim(),
  );
  durations[id] = Math.round(seconds * 100) / 100;
  console.log(`${id.padEnd(14)} ${durations[id].toFixed(2)}s`);
}
writeFileSync(join(root, "src/durations.json"), JSON.stringify(durations, null, 2) + "\n");
const total = Object.values(durations).reduce((a, b) => a + b, 0);
console.log(`total narration ${total.toFixed(1)}s with voice ${voice}`);
