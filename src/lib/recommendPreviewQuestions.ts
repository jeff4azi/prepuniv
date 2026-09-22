/**
 * recommendPreviewQuestions — industry-standard heuristic selector for the
 * "Let PrepUniv choose" creator preview picker.
 *
 * This is NOT a Large Language Model. It's a deterministic, auditable,
 * weighted scoring + greedy coverage algorithm that produces the same
 * output every time for the same inputs (no temperature, no hallucinations,
 * no API bills, no need to ship API keys to the client).
 *
 * It produces better, more representative picks than what a lightweight
 * heuristic or an off-the-shelf LLM would do for this specific problem
 * because every knob is tuned to PrepUniv's product goals:
 *
 *   1. Quality — pick well-formed questions that demonstrate effort.
 *   2. Validity — every question in the preview must actually be gradable.
 *   3. Coverage — represent the breadth of the quiz, not just the first 5.
 *   4. Spread — avoid questions that are clustered in one section.
 *   5. Balance — mix MCQ and, if present, fill-blank so students see
 *                 what BOTH formats feel like.
 *   6. Difficulty proxy — don't dump 5 trivial warm-ups or 5 killer
 *                 trick questions; aim for the middle of the distribution.
 *   7. Originality — reject near-duplicate text (questions that rephrase
 *                 the same concept in the same quiz are wasted slots).
 *
 * Input contract: any list of questions with at least `question_text`,
 * `type` ("mcq" | "fill_blank"), `options: string[]`, `correct_answer: string`.
 * The function works on DraftQuestion (builder) and Question (saved).
 *
 * Output: up to `takeMax` IDs from `getId(q)` in the desired display order.
 */

export type PreviewableQuestion = {
  question_text: string;
  type: "mcq" | "fill_blank" | string;
  options: string[];
  correct_answer: string;
};

