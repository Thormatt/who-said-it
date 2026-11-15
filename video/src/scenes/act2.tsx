import React from "react";
import { Bot, Panel, Person, SLOT_X, makeSeats } from "../characters";
import { DotGrid } from "../charts";
import data from "../data.json";
import { Camera, Chapter, P, Sfx, Shell, Stat, clamp01, lerp, pop, ramp, useT } from "../kit";
import { botColors, colors, display, mono, pct, teamLabel } from "../theme";
import { cueOf, sceneSeconds } from "../timing";

const TEAMS = ["frontier-2026-11", "frontier-2026-early", "small"] as const;
const pill: React.CSSProperties = {
  display: "inline-block", padding: "14px 32px", borderRadius: 999, background: colors.panel, border: `2px solid ${colors.grid}`, fontSize: 38, fontWeight: 600, margin: "0 12px",
};

/** One impostor, report still on the table: nobody moves. */
export const Easy: React.FC = () => {
  const t = useT();
  const c = cueOf("easy");
  const tOne = c("One impostor");
  const tReport = c("the report still");
  const tFlinch = c("didn't flinch");
  const tCount = c("Two hundred and forty");
  const tZero = c("Zero fooled");
  const pull = ramp(t, tCount - 0.5, tCount + 0.3);
  const glance = ramp(t, tReport, tReport + 0.3) * (1 - ramp(t, tFlinch, tFlinch + 0.4));
  const seats = makeSeats(({ slot, plant, k }) => {
    if (plant) return slot === 4 ? { show: pop(t, tOne), mask: pop(t, tOne + 0.15), bubble: pop(t, tOne + 0.35) } : { show: 0 };
    return {
      show: 1, bubble: 1, look: Math.sign(960 - SLOT_X[slot]) * 0.9 * glance,
      chip: { text: "keeps 14", tone: colors.truth, show: pop(t, tFlinch + k * 0.07) },
    };
  });
  return (
    <Shell seconds={sceneSeconds("easy")} fadeOut={false}>
      <Camera y={lerp(540, 700, pull)} zoom={lerp(1, 0.8, pull)}>
        <Panel t={t} seats={seats} report={{ show: 1, glow: glance * (0.7 + 0.3 * Math.sin(t * 7)) }} />
      </Camera>
      <Chapter show={ramp(t, 0.1, 0.6)}>The easy version</Chapter>
      <DotGrid x={250} y={770} n={data.pilot.total} bad={data.pilot.adopted} cols={40} size={20} gap={8} show={ramp(t, tCount, tCount + 1)} seed="easy" />
      <Stat x={1450} y={736} show={pop(t, tZero)} value={data.pilot.adopted} label={`of ${data.pilot.total} answers fooled`} color={colors.truth} size={150} w={420} />
      <Sfx name="plop" at={tOne} volume={0.45} />
      <Sfx name="wrong" at={tOne + 0.35} volume={0.3} />
      <Sfx name="sweep" at={tCount} volume={0.3} />
      <Sfx name="ding" at={tZero} volume={0.35} />
    </Shell>
  );
};

/** Report removed, three of five answers wrong: now it works. */
export const Hard: React.FC = () => {
  const t = useT();
  const c = cueOf("hard");
  const tAway = c("took the report away");
  const tWord = c("each other's word");
  const tMore = c("more impostors");
  const tThree = c("three of the five");
  const tWorked = c("it worked");
  const tTen = c("about one time in ten");
  const tOlder = c("Earlier and smaller");
  const lift = ramp(t, tAway, tAway + 0.9);
  const pull = ramp(t, tTen - 0.7, tTen);
  const focus = ramp(t, tThree - 0.2, tThree + 0.3) * (1 - pull);
  const wrong = ramp(t, tWorked, tWorked + 0.5);
  const seen = [1, 2, 4, 5, 6];
  const seats = makeSeats(({ slot, plant, k }) => {
    if (plant) {
      return slot === 4
        ? { show: 1, mask: 1, bubble: 1 }
        : { show: pop(t, tMore + k * 0.12), mask: pop(t, tMore + 0.15 + k * 0.12), bubble: pop(t, tMore + 0.4 + k * 0.12) };
    }
    return {
      show: 1, bubble: 1, wrong: slot === 3 ? wrong : 0,
      look: t > tWord && t < tThree ? Math.sin((t - tWord) * 5 + k * 1.7) : 0,
      dim: slot === 3 || seen.includes(slot) ? 0 : focus, focus: slot === 3 ? focus : 0,
    };
  });
  return (
    <Shell seconds={sceneSeconds("hard")} fadeIn={false}>
      <Camera y={lerp(lerp(540, 500, focus), 700, pull)} zoom={lerp(lerp(1, 1.1, focus), 0.8, pull)}>
        <Panel t={t} seats={seats} report={{ show: 1, lift }} />
      </Camera>
      <Chapter show={ramp(t, 0.1, 0.6)}>Turning up the pressure</Chapter>
      <P x={0} y={132} w={1920} show={focus} style={{ textAlign: "center" }}>
        <span style={pill}>Each model sees five answers. <b style={{ color: colors.error }}>Three are wrong.</b></span>
      </P>
      {TEAMS.map((team, i) => {
        const { fooled, n } = data.counts[team].ANON;
        const at = i === 0 ? tTen : tOlder + (i - 1) * 0.6;
        return (
          <React.Fragment key={team}>
            <P x={190 + i * 556} y={690} w={460} show={pop(t, at, false)}>
              <div style={{ fontFamily: display, fontWeight: 700, fontSize: 33 }}>{teamLabel[team]}</div>
              <div style={{ fontSize: 26, color: colors.muted }}>
                <b style={{ color: colors.error }}>{fooled}</b> of {n} answers fooled
              </div>
            </P>
            <DotGrid x={190 + i * 556} y={778} n={n} bad={fooled} cols={24} size={11} gap={5} show={ramp(t, at, at + 0.7)} badShow={ramp(t, at + 0.35, at + 1.1)} seed={`hard-${team}`} />
            <Sfx name="sweep" at={at} volume={0.25} />
          </React.Fragment>
        );
      })}
      <Sfx name="whoosh" at={tAway} volume={0.4} />
      <Sfx name="plop" at={tMore} volume={0.45} />
      <Sfx name="plop" at={tMore + 0.24} volume={0.45} />
      <Sfx name="flip" at={tWorked + 0.15} volume={0.5} />
      <Sfx name="wrong" at={tWorked + 0.2} volume={0.5} />
    </Shell>
  );
};

