import { parseItemsFromBody } from '@/lib/parse-items';

const C = {
  bg: '#FFFBF7', accent: '#E0462C', accentLight: '#FDE8E3',
  title: '#1A1A1A', body: '#4A4A4A', muted: '#9CA3AF',
  border: '#F0E8E0', tagBg: '#FFF0EC', tagText: '#D4402C',
};

// ─── 纯 HTML 卡片（服务端渲染，零 hydration 风险） ─────────────────────

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cardHtml(
  index: number, total: number,
  title: string, brief: string,
  date: string, topic: string, reportTitle: string
): string {
  return `
<div class="card-item" data-title="${esc(title)}" data-brief="${esc(brief)}" data-date="${esc(date)}" data-topic="${esc(topic)}" data-report="${esc(reportTitle)}" data-index="${index}" data-total="${total}"
  style="position:relative;width:100%;max-width:520px;padding-bottom:125%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);background:${C.bg};font-family:'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif;">
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;">
    <div style="height:5px;background:${C.accent};flex-shrink:0"></div>
    <div style="flex:1;display:flex;flex-direction:column;padding:36px 36px 20px;min-height:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span style="font-size:13px;color:${C.muted}">${esc(date)}</span>
        <span style="font-size:11px;color:${C.tagText};background:${C.tagBg};padding:3px 10px;border-radius:4px;font-weight:500">${esc(topic)}</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:16px">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;background:${C.accent};color:#fff;font-size:14px;font-weight:700;flex-shrink:0">${index}</span>
        <span style="font-size:12px;color:${C.muted}">/ ${total}</span>
        <span style="font-size:14px;font-weight:600;color:${C.accent};margin-left:auto">${esc(reportTitle)}</span>
      </div>
      <div style="font-size:20px;font-weight:700;color:${C.title};line-height:1.5;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(title)}</div>
      <div style="flex:1;font-size:14px;color:${C.body};line-height:1.65;overflow:hidden;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical">${esc(brief)}</div>
    </div>
    <button onclick="downloadCard(this)" data-card-dl=""
      style="margin:0 36px 20px;padding:10px 0;border:none;border-radius:8px;background:${C.accent};color:#fff;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0">
      下载 PNG
    </button>
  </div>
</div>`;
}

// ─── 封面卡片（含今日重点标题） ────────────────────────────────────────

function coverHtml(
  date: string, topic: string, reportTitle: string,
  itemCount: number, topItems: { title: string }[]
): string {
  const itemsJson = encodeURIComponent(JSON.stringify(topItems.map(i => i.title)));
  const headlines = topItems.map((item, i) =>
    `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
      <span style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:${C.accent};color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:0">${i + 1}</span>
      <span style="font-size:16px;color:${C.body};line-height:1.5;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;font-weight:500">${esc(item.title)}</span>
    </div>`
  ).join('');

  return `
<div class="card-item" data-cover="true" data-date="${esc(date)}" data-topic="${esc(topic)}" data-report="${esc(reportTitle)}" data-count="${itemCount}" data-headlines="${itemsJson}"
  style="position:relative;width:100%;max-width:520px;padding-bottom:125%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);background:${C.bg};font-family:'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif;">
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;">
    <div style="height:5px;background:${C.accent};flex-shrink:0"></div>
    <div style="flex:1;display:flex;flex-direction:column;padding:32px 36px 16px;position:relative;overflow:hidden">
      <span style="font-size:13px;color:${C.muted};text-align:left;margin-bottom:20px;z-index:1">每日信息差</span>
      <div style="text-align:center;margin-bottom:20px;margin-top:8px;z-index:1">
        <span style="font-size:14px;font-weight:600;color:${C.tagText};background:${C.tagBg};padding:6px 20px;border-radius:6px">${esc(topic)}</span>
      </div>
      <div style="font-size:30px;font-weight:800;color:${C.title};text-align:center;margin-bottom:10px;z-index:1">A股消息速递</div>
      <div style="font-size:16px;color:${C.accent};text-align:center;margin-bottom:18px;z-index:1">${esc(date)}</div>
      <div style="height:1px;background:${C.border};margin-bottom:16px;z-index:1"></div>
      <div style="z-index:1;overflow-y:auto;flex:1">${headlines}</div>
      <div style="text-align:center;font-size:13px;color:${C.muted};padding-top:12px;z-index:1;flex-shrink:0">共 ${itemCount} 条精选信息</div>
    </div>
    <button onclick="downloadCard(this)" data-card-dl=""
      style="margin:0 36px 20px;padding:10px 0;border:none;border-radius:8px;background:${C.accent};color:#fff;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0">
      下载封面 PNG
    </button>
  </div>
</div>`;
}

