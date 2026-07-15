# Obsidian Home Builder

[English quick start](#english-quick-start) | [更新记录](CHANGELOG.md) | [最新发布](https://github.com/okadasarina37/obsidian-home-builder/releases/latest)

为 Obsidian 制作手机、Pad 和电脑都能使用的可视化主页。无需维护一大段主页 Markdown；通过界面添加模块、调整布局和外观，同时保留 Tasks、Dataview、DataviewJS 的原生能力。

当前版本：`0.5.2`

## 安装

### 推荐：通过 BRAT 安装和更新

1. 在 Obsidian 社区插件中安装并启用 **BRAT**。
2. 打开 BRAT 设置，选择 **Add a beta plugin for testing**。
3. 输入仓库地址：`okadasarina37/obsidian-home-builder`。
4. 安装完成后，在社区插件中启用 **Home Builder**。
5. 之后在 BRAT 中检查更新即可。

### 手动安装

从 [Releases](https://github.com/okadasarina37/obsidian-home-builder/releases) 下载同一版本的 `main.js`、`manifest.json` 和 `styles.css`，放到：

```text
<你的库>/.obsidian/plugins/home-builder/
```

重新加载 Obsidian 后启用插件。

## 快速开始

1. 打开命令面板，运行 `Home Builder: Open Home Builder`。
2. 点“编辑主页”。
3. 点“添加模块”，选择日历、任务、快捷入口、活动热力图等模块。
4. 通过模块右上角“编辑”修改内容和外观。
5. 点“完成编辑”查看正式主页。

可通过顶部“新建主页”建立工作、学习、生活等独立主页；“主页管理”可重命名、复制、排序和删除主页。

## 主页与文件位置

Home Builder 主页是插件视图，不是单独的 Markdown 页面。所有主页、模块、布局、主题和横幅配置都保存在库内：

```text
Home Builder/home-builder.json
```

Obsidian 默认不在文件浏览器中显示 JSON。插件会自动生成一个可见入口：

```text
Home Builder/主页索引.md
```

它列出所有主页和配置位置，可点击打开对应主页。该文件由插件自动维护，请不要在其中保存手工内容。

配置文件位于库内，因此可以随着 Obsidian Sync、Remotely Save、Git 等同步方案同步。它只保存主页配置，不会复制或修改你的笔记、任务、书籍数据。

## 三端布局

每张主页都支持三种布局模式：

| 模式 | 用途 |
| --- | --- |
| 独立布局 | 手机、Pad、电脑分别摆放模块，默认推荐。 |
| 共享响应式布局 | 三端使用同一模块顺序，网格随宽度变化。 |
| 混合布局 | 共享基础布局，并可为指定设备保留覆写。 |

- 手机始终单列，通过“上移 / 下移”调整顺序。
- Pad 可选自动、固定 2 列或固定 3 列；自动模式会根据可用宽度切换。
- 电脑可在插件设置中选择 2、3 或 4 列。
- Pad 和电脑支持拖动排序，也提供左移、右移、上移一行、下移一行的按钮，触屏设备不依赖拖动。
- “调整宽度”会在当前设备支持的列宽之间切换。
- “同步布局”会用当前设备布局覆盖其他设备的布局，请在确认后使用。

## 可用模块

| 模块 | 说明 |
| --- | --- |
| 快捷入口 | 跳转库内笔记、文件夹或外部链接。 |
| 任务清单 | 可视化生成原生 Tasks 查询。 |
| Dataview 表格 | 可视化生成 Dataview 表格、列表或任务视图。 |
| 自定义查询 | 直接使用 Tasks、Dataview 或 DataviewJS 代码块。 |
| 文字模块 | 显示说明、提醒或短文本。 |
| 月历 | 浏览月份并打开指定目录的每日笔记。 |
| 活动热力图 | 按日期显示 Markdown 笔记活动。 |
| 倒数日 | 显示距离目标日期的天数。 |
| 图片 | 显示库内图片或图片 URL。 |
| 阅读书架 / 数字资产 / AI 用量 | 显示相应目录中的 Dataview 数据。 |
| 天气 | 手动填写，或按城市/设备定位从 Open-Meteo 获取天气。 |

Tasks、Dataview 和 DataviewJS 模块仍由原插件渲染，因此原有查询语法、任务勾选和其它插件行为不会被 Home Builder 改写。

## 活动热力图

热力图按“每天有多少篇 Markdown 笔记”显示四档深浅。

- 来源可选全库，或指定一个文件夹及其子文件夹。
- 日期可自动识别 YAML 中的 `date`、`created`、`createdAt`、`day`，其次识别文件名中的 `YYYY-MM-DD`，最后回退到文件创建时间。
- 也可强制使用 YAML 日期、文件名日期、创建时间或最后修改时间。
- 最少显示周期可选 16、26、52 周。空间足够时，16/26 周会自动补足更多周并居中；过宽时可横向滚动。
- 方块大小可选自动、小 `10px`、标准 `12px`、大 `16px`。自动模式：手机 `12px`、Pad `14px`、电脑 `16px`。
- 可设置周一或周日起始，并输入/复制 `#RRGGBB` 热力颜色。

## 外观与横幅

### 页面主题

编辑主页后点“主题”，可设置：

- 纯色、渐变或库内背景图
- 强调色
- 模块整体不透明度

### 模块外观

每个模块点“编辑”后，在“模块外观”中可设置：

- 背景色、文字色、边框色
- 圆角、阴影、内边距
- “无卡片底”：移除背景、边框和阴影
- “跟随主题”：恢复默认主题样式

所有颜色旁都显示可复制的十六进制颜色编号。

### Banner 横幅

编辑主页后点“横幅”：开启横幅，选择库内图片或填写 URL，再设置标题、副标题、遮罩、高度和圆角。未开启时不会占用主页空间。

### 月历样式

月历模块中可选择：

- 无底色（标准）
- 方格底色
- 无底色（紧凑）

还可设置周一/周日起始、今天颜色，以及方格模式下的圆角、圆形或直角日期。无底色模式只通过颜色和字重突出今天，不显示日期方块。

## 多主页管理

“主页管理”中的上下箭头用于调整多张主页在顶部切换列表中的顺序。每张主页都有：

- 上移 / 下移：调整切换顺序
- 删除：删除该主页的布局、模块、主题和横幅配置

删除前会要求确认，插件始终至少保留一张主页。

## 同步、备份与安全

- 主配置文件为 `Home Builder/home-builder.json`，可被常见同步方案同步。
- 每次保存会保留最近 10 份配置快照，可在插件设置中恢复。
- 检测到同步服务或其它设备修改配置时，插件会提示重新读取或恢复历史，避免静默覆盖。
- 导入/导出模块 JSON 时只影响该模块配置。
- 天气默认是手动模式，不联网；启用自动模式后才会访问 Open-Meteo，不需要 API Key。

## 常见问题

### 为什么 `Home Builder` 文件夹看起来是空的？

主页配置为 JSON，Obsidian 文件浏览器默认隐藏 JSON。更新到 `0.5.1` 或更高版本并重新加载插件后，会生成 `Home Builder/主页索引.md`。

### 为什么主页没有出现在普通 Markdown 文件里？

主页由插件视图渲染，模块配置存放在 JSON 中。这样同一主页可以针对手机、Pad、电脑拥有不同布局，而不会把大量界面配置写进 Markdown 正文。

### 如何设置启动主页？

打开 Obsidian 设置 → Home Builder，开启“启动时打开 Home Builder”。可设置统一启动主页，也可分别设置手机、Pad、电脑的启动主页；设备专属选择留空时自动回退到统一主页。它不会修改其它 Homepage 插件的设置。

### 如何报告问题？

请在 [GitHub Issues](https://github.com/okadasarina37/obsidian-home-builder/issues) 中提供插件版本、设备和 Obsidian 版本、复现步骤，以及截图或错误提示。

## 开发

```bash
npm install
npm run build
```

把 `manifest.json`、`main.js`、`styles.css` 复制到：

```text
<vault>/.obsidian/plugins/home-builder/
```

然后在 Obsidian 社区插件中启用 **Home Builder**。

## English quick start

Home Builder is a visual, responsive dashboard builder for Obsidian. It supports independent, shared, and hybrid phone/tablet/desktop layouts while preserving native Tasks, Dataview, and DataviewJS rendering.

### Install with BRAT

1. Install and enable the **BRAT** community plugin.
2. Choose **Add a beta plugin for testing**.
3. Enter `okadasarina37/obsidian-home-builder`.
4. Enable **Home Builder**, then run `Home Builder: Open Home Builder` from the command palette.

### Key features

- Multi-page dashboards with per-page layouts, themes, banners, duplication, sorting, and deletion.
- Phone single-column layout; responsive 2/3-column tablet layout; configurable 2/3/4-column desktop layout.
- Shortcuts, Tasks, Dataview, custom query, text, calendar, activity heatmap, countdown, image, bookshelf, assets, AI usage, and weather modules.
- Per-page background/theme controls and per-module colors, borders, radius, shadow, and padding.
- Activity heatmap for all Markdown files or a selected folder, with configurable date source, duration, color, and cell size.

Dashboard configuration is stored in `Home Builder/home-builder.json`. Version 0.5.1+ also creates `Home Builder/主页索引.md`, a visible index with links to all dashboards.

See the Chinese sections above for the complete guide and [CHANGELOG.md](CHANGELOG.md) for release history.

## License

MIT
