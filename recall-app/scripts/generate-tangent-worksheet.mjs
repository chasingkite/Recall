// Generates MULTIPLE print-ready HTML tangent practice sheets (+ answer keys) for
// Hailey's IM2 Chapter 3.2 quiz (standard G-SRT.6). Mirrors the teacher's CPM-style
// format from ~/Documents/StudyMaterials/IM2/Class Canvas: evaluate tan (degree
// mode, 4 decimals), read tan(x) as a reduced "slope fraction", solve for a side
// (both cases: x on top = *tan, x on bottom = /tan), a shadow/elevation word
// problem, inverse tangent (find the slope angle), and a Morgan-style
// error-analysis (denominator trap). Numbers are generated with a seeded RNG and
// ALL answers are computed in code, so each version's key is correct by
// construction. Triangles are inline SVG (not to scale) -> prints cleanly from a
// browser. Run from recall-app/:  node scripts/generate-tangent-worksheet.mjs [count]
import { writeFileSync } from 'fs';

const OUT_DIR = '/Users/hien_m_nguyen/Documents/StudyMaterials/IM2/Class Canvas';
const COUNT = Math.max(1, parseInt(process.argv[2] || '3', 10));

// --- seeded RNG (mulberry32) so re-runs are reproducible ----------------------
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const d = (deg) => (deg * Math.PI) / 180;
const r4 = (x) => x.toFixed(4);
const t1 = (x) => x.toFixed(1);
const atanDeg = (x) => (Math.atan(x) * 180) / Math.PI;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// --- SVG right triangle, 6 orientations (right angle at R, marked angle at A) --
// adjacent leg = A-R, opposite leg = R-T, hypotenuse = A-T. The angle arc is
// sampled as a polyline along the true interior angle, so it is always correct.
const ORIENT = [
  { R: [300, 175], A: [55, 175],  T: [300, 45]  },
  { R: [60, 175],  A: [305, 175], T: [60, 45]   },
  { R: [300, 55],  A: [300, 175], T: [65, 55]   },
  { R: [65, 55],   A: [65, 175],  T: [300, 55]  },
  { R: [300, 175], A: [300, 55],  T: [65, 175]  },
  { R: [65, 175],  A: [65, 55],   T: [300, 175] },
];
function tri({ angle = 'x°', adj = null, opp = null, hyp = null, o = 0 } = {}) {
  const { R, A, T } = ORIENT[((o % ORIENT.length) + ORIENT.length) % ORIENT.length];
  const sub = (p, q) => [p[0]-q[0], p[1]-q[1]];
  const add = (p, q) => [p[0]+q[0], p[1]+q[1]];
  const mul = (p, s) => [p[0]*s, p[1]*s];
  const unit = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0]/l, v[1]/l]; };
  const mid = (p, q) => [(p[0]+q[0])/2, (p[1]+q[1])/2];
  const cen = [(R[0]+A[0]+T[0])/3, (R[1]+A[1]+T[1])/3];
  const outLbl = (p, q) => { const m = mid(p, q); return add(m, mul(unit(sub(m, cen)), 16)); };
  // right-angle square at R
  const s = 15, uRA = unit(sub(A, R)), uRT = unit(sub(T, R));
  const sq1 = add(R, mul(uRA, s)), sq2 = add(add(R, mul(uRA, s)), mul(uRT, s)), sq3 = add(R, mul(uRT, s));
  // angle arc at A (sample the short interior arc)
  const r = 30, uAR = unit(sub(R, A)), uAT = unit(sub(T, A));
  let a0 = Math.atan2(uAR[1], uAR[0]), a1 = Math.atan2(uAT[1], uAT[0]);
  let dA = a1 - a0; while (dA > Math.PI) dA -= 2*Math.PI; while (dA < -Math.PI) dA += 2*Math.PI;
  const arcPts = [];
  for (let k = 0; k <= 12; k++) { const a = a0 + dA*k/12; arcPts.push(`${(A[0]+r*Math.cos(a)).toFixed(1)},${(A[1]+r*Math.sin(a)).toFixed(1)}`); }
  const bis = unit(add(uAR, uAT)), angP = add(A, mul(bis, r + 14));
  const adjP = outLbl(A, R), oppP = outLbl(R, T), hypP = outLbl(A, T);
  const lbl = (p, t, cls = 'n') => t == null ? '' : `<text x="${p[0].toFixed(1)}" y="${(p[1]+5).toFixed(1)}" text-anchor="middle" class="${cls}">${t}</text>`;
  return `<svg viewBox="0 0 360 210" class="tri" role="img">
  <polygon points="${R[0]},${R[1]} ${A[0]},${A[1]} ${T[0]},${T[1]}" fill="none" stroke="#111" stroke-width="2"/>
  <polyline points="${sq1[0].toFixed(1)},${sq1[1].toFixed(1)} ${sq2[0].toFixed(1)},${sq2[1].toFixed(1)} ${sq3[0].toFixed(1)},${sq3[1].toFixed(1)}" fill="none" stroke="#111" stroke-width="1.5"/>
  <polyline points="${arcPts.join(' ')}" fill="none" stroke="#1769ff" stroke-width="2"/>
  ${lbl(angP, angle, 'ang')}
  ${lbl(adjP, adj)}
  ${lbl(oppP, opp)}
  ${lbl(hypP, hyp, 'hyp')}
</svg>`;
}