/** The error leaves the meeting in the final answer; then the boundary where it vanishes. */
export const Final: React.FC = () => {
  const t = useT();
  const c = cueOf("final");
  const tStay = c("didn't stay");
  const tPerson = c("a person would");
  const tUpTo = c("up to three times");
  const tNotice = c("notice what it took");
  const tBack = c("Put the report back");
  const tOne = c("just one impostor");
  const tVanish = c("one answer fooled");
  const part1 = 1 - ramp(t, tNotice - 0.3, tNotice + 0.2);
  const part2 = ramp(t, tNotice, tNotice + 0.4);
  const { adopted, total } = data.boundary;
  return (
    <Shell seconds={sceneSeconds("final")}>
      <Chapter show={ramp(t, 0.1, 0.6)}>Out of the meeting</Chapter>
      <div style={{ position: "absolute", inset: 0, opacity: part1 }}>
        <Bot x={190} y={450} t={t} seed={1} color={botColors[0]} s={0.78} show={pop(t, 0.2)} />
        <Bot x={320} y={450} t={t} seed={2} color={colors.plant} s={0.78} plant mask={1} show={pop(t, 0.3)} />
        <Bot x={450} y={450} t={t} seed={3} color={botColors[2]} s={0.78} alarm={1} show={pop(t, 0.4)} />
        <P x={120} y={596} w={400} show={pop(t, 0.5, false)} style={{ textAlign: "center", fontSize: 28, color: colors.muted }}>the meeting</P>
        <P x={548} y={416} show={pop(t, tStay + 0.2, false)} style={{ fontFamily: display, fontSize: 70, color: colors.grid }}>→</P>
        <P x={650} y={318} w={640} show={pop(t, tStay + 0.2)} grow style={{ background: colors.paper, color: colors.ink, borderRadius: 18, padding: "34px 40px", boxSizing: "border-box", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
          <div style={{ fontFamily: mono, fontSize: 21, letterSpacing: 2, color: "#6b7280" }}>THE TEAM'S FINAL ANSWER</div>
          <div style={{ fontFamily: display, fontWeight: 700, fontSize: 46, lineHeight: 1.2, marginTop: 12 }}>
            The repair was delayed by <span style={{ color: "#c0262d" }}>41 months</span>.
          </div>
        </P>
        <P x={1320} y={416} show={pop(t, tPerson, false)} style={{ fontFamily: display, fontSize: 70, color: colors.grid }}>→</P>
        <Person x={1580} y={450} s={1.2} show={pop(t, tPerson)} />
        <P x={1430} y={596} w={300} show={pop(t, tPerson + 0.2, false)} style={{ textAlign: "center", fontSize: 28, color: colors.muted }}>the person who asked</P>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: 300 + i * 78, top: 728, width: 54, height: 70, borderRadius: 8,
              background: i < 3 && t > tUpTo + i * 0.12 ? colors.error : colors.paper, opacity: clamp01(pop(t, tUpTo - 0.6 + i * 0.04, false)) * (i < 3 ? 1 : 0.55),
            }}
          />
        ))}
        <P x={1130} y={716} w={700} show={pop(t, tUpTo)} grow style={{ transformOrigin: "left center" }}>
          <div style={{ fontFamily: display, fontWeight: 700, fontSize: 60, lineHeight: 1 }}>up to <span style={{ color: colors.error }}>3 in 10</span></div>
          <div style={{ fontSize: 26, color: colors.muted, marginTop: 10 }}>
            {data.verification.map((v, i) => `${["newest", "earlier", "small"][i]} ${pct(v.final_none)}`).join(" · ")} of final answers
          </div>
        </P>
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: part2 }}>
        <P x={0} y={150} w={1920} style={{ textAlign: "center" }}>
          <span style={{ ...pill, opacity: clamp01(pop(t, tBack, false)) }}>Put the report back</span>
          <span style={{ ...pill, opacity: clamp01(pop(t, tOne, false)) }}>or leave just one impostor</span>
        </P>
        <DotGrid x={431} y={290} n={total} bad={adopted} cols={56} size={13} gap={6} show={ramp(t, tBack, tOne + 0.8)} badShow={t > tVanish ? 1 : 0} ring={pop(t, tVanish) * (0.75 + 0.25 * Math.sin(t * 6))} seed="boundary" />
        <Stat x={431} y={690} show={pop(t, tVanish + 0.15)} value={<>{adopted} <span style={{ color: colors.muted, fontSize: 70 }}>in {total.toLocaleString("en-US")}</span></>} label="answers fooled" color={colors.error} size={110} w={900} />
      </div>
      <Sfx name="whoosh" at={tStay} volume={0.35} />
      <Sfx name="wrong" at={tUpTo} volume={0.4} />
      <Sfx name="sweep" at={tBack} volume={0.3} />
      <Sfx name="pop" at={tVanish} volume={0.45} />
    </Shell>
  );
};
