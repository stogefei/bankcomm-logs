#!/usr/bin/env node
/**
 * 从 frontend 仓库 git 提交记录生成交行定制版发版说明 JSON
 * 用法: node scripts/generate-changelog.js [frontend仓库路径]
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT =
  process.argv[2] ||
  process.env.FRONTEND_ROOT ||
  path.resolve(__dirname, '../../8.7.x/frontend');

const OUTPUT = path.resolve(__dirname, '../data/releases.json');

const VERSION_MARKERS =
  /docs:\s*(更新版本|发布版本|临时发布版本)|build:\s*主工程版本号|docs:\s*更新定制依赖包版本/;

function sh(cmd) {
  return execSync(cmd, { cwd: FRONTEND_ROOT, encoding: 'utf8' }).trim();
}

function getVersionAtCommit(hash) {
  try {
    const line = sh(`git show ${hash}:package.json 2>/dev/null | grep '"version"' | head -1`);
    const m = line.match(/"version":\s*"([^"]+)"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function classifyCommit(message) {
  if (/^test:\s*交行/.test(message)) return { type: 'custom', label: '定制' };
  if (/^fix:/.test(message)) return { type: 'fix', label: '修复' };
  if (/^docs:\s*(更新版本|发布版本|临时发布版本|更新定制依赖包版本)/.test(message))
    return { type: 'docs', label: '文档' };
  if (/^docs:/.test(message)) return { type: 'docs-feature', label: '说明' };
  if (/^refactor:/.test(message)) return { type: 'refactor', label: '重构' };
  if (/^build:/.test(message)) return { type: 'build', label: '构建' };
  if (/^feat:/.test(message)) return { type: 'feature', label: '功能' };
  return { type: 'other', label: '其他' };
}

function featureTitle(message) {
  const m = message
    .replace(/^test:\s*交行(定制|二开)[-：:]?\s*/i, '')
    .replace(/^docs:\s*/i, '')
    .replace(/^fix:\s*#\d+\s*/, '')
    .replace(/\s*https?:\/\/\S+/g, '')
    .trim();
  return m.slice(0, 80) + (m.length > 80 ? '…' : '');
}

function groupFeatures(commits) {
  const custom = commits.filter((c) => c.type === 'custom' || c.type === 'docs-feature');
  const fixes = commits.filter((c) => c.type === 'fix');
  const others = commits.filter(
    (c) => !['custom', 'fix', 'docs', 'build', 'docs-feature'].includes(c.type),
  );

  const featureMap = new Map();
  custom.forEach((c) => {
    const title = featureTitle(c.message);
    const key = title.slice(0, 36);
    if (!featureMap.has(key)) {
      featureMap.set(key, {
        id: `f-${featureMap.size + 1}`,
        title,
        type: 'custom',
        tag: '定制',
        commits: [],
      });
    }
    featureMap.get(key).commits.push(c);
  });

  return {
    features: Array.from(featureMap.values()),
    fixes,
    others,
  };
}

function main() {
  const raw = sh(
    `git log --format='%H|%h|%ad|%s' --date=short --no-merges -500`,
  );
  const all = raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [full, hash, date, ...rest] = line.split('|');
      const message = rest.join('|');
      const { type, label } = classifyCommit(message);
      return { full, hash, date, message, type, label };
    })
    .filter((c) => !c.message.startsWith('Merge '));

  const releases = [];
  let current = null;

  all.forEach((commit) => {
    if (VERSION_MARKERS.test(commit.message) || commit.message.includes('定制依赖包版本')) {
      if (current && current.commits.length) {
        releases.push(current);
      }
      const version = getVersionAtCommit(commit.full) || commit.message;
      current = {
        version,
        date: commit.date,
        markerCommit: commit.hash,
        markerMessage: commit.message,
        commits: [],
      };
      return;
    }
    if (!current) {
      current = {
        version: '历史累积',
        date: commit.date,
        markerCommit: null,
        markerMessage: '首个版本标记之前的提交',
        commits: [],
      };
    }
    const isVersionDoc = VERSION_MARKERS.test(commit.message);
    const isBuildVersion = commit.type === 'build';
    if (!isVersionDoc && !isBuildVersion) {
      current.commits.push(commit);
    }
  });
  if (current && current.commits.length) releases.push(current);

  // 按日期倒序
  releases.reverse();

  // 合并同版本号的多段发版区间
  const merged = [];
  releases.forEach((r) => {
    const last = merged[merged.length - 1];
    if (last && last.version === r.version) {
      last.commits.push(...r.commits);
      if (r.date > last.date) last.date = r.date;
      if (r.markerCommit) last.markerCommit = r.markerCommit;
    } else {
      merged.push({ ...r, commits: [...r.commits] });
    }
  });

  function dedupeCommits(list) {
    const seen = new Set();
    return list.filter((c) => {
      const key = `${c.hash}|${c.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  merged.forEach((r) => {
    r.commits = dedupeCommits(r.commits);
    const grouped = groupFeatures(r.commits);
    r.stats = {
      total: r.commits.length,
      custom: r.commits.filter((c) => c.type === 'custom' || c.type === 'docs-feature').length,
      fix: r.commits.filter((c) => c.type === 'fix').length,
    };
    r.features = grouped.features;
    r.fixes = grouped.fixes;
    r.others = grouped.others;
    delete r.commits;
  });

  const releasesOut = merged;

  let pkg = {};
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(FRONTEND_ROOT, 'package.json'), 'utf8'));
  } catch (_) {}

  const output = {
    generatedAt: new Date().toISOString(),
    frontendVersion: pkg.version || '',
    branch: sh('git branch --show-current 2>/dev/null || echo unknown'),
    resolutions: pkg.resolutions || {},
    releases: releasesOut,
    summary: {
      releaseCount: releasesOut.length,
      totalCommits: releasesOut.reduce((n, r) => n + r.stats.total, 0),
      totalCustom: releasesOut.reduce((n, r) => n + r.stats.custom, 0),
      totalFix: releasesOut.reduce((n, r) => n + r.stats.fix, 0),
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Generated ${releasesOut.length} releases -> ${OUTPUT}`);
}

main();
