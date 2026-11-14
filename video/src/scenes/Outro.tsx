import React from "react";
import { AbsoluteFill } from "remotion";
import { FadeUp, Legend, SceneFrame, VBar } from "../components";
import data from "../data.json";
import { colors, font, mono, pct } from "../theme";

export const VerificationScene: React.FC<{ seconds: number }> = ({ seconds }) => (
  <SceneFrame kicker="What stops it" heading="Put the evidence back in the loop">
    <div style={{ display: "flex", justifyContent: "center", gap: 120 }}>
      {data.verification.map((v, i) => {
        const checked = (v.PLAIN + v.ORC) / 2;
        return (
          <div key={v.panel} style={{ textAlign: "center" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
              <VBar value={v.NONE} max={0.35} height={300} color={colors.error} delay={seconds * 0.1 + i * 0.15} valueLabel={pct(v.NONE)} width={110} />
              <VBar value={checked} max={0.35} height={300} color={colors.truth} delay={seconds * 0.3 + i * 0.15} valueLabel={pct(checked, 1)} width={110} />
            </div>
            <div style={{ fontSize: 26, color: colors.muted, marginTop: 14, width: 320 }}>{v.label}</div>
          </div>
        );
      })}
    </div>
    <div style={{ marginTop: 20 }}>
      <Legend delay={seconds * 0.05} items={[["no check", colors.error], ["plain check or ORC", colors.truth]]} />
    </div>
    <FadeUp delay={seconds * 0.55} style={{ textAlign: "center", fontSize: 40, fontWeight: 700, marginTop: 26 }}>
      0 of {data.finals.checked_total} checked final answers kept the error
    </FadeUp>
    <FadeUp delay={seconds * 0.75} style={{ textAlign: "center", fontSize: 30, color: colors.muted, marginTop: 10 }}>
      ORC vs a plain prompted check: −0.2 points (p = 0.64)
    </FadeUp>
  </SceneFrame>
);

const FlagBox: React.FC<{ title: string; body: React.ReactNode; tone: string; delay: number }> = ({ title, body, tone, delay }) => (
  <FadeUp delay={delay} style={{ background: colors.panel, borderLeft: `8px solid ${tone}`, borderRadius: 10, padding: "22px 30px", width: 1500, margin: "0 auto" }}>
    <div style={{ fontSize: 26, color: colors.muted, marginBottom: 10, fontFamily: font }}>{title}</div>
    <div style={{ fontFamily: mono, fontSize: 28, lineHeight: 1.5 }}>{body}</div>
  </FadeUp>
);

export const FlagsScene: React.FC<{ seconds: number; followup: string | null }> = ({ seconds, followup }) => (
  <SceneFrame kicker="What still slips through" heading="Models misread the checker">
    <AbsoluteFill style={{ gap: 26, paddingTop: 10 }}>
      <FlagBox tone={colors.error} delay={seconds * 0.1} title="The checker's flag (original format)" body={<>CONTRADICTED by the evidence packet: <span style={{ color: colors.error }}>"The discontinuation rate … was 16%"</span></>} />
      <FlagBox tone={colors.flagship} delay={seconds * 0.3} title="What a panelist concluded" body={<>"…the evidence packet contains a direct statement that the rate was 16%" → adopts 16%</>} />
      <FlagBox tone={colors.truth} delay={seconds * 0.55} title="Evidence-stating flag (follow-up test)" body={<>CONTRADICTED. This answer says "…the discontinuation rate was 16%". The evidence packet (E3) says: <span style={{ color: colors.truth }}>"In the senotrazide arm, 54 participants discontinued the study drug before day 3."</span></>} />
      {followup ? (
        <FadeUp delay={seconds * 0.75} style={{ textAlign: "center", fontSize: 32, marginTop: 6 }}>{followup}</FadeUp>
      ) : null}
    </AbsoluteFill>
  </SceneFrame>
);

export const TakeawaysScene: React.FC<{ seconds: number }> = ({ seconds }) => (
  <SceneFrame kicker="Takeaways" heading="For builders of multi-agent systems">
    <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 200, gap: 50, paddingBottom: 60 }}>
      {[
        ["1", "Keep evidence in the loop", "a check that sees the sources removed the error from every final answer"],
        ["2", "Treat claimed identities as untrusted", "names shifted trust, most for small models"],
        ["3", "Design what the verifier says", "flags should state the evidence, not just quote the wrong claim"],
      ].map(([n, head, sub], i) => (
        <FadeUp key={n} delay={seconds * (0.15 + i * 0.25)} style={{ display: "flex", gap: 34, alignItems: "baseline" }}>
          <div style={{ fontSize: 80, fontWeight: 800, color: colors.truth, width: 70 }}>{n}</div>
          <div>
            <div style={{ fontSize: 52, fontWeight: 700 }}>{head}</div>
            <div style={{ fontSize: 32, color: colors.muted, marginTop: 6 }}>{sub}</div>
          </div>
        </FadeUp>
      ))}
    </AbsoluteFill>
  </SceneFrame>
);

export const CreditsScene: React.FC = () => (
  <AbsoluteFill style={{ background: colors.bg, color: colors.text, fontFamily: font, justifyContent: "center", alignItems: "center", gap: 26 }}>
    <FadeUp><div style={{ fontSize: 90, fontWeight: 800 }}>Who Said It?</div></FadeUp>
    <FadeUp delay={0.4}><div style={{ fontSize: 38, color: colors.muted }}>Thor Matthiasson · with Apart Research</div></FadeUp>
    <FadeUp delay={0.8}><div style={{ fontSize: 30, color: colors.muted }}>24 held-out items · 3 panels · 7,352 round-2 answers · pre-registered</div></FadeUp>
    <FadeUp delay={1.2}><div style={{ fontSize: 24, color: colors.muted }}>Narration: synthetic voice. Full report, code and data accompany this video.</div></FadeUp>
  </AbsoluteFill>
);
