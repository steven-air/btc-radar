// BTC 周期雷达：表格、筛选、舆情模型
(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PILL = { good: ['▲', '利多'], bad: ['▼', '利空'], neu: ['●', '中性'], warn: ['◆', '待定'] };
  const pill = (s, label) => `<span class="pill ${s}">${PILL[s][0]} ${esc(label || PILL[s][1])}</span>`;
  const usd = (v) => '$' + Math.round(v).toLocaleString('en-US');
  window.RADAR = { $, esc, pill, usd };

  // CPI 分项
  $('#cpi-rows').innerHTML = D.cpiRows.map((r, i) =>
    `<tr${i === D.cpiRows.length - 1 ? ' style="font-weight:600"' : ''}><td>${esc(r[0])}</td><td class="num">${esc(r[1])}</td><td class="small"><b class="mono">${esc(r[2])}</b> · ${esc(r[3])}</td></tr>`).join('');

  // 指标面板
  const cats = [...new Set(D.indicators.map((x) => x.cat))];
  let indCat = '全部';
  function renderInd() {
    const list = D.indicators.filter((x) => indCat === '全部' || x.cat === indCat);
    let html = '', last = '';
    list.forEach((x) => {
      if (x.cat !== last) { html += `<tr class="cat-row"><td colspan="6">${esc(x.cat)}</td></tr>`; last = x.cat; }
      html += `<tr><td>${esc(x.n)}</td><td>${esc(x.v)}</td><td>${pill(x.s)}</td><td>${esc(x.up)}</td><td>${esc(x.dn)}</td><td>${esc(x.why)}</td></tr>`;
    });
    $('#ind-rows').innerHTML = html;
    const cnt = { bad: 0, neu: 0, good: 0, warn: 0 };
    list.forEach((x) => cnt[x.s]++);
    $('#ind-counts').innerHTML = ['bad', 'neu', 'good', 'warn'].map((k) => pill(k, `${PILL[k][1]} ${cnt[k]}`)).join('') +
      `<span class="small muted" style="align-self:center">共 ${list.length} 项</span>`;
  }
  function chips(host, items, get, set, after) {
    host.innerHTML = items.map((c) => `<button type="button" class="chip" aria-pressed="${c === get()}">${esc(c)}</button>`).join('');
    host.onclick = (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      set(b.textContent);
      host.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      after();
    };
  }
  chips($('#ind-chips'), ['全部', ...cats], () => indCat, (v) => { indCat = v; }, renderInd);
  renderInd();

  // 信号组合
  $('#sig-cards').innerHTML = D.signals.map((s) =>
    `<div class="panel sig"><div class="sig-top"><h3>${esc(s.n)}</h3>${pill(s.s, s.st)}</div>
     <ul>${s.c.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><p class="then">${esc(s.t)}</p></div>`).join('');

  // 舆情模型
  const scores = D.factors.map((f) => f[2]);
  const maxAbs = 0.24;
  function regime(v) {
    if (v <= -1) return ['bad', '强利空'];
    if (v <= -0.4) return ['bad', '偏空'];
    if (v < 0.4) return ['neu', '中性'];
    if (v < 1) return ['good', '偏多'];
    return ['good', '强利多'];
  }
  const fmt = (v, d = 2) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  $('#score-rows').innerHTML = D.factors.map((f, i) =>
    `<div class="srow"><div class="f">${esc(f[0])} · ${esc(f[3])}<small>${esc(f[4])}</small></div>
     <div class="w mono small muted">×${f[1].toFixed(2)}</div>
     <div class="r"><label class="small muted" for="sf${i}">打分 <b class="mono" id="sv${i}"></b></label><input id="sf${i}" type="range" min="-2" max="2" step="0.5" value="${f[2]}" data-i="${i}"></div>
     <div class="dbar" aria-hidden="true"><span id="sb${i}"></span></div>
     <div class="v mono small" id="sc${i}" style="text-align:right"></div></div>`).join('');
  function renderScore() {
    let total = 0; const byCat = {};
    D.factors.forEach((f, i) => {
      const c = f[1] * scores[i]; total += c;
      (byCat[f[0]] = byCat[f[0]] || [0, 0]); byCat[f[0]][0] += c; byCat[f[0]][1] += f[1];
      $('#sv' + i).textContent = fmt(scores[i], 1);
      $('#sc' + i).textContent = fmt(c, 3);
      const bar = $('#sb' + i), w = Math.abs(c) / maxAbs * 50;
      bar.style.width = w + '%';
      bar.style.left = c < 0 ? (50 - w) + '%' : '50%';
      bar.style.background = c < 0 ? 'var(--neg)' : 'var(--pos)';
    });
    $('#score-val').textContent = fmt(total);
    const r = regime(total);
    $('#score-regime').innerHTML = pill(r[0], r[1]);
    $('#score-cats').innerHTML = Object.entries(byCat).map(([k, v]) => `${esc(k)} <b class="mono">${fmt(v[0] / v[1])}</b>`).join(' · ');
  }
  $('#score-rows').addEventListener('input', (e) => {
    const i = e.target.dataset.i; if (i === undefined) return;
    scores[i] = +e.target.value; renderScore();
  });
  $('#score-reset').onclick = () => {
    D.factors.forEach((f, i) => { scores[i] = f[2]; $('#sf' + i).value = f[2]; });
    renderScore();
  };
  renderScore();

  // 做市商阶段表
  $('#phase-rows').innerHTML = D.phaseRows.map((r) =>
    `<tr><td style="white-space:nowrap"><b>${esc(r[0])}</b></td><td style="white-space:nowrap" class="small">${esc(r[1])}</td><td class="small">${esc(r[2])}</td><td class="small">${esc(r[3])}</td><td class="small">${esc(r[4])}</td></tr>`).join('');

  // 关键窗口剧本
  $('#plays').innerHTML = D.plays.map((p) =>
    `<div class="panel play"><div><div class="date">${esc(p.d)}</div><h3>${esc(p.n)}</h3></div>
     ${p.b.map((b) => `<div class="branch"><span class="if">${esc(b[0])}</span><span class="then">→ ${esc(b[1])}</span></div>`).join('')}</div>`).join('');

  // 关键价位
  const NOW = 82000;
  const TAG = { '压力': 'bad', '支撑': 'good', '现价': 'warn' };
  $('#levels').innerHTML = D.levels.map((l) => {
    const d = (l[0] - NOW) / NOW * 100;
    const dist = l[1] === '现价' ? '—' : (d > 0 ? '+' : '−') + Math.abs(d).toFixed(1) + '%';
    return `<div class="lv${l[1] === '现价' ? ' now' : ''}"><span class="p">${usd(l[0])}</span><span class="dist">${dist}</span>
      <span class="t"><span class="pill ${TAG[l[1]]} tag">${l[1] === '压力' ? '▼' : l[1] === '支撑' ? '▲' : '◆'} ${l[1]}</span>${esc(l[2])}</span></div>`;
  }).join('');

  // 时间轴
  const evCats = [...new Set(D.events.map((e) => e.cat))];
  let tlCat = '全部';
  function renderTl() {
    const list = D.events.filter((e) => tlCat === '全部' || e.cat === tlCat);
    const qs = [...new Set(list.map((e) => e.q))];
    $('#tl-list').innerHTML = qs.map((q) =>
      `<div class="tl-q"><h3>${esc(q)}</h3>${list.filter((e) => e.q === q).map((e) =>
        `<div class="ev"><div class="when">${esc(e.d)}</div><div class="body">
          <div class="t"><h4>${esc(e.n)}</h4>${pill(e.i, e.il)}<span class="cat">${esc(e.cat)}</span></div>
          ${e.p ? `<p>${esc(e.p)}</p>` : ''}<div class="watch"><b>看什么：</b>${esc(e.w)}</div></div></div>`).join('')}</div>`).join('') ||
      '<p class="muted">这个类别下没有事件。</p>';
  }
  chips($('#tl-chips'), ['全部', ...evCats], () => tlCat, (v) => { tlCat = v; }, renderTl);
  renderTl();

  // 情景表与卡片
  $('#fc-rows').innerHTML = D.scenarios.map((s) =>
    `<tr><td><span class="legend" style="margin:0;display:inline-flex"><span><i style="background:var(--${s.col})"></i>${esc(s.n)}</span></span></td>
     <td class="num">${Math.round(s.p * 100)}%</td>${s.v.slice(1).map((v) => `<td class="num">${usd(v)}</td>`).join('')}</tr>`).join('');
  const ev = D.scenarios.reduce((a, s) => a + s.p * s.v[5], 0);
  $('#fc-ev').textContent = usd(Math.round(ev / 100) * 100);
  $('#scn-cards').innerHTML = D.scenarios.map((s) =>
    `<div class="panel scn" style="--c:var(--${s.col})"><div class="eyebrow">${esc(s.n)}</div>
     <div class="prob">${Math.round(s.p * 100)}%</div><div class="small muted">2027 年底约 ${usd(s.v[5])}</div>
     <ul>${s.t.map((t) => `<li>${esc(t)}</li>`).join('')}</ul><p class="small" style="color:var(--ink)">${esc(s.tr)}</p></div>`).join('');

  // 来源
  $('#src-list').innerHTML = D.sources.map((s) => `<li><a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a></li>`).join('');
})();
