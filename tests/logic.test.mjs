import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const L = createRequire(import.meta.url)('../app/logic.js');

const pad = (n) => String(n).padStart(2, '0');
function dummyChapter(no, nOx, nMc) {
  const ox = [], mc = [];
  for (let i = 1; i <= nOx; i++) ox.push({ id: `c${pad(no)}-ox-${pad(i)}`, text: 't', answer: i % 2 === 0, explain: 'e', sec: null });
  for (let i = 1; i <= nMc; i++) mc.push({ id: `c${pad(no)}-mc-${pad(i)}`, stem: 's', items: [], choices: ['a', 'b', 'c', 'd', 'e'], answer: i % 5, explain: [], tip: null });
  return { no, title: 'ch' + no, lessons: [], ox, mc };
}
const data = { chapters: [dummyChapter(1, 40, 12), dummyChapter(2, 30, 10), dummyChapter(3, 25, 8)] };  // ox 95 / mc 30
const correctAnswers = (exam) => {
  const a = {};
  exam.ox.forEach((q) => (a[q.id] = q.answer));
  exam.mc.forEach((q) => (a[q.id] = q.answer));
  return a;
};

test('gradeOx / gradeMc', () => {
  assert.equal(L.gradeOx({ answer: true }, true).correct, true);
  assert.equal(L.gradeOx({ answer: true }, false).correct, false);
  assert.equal(L.gradeMc({ answer: 2 }, 2).correct, true);
  assert.equal(L.gradeMc({ answer: 0 }, 0).correct, true);
  assert.equal(L.gradeMc({ answer: 2 }, 3).correct, false);
});

test('emptyProgress の形（passRate は 0.6）', () => {
  const p = L.emptyProgress();
  assert.equal(p.version, 1);
  assert.equal(p.position, null);
  assert.deepEqual(p.lessonsDone, []);
  assert.deepEqual(p.quizResults, {});
  assert.deepEqual(p.wrongLog, []);
  assert.deepEqual(p.chapterTest, {});
  assert.deepEqual(p.reports, []);
  assert.equal(p.settings.passRate, 0.6);
  assert.equal(p.settings.unlockAll, false);
  assert.notEqual(L.emptyProgress(), L.emptyProgress());
});

// Review Focus 1: localStorage が使えない / 壊れたJSON
test('loadProgress: 壊れたJSON -> ok:false, 空の進捗', () => {
  const r = L.loadProgress({ getItem: () => '{broken' });
  assert.equal(r.ok, false);
  assert.deepEqual(r.progress, L.emptyProgress());
});
test('loadProgress: getItem が例外 / storage が null / 形が不正', () => {
  assert.equal(L.loadProgress({ getItem: () => { throw new Error('denied'); } }).ok, false);
  assert.equal(L.loadProgress(null).ok, false);
  assert.equal(L.loadProgress(undefined).ok, false);
  assert.equal(L.loadProgress({ getItem: () => '{"version":2}' }).ok, false);
  assert.equal(L.loadProgress({ getItem: () => '[]' }).ok, false);
});
test('loadProgress: 未保存は ok:true で空の進捗', () => {
  const r = L.loadProgress({ getItem: () => null });
  assert.equal(r.ok, true);
  assert.deepEqual(r.progress, L.emptyProgress());
});
test('saveProgress -> loadProgress の往復、キーは keycloak-taizen.progress.v1', () => {
  const mem = {};
  const st = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = v; } };
  const p = L.emptyProgress();
  p.lessonsDone.push('c01-l01');
  p.position = { ch: 1, lessonId: 'c01-l02' };
  assert.equal(L.saveProgress(st, p), true);
  assert.ok('keycloak-taizen.progress.v1' in mem);
  const r = L.loadProgress(st);
  assert.equal(r.ok, true);
  assert.deepEqual(r.progress, p);
});
test('saveProgress: 失敗しても例外を投げず false', () => {
  assert.equal(L.saveProgress({ setItem: () => { throw new Error('quota'); } }, L.emptyProgress()), false);
  assert.equal(L.saveProgress(null, L.emptyProgress()), false);
  assert.equal(L.saveProgress(undefined, L.emptyProgress()), false);
});

