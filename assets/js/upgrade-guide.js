function copyCode(btn) {
  const pre = btn.closest('.code-block').querySelector('pre');
  const text = pre.textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '已复制';
    setTimeout(() => {
      btn.textContent = '复制';
    }, 1500);
  });
}

document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', () => copyCode(btn));
});

document.querySelectorAll('.section-nav a').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

async function renderReleaseLog() {
  const el = document.getElementById('release-log-placeholder');
  if (!el) return;
  try {
    const res = await fetch('data/releases.json');
    const data = await res.json();
    const latest = [...data.releases].reverse().slice(0, 5);
    el.innerHTML = latest
      .map(
        (r) => `
      <div class="guide-step release-record">
        <div class="guide-step-header">
          <div class="guide-step-num" style="background:var(--green);font-size:12px;">✓</div>
          <div class="guide-step-header-text">
            <h2>${r.date} · ${r.version}</h2>
            <p>定制 ${r.stats.custom} · 修复 ${r.stats.fix} · 共 ${r.stats.total} 提交</p>
          </div>
        </div>
        <div class="guide-step-body">
          <p style="font-size:14px;color:var(--text-secondary);">
            <a href="index.html#${encodeURIComponent(r.version)}">查看发版详情 →</a>
          </p>
        </div>
      </div>`,
      )
      .join('');
  } catch (_) {
    el.innerHTML = '<p class="empty-state">无法加载发布记录</p>';
  }
}

renderReleaseLog();
