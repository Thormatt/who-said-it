import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeUp, SceneFrame, progressAt, useEntrance } from "../components";
import data from "../data.json";
import { colors, font, mono } from "../theme";

export const TitleScene: React.FC = () => {
  const p = useEntrance(0.2, 14);
  return (
    <AbsoluteFill style={{ background: colors.bg, color: colors.text, fontFamily: font, justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontSize: 150, fontWeight: 800, transform: `scale(${0.85 + 0.15 * p})`, opacity: p }}>
        Who Said It?
      </div>
      <FadeUp delay={1.0}>
        <div style={{ fontSize: 46, color: colors.muted, marginTop: 20, textAlign: "center" }}>
          When AI panels deliberate, do they launder a confident error?
        </div>
      </FadeUp>
      <FadeUp delay={1.8}>
        <div style={{ fontSize: 30, color: colors.muted, marginTop: 60, letterSpacing: 2 }}>
          APART RESEARCH · AI × EPISTEMICS SPRINT · NOVEMBER 2026
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

const Agent: React.FC<{ x: number; y: number; color: string; label: string; value: string; show: number }> = ({
  x, y, color, label, value, show,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: 150, textAlign: "center", opacity: show, transform: `scale(${0.6 + 0.4 * show})` }}>
    <div style={{ width: 110, height: 110, margin: "0 auto", borderRadius: 55, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: colors.bg }}>
      {value}
    </div>
    <div style={{ fontSize: 22, color: colors.muted, marginTop: 10 }}>{label}</div>
  </div>
);

export const SetupScene: React.FC<{ seconds: number }> = ({ seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = (fraction: number, span = 0.08) => progressAt(frame, fps, seconds * fraction, seconds * (fraction + span));
  const realShow = (i: number) => at(0.22 + i * 0.03, 0.05);
  const confShow = (i: number) => at(0.48 + i * 0.04, 0.05);
  const round2 = at(0.72);
  const final = at(0.86);
  return (
    <SceneFrame kicker="The setup" heading="Plant a checkable error, then watch it travel">
      <div style={{ position: "absolute", left: 110, top: 20, width: 560, padding: 28, background: colors.panel, borderRadius: 14, fontFamily: mono, fontSize: 25, lineHeight: 1.7, opacity: at(0.02) }}>
        <div style={{ color: colors.muted, fontFamily: font, fontSize: 26, marginBottom: 8 }}>Fictional evidence packet</div>
        <div>E1 · Opened to traffic 1987</div>
        <div>E2 · Renovation approved 2019</div>
        <div style={{ color: colors.truth, fontWeight: 700 }}>E3 · Delayed by 14 months</div>
        <div>E4 · Budget 12 M euros</div>
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <Agent key={`r${i}`} x={790 + i * 172} y={10} color={colors.truth} label="real model" value="14 mo" show={realShow(i)} />
      ))}
      {[0, 1, 2].map((i) => (
        <Agent key={`c${i}`} x={876 + i * 172} y={240} color={colors.error} label="confederate" value="41 mo" show={confShow(i)} />
      ))}
      <div style={{ position: "absolute", left: 790, top: 470, fontSize: 34, opacity: round2 }}>
        <b>Round 2:</b> each panelist sees five peer answers and revises
      </div>
      <div style={{ position: "absolute", left: 790, top: 540, fontSize: 34, opacity: final, color: colors.muted }}>
        → a synthesizer writes the panel's final answer
      </div>
    </SceneFrame>
  );
};

export const PilotScene: React.FC<{ seconds: number }> = ({ seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = Math.round(interpolate(progressAt(frame, fps, seconds * 0.35, seconds * 0.7), [0, 1], [0, data.pilot.total]));
  return (
    <SceneFrame kicker="Pilot" heading="One wrong peer, evidence on the table">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <FadeUp delay={seconds * 0.3}>
          <div style={{ fontSize: 210, fontWeight: 800, color: colors.truth }}>
            {data.pilot.adopted}
            <span style={{ color: colors.muted, fontSize: 120 }}> / {count}</span>
          </div>
        </FadeUp>
        <FadeUp delay={seconds * 0.55}>
          <div style={{ fontSize: 40, color: colors.muted }}>answers adopted the planted error</div>
        </FadeUp>
      </AbsoluteFill>
    </SceneFrame>
  );
};
