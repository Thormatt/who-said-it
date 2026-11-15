import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Bot, Bubble, Panel, Paper, Person, makeSeats } from "../characters";
import { Camera, Chapter, P, Sfx, Shell, clamp01, lerp, pop, ramp, useT } from "../kit";
import { botColors, colors, display, mono } from "../theme";
import { cueOf, sceneSeconds } from "../timing";

const pill: React.CSSProperties = {
  display: "inline-block", padding: "16px 36px", borderRadius: 999, background: colors.panel, border: `2px solid ${colors.grid}`, fontSize: 40, fontWeight: 600,
};

/** Cold open: the meeting, the right answer, then the three planted guests. */
export const Cold: React.FC = () => {
  const t = useT();
  const c = cueOf("cold");
  const end = sceneSeconds("cold");
  const tBots = 0.2;
  const tReport = c("the same report");
  const tQuestion = c("how long");
  const tRight = c("Fourteen months");
  const tGuests = c("three extra guests");
  const tPlanted = c("We planted them");
  const tWrong = c("Forty-one months");
  const tWho = c("who does the room");
  const seats = makeSeats(({ plant, k }) =>
    plant
      ? {
          show: pop(t, tGuests + k * 0.22), mask: pop(t, tPlanted + k * 0.14), bubble: pop(t, tWrong + k * 0.12),
          plate: { text: "PLANTED", tone: colors.error }, flip: ramp(t, tPlanted + 0.3 + k * 0.14, tPlanted + 0.7 + k * 0.14),
        }
      : {
          show: pop(t, tBots + k * 0.14), bubble: pop(t, tRight + k * 0.08),
          look: t > tWho ? Math.sin((t - tWho) * 4.5 + k * 1.3) : t > tGuests ? Math.sin((t - tGuests) * 2 + k) * 0.5 : 0,
        },
  );
  return (
    <Shell seconds={end} fadeOut={false}>
      <Camera y={lerp(505, 540, ramp(t, 0, tGuests))} zoom={lerp(1.13, 1, ramp(t, 0, tGuests)) + 0.07 * ramp(t, tWho, end)}>
        <Panel t={t} seats={seats} report={{ show: pop(t, tReport) }} />
      </Camera>
      <P x={0} y={92} w={1920} show={pop(t, tQuestion, false) * (1 - ramp(t, tWho - 0.4, tWho))} style={{ textAlign: "center" }}>
        <span style={pill}>How long was the bridge repair delayed?</span>
      </P>
      <P x={0} y={78} w={1920} show={pop(t, tWho)} grow style={{ textAlign: "center", fontFamily: display, fontWeight: 700, fontSize: 86 }}>
        Who does the room <span style={{ color: colors.flagship }}>believe?</span>
      </P>
      {[0, 1, 2, 3, 4].map((k) => <Sfx key={k} name="pop" at={tBots + k * 0.14} volume={0.22} />)}
      <Sfx name="whoosh" at={tReport - 0.1} volume={0.3} />
      <Sfx name="ding" at={tRight} volume={0.3} />
      {[0, 1, 2].map((k) => <Sfx key={k} name="plop" at={tGuests + k * 0.22} volume={0.45} />)}
      <Sfx name="thud" at={tPlanted} volume={0.5} />
      <Sfx name="wrong" at={tWrong} volume={0.5} />
      <Sfx name="riser" at={end - 1.7} volume={0.4} />
    </Shell>
  );
};

