import {
  App,
  ButtonComponent,
  ColorComponent,
  ItemView,
  MarkdownRenderer,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  requestUrl,
  Setting,
  TFile,
  TFolder,
  TextComponent,
  WorkspaceLeaf,
  normalizePath,
} from "obsidian";

const VIEW_TYPE_HOME_BUILDER = "home-builder-view";
const DEFAULT_CONFIG_PATH = "Home Builder/home-builder.json";
const PLUGIN_VERSION = "0.4.3";

type Device = "mobile" | "tablet" | "desktop";
type LayoutMode = "independent" | "shared" | "hybrid";
type ModuleKind = "shortcuts" | "markdown" | "text" | "calendar" | "countdown" | "image" | "bookshelf" | "assets" | "aiusage" | "weather";
type Span = 1 | 2 | 3 | 4;

interface Shortcut {
  label: string;
  target: string;
  icon?: string;
}

interface HomeModule {
  id: string;
  kind: ModuleKind;
  title: string;
  span?: Span;
  hiddenOn?: Device[];
  shortcuts?: Shortcut[];
  markdown?: string;
  text?: string;
  queryKind?: "raw" | "tasks" | "dataview";
  style?: {
    background?: string;
    textColor?: string;
    borderColor?: string;
    radius?: number;
    shadow?: "none" | "soft" | "strong";
    padding?: "compact" | "normal" | "comfortable";
  };
  query?: {
    path?: string;
    tag?: string;
    limit?: number;
    due?: "any" | "today" | "overdue" | "today-or-overdue" | "future";
    priority?: "any" | "highest" | "high" | "medium" | "low" | "lowest";
    sort?: "none" | "due" | "priority" | "created" | "path";
    recurring?: "any" | "only" | "exclude";
    showCompleted?: boolean;
    dataviewView?: "table" | "list" | "task";
    preset?: string;
    sourceFile?: string;
    sourceBlock?: number;
  };
  options?: {
    imagePath?: string;
    imageAlt?: string;
    imageFit?: "cover" | "contain";
    targetDate?: string;
    label?: string;
    dailyFolder?: string;
    calendarStyle?: "minimal" | "boxed" | "compact";
    calendarWeekStart?: 0 | 1;
    calendarAccent?: string;
    calendarDayShape?: "rounded" | "circle" | "square";
    shelfPath?: string;
    assetPath?: string;
    usagePath?: string;
    weatherLocation?: string;
    weatherText?: string;
    weatherTemperature?: string;
    weatherMode?: "manual" | "auto";
    weatherCity?: string;
    weatherLatitude?: number;
    weatherLongitude?: number;
    weatherUpdatedAt?: string;
    weatherError?: string;
  };
}

interface Layout {
  modules: HomeModule[];
}

interface HomeConfig {
  version: 2;
  layoutMode: LayoutMode;
  configPath: string;
  pageId: string;
  pageName: string;
  pageOrder: string[];
  savedPages: SavedHomePage[];
  theme: {
    backgroundType: "none" | "color" | "image" | "gradient";
    backgroundValue: string;
    accent: string;
    cardOpacity: number;
  };
  banner: {
    enabled: boolean;
    imagePath: string;
    title: string;
    subtitle: string;
    alt: string;
    height: number;
    overlay: number;
    rounded: boolean;
  };
  settings: {
    openOnStartup: boolean;
    startupPageId: string;
    gridColumns: 2 | 3 | 4;
  };
  history?: Array<{ at: string; reason: string; data: string }>;
  layouts: Record<Device, Layout>;
}

interface SavedHomePage {
  id: string;
  name: string;
  layoutMode: LayoutMode;
  theme: HomeConfig["theme"];
  banner: HomeConfig["banner"];
  layouts: Record<Device, Layout>;
}

const newId = () => `hb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"]);
const isExternalUrl = (value: string) => /^(https?:)?\/\//i.test(value);
const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value.trim());

function addColorControl(setting: Setting, value: string, onChange: (value: string) => void) {
  let picker: ColorComponent | undefined;
  let text: TextComponent | undefined;
  const pickerValue = isHexColor(value) ? value : "#7c3aed";
  setting.addColorPicker((component) => {
    picker = component;
    component.setValue(pickerValue).onChange((next) => {
      const normalized = next.toUpperCase();
      text?.setValue(normalized);
      onChange(normalized);
    });
  });
  setting.addText((component) => {
    text = component;
    component.inputEl.addClass("hb-color-code");
    component.inputEl.setAttribute("spellcheck", "false");
    component.setPlaceholder("#RRGGBB").setValue(value).onChange((next) => {
      const normalized = next.trim().toUpperCase();
      if (!isHexColor(normalized)) return;
      picker?.setValue(normalized);
      onChange(normalized);
    });
  });
  return { setText: (next: string) => text?.setValue(next) };
}
const MODULE_CHOICES: Array<[string, ModuleKind, string, HomeModule["queryKind"]?]> = [
  ["快捷入口", "shortcuts", "链接与常用笔记入口"],
  ["任务清单", "markdown", "可视化生成 Tasks 查询", "tasks"],
  ["Dataview 表格", "markdown", "可视化生成文件夹表格", "dataview"],
  ["自定义查询", "markdown", "粘贴 Tasks、Dataview 或 DataviewJS", "raw"],
  ["文字模块", "text", "标题、说明或提醒"],
  ["月历", "calendar", "链接到每日笔记"],
  ["倒数日", "countdown", "显示距离某个日期的天数"],
  ["图片", "image", "展示库内图片或 URL"],
  ["阅读书架", "bookshelf", "读取正式书籍记录"],
  ["数字资产", "assets", "显示近期资产与到期日"],
  ["AI 用量", "aiusage", "显示已同步的 AI 用量记录"],
  ["天气", "weather", "手动记录或自动抓取天气"],
];

function vaultImageUrl(app: App, path: string): string {
  if (!path || isExternalUrl(path)) return path;
  const file = app.vault.getAbstractFileByPath(path);
  return file instanceof TFile ? app.vault.getResourcePath(file) : path;
}

function taskPriorityLine(priority?: HomeModule["query"] extends infer _ ? string : never): string | undefined {
  const map: Record<string, string> = {
    highest: "priority is highest",
    high: "priority is high",
    medium: "priority is medium",
    low: "priority is low",
    lowest: "priority is lowest",
  };
  return priority ? map[priority] : undefined;
}

function taskMarkdown(query: HomeModule["query"]): string {
  const lines = [query?.showCompleted ? "" : "not done"].filter(Boolean);
  if (query?.path) lines.push(`path includes ${query.path}`);
  if (query?.tag) lines.push(`tags include ${query.tag.startsWith("#") ? query.tag : `#${query.tag}`}`);
  const due: Record<string, string> = {
    today: "due on today",
    overdue: "due before today",
    "today-or-overdue": "due on or before today",
    future: "due after today",
  };
  if (query?.due && due[query.due]) lines.push(due[query.due]);
  const priority = taskPriorityLine(query?.priority);
  if (priority) lines.push(priority);
  if (query?.recurring === "only") lines.push("is recurring");
  if (query?.recurring === "exclude") lines.push("is not recurring");
  const sort: Record<string, string> = { due: "sort by due", priority: "sort by priority", created: "sort by created", path: "sort by path" };
  if (query?.sort && sort[query.sort]) lines.push(sort[query.sort]);
  if (query?.limit) lines.push(`limit ${query.limit}`);
  return `\`\`\`tasks\n${lines.join("\n")}\n\`\`\``;
}

function dataviewMarkdown(query: HomeModule["query"]): string {
  const source = query?.path ? `FROM \"${query.path}\"` : "FROM \"\"";
  const limit = query?.limit ? `\nLIMIT ${query.limit}` : "";
  const view = query?.dataviewView ?? "table";
  const body = view === "list" ? "LIST file.link" : view === "task" ? "TASK" : "TABLE WITHOUT ID file.link AS 笔记";
  return `\`\`\`dataview\n${body}\n${source}${limit}\n\`\`\``;
}

function presetMarkdown(preset: string): string {
  const presets: Record<string, string> = {
    reading: "```dataview\nTABLE WITHOUT ID file.link AS 书籍, reading-progress AS 进度\nFROM \"05_Books/epub-bookmarks\"\nWHERE reading-progress\nSORT reading-progress DESC\nLIMIT 6\n```",
    assets: "```dataview\nTABLE WITHOUT ID file.link AS 资产, expire AS 到期日, status AS 状态\nFROM \"09_数字资产/资产\"\nSORT expire ASC\nLIMIT 8\n```",
    life: "```dataview\nLIST FROM \"03_生活记录\"\nSORT file.mtime DESC\nLIMIT 8\n```",
    aiusage: "```dataview\nTABLE WITHOUT ID balance AS 余额, totalUsed AS 累计消耗, updated AS 同步时间\nFROM \"03_生活记录/05_AI用量\"\nLIMIT 1\n```",
    calendar: "```dataview\nLIST FROM \"02_日历/每日\"\nSORT file.name DESC\nLIMIT 7\n```",
  };
  return presets[preset] ?? "";
}

function weatherDescription(code: number): string {
  const labels: Record<number, string> = {
    0: "晴", 1: "大部晴朗", 2: "局部多云", 3: "阴", 45: "雾", 48: "雾凇",
    51: "毛毛雨", 53: "毛毛雨", 55: "毛毛雨", 56: "冻毛毛雨", 57: "冻毛毛雨",
    61: "小雨", 63: "中雨", 65: "大雨", 66: "冻雨", 67: "冻雨",
    71: "小雪", 73: "中雪", 75: "大雪", 77: "雪粒", 80: "阵雨", 81: "阵雨", 82: "强阵雨",
    85: "阵雪", 86: "强阵雪", 95: "雷暴", 96: "雷暴伴冰雹", 99: "强雷暴伴冰雹",
  };
  return labels[code] ?? "天气数据暂不可用";
}

function starterModules(): HomeModule[] {
  return [
    {
      id: newId(),
      kind: "shortcuts",
      title: "快捷入口",
      span: 2,
      shortcuts: [
        { label: "今天", target: "02_日历/每日" },
        { label: "待办", target: "06_Todo/Todo总览" },
        { label: "阅读", target: "05_Books/阅读总览" },
        { label: "生活", target: "03_生活记录/生活总览" },
      ],
    },
    {
      id: newId(),
      kind: "markdown",
      title: "今日待办",
      span: 1,
      markdown: "```tasks\nnot done\ndue on or before today\nshort mode\n```",
    },
    {
      id: newId(),
      kind: "markdown",
      title: "阅读进度",
      span: 1,
      markdown: "```dataview\nTABLE WITHOUT ID file.link AS 书籍, reading-progress AS 进度\nFROM \"05_Books/epub-bookmarks\"\nWHERE reading-progress\nSORT reading-progress DESC\nLIMIT 5\n```",
    },
  ];
}

