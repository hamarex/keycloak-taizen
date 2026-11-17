// src-parts/data_head.js + src-parts/ch01.js〜ch17.js(ファイル名昇順)を連結して docs/data.js を生成する。
// 使い方: node tools/build-data.mjs [--allow-missing]
//   --allow-missing: 欠けている章ファイルをスキップする(作業途中の確認用)。
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
export const SRC_DIR = join(here, '..', 'src-parts');
export const OUT_FILE = join(here, '..', 'docs', 'data.js');
export const HEAD_FILE = 'data_head.js';
export const CHAPTER_COUNT = 17;
export const CHAPTER_FILES = Array.from({ length: CHAPTER_COUNT }, (_, i) => `ch${String(i + 1).padStart(2, '0')}.js`);
const CHAPTER_RE = /^ch\d{2}\.js$/;

// 結合文字列を返す。欠けているファイルは missing に列挙(allowMissing=false なら例外)。
export function buildDataSource(partsDir = SRC_DIR, { allowMissing = false } = {}) {
  const missing = [];
  const chunks = [];
  const headPath = join(partsDir, HEAD_FILE);
  if (!existsSync(headPath)) throw new Error(`${HEAD_FILE} が見つかりません`);
  chunks.push(readWithNewline(headPath));

  const present = existsSync(partsDir) ? readdirSync(partsDir).filter((f) => CHAPTER_RE.test(f)).sort() : [];
  for (const name of CHAPTER_FILES) if (!present.includes(name)) missing.push(name);
  if (missing.length && !allowMissing) {
    throw new Error('欠けている章ファイル: ' + missing.join(', '));
  }
  for (const name of present) chunks.push(readWithNewline(join(partsDir, name)));
  return { source: chunks.join(''), missing };
}

function readWithNewline(path) {
  const text = readFileSync(path, 'utf8');
  return text.endsWith('\n') ? text : text + '\n';
}

// 結合結果が文法的に正しく、window.DATA.chapters が配列になることを確認する。
export function checkSource(source) {
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'data.js' });
  const data = sandbox.DATA;
  if (!data || !Array.isArray(data.chapters)) throw new Error('window.DATA.chapters が配列ではありません');
  return data.chapters.length;
}

export function buildData(partsDir = SRC_DIR, opts = {}) {
  const { source, missing } = buildDataSource(partsDir, opts);
  const chapterCount = checkSource(source);
  const out = opts.outFile || OUT_FILE;
  writeFileSync(out, source, 'utf8');
  return { out, bytes: Buffer.byteLength(source, 'utf8'), chapterCount, missing };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const r = buildData(SRC_DIR, { allowMissing: process.argv.includes('--allow-missing') });
    if (r.missing.length) console.warn('スキップした章ファイル: ' + r.missing.join(', '));
    console.log(`生成しました: ${r.out} (${r.bytes} bytes, ${r.chapterCount} 章)`);
  } catch (e) {
    console.error('build-data 失敗: ' + (e && e.message ? e.message : e));
    process.exit(1);
  }
}