// Review Focus 2: 不正な進捗ファイルのインポート拒否
test('importProgress: 正常な進捗を受け入れる', () => {
  const p = L.emptyProgress();
  p.lessonsDone = ['c01-l01'];
  p.quizResults['c01-ox-01'] = { correct: true, ts: 1 };
  p.chapterTest[1] = { score: 8, passed: true };
  p.reports = [{ id: 'c01-ox-01', memo: 'm' }];
  const r = L.importProgress(JSON.stringify(p), L.emptyProgress());
  assert.equal(r.error, null);
  assert.deepEqual(r.progress, p);
});
test('importProgress: 不正な入力は error ありで current を維持', () => {
  const cur = L.emptyProgress();
  cur.lessonsDone = ['keep'];
  const bads = [
    '{"version":2}', '{broken', '', 'null', '[]', '"str"', '123',
    '{}',
    JSON.stringify({ ...L.emptyProgress(), lessonsDone: 'x' }),
    JSON.stringify({ ...L.emptyProgress(), quizResults: [] }),
    JSON.stringify({ ...L.emptyProgress(), quizResults: { a: { correct: 'yes', ts: 1 } } }),
    JSON.stringify({ ...L.emptyProgress(), wrongLog: [1] }),
    JSON.stringify({ ...L.emptyProgress(), chapterTest: { 1: { score: 'a', passed: true } } }),
    JSON.stringify({ ...L.emptyProgress(), reports: [{ id: 1 }] }),
    JSON.stringify({ ...L.emptyProgress(), settings: { passRate: 'x', unlockAll: false } }),
    JSON.stringify({ ...L.emptyProgress(), position: { ch: 'x' } }),
  ];
  for (const b of bads) {
    const r = L.importProgress(b, cur);
    assert.ok(r.error, 'error expected for ' + b);
    assert.equal(r.progress, cur);
    assert.deepEqual(cur.lessonsDone, ['keep']);
  }
  assert.ok(L.importProgress(undefined, cur).error);
});

test('isChapterUnlocked', () => {
  const p = L.emptyProgress();
  assert.equal(L.isChapterUnlocked(p, 1), true);
  assert.equal(L.isChapterUnlocked(p, 2), false);
  p.chapterTest[1] = { score: 3, passed: false };
  assert.equal(L.isChapterUnlocked(p, 2), false);
  p.chapterTest[1] = { score: 8, passed: true };
  assert.equal(L.isChapterUnlocked(p, 2), true);
  assert.equal(L.isChapterUnlocked(p, 3), false);
  p.settings.unlockAll = true;
  assert.equal(L.isChapterUnlocked(p, 3), true);
  assert.equal(L.isChapterUnlocked(p, 10), true);
});

test('examUnlocked: 全章 passed か unlockAll', () => {
  const p = L.emptyProgress();
  assert.equal(L.examUnlocked(p, data), false);
  p.chapterTest[1] = { score: 1, passed: true };
  p.chapterTest[2] = { score: 1, passed: true };
  assert.equal(L.examUnlocked(p, data), false);
  p.chapterTest[3] = { score: 1, passed: true };
  assert.equal(L.examUnlocked(p, data), true);
  const q = L.emptyProgress();
  q.settings.unlockAll = true;
  assert.equal(L.examUnlocked(q, data), true);
});

test('定数: 総合理解チェックの出題数・配点・目安ライン', () => {
  assert.equal(L.STORAGE_KEY, 'keycloak-taizen.progress.v1');
  assert.equal(L.OX_N, 40);
  assert.equal(L.MC_N, 20);
  assert.equal(L.OX_PT, 1);
  assert.equal(L.MC_PT, 2);
  assert.equal(L.EXAM_PASS_RATE, 0.7);
});

