// Generates 3 labeled cell diagrams (animal, plant, bacterium) for the "Biology - Cells"
// deck into public/bio/. Diagrams carry NO text labels — only big lettered pins (A, B, C...)
// that cards ask about — because the card view shows images at ~180px wide.
// Each pin is a <g data-pin="X" data-organelle="Name"> so import-cell-cards.mjs can verify
// that every diagram card's answer matches the SVG. iOS-style palette, white bg.
// Run from recall-app/: node scripts/generate-cell-svgs.mjs
import { writeFileSync, mkdirSync } from 'fs';

const OUT = 'public/bio';
mkdirSync(OUT, { recursive: true });

const FONT = '-apple-system, Helvetica, Arial, sans-serif';
const BLUE = '#007aff', PURPLE = '#5856d6', ORANGE = '#ff9500', GREEN = '#34c759', RED = '#ff3b30', INK = '#1c1c1e';

const wrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" font-family="${FONT}">\n` +
  `  <rect width="320" height="240" fill="#ffffff"/>\n${inner}\n</svg>\n`;

// Lettered pin: leader line from the pin to a dot on the target structure.
// (px,py) = pin centre; (tx,ty) = point on the structure.
function pin(letter, organelle, px, py, tx, ty) {
  const len = Math.hypot(tx - px, ty - py);
  const sx = px + ((tx - px) / len) * 14; // start the leader at the pin's edge
  const sy = py + ((ty - py) / len) * 14;
  return [
    `  <g data-pin="${letter}" data-organelle="${organelle}">`,
    `    <line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${tx}" y2="${ty}" stroke="${INK}" stroke-width="2"/>`,
    `    <circle cx="${tx}" cy="${ty}" r="3.5" fill="${INK}"/>`,
    `    <circle cx="${px}" cy="${py}" r="14" fill="#ffffff" stroke="${INK}" stroke-width="2.5"/>`,
    `    <text x="${px}" y="${py + 6.5}" font-size="18" font-weight="700" text-anchor="middle" fill="${INK}">${letter}</text>`,
    `  </g>`,
  ].join('\n');
}

const mito = (cx, cy, rot, rx = 20, ry = 11) =>
  [
    `  <g transform="rotate(${rot} ${cx} ${cy})">`,
    `    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffe3c2" stroke="${ORANGE}" stroke-width="2.5"/>`,
    `    <path d="M ${cx - rx + 6},${cy} q 4,-7 8,0 t 8,0 t 8,0" fill="none" stroke="${ORANGE}" stroke-width="2"/>`,
    `  </g>`,
  ].join('\n');

// ---------------- animal cell ----------------
// A nucleus, B mitochondrion, C ribosomes, D cell membrane, E cytoplasm
const animal = wrap(
  [
    `  <ellipse cx="160" cy="120" rx="112" ry="88" fill="#eef4ff" stroke="${BLUE}" stroke-width="4"/>`,
    `  <circle cx="150" cy="115" r="30" fill="#e5e4fa" stroke="${PURPLE}" stroke-width="3"/>`,
    `  <circle cx="144" cy="110" r="9" fill="${PURPLE}" opacity="0.55"/>`,
    mito(215, 95, -20),
    ...[[108, 152], [118, 158], [126, 150], [112, 166], [124, 168]].map(
      ([x, y]) => `  <circle cx="${x}" cy="${y}" r="3.5" fill="${GREEN}"/>`
    ),
    pin('A', 'Nucleus', 160, 16, 152, 86),
    pin('B', 'Mitochondrion', 296, 58, 232, 89),
    pin('C', 'Ribosomes', 32, 214, 108, 160),
    pin('D', 'Cell membrane', 24, 120, 48, 120),
    pin('E', 'Cytoplasm', 296, 178, 225, 160),
  ].join('\n')
);

// ---------------- plant cell ----------------
// A cell wall, B cell membrane, C nucleus, D chloroplast, E large central vacuole, F mitochondrion
const chloroplast = (cx, cy) =>
  [
    `  <ellipse cx="${cx}" cy="${cy}" rx="16" ry="9" fill="#c8f0d2" stroke="${GREEN}" stroke-width="2.5"/>`,
    `  <line x1="${cx - 8}" y1="${cy}" x2="${cx + 8}" y2="${cy}" stroke="${GREEN}" stroke-width="2"/>`,
  ].join('\n');

const plant = wrap(
  [
    // thick outer wall, thin membrane just inside it
    `  <rect x="46" y="30" width="228" height="180" rx="14" fill="#eef4ff" stroke="${GREEN}" stroke-width="8"/>`,
    `  <rect x="56" y="40" width="208" height="160" rx="10" fill="none" stroke="${BLUE}" stroke-width="2.5"/>`,
    `  <rect x="112" y="72" width="104" height="104" rx="22" fill="#cfe8ff" stroke="#5ac8fa" stroke-width="3"/>`,
    `  <circle cx="82" cy="78" r="20" fill="#e5e4fa" stroke="${PURPLE}" stroke-width="3"/>`,
    `  <circle cx="78" cy="74" r="6" fill="${PURPLE}" opacity="0.55"/>`,
    chloroplast(240, 72),
    chloroplast(240, 150),
    chloroplast(84, 150),
    mito(166, 190, 0, 14, 7),
    pin('A', 'Cell wall', 22, 56, 46, 56),
    pin('B', 'Cell membrane', 22, 140, 56, 140),
    pin('C', 'Nucleus', 82, 14, 82, 58),
    pin('D', 'Chloroplast', 296, 62, 252, 70),
    pin('E', 'Large central vacuole', 296, 124, 214, 124),
    pin('F', 'Mitochondrion', 244, 222, 178, 192),
  ].join('\n')
);

// ---------------- bacterium (prokaryote) ----------------
// A cell wall, B nucleoid, C plasmid, D flagellum
const bacterium = wrap(
  [
    `  <rect x="70" y="85" width="160" height="70" rx="35" fill="#eef4ff" stroke="${GREEN}" stroke-width="6"/>`,
    `  <rect x="78" y="93" width="144" height="54" rx="27" fill="none" stroke="${BLUE}" stroke-width="2.5"/>`,
    // nucleoid: loose tangle of DNA, NOT enclosed by a membrane
    `  <path d="M 105,120 c 8,-18 22,-18 20,0 s -14,18 -6,4 s 22,-20 30,-2" fill="none" stroke="${PURPLE}" stroke-width="3" stroke-linecap="round"/>`,
    // plasmid: small separate DNA ring
    `  <circle cx="190" cy="128" r="9" fill="none" stroke="${RED}" stroke-width="3"/>`,
    // flagellum: wavy tail
    `  <path d="M 230,122 C 250,100 270,140 295,115" fill="none" stroke="${ORANGE}" stroke-width="4" stroke-linecap="round"/>`,
    pin('A', 'Cell wall', 110, 40, 120, 86),
    pin('B', 'Nucleoid', 46, 190, 118, 128),
    pin('C', 'Plasmid', 190, 200, 190, 138),
    pin('D', 'Flagellum', 292, 60, 261, 120),
  ].join('\n')
);

const files = { 'cell-animal.svg': animal, 'cell-plant.svg': plant, 'cell-bacterium.svg': bacterium };
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(`${OUT}/${name}`, svg);
  console.log(`wrote ${OUT}/${name}`);
}