export const Title: React.FC = () => {
  const t = useT();
  return (
    <Shell seconds={sceneSeconds("title")} fadeIn={false}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 48, fontFamily: display, fontWeight: 700, fontSize: 236, letterSpacing: -6, lineHeight: 1 }}>
          {["Who", "Said", "It?"].map((word, i) => {
            const p = pop(t, 0.1 + i * 0.2);
            return (
              <span key={word} style={{ display: "inline-block", opacity: clamp01(p * 2), color: i === 2 ? colors.flagship : colors.text, transform: `translateY(${(1 - p) * 140}px) rotate(${(1 - p) * (i - 1) * 9}deg)` }}>
                {word}
              </span>
            );
          })}
        </div>
        <div style={{ width: 1180 * ramp(t, 0.7, 1.3), height: 8, borderRadius: 4, background: colors.flagship, marginTop: 28 }} />
        <div style={{ fontSize: 42, color: colors.muted, marginTop: 34, opacity: ramp(t, 1.1, 1.7) }}>
          What happens when AI models talk each other into the wrong answer
        </div>
      </AbsoluteFill>
      <Sfx name="boom" at={0.05} volume={0.7} />
    </Shell>
  );
};

const CHAIN_X = [230, 620, 960, 1300, 1680];
const CHAIN_Y = 560;
const hopX = (p: number): number => interpolate(p, [0, 1, 2, 3, 4], CHAIN_X, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const hopY = (p: number): number => CHAIN_Y - 158 - Math.sin((p % 1) * Math.PI) * 48;

const Packet: React.FC<{ p: number; show: number; tone: string }> = ({ p, show, tone }) => (
  <div
    style={{
      position: "absolute", left: hopX(p) - 38, top: hopY(p) - 28, width: 76, height: 56, borderRadius: 13, background: tone, opacity: clamp01(show),
      transform: `scale(${0.6 + 0.4 * show})`, boxShadow: "0 8px 18px rgba(0,0,0,0.4)", padding: "12px 13px", boxSizing: "border-box",
    }}
  >
    {[100, 70, 85].map((w, i) => (
      <div key={i} style={{ width: `${w}%`, height: 6, borderRadius: 3, background: "rgba(11,20,38,0.65)", marginBottom: 6 }} />
    ))}
  </div>
);

/** Why it matters: a chain of models passing claims along, with only the first one near the source. */
export const Why: React.FC = () => {
  const t = useT();
  const c = cueOf("why");
  const tTeams = c("built as teams");
  const tDraft = c("One model drafts");
  const tReview = c("another reviews");
  const tWrite = c("a third writes");
  const tRead = c("you actually read");
  const tNot = c("not the original source");
  const tWrong = c("confidently wrong");
  const tCaught = c("get caught");
  const tPassed = c("passed along");
  const good = ramp(t, tDraft - 0.5, tDraft + 0.1) + ramp(t, tReview - 0.2, tReview + 0.4) + ramp(t, tWrite - 0.2, tWrite + 0.4) + ramp(t, tRead - 0.3, tRead + 0.3);
  const bad = 1 + ramp(t, tCaught - 0.1, tCaught + 0.5) + ramp(t, tPassed - 0.1, tPassed + 0.4) + ramp(t, tPassed + 0.45, tPassed + 0.95);
  const roleAt = [tDraft, tReview, tWrite];
  const label: React.CSSProperties = { textAlign: "center", fontSize: 32, fontWeight: 600 };
  return (
    <Shell seconds={sceneSeconds("why")}>
      <Chapter show={ramp(t, 0.1, 0.6)}>Why it matters</Chapter>
      <P x={0} y={170} w={1920} show={pop(t, tTeams, false) * (1 - ramp(t, tCaught - 0.4, tCaught))} style={{ textAlign: "center", fontFamily: display, fontWeight: 700, fontSize: 66 }}>
        AI is increasingly built as teams
      </P>
      <P x={0} y={170} w={1920} show={pop(t, tCaught)} grow style={{ textAlign: "center", fontFamily: display, fontWeight: 700, fontSize: 66 }}>
        Caught, or <span style={{ color: colors.error }}>passed along?</span>
      </P>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: ramp(t, tTeams, tTeams + 0.6) }}>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={CHAIN_X[i] + 96} y1={CHAIN_Y} x2={CHAIN_X[i + 1] - 96} y2={CHAIN_Y} stroke={colors.grid} strokeWidth={6} strokeDasharray="2 16" strokeLinecap="round" />
        ))}
      </svg>
      <Paper x={170} y={CHAIN_Y - 84} w={120} h={160} show={pop(t, 0.3)} opacity={1 - 0.62 * ramp(t, tNot, tNot + 0.5)} />
      <P x={130} y={CHAIN_Y + 112} w={200} show={pop(t, 0.5, false)} style={{ ...label, color: colors.muted }}>the source</P>
      {["drafts", "reviews", "summarizes"].map((role, i) => (
        <React.Fragment key={role}>
          <Bot x={CHAIN_X[i + 1]} y={CHAIN_Y - 20} t={t} seed={i} color={botColors[i]} s={1.05} show={pop(t, tTeams + i * 0.15)} />
          <P x={CHAIN_X[i + 1] - 130} y={CHAIN_Y + 172} w={260} show={pop(t, roleAt[i], false)} style={label}>{role}</P>
          <P x={CHAIN_X[i + 1] - 150} y={CHAIN_Y + 226} w={300} show={pop(t, tNot + 0.2 + i * 0.15, false)} style={{ textAlign: "center" }}>
            <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 10, fontSize: 24, fontWeight: 600, color: i === 0 ? colors.truth : colors.flagship, border: `2px solid ${i === 0 ? colors.truth : colors.flagship}` }}>
              {i === 0 ? "read the source" : "sees only claims"}
            </span>
          </P>
        </React.Fragment>
      ))}
      <Person x={CHAIN_X[4]} y={CHAIN_Y} s={1.1} show={pop(t, tRead - 0.3)} />
      <P x={CHAIN_X[4] - 130} y={CHAIN_Y + 172} w={260} show={pop(t, tRead, false)} style={label}>you</P>
      <Packet p={good} tone={colors.truth} show={pop(t, tDraft - 0.6) * (1 - ramp(t, tRead + 0.9, tRead + 1.3))} />
      <Packet p={bad} tone={colors.error} show={pop(t, tWrong)} />
      <Sfx name="pop" at={tTeams} volume={0.25} />
      <Sfx name="whoosh" at={tDraft - 0.5} volume={0.2} />
      <Sfx name="wrong" at={tWrong} volume={0.45} />
      <Sfx name="whoosh" at={tPassed - 0.1} volume={0.25} />
    </Shell>
  );
};

