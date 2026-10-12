function buildAll() {
  const out = [];
  for (let a = 0; a < 10; a++) for (let b = a + 1; b < 10; b++)
    for (let c = b + 1; c < 10; c++) for (let d = c + 1; d < 10; d++)
      out.push([a, b, c, d].map(String));
  return out;
}
const ALL_COMBOS = buildAll();
function hit(guess, secret) {
  return Array.from(guess).reduce((n, ch) => n + (secret.indexOf(ch) >= 0 ? 1 : 0), 0);
}
function filterCandidates(candidates, guess, feedback) {
  return candidates.filter(s => hit(guess, s) === feedback);
}
function recommend(candidates) {
  let best, bestWorst = Infinity;
  for (const g of candidates) {
    const buckets = [0, 0, 0, 0, 0];
    for (const s of candidates) buckets[hit(g, s)]++;
    const worst = Math.max.apply(null, buckets);
    if (worst < bestWorst) { best = g; bestWorst = worst; }
  }
  return best;
}
function validateGuess(guess) {
  if (!/^[0-9]{4}$/.test(guess)) return '请输入 4 位数字';
  if (new Set(guess).size !== 4) return '4 位数字不能重复';
  return '';
}
function selfTest() {
  const histogram = {}; let sum = 0, max = 0;
  for (const secret of ALL_COMBOS) {
    let candidates = ALL_COMBOS.slice(), rounds = 0;
    while (++rounds <= 9) {
      const g = recommend(candidates), feedback = hit(g, secret);
      if (feedback === 4) break;
      candidates = filterCandidates(candidates, g, feedback);
    }
    if (rounds > 8) throw new Error('超过 8 轮：' + secret.join(''));
    sum += rounds; max = Math.max(max, rounds);
    histogram[rounds] = (histogram[rounds] || 0) + 1;
  }
  const average = sum / ALL_COMBOS.length;
  if (average > 5.5) throw new Error('平均轮数超标：' + average);
  return { secrets: ALL_COMBOS.length, average, max, histogram };
}
const exported = { ALL_COMBOS, hit, filterCandidates, recommend, validateGuess, selfTest };

if (typeof module !== "undefined") module.exports = exported; else window.Solver = exported;
