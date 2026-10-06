import { DENSE_DENOMINATOR } from "../content/limits";

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function isDrawableDenominator(denominator: bigint): boolean {
  return denominator >= 1n && denominator <= BigInt(DENSE_DENOMINATOR);
}

type StripRow = {
  label: string;
  numerator: bigint;
  denominator: bigint;
  pattern: "stripe" | "dot" | "cross";
};

const PATTERNS: Record<StripRow["pattern"], string> = {
  stripe: `<pattern id="stripe" patternUnits="userSpaceOnUse" width="8" height="8"><path d="M0 8 L8 0" stroke="#12315c" stroke-width="2"/></pattern>`,
  dot: `<pattern id="dot" patternUnits="userSpaceOnUse" width="8" height="8"><circle cx="2" cy="2" r="1.4" fill="#9a3412"/></pattern>`,
  cross: `<pattern id="cross" patternUnits="userSpaceOnUse" width="8" height="8"><path d="M1 1 L7 7 M7 1 L1 7" stroke="#1f7a4d" stroke-width="1.5"/></pattern>`,
};

export function fractionStripSvg(title: string, rows: StripRow[]): { svg: string } | { unavailable: string } {
  if (rows.length === 0) return { unavailable: "There is no fraction strip for this step." };
  if (rows.some((row) => !isDrawableDenominator(row.denominator))) {
    return { unavailable: "A denominator here is greater than 60. The exact values stay in the text so the drawing does not crowd the parts." };
  }
  if (rows.some((row) => row.numerator < 0n || row.numerator > row.denominator * 2n)) {
    return { unavailable: "This amount does not fit on a strip of two equal wholes. The exact value stays in the text so the whole is not rescaled." };
  }
  const wholeWidth = 240;
  const wholes = 2;
  const rowHeight = 42;
  const gap = 34;
  const height = rows.length * (rowHeight + gap) + 24;
  const width = wholes * wholeWidth + 16;
  const used = new Set(rows.map((row) => row.pattern));
  const defs = [...used].map((pattern) => PATTERNS[pattern]).join("");
  const body = rows
    .map((row, rowIndex) => {
      const y = 16 + rowIndex * (rowHeight + gap);
      const parts: string[] = [];
      for (let whole = 0; whole < wholes; whole += 1) {
        for (let part = 0; part < Number(row.denominator); part += 1) {
          const index = whole * Number(row.denominator) + part;
          const x = 8 + whole * wholeWidth + (part * wholeWidth) / Number(row.denominator);
          const w = wholeWidth / Number(row.denominator);
          const shaded = BigInt(index) < row.numerator;
          const fill = shaded ? `url(#${row.pattern})` : "#fffdf8";
          parts.push(
            `<rect x="${x}" y="${y}" width="${w}" height="${rowHeight}" fill="${fill}" stroke="#1d2433" stroke-width="2" ${shaded ? "" : 'stroke-dasharray="4 3"'}></rect>`,
          );
        }
      }
      return `${parts.join("")}<text x="8" y="${y + rowHeight + 18}" font-size="16" font-family="Trebuchet MS, sans-serif" fill="#1d2433">${escapeXml(row.label)}</text>`;
    })
    .join("");
  const svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="strip-title"><title id="strip-title">${escapeXml(title)}</title><defs>${defs}</defs><rect width="100%" height="100%" fill="#fff8ee"/>${body}</svg>`;
  return { svg };
}

export type LineMarker = {
  numerator: bigint;
  denominator: bigint;
  label: string;
};

export function numberLineSvg(options: {
  title: string;
  denominator: bigint;
  wholeEnd: 1 | 2;
  markers: LineMarker[];
}): { svg: string } | { unavailable: string } {
  if (!isDrawableDenominator(options.denominator)) {
    return { unavailable: "This partition is greater than 60. The exact values stay in the text." };
  }
  if (options.markers.some((marker) => !isDrawableDenominator(marker.denominator) || marker.numerator < 0n)) {
    return { unavailable: "A marker on this number line is outside the readable range. The exact values stay in the text." };
  }
  const ticks = Number(options.denominator) * options.wholeEnd;
  const unit = 36;
  const width = ticks * unit + 48;
  const height = 120;
  const y = 48;
  const origin = 24;
  const tickMarks: string[] = [];
  for (let tick = 0; tick <= ticks; tick += 1) {
    const x = origin + tick * unit;
    const major = tick % Number(options.denominator) === 0;
    tickMarks.push(`<line x1="${x}" y1="${y - (major ? 16 : 8)}" x2="${x}" y2="${y + (major ? 16 : 8)}" stroke="#1d2433" stroke-width="${major ? 3 : 1.5}"/>`);
    if (major || Number(options.denominator) <= 8) {
      const label = major ? String(tick / Number(options.denominator)) : `${tick % Number(options.denominator)}/${options.denominator.toString()}`;
      tickMarks.push(`<text x="${x}" y="${y + 36}" text-anchor="middle" font-size="14" font-family="Trebuchet MS, sans-serif" fill="#1d2433">${escapeXml(label)}</text>`);
    }
  }
  const markers = options.markers
    .map((marker) => {
      const units = (marker.numerator * options.denominator) / marker.denominator;
      if (marker.numerator * options.denominator % marker.denominator !== 0n) return "";
      if (units > BigInt(ticks)) return "";
      const x = origin + Number(units) * unit;
      return `<circle cx="${x}" cy="${y}" r="7" fill="#9a3412" stroke="#1d2433" stroke-width="2"/><text x="${x}" y="${y - 22}" text-anchor="middle" font-size="16" font-family="Trebuchet MS, sans-serif" fill="#9a3412">${escapeXml(marker.label)}</text>`;
    })
    .join("");
  const svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="line-title"><title id="line-title">${escapeXml(options.title)}</title><rect width="100%" height="100%" fill="#fff8ee"/><line x1="${origin}" y1="${y}" x2="${origin + ticks * unit}" y2="${y}" stroke="#1d2433" stroke-width="4"/>${tickMarks.join("")}${markers}</svg>`;
  return { svg };
}