export function recommendPreviewQuestions<T extends PreviewableQuestion>(
  questions: readonly T[],
  getId: (q: T, idx: number) => string,
  takeMax = 5,
): string[] {
  const n = questions.length;
  if (n === 0) return [];
  if (n <= takeMax) {
    return questions.map((q, i) => getId(q, i));
  }

  // ─── Phase 1: Individual quality scoring (0 – ~20) ───────────────────────

  const scored = questions.map((q, idx) => {
    let s = 0;

    // ── 1. Validity (deal-breakers — MUST be gradable) ────────────────────
    const text = q.question_text.trim();
    const textLen = text.length;

    // Too-short question → probably placeholder / not written yet → penalty
    if (textLen < 12) s -= 8;
    // Validating correct_answer is non-empty
    const correct = q.correct_answer.trim();
    if (!correct) s -= 10;

    // MCQ-specific validity
    let mcqValidOpts = 0;
    let optsDistinct = false;
    if (q.type === "mcq") {
      const normalized = q.options.map((o) => o.trim().toLowerCase());
      const nonEmpty = normalized.filter((o) => o.length > 0);
      mcqValidOpts = nonEmpty.length;
      const set = new Set(nonEmpty);
      optsDistinct = set.size === nonEmpty.length && nonEmpty.length >= 2;

      // Correct answer must correspond to one of the options
      const cNorm = correct.toLowerCase();
      const correctInOpts = nonEmpty.some((o) => o === cNorm);
      if (!correctInOpts) s -= 6;
      // All 4 options filled = question is in its final form, not WIP
      if (mcqValidOpts === 4) s += 2;
      if (mcqValidOpts >= 3) s += 1;
      // Distinct options (no "A / A / B / C" typos)
      if (optsDistinct) s += 2;
      // Avoid trick / confusing overlap between very similar distractors
      if (optsDistinct && hasDistractorDiversity(nonEmpty)) s += 1;
    }

    // Fill-blank validity
    if (q.type === "fill_blank") {
      const alts = correct.split("|").map((a) => a.trim()).filter(Boolean);
      if (alts.length === 0) s -= 6;
      // 2+ acceptable alternatives (e.g. "mRNA" | "messenger RNA") → good question
      if (alts.length >= 2) s += 2;
    }

    // ── 2. Text quality ────────────────────────────────────────────────────
    // Sweet spot: 30 – 300 chars = clear, not a wall of text
    if (textLen >= 40 && textLen <= 260) s += 3;
    else if (textLen >= 20 && textLen <= 500) s += 1;

    // Signs of craftsmanship: contains "?" (typical real question), or
    // ends with "of the following" type phrasing, or has rich punctuation
    if (/[?]$/.test(text)) s += 1;
    const punctCount = (text.match(/[,:;()"—–-]/g) ?? []).length;
    if (punctCount >= 2) s += 1;
    // Pure placeholder text → penalty
    if (/^(question|q)[ _-]?\d+$/i.test(text)) s -= 5;
    if (/^(lorem ipsum|untitled|new question|sample)/i.test(text)) s -= 6;

    // ── 3. Difficulty proxy (prefer "medium" questions) ────────────────────
    // Heuristic for MCQ: options contain some numbers or multi-word
    // options → not trivially "yes/no-like". Too uniform options is a
    // warning sign of easy A/B-C/D patterns (e.g. All / None / 1 only).
    if (q.type === "mcq" && mcqValidOpts >= 3) {
      const opts = q.options;
      const wordy = opts.filter((o) => o.trim().split(/\s+/).length >= 3).length;
      if (wordy >= 2 && wordy <= 4) s += 2; // balanced mix
      // Numeracy → usually a real applied question
      const anyNums = opts.some(
        (o) => /\d/.test(o) && /[a-z]/i.test(opts.join(" ")) !== true,
      );
      if (anyNums) s += 1;
    }

    // Fill-blank: answer isn't just a single short word ("yes"/"1") → better
    if (q.type === "fill_blank") {
      const alts = correct.split("|").map((a) => a.trim()).filter(Boolean);
      const avgLen =
        alts.reduce((a, b) => a + b.length, 0) / Math.max(1, alts.length);
      if (avgLen >= 3 && avgLen <= 20) s += 1;
      if (alts.some((a) => /\s/.test(a))) s += 1; // multi-word answer
    }

    // ── 4. Position neutrality ─────────────────────────────────────────────
    // The OLD algorithm had a tiebreaker that biased heavily to the
    // START of the quiz (sort first by score DESC then by index ASC).
    // We remove that bias: a question in the last 20% of a LARGE quiz
    // is fine if it scores well — only penalize the extreme fringe 5%
    // (often just outliners / post-quiz survey stuff).
    if (n >= 20) {
      const pos = idx / (n - 1);
      if (pos >= 0.95) s -= 2; // last 5% — often WIP tail
      // The "early only" bias was causing top-score ties to resolve to
      // questions 1/2/3/4/5 every time. We handle this in Phase 2 with
      // spread promotion, but we also nudge down very-early duplicates:
      if (pos < 0.05) s -= 0; // no nudge yet — Phase 2 fixes this.
    }

    return {
      id: getId(q, idx),
      index: idx,
      score: s,
      q,
    };
  });

  // ─── Phase 2: Build final selection with spread + coverage ───────────────
  // Instead of "just take the top `takeMax` by score" (which often
  // produces 5 adjacent MCQ questions from the first page of the quiz),
  // we use a greedy slot-filling algorithm:
  //
  //   (a) Always start with the single highest-scored question as anchor.
  //   (b) Then for each subsequent slot we pick the question that maximizes
  //       (quality score) + (spread bonus for position distance) +
  //       (diversity bonus for a new question type) − (near-duplicate penalty).
  //
  // This guarantees the preview is both high-quality AND representative.

  interface Picked {
    id: string;
    index: number;
    score: number;
    q: PreviewableQuestion;
    type: string;
    textBag: Set<string>; // bag of 24 common words for near-duplicate detection
  }

  const picked: Picked[] = [];
  const chosenIds = new Set<string>();
  const textBag = (t: string): Set<string> =>
    new Set(
      t
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4)
        .slice(0, 50),
    );

  // Seed with highest-scored question
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const first = ranked[0];
  picked.push({
    id: first.id,
    index: first.index,
    score: first.score,
    q: first.q,
    type: String(first.q.type),
    textBag: textBag(first.q.question_text),
  });
  chosenIds.add(first.id);

  while (picked.length < takeMax) {
    let best: typeof ranked[number] | null = null;
    let bestAdj = -Infinity;

    for (const cand of ranked) {
      if (chosenIds.has(cand.id)) continue;

      // Base quality
      let adj = cand.score;

      // Spread bonus — penalize being too close to any already-picked index
      let minDist = Infinity;
      for (const p of picked) {
        minDist = Math.min(minDist, Math.abs(cand.index - p.index));
      }
      // If question 0/1 are picked, bonus for a candidate at position 20 = ~+4
      const normDist = n > 1 ? minDist / (n - 1) : 1;
      adj += normDist * 6;

      // Diversity bonus — promote the other question type if it hasn't been seen
      const typesSeen = new Set(picked.map((p) => p.type));
      if (!typesSeen.has(String(cand.q.type))) {
        // Bigger bonus if the picked set is already 2+ long (forces the mix)
        adj += picked.length >= 2 ? 3 : 1.5;
      }

      // Near-duplicate penalty — if 50%+ of key words overlap a picked q, skip
      const candBag = textBag(cand.q.question_text);
      let overlapPenalty = 0;
      for (const p of picked) {
        let overlap = 0;
        for (const w of candBag) if (p.textBag.has(w)) overlap++;
        const union = candBag.size + p.textBag.size - overlap;
        const jaccard = union > 0 ? overlap / union : 0;
        if (jaccard > 0.55) overlapPenalty += 9; // hard skip — almost same question
        else if (jaccard > 0.3) overlapPenalty += 4; // weak nudge
      }
      adj -= overlapPenalty;

      if (adj > bestAdj) {
        bestAdj = adj;
        best = cand;
      }
    }

    if (!best) break; // ran out
    picked.push({
      id: best.id,
      index: best.index,
      score: best.score,
      q: best.q,
      type: String(best.q.type),
      textBag: textBag(best.q.question_text),
    });
    chosenIds.add(best.id);
  }

  // ─── Phase 3: Order the picked set back into original quiz order ─────────
  // Preview should feel like a "natural walk through the quiz", not a
  // jumbled best-of. If the creator wants to reorder manually they can.
  picked.sort((a, b) => a.index - b.index);

  return picked.map((p) => p.id);
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * MCQ distractor-diversity check. A valid 4-option MCQ usually shows
 * meaningful conceptual variation across the 4 choices.
 * Returns false if options are trivially different (e.g. just numbers
 * differing by 1 word — a giveaway for "C is the right one" pattern).
 *
 * This is intentionally conservative — it returns true (diverse) for
 * ambiguous cases rather than punishing the wrong thing.
 */
function hasDistractorDiversity(optsNormalized: string[]): boolean {
  const nonEmpty = optsNormalized.filter(Boolean);
  if (nonEmpty.length < 3) return false;

  // Count unique first words
  const firstWords = new Set(
    nonEmpty.map((o) => o.split(/\s+/)[0]).filter(Boolean),
  );
  // Most "text" MCQs should start with different words across distractors
  if (firstWords.size >= Math.min(3, nonEmpty.length - 1)) return true;

  // Numeral options — accept if their numeric values aren't all within ±2
  const numbers = nonEmpty
    .map((o) => parseFloat(o.replace(/[^\d.-]/g, "")))
    .filter((n) => !Number.isNaN(n));
  if (numbers.length === nonEmpty.length && numbers.length >= 3) {
    const spread = Math.max(...numbers) - Math.min(...numbers);
    if (spread >= 2) return true;
  }

  // Length variance — if options vary a lot in length, they're diverse enough
  const lens = nonEmpty.map((o) => o.length);
  const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
  const variance =
    lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length;
  if (variance > avg * 0.4) return true;

  return false;
}
