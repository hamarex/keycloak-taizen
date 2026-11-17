// テスト用: PLAN どおりの正しいダミー DATA を生成する(各テストで構造を壊して検証する)。
import { PLAN_BY_NO } from '../tools/validate-data.mjs';

const pad = (n) => String(n).padStart(2, '0');

export const validHtml = () =>
  '<p class="goal">やりたいこと: 用語 <code>a &lt; b</code> を確かめる。</p>' +
  '<div class="step"><h4>手順 1　実行する</h4><p>実行する。</p><pre>curl -s a.b/c?x=1&amp;y=2 | jq .</pre>' +
  '<div class="check"><b>確認</b><pre class="out">{ "a": 1 }</pre></div>' +
  '<div class="read"><b>読み方</b><p>値が出れば成功。<span class="trap">注意</span></p></div></div>' +
  '<div class="step"><h4>手順 2　調べる</h4><p>画面を開く。</p></div>' +
  '<div class="step"><h4>手順 3　読む</h4><pre>ls</pre>' +
  '<div class="check"><b>確認</b><pre class="out">a</pre></div>' +
  '<div class="read"><b>読み方</b><ul><li>a → <b class="key">b</b></li></ul></div></div>';

// pagesPerLesson: レッスンごとのページ数(省略時 2)
export function makeChapter(no, pagesPerLesson = 2) {
  const plan = PLAN_BY_NO.get(no);
  const cp = `c${pad(no)}`;
  const lessons = plan.lessons.map((title, li) => ({
    id: `${cp}-l${pad(li + 1)}`,
    title,
    pages: Array.from({ length: pagesPerLesson }, (_, pi) => ({
      id: `${cp}-l${pad(li + 1)}-p${pad(pi + 1)}`,
      title: `ページ${pi + 1}`,
      html: validHtml(),
      oxIds: [],
    })),
  }));
  return { no, title: plan.title, lessons, ox: [], mc: [] };
}

export function makeData(nos = [...PLAN_BY_NO.keys()]) {
  return { chapters: nos.map((n) => makeChapter(n)) };
}

// 章 no を data.js に書き出せる JS(DATA.chapters.push)として返す
export function chapterSource(no) {
  return `DATA.chapters.push(${JSON.stringify(makeChapter(no))});\n`;
}
