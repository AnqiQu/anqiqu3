import { benchmarks } from "../content";

const SIZE = 520;
const CENTER = SIZE / 2;
const RADIUS = 150;
const LABEL_VALUE = 118;
const RINGS = [20, 40, 60, 80, 100];

const TONE_COLORS: Record<string, string> = {
  anqi: "#80ed99",
  chatgpt: "#c9cfcb",
  claude: "#e0996b",
};

type Point = { x: number; y: number };

function point(axisIndex: number, axisCount: number, value: number): Point {
  const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / axisCount;
  const r = (value / 100) * RADIUS;
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  };
}

function polygonPoints(scores: readonly number[]): string {
  return scores
    .map((score, i) => {
      const p = point(i, scores.length, score);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
}

function average(scores: readonly number[]): number {
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

export function Benchmarks() {
  const { axes, models, excluded } = benchmarks;
  const axisCount = axes.length;

  return (
    <div className="benchmark-layout">
      <div className="benchmark-chart-card">
        <div className="benchmark-chart-head">
          <p className="eyebrow">ANQIBENCH · INTERNAL, UNPUBLISHED</p>
          <span className="benchmark-badge">v2 · 0-SHOT</span>
        </div>

        <svg
          className="benchmark-radar"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="AnqiBench radar chart. Anqi leads on SoupEval-2, H2O-Bench, and EmoBench; ChatGPT 5.6 and Claude Fable lead on Bug-STOMP and image classification."
        >
          {RINGS.map((ring) => (
            <polygon
              key={ring}
              className="benchmark-ring"
              points={Array.from({ length: axisCount }, (_, i) => {
                const p = point(i, axisCount, ring);
                return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              }).join(" ")}
            />
          ))}

          {axes.map((axis, i) => {
            const spoke = point(i, axisCount, 100);
            const label = point(i, axisCount, LABEL_VALUE);
            const anchor =
              label.x > CENTER + 5
                ? "start"
                : label.x < CENTER - 5
                  ? "end"
                  : "middle";
            return (
              <g key={axis.key}>
                <line
                  className="benchmark-spoke"
                  x1={CENTER}
                  y1={CENTER}
                  x2={spoke.x}
                  y2={spoke.y}
                />
                <text
                  className="benchmark-axis-label"
                  x={label.x}
                  y={label.y}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                >
                  {axis.label}
                </text>
              </g>
            );
          })}

          {models.map((model) => {
            const color = TONE_COLORS[model.tone] ?? "#ffffff";
            const isAnqi = model.tone === "anqi";
            return (
              <polygon
                key={model.name}
                points={polygonPoints(model.scores)}
                fill={color}
                fillOpacity={isAnqi ? 0.24 : 0.07}
                stroke={color}
                strokeWidth={isAnqi ? 2.4 : 1.5}
                strokeLinejoin="round"
              />
            );
          })}

          {models
            .filter((model) => model.tone === "anqi")
            .flatMap((model) =>
              model.scores.map((score, i) => {
                const p = point(i, axisCount, score);
                return (
                  <circle
                    key={`${model.name}-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={3.4}
                    fill={TONE_COLORS.anqi}
                  />
                );
              }),
            )}
        </svg>
      </div>

      <aside className="benchmark-side">
        <ul className="benchmark-legend">
          {models.map((model) => (
            <li
              key={model.name}
              className={
                model.tone === "anqi" ? "benchmark-legend-anqi" : undefined
              }
            >
              <span
                className="benchmark-swatch"
                style={{ background: TONE_COLORS[model.tone] ?? "#ffffff" }}
                aria-hidden="true"
              />
              <span className="benchmark-legend-name">{model.name}</span>
              <span className="benchmark-legend-score">
                avg {average(model.scores)}
              </span>
            </li>
          ))}
        </ul>

        <div className="benchmark-excluded">
          <p className="eyebrow">EXCLUDED FROM CHART</p>
          <ul>
            {excluded.map((item) => (
              <li key={item.label}>
                <span className="benchmark-excluded-label">{item.label}</span>
                <span className="benchmark-notshown">{item.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
