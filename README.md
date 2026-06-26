# 交行定制版 · 发版说明站点

从 [frontend](https://gitlab.authine.cn/cloudpivot/frontend) 仓库 `feature-8.7.x-bankcomm` 分支的 git 提交记录，自动梳理成交行定制版发版说明，交互与视觉风格对齐 [bankcomm.stoa.top](https://bankcomm.stoa.top/)。

## 功能

- **发版时间线**：按 `docs: 更新版本` 等版本标记切分提交区间，支持一键切换版本
- **功能目录**：`test: 交行定制/二开` 提交按功能聚合，展示关联 commit
- **修复列表**：`fix:` 提交单独归档
- **搜索 / 筛选**：按关键词、提交类型快速定位
- **定制包版本表**：读取 `package.json` 的 `resolutions`

## 本地预览

```bash
# 1. 生成 data/releases.json（默认读取 ../8.7.x/frontend）
node scripts/generate-changelog.js /path/to/frontend

# 2. 启动静态服务
npx serve . -p 4173
# 打开 http://localhost:4173
```

## 更新发版说明

每次 frontend 发版后：

```bash
node scripts/generate-changelog.js /Users/aofeizhu/gitlab/8.7.x/frontend
git add data/releases.json
git commit -m "docs: 更新发版说明"
git push
```

GitHub Actions 会自动部署到 GitHub Pages。

## 配置

| 文件 | 说明 |
|------|------|
| `scripts/generate-changelog.js` | 从 git log 生成 `data/releases.json` |
| `index.html` | 发版说明入口（左侧 Step 时间线） |
| `upgrade-guide.html` | 版本更新指南（本地） |
| `assets/js/app.js` | 时间线、搜索、渲染逻辑 |
| `assets/css/style.css` | 样式（基于 bankcomm.stoa.top） |

修改 GitLab commit 链接：编辑 `index.html` 中 `body` 的 `data-gitlab-base` 属性。

## GitHub Pages 部署

1. 推送本仓库到 GitHub
2. Settings → Pages → Source 选 **GitHub Actions**
3. 推送 `main` 分支后，`.github/workflows/pages.yml` 自动构建发布

也可手动在仓库根目录启用 Pages（Deploy from branch → `main` / root）。

## 版本切分规则

以下提交视为**新版本标记**，其后的非 docs/build 提交归入该版本：

- `docs: 更新版本`
- `docs: 发布版本` / `docs: 临时发布版本`
- `docs: 更新定制依赖包版本`
- `build: 主工程版本号`

## 相关链接

- [v1.1.0 功能需求说明（基线）](https://bankcomm.stoa.top/)
- Frontend 分支：`feature-8.7.x-bankcomm`
