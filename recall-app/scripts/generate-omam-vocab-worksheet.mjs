// Generates a print-ready HTML vocabulary worksheet (+ answer key) for Hailey's
// English 1 novel study of Steinbeck's "Of Mice and Men". Uses the same 11 vocab
// words as her Recall deck "English - Of Mice and Men" so it reinforces the cards.
// Three parts: A) matching word->definition, B) fill-in-the-blank with a word bank
// (novel context), C) use-in-a-sentence. Answers computed/scrambled in code.
// Run from recall-app/:  node scripts/generate-omam-vocab-worksheet.mjs
import { writeFileSync } from 'fs';
const OUT_DIR = '/Users/hien_m_nguyen/Documents/StudyMaterials/IM2/Class Canvas';

const rng = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (arr, r) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// word, part of speech, student-friendly definition, context sentence (___ = blank)
const VOCAB = [
  ['aloof', 'adj', 'distant and uninvolved; keeping apart from others', 'Crooks stays ___ from the other men, keeping to himself in the harness room.'],
  ['apprehensive', 'adj', 'anxious or uneasy about what might happen', 'Lennie felt ___ that George would find out about the dead mouse.'],
  ['bindle', 'noun', 'a bundle of belongings tied in a blanket, carried by a traveling worker', 'Each man carried his ___ down the dusty road toward the ranch.'],
  ['contemptuous', 'adj', 'showing scorn, as if someone is beneath you', 'Curley gave Lennie a ___ sneer, as if he were worthless.'],
  ['lumbering', 'adj', 'moving in a slow, heavy, clumsy way', 'Lennie walked with a heavy, ___ gait, like a bear dragging its paws.'],
  ['mollify', 'verb', 'to calm or soothe someone\'s anger', 'Slim\'s quiet words helped ___ the angry men after the fight.'],
  ['morose', 'adj', 'gloomy and sullen', 'After his dog was shot, Candy lay on his bunk, ___ and silent.'],
  ['ominous', 'adj', 'threatening; giving the sense that something bad will happen', 'The dead mouse and the shot dog are ___ signs of the tragedy to come.'],
  ['pantomime', 'noun', 'acting something out with gestures and no words', 'Lennie went through the ___ of searching his pockets to hide the mouse.'],
  ['pugnacious', 'adj', 'eager to fight or argue', 'Curley is ___, always itching to prove himself against bigger men.'],
  ['skeptical', 'adj', 'doubtful that something is true', 'Crooks is ___ that the dream farm will ever really happen.'],
];

const STYLE = `<style>
@page{margin:.7in} *{box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;color:#111;max-width:7.5in;margin:0 auto;padding:18px;line-height:1.5}
h1{font-size:20px;margin:0 0 2px} .sub{font-size:12px;color:#444;margin:0 0 10px}
.meta{font-size:13px;margin:6px 0 14px}
h2{font-size:15px;margin:16px 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px}
.instr{font-size:12px;color:#444;margin:0 0 8px;font-style:italic}
table{border-collapse:collapse;width:100%;font-size:13px} td{padding:5px 6px;vertical-align:top}
.wordcol{width:46%} .numcol{width:28px;color:#555}
.word{font-weight:bold} .pos{color:#777;font-style:italic;font-size:11px}
.letter{width:26px;font-weight:bold}
.bank{border:2px solid #111;border-radius:6px;padding:8px 12px;font-size:13px;margin:8px 0 14px}
ol{margin:4px 0;padding-left:22px} ol.loose li{margin:9px 0}
.blank{display:inline-block;min-width:130px;border-bottom:1px solid #111}
.wline{display:block;border-bottom:1px solid #999;height:1.4em;margin:8px 0}
.ans{color:#127a2e;font-weight:bold}
.key h2{color:#127a2e}
.pagebreak{page-break-before:always}
</style>`;

function build(key) {
  const r = rng(77);
  const defsScrambled = shuffle(VOCAB.map((v, i) => ({ i, def: v[2] })), r); // for matching
  const letters = 'ABCDEFGHIJK';
  // map: which scrambled-letter holds each word's definition
  const letterForWord = {};
  defsScrambled.forEach((d, idx) => { letterForWord[d.i] = letters[idx]; });

  const partA = `<h2>Part A — Matching</h2>
    <p class="instr">Write the letter of the correct definition next to each word.</p>
    <table><tr><td class="wordcol"><table>
      ${VOCAB.map((v, i) => `<tr><td class="numcol">${i+1}.</td><td>${key ? `<span class="ans">${letterForWord[i]}</span>` : '____'} <span class="word">${v[0]}</span> <span class="pos">(${v[1]})</span></td></tr>`).join('')}
    </table></td><td style="width:54%"><table>
      ${defsScrambled.map((d, idx) => `<tr><td class="letter">${letters[idx]}.</td><td>${d.def}</td></tr>`).join('')}
    </table></td></tr></table>`;

  const bankWords = shuffle(VOCAB.map((v) => v[0]), rng(999));
  const partB = `<h2>Part B — Fill in the Blank</h2>
    <p class="instr">Choose the best word from the bank to complete each sentence from <i>Of Mice and Men</i>. Use each word once.</p>
    <div class="bank"><b>Word bank:</b> ${bankWords.join(' · ')}</div>
    <ol class="loose">${VOCAB.map((v) => `<li>${v[3].replace('___', key ? `<span class="ans">${v[0]}</span>` : '<span class="blank"></span>')}</li>`).join('')}</ol>`;

  const chosen = [0, 3, 7, 9]; // aloof, contemptuous, ominous, pugnacious
  const partC = `<h2>Part C — Use It</h2>
    <p class="instr">Write your own sentence for each word. It must clearly show the word's meaning (not just "I saw a ___").</p>
    <ol>${chosen.map((i) => `<li><b>${VOCAB[i][0]}</b>${key ? ` <span class="ans">— answers will vary; sentence must show "${VOCAB[i][2]}"</span>` : ''}<span class="wline"></span></li>`).join('')}</ol>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Of Mice and Men — Vocabulary${key ? ' KEY' : ''}</title>${STYLE}</head>
<body class="${key ? 'key' : ''}">
  <h1>Of Mice and Men — Vocabulary${key ? ' — ANSWER KEY' : ''}</h1>
  <p class="sub">English 1 · John Steinbeck · reinforces the Recall "Of Mice and Men" deck</p>
  ${key ? '' : `<p class="meta">Name: <span class="blank"></span>&nbsp;&nbsp; Period: <span class="blank" style="min-width:60px"></span>&nbsp;&nbsp; Date: <span class="blank" style="min-width:90px"></span></p>`}
  ${partA}${partB}<div class="pagebreak"></div>${partC}
</body></html>`;
}

writeFileSync(`${OUT_DIR}/Of Mice and Men - Vocabulary Worksheet.html`, build(false));
writeFileSync(`${OUT_DIR}/Of Mice and Men - Vocabulary Worksheet - KEY.html`, build(true));
console.log('Wrote:');
console.log(' - Of Mice and Men - Vocabulary Worksheet.html');
console.log(' - Of Mice and Men - Vocabulary Worksheet - KEY.html');
