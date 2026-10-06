type Pose = "idle" | "thinking" | "cheering";

function RobotBody({ pose }: { pose: Pose }) {
  const left = pose === "cheering" ? { x: 34, y: 48 } : pose === "thinking" ? { x: 78, y: 96 } : { x: 36, y: 108 };
  const right = pose === "cheering" ? { x: 126, y: 48 } : { x: 124, y: 108 };
  return (
    <g>
      <line x1="70" y1="118" x2="58" y2="148" stroke="#1d4e89" strokeWidth="8" strokeLinecap="round" />
      <line x1="90" y1="118" x2="102" y2="148" stroke="#1d4e89" strokeWidth="8" strokeLinecap="round" />
      <line x1="54" y1="78" x2={left.x} y2={left.y} stroke="#1d4e89" strokeWidth="8" strokeLinecap="round" />
      <line x1="106" y1="78" x2={right.x} y2={right.y} stroke="#1d4e89" strokeWidth="8" strokeLinecap="round" />
      <rect x="48" y="64" width="64" height="58" rx="22" fill="#f7fbff" stroke="#1d4e89" strokeWidth="4" />
      <circle cx="80" cy="40" r="26" fill="#f7fbff" stroke="#1d4e89" strokeWidth="4" />
      <circle cx="54" cy="40" r="8" fill="#2f6fbe" />
      <circle cx="106" cy="40" r="8" fill="#2f6fbe" />
      <circle cx="70" cy="40" r="4" fill="#1d2433" />
      <circle cx="90" cy="40" r="4" fill="#1d2433" />
      <path d="M68 50 Q80 58 92 50" fill="none" stroke="#1d2433" strokeWidth="3" strokeLinecap="round" />
      <circle cx="62" cy="48" r="3" fill="#f2b6c6" />
      <circle cx="98" cy="48" r="3" fill="#f2b6c6" />
      <circle cx="80" cy="92" r="10" fill="none" stroke="#2f6fbe" strokeWidth="3" />
      <path d="M80 84 L83 92 L80 96 L77 92 Z" fill="#2f6fbe" />
      <line x1="80" y1="14" x2="80" y2="6" stroke="#1d4e89" strokeWidth="3" />
      <circle cx="80" cy="5" r="4" fill="#f27a1a" />
    </g>
  );
}

export function RobotSprite({ pose }: { pose: Pose }) {
  const label = pose === "idle" ? "Pip standing ready" : pose === "thinking" ? "Pip thinking with a hand near the chin" : "Pip cheering with both arms up";
  return (
    <svg className="robot" viewBox="0 0 160 160" role="img" aria-label={label}>
      <title>{label}</title>
      <RobotBody pose={pose} />
      {pose === "thinking" ? (
        <text x="118" y="36" fontSize="28" fill="#1d4e89" fontFamily="Trebuchet MS, sans-serif">
          ?
        </text>
      ) : null}
      {pose === "cheering" ? (
        <g fill="#f2b544">
          <path d="M28 40 L32 32 L36 40 L32 38 Z" />
          <path d="M126 36 L130 28 L134 36 L130 34 Z" />
        </g>
      ) : null}
    </svg>
  );
}

export function WorkshopArt() {
  const tiles = [
    { x: 48, fill: "#7a4ea3" },
    { x: 92, fill: "#2f6fbe" },
    { x: 136, fill: "#3c8d62" },
    { x: 180, fill: "#e07a2f" },
    { x: 224, fill: "#f4d35e" },
  ];
  return (
    <svg className="world-art" viewBox="0 0 640 240" role="img" aria-labelledby="workshop-title">
      <title id="workshop-title">Equivalent Workshop, a wooden room with shelves, tools, and a lamp. The colored tiles have no fraction values.</title>
      <rect width="640" height="240" fill="#f3d7b0" />
      {Array.from({ length: 8 }, (_, index) => (
        <rect key={index} x={index * 80} width="80" height="168" fill={index % 2 === 0 ? "#e7c49a" : "#efd0a6"} />
      ))}
      <rect y="168" width="640" height="72" fill="#c89662" />
      {Array.from({ length: 16 }, (_, index) => (
        <line key={index} x1={index * 40} y1="168" x2={index * 40 + 20} y2="240" stroke="#a87445" strokeWidth="2" />
      ))}
      <rect x="28" y="36" width="280" height="14" rx="3" fill="#8a5a34" />
      {tiles.map((tile) => (
        <rect key={tile.x} x={tile.x} y="54" width="36" height="28" rx="4" fill={tile.fill} stroke="#1d2433" strokeWidth="2" />
      ))}
      <rect x="28" y="96" width="280" height="14" rx="3" fill="#8a5a34" />
      <rect x="48" y="114" width="36" height="22" rx="3" fill="#e07a2f" stroke="#1d2433" strokeWidth="2" />
      <rect x="92" y="114" width="36" height="22" rx="3" fill="#2f6fbe" stroke="#1d2433" strokeWidth="2" />
      <rect x="136" y="114" width="36" height="22" rx="3" fill="#7a4ea3" stroke="#1d2433" strokeWidth="2" />
      <rect x="360" y="118" width="200" height="16" rx="3" fill="#6d4424" />
      <rect x="390" y="134" width="14" height="40" fill="#6d4424" />
      <rect x="516" y="134" width="14" height="40" fill="#6d4424" />
      <path d="M372 112 h28 v-22 h8 v-16 h-8 v-8 h-20 v8 h-8 z" fill="#d9d9d9" stroke="#1d2433" strokeWidth="2" />
      <path d="M430 78 v34 h18 v-10 h-8 v-24 z" fill="#8a5a34" stroke="#1d2433" strokeWidth="2" />
      <rect x="448" y="70" width="22" height="12" rx="2" fill="#7a7a7a" stroke="#1d2433" strokeWidth="2" />
      <rect x="560" y="132" width="48" height="28" rx="4" fill="#2f6fbe" stroke="#1d2433" strokeWidth="2" />
      <circle cx="470" cy="42" r="26" fill="#f4d35e" />
      <circle cx="470" cy="42" r="16" fill="#fff4c2" />
      <rect x="462" y="68" width="16" height="36" fill="#333" />
      <ellipse cx="250" cy="214" rx="78" ry="16" fill="#3d6ea8" />
      <rect x="70" y="188" width="16" height="28" fill="#6d4424" />
      <rect x="150" y="188" width="16" height="28" fill="#6d4424" />
      <ellipse cx="118" cy="186" rx="56" ry="10" fill="#a87445" />
      <rect x="300" y="150" width="8" height="28" fill="#3c8d62" />
      <ellipse cx="304" cy="146" rx="16" ry="10" fill="#3c8d62" />
      <ellipse cx="292" cy="156" rx="12" ry="8" fill="#2f6f4f" />
    </svg>
  );
}