const TRIPLES = [[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[7,24,25],[20,21,29]];
const WORD = [
  (h,a)=>({t:`A ${h}-foot flagpole casts a shadow that makes a ${a}° angle with the ground. How long is the shadow to the nearest tenth of a foot?`, unit:'feet', label:'The shadow is'}),
  (h,a)=>({t:`A ${h}-foot tree casts a shadow that forms a ${a}° angle with the ground. How long is the shadow to the nearest tenth of a foot?`, unit:'feet', label:'The shadow is'}),
  (h,a)=>({t:`A ladder leans against a wall, reaching ${h} feet up, at a ${a}° angle with the ground. How far is the base of the ladder from the wall, to the nearest tenth of a foot?`, unit:'feet', label:'The base is'}),
];

function pick(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }
function rint(rand, lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }
function sampleDistinct(rand, lo, hi, n) {
  const s = new Set(); while (s.size < n) s.add(rint(rand, lo, hi)); return [...s];
}

// --- build one version's problem set -----------------------------------------
function makeVersion(seed) {
  const rand = rng(seed);
  // Q1: evaluate tan
  const q1 = sampleDistinct(rand, 12, 85, 6).sort((a,b)=>a-b).map((a) => [`tan(${a}°)`, r4(Math.tan(d(a)))]);
  // Q2: tan(x) as reduced fraction (one with a hypotenuse distractor from a triple)
  const trip = pick(rand, TRIPLES);
  const [o1,a1] = [rint(rand,3,11), rint(rand,4,13)];
  const g1 = gcd(o1,a1);
  const q2 = [
    { svg: tri({ angle:'x°', opp:`${o1}`, adj:`${a1}`, o: rint(rand,0,5) }), ans:`tan(x) = ${o1}/${a1}${g1>1?` = ${o1/g1}/${a1/g1}`:''}` },
    { svg: tri({ angle:'x°', opp:`${trip[0]}`, adj:`${trip[1]}`, hyp:`${trip[2]}`, o: rint(rand,0,5) }), ans:`tan(x) = ${trip[0]}/${trip[1]}${gcd(trip[0],trip[1])>1?` = ${trip[0]/gcd(trip[0],trip[1])}/${trip[1]/gcd(trip[0],trip[1])}`:''}  (ignore the hypotenuse ${trip[2]})` },
  ];
  // Q3: solve for a side — two "x on top" (x=opp) and two "x on bottom" (x=adj)
  const q3 = [];
  const cases = [true, false, true, false]; // true = x on top
  for (const top of cases) {
    const ang = rint(rand, 20, 70);
    const known = rint(rand, 6, 24);
    if (top) {
      q3.push({ svg: tri({ angle:`${ang}°`, opp:'x', adj:`${known}`, o: rint(rand,0,5) }),
        eq:`tan(${ang}°) = x/${known}`, ans:`x = ${known}·tan(${ang}°) = ${r4(known*Math.tan(d(ang)))}` });
    } else {
      q3.push({ svg: tri({ angle:`${ang}°`, opp:`${known}`, adj:'x', o: rint(rand,0,5) }),
        eq:`tan(${ang}°) = ${known}/x`, ans:`x = ${known} ÷ tan(${ang}°) = ${r4(known/Math.tan(d(ang)))}` });
    }
  }
  // Q4: word problem (height opposite, x adjacent -> divide)
  const wh = rint(rand, 15, 48), wa = rint(rand, 28, 62);
  const w = pick(rand, WORD)(wh, wa);
  const q4 = { text:w.t, svg: tri({ angle:`${wa}°`, opp:`${wh}`, adj:'x', o: rint(rand,0,5) }), label:w.label, unit:w.unit,
    ans:`tan(${wa}°) = ${wh}/x → x = ${wh} ÷ tan(${wa}°) = ${r4(wh/Math.tan(d(wa)))} → ${w.label.toLowerCase()} ${t1(wh/Math.tan(d(wa)))} ${w.unit}. (units!)` };
  // Q5: inverse tangent (find angle)
  const [o5a,a5a] = [rint(rand,4,20), rint(rand,5,20)];
  const [o5b,a5b] = [rint(rand,20,60), rint(rand,6,18)];
  const q5 = [
    { svg: tri({ angle:'x°', opp:`${o5a}`, adj:`${a5a}`, o: rint(rand,0,5) }), ans:`x = tan⁻¹(${o5a}/${a5a}) = tan⁻¹(${r4(o5a/a5a)}) = ${t1(atanDeg(o5a/a5a))}°` },
    { text:`A ramp rises ${o5b} in over a horizontal run of ${a5b} in. Find the ramp's slope angle x to the nearest tenth of a degree.`,
      svg: tri({ angle:'x°', opp:`${o5b}`, adj:`${a5b}`, o: rint(rand,0,5) }), ans:`x = tan⁻¹(${o5b}/${a5b}) = tan⁻¹(${r4(o5b/a5b)}) = ${t1(atanDeg(o5b/a5b))}°` },
  ];
  // Q6: error analysis (denominator trap)
  const e6a = rint(rand, 22, 55), e6k = rint(rand, 9, 22);
  const morgan = r4(e6k*Math.tan(d(e6a)));
  const correct = r4(e6k/Math.tan(d(e6a)));
  const q6 = {
    problem:`Solve for x:  tan(${e6a}°) = ${e6k}/x`,
    work:[`Step 1:  tan(${e6a}°)/1 = ${e6k}/x`, `Step 2:  x = ${e6k} · tan(${e6a}°)`, `Step 3:  x = ${e6k}(${r4(Math.tan(d(e6a)))})`, `Step 4:  x = ${morgan}`],
    ansStep:'The error STARTS in Step 2.',
    ansWhy:`x is in the denominator, so you must DIVIDE, not multiply. From tan(${e6a}°) = ${e6k}/x you get x·tan(${e6a}°) = ${e6k}, so x = ${e6k} ÷ tan(${e6a}°).`,
    ansFix:`x = ${e6k} ÷ tan(${e6a}°) = ${correct}`,
  };
  return { q1, q2, q3, q4, q5, q6 };
}

// --- styling ------------------------------------------------------------------
const STYLE = `
<style>
  @page { margin: 0.6in; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color:#111; max-width:8in; margin:0 auto; padding:16px; }
  h1 { font-size:20px; margin:0 0 2px; }
  .sub { font-size:12px; color:#333; margin:0 0 10px; }
  .meta { font-size:13px; margin:6px 0 14px; }
  .rules { font-size:12px; background:#f3f6ff; border:1px solid #c9d7ff; border-radius:6px; padding:8px 10px; margin-bottom:14px; }
  .q { margin:0 0 18px; page-break-inside:avoid; }
  .q h2 { font-size:15px; margin:0 0 6px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; }
  .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
  .cell { font-size:14px; padding:4px 0; }
  .blank { display:inline-block; min-width:120px; border-bottom:1px solid #111; height:1em; }
  svg.tri { width:220px; height:128px; display:block; margin:4px 0; }
  svg .n { font:15px Georgia, serif; } svg .ang { font:14px Georgia, serif; fill:#1769ff; } svg .hyp { font:13px Georgia, serif; fill:#777; }
  .worklines { border:1px dashed #bbb; border-radius:6px; height:88px; margin-top:4px; }
  .ansbox { background:#eafaef; border:1px solid #9bd9ad; border-radius:6px; padding:6px 10px; font-size:13px; margin-top:4px; }
  .eqline { font-size:13px; color:#444; }
  .pagebreak { page-break-before:always; }
  ol { margin:4px 0; } li { margin:2px 0; } .mono { font-family:'Courier New', monospace; }
</style>`;

function header(ver, key) {
  return `<h1>IM2 Chapter 3.2 — Tangent Practice · Version ${ver}${key ? ' — ANSWER KEY' : ''}</h1>
  <p class="sub">Standard G-SRT.6 · Right-triangle trigonometry (CPM slope ratio)</p>
  ${key ? '' : `<p class="meta">Name: <span class="blank"></span>&nbsp;&nbsp; Period: <span class="blank" style="min-width:60px"></span>&nbsp;&nbsp; Date: <span class="blank" style="min-width:90px"></span></p>`}
  <div class="rules"><b>Before you start:</b> calculator in <b>DEGREE mode</b> · round decimals to <b>4 places</b> · <b>show your work</b> (write the equation line) · sanity check: bigger angle → bigger tangent.</div>`;
}

function build(ver, P, key) {
  const slot = (ans) => key ? `<div class="ansbox">${ans}</div>` : `<span class="blank"></span>`;
  const work = () => key ? '' : `<div class="worklines"></div>`;
  const s1 = `<div class="q"><h2>1. Evaluate with a calculator (degree mode, 4 decimals).</h2>
    <div class="grid3">${P.q1.map(([q,a]) => `<div class="cell">${q} = ${key?`<b>${a}</b>`:'<span class="blank" style="min-width:90px"></span>'}</div>`).join('')}</div></div>`;
  const s2 = `<div class="q"><h2>2. Find tan(x) from the triangle. Write it as a reduced fraction (a “slope fraction”).</h2>
    <div class="grid2">${P.q2.map((p,i)=>`<div class="cell">${'ab'[i]}. ${p.svg}tan(x) = ${slot(p.ans)}</div>`).join('')}</div></div>`;
  const s3 = `<div class="q"><h2>3. Find x. Not to scale. Write the equation, then solve (4 decimals).</h2>
    <div class="grid2">${P.q3.map((p,i)=>`<div class="cell">${'abcd'[i]}. ${p.svg}
      <div class="eqline">Equation: ${key?`<b>${p.eq}</b>`:'<span class="blank"></span>'}</div>${work()}x = ${slot(p.ans)}</div>`).join('')}</div></div>`;
  const s4 = `<div class="q"><h2>4. Word problem — show the equation and include units.</h2>
    <div class="cell">${P.q4.text}${P.q4.svg}${work()}${P.q4.label} ${slot(P.q4.ans)} </div></div>`;
  const s5 = `<div class="q"><h2>5. Inverse tangent — find the angle x to the nearest tenth of a degree.</h2>
    <div class="grid2">${P.q5.map((p,i)=>`<div class="cell">${'ab'[i]}. ${p.text?p.text+'<br>':''}${p.svg}${work()}x = ${slot(p.ans)}</div>`).join('')}</div></div>`;
  const s6 = `<div class="q"><h2>6. Error analysis.</h2>
    <div class="cell"><b>Problem:</b> <span class="mono">${P.q6.problem}</span><br><b>Morgan's work:</b>
      <ol>${P.q6.work.map((w)=>`<li class="mono">${w}</li>`).join('')}</ol>
      a. Error STARTS in step: ${key?`<b>${P.q6.ansStep}</b>`:'<span class="blank" style="min-width:60px"></span>'}<br>
      b. The error was: ${key?`<div class="ansbox">${P.q6.ansWhy}</div>`:`<div class="worklines" style="height:48px"></div>`}
      c. Solve correctly: x = ${slot(P.q6.ansFix)}</div></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>IM2 Ch3.2 Tangent · Version ${ver}${key?' KEY':''}</title>${STYLE}</head>
<body>${header(ver,key)}${s1}${s2}${s3}<div class="pagebreak"></div>${s4}${s5}${s6}</body></html>`;
}

const letters = 'ABCDEFGH';
const written = [];
for (let i = 0; i < COUNT; i++) {
  const ver = letters[i];
  const P = makeVersion(1000 + i * 97);
  const wsName = `Tangent Practice - Version ${ver}.html`;
  const keyName = `Tangent Practice - Version ${ver} - KEY.html`;
  writeFileSync(`${OUT_DIR}/${wsName}`, build(ver, P, false));
  writeFileSync(`${OUT_DIR}/${keyName}`, build(ver, P, true));
  written.push(wsName, keyName);
}
console.log(`Wrote ${written.length} files to ${OUT_DIR}:`);
written.forEach((f) => console.log(' - ' + f));
