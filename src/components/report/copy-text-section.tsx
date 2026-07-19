'use client';

/**
 * 可复制文案区
 *
 * 取前 10 条信息差格式化为适合抖音发布的纯文本，带话题标签，支持一键复制。
 */

import { useState, useCallback, useMemo } from 'react';
import { parseItemsFromBody } from '@/lib/parse-items';
import { Copy, Check } from 'lucide-react';

interface Props {
  body: string;
  date: string;
  topic: string;
}

function fmtDate(d: string): string {
  const p = d.split('-');
  if (p.length < 3) return d;
  return `${parseInt(p[1])}月${parseInt(p[2])}日`;
}

/** 根据主题生成标签 */
function getTags(topic: string): string[] {
  const tags = ['每日信息差', '今日热点'];
  if (!topic) { tags.push("A股", "财经"); return tags; }
  const t = topic.toLowerCase();
  if (t.includes('股') || t.includes('a股')) tags.push('A股', '财经新闻');
  else if (t.includes('科技') || t.includes('ai')) tags.push('科技', 'AI');
  else if (t.includes('新能源') || t.includes('汽车')) tags.push('新能源', '产业');
  else tags.push('A股消息');
  return tags;
}

function buildCopyText(
  items: { title: string; brief: string }[],
  date: string,
  topic: string
): string {
  const top = items;
  const header = topic
    ? `今日信息差 | ${topic} | ${fmtDate(date)}`
    : `今日信息差 | ${fmtDate(date)}`;

  const lines = [header, ''];

  top.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.title}`);
    if (item.brief) lines.push(`   ${item.brief}`);
    lines.push('');
  });

  // 话题标签
  const tags = getTags(topic);
  lines.push(tags.map(t => `#${t}`).join('  '));

  return lines.join('\n').trim();
}

export default function CopyTextSection({ body, date, topic }: Props) {
  const items = useMemo(() => parseItemsFromBody(body), [body]);
  const [copied, setCopied] = useState(false);

  const copyText = useMemo(
    () => buildCopyText(items, date, topic),
    [items, date, topic]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = copyText;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copyText]);

  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          发布文案
          <span className="ml-2 text-sm font-normal text-slate-400">
            {items.length} 条
          </span>
        </h2>
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {copied ? (
            <><Check className="w-3.5 h-3.5" />已复制</>
          ) : (
            <><Copy className="w-3.5 h-3.5" />一键复制</>
          )}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-5">
        <pre className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
          {copyText}
        </pre>
      </div>
    </section>
  );
}
