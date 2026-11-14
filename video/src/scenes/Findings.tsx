import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { FadeUp, HBar, Legend, SceneFrame, VBar, progressAt } from "../components";
import data from "../data.json";
import { colors, pct } from "../theme";

const Cell: React.FC<{ value: number; reveal: number; highlight: boolean }> = ({ value, reveal, highlight }) => {
  const fill = interpolateColors(Math.min(1, value / 0.3), [0, 1], [colors.panel, colors.error]);
  return (
    <div style={{ width: 170, height: 130, background: reveal > 0 ? fill : colors.panel, border: `2px solid ${highlight ? colors.error : colors.grid}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, opacity: 0.25 + 0.75 * reveal }}>
      {reveal > 0.5 ? pct(value) : ""}
    </div>
  );
};

export const PressureScene: React.FC<{ seconds: number }> = ({ seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const safe = progressAt(frame, fps, seconds * 0.15, seconds * 0.4);
  const corner = progressAt(frame, fps, seconds * 0.62, seconds * 0.75);
  return (
    <SceneFrame kicker="Adding pressure" heading="Only one corner breaks">
      <div style={{ display: "flex", justifyContent: "center", gap: 70, marginTop: 30 }}>
        {data.regimes.map((r, i) => (
          <div key={r.panel} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, color: colors.muted, marginBottom: 16, height: 70, width: 360 }}>{r.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "170px 170px", gap: 12, justifyContent: "center" }}>
              <Cell value={r.ev1} reveal={safe} highlight={false} />
              <Cell value={r.ev3} reveal={safe} highlight={false} />
              <Cell value={r.noev1} reveal={safe} highlight={false} />
              <Cell value={r.noev3} reveal={corner} highlight={corner > 0} />
            </div>
            {i === 0 ? null : null}
          </div>
        ))}
      </div>
      <FadeUp delay={seconds * 0.1} style={{ display: "flex", justifyContent: "center", gap: 120, marginTop: 34, fontSize: 28, color: colors.muted }}>
        <span>columns: 1 vs 3 of 5 peers wrong</span>
        <span>rows: evidence shown vs withheld</span>
      </FadeUp>
    </SceneFrame>
  );
};

export const GenerationScene: React.FC<{ seconds: number }> = ({ seconds }) => (
  <SceneFrame kicker="Who resists" heading="Better models resist more — not completely">
    <AbsoluteFill style={{ justifyContent: "flex-start", paddingTop: 70, paddingLeft: 60, gap: 40 }}>
      {data.generation.map((g, i) => (
        <HBar key={g.panel} value={g.rate} max={0.16} width={900} color={[colors.truth, colors.flagship, colors.error][i]} delay={seconds * (0.2 + i * 0.18)} label={g.label} valueLabel={pct(g.rate, 1)} height={90} />
      ))}
      <FadeUp delay={seconds * 0.8} style={{ fontSize: 28, color: colors.muted, paddingLeft: 544 }}>
        share of round-2 answers adopting the error, pooled over all conditions
      </FadeUp>
    </AbsoluteFill>
  </SceneFrame>
);

export const AttributionScene: React.FC<{ seconds: number; followup: string | null }> = ({ seconds, followup }) => (
  <SceneFrame kicker="Who said it" heading="Labels move answers — depending on the panel">
    <div style={{ display: "flex", justifyContent: "center", gap: 110, marginTop: 10 }}>
      {data.attribution.map((a, i) => (
        <div key={a.panel} style={{ textAlign: "center" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
            <VBar value={a.ANON} max={0.45} height={330} color={colors.anon} delay={seconds * 0.15 + i * 0.2} valueLabel={pct(a.ANON)} />
            <VBar value={a["NAMED-HIGH"]} max={0.45} height={330} color={colors.flagship} delay={seconds * 0.35 + i * 0.2} valueLabel={pct(a["NAMED-HIGH"])} />
            <VBar value={a["NAMED-LOW"]} max={0.45} height={330} color={colors.tiny} delay={seconds * 0.25 + i * 0.2} valueLabel={pct(a["NAMED-LOW"])} />
          </div>
          <div style={{ fontSize: 26, color: colors.muted, marginTop: 14, width: 320 }}>{a.label}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 26 }}>
      <Legend delay={seconds * 0.1} items={[["anonymous", colors.anon], ["wrong peers labeled flagship", colors.flagship], ["wrong peers labeled tiny", colors.tiny]]} />
    </div>
    {followup ? (
      <FadeUp delay={seconds * 0.7} style={{ textAlign: "center", fontSize: 30, marginTop: 24, color: colors.text }}>
        {followup}
      </FadeUp>
    ) : null}
  </SceneFrame>
);
