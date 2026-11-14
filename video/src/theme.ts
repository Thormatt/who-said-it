export const FPS = 30;
export const SCENE_PADDING_SECONDS = 0.9;

export const colors = {
  bg: "#0d1321",
  panel: "#16203a",
  text: "#f1f5f9",
  muted: "#94a3b8",
  truth: "#34c38f",
  error: "#f05252",
  flagship: "#f59e0b",
  tiny: "#60a5fa",
  anon: "#9aa5b8",
  grid: "#263451",
};

export const font = '"Helvetica Neue", Helvetica, Arial, sans-serif';
export const mono = 'Menlo, "SF Mono", Consolas, monospace';

export const pct = (value: number, digits = 0): string => `${(value * 100).toFixed(digits)}%`;