// ─── 下载脚本（原生 JS，不依赖 React hydration） ────────────────────────

const downloadScript = `
<script>
(function(){
  if (window.__cardDlReady) return;
  window.__cardDlReady = true;

  window.downloadCard = function(btn) {
    var card = btn.closest('.card-item');
    if (!card) return;

    var W = 1080, H = 1350, scale = 2;
    var canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    var isCover = card.getAttribute('data-cover') === 'true';
    var title = card.getAttribute('data-title') || '';
    var brief = card.getAttribute('data-brief') || '';
    var date = card.getAttribute('data-date') || '';
    var topic = card.getAttribute('data-topic') || '';
    var report = card.getAttribute('data-report') || '';
    var index = parseInt(card.getAttribute('data-index')) || 0;
    var total = parseInt(card.getAttribute('data-total')) || 0;
    var count = parseInt(card.getAttribute('data-count')) || 0;

    var C2 = { bg:'#FFFBF7', accent:'#E0462C', accentLight:'#FDE8E3', title:'#1A1A1A', body:'#4A4A4A', muted:'#7A8290', border:'#F0E8E0', tagBg:'#FFF0EC', tagText:'#D4402C' };
    var px = 72, cx = px + 28, cw = W - cx - px;

    function rd(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
    function wl(text,x,y,mw,lh,ml,fs,c){
      ctx.font = fs + ' "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
      ctx.fillStyle = c;
      var lines=[],cur='';
      for(var i=0;i<text.length;i++){
        if(ctx.measureText(cur+text[i]).width>mw&&cur.length>0){lines.push(cur);cur=text[i];}
        else cur+=text[i];
      }
      if(cur)lines.push(cur);
      var dl=lines.slice(0,ml);
      for(var j=0;j<dl.length;j++)ctx.fillText(dl[j],x,y+j*lh);
      return dl.length;
    }

    // bg
    ctx.fillStyle=C2.bg;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=C2.accent;ctx.fillRect(0,0,W,8);
    
    ctx.fillStyle=C2.accentLight;ctx.beginPath();ctx.arc(W-80,120,160,0,Math.PI*2);ctx.fill();

    // header
    ctx.font='28px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
    ctx.fillStyle=C2.muted;ctx.textAlign='left';ctx.fillText(date,cx,88);
    ctx.font='24px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
    var tw=ctx.measureText(topic).width,tx=W-px-tw-32,ty=64;
    rd(ctx,tx,ty,tw+32,42,8);ctx.fillStyle=C2.tagBg;ctx.fill();
    ctx.fillStyle=C2.tagText;ctx.textAlign='center';
    ctx.fillText(topic,tx+tw/2+16,ty+32);

    ctx.textAlign='left';
    ctx.font='600 36px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
    ctx.fillStyle=C2.accent;ctx.fillText(report,cx,148);
    ctx.strokeStyle=C2.border;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx,176);ctx.lineTo(cx+cw,176);ctx.stroke();

    if (isCover) {
      // 左上角品牌标识
      ctx.font='22px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
      ctx.fillStyle=C2.muted;ctx.textAlign='left';
      ctx.fillText('每日信息差',cx,56);

      var cyy=230;
      // topic badge
      ctx.font='28px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
      var lw=ctx.measureText(topic).width;
      rd(ctx,W/2-lw/2-28,cyy-32,lw+56,44,10);
      ctx.fillStyle=C2.tagBg;ctx.fill();
      ctx.fillStyle=C2.tagText;ctx.textAlign='center';
      ctx.fillText(topic,W/2,cyy+2);
      // main title: always "A股消息速递" on cover
      ctx.font='bold 52px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
      ctx.fillStyle=C2.title;ctx.textAlign='center';
      ctx.fillText('A股消息速递',W/2,cyy+80);
      // date
      ctx.font='28px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
      ctx.fillStyle=C2.accent;ctx.fillText(date,W/2,cyy+130);
      // divider
      ctx.strokeStyle=C2.border;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(cx+40,cyy+160);ctx.lineTo(W-cx-40,cyy+160);ctx.stroke();

      // all headlines on cover
      var hlRaw=card.getAttribute('data-headlines')||'[]';
      var headlines=[];
      try{headlines=JSON.parse(decodeURIComponent(hlRaw));}catch(e){}
      var hlY=cyy+205,lineH=42;
      ctx.font='24px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
      ctx.fillStyle=C2.body;
      var maxVisible=Math.floor((H-hlY-60)/lineH);
      var showCount=Math.min(headlines.length,maxVisible);
      for(var h=0;h<showCount;h++){
        ctx.textAlign='left';
        var hlX=cx+20;
        ctx.fillText((h+1)+'.',hlX,hlY+h*lineH);
        var txt=headlines[h];
        var maxW=(W-cx*2-20)-80;
        while(ctx.measureText(txt).width>maxW&&txt.length>3)txt=txt.slice(0,-1);
        if(txt.length<headlines[h].length)txt+='..';
        ctx.fillText(txt,hlX+48,hlY+h*lineH);
      }
      ctx.textAlign='center';
      ctx.font='22px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
      ctx.fillStyle=C2.muted;
      var footY=hlY+Math.min(showCount,headlines.length)*lineH+40;
      ctx.fillText('共 '+count+' 条精选信息',W/2,footY);
    } else {
      // 序号徽章 — 红色圆角方块 + 白色数字
      var bs=64, bxx=cx, byy=216;
      ctx.beginPath();
      ctx.moveTo(bxx+14,byy);ctx.lineTo(bxx+bs-14,byy);
      ctx.quadraticCurveTo(bxx+bs,byy,bxx+bs,byy+14);
      ctx.lineTo(bxx+bs,byy+bs-14);
      ctx.quadraticCurveTo(bxx+bs,byy+bs,bxx+bs-14,byy+bs);
      ctx.lineTo(bxx+14,byy+bs);
      ctx.quadraticCurveTo(bxx,byy+bs,bxx,byy+bs-14);
      ctx.lineTo(bxx,byy+14);
      ctx.quadraticCurveTo(bxx,byy,bxx+14,byy);
      ctx.closePath();
      ctx.fillStyle=C2.accent;ctx.fill();
      ctx.font='bold 32px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
      ctx.fillStyle='#fff';ctx.textAlign='center';
      ctx.fillText(String(index),bxx+bs/2,byy+bs/2+12);
      ctx.textAlign='left';
      ctx.font='22px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
      ctx.fillStyle=C2.title;ctx.fillText('/ '+total,bxx+bs+18,byy+bs/2+8);

      var ty3=byy+bs+60;
      var tln=wl(title,cx,ty3,cw,60,3,'bold 46px',C2.title);
      var brY=ty3+tln*60+48;
      wl(brief,cx,brY,cw,50,13,'32px',C2.body);

      var py=H-100,bh=4,bg=6,bw=(cw-bg*(total-1))/total;
      for(var i2=0;i2<total;i2++){
        ctx.fillStyle=i2<index?C2.accent:C2.border;
        rd(ctx,cx+i2*(bw+bg),py,bw,bh,2);ctx.fill();
      }
      ctx.strokeStyle=C2.border;ctx.beginPath();ctx.moveTo(cx,py+32);ctx.lineTo(cx+cw,py+32);ctx.stroke();
      ctx.font='22px "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
      ctx.fillStyle=C2.muted;ctx.textAlign='left';
      ctx.fillText(date+'  |  '+topic,cx,py+64);
      ctx.textAlign='right';ctx.fillText(index+' / '+total,cx+cw,py+64);
    }

    var a=document.createElement('a');
    a.download=isCover?'cover.png':('card-'+String(index).padStart(2,'0')+'.png');
    a.href=canvas.toDataURL('image/png');
    a.click();
  };

  var bb=document.getElementById('batch-dl-btn');
  if(bb){bb.onclick=function(){var bs=document.querySelectorAll('[data-card-dl]');bs.forEach(function(b,i){setTimeout(function(){b.click()},i*300)});}};
})();
</script>`;

// ─── 组件 ──────────────────────────────────────────────────────────────

interface Props { body: string; title: string; date: string; topic: string; }

export default function CardPreviewSection({ body, title, date, topic }: Props) {
  const items = parseItemsFromBody(body);
  if (items.length === 0) return null;

  const topicLabel = topic || '今日热点';
  const reportTitle = title.replace('每日信息差 - ', '').replace('每日信息差', '每日信息差');
  const topTitles = items;

  const cardsHtml = [
    coverHtml(date, topicLabel, reportTitle, items.length, topTitles),
    ...items.map((item, i) =>
      cardHtml(i + 1, items.length, item.title, item.brief, date, topicLabel, reportTitle)
    ),
  ].join('');

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          卡片预览
          <span className="ml-2 text-sm font-normal text-slate-400">{items.length + 1} 张</span>
        </h2>
        <button id="batch-dl-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
          批量下载
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        dangerouslySetInnerHTML={{ __html: cardsHtml }} />
      <div dangerouslySetInnerHTML={{ __html: downloadScript }} />
    </section>
  );
}
