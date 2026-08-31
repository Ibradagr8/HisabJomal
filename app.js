(() => {
  // src/engine.js
  var ABJAD = Object.freeze({
    \u0627: 1,
    \u0628: 2,
    \u062C: 3,
    \u062F: 4,
    \u0647: 5,
    \u0648: 6,
    \u0632: 7,
    \u062D: 8,
    \u0637: 9,
    \u064A: 10,
    \u0643: 20,
    \u0644: 30,
    \u0645: 40,
    \u0646: 50,
    \u0633: 60,
    \u0639: 70,
    \u0641: 80,
    \u0635: 90,
    \u0642: 100,
    \u0631: 200,
    \u0634: 300,
    \u062A: 400,
    \u062B: 500,
    \u062E: 600,
    \u0630: 700,
    \u0636: 800,
    \u0638: 900,
    \u063A: 1e3
  });
  var normalizations = Object.freeze({ \u0623: "\u0627", \u0625: "\u0627", \u0622: "\u0627", \u0621: "\u0627", \u0629: "\u0647", \u0626: "\u064A", \u0649: "\u064A", \u0624: "\u0648" });
  var ELEMENTS = Object.freeze({
    \u0646\u0627\u0631: ["\u0627", "\u0647", "\u0637", "\u0645", "\u0641", "\u0634", "\u0630"],
    \u0647\u0648\u0627\u0621: ["\u0628", "\u0648", "\u064A", "\u0646", "\u0635", "\u062A", "\u0636"],
    \u0645\u0627\u0621: ["\u062C", "\u0632", "\u0643", "\u0633", "\u0642", "\u062B", "\u0638"],
    \u062A\u0631\u0627\u0628: ["\u062F", "\u062D", "\u0644", "\u0639", "\u0631", "\u062E", "\u063A"]
  });
  var PLANETS = ["\u0634\u0645\u0633", "\u0642\u0645\u0631", "\u0645\u0631\u064A\u062E", "\u0639\u0637\u0627\u0631\u062F", "\u0645\u0634\u062A\u0631\u064A", "\u0632\u0647\u0631\u0629", "\u0632\u062D\u0644"];
  var ZODIAC = [
    ["\u0627\u0644\u062D\u0645\u0644", "\u0646\u0627\u0631"],
    ["\u0627\u0644\u062B\u0648\u0631", "\u062A\u0631\u0627\u0628"],
    ["\u0627\u0644\u062C\u0648\u0632\u0627\u0621", "\u0647\u0648\u0627\u0621"],
    ["\u0627\u0644\u0633\u0631\u0637\u0627\u0646", "\u0645\u0627\u0621"],
    ["\u0627\u0644\u0623\u0633\u062F", "\u0646\u0627\u0631"],
    ["\u0627\u0644\u0639\u0630\u0631\u0627\u0621", "\u062A\u0631\u0627\u0628"],
    ["\u0627\u0644\u0645\u064A\u0632\u0627\u0646", "\u0647\u0648\u0627\u0621"],
    ["\u0627\u0644\u0639\u0642\u0631\u0628", "\u0645\u0627\u0621"],
    ["\u0627\u0644\u0642\u0648\u0633", "\u0646\u0627\u0631"],
    ["\u0627\u0644\u062C\u062F\u064A", "\u062A\u0631\u0627\u0628"],
    ["\u0627\u0644\u062F\u0644\u0648", "\u0647\u0648\u0627\u0621"],
    ["\u0627\u0644\u062D\u0648\u062A", "\u0645\u0627\u0621"]
  ];
  var abjadOrder = Object.keys(ABJAD);
  var elementByLetter = Object.fromEntries(Object.entries(ELEMENTS).flatMap(([element, letters]) => letters.map((letter) => [letter, element])));
  function normalizeLetter(char) {
    return normalizations[char] || char;
  }
  function analyze(text = "") {
    const letters = [...text].map((raw, index) => {
      const normalized = normalizeLetter(raw);
      const value = ABJAD[normalized] || 0;
      return value ? { raw, normalized, value, index } : null;
    }).filter(Boolean);
    const words = text.trim().split(/\s+/).filter(Boolean).map((word) => ({ word, ...analyzeWord(word) }));
    const total = letters.reduce((sum, letter) => sum + letter.value, 0);
    return { text, total, count: letters.length, letters, words };
  }
  function analyzeWord(word) {
    const letters = [...word].map((raw) => {
      const normalized = normalizeLetter(raw);
      const value = ABJAD[normalized] || 0;
      return value ? { raw, normalized, value } : null;
    }).filter(Boolean);
    return { total: letters.reduce((s, x) => s + x.value, 0), count: letters.length, letters };
  }
  function profile(text) {
    const result = analyze(text);
    const counts = Object.fromEntries(Object.keys(ELEMENTS).map((key) => [key, 0]));
    const planets = Object.fromEntries(PLANETS.map((key) => [key, 0]));
    result.letters.forEach(({ normalized }) => {
      counts[elementByLetter[normalized]]++;
      planets[PLANETS[abjadOrder.indexOf(normalized) % 7]]++;
    });
    const leaders = objectLeaders(counts);
    const planetLeaders = objectLeaders(planets);
    const mod9 = result.total ? result.total % 9 || 9 : null;
    const mod12 = result.total ? result.total % 12 || 12 : null;
    return { ...result, elements: counts, leaders, planets, planetLeaders, mod9, zodiac: mod12 ? ZODIAC[mod12 - 1] : null };
  }
  function objectLeaders(obj) {
    const max = Math.max(...Object.values(obj));
    return max ? Object.keys(obj).filter((k) => obj[k] === max) : [];
  }
  function compareProfiles(first, second, firstRole = "\u0637\u0627\u0644\u0628") {
    if (!first.mod9 || !second.mod9) return null;
    const same = first.mod9 === second.mod9;
    const bothOdd = first.mod9 % 2 && second.mod9 % 2;
    let winner;
    let reason;
    if (same) {
      winner = bothOdd ? firstRole : firstRole === "\u0637\u0627\u0644\u0628" ? "\u0645\u0637\u0644\u0648\u0628" : "\u0637\u0627\u0644\u0628";
      reason = bothOdd ? "\u0628\u0627\u0642\u064A\u0627\u0646 \u0645\u062A\u0633\u0627\u0648\u064A\u0627\u0646 \u0641\u0631\u062F\u064A\u0627\u0646: \u0627\u0644\u0637\u0627\u0644\u0628 \u064A\u063A\u0644\u0628" : "\u0628\u0627\u0642\u064A\u0627\u0646 \u0645\u062A\u0633\u0627\u0648\u064A\u0627\u0646 \u0632\u0648\u062C\u064A\u0627\u0646: \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u064A\u063A\u0644\u0628";
    } else if (first.mod9 % 2 === second.mod9 % 2) {
      winner = first.mod9 < second.mod9 ? firstRole : firstRole === "\u0637\u0627\u0644\u0628" ? "\u0645\u0637\u0644\u0648\u0628" : "\u0637\u0627\u0644\u0628";
      reason = "\u0628\u0627\u0642\u064A\u0627\u0646 \u0645\u062E\u062A\u0644\u0641\u0627\u0646 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0632\u0648\u062C\u064A\u0629: \u0627\u0644\u0623\u0635\u063A\u0631 \u064A\u063A\u0644\u0628";
    } else {
      winner = first.mod9 > second.mod9 ? firstRole : firstRole === "\u0637\u0627\u0644\u0628" ? "\u0645\u0637\u0644\u0648\u0628" : "\u0637\u0627\u0644\u0628";
      reason = "\u0628\u0627\u0642\u064A\u0627\u0646 \u0645\u062E\u062A\u0644\u0641\u0627 \u0627\u0644\u0632\u0648\u062C\u064A\u0629: \u0627\u0644\u0623\u0643\u0628\u0631 \u064A\u063A\u0644\u0628";
    }
    return { winner, reason };
  }
  function compareElements(first, second) {
    if (!first.leaders.length || !second.leaders.length || first.leaders.length > 1 || second.leaders.length > 1) return { kind: "\u0645\u0631\u0643\u0651\u0628", text: "\u0645\u062A\u0639\u0627\u062F\u0644 / \u0645\u0631\u0643\u0651\u0628 \u2014 \u064A\u064F\u0642\u0631\u0623 \u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0637\u0628\u0627\u0626\u0639 \u0628\u062F\u0644 \u062D\u0643\u0645 \u0648\u0627\u062D\u062F." };
    const [a] = first.leaders;
    const [b] = second.leaders;
    if (a === b) return { kind: "\u0627\u0646\u0633\u062C\u0627\u0645", text: "\u0627\u0646\u0633\u062C\u0627\u0645: \u0627\u0644\u0637\u0628\u0639 \u0627\u0644\u063A\u0627\u0644\u0628 \u0645\u062A\u0637\u0627\u0628\u0642." };
    const winningPairs = /* @__PURE__ */ new Set(["\u0646\u0627\u0631/\u0647\u0648\u0627\u0621", "\u0647\u0648\u0627\u0621/\u062A\u0631\u0627\u0628", "\u062A\u0631\u0627\u0628/\u0645\u0627\u0621", "\u0645\u0627\u0621/\u0646\u0627\u0631"]);
    if (winningPairs.has(`${a}/${b}`)) return { kind: "\u063A\u0644\u0628\u0629 \u0637\u0628\u0639", text: `\u063A\u0644\u0628\u0629 \u0637\u0628\u0639: ${a} \u064A\u063A\u0644\u0628 ${b}.` };
    if (winningPairs.has(`${b}/${a}`)) return { kind: "\u063A\u0644\u0628\u0629 \u0637\u0628\u0639", text: `\u063A\u0644\u0628\u0629 \u0637\u0628\u0639: ${b} \u064A\u063A\u0644\u0628 ${a}.` };
    return { kind: "\u062A\u0636\u0627\u062F", text: `\u062A\u0636\u0627\u062F: ${a} \u0645\u0639 ${b}.` };
  }
  function compareCelestial(first, second) {
    const planet = !first.planetLeaders.length || !second.planetLeaders.length || first.planetLeaders.length > 1 || second.planetLeaders.length > 1 ? "\u062A\u0639\u0627\u062F\u0644 \u0643\u0648\u0643\u0628\u064A \u062D\u0631\u0641\u064A \u2014 \u0644\u0627 \u062D\u0643\u0645 \u0642\u0627\u0637\u0639." : first.planetLeaders[0] === second.planetLeaders[0] ? "\u062A\u0648\u0627\u0641\u0642 \u0643\u0648\u0643\u0628\u064A \u062D\u0631\u0641\u064A." : `\u0627\u062E\u062A\u0644\u0627\u0641 \u0643\u0648\u0643\u0628\u064A \u062D\u0631\u0641\u064A: ${first.planetLeaders[0]} / ${second.planetLeaders[0]}.`;
    let zodiac = "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u0631\u0648\u062C \u062D\u0633\u0627\u0628\u064A\u0629 \u0644\u0644\u0645\u0642\u0627\u0631\u0646\u0629.";
    if (first.zodiac && second.zodiac) zodiac = first.zodiac[0] === second.zodiac[0] ? "\u062A\u0637\u0627\u0628\u0642 \u0627\u0644\u0628\u0631\u062C \u0627\u0644\u062D\u0633\u0627\u0628\u064A." : first.zodiac[1] === second.zodiac[1] ? `\u0627\u062E\u062A\u0644\u0627\u0641 \u0645\u0639 \u0627\u062A\u062D\u0627\u062F \u0627\u0644\u0639\u0646\u0635\u0631: ${first.zodiac[1]}.` : "\u0627\u062E\u062A\u0644\u0627\u0641 \u0643\u0627\u0645\u0644 \u0628\u064A\u0646 \u0627\u0644\u0628\u0631\u062C\u064A\u0646 \u0627\u0644\u062D\u0633\u0627\u0628\u064A\u064A\u0646.";
    return { planet, zodiac };
  }
  function makeMagicSquare(n, target) {
    let grid;
    if (n % 2) grid = oddSquare(n);
    else grid = doublyEvenSquare(n);
    const C = n * (n * n + 1) / 2;
    let best = null;
    for (let d = 1; d <= Math.max(2, Math.ceil((target || C) / n)); d++) {
      const approxA = Math.max(1, Math.round(((target || C) - (C - n) * d) / n));
      for (const a of [approxA - 1, approxA, approxA + 1].filter((x) => x >= 1)) {
        const M = n * a + (C - n) * d;
        const candidate = { a, d, M, delta: (target || 0) - M };
        if (!best || Math.abs(candidate.delta) < Math.abs(best.delta) || Math.abs(candidate.delta) === Math.abs(best.delta) && (candidate.d < best.d || candidate.d === best.d && candidate.a < best.a)) best = candidate;
      }
    }
    return { n, C, ...best, grid: grid.map((row) => row.map((v) => best.a + (v - 1) * best.d)) };
  }
  function oddSquare(n) {
    const g = Array.from({ length: n }, () => Array(n).fill(0));
    let r = 0, c = Math.floor(n / 2);
    for (let v = 1; v <= n * n; v++) {
      g[r][c] = v;
      const nr = (r - 1 + n) % n, nc = (c + 1) % n;
      if (g[nr][nc]) r = (r + 1) % n;
      else {
        r = nr;
        c = nc;
      }
    }
    return g;
  }
  function doublyEvenSquare(n) {
    const g = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_2, c) => r * n + c + 1));
    return g.map((row, r) => row.map((v, c) => r % 4 === c % 4 || r % 4 + c % 4 === 3 ? n * n + 1 - v : v));
  }
  function formatNumber(num2) {
    return new Intl.NumberFormat("ar-EG").format(num2 || 0);
  }

  // src/data.js
  var males = `\u0622\u062F\u0645|\u0622\u0633\u0631|\u0622\u0635\u0641|\u0623\u062D\u0645\u062F|\u0623\u062F\u0647\u0645|\u0623\u062F\u064A\u0628|\u0623\u0631\u063A\u062F|\u0623\u0631\u0643\u0627\u0646|\u0623\u0633\u0627\u0645\u0629|\u0623\u0633\u0639\u062F|\u0623\u0633\u064A\u062F|\u0623\u0634\u0631\u0641|\u0623\u0635\u064A\u0644|\u0623\u0643\u0631\u0645|\u0623\u0645\u064A\u0646|\u0623\u0646\u0633|\u0623\u064A\u0645\u0646|\u0623\u064A\u0648\u0628|\u0625\u0628\u0631\u0627\u0647\u064A\u0645|\u0625\u062F\u0631\u064A\u0633|\u0625\u0633\u062D\u0627\u0642|\u0625\u0633\u0645\u0627\u0639\u064A\u0644|\u0625\u0633\u0644\u0627\u0645|\u0625\u064A\u0627\u062F|\u0625\u064A\u0627\u0633|\u0628\u0627\u0633\u0645|\u0628\u0627\u0633\u0644|\u0628\u062F\u0631|\u0628\u062F\u0631\u0627\u0646|\u0628\u0631\u0627\u0621|\u0628\u0634\u064A\u0631|\u0628\u0644\u0627\u0644|\u0628\u0647\u0627\u0621|\u0628\u0647\u062C\u062A|\u062A\u0627\u0645\u0631|\u062A\u0648\u0641\u064A\u0642|\u062A\u064A\u0645|\u062A\u064A\u0645\u0648\u0631|\u062B\u0627\u0628\u062A|\u062C\u0627\u0628\u0631|\u062C\u0627\u062F|\u062C\u0627\u0633\u0631|\u062C\u0644\u0627\u0644|\u062C\u0645\u0627\u0644|\u062C\u0647\u0627\u062F|\u062D\u0627\u0645\u062F|\u062D\u0628\u064A\u0628|\u062D\u0633\u0627\u0646|\u062D\u0633\u0646|\u062D\u0633\u064A\u0646|\u062D\u0630\u064A\u0641\u0629|\u062D\u0633\u0627\u0645|\u062D\u0645\u0627\u062F|\u062D\u0645\u0632\u0629|\u062D\u0645\u062F|\u062D\u0645\u062F\u0627\u0646|\u062D\u0645\u062F\u064A|\u062D\u064A\u062F\u0631|\u062E\u0627\u0644\u062F|\u062E\u0644\u064A\u0644|\u062E\u0645\u064A\u0633|\u062F\u0627\u0648\u062F|\u062F\u0631\u064A\u062F|\u0631\u0627\u0626\u062F|\u0631\u0627\u0636\u064A|\u0631\u0627\u0634\u062F|\u0631\u0627\u0645\u064A|\u0631\u0628\u064A\u0639|\u0631\u062C\u0627\u0626\u064A|\u0631\u0634\u0627\u062F|\u0631\u0634\u062F\u064A|\u0631\u0636\u0627|\u0631\u0641\u0627\u0639\u064A|\u0631\u0641\u0639\u062A|\u0631\u0645\u0632\u064A|\u0631\u0624\u0648\u0641|\u0631\u064A\u0627\u0646|\u0632\u0627\u0647\u0631|\u0632\u0643\u0631\u064A\u0627|\u0632\u0643\u064A|\u0632\u0647\u064A\u0631|\u0632\u064A\u0627\u062F|\u0632\u064A\u0646|\u0632\u064A\u0646 \u0627\u0644\u062F\u064A\u0646|\u0633\u0627\u062C\u062F|\u0633\u0627\u0644\u0645|\u0633\u0627\u0645\u062D|\u0633\u0627\u0645\u064A|\u0633\u0627\u0647\u0631|\u0633\u0639\u062F|\u0633\u0639\u064A\u062F|\u0633\u0641\u064A\u0627\u0646|\u0633\u0644\u0645\u0627\u0646|\u0633\u0644\u064A\u0645|\u0633\u0644\u064A\u0645\u0627\u0646|\u0633\u0645\u064A\u0631|\u0633\u0646\u062F|\u0633\u064A\u062F|\u0634\u0627\u062F\u064A|\u0634\u0627\u0647\u0631|\u0634\u0627\u0643\u0631|\u0634\u0631\u064A\u0641|\u0634\u0639\u064A\u0628|\u0634\u0648\u0642\u064A|\u0635\u0627\u0628\u0631|\u0635\u0627\u0644\u062D|\u0635\u0628\u062D\u064A|\u0635\u0641\u0648\u062A|\u0635\u0644\u0627\u062D|\u0635\u0647\u064A\u0628|\u0636\u064A\u0627\u0621|\u0637\u0627\u0631\u0642|\u0637\u0647|\u0637\u064A\u0628|\u0639\u0627\u0628\u062F|\u0639\u0627\u062F\u0644|\u0639\u0627\u0631\u0641|\u0639\u0627\u0635\u0645|\u0639\u0627\u0637\u0641|\u0639\u0627\u0645\u0631|\u0639\u0627\u0647\u062F|\u0639\u0628\u062F\u0627\u0644\u0631\u062D\u0645\u0646|\u0639\u0628\u062F\u0627\u0644\u0631\u062D\u064A\u0645|\u0639\u0628\u062F\u0627\u0644\u0639\u0632\u064A\u0632|\u0639\u0628\u062F\u0627\u0644\u063A\u0646\u064A|\u0639\u0628\u062F\u0627\u0644\u0641\u062A\u0627\u062D|\u0639\u0628\u062F\u0627\u0644\u0642\u0627\u062F\u0631|\u0639\u0628\u062F\u0627\u0644\u0643\u0631\u064A\u0645|\u0639\u0628\u062F\u0627\u0644\u0644\u0647|\u0639\u0628\u062F\u0627\u0644\u0644\u0637\u064A\u0641|\u0639\u0628\u062F\u0627\u0644\u0645\u0644\u0643|\u0639\u0628\u062F\u0627\u0644\u0645\u0646\u0639\u0645|\u0639\u0628\u062F\u0627\u0644\u0645\u062C\u064A\u062F|\u0639\u0628\u062F\u0627\u0644\u0645\u0637\u0644\u0628|\u0639\u0628\u062F\u0627\u0644\u0645\u0624\u0645\u0646|\u0639\u0628\u062F\u0627\u0644\u0646\u0627\u0635\u0631|\u0639\u0628\u062F\u0647|\u0639\u062B\u0645\u0627\u0646|\u0639\u062F\u0646\u0627\u0646|\u0639\u0632\u062A|\u0639\u0632 \u0627\u0644\u062F\u064A\u0646|\u0639\u0637\u064A\u0629|\u0639\u0641\u064A\u0641|\u0639\u0642\u064A\u0644|\u0639\u0644\u0627\u0621|\u0639\u0644\u064A|\u0639\u0645\u0627\u0631|\u0639\u0645\u0631|\u0639\u0645\u0627\u062F|\u0639\u0645\u0631\u0627\u0646|\u0639\u064A\u0627\u0636|\u0639\u064A\u0633\u0649|\u063A\u0627\u0644\u0628|\u063A\u0627\u0646\u0645|\u063A\u0633\u0627\u0646|\u0641\u0627\u0631\u0633|\u0641\u0627\u062F\u064A|\u0641\u0627\u062E\u0631|\u0641\u0627\u0636\u0644|\u0641\u062A\u062D\u064A|\u0641\u062E\u0631 \u0627\u0644\u062F\u064A\u0646|\u0641\u0631\u0627\u062A|\u0641\u0631\u062C|\u0641\u0631\u062D\u0627\u062A|\u0641\u0631\u064A\u062F|\u0641\u0647\u0645\u064A|\u0641\u0624\u0627\u062F|\u0641\u064A\u0635\u0644|\u0642\u0627\u0633\u0645|\u0642\u0635\u064A|\u0643\u0645\u0627\u0644|\u0643\u0646\u0627\u0646|\u0643\u0631\u064A\u0645|\u0644\u0624\u064A|\u0644\u0637\u0641\u064A|\u0645\u0627\u062C\u062F|\u0645\u0627\u0644\u0643|\u0645\u0627\u0647\u0631|\u0645\u0628\u0627\u0631\u0643|\u0645\u062C\u0627\u0647\u062F|\u0645\u062C\u062F\u064A|\u0645\u062D\u0633\u0646|\u0645\u062D\u0645\u062F|\u0645\u062D\u0645\u0648\u062F|\u0645\u0631\u0627\u062F|\u0645\u0631\u0648\u0627\u0646|\u0645\u0635\u0639\u0628|\u0645\u0635\u0637\u0641\u0649|\u0645\u0639\u062A\u0632|\u0645\u0639\u0627\u0630|\u0645\u0639\u0627\u0648\u064A\u0629|\u0645\u0646\u0635\u0648\u0631|\u0645\u0646\u064A\u0631|\u0645\u0647\u062F\u064A|\u0645\u0647\u064A\u0628|\u0645\u0648\u0633\u0649|\u0645\u064A\u062B\u0645|\u0646\u0627\u0635\u0631|\u0646\u0627\u062C\u064A|\u0646\u0628\u064A\u0644|\u0646\u062C\u064A\u0628|\u0646\u0630\u064A\u0631|\u0646\u0632\u0627\u0631|\u0646\u0633\u064A\u0645|\u0646\u0634\u0623\u062A|\u0646\u0635\u0631|\u0646\u0636\u0627\u0644|\u0646\u0639\u064A\u0645|\u0646\u0648\u0631|\u0646\u0648\u062D|\u0647\u0627\u062F\u064A|\u0647\u0627\u0631\u0648\u0646|\u0647\u0627\u0634\u0645|\u0647\u0627\u0646\u064A|\u0647\u0634\u0627\u0645|\u0647\u064A\u062B\u0645|\u0648\u0627\u0626\u0644|\u0648\u062C\u062F\u064A|\u0648\u062D\u064A\u062F|\u0648\u0644\u064A\u062F|\u064A\u0627\u0633\u0631|\u064A\u0627\u0633\u064A\u0646|\u064A\u062D\u064A\u0649|\u064A\u0632\u0646|\u064A\u0648\u0633\u0641|\u064A\u0648\u0646\u0633`;
  var females = `\u0622\u0628\u0627\u0621|\u0622\u062C\u0644\u0629|\u0622\u0645\u0627\u0644|\u0622\u0645\u0646\u0629|\u0622\u064A\u0627\u062A|\u0622\u064A\u0629|\u0623\u0628\u0631\u0627\u0631|\u0627\u0628\u062A\u0633\u0627\u0645|\u0627\u0628\u062A\u0647\u0627\u0644|\u0623\u062B\u064A\u0631|\u0623\u062C\u0641\u0627\u0646|\u0623\u062D\u0644\u0627\u0645|\u0623\u0631\u0648\u0649|\u0623\u0631\u064A\u062C|\u0623\u0631\u064A\u0627\u0645|\u0623\u0632\u0647\u0627\u0631|\u0623\u0633\u0645\u0627\u0621|\u0623\u0635\u0627\u0644\u0629|\u0623\u0641\u0646\u0627\u0646|\u0623\u0644\u0627\u0621|\u0623\u0644\u0637\u0627\u0641|\u0623\u0645\u0644|\u0623\u0645\u062C\u0627\u062F|\u0623\u0645\u064A\u0631\u0629|\u0623\u0645\u0627\u0646\u064A|\u0623\u0645\u064A\u0645\u0629|\u0623\u0646\u0641\u0627\u0644|\u0623\u0646\u0648\u0627\u0631|\u0623\u0646\u064A\u0633\u0629|\u0623\u0648\u0631\u0627\u062F|\u0625\u0628\u0627\u0621|\u0625\u0628\u062A\u0647\u0627\u062C|\u0625\u062D\u0633\u0627\u0646|\u0625\u062E\u0644\u0627\u0635|\u0625\u0633\u0631\u0627\u0621|\u0625\u0634\u0631\u0627\u0642|\u0625\u0639\u0632\u0627\u0632|\u0625\u0643\u0631\u0627\u0645|\u0625\u0644\u0647\u0627\u0645|\u0625\u064A\u0645\u0627\u0646|\u0625\u064A\u0646\u0627\u0633|\u0628\u062A\u0648\u0644|\u0628\u0631\u0627\u0621\u0629|\u0628\u0634\u0631\u0649|\u0628\u064A\u0627\u0646|\u062A\u0627\u0644\u0627|\u062A\u0628\u0627\u0631\u0643|\u062A\u0633\u0646\u064A\u0645|\u062A\u0647\u0627\u0646\u064A|\u062C\u0645\u0627\u0646\u0629|\u062C\u0646\u0627\u0646|\u062C\u0646\u0649|\u062C\u0647\u0627\u062F|\u062C\u0645\u064A\u0644\u0629|\u062C\u0648\u0631\u064A\u0629|\u062D\u0628\u064A\u0628\u0629|\u062D\u0633\u0646\u0627\u0621|\u062D\u0633\u0646\u064A\u0629|\u062D\u0635\u0629|\u062D\u0644\u0627|\u062D\u0646\u0627\u0646|\u062D\u0646\u064A\u0646|\u062D\u0648\u0631|\u062D\u0648\u0631\u0627\u0621|\u062D\u0648\u0631\u064A\u0629|\u062D\u064A\u0627\u0629|\u062E\u062F\u064A\u062C\u0629|\u062E\u0644\u0648\u062F|\u062F\u0627\u0646\u064A\u0629|\u062F\u0639\u0627\u0621|\u062F\u0644\u0627\u0644|\u062F\u0646\u064A\u0627|\u062F\u064A\u0645\u0627|\u0631\u0627\u0628\u0639\u0629|\u0631\u0627\u0626\u062F\u0629|\u0631\u0627\u0646\u064A\u0629|\u0631\u0628\u0627\u0628|\u0631\u062D\u0627\u0628|\u0631\u062D\u0645\u0629|\u0631\u0632\u0627\u0646|\u0631\u0633\u064A\u0644|\u0631\u0641\u064A\u062F\u0629|\u0631\u0642\u064A\u0629|\u0631\u0646\u0627|\u0631\u0647\u0641|\u0631\u0648\u0627\u0646|\u0631\u0648\u0636\u0629|\u0631\u0624\u0649|\u0631\u064A\u062A\u0627\u0644|\u0631\u064A\u0645\u0627|\u0631\u064A\u0645|\u0631\u064A\u0647\u0627\u0645|\u0632\u064A\u0646\u0628|\u0632\u0647\u0631\u0627\u0621|\u0632\u0647\u0648\u0629|\u0632\u0647\u064A\u0629|\u0632\u064A\u0646\u0629|\u0633\u0627\u062C\u062F\u0629|\u0633\u0627\u0631\u0629|\u0633\u0627\u0631\u064A\u0629|\u0633\u0639\u0627\u062F|\u0633\u0645\u0627|\u0633\u0645\u064A\u0629|\u0633\u0646\u0627\u0621|\u0633\u0647\u0627\u0645|\u0633\u0647\u0649|\u0633\u0646\u062F\u0633|\u0633\u0646\u0627\u0628\u0644|\u0633\u0648\u0633\u0646|\u0633\u064A\u0631\u064A\u0646|\u0634\u0627\u062F\u064A\u0629|\u0634\u0627\u062F\u0646|\u0634\u0630\u0649|\u0634\u0631\u0648\u0642|\u0634\u0631\u064A\u0641\u0629|\u0634\u0641\u0627\u0621|\u0635\u0641\u0627\u0621|\u0635\u0641\u064A\u0629|\u0636\u062D\u0649|\u0637\u064A\u0628\u0629|\u0639\u0627\u0626\u0634\u0629|\u0639\u0627\u0628\u062F\u0629|\u0639\u0627\u0644\u064A\u0629|\u0639\u0628\u064A\u0631|\u0639\u0630\u0631\u0627\u0621|\u0639\u0632\u0629|\u0639\u0632\u064A\u0632\u0629|\u0639\u0641\u0627\u0641|\u0639\u0641\u0631\u0627\u0621|\u0639\u0644\u0627|\u0639\u0644\u064A\u0627\u0621|\u0639\u0647\u062F|\u063A\u0627\u062F\u0629|\u063A\u0627\u0644\u064A\u0629|\u063A\u062F\u064A\u0631|\u063A\u0631\u0627\u0645|\u063A\u0632\u0644|\u063A\u0641\u0631\u0627\u0646|\u0641\u0627\u0637\u0645\u0629|\u0641\u062C\u0631|\u0641\u0631\u062D|\u0641\u0631\u062F\u0648\u0633|\u0641\u0631\u064A\u0627\u0644|\u0641\u0631\u064A\u062F\u0629|\u0641\u0636\u0629|\u0642\u0645\u0631|\u0643\u0646\u0632\u0629|\u0643\u0648\u062B\u0631|\u0644\u0624\u0644\u0624\u0629|\u0644\u0628\u0627\u0628\u0629|\u0644\u0628\u0646\u0649|\u0644\u0637\u064A\u0641\u0629|\u0644\u064A\u0627\u0644|\u0644\u064A\u0627\u0646|\u0644\u064A\u0644\u0649|\u0645\u0627\u062C\u062F\u0629|\u0645\u0627\u0631\u064A\u0629|\u0645\u0627\u0633\u0629|\u0645\u062C\u062F|\u0645\u062F\u064A\u062D\u0629|\u0645\u0631\u0648\u0629|\u0645\u0631\u064A\u0645|\u0645\u0632\u0646\u0629|\u0645\u0633\u0643|\u0645\u0635\u0648\u0646\u0629|\u0645\u0639\u0627\u0644\u064A|\u0645\u0644\u0627\u0643|\u0645\u0646\u0627\u0644|\u0645\u0646\u0649|\u0645\u0646\u064A\u0631\u0629|\u0645\u0647\u062C\u0629|\u0645\u0647\u0631\u0629|\u0645\u0647\u0627|\u0645\u064A|\u0645\u064A\u0627\u062F\u0629|\u0645\u064A\u0633|\u0645\u064A\u0633\u0627\u0621|\u0645\u064A\u0633\u0648\u0646|\u0646\u0627\u0626\u0644\u0629|\u0646\u0627\u062F\u064A\u0629|\u0646\u0627\u0647\u062F|\u0646\u062C\u0627\u0629|\u0646\u062C\u0627\u062D|\u0646\u062C\u0648\u062F|\u0646\u062F\u0649|\u0646\u0631\u062C\u0633|\u0646\u0633\u0631\u064A\u0646|\u0646\u063A\u0645|\u0646\u0647\u0627\u0644|\u0646\u0647\u0649|\u0646\u0648\u0631|\u0646\u0648\u0631\u0627|\u0646\u0648\u0631\u0627\u0646|\u0646\u0648\u0631\u0633\u064A\u0646|\u0646\u0648\u0627\u0644|\u0647\u0627\u0644\u0629|\u0647\u062A\u0627\u0646|\u0647\u062F\u0649|\u0647\u062F\u0627\u064A\u0629|\u0647\u0644\u0627|\u0647\u0645\u0633\u0629|\u0647\u0646\u0627\u0621|\u0647\u0646\u062F|\u0647\u064A\u0627\u0645|\u0647\u064A\u0641\u0627\u0621|\u0647\u064A\u0644\u0629|\u0648\u0635\u0627\u0644|\u0648\u0641\u0627\u0621|\u0648\u0644\u0627\u0621|\u064A\u0627\u0633\u0645\u064A\u0646|\u064A\u0627\u0631\u0627|\u064A\u0642\u064A\u0646|\u064A\u0645\u0627\u0645\u0629|\u064A\u0645\u0646\u0649`;
  function uniqueNames(source) {
    return [...new Set(source.split("|").map((name) => name.trim()).filter(Boolean))];
  }
  var maleNames = uniqueNames(males);
  var femaleNames = uniqueNames(females);

  // src/main.js
  var STATE_KEYS = ["section", "text", "target", "nameA", "motherA", "nameB", "motherB", "role", "father", "mother", "desiredBabyName", "maleSearch", "femaleSearch", "awfaqText", "rank", "awfaqMode"];
  function readSharedState() {
    try {
      const encoded = new URLSearchParams(location.search).get("state");
      return encoded ? JSON.parse(decodeURIComponent(escape(atob(encoded))) || "{}") : {};
    } catch {
      return {};
    }
  }
  var stored = JSON.parse(localStorage.getItem("hisab-jomal-state") || "{}");
  var state = { section: "calculator", text: "", target: "", nameA: "", motherA: "", nameB: "", motherB: "", role: "\u0637\u0627\u0644\u0628", father: "", mother: "", desiredBabyName: "", maleSearch: "", femaleSearch: "", awfaqText: "", rank: 4, awfaqMode: "square", history: [], suggestionLimit: 12, ...stored, ...readSharedState() };
  var app = document.querySelector("#app");
  var arabicDate = new Intl.DateTimeFormat("ar-EG", { dateStyle: "long" }).format(/* @__PURE__ */ new Date());
  function persist() {
    localStorage.setItem("hisab-jomal-state", JSON.stringify(state));
  }
  function esc(s = "") {
    return String(s).replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);
  }
  function toast(message) {
    document.querySelector(".toast")?.remove();
    const e = document.createElement("div");
    e.className = "toast";
    e.textContent = message;
    document.body.append(e);
    setTimeout(() => e.remove(), 2200);
  }
  function copy(text) {
    navigator.clipboard?.writeText(text).then(() => toast("\u062A\u0645 \u0627\u0644\u0646\u0633\u062E")).catch(() => toast("\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0646\u0633\u062E"));
  }
  function shareLink() {
    const shared = Object.fromEntries(STATE_KEYS.map((key) => [key, state[key]]));
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shared))));
    return `${location.href.split("?")[0]}?state=${encodeURIComponent(encoded)}`;
  }
  function copyShareLink() {
    copy(shareLink());
  }
  function copyNameComparison() {
    const a = profile(`${state.nameA} ${state.motherA}`), b = profile(`${state.nameB} ${state.motherB}`);
    if (!state.nameA.trim() || !state.nameB.trim() || !a.mod9 || !b.mod9) return toast("\u0623\u062F\u062E\u0644 \u0627\u0644\u0627\u0633\u0645\u064A\u0646 \u0623\u0648\u0644\u064B\u0627");
    const firstRole = state.role, secondRole = firstRole === "\u0637\u0627\u0644\u0628" ? "\u0645\u0637\u0644\u0648\u0628" : "\u0637\u0627\u0644\u0628";
    const comparison = compareProfiles(a, b, firstRole), elements = compareElements(a, b), celestial = compareCelestial(a, b);
    const firstWins = comparison.winner === firstRole;
    const winner = firstWins ? state.nameA : state.nameB, loser = firstWins ? state.nameB : state.nameA;
    copy([`\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0623\u0633\u0645\u0627\u0621`, `${state.nameA} (${firstRole}): \u0627\u0644\u0645\u062C\u0645\u0648\u0639 ${num(a.total)} \xB7 \u0627\u0644\u0628\u0627\u0642\u064A ${num(a.mod9)} \xB7 \u0627\u0644\u0637\u0628\u0639 ${a.leaders.join(" / ") || "\u2014"}`, `${state.nameB} (${secondRole}): \u0627\u0644\u0645\u062C\u0645\u0648\u0639 ${num(b.total)} \xB7 \u0627\u0644\u0628\u0627\u0642\u064A ${num(b.mod9)} \xB7 \u0627\u0644\u0637\u0628\u0639 ${b.leaders.join(" / ") || "\u2014"}`, `${winner} \u063A\u0627\u0644\u0628 \u2014 ${loser} \u0645\u063A\u0644\u0648\u0628`, comparison.reason, `${elements.kind}: ${elements.text}`, celestial.planet, celestial.zodiac].join("\n"));
  }
  function exportCard(title, lines, filename) {
    const canvas = document.createElement("canvas");
    const width = 1200;
    const height = Math.max(630, 260 + lines.length * 68);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f6f3ea";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#123c35";
    ctx.fillRect(0, 0, width, 18);
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.fillStyle = "#123c35";
    ctx.font = "700 50px Arial";
    ctx.fillText(title, width - 75, 110);
    ctx.fillStyle = "#6a756e";
    ctx.font = "28px Arial";
    ctx.fillText(`\u062D\u0633\u0627\u0628 \u0627\u0644\u062C\u0645\u0644 \xB7 \u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u0628\u0646 \u0635\u0644\u0627\u062D \xB7 ${arabicDate}`, width - 75, 158);
    ctx.strokeStyle = "#d5ddd7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(75, 190);
    ctx.lineTo(width - 75, 190);
    ctx.stroke();
    ctx.fillStyle = "#17322e";
    ctx.font = "34px Arial";
    lines.forEach((line, i) => ctx.fillText(line, width - 75, 258 + i * 62));
    canvas.toBlob((blob) => {
      if (!blob) return toast("\u062A\u0639\u0630\u0651\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0635\u0648\u0631\u0629");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1e3);
      toast("\u062A\u0645 \u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u0643\u0635\u0648\u0631\u0629");
    }, "image/png");
  }
  function setSection(id) {
    state.section = id;
    persist();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function num(n) {
    return formatNumber(n);
  }
  function profileCard(p) {
    const total = p.count || 1;
    return `<div class="metric"><span>\u0627\u0644\u0645\u062C\u0645\u0648\u0639</span><b>${num(p.total)}</b></div><div class="metric"><span>\u0627\u0644\u0628\u0627\u0642\u064A \xF7\u0669</span><b>${p.mod9 ? num(p.mod9) : "\u2014"}</b></div><div class="metric"><span>\u0627\u0644\u0637\u0628\u0639</span><b>${p.leaders.length ? p.leaders.join(" / ") : "\u2014"}</b></div><div class="metric"><span>\u0627\u0644\u0643\u0648\u0643\u0628</span><b>${p.planetLeaders.length ? p.planetLeaders.join(" / ") : "\u2014"}</b></div><div class="metric"><span>\u0627\u0644\u0628\u0631\u062C</span><b>${p.zodiac ? `${p.zodiac[0]} \xB7 ${p.zodiac[1]}` : "\u2014"}</b></div><div class="element-bars">${Object.entries(p.elements).map(([name, count]) => `<div class="element-row"><span>${name}</span><div class="bar"><i style="width:${count / total * 100}%"></i></div><span>${num(count)}</span></div>`).join("")}</div>`;
  }
  function calculator() {
    const result = analyze(state.text);
    const target = parseArabicNumber(state.target);
    const percent = target > 0 ? Math.min(100, result.total / target * 100) : 0;
    return `<div class="grid"><main><section class="card"><h2>\u0627\u0644\u062D\u0627\u0633\u0628\u0629</h2><p class="muted">\u0627\u0643\u062A\u0628 \u0623\u064A \u0646\u0635 \u0639\u0631\u0628\u064A\u060C \u0648\u0633\u062A\u0638\u0647\u0631 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0641\u0648\u0631\u064B\u0627 \u0648\u0641\u0642 \u062D\u0633\u0627\u0628 \u0627\u0644\u062C\u0645\u0644 \u0627\u0644\u0645\u0634\u0631\u0642\u064A.</p><textarea id="text" rows="4" placeholder="\u0627\u0643\u062A\u0628 \u0627\u0644\u0639\u0628\u0627\u0631\u0629 \u0647\u0646\u0627\u2026">${esc(state.text)}</textarea><div class="chips">${["\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062D\u0645\u0646 \u0627\u0644\u0631\u062D\u064A\u0645", "\u0645\u062D\u0645\u062F", "\u062F\u0627\u0648\u062F", "\u062C\u0627\u0644\u0648\u062A", "\u0644\u0627 \u062D\u0648\u0644 \u0648\u0644\u0627 \u0642\u0648\u0629 \u0625\u0644\u0627 \u0628\u0627\u0644\u0644\u0647"].map((x) => `<button class="chip" data-example="${x}">${x}</button>`).join("")}</div><div class="split" style="margin-top:16px"><div><label class="muted">\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)</label><input id="target" inputmode="numeric" value="${esc(state.target)}" placeholder="\u0645\u062B\u0627\u0644: \u0667\u0668\u0666"></div><div class="actions" style="align-items:end"><button class="btn" data-send="names">\u0625\u0631\u0633\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u0623\u0633\u0645\u0627\u0621</button><button class="btn" data-send="awfaq">\u0625\u0631\u0633\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u0623\u0648\u0641\u0627\u0642</button></div></div>${target > 0 ? `<div class="result"><div class="metric"><span>\u0627\u0644\u062A\u0642\u062F\u0645 \u0646\u062D\u0648 \u0627\u0644\u0647\u062F\u0641</span><b>${num(Math.round(percent))}%</b></div><div class="bar"><i style="width:${percent}%"></i></div>${result.total === target ? "<b>\u062A\u0637\u0627\u0628\u0642 \u062A\u0627\u0645 \u0645\u0639 \u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641</b>" : ""}</div>` : ""}<div class="actions"><button class="btn primary" data-copy-result>\u0646\u0633\u062E \u0627\u0644\u0646\u062A\u064A\u062C\u0629</button><button class="btn" data-export-calculator>\u062A\u0635\u062F\u064A\u0631 \u0628\u0637\u0627\u0642\u0629</button><button class="btn" data-copy-link>\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637</button><button class="btn" data-clear="calculator">\u0645\u0633\u062D</button></div></section><section class="card"><h3>\u062A\u0641\u0635\u064A\u0644 \u0627\u0644\u0643\u0644\u0645\u0627\u062A</h3>${result.words.length ? result.words.map((w) => `<details class="word"><summary><b>${esc(w.word)}</b><span>${num(w.total)}</span></summary><div class="letters">${w.letters.map((l) => `<span class="letter">${l.raw}${l.raw !== l.normalized ? ` \u2190 ${l.normalized}` : ""} = ${num(l.value)}</span>`).join("")}</div></details>`).join("") : '<p class="muted">\u0633\u062A\u0638\u0647\u0631 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0648\u0627\u0644\u062D\u0631\u0648\u0641 \u0627\u0644\u0645\u062D\u062A\u0633\u0628\u0629 \u0647\u0646\u0627.</p>'}</section></main><aside><section class="card"><span class="muted">\u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u062D\u0627\u0644\u064A</span><div class="hero-number">${num(result.total)}</div><span class="muted">${num(result.count)} \u062D\u0631\u0641\u064B\u0627 \u0645\u062D\u062A\u0633\u0628\u064B\u0627</span><span class="tag">\u062D\u0633\u0627\u0628 \u0627\u0644\u062C\u0645\u0644 \u0627\u0644\u0645\u0634\u0631\u0642\u064A</span></section><section class="card"><h3>\u0627\u0644\u0633\u062C\u0644</h3>${state.history.length ? state.history.map((item, i) => `<div class="metric"><button class="btn history" data-history="${i}">${esc(item.text)}</button><b>${num(item.total)}</b></div>`).join("") : '<p class="muted">\u0622\u062E\u0631 \u062E\u0645\u0633\u0629 \u0625\u062F\u062E\u0627\u0644\u0627\u062A \u062A\u0638\u0647\u0631 \u0647\u0646\u0627.</p>'}</section></aside></div>`;
  }
  function comparePersonCard(label, role, name, motherName, p, isWinner) {
    return `<article class="compare-person ${p.count ? "" : "is-empty"} ${isWinner ? "is-winner" : ""}"><div class="compare-person-top"><span>${label} \xB7 ${role}</span>${isWinner ? '<b class="winner-chip">\u0627\u0644\u063A\u0627\u0644\u0628</b>' : ""}</div><h3>${esc(name.trim() || "\u0627\u0644\u0627\u0633\u0645 \u063A\u064A\u0631 \u0645\u064F\u062F\u062E\u0644")}</h3>${motherName ? `<small>\u0645\u0639 \u0627\u0633\u0645 \u0627\u0644\u0623\u0645: ${esc(motherName)}</small>` : ""}${p.count ? `<div class="compare-total"><strong>${num(p.total)}</strong><span>\u0627\u0644\u0645\u062C\u0645\u0648\u0639</span></div><div class="person-stats"><span>\u0627\u0644\u0628\u0627\u0642\u064A \xF7\u0669 <b>${num(p.mod9)}</b></span><span>\u0627\u0644\u0637\u0628\u0639 <b>${p.leaders.join(" / ") || "\u2014"}</b></span><span>\u0627\u0644\u0628\u0631\u062C <b>${p.zodiac ? p.zodiac[0] : "\u2014"}</b></span></div>` : "<p>\u0623\u062F\u062E\u0644 \u0627\u0644\u0627\u0633\u0645 \u0644\u0639\u0631\u0636 \u0628\u064A\u0627\u0646\u0627\u062A\u0647.</p>"}</article>`;
  }
  function nameComparison(a, b) {
    const firstRole = state.role;
    const secondRole = firstRole === "\u0637\u0627\u0644\u0628" ? "\u0645\u0637\u0644\u0648\u0628" : "\u0637\u0627\u0644\u0628";
    const ready = Boolean(state.nameA.trim() && state.nameB.trim() && a.mod9 && b.mod9);
    const comparison = ready ? compareProfiles(a, b, firstRole) : null;
    const elements = ready ? compareElements(a, b) : null;
    const celestial = ready ? compareCelestial(a, b) : null;
    const firstWins = Boolean(comparison && comparison.winner === firstRole);
    const winnerName = firstWins ? state.nameA : state.nameB;
    const loserName = firstWins ? state.nameB : state.nameA;
    const result = ready ? `<div class="dominance-verdict" id="comparison-result"><span class="verdict-label">\u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u063A\u0627\u0644\u0628 \u0648\u0627\u0644\u0645\u063A\u0644\u0648\u0628</span><div class="verdict-line"><strong>${esc(winnerName)}</strong><b>\u063A\u0627\u0644\u0628</b><i></i><span>${esc(loserName)}</span><small>\u0645\u063A\u0644\u0648\u0628</small></div><p>${comparison.reason}</p></div><div class="comparison-insights"><article><span class="insight-number">\u0661</span><div><small>\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u062D\u0643\u0645</small><h3>\u0627\u0644\u0628\u0627\u0642\u064A \u0645\u0646 \u0627\u0644\u0642\u0633\u0645\u0629 \u0639\u0644\u0649 \u0669</h3><p>${comparison.reason}</p></div></article><article><span class="insight-number">\u0662</span><div><small>\u0639\u0644\u0627\u0642\u0629 \u0627\u0644\u0637\u0628\u0627\u0626\u0639</small><h3>${elements.kind}</h3><p>${elements.text}</p></div></article><article><span class="insight-number">\u0663</span><div><small>\u0627\u0644\u0645\u0631\u0627\u0633\u0644\u0627\u062A \u0627\u0644\u062D\u0631\u0641\u064A\u0629</small><h3>${celestial.planet}</h3><p>${celestial.zodiac}</p></div></article></div><details class="comparison-details"><summary>\u0639\u0631\u0636 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628\u064A\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0644\u0644\u0634\u062E\u0635\u064A\u0646</summary><div class="split"><div class="profile-detail"><h3>${esc(state.nameA)}</h3>${profileCard(a)}</div><div class="profile-detail"><h3>${esc(state.nameB)}</h3>${profileCard(b)}</div></div></details><div class="method-tags"><span class="tag">GHALIB-SIRR-1.0</span><span class="tag">COMPAT-ELEMENTS-1.0</span><span class="tag">FALAK-STATIC-1.0</span></div>` : '<div class="comparison-placeholder"><b>\u0623\u062F\u062E\u0644 \u0627\u0644\u0627\u0633\u0645\u064A\u0646 \u0644\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0645\u0648\u062D\u0651\u062F\u0629</b><span>\u0633\u062A\u0638\u0647\u0631 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0648\u0627\u0644\u0637\u0628\u0627\u0626\u0639 \u0648\u0627\u0644\u0645\u0631\u0627\u0633\u0644\u0627\u062A \u0641\u064A \u0644\u0648\u062D\u0629 \u0648\u0627\u062D\u062F\u0629.</span></div>';
    return `<section class="card comparison-workspace" id="name-comparison"><div class="section-heading"><div><h2>\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0623\u0633\u0645\u0627\u0621</h2><p class="muted">\u0644\u0648\u062D\u0629 \u0648\u0627\u062D\u062F\u0629 \u062A\u062C\u0645\u0639 \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u0627\u0644\u063A\u0627\u0644\u0628 \u0648\u0627\u0644\u0645\u063A\u0644\u0648\u0628 \u0648\u0627\u0644\u062A\u0648\u0627\u0641\u0642.</p></div><span class="tag">NAME-COMPARE-2.0</span></div><div class="comparison-inputs"><label><span>\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u0623\u0648\u0644</span><input data-field="nameA" value="${esc(state.nameA)}" placeholder="\u0627\u0644\u0627\u0633\u0645"><input data-field="motherA" value="${esc(state.motherA)}" placeholder="\u0627\u0633\u0645 \u0627\u0644\u0623\u0645 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)"></label><label><span>\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062B\u0627\u0646\u064A</span><input data-field="nameB" value="${esc(state.nameB)}" placeholder="\u0627\u0644\u0627\u0633\u0645"><input data-field="motherB" value="${esc(state.motherB)}" placeholder="\u0627\u0633\u0645 \u0627\u0644\u0623\u0645 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)"></label></div><div class="actions comparison-actions"><label class="chip">\u062F\u0648\u0631 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u0623\u0648\u0644 <select data-field="role" style="width:auto;padding:0;border:0;background:transparent"><option ${firstRole === "\u0637\u0627\u0644\u0628" ? "selected" : ""}>\u0637\u0627\u0644\u0628</option><option ${firstRole === "\u0645\u0637\u0644\u0648\u0628" ? "selected" : ""}>\u0645\u0637\u0644\u0648\u0628</option></select></label><button class="btn" data-name-example>\u062A\u062C\u0631\u0628\u0629 \u062F\u0627\u0648\u062F \xD7 \u062C\u0627\u0644\u0648\u062A</button><button class="btn primary" data-copy-comparison>\u0646\u0633\u062E \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629</button><button class="btn" data-export-names>\u062A\u0635\u062F\u064A\u0631 \u0628\u0637\u0627\u0642\u0629</button><button class="btn" data-copy-link>\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637</button><button class="btn" data-clear="names">\u0645\u0633\u062D</button></div><div class="duel-grid">${comparePersonCard("\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u0623\u0648\u0644", firstRole, state.nameA, state.motherA, a, ready && firstWins)}<div class="versus-mark"><b>\u2194</b><span>\u0645\u0642\u0627\u0631\u0646\u0629</span></div>${comparePersonCard("\u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u062B\u0627\u0646\u064A", secondRole, state.nameB, state.motherB, b, ready && !firstWins)}</div>${result}</section>`;
  }
  function names() {
    const a = profile(`${state.nameA} ${state.motherA}`), b = profile(`${state.nameB} ${state.motherB}`);
    return `${suggestions()}${nameComparison(a, b)}`;
  }
  function assessBabyName(candidate, parentEntries) {
    const p = profile(candidate);
    const opposing = /* @__PURE__ */ new Set(["\u0646\u0627\u0631/\u0645\u0627\u0621", "\u0645\u0627\u0621/\u0646\u0627\u0631", "\u0647\u0648\u0627\u0621/\u062A\u0631\u0627\u0628", "\u062A\u0631\u0627\u0628/\u0647\u0648\u0627\u0621"]);
    const friends = /* @__PURE__ */ new Set(["\u0646\u0627\u0631/\u0647\u0648\u0627\u0621", "\u0647\u0648\u0627\u0621/\u0646\u0627\u0631", "\u0645\u0627\u0621/\u062A\u0631\u0627\u0628", "\u062A\u0631\u0627\u0628/\u0645\u0627\u0621"]);
    if (!p.leaders.length) return { compatible: false, score: 0, p, relations: [], reason: "\u0627\u0644\u0627\u0633\u0645 \u0644\u0627 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u062D\u0631\u0648\u0641 \u0639\u0631\u0628\u064A\u0629 \u0645\u062D\u0633\u0648\u0628\u0629." };
    if (p.leaders.some((x) => p.leaders.some((y) => x !== y && opposing.has(`${x}/${y}`)))) return { compatible: false, score: 0, p, relations: [], reason: "\u0637\u0628\u0627\u0626\u0639 \u0627\u0644\u0627\u0633\u0645 \u0646\u0641\u0633\u0647 \u0645\u062A\u0636\u0627\u062F\u0629 \u062D\u0633\u0627\u0628\u064A\u064B\u0627." };
    let score = 0;
    const relations = [];
    for (const entry of parentEntries) {
      const parent = entry.profile;
      if (p.leaders.some((x) => parent.leaders.some((y) => opposing.has(`${x}/${y}`)))) return { compatible: false, score: 0, p, relations, reason: `\u064A\u0648\u062C\u062F \u062A\u0636\u0627\u062F \u062D\u0633\u0627\u0628\u064A \u0645\u0639 ${entry.label}.` };
      const relation = p.leaders.some((x) => parent.leaders.includes(x)) ? "\u0627\u0646\u0633\u062C\u0627\u0645" : p.leaders.some((x) => parent.leaders.some((y) => friends.has(`${x}/${y}`))) ? "\u0635\u062F\u0627\u0642\u0629" : "\u0627\u0645\u062A\u0632\u0627\u062C";
      score += relation === "\u0627\u0646\u0633\u062C\u0627\u0645" ? 3 : relation === "\u0635\u062F\u0627\u0642\u0629" ? 2 : 1;
      relations.push({ label: entry.label, relation });
    }
    return { compatible: true, score, p, relations, reason: "\u0644\u0627 \u064A\u0648\u062C\u062F \u062A\u0636\u0627\u062F \u062D\u0633\u0627\u0628\u064A \u0645\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646 \u0627\u0644\u0645\u062F\u062E\u0644\u0629." };
  }
  function babyVerdict(match, parentCount) {
    if (!match?.compatible) return "\u063A\u064A\u0631 \u0645\u062A\u0648\u0627\u0641\u0642 \u062D\u0633\u0627\u0628\u064A\u064B\u0627";
    const ratio = match.score / Math.max(1, parentCount * 3);
    return ratio >= 1 ? "\u0645\u062A\u0648\u0627\u0641\u0642 \u062C\u062F\u064B\u0627" : ratio >= 0.67 ? "\u0645\u062A\u0648\u0627\u0641\u0642" : "\u0645\u062A\u0648\u0627\u0641\u0642 \u0628\u062F\u0631\u062C\u0629 \u0645\u0642\u0628\u0648\u0644\u0629";
  }
  function suggestedNameList(items, emptyText) {
    if (!items.length) return `<p class="muted empty-state">${emptyText}</p>`;
    return `<div class="name-options">${items.slice(0, state.suggestionLimit).map((x) => `<button class="name-option" data-select-name="${esc(x.name)}"><span><strong>${esc(x.name)}</strong><small>${x.p.leaders.join(" / ")} \xB7 ${x.relations.map((r) => r.relation).join(" + ")}</small></span><em>${babyVerdict(x, x.relations.length)}</em></button>`).join("")}</div>`;
  }
  function suggestions() {
    const father = profile(state.father), mother = profile(state.mother);
    const parentEntries = [{ label: "\u0627\u0644\u0623\u0628", name: state.father, profile: father }, { label: "\u0627\u0644\u0623\u0645", name: state.mother, profile: mother }].filter((entry) => entry.profile.count);
    const desired = profile(state.desiredBabyName);
    const desiredMatch = desired.count && parentEntries.length ? assessBabyName(state.desiredBabyName, parentEntries) : null;
    const list = (names2, query) => names2.filter((name) => name !== state.father && name !== state.mother).filter((name) => !query.trim() || name.includes(query.trim())).map((name) => ({ name, ...assessBabyName(name, parentEntries) })).filter((item) => item.compatible).sort((a, b) => b.score - a.score || a.p.count - b.p.count || a.name.localeCompare(b.name, "ar"));
    const males2 = parentEntries.length ? list(maleNames, state.maleSearch) : [];
    const females2 = parentEntries.length ? list(femaleNames, state.femaleSearch) : [];
    const desiredResult = !desired.count ? '<div class="baby-empty"><b>\u0627\u0643\u062A\u0628 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u063A\u0648\u0628</b><span>\u0633\u0646\u062D\u0633\u0628 \u0642\u064A\u0645\u062A\u0647 \u0648\u0646\u0642\u0627\u0631\u0646\u0647 \u0628\u0627\u0644\u0623\u0628 \u0648\u0627\u0644\u0623\u0645 \u0641\u0648\u0631\u064B\u0627.</span></div>' : !parentEntries.length ? `<div class="baby-result neutral"><div><span class="muted">\u062D\u0633\u0627\u0628 \u0627\u0644\u0627\u0633\u0645</span><strong>${num(desired.total)}</strong></div><p>\u0623\u062F\u062E\u0644 \u0627\u0633\u0645 \u0627\u0644\u0623\u0628 \u0623\u0648 \u0627\u0644\u0623\u0645 \u0644\u0625\u0638\u0647\u0627\u0631 \u062F\u0631\u062C\u0629 \u0627\u0644\u062A\u0648\u0627\u0641\u0642.</p></div>` : `<div class="baby-result ${desiredMatch.compatible ? "compatible" : "incompatible"}"><div class="baby-result-head"><div><span class="muted">\u0646\u062A\u064A\u062C\u0629 ${esc(state.desiredBabyName)}</span><strong>${num(desired.total)}</strong></div><span class="status-badge">${babyVerdict(desiredMatch, parentEntries.length)}</span></div><div class="baby-facts"><span>\u0627\u0644\u0637\u0628\u0639 <b>${desired.leaders.join(" / ") || "\u2014"}</b></span><span>\u0627\u0644\u0643\u0648\u0643\u0628 <b>${desired.planetLeaders.join(" / ") || "\u2014"}</b></span><span>\u0627\u0644\u0628\u0631\u062C <b>${desired.zodiac ? desired.zodiac[0] : "\u2014"}</b></span></div>${desiredMatch.relations.length ? `<div class="relation-chips">${desiredMatch.relations.map((item) => `<span>${item.label}: <b>${item.relation}</b></span>`).join("")}</div>` : ""}<p>${desiredMatch.reason}</p></div>`;
    return `<section class="card baby-planner"><div class="section-heading"><div><h2>\u0627\u0642\u062A\u0631\u0627\u062D \u0627\u0633\u0645 \u0645\u0648\u0644\u0648\u062F</h2><p class="muted">\u0623\u062F\u062E\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0648\u0627\u0644\u062F\u064A\u0646 \u062B\u0645 \u062C\u0631\u0651\u0628 \u0627\u0633\u0645\u064B\u0627 \u0645\u0631\u063A\u0648\u0628\u064B\u0627 \u0623\u0648 \u0627\u062E\u062A\u0631 \u0645\u0646 \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0627\u062A.</p></div><span class="tag">NAME-SUGGEST-2.0</span></div><p class="notice">\u0627\u0642\u062A\u0631\u0627\u062D \u062D\u0633\u0627\u0628\u064A \u062A\u0631\u0627\u062B\u064A \u0627\u062E\u062A\u064A\u0627\u0631\u064A\u061B \u0627\u0644\u0645\u0639\u0646\u0649 \u0627\u0644\u062D\u0633\u0646 \u0648\u0633\u0646\u0651\u0629 \u0627\u0644\u062A\u0633\u0645\u064A\u0629 \u0645\u0642\u062F\u0645\u0627\u0646\u060C \u0648\u0644\u064A\u0633 \u062D\u0643\u0645\u064B\u0627 \u0634\u0631\u0639\u064A\u064B\u0627.</p><div class="baby-inputs"><label><span>\u0627\u0633\u0645 \u0627\u0644\u0623\u0628</span><input data-field="father" value="${esc(state.father)}" placeholder="\u0645\u062B\u0627\u0644: \u0645\u062D\u0645\u062F"></label><label><span>\u0627\u0633\u0645 \u0627\u0644\u0623\u0645</span><input data-field="mother" value="${esc(state.mother)}" placeholder="\u0645\u062B\u0627\u0644: \u0641\u0627\u0637\u0645\u0629"></label><label class="desired-name"><span>\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u063A\u0648\u0628 \u0644\u0644\u0645\u0648\u0644\u0648\u062F</span><input data-field="desiredBabyName" value="${esc(state.desiredBabyName)}" placeholder="\u0627\u0643\u062A\u0628 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0630\u064A \u062A\u0641\u0643\u0631\u0627\u0646 \u0641\u064A\u0647"></label></div>${desiredResult}<div class="actions"><button class="btn" data-parent-example>\u062A\u062C\u0631\u0628\u0629 \u0645\u062D\u0645\u062F \xD7 \u0641\u0627\u0637\u0645\u0629</button><button class="btn" data-clear="parents">\u0645\u0633\u062D \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0648\u0644\u0648\u062F</button></div></section>${parentEntries.length ? `<div class="suggestion-columns"><section class="card suggestion-panel"><div class="suggestion-title"><div><span class="gender-mark male">\u0630</span><div><h3>\u0623\u0633\u0645\u0627\u0621 \u0630\u0643\u0648\u0631 \u0645\u0642\u062A\u0631\u062D\u0629</h3><span class="muted">${num(males2.length)} \u0627\u0633\u0645\u064B\u0627 \u0645\u062A\u0648\u0627\u0641\u0642\u064B\u0627</span></div></div></div><input data-field="maleSearch" value="${esc(state.maleSearch)}" placeholder="\u0627\u0628\u062D\u062B \u0641\u064A \u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0630\u0643\u0648\u0631\u2026">${suggestedNameList(males2, "\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0633\u0645\u0627\u0621 \u0630\u0643\u0648\u0631 \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0628\u062D\u062B.")}</section><section class="card suggestion-panel"><div class="suggestion-title"><div><span class="gender-mark female">\u0623</span><div><h3>\u0623\u0633\u0645\u0627\u0621 \u0625\u0646\u0627\u062B \u0645\u0642\u062A\u0631\u062D\u0629</h3><span class="muted">${num(females2.length)} \u0627\u0633\u0645\u064B\u0627 \u0645\u062A\u0648\u0627\u0641\u0642\u064B\u0627</span></div></div></div><input data-field="femaleSearch" value="${esc(state.femaleSearch)}" placeholder="\u0627\u0628\u062D\u062B \u0641\u064A \u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0625\u0646\u0627\u062B\u2026">${suggestedNameList(females2, "\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0633\u0645\u0627\u0621 \u0625\u0646\u0627\u062B \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0628\u062D\u062B.")}</section></div>${males2.length > state.suggestionLimit || females2.length > state.suggestionLimit ? '<div class="actions centered"><button class="btn" data-more-names>\u0639\u0631\u0636 \u0623\u0633\u0645\u0627\u0621 \u0623\u0643\u062B\u0631</button></div>' : ""}` : '<section class="card baby-prompt"><b>\u0627\u0628\u062F\u0623 \u0628\u0627\u0633\u0645 \u0627\u0644\u0623\u0628 \u0623\u0648 \u0627\u0644\u0623\u0645</b><span>\u0628\u0639\u062F\u0647\u0627 \u0633\u062A\u0638\u0647\u0631 \u0647\u0646\u0627 \u0642\u0648\u0627\u0626\u0645 \u0645\u0646\u0641\u0635\u0644\u0629 \u0644\u0644\u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0630\u0643\u0648\u0631 \u0648\u0627\u0644\u0625\u0646\u0627\u062B.</span></section>'}`;
  }
  var PLANETARY_WEEK = [
    ["\u0627\u0644\u0623\u062D\u062F", "\u0627\u0644\u0634\u0645\u0633", "\u2609", "sun"],
    ["\u0627\u0644\u0627\u062B\u0646\u064A\u0646", "\u0627\u0644\u0642\u0645\u0631", "\u263E", "moon"],
    ["\u0627\u0644\u062B\u0644\u0627\u062B\u0627\u0621", "\u0627\u0644\u0645\u0631\u064A\u062E", "\u2642", "mars"],
    ["\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621", "\u0639\u0637\u0627\u0631\u062F", "\u263F", "mercury"],
    ["\u0627\u0644\u062E\u0645\u064A\u0633", "\u0627\u0644\u0645\u0634\u062A\u0631\u064A", "\u2643", "jupiter"],
    ["\u0627\u0644\u062C\u0645\u0639\u0629", "\u0627\u0644\u0632\u0647\u0631\u0629", "\u2640", "venus"],
    ["\u0627\u0644\u0633\u0628\u062A", "\u0632\u062D\u0644", "\u2644", "saturn"]
  ];
  var AWFAQ_SOURCES = [
    ["\u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0627\u0644\u0623\u0645\u0631\u064A\u0643\u064A\u0629 \u0644\u0644\u0637\u0628", "\u0627\u0644\u0623\u0648\u0641\u0627\u0642 \u0641\u064A \u0627\u0644\u0645\u062E\u0637\u0648\u0637\u0627\u062A \u0627\u0644\u0637\u0628\u064A\u0629 \u0648\u0627\u0644\u062A\u0639\u0648\u064A\u0630\u064A\u0629", "https://www.nlm.nih.gov/hmd/arabic/astrology1.html"],
    ["\u062C\u0627\u0645\u0639\u0629 Warwick", "\u062F\u0631\u0627\u0633\u0629 \u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0639\u0646 \u0628\u062F\u0627\u064A\u0627\u062A \u0623\u062F\u0628\u064A\u0627\u062A \u0627\u0644\u0623\u0648\u0641\u0627\u0642 \u0627\u0644\u0639\u0631\u0628\u064A\u0629", "https://wrap.warwick.ac.uk/id/eprint/117867/1/WRAP-new-light-early-arabic-literature-Hallum-2020.pdf"],
    ["Oxford Academic", "\u0627\u0644\u0633\u064A\u0627\u0642 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A \u0644\u0644\u0623\u0648\u0641\u0627\u0642 \u0648\u0627\u0644\u062D\u0631\u0648\u0641 \u0648\u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0645\u0646\u0633\u0648\u0628\u0629 \u0625\u0644\u064A\u0647\u0627", "https://academic.oup.com/book/61617/chapter/539191501"],
    ["University College London", "\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0643\u0648\u0643\u0628\u064A \u0648\u062A\u0631\u062A\u064A\u0628 \u0623\u064A\u0627\u0645\u0647 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A", "https://discovery.ucl.ac.uk/10115451/1/Bultrighini_Chapter%2010_LATEST%20copy%202.pdf"],
    ["\u0645\u0643\u062A\u0628\u0629 Bodleian \u2013 Oxford", "\u0648\u0635\u0641 \u0645\u062E\u0637\u0648\u0637 \u0643\u062A\u0627\u0628 \u0627\u0644\u0628\u0644\u0647\u0627\u0646", "https://digital.bodleian.ox.ac.uk/objects/5c9da286-6a02-406c-b990-0896b8ddbbb0/"],
    ["\u0627\u0644\u0645\u0631\u0643\u0632 \u0627\u0644\u0648\u0637\u0646\u064A \u0644\u0644\u0641\u0646\u0648\u0646 \u2013 IGNCA", "\u0643\u062A\u0627\u0644\u0648\u062C \u0623\u0643\u0627\u062F\u064A\u0645\u064A \u0644\u0644\u0623\u062D\u062C\u0628\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u0641\u0627\u0631\u0633\u064A\u0629", "https://ignca.gov.in/Asi_data/43060.pdf"],
    ["\u062F\u0627\u0631 \u0627\u0644\u0625\u0641\u062A\u0627\u0621 \u0627\u0644\u0645\u0635\u0631\u064A\u0629", "\u0641\u062A\u0648\u0649 \u0631\u0633\u0645\u064A\u0629 \u0628\u0634\u0623\u0646 \u0627\u0644\u0633\u062D\u0631 \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u0627\u0646\u0629 \u0628\u0627\u0644\u062C\u0646 \u0648\u0627\u0644\u0623\u062D\u062C\u0628\u0629 \u0627\u0644\u0628\u0627\u0637\u0644\u0629", "https://www.dar-alifta.org/en/fatwa/details/7811/do-the-ruqyah-verses-of-the-quran-drive-away-magic-and-sorcery"]
  ];
  function awfaqSquare() {
    const source = state.awfaqText || state.text;
    const result = analyze(source);
    const magic = makeMagicSquare(state.rank, result.total);
    const sums = magic.grid.map((row) => row.reduce((s, x) => s + x, 0));
    return `<div class="grid"><main><section class="card"><div class="section-heading"><div><h2>\u0627\u0644\u0648\u0641\u0642 \u0627\u0644\u0639\u062F\u062F\u064A</h2><p class="muted">\u0645\u0631\u0628\u0639 \u0631\u064A\u0627\u0636\u064A \u0645\u0646\u062A\u0638\u0645\u061B \u062A\u0628\u0642\u0649 \u0627\u0644\u0635\u0641\u0648\u0641 \u0648\u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0648\u0627\u0644\u0642\u0637\u0631\u0627\u0646 \u0645\u062A\u0633\u0627\u0648\u064A\u0629.</p></div><span class="tag">MATHEMATICAL</span></div><textarea id="awfaqText" rows="3" placeholder="\u0627\u0643\u062A\u0628 \u0627\u0644\u0646\u0635 \u0627\u0644\u0630\u064A \u062A\u0631\u064A\u062F \u062A\u0639\u0645\u064A\u0631\u0647 \u0628\u0647\u2026">${esc(state.awfaqText)}</textarea><div class="actions"><label class="chip">\u0627\u0644\u0631\u062A\u0628\u0629 <select id="rank" style="width:auto;padding:0;border:0;background:transparent">${[3, 4, 5, 7, 8].map((n) => `<option value="${n}" ${state.rank === n ? "selected" : ""}>${n}\xD7${n}</option>`).join("")}</select></label><button class="btn" data-use-calculator>\u0627\u0633\u062A\u062E\u062F\u0645 \u0646\u0635 \u0627\u0644\u062D\u0627\u0633\u0628\u0629</button></div><div class="result"><div class="reference"><div>\u0627\u0644\u0645\u062C\u0645\u0648\u0639 S<br><b>${num(result.total)}</b></div><div>\u062B\u0627\u0628\u062A C<br><b>${num(magic.C)}</b></div><div>a / d<br><b>${num(magic.a)} / ${num(magic.d)}</b></div><div>\u062E\u0637 M<br><b>${num(magic.M)}</b></div><div>\u0627\u0644\u0641\u0631\u0642 \u03B4<br><b>${num(magic.delta)}</b></div></div></div><div class="magic" style="grid-template-columns:repeat(${magic.n},1fr)">${magic.grid.flatMap((row, r) => row.map((value, c) => `<span class="${r === c || r + c === magic.n - 1 ? "diag" : ""}">${num(value)}</span>`)).join("")}</div><div class="notice">\u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0631\u064A\u0627\u0636\u064A: \u0645\u062C\u0645\u0648\u0639 \u0643\u0644 \u0635\u0641 ${num(sums[0] || 0)} \u2014 \u0648\u0641\u0642 \u062A\u0627\u0645 \u062F\u0627\u0626\u0645\u064B\u0627. \u0644\u0627 \u064A\u062B\u0628\u062A \u0647\u0630\u0627 \u0623\u064A \u0623\u062B\u0631 \u063A\u064A\u0628\u064A. <span class="tag">AWFAQ-SESIANO-2.1</span></div></section></main><aside><section class="card awfaq-summary"><span class="summary-icon">\u25A6</span><h3>\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0648\u0641\u0642</h3><p>\u0648\u0641\u0642 ${magic.n}\xD7${magic.n} \xB7 \u062B\u0627\u0628\u062A \u0627\u0644\u062E\u0637 M = <b>${num(magic.M)}</b></p><div class="actions"><button class="btn primary" data-copy-magic>\u0646\u0633\u062E \u0627\u0644\u0634\u0628\u0643\u0629</button><button class="btn" data-export-awfaq>\u062A\u0635\u062F\u064A\u0631 \u0635\u0648\u0631\u0629</button><button class="btn" data-copy-link>\u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637</button></div></section><section class="card boundary-mini"><b>\u062D\u062F\u0648\u062F \u0627\u0644\u0646\u062A\u064A\u062C\u0629</b><p>\u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0647\u0646\u0627 \u0646\u0627\u062A\u062C\u0629 \u0639\u0646 \u062E\u0648\u0627\u0631\u0632\u0645\u064A\u0629 \u0631\u064A\u0627\u0636\u064A\u0629 \u0641\u0642\u0637\u060C \u0648\u0644\u064A\u0633\u062A \u0637\u0644\u0633\u0645\u0627\u064B \u0623\u0648 \u062A\u0646\u0628\u0624\u064B\u0627.</p><button class="text-button" data-awfaq-mode="history">\u0627\u0642\u0631\u0623 \u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u2190</button></section></aside></div>`;
  }
  function awfaqHistory() {
    const today = (/* @__PURE__ */ new Date()).getDay();
    const days = PLANETARY_WEEK.map(([day, planet, symbol, tone], index) => `<article class="planet-day ${tone} ${today === index ? "is-today" : ""}"><div class="planet-symbol">${symbol}</div><div><small>${day}${today === index ? " \xB7 \u0627\u0644\u064A\u0648\u0645" : ""}</small><strong>${planet}</strong></div></article>`).join("");
    const sources = AWFAQ_SOURCES.map(([institution, title, url], index) => `<a class="source-link" href="${url}" target="_blank" rel="noreferrer"><span>${num(index + 1)}</span><div><strong>${institution}</strong><small>${title}</small></div><b aria-hidden="true">\u2197</b></a>`).join("");
    return `<section class="heritage-hero"><div><span class="eyebrow">\u0642\u0631\u0627\u0621\u0629 \u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0645\u0648\u062B\u0642\u0629</span><h2>\u0627\u0644\u0623\u0648\u0641\u0627\u0642 \u0628\u064A\u0646 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u062E\u0637\u0648\u0637\u0627\u062A</h2><p>\u062A\u0641\u0635\u0644 \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 \u0628\u064A\u0646 \u0645\u0627 \u0648\u062B\u0642\u062A\u0647 \u0627\u0644\u0645\u0635\u0627\u062F\u0631 \u062A\u0627\u0631\u064A\u062E\u064A\u064B\u0627\u060C \u0648\u0645\u0627 \u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0642\u062F\u064A\u0645\u0647 \u0643\u062D\u0642\u064A\u0642\u0629 \u0639\u0644\u0645\u064A\u0629 \u0623\u0648 \u062F\u064A\u0646\u064A\u0629.</p></div><div class="heritage-seal"><span>\u0667</span><small>\u0645\u0631\u0627\u0633\u0644\u0627\u062A<br>\u062A\u0627\u0631\u064A\u062E\u064A\u0629</small></div></section>
  <section class="boundary-grid"><article class="boundary-card confirmed"><span>\u2713</span><div><small>\u0645\u0648\u062B\u0651\u0642 \u062A\u0627\u0631\u064A\u062E\u064A\u064B\u0627</small><h3>\u0645\u0631\u0628\u0639\u0627\u062A \u0639\u062F\u062F\u064A\u0629 \u0648\u0627\u0633\u062A\u0639\u0645\u0627\u0644\u0627\u062A \u062A\u0639\u0648\u064A\u0630\u064A\u0629</h3><p>\u0638\u0647\u0631\u062A \u0627\u0644\u0623\u0648\u0641\u0627\u0642 \u0643\u0645\u0631\u0628\u0639\u0627\u062A \u0631\u064A\u0627\u0636\u064A\u0629\u060C \u062B\u0645 \u062F\u062E\u0644\u062A \u0628\u0639\u0636 \u0627\u0644\u0645\u062E\u0637\u0648\u0637\u0627\u062A \u0641\u064A \u0633\u064A\u0627\u0642\u0627\u062A \u0644\u0644\u062D\u0645\u0627\u064A\u0629 \u0648\u0627\u0644\u062A\u062F\u0627\u0648\u064A \u0648\u0623\u063A\u0631\u0627\u0636 \u0623\u062E\u0631\u0649.</p></div></article><article class="boundary-card unproven"><span>\u2248</span><div><small>\u063A\u064A\u0631 \u0645\u062B\u0628\u062A \u0639\u0644\u0645\u064A\u064B\u0627</small><h3>\u0644\u0627 \u062F\u0644\u064A\u0644 \u0639\u0644\u0649 \u0627\u0644\u062A\u0623\u062B\u064A\u0631 \u0627\u0644\u063A\u064A\u0628\u064A</h3><p>\u0627\u0644\u0645\u0631\u0627\u0633\u0644\u0627\u062A \u0627\u0644\u0643\u0648\u0643\u0628\u064A\u0629 \u0648\u0627\u0644\u0631\u0648\u062D\u0627\u0646\u064A\u0629 \u0645\u0648\u0631\u0648\u062B\u0627\u062A \u062A\u0627\u0631\u064A\u062E\u064A\u0629\u061B \u0644\u0627 \u064A\u062B\u0628\u062A\u0647\u0627 \u0627\u0646\u062A\u0638\u0627\u0645 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0648\u0644\u0627 \u064A\u0642\u062F\u0645\u0647\u0627 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0643\u062A\u0646\u0628\u0624.</p></div></article><article class="boundary-card religious"><span>!</span><div><small>\u062A\u0646\u0628\u064A\u0647 \u062F\u064A\u0646\u064A</small><h3>\u0644\u0627 \u0627\u0633\u062A\u062D\u0636\u0627\u0631 \u0648\u0644\u0627 \u0627\u0633\u062A\u0639\u0627\u0646\u0629 \u0628\u0627\u0644\u062C\u0646</h3><p>\u064A\u0639\u0631\u0636 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0644\u0644\u062F\u0631\u0627\u0633\u0629 \u0641\u0642\u0637\u060C \u0648\u0644\u0627 \u064A\u0642\u062F\u0645 \u0623\u062D\u062C\u0628\u0629 \u0623\u0648 \u0637\u0642\u0648\u0633\u064B\u0627 \u0623\u0648 \u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0631\u0648\u062D\u0627\u0646\u064A\u0629.</p></div></article></section>
  <section class="card planetary-section"><div class="section-heading"><div><span class="eyebrow">\u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0643\u0648\u0643\u0628\u064A</span><h2>\u0645\u0631\u0627\u0633\u0644\u0627\u062A \u0623\u064A\u0627\u0645 \u0627\u0644\u0623\u0633\u0628\u0648\u0639</h2><p class="muted">\u062A\u0631\u062A\u064A\u0628 \u062A\u0627\u0631\u064A\u062E\u064A \u0645\u0648\u062B\u0642 \u0641\u064A \u062A\u0642\u0627\u0644\u064A\u062F \u0641\u0644\u0643\u064A\u0629 \u0648\u062A\u0646\u062C\u064A\u0645\u064A\u0629 \u0642\u062F\u064A\u0645\u0629\u060C \u0648\u0644\u064A\u0633 \u0648\u0635\u0641\u064B\u0627 \u0639\u0644\u0645\u064A\u064B\u0627 \u0644\u062A\u0623\u062B\u064A\u0631 \u0627\u0644\u0643\u0648\u0627\u0643\u0628.</p></div><span class="historical-badge">\u0644\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A \u0641\u0642\u0637</span></div><div class="planet-week">${days}</div></section>
  <div class="heritage-notes"><section class="card"><span class="note-number">\u0661</span><h3>\u0647\u0644 \u062A\u0648\u062C\u062F \u0623\u0648\u0641\u0627\u0642 \u0644\u0644\u062E\u064A\u0631 \u0648\u0627\u0644\u0634\u0631\u061F</h3><p>\u062A\u0630\u0643\u0631 \u0627\u0644\u0645\u0635\u0627\u062F\u0631 \u0623\u0639\u0645\u0627\u0644\u064B\u0627 \u0646\u064F\u0633\u0628\u062A \u0625\u0644\u0649 \xAB\u0627\u0644\u0646\u0648\u0631 \u0648\u0627\u0644\u0638\u0644\u0645\u0629\xBB \u0623\u0648 \u0625\u0644\u0649 \u0627\u0644\u0646\u0641\u0639 \u0648\u0627\u0644\u0636\u0631\u0631. \u0627\u0644\u0641\u0631\u0642 \u0643\u0627\u0646 \u0641\u064A <b>\u0627\u0644\u063A\u0627\u064A\u0629 \u0627\u0644\u0645\u0646\u0633\u0648\u0628\u0629 \u0644\u0644\u0639\u0645\u0644</b>\u060C \u0644\u0627 \u0641\u064A \u0627\u0644\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629 \u0644\u0644\u0645\u0631\u0628\u0639 \u0646\u0641\u0633\u0647.</p></section><section class="card"><span class="note-number">\u0662</span><h3>\u0645\u0627\u0630\u0627 \u0639\u0646 \u0627\u0644\u0645\u0644\u0627\u0626\u0643\u0629 \u0648\u0645\u0644\u0648\u0643 \u0627\u0644\u062C\u0646\u061F</h3><p>\u0631\u0628\u0637\u062A \u0628\u0639\u0636 \u0627\u0644\u0645\u062E\u0637\u0648\u0637\u0627\u062A \u0627\u0644\u0623\u064A\u0627\u0645 \u0648\u0627\u0644\u0643\u0648\u0627\u0643\u0628 \u0628\u0645\u0644\u0627\u0626\u0643\u0629 \u0623\u0648 \u0623\u0631\u0648\u0627\u062D \u0623\u0648 \u0645\u0644\u0648\u0643 \u0645\u0646 \u0627\u0644\u062C\u0646\u060C \u0644\u0643\u0646 \u0627\u0644\u0642\u0648\u0627\u0626\u0645 \u0648\u0627\u0644\u0623\u0633\u0645\u0627\u0621 \u062A\u062E\u062A\u0644\u0641 \u0648\u0644\u064A\u0633\u062A \u0639\u0642\u064A\u062F\u0629 \u062F\u064A\u0646\u064A\u0629 \u0645\u0648\u062D\u062F\u0629 \u0623\u0648 \u062D\u0642\u064A\u0642\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062A\u062D\u0642\u0642.</p></section><section class="card"><span class="note-number">\u0663</span><h3>\u0643\u064A\u0641 \u064A\u062A\u0639\u0627\u0645\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0645\u0639\u0647\u0627\u061F</h3><p>\u0644\u0627 \u064A\u062D\u0633\u0628 \xAB\u0645\u0644\u0643 \u0627\u0644\u064A\u0648\u0645\xBB\u060C \u0648\u0644\u0627 \u064A\u0646\u0634\u0626 \u0639\u0645\u0644\u064B\u0627 \u0644\u0644\u062E\u064A\u0631 \u0623\u0648 \u0627\u0644\u0636\u0631\u0631. \u0646\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0627\u0644\u0648\u0641\u0642 \u0627\u0644\u0639\u062F\u062F\u064A \u0643\u0623\u062F\u0627\u0629 \u0631\u064A\u0627\u0636\u064A\u0629 \u0648\u0646\u0636\u0639 \u0627\u0644\u062A\u0631\u0627\u062B \u0641\u064A \u0645\u062A\u062D\u0641 \u0645\u0639\u0631\u0641\u064A \u0645\u0646\u0641\u0635\u0644.</p></section></div>
  <section class="evidence-callout"><div class="evidence-icon">i</div><div><h3>\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0639\u0631\u0636 \u062F\u0627\u062E\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642</h3><p>\u0648\u0631\u0648\u062F \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0641\u064A \u0645\u062E\u0637\u0648\u0637 \u0642\u062F\u064A\u0645 \u064A\u062B\u0628\u062A \u0648\u062C\u0648\u062F \u0627\u0644\u0641\u0643\u0631\u0629 \u062A\u0627\u0631\u064A\u062E\u064A\u064B\u0627\u060C \u0644\u0643\u0646\u0647 \u0644\u0627 \u064A\u062B\u0628\u062A \u0635\u062D\u062A\u0647\u0627 \u0623\u0648 \u0641\u0627\u0639\u0644\u064A\u062A\u0647\u0627. \u0648\u0648\u0641\u0642 \u0641\u062A\u0648\u0649 \u062F\u0627\u0631 \u0627\u0644\u0625\u0641\u062A\u0627\u0621 \u0627\u0644\u0645\u0635\u0631\u064A\u0629\u060C \u064A\u062D\u0630\u0631 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0628\u0648\u0636\u0648\u062D \u0645\u0646 \u0627\u0644\u0633\u062D\u0631 \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u0627\u0646\u0629 \u0628\u0627\u0644\u062C\u0646 \u0648\u0627\u0644\u0623\u062D\u062C\u0628\u0629 \u0627\u0644\u0628\u0627\u0637\u0644\u0629.</p></div></section>
  <section class="card sources-section"><div class="section-heading"><div><span class="eyebrow">\u0627\u0644\u0645\u0631\u0627\u062C\u0639</span><h2>\u0645\u0635\u0627\u062F\u0631 \u0645\u0624\u0633\u0633\u064A\u0629 \u0648\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629</h2><p class="muted">\u062A\u0641\u062A\u062D \u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u0635\u062F\u0631 \u0627\u0644\u0623\u0635\u0644\u064A \u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0648\u0633\u064A\u0627\u0642\u0647\u0627.</p></div><span class="tag">SOURCES-1.0</span></div><div class="source-list">${sources}</div></section>`;
  }
  function awfaq() {
    return `<section class="awfaq-switcher" aria-label="\u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u0623\u0648\u0641\u0627\u0642"><button class="${state.awfaqMode === "square" ? "active" : ""}" data-awfaq-mode="square"><span>\u25A6</span><div><b>\u0627\u0644\u0648\u0641\u0642 \u0627\u0644\u0639\u062F\u062F\u064A</b><small>\u0627\u0644\u062D\u0627\u0633\u0628\u0629 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629</small></div></button><button class="${state.awfaqMode === "history" ? "active" : ""}" data-awfaq-mode="history"><span>\u2301</span><div><b>\u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629</b><small>\u0627\u0644\u0645\u0635\u0627\u062F\u0631 \u0648\u062D\u062F\u0648\u062F \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629</small></div></button></section>${state.awfaqMode === "history" ? awfaqHistory() : awfaqSquare()}`;
  }
  function reference() {
    return `<section class="card"><h2>\u0627\u0644\u0645\u0631\u062C\u0639 \u0648\u0627\u0644\u0645\u0646\u0647\u062C</h2><p class="muted">\u0643\u0644 \u0627\u0644\u0646\u062A\u0627\u0626\u062C \u062D\u0633\u0627\u0628\u064A\u0629 \u0628\u0645\u0646\u0647\u062C \u0645\u0639\u0644\u0646. \u0644\u0627 \u064A\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0623\u0628\u062C\u062F\u064B\u0627 \u0645\u063A\u0631\u0628\u064A\u064B\u0627 \u0623\u0648 \u0637\u0627\u0644\u0639\u064B\u0627 \u0641\u0644\u0643\u064A\u064B\u0627 \u0623\u0648 \u0645\u0636\u0627\u0639\u0641\u0629 \u0644\u0644\u0634\u062F\u0629.</p><div class="reference"><div class="card"><h3>\u0627\u0644\u0623\u0628\u062C\u062F \u0627\u0644\u0645\u0634\u0631\u0642\u064A</h3>${Object.entries(ABJAD).map(([l, v]) => `<span class="letter">${l} = ${num(v)}</span>`).join(" ")}</div><div class="card"><h3>\u0627\u0644\u0637\u0628\u0627\u0626\u0639</h3>${Object.entries(ELEMENTS).map(([e, l]) => `<p><b>${e}</b>: ${l.join(" ")}</p>`).join("")}</div><div class="card"><h3>\u0627\u0644\u0643\u0648\u0627\u0643\u0628</h3>${PLANETS.map((p, i) => `<p>${i + 1}. ${p}</p>`).join("")}</div><div class="card"><h3>\u0627\u0644\u0628\u0631\u0648\u062C</h3>${ZODIAC.map(([z, e], i) => `<p>${num(i + 1)}. ${z} \xB7 ${e}</p>`).join("")}</div></div><div class="actions"><button class="btn primary" data-run-tests>\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0627\u0644\u0630\u0627\u062A\u064A\u0629</button><button class="btn" data-reset-storage>\u0645\u0633\u062D \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629</button></div><span class="tag">GHALIB-SIRR-1.0 \xB7 TABIA-MASHRIQI-1.0 \xB7 FALAK-STATIC-1.0 \xB7 BURJ-MOD12-1.0</span></section>`;
  }
  function render() {
    const sectionViews = { calculator, names, awfaq, reference };
    const result = analyze(state.text);
    app.innerHTML = `<div class="shell"><header class="top"><div class="brand"><h1>\u062D\u0633\u0627\u0628 \u0627\u0644\u062C\u0645\u0644</h1><small>\u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u0628\u0646 \u0635\u0644\u0627\u062D \xB7 \u0623\u062F\u0627\u0629 \u062D\u0633\u0627\u0628 \u062A\u0631\u0627\u062B\u064A\u0629 \u0645\u0648\u062B\u0642\u0629</small></div><button class="sum-chip" data-go-calculator><span>\u0627\u0644\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u062D\u0627\u0644\u064A</span>${num(result.total)}</button></header><nav class="nav">${[["calculator", "\u0627\u0644\u062D\u0627\u0633\u0628\u0629"], ["names", "\u0627\u0644\u0623\u0633\u0645\u0627\u0621"], ["awfaq", "\u0627\u0644\u0623\u0648\u0641\u0627\u0642"], ["reference", "\u0627\u0644\u0645\u0631\u062C\u0639"]].map(([id, label]) => `<button class="${state.section === id ? "active" : ""}" data-nav="${id}">${label}</button>`).join("")}</nav>${sectionViews[state.section]()}</div>`;
    attach();
  }
  function parseArabicNumber(raw) {
    return Number(String(raw).replace(/[٠-٩]/g, (d) => "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669".indexOf(d)).replace(/[^0-9]/g, "")) || 0;
  }
  function commitText(value) {
    state.text = value;
    persist();
  }
  function recordHistory() {
    const value = state.text.trim();
    const result = analyze(value);
    if (value && result.total) state.history = [{ text: value, total: result.total }, ...state.history.filter((x) => x.text !== value)].slice(0, 5);
  }
  var redrawTimer;
  function redrawKeepingFocus(selector, cursor) {
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(() => {
      if (selector === "#text") recordHistory();
      render();
      const field = document.querySelector(selector);
      if (field) {
        field.focus();
        field.setSelectionRange?.(cursor, cursor);
      }
    }, 260);
  }
  function attach() {
    document.querySelectorAll("[data-nav]").forEach((e) => e.onclick = () => setSection(e.dataset.nav));
    document.querySelector("[data-go-calculator]")?.addEventListener("click", () => setSection("calculator"));
    document.querySelectorAll("[data-awfaq-mode]").forEach((e) => e.addEventListener("click", () => {
      state.awfaqMode = e.dataset.awfaqMode;
      persist();
      render();
    }));
    document.querySelector("#text")?.addEventListener("input", (e) => {
      const cursor = e.target.selectionStart;
      commitText(e.target.value);
      redrawKeepingFocus("#text", cursor);
    });
    document.querySelector("#target")?.addEventListener("input", (e) => {
      const cursor = e.target.selectionStart;
      state.target = e.target.value;
      persist();
      redrawKeepingFocus("#target", cursor);
    });
    document.querySelectorAll("[data-example]").forEach((e) => e.onclick = () => {
      commitText(e.dataset.example);
      render();
    });
    document.querySelectorAll("[data-history]").forEach((e) => e.onclick = () => {
      state.text = state.history[e.dataset.history].text;
      persist();
      render();
    });
    document.querySelectorAll("[data-field]").forEach((field) => {
      const update = (event) => {
        const input = event.currentTarget;
        const cursor = typeof input.selectionStart === "number" ? input.selectionStart : null;
        const selector = `[data-field="${input.dataset.field}"]`;
        state[input.dataset.field] = input.value;
        persist();
        if (input.tagName === "SELECT") render();
        else redrawKeepingFocus(selector, cursor);
      };
      field.addEventListener("input", update);
      field.addEventListener("change", update);
    });
    document.querySelector("#awfaqText")?.addEventListener("input", (e) => {
      const cursor = e.target.selectionStart;
      state.awfaqText = e.target.value;
      persist();
      redrawKeepingFocus("#awfaqText", cursor);
    });
    document.querySelector("#rank")?.addEventListener("change", (e) => {
      state.rank = Number(e.target.value);
      persist();
      render();
    });
    document.querySelectorAll("[data-send]").forEach((e) => e.onclick = () => {
      if (e.dataset.send === "names") state.nameA = state.text;
      else state.awfaqText = state.text;
      setSection(e.dataset.send);
    });
    document.querySelector("[data-name-example]")?.addEventListener("click", () => {
      state.nameA = "\u062F\u0627\u0648\u062F";
      state.nameB = "\u062C\u0627\u0644\u0648\u062A";
      persist();
      render();
    });
    document.querySelector("[data-parent-example]")?.addEventListener("click", () => {
      state.father = "\u0645\u062D\u0645\u062F";
      state.mother = "\u0641\u0627\u0637\u0645\u0629";
      state.desiredBabyName = "";
      state.maleSearch = "";
      state.femaleSearch = "";
      state.suggestionLimit = 12;
      persist();
      render();
    });
    document.querySelectorAll("[data-select-name]").forEach((e) => e.addEventListener("click", () => {
      state.desiredBabyName = e.dataset.selectName;
      persist();
      render();
      document.querySelector('[data-field="desiredBabyName"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    document.querySelector("[data-use-calculator]")?.addEventListener("click", () => {
      state.awfaqText = state.text;
      persist();
      render();
    });
    document.querySelector("[data-more-names]")?.addEventListener("click", () => {
      state.suggestionLimit += 12;
      persist();
      render();
    });
    document.querySelector("[data-copy-result]")?.addEventListener("click", () => {
      const r = analyze(state.text);
      copy(`${state.text}
\u0627\u0644\u0645\u062C\u0645\u0648\u0639: ${num(r.total)}
\u0639\u062F\u062F \u0627\u0644\u062D\u0631\u0648\u0641: ${num(r.count)}`);
    });
    document.querySelector("[data-copy-comparison]")?.addEventListener("click", copyNameComparison);
    document.querySelector("[data-copy-magic]")?.addEventListener("click", () => {
      const m = makeMagicSquare(state.rank, analyze(state.awfaqText || state.text).total);
      copy(m.grid.map((row) => row.map(num).join(" | ")).join("\n"));
    });
    document.querySelectorAll("[data-copy-name]").forEach((e) => e.onclick = () => copy(e.dataset.copyName));
    document.querySelectorAll("[data-copy-link]").forEach((e) => e.onclick = copyShareLink);
    document.querySelector("[data-export-calculator]")?.addEventListener("click", () => {
      const r = analyze(state.text);
      if (!r.total) return toast("\u0627\u0643\u062A\u0628 \u0646\u0635\u064B\u0627 \u0623\u0648\u0644\u064B\u0627");
      exportCard("\u0628\u0637\u0627\u0642\u0629 \u062D\u0633\u0627\u0628 \u0627\u0644\u062C\u0645\u0644", [state.text, `\u0627\u0644\u0645\u062C\u0645\u0648\u0639: ${num(r.total)}`, `\u0627\u0644\u062D\u0631\u0648\u0641 \u0627\u0644\u0645\u062D\u062A\u0633\u0628\u0629: ${num(r.count)}`, `\u0639\u064A\u0651\u0646\u0629 \u0627\u0644\u062D\u0631\u0648\u0641: ${r.letters.slice(0, 24).map((x) => x.normalized).join(" ")}`], "hisab-jomal");
    });
    document.querySelector("[data-export-names]")?.addEventListener("click", () => {
      const a = profile(`${state.nameA} ${state.motherA}`), b = profile(`${state.nameB} ${state.motherB}`);
      if (!a.total && !b.total) return toast("\u0623\u062F\u062E\u0644 \u0627\u0633\u0645\u064B\u0627 \u0623\u0648\u0644\u064B\u0627");
      exportCard("\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0623\u0633\u0645\u0627\u0621", [`${state.nameA || "\u2014"}: ${num(a.total)} \xB7 ${a.leaders.join(" / ") || "\u2014"}`, `${state.nameB || "\u2014"}: ${num(b.total)} \xB7 ${b.leaders.join(" / ") || "\u2014"}`], "hisab-names");
    });
    document.querySelector("[data-export-awfaq]")?.addEventListener("click", () => {
      const r = analyze(state.awfaqText || state.text);
      if (!r.total) return toast("\u0627\u0643\u062A\u0628 \u0646\u0635\u064B\u0627 \u0623\u0648\u0644\u064B\u0627");
      const m = makeMagicSquare(state.rank, r.total);
      exportCard(`\u0648\u0641\u0642 ${m.n}\xD7${m.n}`, [`\u0627\u0644\u0645\u062C\u0645\u0648\u0639 S: ${num(r.total)}`, `\u062B\u0627\u0628\u062A \u0627\u0644\u062E\u0637 M: ${num(m.M)}`, `a = ${num(m.a)} \xB7 d = ${num(m.d)}`, ...m.grid.map((row) => row.map(num).join("  |  "))], "wafq");
    });
    document.querySelectorAll("[data-clear]").forEach((e) => e.onclick = () => {
      if (e.dataset.clear === "calculator") {
        state.text = "";
        state.target = "";
      }
      if (e.dataset.clear === "names") {
        state.nameA = "";
        state.nameB = "";
        state.motherA = "";
        state.motherB = "";
      }
      if (e.dataset.clear === "parents") {
        state.father = "";
        state.mother = "";
        state.desiredBabyName = "";
        state.maleSearch = "";
        state.femaleSearch = "";
        state.suggestionLimit = 12;
      }
      persist();
      render();
      toast("\u062A\u0645 \u0627\u0644\u0645\u0633\u062D");
    });
    document.querySelector("[data-run-tests]")?.addEventListener("click", () => {
      const tests = [["\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062D\u0645\u0646 \u0627\u0644\u0631\u062D\u064A\u0645", 786], ["\u062F\u0627\u0648\u062F", 15], ["\u062C\u0627\u0644\u0648\u062A", 440], ["\u0645\u062D\u0645\u062F", 92], ["\u0641\u0627\u0637\u0645\u0629", 135], ["\u0623\u0625\u0622\u0621", 4]];
      const passed = tests.every(([x, n]) => analyze(x).total === n);
      toast(passed ? "\u0646\u062C\u062D\u062A \u062C\u0645\u064A\u0639 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0631\u062C\u0639\u064A\u0629" : "\u0641\u0634\u0644 \u0627\u062E\u062A\u0628\u0627\u0631 \u0630\u0627\u062A\u064A");
    });
    document.querySelector("[data-reset-storage]")?.addEventListener("click", () => {
      localStorage.removeItem("hisab-jomal-state");
      location.reload();
    });
  }
  render();
})();
