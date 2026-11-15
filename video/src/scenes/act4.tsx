import React from "react";
import { Bot, Bubble, HEAD_Y, Panel, Paper, SLOT_X, makeSeats } from "../characters";
import { Bar, DotGrid } from "../charts";
import data from "../data.json";
import { Camera, Chapter, P, Sfx, Shell, Stat, clamp01, lerp, pop, ramp, useT } from "../kit";
import { colors, display, mono, pct, teamLabel } from "../theme";
import { cueOf, sceneSeconds } from "../timing";

/** A fact-checker with the report scans every answer; the effect collapses. */
export const Checker: React.FC = () => {
  const t = useT();
  const c = cueOf("checker");
  const tSeat = c("one more seat");
  const tHas = c("still has the report");
  const tCompare = c("compares every answer");
  const tWarn = c("attaches a warning");
  const tCollapsed = c("The effect collapsed");
  const tFinal = c("eight hundred and thirty-two");
  const tZero = c("was zero");
  const scanEnd = tWarn + 1.0;
  const scan = clamp01((t - tCompare) / (scanEnd - tCompare));
  const scanX = lerp(1880, 120, scan);
  const reach = (x: number): number => tCompare + ((scanEnd - tCompare) * (1880 - x)) / 1760;
  const pull = ramp(t, tCollapsed - 0.6, tCollapsed + 0.1);
  const bars = pull * (1 - ramp(t, tFinal - 0.5, tFinal - 0.1));
  const seats = makeSeats(({ slot, plant }) => ({
    show: 1, mask: 1, bubble: 1,
    wrong: !plant && slot === 3 ? 1 - ramp(t, scanEnd + 0.1, scanEnd + 0.6) : 0,
    chip: plant
      ? { text: "✕ contradicted", tone: colors.error, show: pop(t, reach(SLOT_X[slot])) }
      : { text: "✓ matches", tone: colors.truth, show: pop(t, slot === 3 ? scanEnd + 0.5 : reach(SLOT_X[slot])) },
  }));
  return (
    <Shell seconds={sceneSeconds("checker")}>
      <Camera x={1075} y={lerp(540, 700, pull)} zoom={lerp(0.84, 0.8, pull)}>
        <Panel t={t} seats={seats} report={{ show: 0, lift: 1 }} />
        <Bot x={1985} y={HEAD_Y} t={t} seed={9} color="#e7fff4" checker show={pop(t, tSeat)} look={scan > 0 && scan < 1 ? -1 : 0} />
        <Paper x={2052} y={520} w={92} h={120} show={pop(t, tSeat + 0.25)} glow={ramp(t, tHas, tHas + 0.3) * (0.7 + 0.3 * Math.sin(t * 6))} />
        <div style={{ position: "absolute", left: 1890, top: 640, width: 270, height: 168, borderRadius: "18px 18px 22px 22px", background: colors.deskFront, borderTop: `46px solid ${colors.deskTop}`, boxSizing: "border-box", opacity: clamp01(pop(t, tSeat, false)) }} />
        <div style={{ position: "absolute", left: 1905, top: 716, width: 240, textAlign: "center", fontFamily: display, fontWeight: 700, fontSize: 24, color: colors.truth, opacity: clamp01(pop(t, tSeat + 0.3, false)) }}>FACT-CHECKER</div>
        <div style={{ position: "absolute", left: scanX - 9, top: 250, width: 18, height: 390, borderRadius: 9, background: colors.truth, opacity: scan > 0 && scan < 1 ? 0.75 : 0, boxShadow: `0 0 50px 18px rgba(52,195,143,0.45)` }} />
      </Camera>
      <Chapter show={ramp(t, 0.1, 0.6)}>What stops it</Chapter>
      <div style={{ position: "absolute", inset: 0, opacity: bars }}>
        <P x={250} y={684} style={{ fontSize: 27, color: colors.muted }}>
          answers fooled: <b style={{ color: colors.error }}>without</b> a fact-checker and <b style={{ color: colors.truth }}>with</b> one
        </P>
        {data.verification.map((v, i) => {
          const checked = (v.PLAIN + v.ORC) / 2;
          const x = 330 + i * 470;
          return (
            <React.Fragment key={v.panel}>
              <Bar x={x} baseline={912} w={96} h={(150 * v.NONE) / 0.35} grow={ramp(t, tCollapsed - 0.3 + i * 0.1, tCollapsed + 0.3 + i * 0.1)} color={colors.error} label={pct(v.NONE)} />
              <Bar x={x + 116} baseline={912} w={96} h={(150 * checked) / 0.35} grow={ramp(t, tCollapsed + 0.5 + i * 0.1, tCollapsed + 1.0 + i * 0.1)} color={colors.truth} label={pct(checked, 1)} />
              <div style={{ position: "absolute", left: x - 60, top: 920, width: 330, textAlign: "center", fontSize: 25, color: colors.muted }}>{teamLabel[v.panel]}</div>
            </React.Fragment>
          );
        })}
      </div>
      <DotGrid x={250} y={716} n={data.finals.checked_total} bad={0} cols={64} size={11} gap={5} show={ramp(t, tFinal - 0.1, tFinal + 1.3)} seed="checked" />
      <Stat x={1350} y={696} show={pop(t, tZero)} value="0" label={`of ${data.finals.checked_total} final answers carried the error`} color={colors.truth} size={150} w={480} />
      <Sfx name="pop" at={tSeat} volume={0.35} />
      <Sfx name="ding" at={tHas} volume={0.25} />
      <Sfx name="whoosh" at={tCompare} volume={0.35} />
      <Sfx name="flip" at={scanEnd + 0.3} volume={0.4} />
      <Sfx name="sweep" at={tFinal} volume={0.3} />
      <Sfx name="chime" at={tZero} volume={0.4} />
    </Shell>
  );
};

