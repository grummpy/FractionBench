import type { Problem } from "../content/problems";
import { PROBLEMS } from "../content/problems";
import { StarIcon, TrailArt, WorkshopArt } from "../game/art";

export function LevelMap({ completed, onOpen }: { completed: string[]; onOpen: (problem: Problem) => void }) {
  const workshop = PROBLEMS.filter((problem) => problem.world === "equivalent");
  const trail = PROBLEMS.filter((problem) => problem.world === "addition");
  return (
    <div className="map">
      <section aria-labelledby="world-1">
        <h2 id="world-1">1 Equivalent Workshop</h2>
        <WorkshopArt />
        <div className="level-grid">
          {workshop.map((problem) => (
            <LevelButton key={problem.id} problem={problem} completed={completed.includes(problem.id)} onOpen={onOpen} />
          ))}
        </div>
      </section>
      <section aria-labelledby="world-2">
        <h2 id="world-2">2 Addition Trail</h2>
        <p>The path is a number line from 0 to 2. Each stop is a problem, not a scored fraction drawing.</p>
        <TrailArt />
        <div className="level-grid">
          {trail.map((problem) => (
            <LevelButton key={problem.id} problem={problem} completed={completed.includes(problem.id)} onOpen={onOpen} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LevelButton({ problem, completed, onOpen }: { problem: Problem; completed: boolean; onOpen: (problem: Problem) => void }) {
  return (
    <button type="button" className="level-button" data-testid={`problem-${problem.id}`} onClick={() => onOpen(problem)}>
      <span className="pid">{problem.id}</span>
      <span>{problem.prompt}</span>
      {completed ? (
        <span className="status-chip">
          <StarIcon /> Completed
        </span>
      ) : (
        <span className="status-chip quiet">Not completed yet</span>
      )}
    </button>
  );
}
