/**
 * 从 Markdown 正文中解析信息差条目
 *
 * 共享给 SortedNews 和 CardPreviewSection 使用。
 */

export interface ParsedItem {
  title: string;
  brief: string;
}

/** 从正文中解析 "## 信息差列表" 下的条目 */
export function parseItemsFromBody(body: string): ParsedItem[] {
  const idx = body.indexOf('## 信息差列表');
  if (idx === -1) return [];

  const section = body.slice(idx);
  const endIdx = (() => {
    const m = section.match(/^## (?!信息差列表)/m);
    return m ? idx + m.index! : section.length;
  })();
  const block = body.slice(idx, endIdx);

  const items: ParsedItem[] = [];
  const lines = block.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const h3m = line.match(/^###\s+(.+)$/);
    if (h3m) {
      const title = h3m[1].trim();
      if (!title || title.includes('暂无符合')) { i++; continue; }

      let brief = '';
      for (let j = i + 1; j < lines.length; j++) {
        const nl = lines[j].trim();
        if (!nl) continue;
        if (nl.startsWith('###') || nl.startsWith('---') || nl.startsWith('## ')) break;
        if (nl.startsWith('>')) {
          brief = nl.replace(/^>\s*/, '');
          break;
        }
        brief = nl;
        break;
      }
      items.push({ title, brief });
    }
    i++;
  }

  return items;
}
