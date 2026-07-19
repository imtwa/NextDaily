/**
 * 可复制文案区
 *
 * 取报告中的信息差条目，格式化为抖音发布文案，带话题标签。
 * 复制按钮使用原生 JS onclick，不依赖 React 事件注水。
 */

import { useMemo } from 'react';
import { parseItemsFromBody } from '@/lib/parse-items';

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

/** 根据主题生成话题标签 */
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

export default function CopyTextSection({ body, date, topic }: Props) {
  const items = useMemo(() => parseItemsFromBody(body), [body]);
  if (items.length === 0) return null;

  // 拼接文案
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
  const tags = getTags(topic);
  lines.push(tags.map(t => `#${t}`).join('  '));
  const copyText = lines.join('\n').trim();

  // 转义后嵌入 JS 字符串模板中
  const escapedText = copyText.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

  // 随机 id，避免同一页面多份报告时冲突
  const btnId = 'copy-btn-' + Math.random().toString(36).slice(2, 8);

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
          id={btnId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
          </svg>
          一键复制
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-5">
        <pre className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
          {copyText}
        </pre>
      </div>

      {/* 原生 JS 复制：通过 dangerouslySetInnerHTML 注入 script，浏览器解析即执行，不依赖 React hydration */}
      <script dangerouslySetInnerHTML={{ __html: `
(function() {
  var btn = document.getElementById('${btnId}');
  if (!btn) return;
  var text = \`${escapedText}\`;
  var origHtml = btn.innerHTML;
  var origCls = btn.className;
  var okHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>已复制';
  var okCls = origCls.replace(/bg-slate-\\d+/g, 'bg-green-500').replace(/text-slate-\\d+/g, 'text-white').replace(/dark:bg-slate-\\d+/g, 'dark:bg-green-600').replace(/dark:text-slate-\\d+/g, 'dark:text-white');

  btn.onclick = function() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        btn.innerHTML = okHtml;
        btn.className = okCls;
        setTimeout(function() { btn.innerHTML = origHtml; btn.className = origCls; }, 2000);
      }).catch(fallback);
    } else {
      fallback();
    }

    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.innerHTML = okHtml;
      btn.className = okCls;
      setTimeout(function() { btn.innerHTML = origHtml; btn.className = origCls; }, 2000);
    }
  };
})();
      ` }} />
    </section>
  );
}
