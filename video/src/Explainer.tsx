import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { Captions, Narration } from "./components";
import durations from "./durations.json";
import narration from "./narration.json";
import { NameTagScene, PressureScene, TagResultsScene } from "./scenes/Findings";
import { HookScene, PilotScene, Round2Scene, TaskScene, TitleScene } from "./scenes/Intro";
import { CheckerScene, CreditsScene, LimitsScene, TakeawaysScene, WarningsScene } from "./scenes/Outro";
import { FPS, SCENE_PADDING_SECONDS } from "./theme";

type SceneId = keyof typeof durations;

const render = (id: SceneId, seconds: number): React.ReactNode => {
  switch (id) {
    case "hook": return <HookScene seconds={seconds} />;
    case "title": return <TitleScene seconds={seconds} />;
    case "task": return <TaskScene seconds={seconds} />;
    case "round2": return <Round2Scene seconds={seconds} />;
    case "pilot": return <PilotScene seconds={seconds} />;
    case "pressure": return <PressureScene seconds={seconds} />;
    case "nametags": return <NameTagScene seconds={seconds} />;
    case "tagresults": return <TagResultsScene seconds={seconds} />;
    case "checker": return <CheckerScene seconds={seconds} />;
    case "warnings": return <WarningsScene seconds={seconds} />;
    case "limits": return <LimitsScene seconds={seconds} />;
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
