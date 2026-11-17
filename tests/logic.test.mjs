import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const L = createRequire(import.meta.url)('../docs/logic.js');

const data = {
  chapters: [
    { no: 1, title: 'a', lessons: [
      { id: 'c01-l01', title: 'x', pages: [{ id: 'c01-l01-p01' }, { id: 'c01-l01-p02' }] },
      { id: 'c01-l02', title: 'y', pages: [{ id: 'c01-l02-p01' }] },
    ] },
  ],
};

function memStorage(init = {}) {
  const m = { ...init };
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    dump: () => m,
  };
}
const v1 = (extra = {}) => ({
  version: 1, position: { ch: 1, lessonId: 'c01-l02', page: 0 }, lessonsDone: ['c01-l01'],
  quizResults: { 'c01-ox-01': { correct: true, ts: 1 } }, wrongLog: ['c01-ox-01'], chapterTest: { 1: { score: 1, passed: true } },
  reports: [{ id: 'c01-l01-p01', memo: 'メモ', ts: 5 }], settings: { passRate: 0.6, unlockAll: false }, ...extra,
});

test('クイズ・試験関連の API は公開されない', () => {
  for (const k of ['gradeOx', 'gradeMc', 'buildExam', 'scoreExam', 'isChapterUnlocked', 'examUnlocked']) assert.equal(L[k], undefined, k);
});

test('emptyProgress は version 2 で validate を通る', () => {
  const p = L.emptyProgress();
  assert.equal(p.version, 2);
  assert.equal(L.validate(p), null);
  assert.deepEqual(Object.keys(p).sort(), ['lessonsDone', 'pagesDone', 'position', 'reports', 'version']);
});

test('validate: 不正な形を理由つきで弾く', () => {
  const ok = L.emptyProgress();
  assert.match(L.validate(null), /形式/);
  assert.match(L.validate({ ...ok, version: 3 }), /バージョン/);
  assert.match(L.validate({ ...ok, position: { ch: 'x', lessonId: 'a' } }), /position/);
  assert.match(L.validate({ ...ok, position: { ch: 1, lessonId: 'a', page: -1 } }), /position/);
  assert.match(L.validate({ ...ok, lessonsDone: [1] }), /lessonsDone/);
  assert.match(L.validate({ ...ok, pagesDone: 'x' }), /pagesDone/);
  assert.match(L.validate({ ...ok, reports: [{ id: 'a' }] }), /reports/);
  const noPos = { ...ok }; delete noPos.position;
  assert.match(L.validate(noPos), /position/);
  assert.equal(L.validate({ ...ok, position: { ch: 1, lessonId: 'a', page: 2 } }), null);
});

test('loadProgress: キー無し→空・ok / 壊れたJSON→空・NG / getItem 例外→空・NG', () => {
  assert.deepEqual(L.loadProgress(memStorage()), { progress: L.emptyProgress(), ok: true, migrated: false });
  const broken = L.loadProgress(memStorage({ [L.STORAGE_KEY]: '{oops' }));
  assert.equal(broken.ok, false);
  assert.deepEqual(broken.progress, L.emptyProgress());
  const invalid = L.loadProgress(memStorage({ [L.STORAGE_KEY]: JSON.stringify({ version: 2 }) }));
  assert.equal(invalid.ok, false);
  const thrower = { getItem() { throw new Error('denied'); } };
  assert.equal(L.loadProgress(thrower).ok, false);
});

test('save → load の往復', () => {
  const st = memStorage();
  const p = { ...L.emptyProgress(), pagesDone: ['c01-l01-p01'], position: { ch: 1, lessonId: 'c01-l01', page: 1 } };
  assert.equal(L.saveProgress(st, p), true);
  assert.equal(L.STORAGE_KEY, 'keycloak-taizen.progress.v2');
  const r = L.loadProgress(st);
  assert.equal(r.ok, true);
  assert.deepEqual(r.progress, p);
  assert.equal(L.saveProgress({ setItem() { throw new Error('quota'); } }, p), false);
});

test('version 1 データは v2 キー未作成時に移行(lessonsDone / reports / position を引き継ぎ、v1 は消さない)', () => {
  const st = memStorage({ [L.LEGACY_STORAGE_KEY]: JSON.stringify(v1()) });
  const r = L.loadProgress(st);
  assert.equal(r.ok, true);
  assert.equal(r.migrated, true);
  assert.equal(r.progress.version, 2);
  assert.deepEqual(r.progress.lessonsDone, ['c01-l01']);
  assert.deepEqual(r.progress.reports, [{ id: 'c01-l01-p01', memo: 'メモ', ts: 5 }]);
  assert.deepEqual(r.progress.position, { ch: 1, lessonId: 'c01-l02', page: 0 });
  assert.equal(r.progress.quizResults, undefined);
  assert.equal(r.progress.wrongLog, undefined);
  assert.equal(r.progress.chapterTest, undefined);
  assert.ok(st.dump()[L.LEGACY_STORAGE_KEY], 'v1 データは残る');
});