function focusModules(): HomeModule[] {
  return [
    { id: newId(), kind: "markdown", title: "今日待办", span: 2, queryKind: "tasks", query: { limit: 10 }, markdown: taskMarkdown({ limit: 10 }) },
    { id: newId(), kind: "shortcuts", title: "常用入口", span: 1, shortcuts: [] },
  ];
}

function defaultConfig(): HomeConfig {
  return {
    version: 2,
    layoutMode: "independent",
    configPath: DEFAULT_CONFIG_PATH,
    pageId: newId(),
    pageName: "主页",
    pageOrder: [],
    savedPages: [],
    theme: { backgroundType: "none", backgroundValue: "", accent: "#7c3aed", cardOpacity: 0.88 },
    banner: { enabled: false, imagePath: "", title: "", subtitle: "", alt: "主页横幅图片", height: 220, overlay: .42, rounded: true },
    settings: { openOnStartup: false, startupPageId: "", gridColumns: 2 },
    history: [],
    layouts: {
      mobile: { modules: starterModules() },
      tablet: { modules: starterModules() },
      desktop: { modules: starterModules() },
    },
  };
}

/** Upgrade the pre-0.3 multi-layout file without changing the user's modules. */
function migrateConfig(raw?: Partial<HomeConfig> | null): HomeConfig {
  const defaults = defaultConfig();
  const source = raw ?? {};
  const fixLayout = (layout?: Layout): Layout => ({
    modules: (layout?.modules ?? []).map((module) => ({
      ...module,
      // Older releases accidentally stored Dataview paths as \"path\".
      // Obsidian's mobile renderer treats the backslash as an invalid pattern.
      markdown: module.markdown?.replace(/\\"/g, '"'),
    })),
  });
  const fixPage = (page: SavedHomePage): SavedHomePage => ({
    ...page,
    id: page.id || newId(),
    name: page.name || "未命名主页",
    theme: { ...defaults.theme, ...page.theme },
    banner: { ...defaults.banner, ...page.banner },
    layouts: {
      mobile: fixLayout(page.layouts?.mobile),
      tablet: fixLayout(page.layouts?.tablet),
      desktop: fixLayout(page.layouts?.desktop),
    },
  });
  return {
    ...defaults,
    ...source,
    version: 2,
    pageId: source.pageId || defaults.pageId,
    pageName: source.pageName || defaults.pageName,
    pageOrder: source.pageOrder ?? [],
    theme: { ...defaults.theme, ...source.theme },
    banner: { ...defaults.banner, ...source.banner },
    settings: { ...defaults.settings, ...source.settings },
    savedPages: (source.savedPages ?? []).map(fixPage),
    history: source.history ?? [],
    layouts: {
      mobile: fixLayout(source.layouts?.mobile),
      tablet: fixLayout(source.layouts?.tablet),
      desktop: fixLayout(source.layouts?.desktop),
    },
  };
}

export default class HomeBuilderPlugin extends Plugin {
  config: HomeConfig = defaultConfig();
  private refreshTimer: number | undefined;
  private lastSavedConfig = "";

  async onload() {
    await this.loadConfig();
    this.registerView(VIEW_TYPE_HOME_BUILDER, (leaf) => new HomeBuilderView(leaf, this));
    this.addRibbonIcon("layout-dashboard", "Open Home Builder", () => void this.openHome());
    this.addCommand({ id: "open-home", name: "Open Home Builder", callback: () => void this.openHome() });
    this.addCommand({ id: "new-home", name: "Create a new Home Builder page", callback: () => new NewHomeModal(this.app, this).open() });
    this.addSettingTab(new HomeBuilderSettings(this.app, this));
    this.registerEvent(this.app.vault.on("modify", (file) => this.scheduleRefresh(file)));
    this.registerEvent(this.app.vault.on("create", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleRefresh()));
    this.registerEvent(this.app.vault.on("rename", () => this.scheduleRefresh()));
    this.app.workspace.onLayoutReady(() => {
      if (this.config.settings.openOnStartup) void this.openConfiguredStartupPage();
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_HOME_BUILDER);
  }

  async openHome() {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_HOME_BUILDER)[0]
      ?? this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE_HOME_BUILDER, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  async openConfiguredStartupPage() {
    const id = this.config.settings.startupPageId;
    if (id && id !== this.config.pageId && this.config.savedPages.some((page) => page.id === id)) await this.switchPage(id);
    await this.openHome();
  }

  async refreshWeather(module: HomeModule, force = false) {
    if (module.kind !== "weather") return;
    module.options ??= {};
    const options = module.options;
    if (options.weatherMode !== "auto") return;
    const last = options.weatherUpdatedAt ? new Date(options.weatherUpdatedAt).getTime() : 0;
    if (!force && last && Date.now() - last < 30 * 60 * 1000 && options.weatherTemperature) return;
    try {
      let latitude = options.weatherLatitude;
      let longitude = options.weatherLongitude;
      let location = options.weatherLocation || options.weatherCity || "当前位置";
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        const city = options.weatherCity?.trim();
        if (!city) throw new Error("请填写城市，或使用当前定位。");
        const geocode = await requestUrl({ url: `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json` });
        const result = geocode.json?.results?.[0];
        if (!result) throw new Error("未找到该城市，请检查名称。");
        latitude = result.latitude;
        longitude = result.longitude;
        location = [result.name, result.admin1, result.country].filter(Boolean).join(" · ");
      }
      const forecast = await requestUrl({ url: `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto` });
      const current = forecast.json?.current;
      if (!current || typeof current.temperature_2m !== "number") throw new Error("天气服务没有返回当前温度。");
      options.weatherLatitude = latitude;
      options.weatherLongitude = longitude;
      options.weatherLocation = location;
      options.weatherTemperature = `${Math.round(current.temperature_2m)}°C`;
      options.weatherText = weatherDescription(Number(current.weather_code));
      options.weatherUpdatedAt = new Date().toISOString();
      options.weatherError = "";
      await this.saveConfig("刷新天气");
    } catch (error) {
      options.weatherError = String(error).replace(/^Error:\s*/, "");
      await this.saveConfig("天气刷新失败");
      new Notice(`天气更新失败：${options.weatherError}`);
    }
  }

  private scheduleRefresh(file?: { path: string }) {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      void this.refreshViews();
      if (file?.path === normalizePath(this.config.configPath || DEFAULT_CONFIG_PATH)) void this.detectExternalConfigChange();
    }, 300);
  }

  private async detectExternalConfigChange() {
    try {
      const text = await this.app.vault.adapter.read(normalizePath(this.config.configPath || DEFAULT_CONFIG_PATH));
      if (text !== this.lastSavedConfig) new Notice("Home Builder 配置已被其他设备或同步服务修改。请在设置中选择重新读取或从历史恢复，避免覆盖。", 9000);
    } catch { /* 配置尚未创建时无需提示 */ }
  }

  getDevice(): Device {
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  resolvedLayout(device: Device): Layout {
    if (this.config.layoutMode === "shared") return this.config.layouts.desktop;
    if (this.config.layoutMode === "hybrid") return this.config.layouts[device].modules.length
      ? this.config.layouts[device]
      : this.config.layouts.desktop;
    return this.config.layouts[device];
  }

  listPages(): Array<{ id: string; name: string }> {
    const pages = [{ id: this.config.pageId, name: this.config.pageName }, ...this.config.savedPages.map(({ id, name }) => ({ id, name }))];
    const map = new Map(pages.map((page) => [page.id, page]));
    const ordered = (this.config.pageOrder ?? []).map((id) => map.get(id)).filter((page): page is { id: string; name: string } => Boolean(page));
    for (const page of pages) if (!ordered.some((item) => item.id === page.id)) ordered.push(page);
    return ordered;
  }

  private normalizePageOrder() { this.config.pageOrder = this.listPages().map((page) => page.id); }

  private activeSnapshot(): SavedHomePage {
    return {
      id: this.config.pageId,
      name: this.config.pageName,
      layoutMode: this.config.layoutMode,
      theme: clone(this.config.theme),
      banner: clone(this.config.banner),
      layouts: clone(this.config.layouts),
    };
  }

  private applySnapshot(page: SavedHomePage) {
    this.config.pageId = page.id;
    this.config.pageName = page.name;
    this.config.layoutMode = page.layoutMode;
    this.config.theme = clone(page.theme);
    this.config.banner = clone(page.banner ?? defaultConfig().banner);
    this.config.layouts = clone(page.layouts);
  }

  async createPage(name: string) {
    const cleanName = name.trim() || "新主页";
    this.config.savedPages = [...this.config.savedPages.filter((page) => page.id !== this.config.pageId), this.activeSnapshot()];
    const fresh = defaultConfig();
    fresh.pageName = cleanName;
    fresh.layouts = {
      mobile: { modules: [] },
      tablet: { modules: [] },
      desktop: { modules: [] },
    };
    this.config.pageId = fresh.pageId;
    this.config.pageName = fresh.pageName;
    this.config.layoutMode = fresh.layoutMode;
    this.config.theme = fresh.theme;
    this.config.banner = fresh.banner;
    this.config.layouts = fresh.layouts;
    this.config.pageOrder = [...this.config.pageOrder.filter((id) => id !== fresh.pageId), fresh.pageId];
    this.normalizePageOrder();
    await this.saveConfig();
    new Notice(`已新建主页：${cleanName}`);
  }

  async switchPage(id: string) {
    if (id === this.config.pageId) return;
    const target = this.config.savedPages.find((page) => page.id === id);
    if (!target) return;
    const current = this.activeSnapshot();
    this.config.savedPages = this.config.savedPages.map((page) => page.id === id ? current : page);
    this.applySnapshot(target);
    await this.saveConfig();
  }

  async renamePage(name: string) {
    this.config.pageName = name.trim() || "未命名主页";
    await this.saveConfig();
  }

  async deleteActivePage() {
    if (!this.config.savedPages.length) {
      new Notice("至少保留一张主页。");
      return;
    }
    const deletedId = this.config.pageId;
    const next = this.config.savedPages[0];
    this.config.savedPages = this.config.savedPages.slice(1);
    this.applySnapshot(next);
    this.config.pageOrder = this.config.pageOrder.filter((id) => id !== deletedId);
    this.normalizePageOrder();
    await this.saveConfig();
    new Notice("主页已删除。");
  }

  async duplicateActivePage(name?: string) {
    const original = this.activeSnapshot();
    this.config.savedPages = [...this.config.savedPages.filter((page) => page.id !== original.id), original];
    const copy = clone(original);
    copy.id = newId();
    copy.name = name?.trim() || `${original.name} 副本`;
    this.applySnapshot(copy);
    this.config.pageOrder = [...this.config.pageOrder, copy.id];
    this.normalizePageOrder();
    await this.saveConfig("复制主页");
    new Notice(`已复制主页：${copy.name}`);
  }

  async movePage(id: string, delta: number) {
    this.normalizePageOrder();
    const from = this.config.pageOrder.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= this.config.pageOrder.length) return;
    [this.config.pageOrder[from], this.config.pageOrder[to]] = [this.config.pageOrder[to], this.config.pageOrder[from]];
    await this.saveConfig("调整主页顺序");
  }

  async restoreHistory(index: number) {
    const entry = this.config.history?.[index];
    if (!entry) return;
    try {
      const restored = JSON.parse(entry.data) as HomeConfig;
      const currentHistory = this.config.history ?? [];
      this.config = { ...migrateConfig(restored), configPath: this.config.configPath, history: currentHistory };
      await this.saveConfig(`恢复历史版本：${entry.at}`);
      new Notice("已恢复主页配置。 ");
    } catch (error) { new Notice(`无法恢复历史配置：${String(error)}`); }
  }

  async reloadConfigFromVault() {
    const path = normalizePath(this.config.configPath || DEFAULT_CONFIG_PATH);
    try {
      const fromVault = JSON.parse(await this.app.vault.adapter.read(path)) as HomeConfig;
      this.config = migrateConfig(fromVault);
      this.lastSavedConfig = JSON.stringify(fromVault, null, 2);
      await this.refreshViews();
      new Notice("已重新读取库内主页配置。 ");
    } catch (error) { new Notice(`无法读取库内配置：${String(error)}`); }
  }

  async syncLayoutFrom(device: Device) {
    const source = clone(this.resolvedLayout(device));
    this.config.layouts = { mobile: clone(source), tablet: clone(source), desktop: clone(source) };
    await this.saveConfig();
    new Notice("已将当前布局同步到手机、Pad 和电脑。");
  }

  async loadConfig() {
    const saved = await this.loadData() as Partial<HomeConfig> | null;
    this.config = migrateConfig(saved);
    const path = normalizePath(this.config.configPath || DEFAULT_CONFIG_PATH);
    try {
      if (await this.app.vault.adapter.exists(path)) {
        const rawConfig = await this.app.vault.adapter.read(path);
        const fromVault = JSON.parse(rawConfig) as HomeConfig;
        this.config = migrateConfig({ ...this.config, ...fromVault });
        this.lastSavedConfig = rawConfig;
      }
    } catch (error) {
      new Notice(`Home Builder: 无法读取主页配置：${String(error)}`);
    }
    this.normalizePageOrder();
  }

  async saveConfig(reason = "编辑主页", refresh = true) {
    this.config.savedPages = this.config.savedPages.filter((page) => page.id !== this.config.pageId);
    const path = normalizePath(this.config.configPath || DEFAULT_CONFIG_PATH);
    const folder = path.split("/").slice(0, -1).join("/");
    if (folder && !this.app.vault.getAbstractFileByPath(folder)) await this.app.vault.createFolder(folder);
    const snapshot = clone(this.config);
    snapshot.history = [];
    const historyEntry = { at: new Date().toISOString(), reason, data: JSON.stringify(snapshot) };
    this.config.history = [...(this.config.history ?? []).slice(-9), historyEntry];
    const serialized = JSON.stringify(this.config, null, 2);
    await this.app.vault.adapter.write(path, serialized);
    this.lastSavedConfig = serialized;
    await this.saveData({ configPath: path, layoutMode: this.config.layoutMode, theme: this.config.theme });
    if (refresh) await this.refreshViews();
  }

  async refreshViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_HOME_BUILDER)) {
      const view = leaf.view;
      if (view instanceof HomeBuilderView) await view.render();
    }
  }

  async applyTemplate(template: "xiaoxin" | "focus" | "blank") {
    const modules = template === "xiaoxin" ? starterModules() : template === "focus" ? focusModules() : [];
    this.config.layouts = {
      mobile: { modules: clone(modules) },
      tablet: { modules: clone(modules) },
      desktop: { modules: clone(modules) },
    };
    await this.saveConfig();
    new Notice(template === "xiaoxin" ? "已导入小新知识库模板。" : template === "focus" ? "已导入专注模板。" : "已应用空白主页。");
  }
}

