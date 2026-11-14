import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { colors, font } from "./theme";

/** Spring-in progress (0..1) starting `delaySeconds` into the current sequence. */
export const useEntrance = (delaySeconds = 0, damping = 200): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame, fps, delay: Math.round(delaySeconds * fps), config: { damping } });
};

export const FadeUp: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const p = useEntrance(delay);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)`, ...style }}>
      {children}
    </div>
  );
};

export const SceneFrame: React.FC<{
  heading?: string;
  kicker?: string;
  children: React.ReactNode;
}> = ({ heading, kicker, children }) => (
  <AbsoluteFill style={{ background: colors.bg, color: colors.text, fontFamily: font }}>
    {heading ? (
      <div style={{ position: "absolute", top: 70, left: 110, right: 110 }}>
        {kicker ? (
          <FadeUp>
            <div style={{ color: colors.muted, fontSize: 30, letterSpacing: 3, textTransform: "uppercase" }}>
              {kicker}
            </div>
          </FadeUp>
        ) : null}
        <FadeUp delay={0.15}>
          <div style={{ fontSize: 64, fontWeight: 700, marginTop: 8 }}>{heading}</div>
        </FadeUp>
      </div>
    ) : null}
    <AbsoluteFill style={{ top: heading ? 230 : 0, bottom: 150 }}>{children}</AbsoluteFill>
  </AbsoluteFill>
);

/** Sentence-level captions, timed in proportion to sentence length. */
export const Captions: React.FC<{ text: string; seconds: number }> = ({ text, seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sentences = text.match(/[^.?!]+[.?!]+/g)?.map((s) => s.trim()) ?? [text];
  const total = sentences.reduce((n, s) => n + s.length, 0);
  const t = frame / fps / seconds;
  let acc = 0;
  let current = sentences[sentences.length - 1];
  for (const s of sentences) {
    acc += s.length / total;
    if (t <= acc) {
      current = s;
      break;
    }
  }
  return (
    <div
      style={{
        position: "absolute",
        bottom: 50,
        left: 160,
        right: 160,
        textAlign: "center",
        fontSize: 34,
        lineHeight: 1.35,
        color: colors.text,
        fontFamily: font,
        textShadow: "0 2px 8px rgba(0,0,0,0.6)",
      }}
    >
      {current}
    </div>
  );
};

export const Narration: React.FC<{ id: string }> = ({ id }) => (
  <Audio src={staticFile(`audio/${id}.wav`)} />
);

/** Horizontal bar that grows to `value / max` of `width` after `delay` seconds. */
export const HBar: React.FC<{
  value: number;
  max: number;
  width: number;
  color: string;
  delay?: number;
  label: string;
  valueLabel: string;
  height?: number;
}> = ({ value, max, width, color, delay = 0, label, valueLabel, height = 54 }) => {
  const p = useEntrance(delay);
  const w = Math.max(4, (value / max) * width * p);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, height }}>
      <div style={{ width: 520, textAlign: "right", fontSize: 32, color: colors.muted }}>{label}</div>
      <div style={{ width: w, height: height - 14, background: color, borderRadius: 6 }} />
      <div style={{ fontSize: 34, fontWeight: 700, opacity: p }}>{valueLabel}</div>
    </div>
  );
};

/** Vertical bar for grouped charts; grows from the baseline. */
export const VBar: React.FC<{
  value: number;
  max: number;
  height: number;
  color: string;
  delay?: number;
  valueLabel: string;
  width?: number;
}> = ({ value, max, height, color, delay = 0, valueLabel, width = 90 }) => {
  const p = useEntrance(delay);
  const h = Math.max(3, (value / max) * height * p);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: height + 50 }}>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, opacity: p }}>{valueLabel}</div>
      <div style={{ width, height: h, background: color, borderRadius: "6px 6px 0 0" }} />
    </div>
  );
};

export const Legend: React.FC<{ items: [string, string][]; delay?: number }> = ({ items, delay = 0 }) => (
  <FadeUp delay={delay} style={{ display: "flex", gap: 48, justifyContent: "center", fontSize: 30 }}>
    {items.map(([label, color]) => (
      <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 26, height: 26, background: color, borderRadius: 4 }} />
        <span style={{ color: colors.muted }}>{label}</span>
      </div>
    ))}
  </FadeUp>
);

export const progressAt = (frame: number, fps: number, startSec: number, endSec: number): number =>
  interpolate(frame, [startSec * fps, endSec * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
