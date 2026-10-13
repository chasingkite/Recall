// Generates a comprehensive print-ready HTML worksheet (+ answer key) modeled on
// the teacher's "IM 2 Tangent Ratios #2" sheet, plus the 3.2.4 notes and Cycle
// test, for Hailey's IM2 Ch 3 quiz (G-SRT.6). Five parts, matching that sheet:
//   1. Write the tangent equation and solve for a missing SIDE (6)
//   2. Use inverse tangent (tan⁻¹) to find a missing ANGLE θ (6)
//   3. State the tangent ratio as a reduced fraction (3)
//   4. Draw a right triangle from a slope ratio y/x; find the hypotenuse
//      (Pythagorean) and both acute angles (tangent + triangle sum) (3)
//   5. Full solve for x AND θ (2)
// Ends with a scrambled "Check:" answer bank like the teacher's. All answers are
// computed in code. Triangles are inline SVG with varied orientations.
// Run from recall-app/:  node scripts/generate-tangent-mixed-worksheet.mjs
import { writeFileSync } from 'fs';
const OUT_DIR = '/Users/hien_m_nguyen/Documents/StudyMaterials/IM2/Class Canvas';

const rng = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const d = (x) => x * Math.PI / 180;
const f2 = (x) => (Math.round(x * 100) / 100).toString();
const atanDeg = (x) => Math.atan(x) * 180 / Math.PI;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const rint = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

const ORIENT = [
  { R: [300, 175], A: [55, 175],  T: [300, 45]  }, { R: [60, 175],  A: [305, 175], T: [60, 45]   },
  { R: [300, 55],  A: [300, 175], T: [65, 55]   }, { R: [65, 55],   A: [65, 175],  T: [300, 55]  },
  { R: [300, 175], A: [300, 55],  T: [65, 175]  }, { R: [65, 175],  A: [65, 55],   T: [300, 175] },
];
function tri({ angle = 'θ', adj = null, opp = null, hyp = null, o = 0 } = {}) {
  const { R, A, T } = ORIENT[((o % 6) + 6) % 6];
  const sub = (p, q) => [p[0]-q[0], p[1]-q[1]], add = (p, q) => [p[0]+q[0], p[1]+q[1]], mul = (p, s) => [p[0]*s, p[1]*s];
  const unit = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0]/l, v[1]/l]; };
  const mid = (p, q) => [(p[0]+q[0])/2, (p[1]+q[1])/2];
  const cen = [(R[0]+A[0]+T[0])/3, (R[1]+A[1]+T[1])/3];
  const outLbl = (p, q) => { const m = mid(p, q); return add(m, mul(unit(sub(m, cen)), 16)); };
  const s = 15, uRA = unit(sub(A, R)), uRT = unit(sub(T, R));
  const sq1 = add(R, mul(uRA, s)), sq2 = add(add(R, mul(uRA, s)), mul(uRT, s)), sq3 = add(R, mul(uRT, s));
  const r = 30, uAR = unit(sub(R, A)), uAT = unit(sub(T, A));
  let a0 = Math.atan2(uAR[1], uAR[0]), a1 = Math.atan2(uAT[1], uAT[0]); let dA = a1 - a0;
  while (dA > Math.PI) dA -= 2*Math.PI; while (dA < -Math.PI) dA += 2*Math.PI;
  const arc = []; for (let k = 0; k <= 12; k++) { const a = a0 + dA*k/12; arc.push(`${(A[0]+r*Math.cos(a)).toFixed(1)},${(A[1]+r*Math.sin(a)).toFixed(1)}`); }
  const bis = unit(add(uAR, uAT)), angP = add(A, mul(bis, r + 14));
  const adjP = outLbl(A, R), oppP = outLbl(R, T), hypP = outLbl(A, T);
  const lbl = (p, t, cls = 'n') => t == null ? '' : `<text x="${p[0].toFixed(1)}" y="${(p[1]+5).toFixed(1)}" text-anchor="middle" class="${cls}">${t}</text>`;
  return `<svg viewBox="0 0 360 210" class="tri" role="img">
  <polygon points="${R[0]},${R[1]} ${A[0]},${A[1]} ${T[0]},${T[1]}" fill="none" stroke="#111" stroke-width="2"/>
  <polyline points="${sq1[0].toFixed(1)},${sq1[1].toFixed(1)} ${sq2[0].toFixed(1)},${sq2[1].toFixed(1)} ${sq3[0].toFixed(1)},${sq3[1].toFixed(1)}" fill="none" stroke="#111" stroke-width="1.5"/>
  <polyline points="${arc.join(' ')}" fill="none" stroke="#1769ff" stroke-width="2"/>
  ${lbl(angP, angle, 'ang')}${lbl(adjP, adj)}${lbl(oppP, opp)}${lbl(hypP, hyp, 'hyp')}
</svg>`;
}

