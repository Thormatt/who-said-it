import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { Captions, Narration } from "./components";
import data from "./data.json";
import durations from "./durations.json";
import narration from "./narration.json";
import { AttributionScene, GenerationScene, PressureScene } from "./scenes/Findings";
import { PilotScene, SetupScene, TitleScene } from "./scenes/Intro";
import { CreditsScene, FlagsScene, TakeawaysScene, VerificationScene } from "./scenes/Outro";
import { FPS, SCENE_PADDING_SECONDS } from "./theme";

type SceneId = keyof typeof durations;

const followups = data.followups as { conf: string | null; ev: string | null };

const render = (id: SceneId, seconds: number): React.ReactNode => {
  switch (id) {
    case "title": return <TitleScene />;
    case "setup": return <SetupScene seconds={seconds} />;
    case "pilot": return <PilotScene seconds={seconds} />;
    case "pressure": return <PressureScene seconds={seconds} />;
    case "generation": return <GenerationScene seconds={seconds} />;
    case "attribution": return <AttributionScene seconds={seconds} followup={followups.conf} />;
    case "verification": return <VerificationScene seconds={seconds} />;
    case "flags": return <FlagsScene seconds={seconds} followup={followups.ev} />;
    case "takeaways": return <TakeawaysScene seconds={seconds} />;
    default: return <CreditsScene />;
  }
};

export const sceneFrames = (id: SceneId): number =>
  Math.ceil((durations[id] + SCENE_PADDING_SECONDS) * FPS);

export const totalFrames = (): number =>
  narration.reduce((sum, s) => sum + sceneFrames(s.id as SceneId), 0);

export const Explainer: React.FC = () => (
  <AbsoluteFill style={{ background: "#0d1321" }}>
    <Series>
      {narration.map(({ id, text }) => {
        const sceneId = id as SceneId;
        const seconds = durations[sceneId] + SCENE_PADDING_SECONDS;
        return (
          <Series.Sequence key={id} durationInFrames={sceneFrames(sceneId)} premountFor={FPS}>
            {render(sceneId, seconds)}
            <Narration id={id} />
            <Captions text={text.replace(/\s*FOLLOWUP_\w+/g, "")} seconds={durations[sceneId]} />
          </Series.Sequence>
        );
      })}
    </Series>
  </AbsoluteFill>
);