const TRAIL_MARKS = [
  { x: 80, label: "0" },
  { x: 200, label: "1/2" },
  { x: 320, label: "1" },
  { x: 440, label: "3/2" },
  { x: 560, label: "2" },
];

export function TrailArt() {
  return (
    <svg className="world-art" viewBox="0 0 640 220" role="img" aria-labelledby="trail-title">
      <title id="trail-title">Addition Trail. The path is a number line from 0 to 2, with equal spaces at 0, 1/2, 1, 3/2, and 2.</title>
      <rect width="640" height="220" fill="#cfe9ff" />
      <circle cx="540" cy="36" r="18" fill="#fffdf8" />
      <circle cx="556" cy="32" r="14" fill="#fffdf8" />
      <path d="M0 120 C120 70 180 150 320 110 C460 70 520 150 640 100 L640 220 L0 220 Z" fill="#8fbf6a" />
      <path d="M40 150 C140 120 200 170 300 146" fill="none" stroke="#67a34a" strokeWidth="8" strokeLinecap="round" />
      <circle cx="70" cy="92" r="22" fill="#2f6f4f" />
      <rect x="64" y="108" width="12" height="28" fill="#6d4424" />
      <circle cx="150" cy="78" r="18" fill="#3c8d62" />
      <rect x="145" y="92" width="10" height="24" fill="#6d4424" />
      <circle cx="590" cy="86" r="20" fill="#2f6f4f" />
      <rect x="584" y="100" width="12" height="26" fill="#6d4424" />
      <circle cx="96" cy="168" r="5" fill="#f4d35e" />
      <circle cx="250" cy="176" r="5" fill="#e07a2f" />
      <circle cx="410" cy="172" r="5" fill="#f27a1a" />
      <line x1="80" y1="132" x2="560" y2="132" stroke="#f7e7c6" strokeWidth="18" strokeLinecap="round" />
      <line x1="80" y1="132" x2="560" y2="132" stroke="#1d2433" strokeWidth="4" />
      {TRAIL_MARKS.map((mark) => (
        <g key={mark.label}>
          <line x1={mark.x} y1="118" x2={mark.x} y2="146" stroke="#1d2433" strokeWidth="3" />
          <text x={mark.x} y="108" textAnchor="middle" fontSize="18" fontFamily="Trebuchet MS, sans-serif" fill="#1d2433">
            {mark.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function IconCheck() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="icon">
      <rect x="3" y="3" width="26" height="26" rx="6" fill="#1f7a4d" />
      <path d="M8 16 L14 22 L24 10" fill="none" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

export function IconHint() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="icon">
      <circle cx="16" cy="13" r="7" fill="#f4d35e" stroke="#1d2433" strokeWidth="2" />
      <rect x="13" y="20" width="6" height="6" rx="1" fill="#f4d35e" stroke="#1d2433" strokeWidth="2" />
    </svg>
  );
}

export function IconEdit() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="icon">
      <path d="M8 24 L12 14 L20 6 L26 12 L18 20 Z" fill="#efe7ff" stroke="#1d2433" strokeWidth="2" />
      <path d="M8 24 L6 28 L12 24" fill="#7aa2d6" />
    </svg>
  );
}

export function IconPractice() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="icon">
      <path d="M16 6 a10 10 0 1 1 -7 3" fill="none" stroke="#c2410c" strokeWidth="3" />
      <path d="M16 6 L20 8 L16 12" fill="#c2410c" />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon star-icon">
      <path d="M12 3 L14.6 9.2 L21 9.8 L16.2 14 L17.8 20.4 L12 17 L6.2 20.4 L7.8 14 L3 9.8 L9.4 9.2 Z" fill="#f2b544" stroke="#1d2433" strokeWidth="1" />
    </svg>
  );
}
