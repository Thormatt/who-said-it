import React from "react";
import { clamp01 } from "./kit";
import { botColors, colors, display, font, mono } from "./theme";

/** The meeting: eight seats behind one long desk. Plants sit among the real models. */
export const SLOT_X = [195, 405, 615, 825, 1095, 1305, 1515, 1725];
export const PLANT_SLOTS = [1, 4, 6];
export const REAL_SLOTS = [0, 2, 3, 5, 7];
export const HEAD_Y = 560;
const BUBBLE_Y = HEAD_Y - 178;

export type Plate = { text: string; tone: string; ink?: string };
export type Seat = {
  plant: boolean;
  show: number;
  bubble?: number;
  /** real models only: 0 = holds "14 months", 1 = switched to "41 months" */
  wrong?: number;
  mask?: number;
  look?: number;
  dim?: number;
  focus?: number;
  plate?: Plate;
  plateFrom?: Plate;
  /** 0 shows plateFrom (or nothing), 1 shows plate */
  flip?: number;
  chip?: { text: string; tone: string; show: number };
};

export const makeSeats = (build: (info: { slot: number; plant: boolean; k: number }) => Omit<Seat, "plant">): Seat[] =>
  SLOT_X.map((_, slot) => {
    const plant = PLANT_SLOTS.includes(slot);
    const k = (plant ? PLANT_SLOTS : REAL_SLOTS).indexOf(slot);
    return { plant, ...build({ slot, plant, k }) };
  });

export const Bot: React.FC<{
  x: number; y: number; t: number; seed: number; color: string; s?: number; show?: number;
  plant?: boolean; mask?: number; look?: number; lookY?: number; alarm?: number; checker?: boolean; dim?: number;
}> = ({ x, y, t, seed, color, s = 1, show = 1, plant = false, mask = 0, look = 0, lookY = 0, alarm = 0, checker = false, dim = 0 }) => {
  const bob = Math.sin(t * 1.7 + seed * 2.3) * 3;
  const blink = (t * 0.9 + seed * 0.61) % 3.3 < 0.11 ? 0.12 : 1;
  const eye = alarm > 0.5 ? colors.error : "#eaf6ff";
  const shake = alarm > 0.02 && alarm < 0.98 ? Math.sin(t * 60) * 4 : 0;
  const eyeStyle = (cx: number): React.CSSProperties => ({
    position: "absolute", left: cx - 9 + look * 7, top: -8 - 12 * blink + lookY * 5, width: 18, height: 24 * blink,
    borderRadius: 9, background: eye, boxShadow: `0 0 12px ${eye}`,
  });
  return (
    <div
      style={{
        position: "absolute", left: x, top: y + bob, width: 0, height: 0, opacity: clamp01(show * 1.4) * (1 - 0.72 * dim),
        transform: `translateX(${shake}px) scale(${s * (0.5 + 0.5 * show)})`,
      }}
    >
      <div style={{ position: "absolute", left: -74, top: 40, width: 148, height: 130, borderRadius: "56px 56px 16px 16px", background: color, filter: "brightness(0.74)" }} />
      <div style={{ position: "absolute", left: -3, top: -82, width: 6, height: 26, background: color, filter: "brightness(0.74)" }} />
      <div style={{ position: "absolute", left: -10, top: -98, width: 20, height: 20, borderRadius: 10, background: checker ? colors.truth : plant ? "#c9d1e0" : "#ffffff" }} />
      <div
        style={{
          position: "absolute", left: -66, top: -58, width: 132, height: 114, borderRadius: 40, background: color,
          boxShadow: `inset 0 -10px 0 rgba(0,0,0,0.13), 0 12px 26px rgba(0,0,0,0.38), 0 0 0 ${7 * alarm}px rgba(240,82,82,0.85)`,
        }}
      />
      <div style={{ position: "absolute", left: -50, top: -36, width: 100, height: 62, borderRadius: 26, background: "#0c1528" }} />
      {plant ? (
        <div style={{ position: "absolute", left: 0, top: 0, opacity: clamp01(mask * 1.5), transform: `translateY(${(1 - Math.min(1, mask)) * -46}px)` }}>
          <div style={{ position: "absolute", left: -73, top: -24, width: 146, height: 32, borderRadius: 7, background: "#c0262d" }} />
          <div style={{ position: "absolute", left: 66, top: -22, width: 26, height: 11, borderRadius: 3, background: "#c0262d", transform: "rotate(24deg)" }} />
          <div style={{ position: "absolute", left: 66, top: -6, width: 24, height: 10, borderRadius: 3, background: "#a51f25", transform: "rotate(-18deg)" }} />
        </div>
      ) : null}
      <div style={eyeStyle(-22)} />
      <div style={eyeStyle(22)} />
      <div style={{ position: "absolute", left: -11, top: 14, width: 22, height: 4, borderRadius: 2, background: "#3b4a6b" }} />
      {checker ? (
        <>
          <div style={{ position: "absolute", left: -2, top: -32, width: 48, height: 48, borderRadius: 24, border: `6px solid ${colors.truth}` }} />
          <div style={{ position: "absolute", left: 40, top: 12, width: 34, height: 8, borderRadius: 4, background: colors.truth, transform: "rotate(42deg)", transformOrigin: "left center" }} />
        </>
      ) : null}
    </div>
  );
};

