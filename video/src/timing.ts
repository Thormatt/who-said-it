import narration from "./narration.json";
import { FPS, PAD } from "./theme";
import timings from "./timings.json";

export type Word = { w: string; s: number; e: number };
type SceneTiming = { seconds: number; words: Word[] };

const TIMINGS = timings as Record<string, SceneTiming>;
export const scenes = narration as { id: string; text: string | null }[];

const normalize = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, "");

export const sceneWords = (id: string): Word[] => TIMINGS[id].words;
export const sceneSeconds = (id: string): number => TIMINGS[id].seconds + PAD;
export const sceneFrames = (id: string): number => Math.ceil(sceneSeconds(id) * FPS);
export const totalFrames = (): number => scenes.reduce((sum, s) => sum + sceneFrames(s.id), 0);

/**
 * Returns a lookup for one scene: the second at which a phrase of the narration starts.
 * Animations hang off these, so they stay in step with the voice when the script changes,
 * and a phrase that no longer exists fails the render instead of drifting silently.
 */
export const cueOf = (id: string) => {
  const words = TIMINGS[id].words;
  return (phrase: string, nth = 0): number => {
    const target = phrase.split(/\s+/).map(normalize).filter(Boolean);
    let seen = 0;
    for (let i = 0; i + target.length <= words.length; i++) {
      if (target.every((word, j) => normalize(words[i + j].w) === word)) {
        if (seen === nth) return words[i].s;
        seen++;
      }
    }
    throw new Error(`cue not found in scene "${id}": "${phrase}" (occurrence ${nth})`);
  };
};