class HomeBuilderView extends ItemView {
  private editing = false;
  private selectedDevice: Device | null = null;
  private calendarOffsets = new Map<string, number>();
  private renderStage = "未开始";

  constructor(leaf: WorkspaceLeaf, private plugin: HomeBuilderPlugin) {
    super(leaf);
  }

  getViewType() { return VIEW_TYPE_HOME_BUILDER; }
  getDisplayText() { return "Home Builder"; }
  getIcon() { return "layout-dashboard"; }

  async onOpen() { await this.render(); }

  private device() { return this.selectedDevice ?? this.plugin.getDevice(); }

  async render() {
    this.renderStage = "清空旧页面";
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("home-builder-view");
    this.renderStage = "应用主题";
    const theme = this.plugin.config.theme;
    contentEl.style.setProperty("--hb-accent", theme.accent);
    contentEl.style.setProperty("--hb-card-opacity", String(theme.cardOpacity));
    contentEl.style.setProperty("--hb-columns", String(this.plugin.config.settings.gridColumns));
    contentEl.classList.remove("hb-bg-color", "hb-bg-image", "hb-bg-gradient");
    contentEl.style.background = "";
    contentEl.style.backgroundImage = "";
    if (theme.backgroundType !== "none") {
      contentEl.addClass(`hb-bg-${theme.backgroundType}`);
      if (theme.backgroundType === "image") contentEl.style.backgroundImage = `linear-gradient(rgb(var(--background-primary-rgb) / .78), rgb(var(--background-primary-rgb) / .9)), url("${vaultImageUrl(this.app, theme.backgroundValue)}")`;
      else contentEl.style.background = theme.backgroundValue;
    }

    this.renderStage = "顶部栏";
    const header = contentEl.createDiv({ cls: "hb-header" });
    const heading = header.createDiv({ cls: "hb-heading" });
    heading.createEl("h1", { text: this.plugin.config.pageName });
    heading.createEl("span", { text: `${this.editing ? "编辑中" : "Home Builder"} · v${PLUGIN_VERSION}`, cls: "hb-status" });
    const actions = header.createDiv({ cls: "hb-actions" });
    const pageSelect = actions.createEl("select", { cls: "hb-page-select", attr: { "aria-label": "切换主页" } });
    for (const page of this.plugin.listPages()) pageSelect.createEl("option", { text: page.name, value: page.id });
    pageSelect.value = this.plugin.config.pageId;
    pageSelect.onchange = async () => { await this.plugin.switchPage(pageSelect.value); };
    new ButtonComponent(actions).setButtonText("新建主页").setTooltip("新建主页").onClick(() => new NewHomeModal(this.app, this.plugin).open());
    new ButtonComponent(actions).setButtonText("主页管理").setTooltip("管理主页").onClick(() => new PageManagerModal(this.app, this.plugin).open());
    new ButtonComponent(actions).setButtonText(this.editing ? "完成编辑" : "编辑主页（添加/删除/移动）").setCta().onClick(async () => {
      this.editing = !this.editing;
      await this.render();
    });
    if (this.editing) {
      this.renderStage = "添加模块区";
      this.renderAddModuleCta(contentEl);
      this.renderStage = "编辑工具栏";
      this.renderEditorBar(contentEl);
    }
    else this.renderEditHint(contentEl);
    this.renderStage = "横幅";
    this.renderBanner(contentEl);

    this.renderStage = "模块网格";
    const grid = contentEl.createDiv({ cls: "hb-grid" });
    const layout = this.plugin.resolvedLayout(this.device());
    if (!layout.modules.length) {
      const empty = grid.createDiv({ cls: "hb-empty" });
      empty.createEl("p", { text: "还没有模块。先开始编辑，再添加快捷入口、任务或日历。" });
      new ButtonComponent(empty).setButtonText("开始添加模块").setCta().onClick(async () => {
        this.editing = true;
        await this.render();
      });
    }
    for (const module of layout.modules) {
      if (this.editing || !module.hiddenOn?.includes(this.device())) {
        this.renderStage = `模块“${module.title || "未命名"}”：开始`;
        const childCount = grid.childElementCount;
        try {
          await this.renderModule(grid, module, layout);
        } catch (error) {
          while (grid.childElementCount > childCount) grid.lastElementChild?.remove();
          const failed = document.createElement("section");
          failed.className = "hb-module hb-span-1";
          const title = document.createElement("h2");
          title.textContent = module.title || "未命名模块";
          const message = document.createElement("p");
          message.className = "hb-error";
          message.textContent = `模块卡片显示失败：${String(error)}`;
          failed.append(title, message);
          if (this.editing) {
            const edit = document.createElement("button");
            edit.type = "button";
            edit.textContent = "编辑模块";
            edit.onclick = () => this.openModuleEditor(module);
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "mod-warning";
            remove.textContent = "删除模块";
            remove.onclick = () => new ConfirmModal(this.app, "删除这个模块？", "模块的数据和布局将被移除。", async () => {
              layout.modules.splice(layout.modules.indexOf(module), 1);
              await this.plugin.saveConfig();
            }).open();
            failed.append(edit, remove);
          }
          grid.appendChild(failed);
        }
      }
    }
    const bottomSpacer = document.createElement("div");
    bottomSpacer.className = "hb-mobile-bottom-spacer";
    bottomSpacer.setAttribute("aria-hidden", "true");
    grid.appendChild(bottomSpacer);
    this.renderStage = "完成";
  }

  private renderEditHint(container: HTMLElement) {
    const hint = container.createDiv({ cls: "hb-edit-hint" });
    hint.createEl("strong", { text: "想改主页？" });
    hint.createSpan({ text: " 点上方“编辑主页（添加/删除/移动）”，再添加模块或使用每个模块下方的操作按钮。" });
  }

  private renderBanner(container: HTMLElement) {
    const banner = this.plugin.config.banner;
    if (!banner.enabled) return;
    const el = container.createDiv({ cls: "hb-banner" });
    if (banner.rounded) el.classList.add("hb-banner-rounded");
    el.style.setProperty("--hb-banner-height", `${Math.max(120, banner.height)}px`);
    el.style.setProperty("--hb-banner-overlay", String(Math.max(0, Math.min(.9, banner.overlay))));
    if (banner.imagePath) {
      const image = el.createEl("img", { attr: { src: vaultImageUrl(this.app, banner.imagePath), alt: banner.alt || "主页横幅图片", loading: "eager" } });
      image.addClass("hb-banner-image");
    }
    el.createDiv({ cls: "hb-banner-overlay" });
    const text = el.createDiv({ cls: "hb-banner-text" });
    text.createEl("h2", { text: banner.title || this.plugin.config.pageName });
    if (banner.subtitle) text.createEl("p", { text: banner.subtitle });
  }

