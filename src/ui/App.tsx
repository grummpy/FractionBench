import { useCallback, useEffect, useState } from "react";
import coverUrl from "../../docs/cover.jpg";
import { silenceSpeech, speakLine } from "../audio/speech";
import { startMusic, stopMusic } from "../audio/engine";
import { defaultAudioSettings, type AudioSettings } from "../audio/settings";
import { dialogue } from "../content/dialogue";
import type { Problem } from "../content/problems";
import { RobotSprite } from "../game/art";
import { LevelMap } from "./LevelMap";
import { Workspace } from "./Workspace";

type Screen =
  | { name: "map" }
  | { name: "play"; problem: Problem; bonus: [Problem, Problem] | null }
  | { name: "bonus"; problems: [Problem, Problem] };

export function App() {
  const [audio, setAudio] = useState<AudioSettings>(defaultAudioSettings);
  const [completed, setCompleted] = useState<string[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [seed, setSeed] = useState(1);
  const [screen, setScreen] = useState<Screen>({ name: "map" });
  const [line, setLine] = useState<string>(dialogue.greetings[0]);
  const [pose, setPose] = useState<"idle" | "thinking" | "cheering">("idle");

  const onLine = useCallback((next: string) => setLine(next), []);
  const onComplete = useCallback((id: string) => {
    setCompleted((current) => (current.includes(id) || id.startsWith("practice-") ? current : [...current, id]));
  }, []);

  useEffect(() => {
    if (audio.speech) speakLine(line, true);
    else silenceSpeech();
  }, [audio.speech, line]);

  useEffect(() => {
    if (!audio.music) {
      stopMusic();
      return;
    }
    const theme = screen.name === "play" ? (screen.problem.world === "equivalent" ? "workshop" : "trail") : "title";
    startMusic(theme);
    return () => stopMusic();
  }, [audio.music, screen]);

  function toggle(key: keyof AudioSettings) {
    setAudio((current) => ({ ...current, [key]: !current[key] }));
  }

  function openBonus(problems: [Problem, Problem], signatures: string[]) {
    setSeen((current) => [...current, ...signatures.filter((signature) => !current.includes(signature))]);
    setSeed((current) => current + 1);
    setScreen({ name: "bonus", problems });
    setLine("Here are two new problems for the same kind of step. They are practice, not a label about you.");
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <img src={coverUrl} alt="FractionBench cover illustration" />
        <div>
          <p className="wordmark">FractionBench</p>
          <p>Learn fractions. Build confidence. Have fun.</p>
        </div>
        <div className="settings">
          <button type="button" role="switch" aria-checked={audio.music} onClick={() => toggle("music")}>
            Music {audio.music ? "on" : "off"}
          </button>
          <button type="button" role="switch" aria-checked={audio.sfx} onClick={() => toggle("sfx")}>
            Sound effects {audio.sfx ? "on" : "off"}
          </button>
          <button type="button" role="switch" aria-checked={audio.speech} onClick={() => toggle("speech")}>
            Read lines aloud {audio.speech ? "on" : "off"}
          </button>
        </div>
      </header>
      <div className="helper-bar">
        <RobotSprite pose={pose} />
        <p data-testid="helper-line">{line}</p>
      </div>
      <div className="captions" data-testid="captions">
        <span>Caption</span>
        <p>{line}</p>
      </div>
      <main id="main">
        {screen.name === "map" ? (
          <LevelMap
            completed={completed}
            onOpen={(problem) => {
              setPose("idle");
              setScreen({ name: "play", problem, bonus: null });
            }}
          />
        ) : null}
        {screen.name === "bonus" ? (
          <section className="bonus" aria-labelledby="bonus-title">
            <h1 id="bonus-title">Try two more</h1>
            <p>Bonus practice for this session. These problems are new, and they are not a score.</p>
            <div className="level-grid">
              {screen.problems.map((problem, index) => (
                <button type="button" key={problem.id} onClick={() => { setPose("idle"); setScreen({ name: "play", problem, bonus: screen.problems }); }}>
                  Bonus {index + 1}. {problem.prompt}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setScreen({ name: "map" })}>
              Back to map
            </button>
          </section>
        ) : null}
        {screen.name === "play" ? (
          <Workspace
            problem={screen.problem}
            audio={audio}
            seed={seed}
            seen={seen}
            onBack={() => {
              setPose("idle");
              setScreen(screen.bonus ? { name: "bonus", problems: screen.bonus } : { name: "map" });
            }}
            onPose={setPose}
            onComplete={onComplete}
            onBonus={openBonus}
            onLine={onLine}
          />
        ) : null}
      </main>
    </>
  );
}
