# 定制版 · 发版说明站点

从 [frontend](https://gitlab.authine.cn/cloudpivot/frontend) 仓库 `feature-8.7.x-bankcomm` 分支的 git 提交记录，自动梳理成定制版发版说明，交互与视觉风格对齐 [bankcomm.stoa.top](https://bankcomm.stoa.top/)。

## 功能

- **发版时间线**：按 `docs: 更新版本` 等版本标记切分提交区间，支持一键切换版本
- **功能目录**：`test: 定制/二开` 提交按功能聚合，展示关联 commit
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

推送后 GitHub Pages 会自动更新（见下方部署说明）。

## 配置

| 文件 | 说明 |
|------|------|
| `scripts/generate-changelog.js` | 从 git log 生成 `data/releases.json` |
| `index.html` | 发版说明入口（左侧 Step 时间线） |
| `upgrade-guide.html` | 版本更新指南（本地） |
| `assets/js/app.js` | 时间线、搜索、渲染逻辑 |
| `assets/css/style.css` | 样式（基于 bankcomm.stoa.top） |

修改 GitLab commit 链接：编辑 `index.html` 中 `body` 的 `data-gitlab-base` 属性。

## GitHub Pages 部署（纯静态，无需构建）

本仓库**就是静态文件**（`index.html` + `assets/` + `data/`），不需要 Node 构建或 GitHub Actions。

### 推荐：从分支直接部署

1. 打开仓库 **Settings → Pages**
2. **Build and deployment → Source** 选 **Deploy from a branch**
3. **Branch** 选 `main`，目录选 **`/ (root)`**，保存
4. 等待 1～2 分钟，访问：

   **https://stogefei.github.io/bankcomm-logs/**

> 若 Actions 里 `pages-build-deployment` 一直 Queued，通常是 GitHub 排队或首次启用 Pages，稍等或刷新即可。与自定义 workflow 无关——本仓库不依赖 Actions。

### 本地直接打开

也可把仓库目录丢到任意静态服务器（Nginx、OSS、内网文件服务）：

```bash
npx serve . -p 4173
# 或直接双击 index.html（fetch 加载 JSON 需通过 http 访问）
```

## 版本切分规则

以下提交视为**新版本标记**，其后的非 docs/build 提交归入该版本：

- `docs: 更新版本`
- `docs: 发布版本` / `docs: 临时发布版本`
- `docs: 更新定制依赖包版本`
- `build: 主工程版本号`

## 相关链接

- [v1.1.0 功能需求说明（基线）](https://bankcomm.stoa.top/)
- Frontend 分支：`feature-8.7.x-bankcomm`
