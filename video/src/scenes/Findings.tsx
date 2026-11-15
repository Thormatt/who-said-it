import React from "react";
import { AnswerCard, FadeUp, HBar, Legend, SceneFrame, VBar, useCue } from "../components";
import data from "../data.json";
import { colors, pct, teamLabel } from "../theme";

const Condition: React.FC<{ show: number; children: React.ReactNode }> = ({ show, children }) => (
  <div style={{ padding: "14px 22px", borderRadius: 12, border: `2px solid ${colors.error}`, fontSize: 30, opacity: show, transform: `translateY(${(1 - show) * 20}px)` }}>
    {children}
  </div>
);

export const PressureScene: React.FC<{ seconds: number }> = ({ seconds }) => {
  const cue = useCue(seconds);
  return (
    <SceneFrame kicker="Turning up the pressure" heading="Take the document away, add more wrong voices">
      <div style={{ display: "flex", gap: 24, paddingLeft: 110 }}>
        <Condition show={cue(0.08)}>Round two: document removed</Condition>
        <Condition show={cue(0.2)}>3 of the 5 answers each model sees are wrong</Condition>
      </div>
      <FadeUp delay={seconds * 0.32} style={{ paddingLeft: 654, marginTop: 40, fontSize: 26, color: colors.muted }}>
        answers that switched to the wrong number
      </FadeUp>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 14, paddingLeft: 110 }}>
        {data.regimes.map((r, i) => (
          <HBar key={r.panel} value={r.noev3} max={0.32} width={900} color={colors.error} delay={seconds * [0.34, 0.47, 0.54][i]} label={teamLabel[r.panel]} valueLabel={pct(r.noev3)} height={84} />
        ))}
      </div>
      <FadeUp delay={seconds * 0.66} style={{ paddingLeft: 654, marginTop: 30, fontSize: 30 }}>
        Final team answers carrying 41 months: <b style={{ color: colors.error }}>{data.verification.map((v) => pct(v.final_none)).join(" · ")}</b>
      </FadeUp>
      <FadeUp delay={seconds * 0.82} style={{ paddingLeft: 654, marginTop: 16, fontSize: 30 }}>
        Document in view, or only one wrong teammate: <b style={{ color: colors.truth }}>{data.boundary.adopted} of {data.boundary.total.toLocaleString("en-US")}</b> answers switched
      </FadeUp>
    </SceneFrame>
  );
};

const TAGS = [
  { tag: "Another panelist", color: colors.anon, note: "no name", at: 0.2 },
  { tag: "GPT-6.1 Sol Pro (OpenAI's flagship model)", color: colors.flagship, note: "tagged as a flagship", at: 0.48 },
  { tag: "Qwen2.5 0.5B (a 0.5-billion-parameter model)", color: colors.tiny, note: "tagged as a tiny model", at: 0.7 },
];

export const NameTagScene: React.FC<{ seconds: number }> = ({ seconds }) => {
  const cue = useCue(seconds);
  return (
    <SceneFrame kicker="Who said it?" heading="Same wrong answer, different name tag">
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 50 }}>
        {TAGS.map((t) => (
          <div key={t.tag} style={{ textAlign: "center" }}>
            <div style={{ textAlign: "left" }}>
              <AnswerCard tag={t.tag} tagColor={t.color} width={550} show={cue(t.at)} large>
                The renovation was delayed by <b style={{ color: colors.error, whiteSpace: "nowrap" }}>41 months</b>.
              </AnswerCard>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: t.color, marginTop: 22, opacity: cue(t.at + 0.04) }}>{t.note}</div>
          </div>
        ))}
      </div>
      <FadeUp delay={seconds * 0.86} style={{ textAlign: "center", fontSize: 40, marginTop: 70 }}>
        The words are identical. Only the claimed author changes.
      </FadeUp>
      <FadeUp delay={seconds * 0.88} style={{ textAlign: "center", fontSize: 24, color: colors.muted, marginTop: 14 }}>
        simplified; the real answers were longer and gave reasons
      </FadeUp>
    </SceneFrame>
  );
};

export const TagResultsScene: React.FC<{ seconds: number }> = ({ seconds }) => {
  const cue = useCue(seconds);
  return (
    <SceneFrame kicker="Who said it?" heading="The name tag changed what models believed">
      <FadeUp delay={seconds * 0.03} style={{ textAlign: "center", fontSize: 26, color: colors.muted, marginBottom: 6 }}>
        answers that switched to the wrong number
      </FadeUp>
      <div style={{ display: "flex", justifyContent: "center", gap: 90 }}>
        {data.attribution.map((a, i) => {
          const focus = a.panel === "small" ? cue(0.34) : 0;
          return (
            <div key={a.panel} style={{ textAlign: "center", padding: "6px 18px 10px", borderRadius: 14, border: `3px solid rgba(245,158,11,${focus})` }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
                <VBar value={a.ANON} max={0.45} height={300} color={colors.anon} delay={seconds * 0.01 + i * 0.12} valueLabel={pct(a.ANON)} />
                <VBar value={a["NAMED-HIGH"]} max={0.45} height={300} color={colors.flagship} delay={seconds * 0.31 + i * 0.12} valueLabel={pct(a["NAMED-HIGH"])} />
                <VBar value={a["NAMED-LOW"]} max={0.45} height={300} color={colors.tiny} delay={seconds * 0.05 + i * 0.12} valueLabel={pct(a["NAMED-LOW"])} />
              </div>
              <div style={{ fontSize: 28, color: colors.muted, marginTop: 12 }}>{teamLabel[a.panel]}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 24 }}>
        <Legend delay={seconds * 0.02} items={[["no names", colors.anon], ["wrong answers tagged flagship", colors.flagship], ["wrong answers tagged tiny", colors.tiny]]} />
      </div>
      <FadeUp delay={seconds * 0.76} style={{ textAlign: "center", fontSize: 36, fontWeight: 700, marginTop: 34 }}>
        The labels were fake. Any agent can claim to be anyone.
      </FadeUp>
    </SceneFrame>
  );
};