function make(seed) {
  const r = rng(seed); const checks = [];
  // Part 1: find a side (mix x=opp / x=adj)
  const p1 = []; const c1 = [true,false,true,false,true,false];
  for (const top of c1) {
    const ang = rint(r,18,72), k = rint(r,5,26), o = rint(r,0,5);
    if (top) { const x = k*Math.tan(d(ang)); checks.push(f2(x));
      p1.push({ svg: tri({ angle:`${ang}°`, opp:'x', adj:`${k}`, o }), eq:`tan(${ang}°) = x/${k}`, ans:`x = ${k}·tan(${ang}°) = ${f2(x)}` }); }
    else { const x = k/Math.tan(d(ang)); checks.push(f2(x));
      p1.push({ svg: tri({ angle:`${ang}°`, opp:`${k}`, adj:'x', o }), eq:`tan(${ang}°) = ${k}/x`, ans:`x = ${k} ÷ tan(${ang}°) = ${f2(x)}` }); }
  }
  // Part 2: inverse tangent -> angle
  const p2 = [];
  for (let i=0;i<6;i++){ const opp=rint(r,3,28), adj=rint(r,3,28), o=rint(r,0,5); const th=atanDeg(opp/adj); checks.push(f2(th));
    p2.push({ svg: tri({ angle:'θ', opp:`${opp}`, adj:`${adj}`, o }), ans:`θ = tan⁻¹(${opp}/${adj}) = ${f2(th)}°` }); }
  // Part 3: state the tangent ratio (reduced)
  const p3 = [];
  for (let i=0;i<3;i++){ const opp=rint(r,2,12), adj=rint(r,2,14), o=rint(r,0,5); const g=gcd(opp,adj);
    p3.push({ svg: tri({ angle:'θ', opp:`${opp}`, adj:`${adj}`, o }), ans:`tan(θ) = ${opp}/${adj}${g>1?` = ${opp/g}/${adj/g}`:''}` }); }
  // Part 4: draw from slope ratio y/x -> hyp (Pythagorean) + both angles
  const ratios = [[3,4],[5,2],[1,1]];
  const p4 = ratios.map(([y,x]) => { const hyp=Math.sqrt(y*y+x*x), a1=atanDeg(y/x), a2=90-a1;
    return { ratio:`${y}/${x}`, ans:`hypotenuse = √(${y}² + ${x}²) = √${y*y+x*x} ≈ ${f2(hyp)}; angles: tan⁻¹(${y}/${x}) = ${f2(a1)}° and 90° − ${f2(a1)}° = ${f2(a2)}°` }; });
  // Part 5: full solve (x and θ)
  const [la,lb]=[rint(r,6,18),rint(r,4,14)]; const hyp=Math.sqrt(la*la+lb*lb), t5a=atanDeg(la/lb); checks.push(f2(hyp),f2(t5a));
  const ang5=rint(r,35,65), leg5=rint(r,3,9); const x5=leg5*Math.tan(d(ang5)), t5b=90-ang5; checks.push(f2(x5));
  const p5 = [
    { svg: tri({ angle:'θ', opp:`${la}`, adj:`${lb}`, hyp:'x', o: rint(r,0,5) }),
      ans:`x = √(${la}² + ${lb}²) = ${f2(hyp)};  θ = tan⁻¹(${la}/${lb}) = ${f2(t5a)}°` },
    { svg: tri({ angle:`${ang5}°`, opp:'x', adj:`${leg5}`, o: rint(r,0,5) }),
      ans:`x = ${leg5}·tan(${ang5}°) = ${f2(x5)};  the other acute angle θ = 90° − ${ang5}° = ${t5b}°` },
  ];
  // scrambled check bank
  const bank = [...new Set(checks)].sort(() => r() - 0.5);
  return { p1, p2, p3, p4, p5, bank };
}

