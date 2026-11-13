// parts/*.js を順番に結合して app/data.js を生成する。
// 使い方: node tools/build-data.mjs [--allow-missing]
//   --allow-missing: 存在しない part をスキップする(作業途中の確認用)。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
export const APP_DIR = join(here, '..', 'app');
export const PART_FILES = [
  'data_head.js', 'data_part1.js', 'data_part2.js', 'data_part3.js', 'data_part4.js', 'data_part5.js',
];

// 結合文字列を返す。欠けている part は missing に列挙(allowMissing=false なら例外)。
export function buildDataSource(appDir = APP_DIR, { allowMissing = false } = {}) {
  const missing = [];
  const chunks = [];
  for (const name of PART_FILES) {
    const path = join(appDir, 'parts', name);
    if (!existsSync(path)) { missing.push(name); continue; }
    const text = readFileSync(path, 'utf8');
    chunks.push(text.endsWith('\n') ? text : text + '\n');
  }
  if (missing.length && !allowMissing) {
    throw new Error('parts が見つかりません: ' + missing.join(', '));
  }
  return { source: chunks.join(''), missing };
}

// 結合結果が文法的に正しく、window.DATA.chapters が配列になることを確認する。
export function checkSource(source) {
  // ブラウザ同様 window === グローバル(part 内の `DATA` 参照が解決される)
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'data.js' });
  const data = sandbox.DATA;
  if (!data || !Array.isArray(data.chapters)) throw new Error('window.DATA.chapters が配列ではありません');
  return data.chapters.length;
}

export function buildData(appDir = APP_DIR, opts = {}) {
  const { source, missing } = buildDataSource(appDir, opts);
  const chapterCount = checkSource(source);
  const out = join(appDir, 'data.js');
  writeFileSync(out, source, 'utf8');
  return { out, bytes: Buffer.byteLength(source, 'utf8'), chapterCount, missing };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const r = buildData(APP_DIR, { allowMissing: process.argv.includes('--allow-missing') });
    if (r.missing.length) console.warn('スキップした part: ' + r.missing.join(', '));
    console.log(`生成しました: ${r.out} (${r.bytes} bytes, ${r.chapterCount} 章)`);
  } catch (e) {
    console.error('build-data 失敗: ' + (e && e.message ? e.message : e));
    process.exit(1);
  }
}
