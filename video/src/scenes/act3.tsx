import React from "react";
import { Bot, Panel, makeSeats, type Plate } from "../characters";
import { DotGrid } from "../charts";
import data from "../data.json";
import { Camera, Chapter, P, Sfx, Shell, Stat, clamp01, lerp, pop, ramp, useT } from "../kit";
import { REAL_NAMES, colors, display, mono, pct } from "../theme";
import { cueOf, sceneSeconds } from "../timing";

const ANON: Plate = { text: "Panelist", tone: "#55627f", ink: "#e5eaf3" };
// The labels are the ones used in the experiment (src/epi/config.py, CONFEDERATE_LABELS).
const TINY = { name: "Llama 3.2 1B", sub: "Meta's small 1-billion-parameter model", tone: colors.tiny };
const FLAGSHIP = { name: "GPT-6.1 Sol Pro", sub: "OpenAI's flagship model", tone: colors.flagship };

/** Everyone gets a name plate; the same wrong answer is then tagged tiny, and then flagship. */
export const Tags: React.FC = () => {
  const t = useT();
  const c = cueOf("tags");
  const tReal = c("their real names");
  const tWhatever = c("whatever name");
  const tFirst = c("First, we tagged");
  const tShrug = c("shrugged it off");
  const tOnce = c("fooled once");
  const tNothing = c("nothing but the tag");
  const tFlag = c("from a flagship");
  const tMany = c("Fooled thirty-eight");
  const spot = ramp(t, tFirst - 0.4, tFirst + 0.4);
  const swap = ramp(t, tNothing + 0.2, tNothing + 0.9);
  const tag = swap > 0.5 ? FLAGSHIP : TINY;
  const cycling = Math.floor(Math.max(0, t - tWhatever) * 2.2) % 2 === 0;
  const counts = data.counts["frontier-2026-11"];
  const seats = makeSeats(({ plant, k }) =>
    plant
      ? {
          show: 1, mask: 1, bubble: 1, plateFrom: ANON, flip: ramp(t, tWhatever + k * 0.1, tWhatever + 0.4 + k * 0.1),
          plate: cycling ? { text: "Tiny model", tone: colors.tiny } : { text: "Flagship", tone: colors.flagship },
        }
      : { show: 1, bubble: 1, plateFrom: ANON, plate: { text: REAL_NAMES[k], tone: "#f1f5f9" }, flip: ramp(t, tReal + k * 0.08, tReal + 0.4 + k * 0.08) },
  );
  const row = (y: number, label: string, tone: string, labelAt: number, sweepAt: number, badAt: number, bad: number, n: number, seed: string) => (
    <>
      <P x={860} y={y} show={pop(t, labelAt, false)} style={{ fontFamily: display, fontWeight: 700, fontSize: 40, color: tone }}>{label}</P>
      <DotGrid x={860} y={y + 66} n={n} bad={bad} cols={24} size={15} gap={6} show={ramp(t, sweepAt, sweepAt + 0.8)} badShow={ramp(t, badAt, badAt + 0.6)} seed={seed} />
      <Stat x={1430} y={y + 62} show={pop(t, badAt + 0.1)} value={bad} label={`fooled, of ${n}`} color={tone} size={150} w={400} />
    </>
  );
  return (
    <Shell seconds={sceneSeconds("tags")} fadeOut={false}>
      <Camera zoom={lerp(1, 1.06, spot)} opacity={1 - spot}>
        <Panel t={t} seats={seats} report={{ show: 0, lift: 1 }} />
      </Camera>
      <Chapter show={ramp(t, 0.1, 0.6)}>Who said it?</Chapter>
      <div style={{ position: "absolute", inset: 0, opacity: spot }}>
        <Bot x={400} y={604} t={t} seed={4} color={colors.plant} s={1.8} plant mask={1} />
        <div style={{ position: "absolute", left: 385, top: 268, width: 30, height: 30, background: colors.error, transform: "rotate(45deg)" }} />
        <div style={{ position: "absolute", left: 110, top: 150, width: 580, height: 134, borderRadius: 24, background: colors.error, color: colors.ink, padding: "26px 34px", boxSizing: "border-box", fontFamily: display, fontWeight: 700, fontSize: 40, lineHeight: 1.2, boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }}>
          “The repair was delayed by 41 months.”
        </div>
        <P x={110} y={760} w={580} show={pop(t, tFirst + 0.3)}>
          <div style={{ borderRadius: 14, background: tag.tone, color: colors.ink, padding: "18px 28px", boxSizing: "border-box", transform: `scaleY(${Math.abs(2 * swap - 1)})`, boxShadow: "0 8px 20px rgba(0,0,0,0.4)" }}>
            <div style={{ fontFamily: mono, fontSize: 18, letterSpacing: 2, opacity: 0.7 }}>NAME TAG</div>
            <div style={{ fontFamily: display, fontWeight: 700, fontSize: 44, lineHeight: 1.1 }}>{tag.name}</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{tag.sub}</div>
          </div>
        </P>
        {row(150, "Tagged as a tiny model", colors.tiny, tFirst + 0.9, tShrug, tOnce, counts["NAMED-LOW"].fooled, counts["NAMED-LOW"].n, "tag-tiny")}
        {row(520, "Tagged as a flagship", colors.flagship, tFlag - 0.3, tFlag, tMany, counts["NAMED-HIGH"].fooled, counts["NAMED-HIGH"].n, "tag-flagship")}
      </div>
      <Sfx name="flip" at={tReal} volume={0.35} />
      <Sfx name="flip" at={tWhatever} volume={0.35} />
      <Sfx name="whoosh" at={tFirst - 0.4} volume={0.35} />
      <Sfx name="sweep" at={tShrug} volume={0.25} />
      <Sfx name="pop" at={tOnce} volume={0.4} />
      <Sfx name="flip" at={tNothing + 0.4} volume={0.5} />
      <Sfx name="sweep" at={tFlag} volume={0.25} />
      <Sfx name="wrong" at={tMany} volume={0.5} />
    </Shell>
  );
};

