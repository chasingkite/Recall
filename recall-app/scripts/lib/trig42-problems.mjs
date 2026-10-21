// Shared problem definitions for the Ch 4.2 trig practice deck. Imported by BOTH
// generate-trig42-svgs.mjs (diagrams) and import-trig42-cards.mjs (cards) so a diagram and
// its answer cannot drift apart. Every answer is COMPUTED here, never typed by hand.
//
// Geometry vocabulary: a right triangle has a horizontal leg, a vertical leg and a hypotenuse.
//   Ph = acute vertex at the end of the horizontal leg ("bottom")
//   Pr = right-angle vertex
//   Pv = acute vertex at the end of the vertical leg ("top")
// orient 'R' puts Pr bottom-right, 'L' mirrors it (Pr bottom-left).
// For an angle at Ph: opposite = vertical leg, adjacent = horizontal leg.
// For an angle at Pv: opposite = horizontal leg, adjacent = vertical leg.

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const frac = (n, d) => `${n / gcd(n, d)}/${d / gcd(n, d)}`;

// Reject answers that sit near a rounding boundary (x.x5 / y.5), where a student's
// calculator rounding could legitimately differ from ours.
function assertSafeRound(value, scale, id) {
  const y = value * scale;
  if (Math.abs(y - Math.floor(y) - 0.5) < 0.04) throw new Error(`${id}: ${value} too close to a rounding boundary`);
}
const tenth = (x, id) => { assertSafeRound(x, 10, id); return (Math.round(x * 10) / 10).toFixed(1); };
const whole = (x, id) => { assertSafeRound(x, 1, id); return String(Math.round(x)); };

const oppPos = (at) => (at === 'h' ? 'v' : 'h'); // which leg is opposite the angle
const adjPos = (at) => (at === 'h' ? 'h' : 'v');
const posOf = (kind, at) => (kind === 'hyp' ? 'hyp' : kind === 'opp' ? oppPos(at) : adjPos(at));
const FN = { sin: ['opp', 'hyp'], cos: ['adj', 'hyp'], tan: ['opp', 'adj'] };
const RATIO_WORD = { sin: 'opposite ÷ hypotenuse (SOH)', cos: 'adjacent ÷ hypotenuse (CAH)', tan: 'opposite ÷ adjacent (TOA)' };

// ---- group 1: find a trig ratio from a labeled triangle ------------------------
function ratioProblem(id, orient, h, v, hyp, letters, fn, at) {
  if (h * h + v * v !== hyp * hyp) throw new Error(`${id}: not a right triangle`);
  const opp = at === 'h' ? v : h, adj = at === 'h' ? h : v;
  const val = { opp, adj, hyp };
  const [nk, dk] = FN[fn];
  const num = val[nk], den = val[dk];
  const vertex = at === 'h' ? letters.h : letters.v;
  const simp = frac(num, den);
  return {
    id, topic: 'trig_ratio',
    front: `Use the triangle (see diagram). What is ${fn} ${vertex}? Give a simplified fraction.`,
    back: simp,
    explanation: `Relative to angle ${vertex}: opposite = ${opp}, adjacent = ${adj}, hypotenuse = ${hyp}. ${fn} = ${RATIO_WORD[fn]} = ${num}/${den}${simp !== `${num}/${den}` ? ` = ${simp}` : ''}. #1 mistake: labeling the sides from the wrong angle — opposite and adjacent swap when you switch angles.`,
    svg: { orient, W: h, H: v, sides: { h: String(h), v: String(v), hyp: String(hyp) }, letters },
  };
}

// ---- group 2: find a missing side ----------------------------------------------
function sideProblem(id, orient, at, theta, knownKind, knownVal, unknownKind) {
  const t = rad(theta);
  const ratioOf = { sin: Math.sin(t), cos: Math.cos(t), tan: Math.tan(t) };
  // solve for hyp first, then the unknown
  const sides = {};
  sides[knownKind] = knownVal;
  if (knownKind === 'hyp') { sides.opp = knownVal * ratioOf.sin; sides.adj = knownVal * ratioOf.cos; }
  else if (knownKind === 'opp') { sides.hyp = knownVal / ratioOf.sin; sides.adj = knownVal / ratioOf.tan; }
  else { sides.hyp = knownVal / ratioOf.cos; sides.opp = knownVal * ratioOf.tan; }
  const x = sides[unknownKind];
  // which trig function connects the known and unknown sides
  const fn = Object.keys(FN).find((f) => FN[f].includes(knownKind) && FN[f].includes(unknownKind));
  const [nk] = FN[fn];
  const xOnTop = unknownKind === nk;
  const setup = xOnTop ? `${fn} ${theta}° = x/${knownVal} → x = ${knownVal} × ${fn} ${theta}°` : `${fn} ${theta}° = ${knownVal}/x → x = ${knownVal} ÷ ${fn} ${theta}°`;
  const labels = { h: '', v: '', hyp: '' };
  labels[posOf(knownKind, at)] = String(knownVal);
  labels[posOf(unknownKind, at)] = 'x';
  return {
    id, topic: 'find_side',
    front: `This right triangle has a ${theta}° angle and a side of length ${knownVal} marked (see diagram). Find x to the nearest tenth.`,
    back: tenth(x, id),
    explanation: `Relative to the ${theta}° angle, x is the ${unknownKind === 'hyp' ? 'hypotenuse' : unknownKind === 'opp' ? 'opposite side' : 'adjacent side'} and ${knownVal} is the ${knownKind === 'hyp' ? 'hypotenuse' : knownKind === 'opp' ? 'opposite side' : 'adjacent side'}, so use ${fn}: ${setup} ≈ ${tenth(x, id)}. #1 mistake: ${xOnTop ? 'dividing' : 'multiplying'} when x is ${xOnTop ? 'on top (multiply)' : 'on the bottom (divide)'}.`,
    // the angle is at `at`; shape: at Ph tan = V/H, at Pv tan = H/V
    svg: at === 'h'
      ? { orient, W: 1, H: Math.tan(t), sides: labels, angle: { at, text: `${theta}&#176;` } }
      : { orient, W: Math.tan(t), H: 1, sides: labels, angle: { at, text: `${theta}&#176;` } },
  };
}