/** Speech bubble holding an answer. `wrong` flips it from "14 months" to "41 months". */
export const Bubble: React.FC<{ x: number; y: number; show: number; wrong?: number; s?: number; dim?: number }> = ({
  x, y, show, wrong = 0, s = 1, dim = 0,
}) => {
  const isWrong = wrong > 0.5;
  const squash = Math.abs(1 - 2 * clamp01(wrong));
  const tone = isWrong ? colors.error : colors.truth;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity: clamp01(show * 2) * (1 - 0.72 * dim), transform: `scale(${s * show})` }}>
      <div style={{ position: "absolute", left: -11, top: 16, width: 22, height: 22, background: tone, transform: `rotate(45deg) scale(${squash})` }} />
      <div
        style={{
          position: "absolute", left: -80, top: -31, width: 160, height: 62, borderRadius: 19, background: tone, transform: `scaleX(${squash})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: display, fontWeight: 700, fontSize: 27, color: colors.ink,
          boxShadow: "0 8px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap",
        }}
      >
        {isWrong ? "41 months" : "14 months"}
      </div>
    </div>
  );
};

/** A sheet of paper with ruled lines; line `hot` is the fact that matters. */
export const Paper: React.FC<{
  x: number; y: number; w: number; h: number; show?: number; glow?: number; rotate?: number; lines?: number; hot?: number; opacity?: number;
}> = ({ x, y, w, h, show = 1, glow = 0, rotate = 0, lines = 5, hot = 2, opacity = 1 }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, width: w, height: h, borderRadius: w * 0.07, background: colors.paper, opacity: clamp01(show) * opacity,
      transform: `rotate(${rotate}deg) scale(${0.6 + 0.4 * show})`, padding: `${h * 0.12}px ${w * 0.13}px`, boxSizing: "border-box",
      boxShadow: `0 10px 24px rgba(0,0,0,0.4), 0 0 ${40 * glow}px ${12 * glow}px rgba(52,195,143,0.55)`,
    }}
  >
    <div style={{ width: "55%", height: h * 0.07, borderRadius: 4, background: colors.ink, marginBottom: h * 0.09 }} />
    {Array.from({ length: lines }, (_, i) => (
      <div key={i} style={{ width: i === hot ? "100%" : `${88 - (i % 3) * 14}%`, height: h * 0.055, borderRadius: 4, marginBottom: h * 0.065, background: i === hot ? colors.truth : "#c9c3b3" }} />
    ))}
  </div>
);

export const Person: React.FC<{ x: number; y: number; show?: number; s?: number }> = ({ x, y, show = 1, s = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, opacity: clamp01(show * 1.4), transform: `scale(${s * (0.5 + 0.5 * show)})` }}>
    <div style={{ position: "absolute", left: -38, top: -70, width: 76, height: 76, borderRadius: 38, background: "#e7dccb" }} />
    <div style={{ position: "absolute", left: -70, top: 16, width: 140, height: 96, borderRadius: "70px 70px 14px 14px", background: "#d2c4ad" }} />
  </div>
);

const PlateCard: React.FC<{ x: number; plate: Plate; scaleY: number }> = ({ x, plate, scaleY }) => (
  <div
    style={{
      position: "absolute", left: x - 78, top: 716, width: 156, height: 46, borderRadius: 8, background: plate.tone, color: plate.ink ?? colors.ink,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: display, fontWeight: 700, fontSize: 23, letterSpacing: 0.5,
      transform: `scaleY(${scaleY})`, boxShadow: "0 4px 10px rgba(0,0,0,0.35)", whiteSpace: "nowrap",
    }}
  >
    {plate.text}
  </div>
);

/** The whole meeting. Draw order gives the depth: bots, report, desk, name plates, bubbles. */
export const Panel: React.FC<{ t: number; seats: Seat[]; report?: { show: number; lift?: number; glow?: number } }> = ({ t, seats, report }) => {
  const lift = report?.lift ?? 0;
  return (
    <>
      <div style={{ position: "absolute", left: 110, top: 230, width: 1700, height: 600, background: "radial-gradient(closest-side, rgba(110,140,235,0.22), transparent)" }} />
      {seats.map((seat, slot) => (
        <React.Fragment key={slot}>
          {seat.focus ? (
            <div style={{ position: "absolute", left: SLOT_X[slot] - 104, top: HEAD_Y - 104, width: 208, height: 208, borderRadius: 104, border: `5px dashed ${colors.flagship}`, opacity: clamp01(seat.focus), boxSizing: "border-box" }} />
          ) : null}
          <Bot
            x={SLOT_X[slot]} y={HEAD_Y} t={t} seed={slot} show={seat.show} plant={seat.plant} mask={seat.mask} look={seat.look} dim={seat.dim}
            color={seat.plant ? colors.plant : botColors[REAL_SLOTS.indexOf(slot)]} alarm={seat.plant ? 0 : seat.wrong}
          />
        </React.Fragment>
      ))}
      {report ? (
        <>
          <div style={{ position: "absolute", left: 901, top: 505, width: 118, height: 165, borderRadius: 10, border: `3px dashed ${colors.error}`, boxSizing: "border-box", opacity: clamp01(lift) * 0.8 }} />
          <div style={{ position: "absolute", left: 860, top: 468, width: 200, textAlign: "center", fontFamily: mono, fontSize: 17, fontWeight: 700, letterSpacing: 1, color: colors.error, opacity: clamp01(lift * 2 - 1) }}>
            REPORT REMOVED
          </div>
          <Paper x={901} y={505 - lift * 640} w={118} h={165} show={report.show} glow={report.glow} rotate={lift * 16} opacity={1 - clamp01((lift - 0.7) / 0.3)} />
        </>
      ) : null}
      <div style={{ position: "absolute", left: 70, top: 640, width: 1780, height: 46, borderRadius: "18px 18px 0 0", background: colors.deskTop }} />
      <div style={{ position: "absolute", left: 70, top: 686, width: 1780, height: 122, borderRadius: "0 0 22px 22px", background: colors.deskFront, boxShadow: "0 24px 40px rgba(0,0,0,0.45)" }} />
      {seats.map((seat, slot) => {
        const flip = seat.flip ?? 1;
        const plate = flip >= 0.5 ? seat.plate : seat.plateFrom;
        if (!plate || seat.show < 0.5) return null;
        return <PlateCard key={slot} x={SLOT_X[slot]} plate={plate} scaleY={Math.abs(2 * clamp01(flip) - 1)} />;
      })}
      {seats.map((seat, slot) => (
        <React.Fragment key={slot}>
          <Bubble x={SLOT_X[slot]} y={BUBBLE_Y} show={seat.bubble ?? 0} wrong={seat.plant ? 1 : seat.wrong} dim={seat.dim} />
          {seat.chip ? (
            <div
              style={{
                position: "absolute", left: SLOT_X[slot] - 105, top: BUBBLE_Y - 88, width: 210, textAlign: "center",
                opacity: clamp01(seat.chip.show), transform: `scale(${0.6 + 0.4 * seat.chip.show})`,
              }}
            >
              <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 8, border: `2px solid ${seat.chip.tone}`, color: seat.chip.tone, background: "rgba(6,10,22,0.85)", fontFamily: font, fontWeight: 700, fontSize: 22, whiteSpace: "nowrap" }}>
                {seat.chip.text}
              </span>
            </div>
          ) : null}
        </React.Fragment>
      ))}
    </>
  );
};