const SMALL_BOTS = ["#9fb4d8", "#b7a6e8", "#8fd0c4"];

/** Small models fell harder, and the tag was only ever one line of text. */
export const TagFake: React.FC = () => {
  const t = useT();
  const c = cueOf("tagfake");
  const tSmall = c("Small models");
  const tPct = c("forty-one percent");
  const tLine = c("a line of text");
  const tClaim = c("claiming to be");
  const none = data.counts.small.ANON;
  const flagship = data.counts.small["NAMED-HIGH"];
  const grow = ramp(t, tPct - 0.2, tPct + 0.7);
  return (
    <Shell seconds={sceneSeconds("tagfake")} fadeIn={false}>
      <Chapter>Who said it?</Chapter>
      {SMALL_BOTS.map((color, i) => (
        <Bot key={color} x={190 + i * 140} y={330} t={t} seed={i + 5} color={color} s={0.8} show={pop(t, tSmall + i * 0.1)} alarm={i === 1 ? grow : 0} look={0.8} />
      ))}
      <P x={90} y={476} w={480} show={pop(t, tSmall + 0.3, false)} style={{ textAlign: "center", fontFamily: display, fontWeight: 700, fontSize: 36 }}>Small, cheap models</P>
      <DotGrid x={650} y={190} n={flagship.n} bad={lerp(none.fooled, flagship.fooled, grow)} cols={24} size={15} gap={6} show={ramp(t, tSmall + 0.3, tSmall + 1.1)} badShow={ramp(t, tSmall + 0.8, tSmall + 1.4)} seed="tag-small" />
      <P x={1230} y={180} w={560} show={pop(t, tSmall + 1.0, false)}>
        <span style={{ fontFamily: display, fontWeight: 700, fontSize: 70, color: colors.muted }}>{pct(none.fooled / none.n)}</span>
        <span style={{ fontSize: 30, color: colors.muted, marginLeft: 16 }}>fooled with no names</span>
      </P>
      <Stat x={1230} y={280} show={pop(t, tPct)} value={pct(flagship.fooled / flagship.n)} label="fooled with the flagship tag" color={colors.flagship} size={140} w={560} />
      <P x={150} y={560} w={1620} show={pop(t, tLine - 0.3, false)} style={{ background: "#0c1528", border: `2px solid ${colors.grid}`, borderRadius: 18, padding: "24px 36px", boxSizing: "border-box" }}>
        <div style={{ fontSize: 24, color: colors.muted, marginBottom: 12 }}>What the model actually saw</div>
        <div style={{ fontFamily: mono, fontSize: 33, lineHeight: 1.6, whiteSpace: "nowrap" }}>
          <span style={{ backgroundImage: "linear-gradient(rgba(245,158,11,0.34), rgba(245,158,11,0.34))", backgroundRepeat: "no-repeat", backgroundSize: `${ramp(t, tLine, tLine + 0.6) * 100}% 100%`, padding: "4px 10px", margin: "0 -10px", color: colors.flagship }}>
            --- GPT-6.1 Sol Pro (OpenAI's flagship model) ---
          </span>
          <span style={{ fontFamily: display, fontSize: 28, color: colors.flagship, marginLeft: 34, opacity: ramp(t, tLine + 0.4, tLine + 0.8) }}>← the whole name tag</span>
          <div style={{ color: colors.muted }}>The repair was delayed by 41 months. […]</div>
        </div>
      </P>
      <P x={150} y={790} w={1620} show={pop(t, tClaim)} grow style={{ transformOrigin: "left center", fontFamily: display, fontWeight: 700, fontSize: 62 }}>
        Nothing checked the name.
      </P>
      <Sfx name="sweep" at={tSmall + 0.3} volume={0.25} />
      <Sfx name="wrong" at={tPct} volume={0.45} />
      <Sfx name="pop" at={tLine} volume={0.35} />
      <Sfx name="thud" at={tClaim} volume={0.5} />
    </Shell>
  );
};