const GAME_X = [860, 1085, 1310, 1535, 1760];
const GAME_Y = 670;

const BigReport: React.FC<{ show: number; mark: number; stamp: number }> = ({ show, mark, stamp }) => (
  <P x={110} y={240} w={560} show={show} style={{ height: 600, background: colors.paper, borderRadius: 18, color: colors.ink, padding: "46px 50px", boxSizing: "border-box", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
    <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: 2, color: "#6b7280" }}>PROJECT SUMMARY</div>
    <div style={{ fontFamily: display, fontWeight: 700, fontSize: 46, margin: "6px 0 26px" }}>Bridge repair</div>
    {["Opened to traffic in 1987", "Repair approved in 2019", "Repair delayed by 14 months", "Budget: 12 million euros"].map((line, i) => (
      <div key={line} style={{ fontSize: 31, lineHeight: 2.05, fontWeight: i === 2 ? 700 : 500 }}>
        <span style={i === 2 ? { backgroundImage: "linear-gradient(rgba(52,195,143,0.55), rgba(52,195,143,0.55))", backgroundRepeat: "no-repeat", backgroundSize: `${mark * 100}% 100%`, padding: "4px 8px", margin: "0 -8px" } : undefined}>
          {line}
        </span>
      </div>
    ))}
    <div style={{ position: "absolute", right: 34, bottom: 44, border: "6px solid #c0262d", color: "#c0262d", borderRadius: 10, padding: "4px 18px", fontFamily: display, fontWeight: 700, fontSize: 44, letterSpacing: 3, opacity: clamp01(stamp * 2), transform: `rotate(-11deg) scale(${1.7 - 0.7 * Math.min(1, stamp)})` }}>
      INVENTED
    </div>
  </P>
);