  private renderEditorBar(container: HTMLElement) {
    const bar = container.createDiv({ cls: "hb-editor-bar" });
    bar.createEl("strong", { text: "编辑模式" });
    bar.createSpan({ text: this.device() === "mobile"
      ? "先添加模块；每张模块下方可编辑、上移、下移或删除。"
      : "先添加模块；可拖动排序，也可用左右移动一格、上下一整行。" });
    for (const device of ["mobile", "tablet", "desktop"] as Device[]) {
      const button = new ButtonComponent(bar).setButtonText(device === "mobile" ? "手机" : device === "tablet" ? "Pad" : "电脑");
      if (this.device() === device) button.setClass("mod-cta");
      button.onClick(async () => { this.selectedDevice = device; await this.render(); });
    }
    new ButtonComponent(bar).setButtonText("同步布局").setTooltip("将当前编辑设备的布局复制给其他设备").onClick(() => new ConfirmModal(this.app, "同步当前布局？", "会用当前设备的模块和排序覆盖其他设备布局。", () => this.plugin.syncLayoutFrom(this.device())).open());
    new ButtonComponent(bar).setButtonText("主题").onClick(() => new ThemeModal(this.app, this.plugin).open());
    new ButtonComponent(bar).setButtonText("横幅").onClick(() => new BannerModal(this.app, this.plugin).open());
    new ButtonComponent(bar).setButtonText("模板").onClick(() => new TemplateModal(this.app, this.plugin).open());
    new ButtonComponent(bar).setButtonText("导入导出").onClick(() => new LayoutTransferModal(this.app, this.plugin, this.device()).open());
  }

  private renderAddModuleCta(container: HTMLElement) {
    const section = container.createDiv({ cls: "hb-add-module-section" });
    const copy = section.createDiv();
    copy.createEl("strong", { text: "1. 添加模块" });
    copy.createEl("span", { text: "从快捷入口、待办、日历、天气等类型中选择。" });
    const add = new ButtonComponent(section).setButtonText("＋ 添加模块").setCta();
    add.buttonEl.setAttribute("aria-label", "添加模块");
    add.onClick(() => this.openAddMenu(add.buttonEl));
  }