test('buildExam: ox40 mc20 重複なし、章の比率、決定的な rng', () => {
  let s = 1;
  const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const e = L.buildExam(data, rng);
  assert.equal(e.ox.length, 40);
  assert.equal(e.mc.length, 20);
  assert.equal(new Set(e.ox.map((q) => q.id)).size, 40);
  assert.equal(new Set(e.mc.map((q) => q.id)).size, 20);
  const cnt = (arr, ch) => arr.filter((q) => q.id.startsWith('c' + pad(ch))).length;
  assert.ok(cnt(e.ox, 1) > cnt(e.ox, 3)); // 40 vs 25 問
  assert.ok(cnt(e.ox, 3) >= 1);
  // 同じ rng 系列なら同じ結果
  s = 1;
  const e2 = L.buildExam(data, rng);
  assert.deepEqual(e2.ox.map((q) => q.id), e.ox.map((q) => q.id));
  // Math.random でも壊れない
  assert.equal(L.buildExam(data, Math.random).ox.length, 40);
});

test('buildExam: 問題が足りなければ有るだけ（例外なし）', () => {
  const small = { chapters: [dummyChapter(1, 5, 2)] };
  const e = L.buildExam(small, Math.random);
  assert.equal(e.ox.length, 5);
  assert.equal(e.mc.length, 2);
});

test('buildExam: 章ごとの問題数が上限（1章が小さくても超えない）', () => {
  const d = { chapters: [dummyChapter(1, 3, 1), dummyChapter(2, 100, 50)] };
  const e = L.buildExam(d, Math.random);
  assert.equal(e.ox.length, 40);
  assert.equal(e.mc.length, 20);
  assert.ok(e.ox.filter((q) => q.id.startsWith('c01')).length <= 3);
  assert.ok(e.mc.filter((q) => q.id.startsWith('c01')).length <= 1);
});

test('buildExam: 実データ規模（17章 ox281 mc127）でも ox40 mc20 になり全章から出る', () => {
  const sizes = [[10, 6], [14, 7], [16, 8], [28, 10], [17, 8], [11, 6], [24, 9], [24, 9], [24, 9], [11, 6], [12, 7], [9, 6], [7, 6], [11, 6], [9, 6], [36, 10], [18, 8]];
  const d = { chapters: sizes.map(([o, m], i) => dummyChapter(i + 1, o, m)) };
  const e = L.buildExam(d, Math.random);
  assert.equal(e.ox.length, 40);
  assert.equal(e.mc.length, 20);
  // 章が多く問題数が少ない章（ox 7 → 約1問）は 0 になりうるが、大きい章は必ず出る
  assert.ok(e.ox.filter((q) => q.id.startsWith('c16')).length >= 4);
});