test('v2 キーがあれば v1 より優先される / v1 が壊れていれば空・NG', () => {
  const p2 = { ...L.emptyProgress(), pagesDone: ['z'] };
  const r = L.loadProgress(memStorage({ [L.STORAGE_KEY]: JSON.stringify(p2), [L.LEGACY_STORAGE_KEY]: JSON.stringify(v1()) }));
  assert.deepEqual(r.progress, p2);
  assert.equal(r.migrated, false);
  const bad = L.loadProgress(memStorage({ [L.LEGACY_STORAGE_KEY]: 'xx' }));
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.progress, L.emptyProgress());
});

test('importProgress: v2 / v1 / 不正', () => {
  const cur = L.emptyProgress();
  const p2 = { ...cur, lessonsDone: ['c01-l01'] };
  const a = L.importProgress(JSON.stringify(p2), cur);
  assert.equal(a.error, null);
  assert.deepEqual(a.progress, p2);
  assert.equal(a.migrated, false);
  const b = L.importProgress(JSON.stringify(v1()), cur);
  assert.equal(b.error, null);
  assert.equal(b.migrated, true);
  assert.equal(b.progress.version, 2);
  assert.deepEqual(b.progress.lessonsDone, ['c01-l01']);
  const c = L.importProgress('not json', cur);
  assert.equal(c.error, 'JSONとして読めませんでした');
  assert.equal(c.progress, cur);
  const d = L.importProgress(JSON.stringify({ version: 1, lessonsDone: 'x', reports: [], position: null }), cur);
  assert.ok(d.error);
  assert.equal(d.progress, cur);
  const e = L.importProgress(JSON.stringify({ version: 9 }), cur);
  assert.match(e.error, /バージョン/);
});

test('markPage: ページ完了→全ページでレッスン完了、外すと未完了へ戻る(元の進捗は変更しない)', () => {
  const p0 = L.emptyProgress();
  const p1 = L.markPage(p0, data, 'c01-l01-p01', true);
  assert.deepEqual(p0.pagesDone, []);
  assert.deepEqual(p1.pagesDone, ['c01-l01-p01']);
  assert.deepEqual(p1.lessonsDone, []);
  assert.deepEqual(L.lessonStats(p1, data.chapters[0].lessons[0]), { done: 1, total: 2 });
  const p2 = L.markPage(p1, data, 'c01-l01-p02', true);
  assert.deepEqual(p2.lessonsDone, ['c01-l01']);
  assert.equal(L.isLessonDone(p2, data.chapters[0].lessons[0]), true);
  const p3 = L.markPage(p2, data, 'c01-l01-p01', false);
  assert.deepEqual(p3.lessonsDone, []);
  assert.equal(L.isPageDone(p3, 'c01-l01-p01'), false);
  const again = L.markPage(p2, data, 'c01-l01-p02', true);
  assert.deepEqual(again.pagesDone, p2.pagesDone);
});

test('syncLessons(expandLegacy): 旧 lessonsDone のレッスンは全ページ完了扱いに', () => {
  const migrated = L.loadProgress(memStorage({ [L.LEGACY_STORAGE_KEY]: JSON.stringify(v1()) })).progress;
  const s = L.syncLessons(migrated, data, true);
  assert.deepEqual(s.pagesDone.sort(), ['c01-l01-p01', 'c01-l01-p02']);
  assert.deepEqual(s.lessonsDone, ['c01-l01']);
  // 展開しない場合、ページ未完了のレッスンは派生値として外れる
  assert.deepEqual(L.syncLessons(migrated, data, false).lessonsDone, []);
  // 存在しないレッスン id は無視される
  const ghost = { ...L.emptyProgress(), lessonsDone: ['c99-l01'] };
  assert.deepEqual(L.syncLessons(ghost, data, true).pagesDone, []);
});

test('レポート追加・削除と位置更新は新しいオブジェクトを返す', () => {
  const p0 = L.emptyProgress();
  const p1 = L.addReport(p0, 'c01-l01-p01', 'ここが違う', 123);
  assert.deepEqual(p0.reports, []);
  assert.deepEqual(p1.reports, [{ id: 'c01-l01-p01', memo: 'ここが違う', ts: 123 }]);
  const p2 = L.removeReport(p1, 0);
  assert.deepEqual(p2.reports, []);
  assert.equal(p1.reports.length, 1);
  const p3 = L.setPosition(p0, { ch: 1, lessonId: 'c01-l01', page: 0 });
  assert.equal(p0.position, null);
  assert.equal(L.validate(p3), null);
});
