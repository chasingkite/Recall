// Generates the Ch 4.2 trig practice diagrams (right triangles) into public/math/ as
// trig42-<id>.svg. Driven by scripts/lib/trig42-problems.mjs so diagrams always match the
// answers in import-trig42-cards.mjs. iOS-style palette: blue triangle, orange angle arc,
// red unknowns (x / ?), white bg. Run from recall-app/: node scripts/generate-trig42-svgs.mjs
import { writeFileSync, mkdirSync } from 'fs';
import { PRACTICE } from './lib/trig42-problems.mjs';

const OUT = 'public/math';
mkdirSync(OUT, { recursive: true });

const FONT = '-apple-system, Helvetica, Arial, sans-serif';
const BLUE = '#007aff', ORANGE = '#ff9500', RED = '#ff3b30', INK = '#1c1c1e';
const BOX_W = 220, BOX_H = 160; // triangle fits this box, centred in the 320x240 canvas

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const len = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => mul(a, 1 / len(a));
const f = (n) => n.toFixed(1);

const text = (p, s, { size = 18, anchor = 'middle', fill = INK } = {}) =>
  `  <text x="${f(p[0])}" y="${f(p[1] + size * 0.35)}" font-size="${size}" font-weight="700" text-anchor="${anchor}" fill="${fill}">${s}</text>`;

function render({ orient, W, H, sides = {}, letters, angle }) {
  const s = Math.min(BOX_W / W, BOX_H / H);
  const wd = W * s, hd = H * s;
  const yB = 120 + hd / 2, yT = 120 - hd / 2;
  const xL = 160 - wd / 2, xR = 160 + wd / 2;
  // Ph = end of horizontal leg, Pr = right angle, Pv = end of vertical leg
  const Ph = orient === 'R' ? [xL, yB] : [xR, yB];
  const Pr = orient === 'R' ? [xR, yB] : [xL, yB];
  const Pv = orient === 'R' ? [xR, yT] : [xL, yT];
  const centroid = mul(add(add(Ph, Pr), Pv), 1 / 3);
  const out = [];
  out.push(`  <polygon points="${f(Ph[0])},${f(Ph[1])} ${f(Pr[0])},${f(Pr[1])} ${f(Pv[0])},${f(Pv[1])}" fill="#eef4ff" stroke="${BLUE}" stroke-width="3" stroke-linejoin="round"/>`);

  // right-angle square at Pr
  const toH = unit(sub(Ph, Pr)), toV = unit(sub(Pv, Pr)), q = 12;
  const a = add(Pr, mul(toH, q)), b = add(add(Pr, mul(toH, q)), mul(toV, q)), c = add(Pr, mul(toV, q));
  out.push(`  <polyline points="${f(a[0])},${f(a[1])} ${f(b[0])},${f(b[1])} ${f(c[0])},${f(c[1])}" fill="none" stroke="${BLUE}" stroke-width="2"/>`);

  // side labels, pushed outward from the triangle
  const sideLabel = (p1, p2, txt) => {
    if (!txt) return;
    const mid = mul(add(p1, p2), 0.5);
    let n = unit([-(p2[1] - p1[1]), p2[0] - p1[0]]);
    if ((mid[0] - centroid[0]) * n[0] + (mid[1] - centroid[1]) * n[1] < 0) n = mul(n, -1);
    const pos = add(mid, mul(n, txt === 'x' ? 17 : 20));
    out.push(text(pos, txt, { fill: txt === 'x' ? RED : INK }));
  };
  sideLabel(Ph, Pr, sides.h);
  sideLabel(Pr, Pv, sides.v);
  sideLabel(Ph, Pv, sides.hyp);

  // vertex letters (ratio problems)
  if (letters) {
    for (const [key, P] of [['h', Ph], ['r', Pr], ['v', Pv]]) {
      const dir = unit(sub(P, centroid));
      out.push(text(add(P, mul(dir, 18)), letters[key]));
    }
  }

  // angle arc + label at Ph or Pv
  if (angle) {
    const P = angle.at === 'h' ? Ph : Pv;
    const other = angle.at === 'h' ? Pv : Ph;
    const u = unit(sub(Pr, P)), v = unit(sub(other, P));
    const r = 28;
    const cross = u[0] * v[1] - u[1] * v[0];
    const p1 = add(P, mul(u, r)), p2 = add(P, mul(v, r));
    const color = angle.unknown ? RED : ORANGE;
    out.push(`  <path d="M ${f(p1[0])},${f(p1[1])} A ${r},${r} 0 0 ${cross > 0 ? 1 : 0} ${f(p2[0])},${f(p2[1])}" fill="none" stroke="${color}" stroke-width="2.5"/>`);
    const bis = unit(add(u, v));
    out.push(text(add(P, mul(bis, r + 24)), angle.text, { fill: color }));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" font-family="${FONT}">\n  <rect width="320" height="240" fill="#ffffff"/>\n${out.join('\n')}\n</svg>\n`;
}

for (const p of PRACTICE) {
  writeFileSync(`${OUT}/trig42-${p.id}.svg`, render(p.svg));
}
console.log(`wrote ${PRACTICE.length} diagrams to ${OUT}/trig42-*.svg`);
