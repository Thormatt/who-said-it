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

/** Plain-language team names for viewers who have not read the paper. */
export const teamLabel: Record<string, string> = {
  "frontier-2026-11": "Newest models (Nov 2026)",
  "frontier-2026-early": "Previous generation",
  small: "Small, cheap models",
};