// 未回答の採点
test('scoreExam: ox全正解+mc0 -> 40点/80点・目安未満', () => {
  const e = L.buildExam(data, Math.random);
  const a = correctAnswers(e);
  e.mc.forEach((q) => delete a[q.id]);
  const r = L.scoreExam(e, a);
  assert.equal(r.points, 40);
  assert.equal(r.max, 80);
  assert.equal(r.pass, false);
});
test('scoreExam: 全正解 -> 満点・到達', () => {
  const e = L.buildExam(data, Math.random);
  const r = L.scoreExam(e, correctAnswers(e));
  assert.equal(r.points, 80);
  assert.equal(r.max, 80);
  assert.equal(r.pass, true);
  const total = Object.values(r.byChapter).reduce((n, c) => n + c.total, 0);
  const corr = Object.values(r.byChapter).reduce((n, c) => n + c.correct, 0);
  assert.equal(total, 60);
  assert.equal(corr, 60);
});
test('scoreExam: 未回答のみ -> 0点、例外なし、null/undefined answers も可', () => {
  const e = L.buildExam(data, Math.random);
  for (const a of [{}, null, undefined]) {
    const r = L.scoreExam(e, a);
    assert.equal(r.points, 0);
    assert.equal(r.max, 80);
    assert.equal(r.pass, false);
    assert.equal(Object.values(r.byChapter).reduce((n, c) => n + c.correct, 0), 0);
  }
});
test('scoreExam: 目安ライン70%の境界、false/0 の回答は回答済み扱い', () => {
  const e = L.buildExam(data, Math.random);
  // max 80 → 70% = 56点。ox 40 正解(40) + mc 8 正解(16) = 56 -> 到達、mc 7 = 54 -> 未満
  const mk = (nMc) => {
    const a = correctAnswers(e);
    e.mc.forEach((q, i) => { if (i >= nMc) delete a[q.id]; });
    return L.scoreExam(e, a);
  };
  assert.equal(mk(8).points, 56);
  assert.equal(mk(8).pass, true);
  assert.equal(mk(7).points, 54);
  assert.equal(mk(7).pass, false);
  // 誤答
  const wrong = {};
  e.ox.forEach((q) => (wrong[q.id] = !q.answer));
  e.mc.forEach((q) => (wrong[q.id] = (q.answer + 1) % 5));
  assert.equal(L.scoreExam(e, wrong).points, 0);
  // 正解が 0 / false の問題を正しく採点する
  const z = { ox: [{ id: 'c01-ox-01', answer: false }], mc: [{ id: 'c01-mc-01', answer: 0 }] };
  assert.equal(L.scoreExam(z, { 'c01-ox-01': false, 'c01-mc-01': 0 }).points, 3);
});
test('scoreExam: max は出題内容から計算（出題数が少ない場合も）', () => {
  const small = { chapters: [dummyChapter(1, 5, 2)] };
  const e = L.buildExam(small, Math.random);
  const r = L.scoreExam(e, correctAnswers(e));
  assert.equal(r.max, 5 * L.OX_PT + 2 * L.MC_PT);
  assert.equal(r.points, r.max);
  assert.equal(r.pass, true);
  // 7/10 ちょうどは到達（浮動小数点の境界）
  const ten = { ox: [], mc: [] };
  for (let i = 1; i <= 10; i++) ten.ox.push({ id: `c01-ox-${pad(i)}`, answer: true });
  const a = {};
  ten.ox.forEach((q, i) => { if (i < 7) a[q.id] = true; });
  const r10 = L.scoreExam(ten, a);
  assert.equal(r10.max, 10);
  assert.equal(r10.points, 7);
  assert.equal(r10.pass, true);
});
test('scoreExam: 問題が0件なら max 0・未到達、章別は章番号で集計', () => {
  const r0 = L.scoreExam({ ox: [], mc: [] }, {});
  assert.equal(r0.max, 0);
  assert.equal(r0.pass, false);
  const ex = {
    ox: [{ id: 'c03-ox-01', answer: true }, { id: 'c17-ox-02', answer: false }],
    mc: [{ id: 'c17-mc-01', answer: 3 }]
  };
  const r = L.scoreExam(ex, { 'c03-ox-01': true, 'c17-ox-02': true, 'c17-mc-01': 3 });
  assert.deepEqual(r.byChapter, { 3: { correct: 1, total: 1 }, 17: { correct: 1, total: 2 } });
  assert.equal(r.points, 3);
});

test('position.page: あり/なし両方読める、不正な page は拒否', () => {
  const st = (p) => ({ getItem: () => JSON.stringify(p) });
  const base = L.emptyProgress();
  const old = { ...base, position: { ch: 1, lessonId: 'c01-l02' } };
  assert.deepEqual(L.loadProgress(st(old)).progress.position, { ch: 1, lessonId: 'c01-l02' });
  const withPage = { ...base, position: { ch: 1, lessonId: 'c01-l02', page: 3 } };
  const r = L.loadProgress(st(withPage));
  assert.equal(r.ok, true);
  assert.equal(r.progress.position.page, 3);
  assert.equal(L.importProgress(JSON.stringify(withPage), base).error, null);
  assert.equal(L.importProgress(JSON.stringify({ ...base, position: { ch: 1, lessonId: 'a', page: 0 } }), base).error, null);
  for (const bad of [-1, 1.5, '2', null, NaN]) {
    const j = JSON.stringify({ ...base, position: { ch: 1, lessonId: 'a', page: bad } });
    assert.ok(L.importProgress(j, base).error, 'bad page ' + bad);
    assert.equal(L.loadProgress(st({ ...base, position: { ch: 1, lessonId: 'a', page: bad } })).ok, false);
  }
});
