(function (root) {
  'use strict';

  // 進捗スキーマ version 2。
  //   { version: 2, position, lessonsDone: string[], pagesDone: string[], reports: [{id, memo, ts?}] }
  // lessonsDone は「全ページ完了したレッスン」の派生キャッシュ。version 1 の lessonsDone / reports / position は引き継ぐ。
  var KEY = 'keycloak-taizen.progress.v2';
  var LEGACY_KEY = 'keycloak-taizen.progress.v1';
  var VERSION = 2;

  function emptyProgress() {
    return { version: VERSION, position: null, lessonsDone: [], pagesDone: [], reports: [] };
  }

  function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function isStrArr(x) { return Array.isArray(x) && x.every(function (s) { return typeof s === 'string'; }); }
  function isNum(x) { return typeof x === 'number' && isFinite(x); }
  function uniq(arr) { return arr.filter(function (s, i) { return arr.indexOf(s) === i; }); }

  function validPosition(pos) {
    if (pos === null) return true;
    return isObj(pos) && isNum(pos.ch) && typeof pos.lessonId === 'string' &&
      (pos.page === undefined || (typeof pos.page === 'number' && isFinite(pos.page) && pos.page >= 0 && Math.floor(pos.page) === pos.page));
  }
  function validReports(r) {
    return Array.isArray(r) && r.every(function (x) { return isObj(x) && typeof x.id === 'string' && typeof x.memo === 'string'; });
  }

  // 不正なら理由の文字列、正しければ null (version 2 のみ)
  function validate(p) {
    if (!isObj(p)) return '進捗ファイルの形式が正しくありません';
    if (p.version !== VERSION) return '対応していないバージョンです';
    if (p.position === undefined || !validPosition(p.position)) return 'position が不正です';
    if (!isStrArr(p.lessonsDone)) return 'lessonsDone が不正です';
    if (!isStrArr(p.pagesDone)) return 'pagesDone が不正です';
    if (!validReports(p.reports)) return 'reports が不正です';
    return null;
  }

  // version 1 の進捗を version 2 に変換する。引き継ぐのは position / lessonsDone / reports のみ。
  // 変換できなければ null。
  function migrateV1(p) {
    if (!isObj(p) || p.version !== 1) return null;
    var pos = p.position === undefined ? null : p.position;
    if (!validPosition(pos) || !isStrArr(p.lessonsDone) || !validReports(p.reports)) return null;
    return { version: VERSION, position: pos, lessonsDone: uniq(p.lessonsDone), pagesDone: [], reports: p.reports.slice() };
  }

  // 保存形式(version 1 or 2)の JSON オブジェクトを version 2 に揃える。{progress, migrated, error}
  function normalize(p) {
    if (isObj(p) && p.version === 1) {
      var m = migrateV1(p);
      return m ? { progress: m, migrated: true, error: null } : { progress: null, migrated: false, error: 'version 1 の進捗が不正です' };
    }
    var err = validate(p);
    if (err) return { progress: null, migrated: false, error: err };
    return { progress: p, migrated: false, error: null };
  }

  function parse(raw) { try { return JSON.parse(raw); } catch (e) { return undefined; } }

  // 戻り値: { progress, ok, migrated }
  // version 2 のキーが無く version 1 のキーがあれば移行する(version 1 のデータは消さない)。
  function loadProgress(storage) {
    var raw, legacy = null;
    try { raw = storage.getItem(KEY); } catch (e) { return { progress: emptyProgress(), ok: false, migrated: false }; }
    if (raw === null || raw === undefined) {
      try { legacy = storage.getItem(LEGACY_KEY); } catch (e) { legacy = null; }
      if (legacy === null || legacy === undefined) return { progress: emptyProgress(), ok: true, migrated: false };
      var n1 = normalize(parse(legacy));
      if (n1.progress) return { progress: n1.progress, ok: true, migrated: true };
      return { progress: emptyProgress(), ok: false, migrated: false };
    }
    var n = normalize(parse(raw));
    if (n.progress) return { progress: n.progress, ok: true, migrated: n.migrated };
    return { progress: emptyProgress(), ok: false, migrated: false };
  }

  function saveProgress(storage, p) {
    try { storage.setItem(KEY, JSON.stringify(p)); return true; } catch (e) { return false; }
  }

  // 戻り値: { progress, error, migrated }。失敗時は current を返す。
  function importProgress(json, current) {
    var p;
    try { p = JSON.parse(json); } catch (e) { return { progress: current, error: 'JSONとして読めませんでした', migrated: false }; }
    var n = normalize(p);
    if (n.error) return { progress: current, error: n.error, migrated: false };
    return { progress: n.progress, error: null, migrated: n.migrated };
  }

  // ---------- ページ・レッスンの完了 ----------
  function isPageDone(p, pageId) { return p.pagesDone.indexOf(pageId) >= 0; }

  function lessonStats(p, lesson) {
    var done = lesson.pages.filter(function (pg) { return isPageDone(p, pg.id); }).length;
    return { done: done, total: lesson.pages.length };
  }

  function isLessonDone(p, lesson) {
    var s = lessonStats(p, lesson);
    return s.total > 0 && s.done === s.total;
  }

  // 全レッスンについて lessonsDone を「全ページ完了」から再計算した新しい進捗を返す。
  // expandLegacy=true なら、lessonsDone に載っていたレッスンの全ページを完了扱いにしてから再計算する(version 1 からの移行時に1回だけ使う)。
  function syncLessons(p, data, expandLegacy) {
    var pages = p.pagesDone.slice();
    if (expandLegacy) {
      data.chapters.forEach(function (c) {
        c.lessons.forEach(function (l) {
          if (p.lessonsDone.indexOf(l.id) >= 0) l.pages.forEach(function (pg) { if (pages.indexOf(pg.id) < 0) pages.push(pg.id); });
        });
      });
    }
    var base = Object.assign({}, p, { pagesDone: pages });
    var lessons = [];
    data.chapters.forEach(function (c) {
      c.lessons.forEach(function (l) { if (isLessonDone(base, l)) lessons.push(l.id); });
    });
    return Object.assign({}, base, { lessonsDone: lessons });
  }

  // ページの完了を切り替えた新しい進捗を返す(レッスン完了も再計算)。
  function markPage(p, data, pageId, done) {
    var has = isPageDone(p, pageId);
    if (done === has) return syncLessons(p, data, false);
    var pages = done ? p.pagesDone.concat([pageId]) : p.pagesDone.filter(function (id) { return id !== pageId; });
    return syncLessons(Object.assign({}, p, { pagesDone: pages }), data, false);
  }

  function setPosition(p, position) { return Object.assign({}, p, { position: position }); }

  function addReport(p, id, memo, ts) {
    return Object.assign({}, p, { reports: p.reports.concat([{ id: id, memo: memo, ts: ts === undefined ? Date.now() : ts }]) });
  }
  function removeReport(p, index) {
    return Object.assign({}, p, { reports: p.reports.filter(function (r, i) { return i !== index; }) });
  }

  var api = {
    STORAGE_KEY: KEY, LEGACY_STORAGE_KEY: LEGACY_KEY, VERSION: VERSION,
    emptyProgress: emptyProgress, validate: validate, migrateV1: migrateV1,
    loadProgress: loadProgress, saveProgress: saveProgress, importProgress: importProgress,
    isPageDone: isPageDone, lessonStats: lessonStats, isLessonDone: isLessonDone,
    syncLessons: syncLessons, markPage: markPage, setPosition: setPosition,
    addReport: addReport, removeReport: removeReport
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Logic = api;
})(typeof window !== 'undefined' ? window : globalThis);
