// テスト用: §5 の計画どおりの正しいダミー DATA を生成する(各テストで構造を壊して検証する)。
import { PLAN_BY_NO } from '../tools/validate-data.mjs';

const pad = (n) => String(n).padStart(2, '0');

export function makeChapter(no) {
  const plan = PLAN_BY_NO.get(no);
  const cp = `c${pad(no)}`;
  const lessons = plan.pages.map((n, li) => ({
    id: `${cp}-l${pad(li + 1)}`,
    title: `レッスン${li + 1}`,
    pages: Array.from({ length: n }, (_, pi) => ({
      id: `${cp}-l${pad(li + 1)}-p${pad(pi + 1)}`,
      title: `ページ${pi + 1}`,
      html: '<h4>見出し</h4><ul><li><b class="key">用語</b> と <code>a &lt; b</code></li></ul>',
      oxIds: [],
    })),
  }));
  const allPages = lessons.flatMap((l) => l.pages.map((p) => ({ lesson: l.id, page: p })));
  const ox = Array.from({ length: plan.ox }, (_, i) => {
    const target = allPages[i % allPages.length];
    const id = `${cp}-ox-${pad(i + 1)}`;
    target.page.oxIds.push(id);
    return { id, text: `問題${i + 1}`, answer: i % 2 === 0, explain: '理由', lesson: target.lesson };
  });
  // oxIds は問題の出題順になるよう lesson ごとの連続性は問わない(検証は所属のみ)
  const mc = Array.from({ length: plan.mc }, (_, i) => {
    const combo = i % 2 === 0;
    const base = { id: `${cp}-mc-${pad(i + 1)}`, answer: (i % 5) + 1, tip: 'コツ' };
    return combo
      ? { ...base, stem: '【組合せ型】正しい組合せはどれか。', items: ['A', 'B', 'C', 'D'].map((label) => ({ label, text: `項目${label}` })), choices: ['A・B', 'A・C', 'B・C', 'B・D', 'C・D'], explain: ['A：○ r', 'B：× r', 'C：○ r', 'D：× r'] }
      : { ...base, stem: '【正誤選択型】正しいものはどれか。', items: [], choices: ['a < b', 'b', 'c', 'd', 'e'], explain: ['1：× r', '2：× r', '3：○ r', '4：× r', '5：× r'] };
  });
  return { no, title: plan.title, lessons, ox, mc };
}

export function makeData(nos = [...PLAN_BY_NO.keys()]) {
  return { chapters: nos.map(makeChapter) };
}
