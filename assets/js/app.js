(function () {
  'use strict';

  const COLORS = [
    { bg: 'var(--accent-light)', fg: 'var(--accent)', border: 'var(--accent)' },
    { bg: 'var(--green-light)', fg: 'var(--green)', border: 'var(--green)' },
    { bg: 'var(--teal-light)', fg: 'var(--teal)', border: 'var(--teal)' },
    { bg: 'var(--indigo-light)', fg: 'var(--indigo)', border: 'var(--indigo)' },
    { bg: 'var(--purple-light)', fg: 'var(--purple)', border: 'var(--purple)' },
    { bg: 'var(--amber-light)', fg: 'var(--amber)', border: 'var(--amber)' },
  ];

  const GITLAB_BASE =
    document.body.dataset.gitlabBase ||
    'https://gitlab.example.com/your-group/frontend/-/commit/';

  let data = null;
  let selectedVersion = null;
  let searchQuery = '';
  let typeFilter = 'all';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  function formatGenerated(iso) {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { hour12: false });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function padNum(n) {
    return String(n).padStart(2, '0');
  }

  function commitLink(hash) {
    return `${GITLAB_BASE}${hash}`;
  }

  function renderCommitList(commits, limit) {
    if (!commits.length) return '<p class="empty-state">暂无提交</p>';
    const list = limit ? commits.slice(0, limit) : commits;
    const items = list
      .map(
        (c) => `
      <li>
        <span class="commit-type ${c.type}">${escapeHtml(c.label)}</span>
        <span class="commit-date">${escapeHtml(c.date)}</span>
        <a class="commit-hash" href="${commitLink(c.hash)}" target="_blank" rel="noopener">${escapeHtml(c.hash)}</a>
        <span class="commit-msg">${escapeHtml(c.message)}</span>
      </li>`,
      )
      .join('');
    const more =
      limit && commits.length > limit
        ? `<p style="font-size:13px;color:var(--text-secondary);margin-top:8px;">还有 ${commits.length - limit} 条提交未显示，请使用搜索筛选</p>`
        : '';
    return `<ul class="commit-list">${items}</ul>${more}`;
  }

  function filterCommits(commits) {
    return commits.filter((c) => {
      if (typeFilter === 'custom' && !['custom', 'docs-feature'].includes(c.type)) return false;
      if (typeFilter !== 'all' && typeFilter !== 'custom' && c.type !== typeFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.message.toLowerCase().includes(q) ||
        c.hash.toLowerCase().includes(q) ||
        c.date.includes(q)
      );
    });
  }

  function renderFeatureCard(feature, index, releaseId) {
    const color = COLORS[index % COLORS.length];
    const commits = filterCommits(feature.commits);
    if (!commits.length && (searchQuery || typeFilter !== 'all')) return '';

    return `
    <div class="feature" id="${releaseId}-feat-${index + 1}" style="border-left: 3px solid ${color.border};">
      <div class="feature-header">
        <div class="feature-icon" style="background: ${color.bg}; color: ${color.fg};">${padNum(index + 1)}</div>
        <div class="feature-header-text">
          <h3>${escapeHtml(feature.title)}</h3>
          <p class="desc">${commits.length} 个相关提交 · ${escapeHtml(feature.tag)}功能</p>
        </div>
      </div>
      <div class="feature-body">
        <div class="tag-row">
          <span class="tag tag-feat">FEATURE</span>
          <span class="badge badge-custom">${escapeHtml(feature.tag)} · feature-8.7.x-bankcomm</span>
        </div>
        <div class="detail-section">
          <h4 class="collapse-toggle">关联提交</h4>
          <div class="collapse-body" style="max-height: 2000px;">
            ${renderCommitList(commits)}
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderReleaseBlock(release, globalIndex) {
    const releaseId = `release-${globalIndex}`;
    const features = release.features || [];
    const fixes = filterCommits(release.fixes || []);
    const others = filterCommits(release.others || []);

    const featureCards = features
      .map((f, i) => renderFeatureCard(f, i, releaseId))
      .filter(Boolean)
      .join('');

    const hasContent =
      featureCards ||
      fixes.length ||
      others.length ||
      (!searchQuery && typeFilter === 'all');

    if (!hasContent) return '';

    let fixSection = '';
    if (fixes.length) {
      fixSection = `
      <div class="feature" id="${releaseId}-fixes" style="border-left: 3px solid var(--rose);">
        <div class="feature-header">
          <div class="feature-icon" style="background: var(--rose-light); color: var(--rose);">FX</div>
          <div class="feature-header-text">
            <h3>缺陷修复</h3>
            <p class="desc">本版本共 ${fixes.length} 个 fix 提交</p>
          </div>
        </div>
        <div class="feature-body">
          <div class="tag-row"><span class="tag tag-fix">FIX</span></div>
          ${renderCommitList(fixes, 30)}
        </div>
      </div>`;
    }

    return `
    <section class="release-block" data-version="${escapeHtml(release.version)}" id="${releaseId}">
      <h2 class="release-section-title">
        <span class="version-tag">${escapeHtml(release.version)}</span>
        <span style="font-size:14px;font-weight:400;color:var(--text-secondary);">${formatDate(release.date)}</span>
        <span style="font-size:13px;font-weight:400;color:var(--text-secondary);margin-left:auto;">
          定制 ${release.stats.custom} · 修复 ${release.stats.fix} · 共 ${release.stats.total} 提交
        </span>
      </h2>
      ${featureCards || '<p class="empty-state">本版本无定制功能提交</p>'}
      ${fixSection}
    </section>`;
  }

  function getVisibleReleases() {
    if (!data) return [];
    let list = [...data.releases].reverse();
    if (selectedVersion !== 'all') {
      list = list.filter((r) => r.version === selectedVersion);
    }
    return list;
  }

  function updateStats() {
    const releases = getVisibleReleases();
    const custom = releases.reduce((n, r) => n + r.stats.custom, 0);
    const fix = releases.reduce((n, r) => n + r.stats.fix, 0);
    const total = releases.reduce((n, r) => n + r.stats.total, 0);
    const features = releases.reduce((n, r) => n + (r.features?.length || 0), 0);

    $('#stat-releases').textContent = releases.length;
    $('#stat-custom').textContent = custom;
    $('#stat-fix').textContent = fix;
    $('#stat-total').textContent = total;
    $('#stat-features').textContent = features;
  }

  function renderToc() {
    const releases = getVisibleReleases();
    const items = [];
    releases.forEach((r, ri) => {
      (r.features || []).forEach((f, fi) => {
        const commits = filterCommits(f.commits);
        if (commits.length || (!searchQuery && typeFilter === 'all')) {
          items.push(
            `<li><a href="#release-${data.releases.indexOf(r)}-feat-${fi + 1}">${escapeHtml(f.title)}</a> <span class="badge badge-custom">定制</span></li>`,
          );
        }
      });
    });

    const toc = $('#toc-list');
    if (!items.length) {
      toc.innerHTML = '<li style="color:var(--text-secondary);">无匹配功能</li>';
      return;
    }
    toc.innerHTML = items.join('');
    bindSmoothScroll();
  }

  function renderContent() {
    const container = $('#release-content');
    const releases = getVisibleReleases();
    const blocks = releases
      .map((r) => {
        const idx = data.releases.indexOf(r);
        return renderReleaseBlock(r, idx);
      })
      .filter(Boolean);

    container.innerHTML =
      blocks.join('') ||
      '<div class="empty-state"><p>没有匹配的提交记录</p><p>尝试调整搜索词或筛选条件</p></div>';

    updateStats();
    renderToc();
    bindCollapse();
  }

  function shortVersion(v) {
    return v.replace(/^AI-Platform-/, '').replace(/^8\./, '8.');
  }

  function renderTimeline() {
    const timeline = $('#release-timeline');
    const versions = [...data.releases].reverse();

    const allBtn = `
      <button type="button" class="step-item step-item-all${selectedVersion === 'all' ? ' active' : ''}" data-version="all">
        <span class="step-icon">ALL</span>
        <div class="step-content">
          <div class="step-title">全部版本</div>
          <div class="step-desc">${data.releases.length} 个发版</div>
        </div>
      </button>`;

    const steps = versions.map((r, i) => {
      const isActive = selectedVersion === r.version;
      const activeIndex = versions.findIndex((v) => v.version === selectedVersion);
      const isDone = selectedVersion !== 'all' && activeIndex >= 0 && i > activeIndex;
      const cls = ['step-item', isActive ? 'active' : '', isDone ? 'done' : ''].filter(Boolean).join(' ');
      return `
      <button type="button" class="${cls}" data-version="${escapeHtml(r.version)}">
        <span class="step-icon">${i + 1}</span>
        <div class="step-content">
          <div class="step-title">${escapeHtml(shortVersion(r.version))}</div>
          <div class="step-desc">${escapeHtml(r.date)}</div>
          <div class="step-stats">
            <span class="step-stat">定制 ${r.stats.custom}</span>
            <span class="step-stat">修复 ${r.stats.fix}</span>
          </div>
        </div>
      </button>`;
    });

    timeline.innerHTML = allBtn + steps.join('');

    timeline.querySelectorAll('.step-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedVersion = btn.dataset.version;
        renderTimeline();
        renderContent();
        syncHash();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function renderPackages() {
    const tbody = $('#package-table tbody');
    const rows = Object.entries(data.resolutions || {}).map(([name, ver]) => {
      return `<tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 10px 12px;"><code>${escapeHtml(name)}</code></td>
        <td style="padding: 10px 12px;"><span class="commit-ref">${escapeHtml(ver)}</span></td>
        <td style="padding: 10px 12px;">—</td>
      </tr>`;
    });
    tbody.innerHTML = rows.join('');
  }

  function bindSmoothScroll() {
    $$('#toc-list a').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function bindCollapse() {
    $$('.collapse-toggle').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('collapsed');
        const body = toggle.nextElementSibling;
        body.classList.toggle('collapsed');
      });
    });
  }

  function syncHash() {
    const hash = selectedVersion === 'all' ? '' : `#${encodeURIComponent(selectedVersion)}`;
    history.replaceState(null, '', hash || location.pathname);
  }

  function readHash() {
    const h = location.hash.slice(1);
    if (h) selectedVersion = decodeURIComponent(h);
  }

  async function init() {
    try {
      const res = await fetch('data/releases.json');
      data = await res.json();
    } catch (e) {
      $('#release-content').innerHTML =
        '<div class="empty-state"><p>无法加载 data/releases.json</p><p>请先运行 <code>node scripts/generate-changelog.js</code></p></div>';
      return;
    }

    readHash();

    if (!selectedVersion) {
      selectedVersion =
        data.releases[data.releases.length - 1]?.version || 'all';
    }

    $('#hero-version').textContent = data.frontendVersion;
    $('#hero-branch').textContent = data.branch;
    $('#hero-updated').textContent = formatDate(
      data.releases[data.releases.length - 1]?.date || '',
    );
    $('#generated-at').textContent = formatGenerated(data.generatedAt);
    document.title = `云枢企业AI平台 · 交行定制版 ${data.frontendVersion} 发版说明`;

    renderTimeline();
    renderContent();
    renderPackages();

    $('#search-input').addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderContent();
    });

    $('#type-filter').addEventListener('change', (e) => {
      typeFilter = e.target.value;
      renderContent();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