/** The rules: an invented report, round one alone, round two with everyone's answers in view. */
export const Game: React.FC = () => {
  const t = useT();
  const c = cueOf("game");
  const tGame = c("we built a game");
  const tNever = c("never happened");
  const tRead = c("read the report");
  const tR1 = c("Round one");
  const tR2 = c("Round two");
  const tDrop = c("drops the right answer");
  const tFooled = c("as fooled");
  const booth = pop(t, tR1, false) * (1 - ramp(t, tR2, tR2 + 0.4));
  const round2 = ramp(t, tR2, tR2 + 0.4);
  const wrong = ramp(t, tDrop, tDrop + 0.5);
  return (
    <Shell seconds={sceneSeconds("game")}>
      <Chapter show={ramp(t, 0.1, 0.6)}>The game</Chapter>
      <BigReport show={pop(t, tGame, false)} mark={ramp(t, tRead - 0.3, tRead + 0.5)} stamp={pop(t, tNever)} />
      <P x={770} y={176} show={pop(t, tR1, false)}>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 68, lineHeight: 1 }}>{round2 > 0.5 ? "Round 2" : "Round 1"}</div>
        <div style={{ fontSize: 32, color: colors.muted, marginTop: 10 }}>{round2 > 0.5 ? "each model sees its teammates' answers" : "every model answers alone"}</div>
      </P>
      <P x={770} y={352} w={240} show={pop(t, tR2 + 0.5, false)} style={{ fontSize: 26, color: colors.error, fontWeight: 600, lineHeight: 1.2 }}>
        planted<br />answers
      </P>
      {[1, 2, 3].map((i, k) => <Bubble key={i} x={GAME_X[i]} y={380} show={pop(t, tR2 + 0.6 + k * 0.12)} wrong={1} />)}
      {GAME_X.map((x, i) => (
        <Bot key={x} x={x} y={GAME_Y} t={t} seed={i + 3} color={botColors[i]} s={0.8} show={pop(t, tGame + 0.4 + i * 0.1)} lookY={i === 2 ? -round2 : 0} alarm={i === 2 ? wrong : 0} />
      ))}
      {GAME_X.slice(0, 4).map((x, i) => (
        <div key={x} style={{ position: "absolute", left: x + 107, top: 500 + (1 - booth) * 230, width: 11, height: 230 * booth, borderRadius: 5, background: colors.grid }} />
      ))}
      <div style={{ position: "absolute", left: 760, top: 730, width: 1100, height: 24, borderRadius: "12px 12px 0 0", background: colors.deskTop, opacity: pop(t, tGame + 0.3, false) }} />
      <div style={{ position: "absolute", left: 760, top: 754, width: 1100, height: 70, borderRadius: "0 0 16px 16px", background: colors.deskFront, opacity: pop(t, tGame + 0.3, false) }} />
      {GAME_X.map((x, i) => <Bubble key={x} x={x} y={GAME_Y - 146} s={0.86} show={pop(t, tR1 + 0.6 + i * 0.12)} wrong={i === 2 ? wrong : 0} />)}
      <P x={1180} y={846} w={260} show={pop(t, tFooled)} grow style={{ textAlign: "center" }}>
        <span style={{ display: "inline-block", border: `6px solid ${colors.error}`, color: colors.error, borderRadius: 12, padding: "2px 22px", fontFamily: display, fontWeight: 700, fontSize: 50, letterSpacing: 3, transform: "rotate(-6deg)" }}>FOOLED</span>
      </P>
      <Sfx name="whoosh" at={tGame - 0.1} volume={0.3} />
      <Sfx name="thud" at={tNever} volume={0.5} />
      {[0, 1, 2, 3, 4].map((i) => <Sfx key={i} name="pop" at={tR1 + 0.6 + i * 0.12} volume={0.2} />)}
      {[0, 1, 2].map((k) => <Sfx key={k} name="plop" at={tR2 + 0.6 + k * 0.12} volume={0.35} />)}
      <Sfx name="flip" at={tDrop + 0.15} volume={0.45} />
      <Sfx name="thud" at={tFooled} volume={0.5} />
    </Shell>
  );
};
