import React from "react";
import { AbsoluteFill } from "remotion";
import { AnswerCard, FadeUp, Legend, SceneFrame, VBar, useCue } from "../components";
import data from "../data.json";
import { colors, font, mono, pct, teamLabel } from "../theme";

export const CheckerScene: React.FC<{ seconds: number }> = ({ seconds }) => {
  const cue = useCue(seconds);
  return (
    <SceneFrame kicker="What stops it" heading="Add a fact-checker">
      <div style={{ position: "absolute", left: 110, top: 20 }}>
        <AnswerCard
          tag="Another panelist"
          tagColor={colors.anon}
          width={620}
          show={cue(0.08)}
          warningShow={cue(0.24)}
          warning={<><b>Automated check:</b> CONTRADICTED by the document: "The renovation was delayed by 41 months."</>}
        >
          The renovation was delayed by <b style={{ color: colors.error, whiteSpace: "nowrap" }}>41 months</b>.
        </AnswerCard>
        <div style={{ fontSize: 26, color: colors.muted, marginTop: 14, width: 620, opacity: cue(0.26) }}>
          The checker reads the document, even when the models can't.
        </div>
      </div>
      <div style={{ position: "absolute", left: 830, top: 0, width: 990 }}>
        <FadeUp delay={seconds * 0.36} style={{ textAlign: "center", fontSize: 24, color: colors.muted }}>
          answers that switched to the wrong number
        </FadeUp>
        <div style={{ display: "flex", justifyContent: "center", gap: 50 }}>
          {data.verification.map((v, i) => {
            const checked = (v.PLAIN + v.ORC) / 2;
            return (
              <div key={v.panel} style={{ textAlign: "center", width: 280 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-end", justifyContent: "center" }}>
                  <VBar value={v.NONE} max={0.35} height={260} color={colors.error} delay={seconds * 0.38 + i * 0.12} valueLabel={pct(v.NONE)} width={96} />
                  <VBar value={checked} max={0.35} height={260} color={colors.truth} delay={seconds * 0.46 + i * 0.12} valueLabel={pct(checked, 1)} width={96} />
                </div>
                <div style={{ fontSize: 24, color: colors.muted, marginTop: 10 }}>{teamLabel[v.panel]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 18 }}>
          <Legend delay={seconds * 0.38} items={[["no checker", colors.error], ["with a checker", colors.truth]]} />
        </div>
      </div>
      <FadeUp delay={seconds * 0.55} style={{ position: "absolute", top: 480, left: 0, right: 0, textAlign: "center", fontSize: 40, fontWeight: 700 }}>
        0 of {data.finals.checked_total} final team answers contained the error
      </FadeUp>
      <FadeUp delay={seconds * 0.7} style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", fontSize: 30, color: colors.muted }}>
        Our purpose-built checker (ORC) did no better than a model simply asked to check
      </FadeUp>
    </SceneFrame>
  );
};

const WarningBox: React.FC<{ title: string; body: React.ReactNode; tone: string; show: number }> = ({ title, body, tone, show }) => (
  <div style={{ background: colors.panel, borderLeft: `8px solid ${tone}`, borderRadius: 10, padding: "18px 28px", width: 1560, margin: "0 auto", opacity: show, transform: `translateY(${(1 - show) * 24}px)` }}>
    <div style={{ fontSize: 24, color: colors.muted, marginBottom: 8, fontFamily: font }}>{title}</div>
    <div style={{ fontSize: 28, lineHeight: 1.45 }}>{body}</div>
  </div>
);

export const WarningsScene: React.FC<{ seconds: number }> = ({ seconds }) => {
  const cue = useCue(seconds);
  const small = data.verification.find((v) => v.panel === "small");
  const before = small ? (small.PLAIN + small.ORC) / 2 : 0;
  return (
    <SceneFrame kicker="What still slipped through" heading="Some models misread the warning">
      <AbsoluteFill style={{ gap: 20, paddingTop: 4 }}>
        <WarningBox show={cue(0.2)} tone={colors.error} title="The original warning quotes the wrong claim"
          body={<span style={{ fontFamily: mono, fontSize: 26 }}>CONTRADICTED by the evidence packet: <span style={{ color: colors.error }}>"The renovation was delayed by 41 months."</span></span>} />
        <WarningBox show={cue(0.36)} tone={colors.flagship} title="How some models read it"
          body={<>"The evidence packet says the renovation was delayed by 41 months" → <b style={{ color: colors.error }}>switches to 41</b></>} />
        <WarningBox show={cue(0.55)} tone={colors.truth} title="The rewritten warning states what the document says"
          body={<span style={{ fontFamily: mono, fontSize: 26 }}>CONTRADICTED. This answer says: "…41 months". The evidence packet (E3) says: <span style={{ color: colors.truth }}>"Renovation delayed by 14 months."</span></span>} />
        <FadeUp delay={seconds * 0.8} style={{ textAlign: "center", fontSize: 36, fontWeight: 700, marginTop: 8 }}>
          Small models: {pct(before, 1)} → {pct(data.followups.evSmall, 1)} switched
        </FadeUp>
        <FadeUp delay={seconds * 0.82} style={{ textAlign: "center", fontSize: 22, color: colors.muted }}>
          illustrated on the bridge example; the formats are the ones the models saw
        </FadeUp>
      </AbsoluteFill>
    </SceneFrame>
  );
};

export const TakeawaysScene: React.FC<{ seconds: number }> = ({ seconds }) => (
  <SceneFrame kicker="Takeaways" heading="For anyone building teams of AI agents">
    <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 200, gap: 50, paddingBottom: 60 }}>
      {[
        ["1", "Keep the source in the loop", "check claims against the original evidence", 0.2],
        ["2", "Don't trust name tags", "a claimed identity changed what models believed", 0.42],
        ["3", "Word warnings carefully", "stating what the evidence says made the checker work better", 0.68],
      ].map(([n, head, sub, at]) => (
        <FadeUp key={n as string} delay={seconds * (at as number)} style={{ display: "flex", gap: 34, alignItems: "baseline" }}>
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
    <FadeUp delay={0.4}><div style={{ fontSize: 38, color: colors.muted }}>Thor Matthiasson · Jennifer McTiernan · with Apart Research</div></FadeUp>
    <FadeUp delay={0.8}><div style={{ fontSize: 30, color: colors.muted }}>24 made-up documents · 3 teams of 5 models · 7,352 round-two answers · pre-registered</div></FadeUp>
    <FadeUp delay={1.2}><div style={{ fontSize: 24, color: colors.muted }}>Narration: synthetic voice (ElevenLabs). Full report, code and data accompany this video.</div></FadeUp>
  </AbsoluteFill>
);
