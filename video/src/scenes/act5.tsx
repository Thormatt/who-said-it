import React from "react";
import { AbsoluteFill } from "remotion";
import { Bubble, Panel, Paper, makeSeats } from "../characters";
import { Camera, Chapter, P, Sfx, Shell, clamp01, pop, ramp, useT } from "../kit";
import { colors, display, mono } from "../theme";
import { cueOf, sceneSeconds } from "../timing";

const chip: React.CSSProperties = {
  display: "inline-block", padding: "12px 28px", borderRadius: 999, border: `2px solid ${colors.grid}`, background: colors.panel, fontSize: 32, fontWeight: 600, margin: "0 10px",
};

/** The caveat, the pattern, and the line the video ends on. */
export const Ending: React.FC = () => {
  const t = useT();
  const c = cueOf("ending");
  const tLab = c("a lab test");
  const tShort = c("short invented reports");
  const tOrders = c("impostors following");
  const tPattern = c("the pattern");
  const tRepetition = c("It was repetition");
  const tName = c("and a name");
  const tSource = c("a way back");
  const tAsk1 = c("don't ask how many");
  const tAsk2 = c("Don't ask who");
  const tAsk3 = c("Ask how they know");
  const lab = 1 - ramp(t, tPattern - 0.4, tPattern);
  const pattern = ramp(t, tPattern, tPattern + 0.4) * (1 - ramp(t, tAsk1 - 0.9, tAsk1 - 0.5));
  const seats = makeSeats(() => ({ show: 1, mask: 1, bubble: 1 }));
  const heading: React.CSSProperties = { fontFamily: display, fontSize: 34, letterSpacing: 4, textTransform: "uppercase", color: colors.muted };
  const column = (x: number, at: number, label: string, tone: string, icon: React.ReactNode) => (
    <>
      <div style={{ position: "absolute", left: x, top: 380, width: 400, height: 190, opacity: clamp01(pop(t, at, false)) }}>{icon}</div>
      <P x={x} y={590} w={400} show={pop(t, at)} grow style={{ fontFamily: display, fontWeight: 700, fontSize: 64, color: tone, transformOrigin: "left center" }}>{label}</P>
    </>
  );
  return (
    <Shell seconds={sceneSeconds("ending")} fadeOut={false}>
      <div style={{ position: "absolute", inset: 0, opacity: lab }}>
        <Chapter show={ramp(t, 0.1, 0.6)}>A caution</Chapter>
        <Camera y={560} zoom={0.55}>
          <Panel t={t} seats={seats} />
        </Camera>
        <div style={{ position: "absolute", left: 400, top: 330, width: 1120, height: 420, borderRadius: 44, border: `4px solid ${colors.muted}`, boxSizing: "border-box", opacity: clamp01(pop(t, tLab - 0.3, false)) }} />
        <P x={0} y={300} w={1920} show={pop(t, tLab)} style={{ textAlign: "center" }}>
          <span style={{ display: "inline-block", background: colors.bg, padding: "6px 26px", fontFamily: mono, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: colors.muted }}>LAB TEST</span>
        </P>
        <P x={0} y={800} w={1920} style={{ textAlign: "center" }}>
          <span style={{ ...chip, opacity: clamp01(pop(t, tShort, false)) }}>short invented reports</span>
          <span style={{ ...chip, opacity: clamp01(pop(t, tShort + 0.7, false)) }}>one planted number</span>
          <span style={{ ...chip, opacity: clamp01(pop(t, tOrders, false)) }}>impostors following orders</span>
        </P>
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: pattern }}>
        <P x={200} y={250} show={pop(t, tPattern + 0.3, false)} style={heading}>What moved them</P>
        <P x={1290} y={250} show={pop(t, tSource - 0.6, false)} style={heading}>What protected them</P>
        <div style={{ position: "absolute", left: 1190, top: 250, width: 4, height: 420, background: colors.grid, opacity: clamp01(pop(t, tSource - 0.6, false)) }} />
        {column(200, tRepetition, "Repetition", colors.error, (
          <>
            <Bubble x={110} y={70} show={1} wrong={1} />
            <Bubble x={170} y={110} show={1} wrong={1} />
            <Bubble x={230} y={150} show={1} wrong={1} />
          </>
        ))}
        {column(700, tName, "A name", colors.flagship, (
          <div style={{ position: "absolute", left: 0, top: 50, borderRadius: 14, background: colors.flagship, color: colors.ink, padding: "16px 28px", fontFamily: display, fontWeight: 700, fontSize: 42, boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>
            ★ Flagship
          </div>
        ))}
        {column(1290, tSource, "The source", colors.truth, <Paper x={10} y={0} w={140} h={180} glow={0.6 + 0.3 * Math.sin(t * 5)} />)}
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 90 }}>
        <div style={{ fontFamily: display, fontWeight: 500, fontSize: 64, color: colors.muted, opacity: clamp01(pop(t, tAsk1, false)), transform: `translateY(${(1 - pop(t, tAsk1, false)) * 30}px)` }}>
          Don't ask how many said it.
        </div>
        <div style={{ fontFamily: display, fontWeight: 500, fontSize: 64, color: colors.muted, marginTop: 22, opacity: clamp01(pop(t, tAsk2, false)), transform: `translateY(${(1 - pop(t, tAsk2, false)) * 30}px)` }}>
          Don't ask who said it.
        </div>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 150, letterSpacing: -4, marginTop: 44, opacity: clamp01(pop(t, tAsk3) * 2), transform: `scale(${0.7 + 0.3 * pop(t, tAsk3)})` }}>
          Ask <span style={{ color: colors.truth }}>how they know.</span>
        </div>
      </AbsoluteFill>
      <Sfx name="whoosh" at={tPattern - 0.3} volume={0.3} />
      <Sfx name="wrong" at={tRepetition} volume={0.35} />
      <Sfx name="pop" at={tName} volume={0.35} />
      <Sfx name="ding" at={tSource} volume={0.3} />
      <Sfx name="thud" at={tAsk3} volume={0.55} />
      <Sfx name="chime" at={tAsk3 + 0.1} volume={0.35} />
    </Shell>
  );
};

export const Credits: React.FC = () => {
  const t = useT();
  const line = (at: number, style: React.CSSProperties, text: string) => (
    <div style={{ opacity: ramp(t, at, at + 0.5), transform: `translateY(${(1 - ramp(t, at, at + 0.5)) * 20}px)`, ...style }}>{text}</div>
  );
  return (
    <Shell seconds={sceneSeconds("credits")} fadeOut={false}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 22, paddingBottom: 70, opacity: 1 - ramp(t, sceneSeconds("credits") - 0.8, sceneSeconds("credits")) }}>
        {line(0.1, { fontFamily: display, fontWeight: 700, fontSize: 130, letterSpacing: -3 }, "Who Said It?")}
        {line(0.6, { fontSize: 46, fontWeight: 600 }, "Thor Matthiasson · Jennifer McTiernan")}
        {line(1.2, { fontSize: 30, color: colors.muted, marginTop: 14 }, "24 invented reports · 3 teams of 5 AI models · 7,352 second-round answers · plan fixed in advance")}
        {line(1.8, { fontSize: 30, color: colors.muted }, "Apart Research AI × Epistemics sprint · November 2026")}
        {line(2.6, { fontSize: 23, color: colors.muted, marginTop: 22 }, "Narration: synthetic voice (ElevenLabs) · Music and sound effects synthesized for this video")}
      </AbsoluteFill>
    </Shell>
  );
};
