// BTC 周期雷达：按容器宽度重绘的 SVG 图表
(function () {
  const { $, esc, usd } = window.RADAR;
  const k = (v) => '$' + Math.round(v / 1000) + 'k';

  function tipOf(host) {
    let t = host.querySelector('.tip');
    if (!t) { t = document.createElement('div'); t.className = 'tip'; t.hidden = true; host.appendChild(t); }
    return t;
  }
  function placeTip(host, tip, x, y, html) {
    tip.innerHTML = html; tip.hidden = false;
    const w = host.clientWidth, tw = tip.offsetWidth;
    let left = x + 14; if (left + tw > w) left = x - 14 - tw; if (left < 0) left = 0;
    tip.style.left = left + 'px'; tip.style.top = Math.max(0, y - 12) + 'px';
  }

  // 9 月 vs 10 月情景：分组柱
  function drawCpi() {
    const host = $('#chart-cpi'), W = host.clientWidth, H = 240;
    const m = { l: 40, r: 8, t: 22, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const yMax = 0.7, Y = (v) => m.t + ih - v / yMax * ih;
    const band = iw / D.cpiChart.length, bw = Math.min(24, band / 3.2), gap = 2;
    let s = `<svg width="${W}" height="${H}" role="img" aria-label="9 月实际与 10 月三种情景的 CPI 环比">`;
    [0, 0.2, 0.4, 0.6].forEach((v) => {
      s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:${v ? 'var(--grid)' : 'var(--axis)'}"/>`;
      s += `<text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end" class="ct-lab">${v.toFixed(1)}%</text>`;
    });
    const bar = (x, v, col) => {
      const y = Y(v), h = Math.max(1, m.t + ih - y), r = Math.min(4, h);
      return `<path d="M${x},${m.t + ih} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${m.t + ih} Z" style="fill:var(${col})"/>`;
    };
    D.cpiChart.forEach((g, i) => {
      const cx = m.l + band * i + band / 2, x1 = cx - bw - gap / 2, x2 = cx + gap / 2;
      s += bar(x1, g.h, '--s1') + bar(x2, g.c, '--s2');
      s += `<text x="${x1 + bw / 2}" y="${Y(g.h) - 6}" text-anchor="middle" class="ct-val">${g.h.toFixed(2)}</text>`;
      s += `<text x="${x2 + bw / 2}" y="${Y(g.c) - 6}" text-anchor="middle" class="ct-val">${g.c.toFixed(2)}</text>`;
      s += `<text x="${cx}" y="${H - 8}" text-anchor="middle" class="ct-lab">${esc(g.g)}</text>`;
      s += `<rect x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}" fill="transparent" data-i="${i}" style="cursor:default"/>`;
    });
    host.innerHTML = s + '</svg>';
    const tip = tipOf(host);
    host.querySelectorAll('rect[data-i]').forEach((r) => {
      r.addEventListener('pointermove', (e) => {
        const g = D.cpiChart[r.dataset.i], b = host.getBoundingClientRect();
        placeTip(host, tip, e.clientX - b.left, e.clientY - b.top, `<div>${esc(g.g)}</div>Headline <b>${g.h.toFixed(2)}%</b><br>Core <b>${g.c.toFixed(2)}%</b>`);
      });
      r.addEventListener('pointerleave', () => { tip.hidden = true; });
    });
  }

  // 近两个月价格节点
  function drawPrice() {
    const host = $('#chart-price'), W = host.clientWidth, narrow = W < 600, H = narrow ? 300 : 360;
    const m = { l: 46, r: narrow ? 8 : 12, t: 30, b: 28 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const x0 = Date.parse('2026-08-01'), x1 = Date.parse('2026-10-16');
    const X = (d) => m.l + (Date.parse(d) - x0) / (x1 - x0) * iw;
    const yMin = 58000, yMax = 92000, Y = (v) => m.t + (yMax - v) / (yMax - yMin) * ih;
    let s = `<svg width="${W}" height="${H}" role="img" aria-label="2026 年 8 月至 10 月 BTC 关键节点价格">`;
    D.phases.forEach((p, i) => {
      const a = X(p[0]), b = Math.min(X(p[1]), W - m.r);
      if (i % 2 === 0) s += `<rect x="${a}" y="${m.t}" width="${b - a}" height="${ih}" style="fill:var(--band)"/>`;
      const lab = narrow || b - a < 60 ? p[2] : p[2] + ' ' + p[3];
      s += `<text x="${(a + b) / 2}" y="${m.t - 10}" text-anchor="middle" class="ct-lab">${esc(lab)}</text>`;
    });
    for (let v = 60000; v <= 90000; v += 5000) {
      s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--grid)"/>`;
      s += `<text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end" class="ct-lab">${k(v)}</text>`;
    }
    [['2026-08-01', '8/1'], ['2026-08-15', '8/15'], ['2026-09-01', '9/1'], ['2026-09-15', '9/15'], ['2026-10-01', '10/1'], ['2026-10-14', '10/14']]
      .forEach(([d, l]) => { s += `<text x="${X(d)}" y="${H - 8}" text-anchor="middle" class="ct-lab">${l}</text>`; });
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${m.t + ih}" y2="${m.t + ih}" style="stroke:var(--axis)"/>`;
    D.priceRefs.forEach(([v, l, c]) => {
      s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--${c});opacity:.75"/>`;
      if (!narrow || v !== 72169) s += `<text x="${W - m.r - 4}" y="${Y(v) - 5}" text-anchor="end" class="ct-lab">${esc(l)}</text>`;
    });
    const pts = D.price.map((p) => [X(p[0]), Y(p[1])]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    s += `<path d="${line}L${pts[pts.length - 1][0]},${m.t + ih}L${pts[0][0]},${m.t + ih}Z" style="fill:var(--s1);opacity:.1"/>`;
    s += `<path d="${line}" style="fill:none;stroke:var(--s1);stroke-width:2;stroke-linejoin:round;stroke-linecap:round"/>`;
    pts.forEach((p) => { s += `<circle cx="${p[0]}" cy="${p[1]}" r="4" style="fill:var(--s1);stroke:var(--panel);stroke-width:2"/>`; });
    const callout = (i, dy, anchor) => {
      const p = pts[i], d = D.price[i];
      s += `<text x="${p[0]}" y="${p[1] + dy}" text-anchor="${anchor}" class="ct-strong">${usd(d[1])}</text>`;
    };
    callout(3, 20, 'middle');
    callout(5, -12, 'middle');
    callout(pts.length - 1, -12, 'end');
    s += `<line id="px-cross" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" style="stroke:var(--axis)" visibility="hidden"/>`;
    s += `<rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent" id="px-hit"/>`;
    host.innerHTML = s + '</svg>';
    const tip = tipOf(host), hit = host.querySelector('#px-hit'), cross = host.querySelector('#px-cross');
    const move = (e) => {
      const b = host.getBoundingClientRect(), x = e.clientX - b.left;
      let best = 0; pts.forEach((p, i) => { if (Math.abs(p[0] - x) < Math.abs(pts[best][0] - x)) best = i; });
      const d = D.price[best], p = pts[best];
      cross.setAttribute('x1', p[0]); cross.setAttribute('x2', p[0]); cross.setAttribute('visibility', 'visible');
      placeTip(host, tip, p[0], p[1], `<div class="muted">${d[0]}</div><b>${usd(d[1])}</b> · ${esc(d[2])}<br>${esc(d[3])}`);
    };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); });
  }

  // 2027 情景推演
  function drawFc() {
    const host = $('#chart-fc'), W = host.clientWidth, narrow = W < 600, H = narrow ? 300 : 360;
    const m = { l: 50, r: narrow ? 74 : 150, t: 16, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const n = D.fcLabels.length, X = (i) => m.l + i / (n - 1) * iw;
    const yMin = 50000, yMax = 160000, Y = (v) => m.t + (yMax - v) / (yMax - yMin) * ih;
    let s = `<svg width="${W}" height="${H}" role="img" aria-label="2026 年四季度到 2027 年底三种情景的季末价格">`;
    for (let v = 60000; v <= 160000; v += 20000) {
      s += `<line x1="${m.l}" x2="${m.l + iw}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--grid)"/>`;
      s += `<text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end" class="ct-lab">${k(v)}</text>`;
    }
    s += `<line x1="${m.l}" x2="${m.l + iw}" y1="${Y(126000)}" y2="${Y(126000)}" style="stroke:var(--axis)"/>`;
    s += `<text x="${m.l + 4}" y="${Y(126000) - 5}" class="ct-lab">前高 $126k</text>`;
    D.fcLabels.forEach((l, i) => {
      if (narrow && i % 2 === 1 && i !== n - 1) return;
      s += `<text x="${X(i)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}" class="ct-lab">${esc(l)}</text>`;
    });
    D.scenarios.forEach((sc) => {
      const d = sc.v.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join('');
      s += `<path d="${d}" style="fill:none;stroke:var(--${sc.col});stroke-width:2;stroke-linejoin:round;stroke-linecap:round"/>`;
      sc.v.forEach((v, i) => { if (i) s += `<circle cx="${X(i)}" cy="${Y(v)}" r="4" style="fill:var(--${sc.col});stroke:var(--panel);stroke-width:2"/>`; });
      const ex = X(n - 1), ey = Y(sc.v[n - 1]);
      s += `<text x="${ex + 10}" y="${ey + 4}" class="ct-strong">${k(sc.v[n - 1])}</text>`;
      if (!narrow) s += `<text x="${ex + 52}" y="${ey + 4}" class="ct-lab">${esc(sc.n.split('：')[0])} ${Math.round(sc.p * 100)}%</text>`;
    });
    s += `<circle cx="${X(0)}" cy="${Y(82000)}" r="5" style="fill:var(--ink);stroke:var(--panel);stroke-width:2"/>`;
    s += `<line id="fc-cross" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" style="stroke:var(--axis)" visibility="hidden"/>`;
    s += `<rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent" id="fc-hit"/>`;
    host.innerHTML = s + '</svg>';
    const tip = tipOf(host), hit = host.querySelector('#fc-hit'), cross = host.querySelector('#fc-cross');
    const move = (e) => {
      const b = host.getBoundingClientRect(), x = e.clientX - b.left;
      const i = Math.max(0, Math.min(n - 1, Math.round((x - m.l) / iw * (n - 1))));
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('visibility', 'visible');
      const rows = D.scenarios.map((sc) => `<span style="display:inline-block;width:10px;height:3px;border-radius:2px;background:var(--${sc.col});vertical-align:middle;margin-right:6px"></span>${esc(sc.n.split('：')[0])} <b>${usd(sc.v[i])}</b>`).join('<br>');
      placeTip(host, tip, X(i), e.clientY - b.top, `<div class="muted">${esc(D.fcLabels[i])}</div>${rows}`);
    };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); });
  }

  function drawAll() { drawCpi(); drawPrice(); drawFc(); }
  drawAll();
  let lastW = 0, raf = 0;
  new ResizeObserver(() => {
    const w = document.querySelector('main').clientWidth;
    if (w === lastW) return; lastW = w;
    cancelAnimationFrame(raf); raf = requestAnimationFrame(drawAll);
  }).observe(document.querySelector('main'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
})();
