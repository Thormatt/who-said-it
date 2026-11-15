import React from "react";
import { random } from "remotion";
import { clamp01 } from "./kit";
import { colors, display } from "./theme";

/**
 * One dot per answer. Dots sweep in with `show`; `bad * badShow` of them turn red, picked
 * in a fixed pseudo-random order so the same answers stay red while the count animates.
 */
export const DotGrid: React.FC<{
  x: number; y: number; n: number; bad: number; cols: number; size: number; gap: number; show: number; badShow?: number; seed: string; ring?: number;
}> = ({ x, y, n, bad, cols, size, gap, show, badShow = 1, seed, ring = 0 }) => {
  const rank = React.useMemo(() => {
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => random(`${seed}-${a}`) - random(`${seed}-${b}`));
    const ranks = new Array<number>(n);
    order.forEach((index, position) => {
      ranks[index] = position;
    });
    return ranks;
  }, [n, seed]);
  if (show <= 0) return null;
  const visible = show * n;
  const badCount = bad * badShow;
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap }}>
      {rank.map((r, i) => {
        const isBad = r < badCount;
        return (
          <div
            key={i}
            style={{
              width: size, height: size, borderRadius: size / 2, background: isBad ? colors.error : colors.truth,
              opacity: clamp01(visible - i) * (isBad ? 1 : 0.5), transform: isBad ? `scale(${1.25 + 0.7 * ring})` : undefined,
              boxShadow: isBad && ring > 0 ? `0 0 0 ${7 * ring}px rgba(240,82,82,0.35), 0 0 0 ${16 * ring}px rgba(240,82,82,0.15)` : undefined,
            }}
          />
        );
      })}
    </div>
  );
};

/** Vertical bar growing from a baseline, with its value on top. */
export const Bar: React.FC<{ x: number; baseline: number; w: number; h: number; grow: number; color: string; label: string }> = ({
  x, baseline, w, h, grow, color, label,
}) => {
  const height = Math.max(4, h * clamp01(grow));
  return (
    <>
      <div style={{ position: "absolute", left: x, top: baseline - height, width: w, height, borderRadius: "8px 8px 0 0", background: color }} />
      <div style={{ position: "absolute", left: x - 30, top: baseline - height - 42, width: w + 60, textAlign: "center", fontFamily: display, fontWeight: 700, fontSize: 30, opacity: clamp01(grow * 2) }}>
        {label}
      </div>
    </>
  );
};
