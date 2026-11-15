import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { FPS, colors, display, font } from "./theme";
import { sceneWords, type Word } from "./timing";

/** Seconds since the start of the current scene. */
export const useT = (): number => useCurrentFrame() / useVideoConfig().fps;
export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

/** 0 before `at`, then springs to 1 (with a little overshoot when bouncy). */
export const pop = (t: number, at: number, bouncy = true): number =>
  t < at
    ? 0
    : spring({ frame: (t - at) * FPS, fps: FPS, config: bouncy ? { damping: 11, mass: 0.55, stiffness: 180 } : { damping: 200 } });

/** Eased 0..1 between two moments. */
export const ramp = (t: number, from: number, to: number): number =>
  interpolate(t, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

/** Moves the world so that point (x, y) sits at screen center, at the given zoom. */
export const Camera: React.FC<{ x?: number; y?: number; zoom?: number; opacity?: number; children: React.ReactNode }> = ({
  x = 960, y = 540, zoom = 1, opacity = 1, children,
}) => (
  <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${960 - x * zoom}px, ${540 - y * zoom}px) scale(${zoom})`, opacity }}>
    {children}
  </AbsoluteFill>
);

export const Sfx: React.FC<{ name: string; at: number; volume?: number }> = ({ name, at, volume = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at * FPS))} layout="none">
    <Audio src={staticFile(`audio/sfx-${name}.wav`)} volume={volume} />
  </Sequence>
);

/** Scene wrapper: eases the whole scene in and out so cuts feel like camera moves. */
export const Shell: React.FC<{ seconds: number; fadeIn?: boolean; fadeOut?: boolean; children: React.ReactNode }> = ({
  seconds, fadeIn = true, fadeOut = true, children,
}) => {
  const t = useT();
  const a = fadeIn ? ramp(t, 0, 0.4) : 1;
  const b = fadeOut ? 1 - ramp(t, seconds - 0.3, seconds) : 1;
  return (
    <AbsoluteFill style={{ opacity: a * b, transform: `scale(${lerp(1.035, 1, a) * lerp(0.98, 1, b)})`, color: colors.text, fontFamily: font }}>
      {children}
    </AbsoluteFill>
  );
};

/** Absolutely placed block that rises (and optionally scales) in with `show`. */
export const P: React.FC<{
  x: number; y: number; w?: number; show?: number; rise?: number; grow?: boolean; style?: React.CSSProperties; children?: React.ReactNode;
}> = ({ x, y, w, show = 1, rise = 26, grow = false, style, children }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, width: w, opacity: clamp01(show),
      transform: `translateY(${(1 - Math.min(1, show)) * rise}px)${grow ? ` scale(${0.6 + 0.4 * show})` : ""}`,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Small uppercase label that names the current chapter, top left. */
export const Chapter: React.FC<{ children: string; show?: number }> = ({ children, show = 1 }) => (
  <P x={90} y={64} show={show} rise={-14} style={{ fontFamily: display, fontSize: 26, letterSpacing: 5, textTransform: "uppercase", color: colors.muted }}>
    <span style={{ display: "inline-block", width: 34, height: 4, background: colors.flagship, marginRight: 16, verticalAlign: "middle" }} />
    {children}
  </P>
);

/** Big figure with a caption underneath. */
export const Stat: React.FC<{ x: number; y: number; show: number; value: React.ReactNode; label: string; color?: string; size?: number; w?: number }> = ({
  x, y, show, value, label, color = colors.text, size = 120, w = 520,
}) => (
  <P x={x} y={y} w={w} show={show} grow style={{ transformOrigin: "left center" }}>
    <div style={{ fontFamily: display, fontWeight: 700, fontSize: size, lineHeight: 1, color, letterSpacing: -2 }}>{value}</div>
    <div style={{ fontSize: 30, color: colors.muted, marginTop: 10 }}>{label}</div>
  </P>
);

const chunkWords = (words: Word[]): Word[][] => {
  const chunks: Word[][] = [];
  let current: Word[] = [];
  let length = 0;
  for (const word of words) {
    current.push(word);
    length += word.w.length + 1;
    const hardStop = /[.?!:]$/.test(word.w);
    const softStop = /,$/.test(word.w) && length > 24;
    if (hardStop || softStop || length > 40) {
      chunks.push(current);
      current = [];
      length = 0;
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
};

/** Captions that follow the voice word by word. */
export const Captions: React.FC<{ id: string }> = ({ id }) => {
  const t = useT();
  const chunks = React.useMemo(() => chunkWords(sceneWords(id)), [id]);
  const index = chunks.findIndex((chunk, i) => t < (chunks[i + 1]?.[0].s ?? chunk[chunk.length - 1].e + 0.6));
  const chunk = chunks[index];
  if (!chunk || t < chunk[0].s - 0.15 || t > chunk[chunk.length - 1].e + 0.6) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "rgba(6, 10, 22, 0.78)", borderRadius: 14, padding: "12px 26px", fontFamily: font, fontWeight: 600, fontSize: 36, lineHeight: 1.2 }}>
        {chunk.map((word, i) => (
          <span key={i} style={{ color: t >= word.s - 0.04 ? colors.text : "rgba(241,245,249,0.38)" }}>
            {word.w}{i < chunk.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};