const STYLE = `<style>
@page{margin:.6in} *{box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;color:#111;max-width:8in;margin:0 auto;padding:16px}
h1{font-size:20px;margin:0 0 2px} .sub{font-size:12px;color:#333;margin:0 0 8px}
.meta{font-size:13px;margin:6px 0 12px}
.rules{font-size:12px;background:#f3f6ff;border:1px solid #c9d7ff;border-radius:6px;padding:8px 10px;margin-bottom:14px}
.q{margin:0 0 16px;page-break-inside:avoid} .q h2{font-size:15px;margin:10px 0 6px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px} .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}
.cell{font-size:13px;padding:4px 0}
.blank{display:inline-block;min-width:110px;border-bottom:1px solid #111;height:1em}
svg.tri{width:200px;height:116px;display:block;margin:2px 0} svg .n{font:15px Georgia,serif} svg .ang{font:14px Georgia,serif;fill:#1769ff} svg .hyp{font:13px Georgia,serif;fill:#777}
.worklines{border:1px dashed #bbb;border-radius:6px;height:70px;margin-top:4px}
.ansbox{background:#eafaef;border:1px solid #9bd9ad;border-radius:6px;padding:5px 9px;font-size:12px;margin-top:4px}
.eqline{font-size:12px;color:#444}
.bank{border:2px solid #111;border-radius:6px;padding:8px 12px;font-size:13px;margin-top:10px}
.pagebreak{page-break-before:always}
</style>`;

function build(P, key) {
  const slot = (a) => key ? `<div class="ansbox">${a}</div>` : `<span class="blank"></span>`;
  const work = (h=70) => key ? '' : `<div class="worklines" style="height:${h}px"></div>`;
  const hdr = `<h1>IM2 — Tangent & Inverse Tangent Mixed Practice${key?' — ANSWER KEY':''}</h1>
    <p class="sub">Standard G-SRT.6 · Chapter 3 · modeled on the “Tangent Ratios #2” sheet, 3.2.4 notes & Cycle test</p>
    ${key?'':`<p class="meta">Name: <span class="blank"></span>&nbsp; Per: <span class="blank" style="min-width:60px"></span>&nbsp; Date: <span class="blank" style="min-width:90px"></span></p>`}
    <div class="rules"><b>Rules:</b> calculator in <b>DEGREE mode</b> · <b>show all work</b> (write the equation) · sides to 2 decimals, angles to 2 decimals · sanity-check your answers against the Check bank.</div>`;
  const s1 = `<div class="q"><h2>1. Write the tangent equation, then solve for the missing side x.</h2>
    <div class="grid3">${P.p1.map((p,i)=>`<div class="cell">${'abcdef'[i]}. ${p.svg}<div class="eqline">Eq: ${key?`<b>${p.eq}</b>`:'<span class="blank"></span>'}</div>${work(56)}x = ${slot(p.ans)}</div>`).join('')}</div></div>`;
  const s2 = `<div class="q"><h2>2. Use inverse tangent (tan⁻¹) to find the missing angle θ.</h2>
    <div class="grid3">${P.p2.map((p,i)=>`<div class="cell">${'abcdef'[i]}. ${p.svg}${work(56)}θ = ${slot(p.ans)}</div>`).join('')}</div></div>`;
  const s3 = `<div class="q"><h2>3. State the tangent ratio as a reduced fraction.</h2>
    <div class="grid3">${P.p3.map((p,i)=>`<div class="cell">${'abc'[i]}. ${p.svg}tan(θ) = ${slot(p.ans)}</div>`).join('')}</div></div>`;
  const s4 = `<div class="q"><h2>4. Draw a right triangle with slope ratio y/x. Find the hypotenuse (Pythagorean theorem) and both acute angles (tangent + triangle sum).</h2>
    <div class="grid3">${P.p4.map((p,i)=>`<div class="cell">${'abc'[i]}. slope ratio = <b>${p.ratio}</b>${work(96)}${slot(p.ans)}</div>`).join('')}</div></div>`;
  const s5 = `<div class="q"><h2>5. Full solve — find x AND θ. Show all steps.</h2>
    <div class="grid2">${P.p5.map((p,i)=>`<div class="cell">${'ab'[i]}. ${p.svg}${work(80)}${slot(p.ans)}</div>`).join('')}</div></div>`;
  const bank = `<div class="bank"><b>Check (answers, scrambled):</b> ${P.bank.join(',&nbsp; ')}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>IM2 Tangent Mixed${key?' KEY':''}</title>${STYLE}</head>
<body>${hdr}${s1}${s2}<div class="pagebreak"></div>${s3}${s4}${s5}${key?'':bank}</body></html>`;
}

const P = make(4242);
writeFileSync(`${OUT_DIR}/Tangent & Inverse — Mixed Practice.html`, build(P, false));
writeFileSync(`${OUT_DIR}/Tangent & Inverse — Mixed Practice - KEY.html`, build(P, true));
console.log('Wrote:');
console.log(' - Tangent & Inverse — Mixed Practice.html');
console.log(' - Tangent & Inverse — Mixed Practice - KEY.html');
