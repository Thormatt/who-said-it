import React from "react";
import { AbsoluteFill, Series, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Captions } from "./kit";
import { Cold, Game, Title, Why } from "./scenes/act1";
import { Easy, Final, Hard } from "./scenes/act2";
import { TagFake, Tags } from "./scenes/act3";
import { Checker, Twist } from "./scenes/act4";
import { Credits, Ending } from "./scenes/act5";
import { FPS, colors } from "./theme";
import { sceneFrames, scenes, totalFrames } from "./timing";

export { totalFrames };

const SCENES: Record<string, React.FC> = {
  cold: Cold, title: Title, why: Why, game: Game, easy: Easy, hard: Hard, final: Final,
  tags: Tags, tagfake: TagFake, checker: Checker, twist: Twist, ending: Ending, credits: Credits,
};

/** Slow-moving light and a faint dot grid behind every scene, so cuts never land on flat color. */
const Backdrop: React.FC = () => {
  const a = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill
      style={{
        background: [
          `radial-gradient(1300px 760px at ${50 + Math.sin(a * 0.11) * 18}% ${36 + Math.cos(a * 0.09) * 10}%, #1b2a55 0%, transparent 66%)`,
          `radial-gradient(1000px 640px at ${72 + Math.cos(a * 0.07) * 18}% 92%, #241a4d 0%, transparent 62%)`,
          colors.bg,
        ].join(", "),
      }}
    >
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1.6px, transparent 1.6px)", backgroundSize: "46px 46px", backgroundPosition: `${a * 4}px ${a * 2.5}px` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 56%, rgba(0,0,0,0.5) 100%)" }} />
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC = () => (
  <div style={{ position: "absolute", left: 0, bottom: 0, height: 5, width: `${(useCurrentFrame() / totalFrames()) * 100}%`, background: colors.flagship, opacity: 0.85 }} />
);

export const Explainer: React.FC = () => (
  <AbsoluteFill style={{ background: colors.bg }}>
    <Backdrop />
    <Series>
      {scenes.map(({ id, text }) => {
        const Scene = SCENES[id];
        return (
          <Series.Sequence key={id} durationInFrames={sceneFrames(id)} premountFor={FPS}>
            <Scene />
            {text ? (
              <>
                <Audio src={staticFile(`audio/${id}.wav`)} />
                <Captions id={id} />
              </>
            ) : null}
          </Series.Sequence>
        );
      })}
    </Series>
    <Audio src={staticFile("audio/music.wav")} />
    <ProgressBar />
  </AbsoluteFill>
);
