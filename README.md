# mind-map

基于 [Simple Mind Map（思绪思维导图）](https://github.com/wanglin2/mind-map) 的二次开发 Web 应用：在浏览器里新建、编辑、导出思维导图，数据写入**独立的 GitHub 数据仓库**，主仓库只放网页并部署到 GitHub Pages。

本项目使用上游 npm 包 `simple-mind-map`（MIT）与主题插件 `simple-mind-map-plugin-themes`，官方文档：https://wanglin2.github.io/mind-map-docs/

密钥只放在浏览器 `localStorage`，不会写入代码、不会提交、也不会进 GitHub Actions。

## 功能

- 新建 / 打开 / 重命名 / 删除 / 保存导图
- 节点编辑（双击改文字；Tab 子节点、Enter 同级、Del 删除）
- 布局切换、主题切换
- 导出 PNG / JPG / SVG / PDF / JSON / SMM / Markdown / XMind（库原生支持的格式）
- **本地优先**：未配置 PAT 也可新建和编辑，草稿写入 IndexedDB；配置后再同步到数据仓。删除先在本机生效，有 token 再删远程文件。

## 本地预览

本项目 Vite `base` 为 `/mind-map/`，开发服务器和生产预览都挂在该路径下（与 GitHub Pages 项目站一致）。

```bash
cd /workspace/mind-map
npm install
npm run dev
```

打开：**http://localhost:5173/mind-map/**

生产构建预览：

```bash
npm run build
npm run preview
```

打开：**http://localhost:4173/mind-map/**

直接访问根路径 `/` 不会打开应用，请带上 `/mind-map/` 前缀。

## BYOK 设置（localStorage）

项目简称 / app slug：`mindmap`（没有连字符）。密钥与数据仓库用**扁平、带连字符**的两个键，**不是** JSON blob：

| Key | 含义 |
| --- | --- |
| `gh-mindmap-repo` | 一整段 `owner/name`，指向**数据仓**，例如 `shalom-lab/mind-map-data`（不要拆成两个 key） |
| `gh-mindmap-token` | 用户自备的 GitHub PAT（BYOK） |

**可 Settings 填写，也可事先写入 localStorage；启动会自动读。**

例如在浏览器控制台预先注入：

```js
localStorage.setItem('gh-mindmap-repo', 'shalom-lab/mind-map-data')
localStorage.setItem('gh-mindmap-token', 'ghp_…') // 不要把 token 写进仓库或聊天记录
```

启动时静默读取上述两个键到应用状态，不弹窗打断：

- 已设置：Settings 显示「已保存」（token 仅掩码末 4 位）；列表可直接从数据仓同步
- 未设置：显示「未设置」；仍可本地编辑，需要同步时再引导去 Settings

在 Settings 中：

1. 单个输入框填写数据仓库 `owner/repo`，密码框填写 PAT
2. 点 **保存**：按钮转圈，用当前表单值测试 GitHub 连接，**通过后才写入** localStorage；失败不写入，并显示中文错误
3. **清除** 会二次确认后 `removeItem` 两个键（不会影响 GitHub 上的文件，也不会删除本机草稿）

不要单独寻找「测试连接」按钮——测连已合并进保存。不要把 PAT 写进仓库、`.env` 或 Actions 给浏览器用。

### PAT 权限（Scopes）

| Token 类型 | 需要的权限 |
| --- | --- |
| Fine-grained | Repository → **Contents: Read and write**；选中目标**数据仓库** |
| Classic | 勾选 **`repo`**（私有仓）；仅公有仓可试 `public_repo` |

## 数据仓结构

主仓 `mind-map` 只包含本 Web 应用。导图数据默认写到另一个仓库（建议名 `mind-map-data`，可在 Settings 或 `gh-mindmap-repo` 中改成任意 `owner/repo`）。

默认分支：`main`。每张导图一个 JSON 文件：

```text
maps/
  <uuid>.json
```

文件内容示例：

```json
{
  "version": 1,
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "title": "未命名导图",
  "updatedAt": "2026-11-25T01:23:00.000Z",
  "mindMap": {
    "layout": "mindMap",
    "theme": { "template": "default", "config": {} },
    "view": null,
    "root": {
      "data": { "text": "中心主题", "expand": true },
      "children": []
    }
  }
}
```

`mindMap` 字段是 `simple-mind-map` 的完整数据（`getData(true)`：节点树、布局、主题、视图）。打开官方导出的 `.smm` / 纯节点 JSON 也能导入识别。

非密钥的本机草稿与缓存存放在 IndexedDB（库名 `mindmap-byok`），不进 localStorage。

## GitHub Pages 部署

1. 在 GitHub 创建主仓库 `mind-map`（本 README 不代替创仓；推送前请先确认）
2. 仓库 **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. 推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会构建并部署
4. 站点路径为 `https://<owner>.github.io/mind-map/`（与 Vite `base` `/mind-map/` 一致）
5. 另建数据仓库（建议 `mind-map-data`），在网页 Settings 里填写该仓的 `owner/repo` 与 PAT

Actions 只构建静态网页，**不会**也不应写入 `gh-mindmap-token`。

## 许可与归属

本仓库以 MIT 许可发布。思维导图核心来自 [wanglin2/mind-map](https://github.com/wanglin2/mind-map)（The MindMap Team，MIT）。完整许可见 `LICENSE`。
