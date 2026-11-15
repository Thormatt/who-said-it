import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadGrotesk } from "@remotion/google-fonts/SpaceGrotesk";

export const FPS = 30;
/** Seconds of air after each scene's narration. Keep in sync with scripts/sound.py. */
export const PAD = 0.55;

const fallback = '"Helvetica Neue", Helvetica, Arial, sans-serif';
export const font = `${loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily}, ${fallback}`;
export const display = `${loadGrotesk("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily}, ${fallback}`;
export const mono = `${loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily}, Menlo, monospace`;

export const colors = {
  bg: "#0a0f1e",
  panel: "#16203a",
  panel2: "#1e2b4d",
  text: "#f1f5f9",
  muted: "#94a3b8",
  truth: "#34c38f",
  error: "#f05252",
  flagship: "#f59e0b",
  tiny: "#60a5fa",
  anon: "#9aa5b8",
  grid: "#2a3a5c",
  deskTop: "#2c3d63",
  deskFront: "#1b2845",
  paper: "#f3efe4",
  ink: "#0b1426",
  plant: "#8793ab",
};

/** One color per real panelist, kept away from the red, green and amber that carry meaning. */
export const botColors = ["#7cc4f8", "#a995f5", "#5fd4c4", "#f3a6cf", "#8fa2f0"];
export const REAL_NAMES = ["Claude", "GPT", "Gemini", "Grok", "DeepSeek"];

export const teamLabel: Record<string, string> = {
  "frontier-2026-11": "Newest models",
  "frontier-2026-early": "Earlier models",
  small: "Small, cheap models",
};

export const pct = (value: number, digits = 0): string => `${(value * 100).toFixed(digits)}%`;