  private openAddMenu(anchor: HTMLElement) {
    document.querySelector(".hb-add-menu")?.remove();
    const menu = document.createElement("div");
    menu.className = "hb-add-menu";
    for (const [label, kind, description, queryKind] of MODULE_CHOICES) {
      const option = document.createElement("button");
      option.type = "button";
      option.setAttribute("aria-label", `添加${label}模块`);
      const name = document.createElement("strong");
      name.textContent = label;
      const detail = document.createElement("small");
      detail.textContent = description;
      option.append(name, detail);
      option.onclick = async (event) => {
        event.stopPropagation();
        menu.remove();
        const created: HomeModule = { id: newId(), kind, title: label, span: 1, queryKind };
        if (kind === "shortcuts") created.shortcuts = [];
        if (queryKind === "tasks") { created.query = { limit: 8 }; created.markdown = taskMarkdown(created.query); }
        else if (queryKind === "dataview") { created.query = { limit: 8 }; created.markdown = dataviewMarkdown(created.query); }
        else if (kind === "markdown") created.markdown = "```tasks\nnot done\n```";
        if (kind === "text") created.text = "写一点提示或说明。";
        if (kind === "calendar") created.options = { dailyFolder: "02_日历/每日" };
        if (kind === "countdown") created.options = { label: "倒数日", targetDate: new Date().toISOString().slice(0, 10) };
        if (kind === "image") created.options = { imagePath: "", imageAlt: "主页图片", imageFit: "cover" };
        if (kind === "bookshelf") created.options = { shelfPath: "05_Books/epub-bookmarks" };
        if (kind === "assets") created.options = { assetPath: "09_数字资产/资产" };
        if (kind === "aiusage") created.options = { usagePath: "03_生活记录/05_AI用量" };
        if (kind === "weather") created.options = { weatherMode: "manual", weatherLocation: "当前位置", weatherText: "晴", weatherTemperature: "--°" };

        const layout = this.plugin.resolvedLayout(this.device());
        layout.modules.push(created);
        try {
          await this.plugin.saveConfig("添加模块：" + label, false);
        } catch (error) {
          layout.modules.splice(layout.modules.indexOf(created), 1);
          new Notice(`保存“${label}”失败：${String(error)}`, 10000);
          return;
        }

        try {
          await this.render();
          new Notice(`已添加“${label}”。模块已显示在下方，可直接编辑、移动或删除。`);
          window.setTimeout(() => {
            const cards = this.contentEl.querySelectorAll<HTMLElement>(".hb-module");
            cards.item(cards.length - 1)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
        } catch (error) {
          new Notice(`“${label}”已保存，但页面显示失败（${this.renderStage}）：${String(error)}`, 12000);
        }
      };
      menu.appendChild(option);
    }

    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    const viewportPadding = 12;
    menu.style.left = `${Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - viewportPadding - menu.offsetWidth)}px`;
    const preferredTop = rect.bottom + 8;
    const availableBelow = window.innerHeight - preferredTop - viewportPadding;
    const availableAbove = rect.top - viewportPadding;
    if (availableBelow < 220 && availableAbove > availableBelow) {
      menu.style.top = `${viewportPadding}px`;
      menu.style.maxHeight = `${Math.max(180, availableAbove)}px`;
    } else {
      menu.style.top = `${preferredTop}px`;
      menu.style.maxHeight = `${Math.max(180, availableBelow)}px`;
    }
    window.setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
  }

  private async renderModule(grid: HTMLElement, module: HomeModule, layout: Layout) {
    this.renderStage = `模块“${module.title || "未命名"}”：创建卡片`;
    const hidden = module.hiddenOn?.includes(this.device());
    const card = grid.createDiv({ cls: "hb-module" });
    card.classList.add(`hb-span-${module.span ?? 1}`);
    if (module.style?.background) card.style.background = module.style.background;
    if (module.style?.textColor) {
      card.style.color = module.style.textColor;
      card.style.setProperty("--text-normal", module.style.textColor);
      card.style.setProperty("--text-muted", `color-mix(in srgb, ${module.style.textColor}, transparent 28%)`);
    }
    if (module.style?.borderColor) card.style.borderColor = module.style.borderColor;
    if (module.style?.radius !== undefined) card.style.borderRadius = `${module.style.radius}px`;
    card.classList.add(`hb-shadow-${module.style?.shadow ?? "soft"}`);
    card.classList.add(`hb-padding-${module.style?.padding ?? "normal"}`);
    if (hidden) card.classList.add("hb-device-hidden");
    if (this.editing && this.device() !== "mobile") {
      card.draggable = true;
      card.addClass("hb-draggable");
      card.ondragstart = (event) => event.dataTransfer?.setData("text/plain", module.id);
      card.ondragover = (event) => event.preventDefault();
      card.ondrop = async (event) => {
        event.preventDefault();
        const movedId = event.dataTransfer?.getData("text/plain");
        const from = layout.modules.findIndex((item) => item.id === movedId);
        const to = layout.modules.indexOf(module);
        if (from < 0 || from === to) return;
        const [moved] = layout.modules.splice(from, 1);
        layout.modules.splice(to, 0, moved);
        await this.plugin.saveConfig();
      };
    }
    const titleRow = card.createDiv({ cls: "hb-module-title" });
    titleRow.createEl("h2", { text: module.title || "未命名模块" });
    if (this.editing) {
      this.renderStage = `模块“${module.title || "未命名"}”：操作按钮`;
      const controls = titleRow.createDiv({ cls: "hb-module-controls" });
      const duplicate = async () => {
        const copy = clone(module);
        copy.id = newId();
        copy.title = `${module.title} 副本`;
        layout.modules.splice(layout.modules.indexOf(module) + 1, 0, copy);
        await this.plugin.saveConfig();
      };
      const remove = () => new ConfirmModal(this.app, "删除这个模块？", "模块的数据和布局将被移除。", async () => {
        layout.modules.splice(layout.modules.indexOf(module), 1);
        await this.plugin.saveConfig();
      }).open();
      const resize = async () => {
        const max = this.device() === "mobile" ? 1 : this.device() === "tablet" ? 2 : this.plugin.config.settings.gridColumns;
        module.span = ((module.span ?? 1) % max + 1) as Span;
        await this.plugin.saveConfig("调整模块宽度");
      };
      const toggleVisibility = async () => {
        const device = this.device();
        const set = new Set(module.hiddenOn ?? []);
        if (set.has(device)) set.delete(device); else set.add(device);
        module.hiddenOn = [...set];
        await this.plugin.saveConfig("更新设备可见性");
      };

      if (this.device() === "mobile") {
        const action = (label: string, handler: () => void | Promise<void>, disabled = false, warning = false) => {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = label;
          button.setAttribute("aria-label", label);
          button.disabled = disabled;
          if (warning) button.className = "mod-warning";
          button.onclick = () => void handler();
          controls.appendChild(button);
        };
        action("编辑", () => this.openModuleEditor(module));
        action("复制", duplicate);
        action("上移", () => this.move(layout, module, -1), layout.modules.indexOf(module) === 0);
        action("下移", () => this.move(layout, module, 1), layout.modules.indexOf(module) === layout.modules.length - 1);
        action("删除", remove, false, true);
        action(hidden ? "显示" : "隐藏", toggleVisibility);
      } else {
        const action = (icon: string, label: string) => {
          const button = new ButtonComponent(controls).setTooltip(label).setIcon(icon);
          button.buttonEl.setAttribute("aria-label", label);
          return button;
        };
        const index = layout.modules.indexOf(module);
        const columns = this.device() === "tablet" ? 2 : this.plugin.config.settings.gridColumns;
        action("pencil", "编辑").onClick(() => this.openModuleEditor(module));
        action("copy", "复制").onClick(duplicate);
        action("arrow-left", "左移一格").setDisabled(index === 0).onClick(() => this.move(layout, module, -1));
        action("arrow-right", "右移一格").setDisabled(index === layout.modules.length - 1).onClick(() => this.move(layout, module, 1));
        action("arrow-up", "上移一行").setDisabled(index - columns < 0).onClick(() => this.move(layout, module, -columns));
        action("arrow-down", "下移一行").setDisabled(index + columns >= layout.modules.length).onClick(() => this.move(layout, module, columns));
        action("trash-2", "删除").setWarning().onClick(remove);
        action("columns-2", "调整宽度").onClick(resize);
        action(hidden ? "eye" : "eye-off", hidden ? "显示模块" : "隐藏模块").onClick(toggleVisibility);
      }
    }
    this.renderStage = `模块“${module.title || "未命名"}”：内容`;
    const body = card.createDiv({ cls: "hb-module-body" });
    // On iOS, rendering a Tasks/Dataview block while its module is being
    // inserted can throw a WebKit SyntaxError and abort the add operation.
    // Editing is for arranging/configuring modules, so defer native query
    // rendering until the user leaves edit mode.
    if (this.editing && (module.kind === "markdown" || module.kind === "bookshelf" || module.kind === "assets" || module.kind === "aiusage")) {
      const label = module.queryKind === "tasks" ? "任务清单" : module.queryKind === "dataview" ? "Dataview 表格" : module.kind === "markdown" ? "查询" : "数据";
      body.createEl("p", { text: `${label}模块已添加。可使用上方按钮编辑、方向移动或删除；点“完成编辑”后再预览内容。`, cls: "hb-muted" });
      return;
    }
    if (module.kind === "shortcuts") {
      const shortcuts = body.createDiv({ cls: "hb-shortcuts" });
      for (const item of module.shortcuts ?? []) {
        const link = new ButtonComponent(shortcuts).setButtonText(item.label).setClass("hb-shortcut");
        if (item.icon) link.setIcon(item.icon);
        const button = link.buttonEl;
        button.setAttribute("aria-label", `打开 ${item.label}`);
        button.onclick = () => void this.openTarget(item.target);
      }
      if (!(module.shortcuts?.length)) body.createEl("p", { text: "点编辑模块添加链接。", cls: "hb-muted" });
    } else if (module.kind === "text") {
      body.createEl("p", { text: module.text ?? "", cls: "hb-text" });
    } else if (module.kind === "calendar") {
      this.renderCalendar(body, module);
    } else if (module.kind === "countdown") {
      this.renderCountdown(body, module);
    } else if (module.kind === "image") {
      const path = module.options?.imagePath ?? "";
      if (path) {
        const image = body.createEl("img", { cls: "hb-content-image", attr: { src: vaultImageUrl(this.app, path), alt: module.options?.imageAlt || module.title, loading: "lazy" } });
        image.classList.add(`hb-image-${module.options?.imageFit ?? "cover"}`);
      }
      else body.createEl("p", { text: "点编辑模块选择图片。", cls: "hb-muted" });
    } else if (module.kind === "weather") {
      const weather = body.createDiv({ cls: "hb-weather" });
      weather.createEl("strong", { text: module.options?.weatherTemperature || "--°" });
      const description = weather.createDiv();
      description.createEl("span", { text: module.options?.weatherText || "未填写天气" });
      description.createEl("small", { text: module.options?.weatherLocation || "当前位置" });
      if (module.options?.weatherUpdatedAt) description.createEl("small", { text: `更新于 ${new Date(module.options.weatherUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` });
      if (module.options?.weatherError) description.createEl("small", { text: module.options.weatherError, cls: "hb-weather-error" });
      if (module.options?.weatherMode === "auto") {
        const refresh = new ButtonComponent(weather).setIcon("refresh-cw").setTooltip("刷新天气");
        refresh.buttonEl.setAttribute("aria-label", "刷新天气");
        refresh.onClick(() => void this.plugin.refreshWeather(module, true));
        void this.plugin.refreshWeather(module);
      }
    } else if (module.kind === "bookshelf" || module.kind === "assets" || module.kind === "aiusage") {
      const markdown = module.kind === "bookshelf"
        ? `\`\`\`dataview\nTABLE WITHOUT ID file.link AS 书籍, reading-progress AS 进度\nFROM \"${module.options?.shelfPath || "05_Books/epub-bookmarks"}\"\nWHERE reading-progress\nSORT reading-progress DESC\nLIMIT 6\n\`\`\``
        : module.kind === "assets"
          ? `\`\`\`dataview\nTABLE WITHOUT ID file.link AS 资产, expire AS 到期日\nFROM \"${module.options?.assetPath || "09_数字资产/资产"}\"\nSORT expire ASC\nLIMIT 6\n\`\`\``
          : `\`\`\`dataview\nTABLE WITHOUT ID balance AS 余额, totalUsed AS 累计消耗, updated AS 同步时间\nFROM \"${module.options?.usagePath || "03_生活记录/05_AI用量"}\"\nLIMIT 1\n\`\`\``;
      await MarkdownRenderer.render(this.app, markdown, body, this.plugin.config.configPath, this);
    } else {
      try {
        await MarkdownRenderer.render(this.app, module.markdown ?? "", body, this.plugin.config.configPath, this);
      } catch (error) {
        body.createEl("pre", { text: `查询渲染失败：${String(error)}`, cls: "hb-error" });
      }
    }
  }

  private renderCountdown(body: HTMLElement, module: HomeModule) {
    const target = module.options?.targetDate;
    const result = body.createDiv({ cls: "hb-countdown" });
    if (!target || Number.isNaN(new Date(target).getTime())) {
      result.setText("请在编辑模块中填写目标日期。");
      return;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = new Date(`${target}T00:00:00`);
    const amount = Math.round((day.getTime() - today.getTime()) / 86400000);
    result.createEl("strong", { text: amount >= 0 ? `${amount}` : `${Math.abs(amount)}` });
    result.createEl("span", { text: amount >= 0 ? "天后" : "天前" });
    result.createEl("small", { text: module.options?.label || target });
  }

  private renderCalendar(body: HTMLElement, module: HomeModule) {
    const offset = this.calendarOffsets.get(module.id) ?? 0;
    const shown = new Date(); shown.setDate(1); shown.setMonth(shown.getMonth() + offset);
    const top = body.createDiv({ cls: "hb-calendar-head" });
    const previous = new ButtonComponent(top).setIcon("chevron-left").setTooltip("上个月");
    previous.onClick(async () => { this.calendarOffsets.set(module.id, offset - 1); await this.render(); });
    top.createEl("strong", { text: `${shown.getFullYear()} 年 ${shown.getMonth() + 1} 月` });
    const next = new ButtonComponent(top).setIcon("chevron-right").setTooltip("下个月");
    next.onClick(async () => { this.calendarOffsets.set(module.id, offset + 1); await this.render(); });
    const days = body.createDiv({ cls: "hb-calendar" });
    const calendarStyle = module.options?.calendarStyle ?? "minimal";
    const weekStart = module.options?.calendarWeekStart ?? 0;
    const dayShape = module.options?.calendarDayShape ?? "rounded";
    days.classList.add(`hb-calendar-${calendarStyle}`, `hb-calendar-shape-${dayShape}`);
    days.style.setProperty("--hb-calendar-accent", module.options?.calendarAccent || "var(--hb-accent)");
    const weekLabels = weekStart === 1 ? ["一", "二", "三", "四", "五", "六", "日"] : ["日", "一", "二", "三", "四", "五", "六"];
    for (const label of weekLabels) days.createEl("span", { text: label, cls: "hb-calendar-weekday" });
    const leadingEmpty = (shown.getDay() - weekStart + 7) % 7;
    for (let empty = 0; empty < leadingEmpty; empty++) days.createEl("span", { cls: "hb-calendar-empty" });
    const total = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
    const today = new Date();
    for (let day = 1; day <= total; day++) {
      const date = new Date(shown.getFullYear(), shown.getMonth(), day);
      const path = `${module.options?.dailyFolder || "02_日历/每日"}/${date.toISOString().slice(0, 10)}`;
      const button = days.createEl("button", { text: String(day), cls: "hb-calendar-day" });
      button.setAttribute("aria-label", `打开 ${path}`);
      if (date.toDateString() === today.toDateString()) button.addClass("is-today");
      if (date.getDay() === 0 || date.getDay() === 6) button.addClass("is-weekend");
      button.onclick = () => void this.app.workspace.openLinkText(path, this.plugin.config.configPath, true);
    }
  }

  private async openTarget(target: string) {
    if (isExternalUrl(target)) { window.open(target, "_blank", "noopener"); return; }
    const file = this.app.metadataCache.getFirstLinkpathDest(target, this.plugin.config.configPath);
    if (file instanceof TFile) await this.app.workspace.getLeaf("tab").openFile(file);
    else {
      await this.app.workspace.openLinkText(target, this.plugin.config.configPath, true);
      new Notice(`未找到现有笔记，已尝试打开：${target}`);
    }
  }

  private async move(layout: Layout, module: HomeModule, delta: number) {
    const index = layout.modules.indexOf(module);
    const next = index + delta;
    if (next < 0 || next >= layout.modules.length) return;
    [layout.modules[index], layout.modules[next]] = [layout.modules[next], layout.modules[index]];
    await this.plugin.saveConfig();
  }

  private openModuleEditor(module: HomeModule) {
    new ModuleModal(this.app, module, async () => await this.plugin.saveConfig()).open();
  }
}

class ModuleModal extends Modal {
  constructor(private appRef: App, private module: HomeModule, private onSave: () => Promise<void>) { super(appRef); }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("hb-modal");
    contentEl.createEl("h2", { text: "编辑模块" });
    new Setting(contentEl).setName("标题").addText((text) => text.setValue(this.module.title).onChange((value) => this.module.title = value));
    if (this.module.kind === "markdown") {
      if (this.module.queryKind === "tasks" || this.module.queryKind === "dataview") {
        const isTasks = this.module.queryKind === "tasks";
        this.module.query ??= { limit: 8 };
        new Setting(contentEl).setName(isTasks ? "任务来源目录" : "Dataview 来源目录").setDesc("留空则查询整个库。")
          .addText((text) => text.setPlaceholder("例如：06_Todo").setValue(this.module.query?.path ?? "").onChange((value) => {
            this.module.query!.path = value.trim();
            this.module.markdown = isTasks ? taskMarkdown(this.module.query) : dataviewMarkdown(this.module.query);
          }));
        if (isTasks) {
          new Setting(contentEl).setName("标签筛选").setDesc("可选，例如：#工作").addText((text) => text.setValue(this.module.query?.tag ?? "").onChange((value) => {
            this.module.query!.tag = value.trim(); this.module.markdown = taskMarkdown(this.module.query);
          }));
          new Setting(contentEl).setName("完成状态").addDropdown((drop) => drop.addOption("false", "仅未完成").addOption("true", "包含已完成").setValue(String(this.module.query?.showCompleted ?? false)).onChange((value) => {
            this.module.query!.showCompleted = value === "true"; this.module.markdown = taskMarkdown(this.module.query);
          }));
          new Setting(contentEl).setName("到期日").addDropdown((drop) => drop.addOption("any", "不限").addOption("today", "今天").addOption("overdue", "已逾期").addOption("today-or-overdue", "今天与逾期").addOption("future", "未来").setValue(this.module.query?.due ?? "any").onChange((value) => {
            this.module.query!.due = value as NonNullable<HomeModule["query"]>["due"]; this.module.markdown = taskMarkdown(this.module.query);
          }));
          new Setting(contentEl).setName("优先级").addDropdown((drop) => drop.addOption("any", "不限").addOption("highest", "最高").addOption("high", "高").addOption("medium", "中").addOption("low", "低").addOption("lowest", "最低").setValue(this.module.query?.priority ?? "any").onChange((value) => {
            this.module.query!.priority = value as NonNullable<HomeModule["query"]>["priority"]; this.module.markdown = taskMarkdown(this.module.query);
          }));
          new Setting(contentEl).setName("排序").addDropdown((drop) => drop.addOption("none", "默认").addOption("due", "到期日").addOption("priority", "优先级").addOption("created", "创建时间").addOption("path", "路径").setValue(this.module.query?.sort ?? "none").onChange((value) => {
            this.module.query!.sort = value as NonNullable<HomeModule["query"]>["sort"]; this.module.markdown = taskMarkdown(this.module.query);
          }));
          new Setting(contentEl).setName("重复任务").addDropdown((drop) => drop.addOption("any", "不限").addOption("only", "仅重复任务").addOption("exclude", "排除重复任务").setValue(this.module.query?.recurring ?? "any").onChange((value) => {
            this.module.query!.recurring = value as NonNullable<HomeModule["query"]>["recurring"]; this.module.markdown = taskMarkdown(this.module.query);
          }));
        } else {
          new Setting(contentEl).setName("视图").addDropdown((drop) => drop.addOption("table", "表格").addOption("list", "列表").addOption("task", "任务").setValue(this.module.query?.dataviewView ?? "table").onChange((value) => {
            this.module.query!.dataviewView = value as NonNullable<HomeModule["query"]>["dataviewView"]; this.module.markdown = dataviewMarkdown(this.module.query);
          }));
          new Setting(contentEl).setName("常用预设").setDesc("选中后可继续修改来源目录。").addDropdown((drop) => drop.addOption("", "不使用").addOption("reading", "阅读进度").addOption("assets", "数字资产").addOption("life", "生活记录").addOption("aiusage", "AI 用量").addOption("calendar", "最近日记").setValue(this.module.query?.preset ?? "").onChange((value) => {
            this.module.query!.preset = value;
            if (value) this.module.markdown = presetMarkdown(value);
          }));
        }
        new Setting(contentEl).setName("最多显示").addSlider((slider) => slider.setLimits(1, 30, 1).setValue(this.module.query?.limit ?? 8).setDynamicTooltip().onChange((value) => {
          this.module.query!.limit = value;
          this.module.markdown = isTasks ? taskMarkdown(this.module.query) : dataviewMarkdown(this.module.query);
        }));
        contentEl.createEl("p", { text: "该模块仍由原生 Tasks/Dataview 插件渲染；点击保存后可立即预览。", cls: "setting-item-description" });
      } else {
        new Setting(contentEl).setName("查询或 Markdown").setDesc("可直接粘贴 Tasks、Dataview 或 DataviewJS 代码块。");
        const area = contentEl.createEl("textarea", { cls: "hb-textarea" });
        area.value = this.module.markdown ?? "";
        area.oninput = () => this.module.markdown = area.value;
        new Setting(contentEl).setName("引用现有查询区块").setDesc("扫描库内 Dataview、DataviewJS 和 Tasks 代码块；引用时复制代码，不会修改原笔记。")
          .addButton((button) => button.setButtonText("选择查询区块").onClick(() => new QueryBlockPickerModal(this.appRef, (markdown) => { this.module.markdown = markdown; area.value = markdown; }).open()));
      }
    } else if (this.module.kind === "text") {
      new Setting(contentEl).setName("正文");
      const area = contentEl.createEl("textarea", { cls: "hb-textarea" });
      area.value = this.module.text ?? "";
      area.oninput = () => this.module.text = area.value;
    } else if (this.module.kind === "shortcuts") {
      new Setting(contentEl).setName("快捷链接").setDesc("每行格式：显示名称 | 笔记路径或链接");
      const area = contentEl.createEl("textarea", { cls: "hb-textarea" });
      area.value = (this.module.shortcuts ?? []).map((item) => `${item.label} | ${item.target}`).join("\n");
      area.oninput = () => {
        this.module.shortcuts = area.value.split("\n").map((line) => line.split("|").map((part) => part.trim()))
          .filter(([label, target]) => label && target).map(([label, target]) => ({ label, target }));
      };
      new Setting(contentEl).setName("从库中添加").setDesc("选择笔记或文件夹后会追加到快捷入口。")
        .addButton((button) => button.setButtonText("选择文件或文件夹").onClick(() => new VaultPickerModal(this.appRef, "选择快捷入口", "all", (path) => {
          const label = path.split("/").pop()?.replace(/\.md$/i, "") || path;
          this.module.shortcuts = [...(this.module.shortcuts ?? []), { label, target: path, icon: "file-text" }];
          area.value = (this.module.shortcuts ?? []).map((item) => `${item.label} | ${item.target}`).join("\n");
        }).open()));
      new Setting(contentEl).setName("统一设置图标").setDesc("为当前快捷入口统一设置 Lucide 图标；后续可在 JSON 中逐项微调。")
        .addDropdown((drop) => drop.addOption("file-text", "笔记").addOption("folder", "文件夹").addOption("external-link", "外链").addOption("calendar", "日历").addOption("book-open", "阅读").setValue(this.module.shortcuts?.[0]?.icon ?? "file-text").onChange((value) => {
          this.module.shortcuts = (this.module.shortcuts ?? []).map((item) => ({ ...item, icon: value }));
        }));
    } else if (this.module.kind === "calendar") {
      this.module.options ??= {};
      new Setting(contentEl).setName("每日笔记目录").setDesc("点击日期时打开该目录下的 YYYY-MM-DD 笔记。")
        .addText((text) => text.setValue(this.module.options?.dailyFolder ?? "02_日历/每日").onChange((value) => this.module.options!.dailyFolder = value.trim()));
      new Setting(contentEl).setName("选择目录").addButton((button) => button.setButtonText("浏览库内文件夹").onClick(() => new VaultPickerModal(this.appRef, "选择每日笔记目录", "folder", (path) => this.module.options!.dailyFolder = path).open()));
      new Setting(contentEl).setName("日期底色与密度").setDesc("无底色只高亮今天；方格底色会给每个日期加背景。").addDropdown((drop) => drop
        .addOption("minimal", "无底色（标准）")
        .addOption("boxed", "方格底色")
        .addOption("compact", "无底色（紧凑）")
        .setValue(this.module.options?.calendarStyle ?? "minimal")
        .onChange((value) => this.module.options!.calendarStyle = value as NonNullable<HomeModule["options"]>["calendarStyle"]));
      new Setting(contentEl).setName("一周开始日").addDropdown((drop) => drop
        .addOption("0", "周日")
        .addOption("1", "周一")
        .setValue(String(this.module.options?.calendarWeekStart ?? 0))
        .onChange((value) => this.module.options!.calendarWeekStart = Number(value) as 0 | 1));
      addColorControl(new Setting(contentEl).setName("今日颜色").setDesc("右侧编号可复制到其它模块。"), this.module.options?.calendarAccent ?? "#7C3AED", (value) => this.module.options!.calendarAccent = value);
      new Setting(contentEl).setName("日期形状").setDesc("仅在“方格底色”模式生效；无底色模式不会显示方块。").addDropdown((drop) => drop
        .addOption("rounded", "圆角方块")
        .addOption("circle", "圆形")
        .addOption("square", "直角方块")
        .setValue(this.module.options?.calendarDayShape ?? "rounded")
        .onChange((value) => this.module.options!.calendarDayShape = value as NonNullable<HomeModule["options"]>["calendarDayShape"]));
    } else if (this.module.kind === "countdown") {
      this.module.options ??= {};
      new Setting(contentEl).setName("说明").addText((text) => text.setValue(this.module.options?.label ?? "倒数日").onChange((value) => this.module.options!.label = value));
      new Setting(contentEl).setName("目标日期").setDesc("格式 YYYY-MM-DD。").addText((text) => text.setPlaceholder("2026-12-31").setValue(this.module.options?.targetDate ?? "").onChange((value) => this.module.options!.targetDate = value.trim()));
    } else if (this.module.kind === "image") {
      this.module.options ??= {};
      new Setting(contentEl).setName("图片路径或 URL").addText((text) => text.setValue(this.module.options?.imagePath ?? "").onChange((value) => this.module.options!.imagePath = value.trim()));
      new Setting(contentEl).setName("选择库内图片").addButton((button) => button.setButtonText("选择图片").onClick(() => new VaultPickerModal(this.appRef, "选择图片", "image", (path) => this.module.options!.imagePath = path).open()));
      new Setting(contentEl).setName("替代文字").addText((text) => text.setValue(this.module.options?.imageAlt ?? "").onChange((value) => this.module.options!.imageAlt = value));
      new Setting(contentEl).setName("显示方式").addDropdown((drop) => drop.addOption("cover", "铺满裁切").addOption("contain", "完整显示").setValue(this.module.options?.imageFit ?? "cover").onChange((value) => this.module.options!.imageFit = value as "cover" | "contain"));
    } else if (this.module.kind === "bookshelf" || this.module.kind === "assets" || this.module.kind === "aiusage") {
      this.module.options ??= {};
      const key = this.module.kind === "bookshelf" ? "shelfPath" : this.module.kind === "assets" ? "assetPath" : "usagePath";
      const fallback = this.module.kind === "bookshelf" ? "05_Books/epub-bookmarks" : this.module.kind === "assets" ? "09_数字资产/资产" : "03_生活记录/05_AI用量";
      new Setting(contentEl).setName("来源目录").setDesc("该模块仍由 Dataview 原生渲染。").addText((text) => text.setValue(this.module.options?.[key] ?? fallback).onChange((value) => (this.module.options as Record<string, string>)[key] = value.trim()));
      new Setting(contentEl).setName("选择目录").addButton((button) => button.setButtonText("浏览库内文件夹").onClick(() => new VaultPickerModal(this.appRef, "选择来源目录", "folder", (path) => (this.module.options as Record<string, string>)[key] = path).open()));
    } else if (this.module.kind === "weather") {
      this.module.options ??= {};
      new Setting(contentEl).setName("天气来源").setDesc("自动模式仅在启用后访问 Open-Meteo；不需要 API Key。")
        .addDropdown((drop) => drop.addOption("manual", "手动填写（不联网）").addOption("auto", "自动抓取（Open-Meteo）")
          .setValue(this.module.options?.weatherMode ?? "manual").onChange((value) => this.module.options!.weatherMode = value as "manual" | "auto"));
      new Setting(contentEl).setName("城市").setDesc("自动模式填写城市名，例如：上海、Tokyo。定位优先于城市。")
        .addText((text) => text.setValue(this.module.options?.weatherCity ?? "").onChange((value) => this.module.options!.weatherCity = value.trim()));
      new Setting(contentEl).setName("使用当前定位").setDesc("会请求系统位置权限，仅保存经纬度到此主页配置中。")
        .addButton((button) => button.setButtonText("授权定位").onClick(() => {
          if (!navigator.geolocation) { new Notice("当前设备不支持定位。请填写城市。"); return; }
          navigator.geolocation.getCurrentPosition((position) => {
            this.module.options!.weatherLatitude = position.coords.latitude;
            this.module.options!.weatherLongitude = position.coords.longitude;
            this.module.options!.weatherLocation = "当前定位";
            new Notice("已取得当前位置。保存后返回主页即可自动更新天气。");
          }, () => new Notice("未取得位置权限。请填写城市后再试。"), { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 });
        }));
      new Setting(contentEl).setName("地点显示名").setDesc("手动模式可填写；自动模式会在首次更新后写入匹配地点。")
        .addText((text) => text.setValue(this.module.options?.weatherLocation ?? "").onChange((value) => this.module.options!.weatherLocation = value));
      new Setting(contentEl).setName("天气描述").setDesc("仅手动模式使用。").addText((text) => text.setValue(this.module.options?.weatherText ?? "").onChange((value) => this.module.options!.weatherText = value));
      new Setting(contentEl).setName("温度").setDesc("仅手动模式使用。").addText((text) => text.setPlaceholder("25°").setValue(this.module.options?.weatherTemperature ?? "").onChange((value) => this.module.options!.weatherTemperature = value));
    }

    this.module.style ??= {};
    contentEl.createEl("h3", { text: "模块外观" });
    const backgroundSetting = new Setting(contentEl).setName("背景色").setDesc("透明会去掉当前模块的背景；右侧编号可复制。");
    const backgroundControl = addColorControl(backgroundSetting, this.module.style?.background ?? "#242134", (value) => this.module.style!.background = value);
    backgroundSetting.addButton((button) => button.setButtonText("无卡片底").onClick(() => {
      this.module.style!.background = "transparent";
      this.module.style!.borderColor = "transparent";
      this.module.style!.shadow = "none";
      backgroundControl.setText("transparent");
    }));
    backgroundSetting.addButton((button) => button.setButtonText("跟随主题").onClick(() => {
      delete this.module.style!.background;
      backgroundControl.setText("");
    }));
    const textSetting = new Setting(contentEl).setName("文字颜色").setDesc("右侧编号可复制。");
    const textControl = addColorControl(textSetting, this.module.style?.textColor ?? "#FFFFFF", (value) => this.module.style!.textColor = value);
    textSetting.addButton((button) => button.setButtonText("跟随主题").onClick(() => {
      delete this.module.style!.textColor;
      textControl.setText("");
    }));
    const borderSetting = new Setting(contentEl).setName("边框颜色").setDesc("右侧编号可复制。");
    const borderControl = addColorControl(borderSetting, this.module.style?.borderColor ?? "#4B465F", (value) => this.module.style!.borderColor = value);
    borderSetting.addButton((button) => button.setButtonText("跟随主题").onClick(() => {
      delete this.module.style!.borderColor;
      borderControl.setText("");
    }));
    new Setting(contentEl).setName("圆角").addSlider((slider) => slider
      .setLimits(0, 28, 2)
      .setValue(this.module.style?.radius ?? 16)
      .setDynamicTooltip()
      .onChange((value) => this.module.style!.radius = value));
    new Setting(contentEl).setName("阴影").addDropdown((drop) => drop
      .addOption("none", "无")
      .addOption("soft", "柔和")
      .addOption("strong", "明显")
      .setValue(this.module.style?.shadow ?? "soft")
      .onChange((value) => this.module.style!.shadow = value as NonNullable<HomeModule["style"]>["shadow"]));
    new Setting(contentEl).setName("内边距").addDropdown((drop) => drop
      .addOption("compact", "紧凑")
      .addOption("normal", "标准")
      .addOption("comfortable", "宽松")
      .setValue(this.module.style?.padding ?? "normal")
      .onChange((value) => this.module.style!.padding = value as NonNullable<HomeModule["style"]>["padding"]));
    const actions = contentEl.createDiv({ cls: "modal-button-container" });
    new ButtonComponent(actions).setButtonText("取消").onClick(() => this.close());
    new ButtonComponent(actions).setButtonText("保存").setCta().onClick(async () => { await this.onSave(); this.close(); });
  }
}

class ThemeModal extends Modal {
  constructor(private appRef: App, private plugin: HomeBuilderPlugin) { super(appRef); }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("hb-modal");
    contentEl.createEl("h2", { text: "主页外观" });
    new Setting(contentEl).setName("背景类型").addDropdown((drop) => drop
      .addOption("none", "透明 / 跟随 Obsidian")
      .addOption("color", "纯色")
      .addOption("gradient", "渐变")
      .addOption("image", "图片（库内或 URL）")
      .setValue(this.plugin.config.theme.backgroundType)
      .onChange((value) => this.plugin.config.theme.backgroundType = value as HomeConfig["theme"]["backgroundType"]));
    addColorControl(
      new Setting(contentEl).setName("纯色背景").setDesc("选色后自动切换为纯色；右侧编号可复制。"),
      isHexColor(this.plugin.config.theme.backgroundValue) ? this.plugin.config.theme.backgroundValue : "#1E1E2E",
      (value) => {
        this.plugin.config.theme.backgroundType = "color";
        this.plugin.config.theme.backgroundValue = value;
      },
    );
    new Setting(contentEl).setName("渐变预设").addDropdown((drop) => drop
      .addOption("", "不使用预设")
      .addOption("linear-gradient(145deg, #171426, #2b1f47)", "深紫夜色")
      .addOption("linear-gradient(145deg, #12212b, #193b3a)", "墨绿森林")
      .addOption("linear-gradient(145deg, #f4ece1, #e8d7c2)", "暖色纸张")
      .addOption("linear-gradient(145deg, #182235, #273c5a)", "深蓝雾面")
      .setValue("")
      .onChange((value) => {
        if (!value) return;
        this.plugin.config.theme.backgroundType = "gradient";
        this.plugin.config.theme.backgroundValue = value;
      }));
    new Setting(contentEl).setName("背景值").setDesc("纯色填 #1e1e2e；渐变填 linear-gradient(...)；图片可填库内路径或 URL。").addText((text) => text.setValue(this.plugin.config.theme.backgroundValue).onChange((value) => this.plugin.config.theme.backgroundValue = value));
    new Setting(contentEl).setName("选择库内背景图").addButton((button) => button.setButtonText("选择图片").onClick(() => new VaultPickerModal(this.appRef, "选择背景图", "image", (path) => this.plugin.config.theme.backgroundValue = path).open()));
    addColorControl(new Setting(contentEl).setName("强调色").setDesc("右侧编号可复制。"), this.plugin.config.theme.accent, (value) => this.plugin.config.theme.accent = value);
    new Setting(contentEl).setName("卡片不透明度").addSlider((slider) => slider.setLimits(.45, 1, .05).setValue(this.plugin.config.theme.cardOpacity).setDynamicTooltip().onChange((value) => this.plugin.config.theme.cardOpacity = value));
    const actions = contentEl.createDiv({ cls: "modal-button-container" });
    new ButtonComponent(actions).setButtonText("取消").onClick(() => this.close());
    new ButtonComponent(actions).setButtonText("保存").setCta().onClick(async () => { await this.plugin.saveConfig(); this.close(); });
  }
}

class BannerModal extends Modal {
  constructor(private appRef: App, private plugin: HomeBuilderPlugin) { super(appRef); }
  onOpen() {
    const { contentEl } = this;
    const banner = this.plugin.config.banner;
    contentEl.addClass("hb-modal");
    contentEl.createEl("h2", { text: "主页横幅" });
    contentEl.createEl("p", { text: "设置方法：先开启横幅 → 选择库内图片或粘贴图片 URL → 调整高度和文字遮罩 → 保存。", cls: "setting-item-description" });
    new Setting(contentEl).setName("启用横幅").setDesc("关闭后保留普通主页标题，不加载横幅图片。").addToggle((toggle) => toggle.setValue(banner.enabled).onChange((value) => banner.enabled = value));
    new Setting(contentEl).setName("图片路径或 URL").addText((text) => text.setValue(banner.imagePath).onChange((value) => banner.imagePath = value.trim()));
    new Setting(contentEl).setName("选择库内图片").addButton((button) => button.setButtonText("选择图片").onClick(() => new VaultPickerModal(this.appRef, "选择横幅图片", "image", (path) => banner.imagePath = path).open()));
    new Setting(contentEl).setName("标题").setDesc("留空时使用主页名称。").addText((text) => text.setValue(banner.title).onChange((value) => banner.title = value));
    new Setting(contentEl).setName("副标题").addText((text) => text.setValue(banner.subtitle).onChange((value) => banner.subtitle = value));
    new Setting(contentEl).setName("图片替代文字").addText((text) => text.setValue(banner.alt).onChange((value) => banner.alt = value));
    new Setting(contentEl).setName("横幅高度").addSlider((slider) => slider.setLimits(120, 420, 10).setValue(banner.height).setDynamicTooltip().onChange((value) => banner.height = value));
    new Setting(contentEl).setName("文字遮罩").addSlider((slider) => slider.setLimits(0, .85, .05).setValue(banner.overlay).setDynamicTooltip().onChange((value) => banner.overlay = value));
    new Setting(contentEl).setName("圆角").addToggle((toggle) => toggle.setValue(banner.rounded).onChange((value) => banner.rounded = value));
    const actions = contentEl.createDiv({ cls: "modal-button-container" });
    new ButtonComponent(actions).setButtonText("取消").onClick(() => this.close());
    new ButtonComponent(actions).setButtonText("保存").setCta().onClick(async () => { await this.plugin.saveConfig("更新横幅"); this.close(); });
  }
}

type PickerMode = "all" | "image" | "folder";
class VaultPickerModal extends Modal {
  private query = "";
  constructor(private appRef: App, private titleText: string, private mode: PickerMode, private onPick: (path: string) => void) { super(appRef); }
  onOpen() {
    this.contentEl.addClass("hb-modal", "hb-picker-modal");
    this.contentEl.createEl("h2", { text: this.titleText });
    const input = this.contentEl.createEl("input", { type: "search", placeholder: "搜索路径…", cls: "hb-picker-search" });
    const list = this.contentEl.createDiv({ cls: "hb-picker-list" });
    const render = () => {
      list.empty();
      const lower = this.query.toLowerCase();
      const entries = this.mode === "folder"
        ? this.appRef.vault.getAllLoadedFiles().filter((item): item is TFolder => item instanceof TFolder)
        : this.appRef.vault.getFiles().filter((file) => this.mode !== "image" || IMAGE_EXTENSIONS.has(file.extension.toLowerCase()));
      const filtered = entries.filter((item) => item.path.toLowerCase().includes(lower)).slice(0, 100);
      if (!filtered.length) list.createEl("p", { text: "没有匹配项。", cls: "hb-muted" });
      for (const item of filtered) {
        const button = list.createEl("button", { text: item.path, cls: "hb-picker-item" });
        button.setAttribute("aria-label", `选择 ${item.path}`);
        button.onclick = () => { this.onPick(item.path); this.close(); };
      }
    };
    input.oninput = () => { this.query = input.value; render(); };
    render();
  }
}

class QueryBlockPickerModal extends Modal {
  constructor(private appRef: App, private onPick: (markdown: string) => void) { super(appRef); }
  async onOpen() {
    this.contentEl.addClass("hb-modal", "hb-picker-modal");
    this.contentEl.createEl("h2", { text: "引用已有查询区块" });
    const list = this.contentEl.createDiv({ cls: "hb-picker-list" });
    const matches: Array<{ path: string; markdown: string }> = [];
    for (const file of this.appRef.vault.getMarkdownFiles()) {
      const cached = this.appRef.metadataCache.getFileCache(file);
      const content = await this.appRef.vault.cachedRead(file);
      const contentLines = content.split("\n");
      const blocks = cached?.sections?.filter((section) => section.type === "code" && /^```(?:tasks|dataview|dataviewjs)\s*$/i.test(contentLines[section.position.start.line]?.trim() ?? "")) ?? [];
      if (!blocks.length) continue;
      for (const block of blocks) {
        const lines = contentLines.slice(block.position.start.line, block.position.end.line + 1);
        const markdown = lines.join("\n");
        if (markdown.trim()) matches.push({ path: file.path, markdown });
      }
    }
    if (!matches.length) list.createEl("p", { text: "没有找到 Tasks、Dataview 或 DataviewJS 代码块。", cls: "hb-muted" });
    for (const item of matches.slice(0, 100)) {
      const button = list.createEl("button", { cls: "hb-picker-item" });
      button.createEl("strong", { text: item.path });
      button.createEl("small", { text: item.markdown.split("\n").slice(0, 2).join(" ") });
      button.onclick = () => { this.onPick(item.markdown); this.close(); };
    }
  }
}

class NewHomeModal extends Modal {
  private name = "";
  constructor(private appRef: App, private plugin: HomeBuilderPlugin) { super(appRef); }
  onOpen() {
    this.contentEl.addClass("hb-modal");
    this.contentEl.createEl("h2", { text: "新建主页" });
    this.contentEl.createEl("p", { text: "新主页默认是空白的。创建后点“添加模块”自行搭建；如需示例内容，可在编辑模式中选择“模板”。" });
    new Setting(this.contentEl).setName("主页名称").addText((text) => text.setPlaceholder("例如：工作、学习、旅行").onChange((value) => this.name = value));
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    new ButtonComponent(actions).setButtonText("取消").onClick(() => this.close());
    new ButtonComponent(actions).setButtonText("新建").setCta().onClick(async () => {
      await this.plugin.createPage(this.name);
      this.close();
    });
  }
}

class PageManagerModal extends Modal {
  constructor(private appRef: App, private plugin: HomeBuilderPlugin) { super(appRef); }
  onOpen() {
    this.contentEl.addClass("hb-modal");
    this.contentEl.createEl("h2", { text: "管理主页" });
    new Setting(this.contentEl).setName("当前主页名称").addText((text) => text.setValue(this.plugin.config.pageName).onChange((value) => this.plugin.config.pageName = value)).addButton((button) => button.setButtonText("保存名称").onClick(async () => {
      await this.plugin.renamePage(this.plugin.config.pageName);
      new Notice("主页名称已更新。");
    }));
    new Setting(this.contentEl).setName("新建主页").setDesc("创建一张空白、独立的主页；可在编辑模式中导入模板。").addButton((button) => button.setButtonText("新建").setCta().onClick(() => {
      this.close();
      new NewHomeModal(this.appRef, this.plugin).open();
    }));
    new Setting(this.contentEl).setName("复制当前主页").setDesc("复制布局、模块、主题和横幅到新主页。").addButton((button) => button.setButtonText("复制").onClick(async () => {
      await this.plugin.duplicateActivePage(); this.close();
    }));
    this.contentEl.createEl("h3", { text: "主页顺序" });
    const pages = this.plugin.listPages();
    pages.forEach((page, index) => {
      new Setting(this.contentEl).setName(page.name).setDesc(page.id === this.plugin.config.pageId ? "当前主页" : "").addButton((button) => button.setIcon("arrow-up").setTooltip("上移").setDisabled(index === 0).onClick(async () => { await this.plugin.movePage(page.id, -1); this.close(); new PageManagerModal(this.appRef, this.plugin).open(); })).addButton((button) => button.setIcon("arrow-down").setTooltip("下移").setDisabled(index === pages.length - 1).onClick(async () => { await this.plugin.movePage(page.id, 1); this.close(); new PageManagerModal(this.appRef, this.plugin).open(); }));
    });
    new Setting(this.contentEl).setName("删除当前主页").setDesc("至少会保留一张主页。").addButton((button) => button.setButtonText("删除").setWarning().onClick(() => new ConfirmModal(this.appRef, "删除当前主页？", "此主页的布局、模块和主题设置将被删除。", async () => {
      await this.plugin.deleteActivePage();
      this.close();
    }).open()));
  }
}

class TemplateModal extends Modal {
  constructor(private appRef: App, private plugin: HomeBuilderPlugin) { super(appRef); }
  onOpen() {
    this.contentEl.addClass("hb-modal");
    this.contentEl.createEl("h2", { text: "选择主页模板" });
    const choices: Array<["xiaoxin" | "focus" | "blank", string, string]> = [
      ["xiaoxin", "小新知识库", "快捷入口、今日待办和阅读进度"],
      ["focus", "专注极简", "大号今日待办与少量常用入口"],
      ["blank", "空白主页", "从零添加自己的模块"],
    ];
    for (const [id, title, description] of choices) {
      new Setting(this.contentEl).setName(title).setDesc(description).addButton((button) => button.setButtonText("应用").onClick(() => new ConfirmModal(this.appRef, `应用“${title}”模板？`, "会替换当前主页的三端模块布局。", async () => {
        await this.plugin.applyTemplate(id);
        this.close();
      }).open()));
    }
  }
}

class LayoutTransferModal extends Modal {
  constructor(private appRef: App, private plugin: HomeBuilderPlugin, private device: Device) { super(appRef); }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("hb-modal");
    contentEl.createEl("h2", { text: "模块导入与导出" });
    contentEl.createEl("p", { text: "导出内容可以保存到任意笔记或分享给其他 Home Builder 用户；导入会追加到当前设备布局。", cls: "setting-item-description" });
    const exported = contentEl.createEl("textarea", { cls: "hb-textarea" });
    exported.value = JSON.stringify(this.plugin.resolvedLayout(this.device).modules, null, 2);
    new Setting(contentEl).setName("导出当前布局").addButton((button) => button.setButtonText("复制 JSON").onClick(async () => {
      await navigator.clipboard?.writeText(exported.value);
      new Notice("模块 JSON 已复制。 ");
    }));
    contentEl.createEl("h3", { text: "导入模块" });
    const imported = contentEl.createEl("textarea", { cls: "hb-textarea", placeholder: "粘贴 Home Builder 模块 JSON…" });
    new ButtonComponent(contentEl).setButtonText("导入并追加模块").setCta().onClick(async () => {
      try {
        const parsed = JSON.parse(imported.value) as HomeModule[] | Layout;
        const modules = Array.isArray(parsed) ? parsed : parsed.modules;
        if (!Array.isArray(modules)) throw new Error("JSON 中没有 modules 数组");
        this.plugin.resolvedLayout(this.device).modules.push(...clone(modules).map((item) => ({ ...item, id: newId() })));
        await this.plugin.saveConfig("导入模块");
        new Notice(`已导入 ${modules.length} 个模块。`);
        this.close();
      } catch (error) { new Notice(`无法导入：${String(error)}`); }
    });
  }
}

class ConfirmModal extends Modal {
  constructor(private appRef: App, private titleText: string, private description: string, private confirm: () => void | Promise<void>) { super(appRef); }
  onOpen() {
    this.contentEl.createEl("h2", { text: this.titleText });
    this.contentEl.createEl("p", { text: this.description });
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    new ButtonComponent(actions).setButtonText("取消").onClick(() => this.close());
    new ButtonComponent(actions).setButtonText("确认").setWarning().onClick(async () => { await this.confirm(); this.close(); });
  }
}

class HomeBuilderSettings extends PluginSettingTab {
  constructor(app: App, private plugin: HomeBuilderPlugin) { super(app, plugin); }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Home Builder 设置" });
    new Setting(containerEl).setName("配置文件路径").setDesc("该 JSON 位于库内，可被 Obsidian 同步方案同步。修改后保存即会迁移到新路径。")
      .addText((text) => text.setValue(this.plugin.config.configPath).onChange((value) => this.plugin.config.configPath = value.trim() || DEFAULT_CONFIG_PATH));
    new Setting(containerEl).setName("布局模式").setDesc("独立：三端分别编辑；共享：统一响应式；混合：可为设备保留覆写。")
      .addDropdown((drop) => drop.addOption("independent", "独立布局").addOption("shared", "共享响应式布局").addOption("hybrid", "混合布局").setValue(this.plugin.config.layoutMode).onChange((value) => this.plugin.config.layoutMode = value as LayoutMode));
    new Setting(containerEl).setName("桌面网格列数").setDesc("手机始终单列，Pad 固定双列；电脑可选 2、3 或 4 列。")
      .addDropdown((drop) => drop.addOption("2", "2 列").addOption("3", "3 列").addOption("4", "4 列").setValue(String(this.plugin.config.settings.gridColumns)).onChange((value) => this.plugin.config.settings.gridColumns = Number(value) as 2 | 3 | 4));
    new Setting(containerEl).setName("启动时打开 Home Builder").setDesc("可选。开启后会在 Obsidian 布局就绪时打开指定主页；不会修改 Homepage 插件的配置。")
      .addToggle((toggle) => toggle.setValue(this.plugin.config.settings.openOnStartup).onChange((value) => this.plugin.config.settings.openOnStartup = value));
    new Setting(containerEl).setName("启动主页").setDesc("仅在开启启动主页后生效。").addDropdown((drop) => {
      drop.addOption("", "当前主页");
      for (const page of this.plugin.listPages()) drop.addOption(page.id, page.name);
      return drop.setValue(this.plugin.config.settings.startupPageId).onChange((value) => this.plugin.config.settings.startupPageId = value);
    });
    new Setting(containerEl).setName("同步冲突处理").setDesc("当 S3 或其他设备改写库内 JSON 时，先重新读取或从历史恢复；不会静默覆盖。")
      .addButton((button) => button.setButtonText("重新读取库内配置").onClick(() => void this.plugin.reloadConfigFromVault()))
      .addButton((button) => button.setButtonText("查看历史版本").onClick(() => new HistoryModal(this.app, this.plugin).open()));
    new Setting(containerEl).addButton((button) => button.setButtonText("保存设置").setCta().onClick(async () => { await this.plugin.saveConfig("更新设置"); new Notice("Home Builder 设置已保存。"); }));
  }
}

class HistoryModal extends Modal {
  constructor(private appRef: App, private plugin: HomeBuilderPlugin) { super(appRef); }
  onOpen() {
    this.contentEl.addClass("hb-modal");
    this.contentEl.createEl("h2", { text: "主页配置历史" });
    const entries = this.plugin.config.history ?? [];
    if (!entries.length) this.contentEl.createEl("p", { text: "暂无历史版本。每次保存主页配置会保留最近 10 次快照。", cls: "hb-muted" });
    [...entries].reverse().forEach((entry, reverseIndex) => {
      const index = entries.length - 1 - reverseIndex;
      new Setting(this.contentEl).setName(new Date(entry.at).toLocaleString()).setDesc(entry.reason).addButton((button) => button.setButtonText("恢复此版本").setWarning().onClick(() => new ConfirmModal(this.appRef, "恢复这个历史版本？", "会替换当前主页配置，并自动保留一份新的恢复前快照。", async () => { await this.plugin.restoreHistory(index); this.close(); }).open()));
    });
  }
}