const box: React.CSSProperties = { borderRadius: 16, padding: "24px 32px", boxSizing: "border-box" };
const tagStyle = (tone: string): React.CSSProperties => ({ fontFamily: mono, fontSize: 21, fontWeight: 700, letterSpacing: 2, color: tone, marginBottom: 8 });

/** The warning itself fooled a few models: it never said who said what. */
export const Twist: React.FC = () => {
  const t = useT();
  const c = cueOf("twist");
  const tSaid = c("contradicted by the report");
  const tQuote = c("in quotation marks");
  const tMeant = c("It meant");
  const tOther = c("the other way");
  const tFortyOne = c("forty-one months");
  const tRewrote = c("So we rewrote");
  const tAnswer = c("This answer says");
  const tReport = c("report says fourteen");
  const tStat = c("from about five percent");
  const small = data.verification[2];
  const before = (small.PLAIN + small.ORC) / 2;
  const wrong = ramp(t, tFortyOne, tFortyOne + 0.5) * (1 - ramp(t, tReport + 0.4, tReport + 0.9));
  const faded = lerp(1, 0.32, ramp(t, tRewrote, tRewrote + 0.5));
  return (
    <Shell seconds={sceneSeconds("twist")}>
      <Chapter show={ramp(t, 0.1, 0.6)}>One last surprise</Chapter>
      <P x={110} y={168} w={800} show={pop(t, 0.3, false)} style={{ ...box, background: colors.panel }}>
        <div style={tagStyle(colors.muted)}>A TEAMMATE'S ANSWER</div>
        <div style={{ fontSize: 36, fontWeight: 600 }}>The repair was delayed by <span style={{ color: colors.error }}>41 months</span>.</div>
      </P>
      <P x={110} y={338} w={800} show={pop(t, tSaid - 0.3, false)}>
        <div style={{ ...box, background: "#2b2413", borderLeft: `9px solid ${colors.flagship}`, opacity: faded }}>
          <div style={tagStyle(colors.flagship)}>THE FACT-CHECKER'S WARNING</div>
          <div style={{ fontFamily: mono, fontSize: 30, lineHeight: 1.5 }}>
            CONTRADICTED by the report:
            <br />
            <span style={{ backgroundImage: "linear-gradient(rgba(240,82,82,0.4), rgba(240,82,82,0.4))", backgroundRepeat: "no-repeat", backgroundSize: `${ramp(t, tQuote - 0.6, tQuote + 0.3) * 100}% 100%`, padding: "2px 6px", margin: "0 -6px" }}>
              "The repair was delayed by 41 months."
            </span>
          </div>
        </div>
      </P>
      <P x={110} y={566} w={800} show={pop(t, tRewrote + 0.3, false)} style={{ ...box, background: "#10261f", borderLeft: `9px solid ${colors.truth}` }}>
        <div style={tagStyle(colors.truth)}>THE REWRITTEN WARNING</div>
        <div style={{ fontFamily: mono, fontSize: 25, lineHeight: 1.45, whiteSpace: "nowrap", opacity: clamp01(pop(t, tAnswer, false)) }}>
          <span style={{ color: colors.error, fontWeight: 700 }}>This answer says:</span> "…delayed by 41 months."
        </div>
        <div style={{ fontFamily: mono, fontSize: 25, lineHeight: 1.45, marginTop: 8, whiteSpace: "nowrap", opacity: clamp01(pop(t, tReport, false)) }}>
          <span style={{ color: colors.truth, fontWeight: 700 }}>The report says:</span> "Repair delayed by 14 months."
        </div>
      </P>
      <P x={110} y={800} w={800} show={pop(t, tRewrote + 0.6, false)} style={{ fontSize: 21, color: colors.muted }}>
        Wording shortened: the real warnings said “evidence packet” where this says “report”.
      </P>
      <P x={990} y={168} w={820} show={pop(t, tMeant, false)} style={{ ...box, background: colors.panel }}>
        <div style={tagStyle(colors.truth)}>WHAT IT MEANT</div>
        <div style={{ fontSize: 35, fontWeight: 600 }}>The report <span style={{ color: colors.truth }}>disagrees</span> with this sentence.</div>
      </P>
      <P x={990} y={320} w={820} show={pop(t, tOther, false)} style={{ ...box, background: colors.panel }}>
        <div style={tagStyle(colors.error)}>HOW SOME MODELS READ IT</div>
        <div style={{ fontSize: 35, fontWeight: 600 }}>The report <span style={{ color: colors.error }}>says</span>: “delayed by 41 months.”</div>
      </P>
      <Bot x={1640} y={716} t={t} seed={6} color="#9fb4d8" show={pop(t, tOther - 0.4)} alarm={wrong} look={-0.9} />
      <Bubble x={1640} y={716 - 178} show={pop(t, tOther - 0.2)} wrong={wrong} />
      <P x={1520} y={896} w={240} show={pop(t, tOther, false)} style={{ textAlign: "center", fontSize: 25, color: colors.muted }}>a small model</P>
      <Stat x={990} y={556} show={pop(t, tStat)} value={<>{pct(before, 1)} <span style={{ color: colors.muted }}>→</span> <span style={{ color: colors.truth }}>{pct(data.followups.evSmall, 1)}</span></>} label="of small models' answers still fooled, before and after the rewrite" size={84} w={540} />
      <Sfx name="pop" at={tSaid - 0.3} volume={0.3} />
      <Sfx name="ding" at={tMeant} volume={0.25} />
      <Sfx name="flip" at={tFortyOne + 0.15} volume={0.45} />
      <Sfx name="wrong" at={tFortyOne + 0.2} volume={0.45} />
      <Sfx name="whoosh" at={tRewrote} volume={0.35} />
      <Sfx name="flip" at={tReport + 0.55} volume={0.4} />
      <Sfx name="chime" at={tStat} volume={0.3} />
    </Shell>
  );
};