// ---- group 3: find a missing angle ---------------------------------------------
function angleProblem(id, orient, at, kindA, valA, kindB, valB) {
  const known = { [kindA]: valA, [kindB]: valB };
  if (known.hyp && known.opp) known.adj = Math.sqrt(known.hyp ** 2 - known.opp ** 2);
  else if (known.hyp && known.adj) known.opp = Math.sqrt(known.hyp ** 2 - known.adj ** 2);
  else known.hyp = Math.hypot(known.opp, known.adj);
  const fn = Object.keys(FN).find((f) => FN[f].includes(kindA) && FN[f].includes(kindB));
  const [nk, dk] = FN[fn];
  const ratio = known[nk] / known[dk];
  const angle = deg({ sin: Math.asin, cos: Math.acos, tan: Math.atan }[fn](ratio));
  const labels = { h: '', v: '', hyp: '' };
  labels[posOf(kindA, at)] = String(valA);
  labels[posOf(kindB, at)] = String(valB);
  const nm = { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse' };
  return {
    id, topic: 'find_angle',
    front: `Two sides of this right triangle are ${valA} and ${valB} (see diagram). Find the angle marked ? to the nearest degree.`,
    back: whole(angle, id),
    explanation: `You are given the ${nm[kindA]} (${valA}) and the ${nm[kindB]} (${valB}) of the ? angle, so use ${fn}⁻¹: θ = ${fn}⁻¹(${valA === known[nk] ? valA : valB}/${valA === known[dk] ? valA : valB}) ≈ ${whole(angle, id)}°. #1 mistake: typing ${fn} instead of ${fn}⁻¹ — to get an ANGLE out of a ratio you need the inverse button.`,
    svg: {
      orient,
      W: at === 'h' ? known.adj : known.opp, // horizontal leg
      H: at === 'h' ? known.opp : known.adj, // vertical leg
      sides: labels, angle: { at, text: '?', unknown: true },
    },
  };
}

export const PRACTICE = [
  // ratios — mixed orientation and which vertex is asked
  ratioProblem('ratio-1', 'R', 12, 5, 13, { h: 'A', r: 'B', v: 'C' }, 'sin', 'h'),
  ratioProblem('ratio-2', 'L', 15, 8, 17, { h: 'X', r: 'Y', v: 'Z' }, 'cos', 'v'),
  ratioProblem('ratio-3', 'R', 7, 24, 25, { h: 'P', r: 'Q', v: 'R' }, 'tan', 'v'),
  ratioProblem('ratio-4', 'L', 20, 21, 29, { h: 'D', r: 'E', v: 'F' }, 'sin', 'h'),
  ratioProblem('ratio-5', 'R', 6, 8, 10, { h: 'K', r: 'L', v: 'M' }, 'cos', 'h'),
  ratioProblem('ratio-6', 'L', 5, 12, 13, { h: 'G', r: 'H', v: 'J' }, 'cos', 'v'),
  // missing side — all six sin/cos/tan × x-on-top / x-on-bottom combinations
  sideProblem('side-1', 'R', 'h', 35, 'hyp', 14, 'opp'), // sin, x on top
  sideProblem('side-2', 'L', 'h', 52, 'hyp', 20, 'adj'), // cos, x on top
  sideProblem('side-3', 'R', 'v', 28, 'adj', 15, 'opp'), // tan, x on top
  sideProblem('side-4', 'L', 'v', 41, 'opp', 9, 'hyp'), // sin, x on bottom
  sideProblem('side-5', 'R', 'h', 63, 'adj', 11, 'hyp'), // cos, x on bottom
  sideProblem('side-6', 'L', 'h', 22, 'opp', 17, 'adj'), // tan, x on bottom
  // missing angle — two each of sin⁻¹, cos⁻¹, tan⁻¹
  angleProblem('angle-1', 'R', 'h', 'opp', 12, 'hyp', 20),
  angleProblem('angle-2', 'L', 'h', 'adj', 9, 'hyp', 15),
  angleProblem('angle-3', 'R', 'v', 'opp', 10, 'adj', 12),
  angleProblem('angle-4', 'L', 'v', 'opp', 8, 'hyp', 13),
  angleProblem('angle-5', 'R', 'h', 'adj', 15, 'hyp', 22),
  angleProblem('angle-6', 'L', 'v', 'adj', 6, 'opp', 11),
];
