"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => HomeBuilderPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var VIEW_TYPE_HOME_BUILDER = "home-builder-view";
var DEFAULT_CONFIG_PATH = "Home Builder/home-builder.json";
var newId = () => `hb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
var clone = (value) => JSON.parse(JSON.stringify(value));
var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"]);
var isExternalUrl = (value) => /^(https?:)?\/\//i.test(value);
function vaultImageUrl(app, path) {
  if (!path || isExternalUrl(path)) return path;
  const file = app.vault.getAbstractFileByPath(path);
  return file instanceof import_obsidian.TFile ? app.vault.getResourcePath(file) : path;
}
function taskPriorityLine(priority) {
  const map = {
    highest: "priority is highest",
    high: "priority is high",
    medium: "priority is medium",
    low: "priority is low",
    lowest: "priority is lowest"
  };
  return priority ? map[priority] : void 0;
}
function taskMarkdown(query) {
  const lines = [(query == null ? void 0 : query.showCompleted) ? "" : "not done"].filter(Boolean);
  if (query == null ? void 0 : query.path) lines.push(`path includes ${query.path}`);
  if (query == null ? void 0 : query.tag) lines.push(`tags include ${query.tag.startsWith("#") ? query.tag : `#${query.tag}`}`);
  const due = {
    today: "due on today",
    overdue: "due before today",
    "today-or-overdue": "due on or before today",
    future: "due after today"
  };
  if ((query == null ? void 0 : query.due) && due[query.due]) lines.push(due[query.due]);
  const priority = taskPriorityLine(query == null ? void 0 : query.priority);
  if (priority) lines.push(priority);
  if ((query == null ? void 0 : query.recurring) === "only") lines.push("is recurring");
  if ((query == null ? void 0 : query.recurring) === "exclude") lines.push("is not recurring");
  const sort = { due: "sort by due", priority: "sort by priority", created: "sort by created", path: "sort by path" };
  if ((query == null ? void 0 : query.sort) && sort[query.sort]) lines.push(sort[query.sort]);
  if (query == null ? void 0 : query.limit) lines.push(`limit ${query.limit}`);
  return `\`\`\`tasks
${lines.join("\n")}
\`\`\``;
}
function dataviewMarkdown(query) {
  var _a;
  const source = (query == null ? void 0 : query.path) ? `FROM "${query.path}"` : 'FROM ""';
  const limit = (query == null ? void 0 : query.limit) ? `
LIMIT ${query.limit}` : "";
  const view = (_a = query == null ? void 0 : query.dataviewView) != null ? _a : "table";
  const body = view === "list" ? "LIST file.link" : view === "task" ? "TASK" : "TABLE WITHOUT ID file.link AS \u7B14\u8BB0";
  return `\`\`\`dataview
${body}
${source}${limit}
\`\`\``;
}
function presetMarkdown(preset) {
  var _a;
  const presets = {
    reading: '```dataview\nTABLE WITHOUT ID file.link AS \u4E66\u7C4D, reading-progress AS \u8FDB\u5EA6\nFROM "05_Books/epub-bookmarks"\nWHERE reading-progress\nSORT reading-progress DESC\nLIMIT 6\n```',
    assets: '```dataview\nTABLE WITHOUT ID file.link AS \u8D44\u4EA7, expire AS \u5230\u671F\u65E5, status AS \u72B6\u6001\nFROM "09_\u6570\u5B57\u8D44\u4EA7/\u8D44\u4EA7"\nSORT expire ASC\nLIMIT 8\n```',
    life: '```dataview\nLIST FROM "03_\u751F\u6D3B\u8BB0\u5F55"\nSORT file.mtime DESC\nLIMIT 8\n```',
    aiusage: '```dataview\nTABLE WITHOUT ID balance AS \u4F59\u989D, totalUsed AS \u7D2F\u8BA1\u6D88\u8017, updated AS \u540C\u6B65\u65F6\u95F4\nFROM "03_\u751F\u6D3B\u8BB0\u5F55/05_AI\u7528\u91CF"\nLIMIT 1\n```',
    calendar: '```dataview\nLIST FROM "02_\u65E5\u5386/\u6BCF\u65E5"\nSORT file.name DESC\nLIMIT 7\n```'
  };
  return (_a = presets[preset]) != null ? _a : "";
}
function weatherDescription(code) {
  var _a;
  const labels = {
    0: "\u6674",
    1: "\u5927\u90E8\u6674\u6717",
    2: "\u5C40\u90E8\u591A\u4E91",
    3: "\u9634",
    45: "\u96FE",
    48: "\u96FE\u51C7",
    51: "\u6BDB\u6BDB\u96E8",
    53: "\u6BDB\u6BDB\u96E8",
    55: "\u6BDB\u6BDB\u96E8",
    56: "\u51BB\u6BDB\u6BDB\u96E8",
    57: "\u51BB\u6BDB\u6BDB\u96E8",
    61: "\u5C0F\u96E8",
    63: "\u4E2D\u96E8",
    65: "\u5927\u96E8",
    66: "\u51BB\u96E8",
    67: "\u51BB\u96E8",
    71: "\u5C0F\u96EA",
    73: "\u4E2D\u96EA",
    75: "\u5927\u96EA",
    77: "\u96EA\u7C92",
    80: "\u9635\u96E8",
    81: "\u9635\u96E8",
    82: "\u5F3A\u9635\u96E8",
    85: "\u9635\u96EA",
    86: "\u5F3A\u9635\u96EA",
    95: "\u96F7\u66B4",
    96: "\u96F7\u66B4\u4F34\u51B0\u96F9",
    99: "\u5F3A\u96F7\u66B4\u4F34\u51B0\u96F9"
  };
  return (_a = labels[code]) != null ? _a : "\u5929\u6C14\u6570\u636E\u6682\u4E0D\u53EF\u7528";
}
function starterModules() {
  return [
    {
      id: newId(),
      kind: "shortcuts",
      title: "\u5FEB\u6377\u5165\u53E3",
      span: 2,
      shortcuts: [
        { label: "\u4ECA\u5929", target: "02_\u65E5\u5386/\u6BCF\u65E5" },
        { label: "\u5F85\u529E", target: "06_Todo/Todo\u603B\u89C8" },
        { label: "\u9605\u8BFB", target: "05_Books/\u9605\u8BFB\u603B\u89C8" },
        { label: "\u751F\u6D3B", target: "03_\u751F\u6D3B\u8BB0\u5F55/\u751F\u6D3B\u603B\u89C8" }
      ]
    },
    {
      id: newId(),
      kind: "markdown",
      title: "\u4ECA\u65E5\u5F85\u529E",
      span: 1,
      markdown: "```tasks\nnot done\ndue on or before today\nshort mode\n```"
    },
    {
      id: newId(),
      kind: "markdown",
      title: "\u9605\u8BFB\u8FDB\u5EA6",
      span: 1,
      markdown: '```dataview\nTABLE WITHOUT ID file.link AS \u4E66\u7C4D, reading-progress AS \u8FDB\u5EA6\nFROM \\"05_Books/epub-bookmarks\\"\nWHERE reading-progress\nSORT reading-progress DESC\nLIMIT 5\n```'
    }
  ];
}
function focusModules() {
  return [
    { id: newId(), kind: "markdown", title: "\u4ECA\u65E5\u5F85\u529E", span: 2, queryKind: "tasks", query: { limit: 10 }, markdown: taskMarkdown({ limit: 10 }) },
    { id: newId(), kind: "shortcuts", title: "\u5E38\u7528\u5165\u53E3", span: 1, shortcuts: [] }
  ];
}
function defaultConfig() {
  return {
    version: 2,
    layoutMode: "independent",
    configPath: DEFAULT_CONFIG_PATH,
    pageId: newId(),
    pageName: "\u4E3B\u9875",
    pageOrder: [],
    savedPages: [],
    theme: { backgroundType: "none", backgroundValue: "", accent: "#7c3aed", cardOpacity: 0.88 },
    banner: { enabled: false, imagePath: "", title: "", subtitle: "", alt: "\u4E3B\u9875\u6A2A\u5E45\u56FE\u7247", height: 220, overlay: 0.42, rounded: true },
    settings: { openOnStartup: false, startupPageId: "", gridColumns: 2 },
    history: [],
    layouts: {
      mobile: { modules: starterModules() },
      tablet: { modules: starterModules() },
      desktop: { modules: starterModules() }
    }
  };
}
var HomeBuilderPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.config = defaultConfig();
    this.lastSavedConfig = "";
  }
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
    var _a;
    const leaf = (_a = this.app.workspace.getLeavesOfType(VIEW_TYPE_HOME_BUILDER)[0]) != null ? _a : this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE_HOME_BUILDER, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
  async openConfiguredStartupPage() {
    const id = this.config.settings.startupPageId;
    if (id && id !== this.config.pageId && this.config.savedPages.some((page) => page.id === id)) await this.switchPage(id);
    await this.openHome();
  }
  async refreshWeather(module2, force = false) {
    var _a, _b, _c, _d, _e;
    if (module2.kind !== "weather") return;
    (_a = module2.options) != null ? _a : module2.options = {};
    const options = module2.options;
    if (options.weatherMode !== "auto") return;
    const last = options.weatherUpdatedAt ? new Date(options.weatherUpdatedAt).getTime() : 0;
    if (!force && last && Date.now() - last < 30 * 60 * 1e3 && options.weatherTemperature) return;
    try {
      let latitude = options.weatherLatitude;
      let longitude = options.weatherLongitude;
      let location = options.weatherLocation || options.weatherCity || "\u5F53\u524D\u4F4D\u7F6E";
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        const city = (_b = options.weatherCity) == null ? void 0 : _b.trim();
        if (!city) throw new Error("\u8BF7\u586B\u5199\u57CE\u5E02\uFF0C\u6216\u4F7F\u7528\u5F53\u524D\u5B9A\u4F4D\u3002");
        const geocode = await (0, import_obsidian.requestUrl)({ url: `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json` });
        const result = (_d = (_c = geocode.json) == null ? void 0 : _c.results) == null ? void 0 : _d[0];
        if (!result) throw new Error("\u672A\u627E\u5230\u8BE5\u57CE\u5E02\uFF0C\u8BF7\u68C0\u67E5\u540D\u79F0\u3002");
        latitude = result.latitude;
        longitude = result.longitude;
        location = [result.name, result.admin1, result.country].filter(Boolean).join(" \xB7 ");
      }
      const forecast = await (0, import_obsidian.requestUrl)({ url: `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto` });
      const current = (_e = forecast.json) == null ? void 0 : _e.current;
      if (!current || typeof current.temperature_2m !== "number") throw new Error("\u5929\u6C14\u670D\u52A1\u6CA1\u6709\u8FD4\u56DE\u5F53\u524D\u6E29\u5EA6\u3002");
      options.weatherLatitude = latitude;
      options.weatherLongitude = longitude;
      options.weatherLocation = location;
      options.weatherTemperature = `${Math.round(current.temperature_2m)}\xB0C`;
      options.weatherText = weatherDescription(Number(current.weather_code));
      options.weatherUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
      options.weatherError = "";
      await this.saveConfig("\u5237\u65B0\u5929\u6C14");
    } catch (error) {
      options.weatherError = String(error).replace(/^Error:\s*/, "");
      await this.saveConfig("\u5929\u6C14\u5237\u65B0\u5931\u8D25");
      new import_obsidian.Notice(`\u5929\u6C14\u66F4\u65B0\u5931\u8D25\uFF1A${options.weatherError}`);
    }
  }
  scheduleRefresh(file) {
    if (this.refreshTimer) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      void this.refreshViews();
      if ((file == null ? void 0 : file.path) === (0, import_obsidian.normalizePath)(this.config.configPath || DEFAULT_CONFIG_PATH)) void this.detectExternalConfigChange();
    }, 300);
  }
  async detectExternalConfigChange() {
    try {
      const text = await this.app.vault.adapter.read((0, import_obsidian.normalizePath)(this.config.configPath || DEFAULT_CONFIG_PATH));
      if (text !== this.lastSavedConfig) new import_obsidian.Notice("Home Builder \u914D\u7F6E\u5DF2\u88AB\u5176\u4ED6\u8BBE\u5907\u6216\u540C\u6B65\u670D\u52A1\u4FEE\u6539\u3002\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u9009\u62E9\u91CD\u65B0\u8BFB\u53D6\u6216\u4ECE\u5386\u53F2\u6062\u590D\uFF0C\u907F\u514D\u8986\u76D6\u3002", 9e3);
    } catch (e) {
    }
  }
  getDevice() {
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }
  resolvedLayout(device) {
    if (this.config.layoutMode === "shared") return this.config.layouts.desktop;
    if (this.config.layoutMode === "hybrid") return this.config.layouts[device].modules.length ? this.config.layouts[device] : this.config.layouts.desktop;
    return this.config.layouts[device];
  }
  listPages() {
    var _a;
    const pages = [{ id: this.config.pageId, name: this.config.pageName }, ...this.config.savedPages.map(({ id, name }) => ({ id, name }))];
    const map = new Map(pages.map((page) => [page.id, page]));
    const ordered = ((_a = this.config.pageOrder) != null ? _a : []).map((id) => map.get(id)).filter((page) => Boolean(page));
    for (const page of pages) if (!ordered.some((item) => item.id === page.id)) ordered.push(page);
    return ordered;
  }
  normalizePageOrder() {
    this.config.pageOrder = this.listPages().map((page) => page.id);
  }
  activeSnapshot() {
    return {
      id: this.config.pageId,
      name: this.config.pageName,
      layoutMode: this.config.layoutMode,
      theme: clone(this.config.theme),
      banner: clone(this.config.banner),
      layouts: clone(this.config.layouts)
    };
  }
  applySnapshot(page) {
    var _a;
    this.config.pageId = page.id;
    this.config.pageName = page.name;
    this.config.layoutMode = page.layoutMode;
    this.config.theme = clone(page.theme);
    this.config.banner = clone((_a = page.banner) != null ? _a : defaultConfig().banner);
    this.config.layouts = clone(page.layouts);
  }
  async createPage(name) {
    const cleanName = name.trim() || "\u65B0\u4E3B\u9875";
    this.config.savedPages = [...this.config.savedPages.filter((page) => page.id !== this.config.pageId), this.activeSnapshot()];
    const fresh = defaultConfig();
    fresh.pageName = cleanName;
    this.config.pageId = fresh.pageId;
    this.config.pageName = fresh.pageName;
    this.config.layoutMode = fresh.layoutMode;
    this.config.theme = fresh.theme;
    this.config.banner = fresh.banner;
    this.config.layouts = fresh.layouts;
    this.config.pageOrder = [...this.config.pageOrder.filter((id) => id !== fresh.pageId), fresh.pageId];
    this.normalizePageOrder();
    await this.saveConfig();
    new import_obsidian.Notice(`\u5DF2\u65B0\u5EFA\u4E3B\u9875\uFF1A${cleanName}`);
  }
  async switchPage(id) {
    if (id === this.config.pageId) return;
    const target = this.config.savedPages.find((page) => page.id === id);
    if (!target) return;
    const current = this.activeSnapshot();
    this.config.savedPages = this.config.savedPages.map((page) => page.id === id ? current : page);
    this.applySnapshot(target);
    await this.saveConfig();
  }
  async renamePage(name) {
    this.config.pageName = name.trim() || "\u672A\u547D\u540D\u4E3B\u9875";
    await this.saveConfig();
  }
  async deleteActivePage() {
    if (!this.config.savedPages.length) {
      new import_obsidian.Notice("\u81F3\u5C11\u4FDD\u7559\u4E00\u5F20\u4E3B\u9875\u3002");
      return;
    }
    const deletedId = this.config.pageId;
    const next = this.config.savedPages[0];
    this.config.savedPages = this.config.savedPages.slice(1);
    this.applySnapshot(next);
    this.config.pageOrder = this.config.pageOrder.filter((id) => id !== deletedId);
    this.normalizePageOrder();
    await this.saveConfig();
    new import_obsidian.Notice("\u4E3B\u9875\u5DF2\u5220\u9664\u3002");
  }
  async duplicateActivePage(name) {
    const original = this.activeSnapshot();
    this.config.savedPages = [...this.config.savedPages.filter((page) => page.id !== original.id), original];
    const copy = clone(original);
    copy.id = newId();
    copy.name = (name == null ? void 0 : name.trim()) || `${original.name} \u526F\u672C`;
    this.applySnapshot(copy);
    this.config.pageOrder = [...this.config.pageOrder, copy.id];
    this.normalizePageOrder();
    await this.saveConfig("\u590D\u5236\u4E3B\u9875");
    new import_obsidian.Notice(`\u5DF2\u590D\u5236\u4E3B\u9875\uFF1A${copy.name}`);
  }
  async movePage(id, delta) {
    this.normalizePageOrder();
    const from = this.config.pageOrder.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= this.config.pageOrder.length) return;
    [this.config.pageOrder[from], this.config.pageOrder[to]] = [this.config.pageOrder[to], this.config.pageOrder[from]];
    await this.saveConfig("\u8C03\u6574\u4E3B\u9875\u987A\u5E8F");
  }
  async restoreHistory(index) {
    var _a, _b;
    const entry = (_a = this.config.history) == null ? void 0 : _a[index];
    if (!entry) return;
    try {
      const restored = JSON.parse(entry.data);
      const currentHistory = (_b = this.config.history) != null ? _b : [];
      this.config = {
        ...defaultConfig(),
        ...restored,
        configPath: this.config.configPath,
        banner: { ...defaultConfig().banner, ...restored.banner },
        settings: { ...defaultConfig().settings, ...restored.settings },
        history: currentHistory
      };
      await this.saveConfig(`\u6062\u590D\u5386\u53F2\u7248\u672C\uFF1A${entry.at}`);
      new import_obsidian.Notice("\u5DF2\u6062\u590D\u4E3B\u9875\u914D\u7F6E\u3002 ");
    } catch (error) {
      new import_obsidian.Notice(`\u65E0\u6CD5\u6062\u590D\u5386\u53F2\u914D\u7F6E\uFF1A${String(error)}`);
    }
  }
  async reloadConfigFromVault() {
    var _a, _b;
    const path = (0, import_obsidian.normalizePath)(this.config.configPath || DEFAULT_CONFIG_PATH);
    try {
      const fromVault = JSON.parse(await this.app.vault.adapter.read(path));
      const defaults = defaultConfig();
      this.config = {
        ...defaults,
        ...fromVault,
        theme: { ...defaults.theme, ...fromVault.theme },
        banner: { ...defaults.banner, ...fromVault.banner },
        settings: { ...defaults.settings, ...fromVault.settings },
        savedPages: (_a = fromVault.savedPages) != null ? _a : [],
        history: (_b = fromVault.history) != null ? _b : []
      };
      this.lastSavedConfig = JSON.stringify(fromVault, null, 2);
      await this.refreshViews();
      new import_obsidian.Notice("\u5DF2\u91CD\u65B0\u8BFB\u53D6\u5E93\u5185\u4E3B\u9875\u914D\u7F6E\u3002 ");
    } catch (error) {
      new import_obsidian.Notice(`\u65E0\u6CD5\u8BFB\u53D6\u5E93\u5185\u914D\u7F6E\uFF1A${String(error)}`);
    }
  }
  async syncLayoutFrom(device) {
    const source = clone(this.resolvedLayout(device));
    this.config.layouts = { mobile: clone(source), tablet: clone(source), desktop: clone(source) };
    await this.saveConfig();
    new import_obsidian.Notice("\u5DF2\u5C06\u5F53\u524D\u5E03\u5C40\u540C\u6B65\u5230\u624B\u673A\u3001Pad \u548C\u7535\u8111\u3002");
  }
  async loadConfig() {
    var _a, _b, _c, _d;
    const saved = await this.loadData();
    const defaults = defaultConfig();
    this.config = {
      ...defaults,
      ...saved,
      theme: { ...defaults.theme, ...saved == null ? void 0 : saved.theme },
      banner: { ...defaults.banner, ...saved == null ? void 0 : saved.banner },
      settings: { ...defaults.settings, ...saved == null ? void 0 : saved.settings },
      savedPages: (_a = saved == null ? void 0 : saved.savedPages) != null ? _a : [],
      history: (_b = saved == null ? void 0 : saved.history) != null ? _b : []
    };
    const path = (0, import_obsidian.normalizePath)(this.config.configPath || DEFAULT_CONFIG_PATH);
    try {
      if (await this.app.vault.adapter.exists(path)) {
        const rawConfig = await this.app.vault.adapter.read(path);
        const fromVault = JSON.parse(rawConfig);
        this.config = {
          ...this.config,
          ...fromVault,
          theme: { ...this.config.theme, ...fromVault.theme },
          banner: { ...this.config.banner, ...fromVault.banner },
          settings: { ...this.config.settings, ...fromVault.settings },
          savedPages: (_c = fromVault.savedPages) != null ? _c : [],
          history: (_d = fromVault.history) != null ? _d : []
        };
        this.lastSavedConfig = rawConfig;
      }
    } catch (error) {
      new import_obsidian.Notice(`Home Builder: \u65E0\u6CD5\u8BFB\u53D6\u4E3B\u9875\u914D\u7F6E\uFF1A${String(error)}`);
    }
    this.normalizePageOrder();
  }
  async saveConfig(reason = "\u7F16\u8F91\u4E3B\u9875") {
    var _a;
    this.config.savedPages = this.config.savedPages.filter((page) => page.id !== this.config.pageId);
    const path = (0, import_obsidian.normalizePath)(this.config.configPath || DEFAULT_CONFIG_PATH);
    const folder = path.split("/").slice(0, -1).join("/");
    if (folder && !this.app.vault.getAbstractFileByPath(folder)) await this.app.vault.createFolder(folder);
    const snapshot = clone(this.config);
    snapshot.history = [];
    const historyEntry = { at: (/* @__PURE__ */ new Date()).toISOString(), reason, data: JSON.stringify(snapshot) };
    this.config.history = [...((_a = this.config.history) != null ? _a : []).slice(-9), historyEntry];
    const serialized = JSON.stringify(this.config, null, 2);
    await this.app.vault.adapter.write(path, serialized);
    this.lastSavedConfig = serialized;
    await this.saveData({ configPath: path, layoutMode: this.config.layoutMode, theme: this.config.theme });
    await this.refreshViews();
  }
  async refreshViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_HOME_BUILDER)) {
      const view = leaf.view;
      if (view instanceof HomeBuilderView) await view.render();
    }
  }
  async applyTemplate(template) {
    const modules = template === "xiaoxin" ? starterModules() : template === "focus" ? focusModules() : [];
    this.config.layouts = {
      mobile: { modules: clone(modules) },
      tablet: { modules: clone(modules) },
      desktop: { modules: clone(modules) }
    };
    await this.saveConfig();
    new import_obsidian.Notice(template === "xiaoxin" ? "\u5DF2\u5BFC\u5165\u5C0F\u65B0\u77E5\u8BC6\u5E93\u6A21\u677F\u3002" : template === "focus" ? "\u5DF2\u5BFC\u5165\u4E13\u6CE8\u6A21\u677F\u3002" : "\u5DF2\u5E94\u7528\u7A7A\u767D\u4E3B\u9875\u3002");
  }
};
var HomeBuilderView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.editing = false;
    this.selectedDevice = null;
    this.calendarOffsets = /* @__PURE__ */ new Map();
  }
  getViewType() {
    return VIEW_TYPE_HOME_BUILDER;
  }
  getDisplayText() {
    return "Home Builder";
  }
  getIcon() {
    return "layout-dashboard";
  }
  async onOpen() {
    await this.render();
  }
  device() {
    var _a;
    return (_a = this.selectedDevice) != null ? _a : this.plugin.getDevice();
  }
  async render() {
    var _a;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("home-builder-view");
    const theme = this.plugin.config.theme;
    contentEl.style.setProperty("--hb-accent", theme.accent);
    contentEl.style.setProperty("--hb-card-opacity", String(theme.cardOpacity));
    contentEl.style.setProperty("--hb-columns", String(this.plugin.config.settings.gridColumns));
    contentEl.removeClasses(["hb-bg-color", "hb-bg-image", "hb-bg-gradient"]);
    if (theme.backgroundType !== "none") {
      contentEl.addClass(`hb-bg-${theme.backgroundType}`);
      if (theme.backgroundType === "image") contentEl.style.backgroundImage = `linear-gradient(rgb(var(--background-primary-rgb) / .78), rgb(var(--background-primary-rgb) / .9)), url("${vaultImageUrl(this.app, theme.backgroundValue)}")`;
      else contentEl.style.background = theme.backgroundValue;
    }
    const header = contentEl.createDiv({ cls: "hb-header" });
    const heading = header.createDiv({ cls: "hb-heading" });
    heading.createEl("h1", { text: this.plugin.config.pageName });
    heading.createEl("span", { text: this.editing ? "\u7F16\u8F91\u4E2D" : "Home Builder", cls: "hb-status" });
    const actions = header.createDiv({ cls: "hb-actions" });
    const pageSelect = actions.createEl("select", { cls: "hb-page-select", attr: { "aria-label": "\u5207\u6362\u4E3B\u9875" } });
    for (const page of this.plugin.listPages()) pageSelect.createEl("option", { text: page.name, value: page.id });
    pageSelect.value = this.plugin.config.pageId;
    pageSelect.onchange = async () => {
      await this.plugin.switchPage(pageSelect.value);
    };
    new import_obsidian.ButtonComponent(actions).setIcon("plus").setTooltip("\u65B0\u5EFA\u4E3B\u9875").onClick(() => new NewHomeModal(this.app, this.plugin).open());
    new import_obsidian.ButtonComponent(actions).setIcon("settings-2").setTooltip("\u7BA1\u7406\u4E3B\u9875").onClick(() => new PageManagerModal(this.app, this.plugin).open());
    new import_obsidian.ButtonComponent(actions).setButtonText(this.editing ? "\u5B8C\u6210\u7F16\u8F91" : "\u7F16\u8F91\u4E3B\u9875\uFF08\u6DFB\u52A0/\u5220\u9664/\u79FB\u52A8\uFF09").setCta().onClick(async () => {
      this.editing = !this.editing;
      await this.render();
    });
    if (this.editing) this.renderEditorBar(contentEl);
    else this.renderEditHint(contentEl);
    this.renderBanner(contentEl);
    const grid = contentEl.createDiv({ cls: "hb-grid" });
    const layout = this.plugin.resolvedLayout(this.device());
    if (!layout.modules.length) {
      const empty = grid.createDiv({ cls: "hb-empty" });
      empty.createEl("p", { text: "\u8FD8\u6CA1\u6709\u6A21\u5757\u3002\u5148\u5F00\u59CB\u7F16\u8F91\uFF0C\u518D\u6DFB\u52A0\u5FEB\u6377\u5165\u53E3\u3001\u4EFB\u52A1\u6216\u65E5\u5386\u3002" });
      new import_obsidian.ButtonComponent(empty).setButtonText("\u5F00\u59CB\u6DFB\u52A0\u6A21\u5757").setCta().onClick(async () => {
        this.editing = true;
        await this.render();
      });
    }
    for (const module2 of layout.modules) {
      if (this.editing || !((_a = module2.hiddenOn) == null ? void 0 : _a.includes(this.device()))) await this.renderModule(grid, module2, layout);
    }
  }
  renderEditHint(container) {
    const hint = container.createDiv({ cls: "hb-edit-hint" });
    hint.createEl("strong", { text: "\u60F3\u6539\u4E3B\u9875\uFF1F" });
    hint.createSpan({ text: " \u70B9\u4E0A\u65B9\u201C\u7F16\u8F91\u4E3B\u9875\uFF08\u6DFB\u52A0/\u5220\u9664/\u79FB\u52A8\uFF09\u201D\uFF0C\u518D\u6DFB\u52A0\u6A21\u5757\u6216\u4F7F\u7528\u6BCF\u4E2A\u6A21\u5757\u4E0B\u65B9\u7684\u64CD\u4F5C\u6309\u94AE\u3002" });
  }
  renderBanner(container) {
    const banner = this.plugin.config.banner;
    if (!banner.enabled) return;
    const el = container.createDiv({ cls: `hb-banner${banner.rounded ? " hb-banner-rounded" : ""}` });
    el.style.setProperty("--hb-banner-height", `${Math.max(120, banner.height)}px`);
    el.style.setProperty("--hb-banner-overlay", String(Math.max(0, Math.min(0.9, banner.overlay))));
    if (banner.imagePath) {
      const image = el.createEl("img", { attr: { src: vaultImageUrl(this.app, banner.imagePath), alt: banner.alt || "\u4E3B\u9875\u6A2A\u5E45\u56FE\u7247", loading: "eager" } });
      image.addClass("hb-banner-image");
    }
    el.createDiv({ cls: "hb-banner-overlay" });
    const text = el.createDiv({ cls: "hb-banner-text" });
    text.createEl("h2", { text: banner.title || this.plugin.config.pageName });
    if (banner.subtitle) text.createEl("p", { text: banner.subtitle });
  }
  renderEditorBar(container) {
    const bar = container.createDiv({ cls: "hb-editor-bar" });
    bar.createEl("strong", { text: "\u7F16\u8F91\u6A21\u5F0F" });
    bar.createSpan({ text: "\u5148\u6DFB\u52A0\u6A21\u5757\uFF1B\u6BCF\u5F20\u6A21\u5757\u4E0B\u65B9\u53EF\u7F16\u8F91\u3001\u4E0A\u79FB\u3001\u4E0B\u79FB\u6216\u5220\u9664\u3002" });
    for (const device of ["mobile", "tablet", "desktop"]) {
      new import_obsidian.ButtonComponent(bar).setButtonText(device === "mobile" ? "\u624B\u673A" : device === "tablet" ? "Pad" : "\u7535\u8111").setClass(this.device() === device ? "mod-cta" : "").onClick(async () => {
        this.selectedDevice = device;
        await this.render();
      });
    }
    const add = new import_obsidian.ButtonComponent(bar).setButtonText("+ \u6DFB\u52A0\u6A21\u5757").setCta();
    add.onClick(() => this.openAddMenu(add.buttonEl));
    new import_obsidian.ButtonComponent(bar).setButtonText("\u540C\u6B65\u5E03\u5C40").setTooltip("\u5C06\u5F53\u524D\u7F16\u8F91\u8BBE\u5907\u7684\u5E03\u5C40\u590D\u5236\u7ED9\u5176\u4ED6\u8BBE\u5907").onClick(() => new ConfirmModal(this.app, "\u540C\u6B65\u5F53\u524D\u5E03\u5C40\uFF1F", "\u4F1A\u7528\u5F53\u524D\u8BBE\u5907\u7684\u6A21\u5757\u548C\u6392\u5E8F\u8986\u76D6\u5176\u4ED6\u8BBE\u5907\u5E03\u5C40\u3002", () => this.plugin.syncLayoutFrom(this.device())).open());
    new import_obsidian.ButtonComponent(bar).setButtonText("\u4E3B\u9898").onClick(() => new ThemeModal(this.app, this.plugin).open());
    new import_obsidian.ButtonComponent(bar).setButtonText("\u6A2A\u5E45").onClick(() => new BannerModal(this.app, this.plugin).open());
    new import_obsidian.ButtonComponent(bar).setButtonText("\u6A21\u677F").onClick(() => new TemplateModal(this.app, this.plugin).open());
    new import_obsidian.ButtonComponent(bar).setButtonText("\u5BFC\u5165\u5BFC\u51FA").onClick(() => new LayoutTransferModal(this.app, this.plugin, this.device()).open());
  }
  openAddMenu(anchor) {
    const menu = document.createElement("div");
    menu.addClass("hb-add-menu");
    const choices = [
      ["\u5FEB\u6377\u5165\u53E3", "shortcuts", "\u94FE\u63A5\u4E0E\u5E38\u7528\u7B14\u8BB0\u5165\u53E3"],
      ["\u4EFB\u52A1\u6E05\u5355", "markdown", "\u53EF\u89C6\u5316\u751F\u6210 Tasks \u67E5\u8BE2", "tasks"],
      ["Dataview \u8868\u683C", "markdown", "\u53EF\u89C6\u5316\u751F\u6210\u6587\u4EF6\u5939\u8868\u683C", "dataview"],
      ["\u81EA\u5B9A\u4E49\u67E5\u8BE2", "markdown", "\u7C98\u8D34 Tasks\u3001Dataview \u6216 DataviewJS", "raw"],
      ["\u6587\u5B57\u6A21\u5757", "text", "\u6807\u9898\u3001\u8BF4\u660E\u6216\u63D0\u9192"],
      ["\u6708\u5386", "calendar", "\u94FE\u63A5\u5230\u6BCF\u65E5\u7B14\u8BB0"],
      ["\u5012\u6570\u65E5", "countdown", "\u663E\u793A\u8DDD\u79BB\u67D0\u4E2A\u65E5\u671F\u7684\u5929\u6570"],
      ["\u56FE\u7247", "image", "\u5C55\u793A\u5E93\u5185\u56FE\u7247\u6216 URL"],
      ["\u9605\u8BFB\u4E66\u67B6", "bookshelf", "\u8BFB\u53D6\u6B63\u5F0F\u4E66\u7C4D\u8BB0\u5F55"],
      ["\u6570\u5B57\u8D44\u4EA7", "assets", "\u663E\u793A\u8FD1\u671F\u8D44\u4EA7\u4E0E\u5230\u671F\u65E5"],
      ["AI \u7528\u91CF", "aiusage", "\u663E\u793A\u5DF2\u540C\u6B65\u7684 AI \u7528\u91CF\u8BB0\u5F55"],
      ["\u5929\u6C14", "weather", "\u624B\u52A8\u8BB0\u5F55\u5F53\u524D\u4F4D\u7F6E\u5929\u6C14\uFF0C\u4E0D\u8054\u7F51"]
    ];
    for (const [label, kind, description, queryKind] of choices) {
      const option = menu.createEl("button", { text: label });
      option.createEl("small", { text: description });
      option.onclick = async () => {
        menu.remove();
        const created = { id: newId(), kind, title: label, span: 1, queryKind };
        if (kind === "shortcuts") created.shortcuts = [];
        if (queryKind === "tasks") {
          created.query = { limit: 8 };
          created.markdown = taskMarkdown(created.query);
        } else if (queryKind === "dataview") {
          created.query = { limit: 8 };
          created.markdown = dataviewMarkdown(created.query);
        } else if (kind === "markdown") created.markdown = "```tasks\nnot done\n```";
        if (kind === "text") created.text = "\u5199\u4E00\u70B9\u63D0\u793A\u6216\u8BF4\u660E\u3002";
        if (kind === "calendar") created.options = { dailyFolder: "02_\u65E5\u5386/\u6BCF\u65E5" };
        if (kind === "countdown") created.options = { label: "\u5012\u6570\u65E5", targetDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) };
        if (kind === "image") created.options = { imagePath: "", imageAlt: "\u4E3B\u9875\u56FE\u7247", imageFit: "cover" };
        if (kind === "bookshelf") created.options = { shelfPath: "05_Books/epub-bookmarks" };
        if (kind === "assets") created.options = { assetPath: "09_\u6570\u5B57\u8D44\u4EA7/\u8D44\u4EA7" };
        if (kind === "aiusage") created.options = { usagePath: "03_\u751F\u6D3B\u8BB0\u5F55/05_AI\u7528\u91CF" };
        if (kind === "weather") created.options = { weatherMode: "manual", weatherLocation: "\u5F53\u524D\u4F4D\u7F6E", weatherText: "\u6674", weatherTemperature: "--\xB0" };
        this.plugin.resolvedLayout(this.device()).modules.push(created);
        await this.plugin.saveConfig();
        this.openModuleEditor(created);
      };
    }
    document.body.appendChild(menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 8}px`;
    window.setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
  }
  async renderModule(grid, module2, layout) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
    const hidden = (_a = module2.hiddenOn) == null ? void 0 : _a.includes(this.device());
    const card = grid.createDiv({ cls: `hb-module hb-span-${(_b = module2.span) != null ? _b : 1}${hidden ? " hb-device-hidden" : ""}` });
    if (this.editing && this.device() !== "mobile") {
      card.draggable = true;
      card.addClass("hb-draggable");
      card.ondragstart = (event) => {
        var _a2;
        return (_a2 = event.dataTransfer) == null ? void 0 : _a2.setData("text/plain", module2.id);
      };
      card.ondragover = (event) => event.preventDefault();
      card.ondrop = async (event) => {
        var _a2;
        event.preventDefault();
        const movedId = (_a2 = event.dataTransfer) == null ? void 0 : _a2.getData("text/plain");
        const from = layout.modules.findIndex((item) => item.id === movedId);
        const to = layout.modules.indexOf(module2);
        if (from < 0 || from === to) return;
        const [moved] = layout.modules.splice(from, 1);
        layout.modules.splice(to, 0, moved);
        await this.plugin.saveConfig();
      };
    }
    const titleRow = card.createDiv({ cls: "hb-module-title" });
    titleRow.createEl("h2", { text: module2.title || "\u672A\u547D\u540D\u6A21\u5757" });
    if (this.editing) {
      const controls = titleRow.createDiv({ cls: "hb-module-controls" });
      const action = (icon, label) => {
        const button = new import_obsidian.ButtonComponent(controls).setTooltip(label);
        if (this.device() === "mobile") button.setButtonText(label);
        else button.setIcon(icon);
        button.buttonEl.setAttribute("aria-label", label);
        return button;
      };
      action("pencil", "\u7F16\u8F91").onClick(() => this.openModuleEditor(module2));
      action("copy", "\u590D\u5236").onClick(async () => {
        const copy = clone(module2);
        copy.id = newId();
        copy.title = `${module2.title} \u526F\u672C`;
        layout.modules.splice(layout.modules.indexOf(module2) + 1, 0, copy);
        await this.plugin.saveConfig();
      });
      action("arrow-up", "\u4E0A\u79FB").setDisabled(layout.modules.indexOf(module2) === 0).onClick(async () => {
        this.move(layout, module2, -1);
      });
      action("arrow-down", "\u4E0B\u79FB").setDisabled(layout.modules.indexOf(module2) === layout.modules.length - 1).onClick(async () => {
        this.move(layout, module2, 1);
      });
      action("columns-2", "\u8C03\u6574\u5BBD\u5EA6").onClick(async () => {
        var _a2;
        const max = this.device() === "mobile" ? 1 : this.device() === "tablet" ? 2 : this.plugin.config.settings.gridColumns;
        module2.span = ((_a2 = module2.span) != null ? _a2 : 1) % max + 1;
        await this.plugin.saveConfig("\u8C03\u6574\u6A21\u5757\u5BBD\u5EA6");
      });
      action(hidden ? "eye" : "eye-off", hidden ? "\u663E\u793A\u6A21\u5757" : "\u9690\u85CF\u6A21\u5757").onClick(async () => {
        var _a2;
        const device = this.device();
        const set = new Set((_a2 = module2.hiddenOn) != null ? _a2 : []);
        if (set.has(device)) set.delete(device);
        else set.add(device);
        module2.hiddenOn = [...set];
        await this.plugin.saveConfig("\u66F4\u65B0\u8BBE\u5907\u53EF\u89C1\u6027");
      });
      action("trash-2", "\u5220\u9664").setWarning().onClick(() => new ConfirmModal(this.app, "\u5220\u9664\u8FD9\u4E2A\u6A21\u5757\uFF1F", "\u6A21\u5757\u7684\u6570\u636E\u548C\u5E03\u5C40\u5C06\u88AB\u79FB\u9664\u3002", async () => {
        layout.modules.splice(layout.modules.indexOf(module2), 1);
        await this.plugin.saveConfig();
      }).open());
    }
    const body = card.createDiv({ cls: "hb-module-body" });
    if (module2.kind === "shortcuts") {
      const shortcuts = body.createDiv({ cls: "hb-shortcuts" });
      for (const item of (_c = module2.shortcuts) != null ? _c : []) {
        const link = new import_obsidian.ButtonComponent(shortcuts).setButtonText(item.label).setClass("hb-shortcut");
        if (item.icon) link.setIcon(item.icon);
        const button = link.buttonEl;
        button.setAttribute("aria-label", `\u6253\u5F00 ${item.label}`);
        button.onclick = () => void this.openTarget(item.target);
      }
      if (!((_d = module2.shortcuts) == null ? void 0 : _d.length)) body.createEl("p", { text: "\u70B9\u7F16\u8F91\u6A21\u5757\u6DFB\u52A0\u94FE\u63A5\u3002", cls: "hb-muted" });
    } else if (module2.kind === "text") {
      body.createEl("p", { text: (_e = module2.text) != null ? _e : "", cls: "hb-text" });
    } else if (module2.kind === "calendar") {
      this.renderCalendar(body, module2);
    } else if (module2.kind === "countdown") {
      this.renderCountdown(body, module2);
    } else if (module2.kind === "image") {
      const path = (_g = (_f = module2.options) == null ? void 0 : _f.imagePath) != null ? _g : "";
      if (path) body.createEl("img", { cls: `hb-content-image hb-image-${(_i = (_h = module2.options) == null ? void 0 : _h.imageFit) != null ? _i : "cover"}`, attr: { src: vaultImageUrl(this.app, path), alt: ((_j = module2.options) == null ? void 0 : _j.imageAlt) || module2.title, loading: "lazy" } });
      else body.createEl("p", { text: "\u70B9\u7F16\u8F91\u6A21\u5757\u9009\u62E9\u56FE\u7247\u3002", cls: "hb-muted" });
    } else if (module2.kind === "weather") {
      const weather = body.createDiv({ cls: "hb-weather" });
      weather.createEl("strong", { text: ((_k = module2.options) == null ? void 0 : _k.weatherTemperature) || "--\xB0" });
      const description = weather.createDiv();
      description.createEl("span", { text: ((_l = module2.options) == null ? void 0 : _l.weatherText) || "\u672A\u586B\u5199\u5929\u6C14" });
      description.createEl("small", { text: ((_m = module2.options) == null ? void 0 : _m.weatherLocation) || "\u5F53\u524D\u4F4D\u7F6E" });
      if ((_n = module2.options) == null ? void 0 : _n.weatherUpdatedAt) description.createEl("small", { text: `\u66F4\u65B0\u4E8E ${new Date(module2.options.weatherUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` });
      if ((_o = module2.options) == null ? void 0 : _o.weatherError) description.createEl("small", { text: module2.options.weatherError, cls: "hb-weather-error" });
      if (((_p = module2.options) == null ? void 0 : _p.weatherMode) === "auto") {
        const refresh = new import_obsidian.ButtonComponent(weather).setIcon("refresh-cw").setTooltip("\u5237\u65B0\u5929\u6C14");
        refresh.buttonEl.setAttribute("aria-label", "\u5237\u65B0\u5929\u6C14");
        refresh.onClick(() => void this.plugin.refreshWeather(module2, true));
        void this.plugin.refreshWeather(module2);
      }
    } else if (module2.kind === "bookshelf" || module2.kind === "assets" || module2.kind === "aiusage") {
      const markdown = module2.kind === "bookshelf" ? `\`\`\`dataview
TABLE WITHOUT ID file.link AS \u4E66\u7C4D, reading-progress AS \u8FDB\u5EA6
FROM "${((_q = module2.options) == null ? void 0 : _q.shelfPath) || "05_Books/epub-bookmarks"}"
WHERE reading-progress
SORT reading-progress DESC
LIMIT 6
\`\`\`` : module2.kind === "assets" ? `\`\`\`dataview
TABLE WITHOUT ID file.link AS \u8D44\u4EA7, expire AS \u5230\u671F\u65E5
FROM "${((_r = module2.options) == null ? void 0 : _r.assetPath) || "09_\u6570\u5B57\u8D44\u4EA7/\u8D44\u4EA7"}"
SORT expire ASC
LIMIT 6
\`\`\`` : `\`\`\`dataview
TABLE WITHOUT ID balance AS \u4F59\u989D, totalUsed AS \u7D2F\u8BA1\u6D88\u8017, updated AS \u540C\u6B65\u65F6\u95F4
FROM "${((_s = module2.options) == null ? void 0 : _s.usagePath) || "03_\u751F\u6D3B\u8BB0\u5F55/05_AI\u7528\u91CF"}"
LIMIT 1
\`\`\``;
      await import_obsidian.MarkdownRenderer.render(this.app, markdown, body, this.plugin.config.configPath, this);
    } else {
      try {
        await import_obsidian.MarkdownRenderer.render(this.app, (_t = module2.markdown) != null ? _t : "", body, this.plugin.config.configPath, this);
      } catch (error) {
        body.createEl("pre", { text: `\u67E5\u8BE2\u6E32\u67D3\u5931\u8D25\uFF1A${String(error)}`, cls: "hb-error" });
      }
    }
  }
  renderCountdown(body, module2) {
    var _a, _b;
    const target = (_a = module2.options) == null ? void 0 : _a.targetDate;
    const result = body.createDiv({ cls: "hb-countdown" });
    if (!target || Number.isNaN(new Date(target).getTime())) {
      result.setText("\u8BF7\u5728\u7F16\u8F91\u6A21\u5757\u4E2D\u586B\u5199\u76EE\u6807\u65E5\u671F\u3002");
      return;
    }
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const day = /* @__PURE__ */ new Date(`${target}T00:00:00`);
    const amount = Math.round((day.getTime() - today.getTime()) / 864e5);
    result.createEl("strong", { text: amount >= 0 ? `${amount}` : `${Math.abs(amount)}` });
    result.createEl("span", { text: amount >= 0 ? "\u5929\u540E" : "\u5929\u524D" });
    result.createEl("small", { text: ((_b = module2.options) == null ? void 0 : _b.label) || target });
  }
  renderCalendar(body, module2) {
    var _a, _b;
    const offset = (_a = this.calendarOffsets.get(module2.id)) != null ? _a : 0;
    const shown = /* @__PURE__ */ new Date();
    shown.setDate(1);
    shown.setMonth(shown.getMonth() + offset);
    const top = body.createDiv({ cls: "hb-calendar-head" });
    const previous = new import_obsidian.ButtonComponent(top).setIcon("chevron-left").setTooltip("\u4E0A\u4E2A\u6708");
    previous.onClick(async () => {
      this.calendarOffsets.set(module2.id, offset - 1);
      await this.render();
    });
    top.createEl("strong", { text: `${shown.getFullYear()} \u5E74 ${shown.getMonth() + 1} \u6708` });
    const next = new import_obsidian.ButtonComponent(top).setIcon("chevron-right").setTooltip("\u4E0B\u4E2A\u6708");
    next.onClick(async () => {
      this.calendarOffsets.set(module2.id, offset + 1);
      await this.render();
    });
    const days = body.createDiv({ cls: "hb-calendar" });
    for (const label of ["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"]) days.createEl("span", { text: label, cls: "hb-calendar-weekday" });
    for (let empty = 0; empty < shown.getDay(); empty++) days.createEl("span", { cls: "hb-calendar-empty" });
    const total = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
    const today = /* @__PURE__ */ new Date();
    for (let day = 1; day <= total; day++) {
      const date = new Date(shown.getFullYear(), shown.getMonth(), day);
      const path = `${((_b = module2.options) == null ? void 0 : _b.dailyFolder) || "02_\u65E5\u5386/\u6BCF\u65E5"}/${date.toISOString().slice(0, 10)}`;
      const button = days.createEl("button", { text: String(day), cls: "hb-calendar-day" });
      button.setAttribute("aria-label", `\u6253\u5F00 ${path}`);
      if (date.toDateString() === today.toDateString()) button.addClass("is-today");
      button.onclick = () => void this.app.workspace.openLinkText(path, this.plugin.config.configPath, true);
    }
  }
  async openTarget(target) {
    if (isExternalUrl(target)) {
      window.open(target, "_blank", "noopener");
      return;
    }
    const file = this.app.metadataCache.getFirstLinkpathDest(target, this.plugin.config.configPath);
    if (file instanceof import_obsidian.TFile) await this.app.workspace.getLeaf("tab").openFile(file);
    else {
      await this.app.workspace.openLinkText(target, this.plugin.config.configPath, true);
      new import_obsidian.Notice(`\u672A\u627E\u5230\u73B0\u6709\u7B14\u8BB0\uFF0C\u5DF2\u5C1D\u8BD5\u6253\u5F00\uFF1A${target}`);
    }
  }
  async move(layout, module2, delta) {
    const index = layout.modules.indexOf(module2);
    const next = index + delta;
    if (next < 0 || next >= layout.modules.length) return;
    [layout.modules[index], layout.modules[next]] = [layout.modules[next], layout.modules[index]];
    await this.plugin.saveConfig();
  }
  openModuleEditor(module2) {
    new ModuleModal(this.app, module2, async () => await this.plugin.saveConfig()).open();
  }
};
var ModuleModal = class extends import_obsidian.Modal {
  constructor(appRef, module2, onSave) {
    super(appRef);
    this.appRef = appRef;
    this.module = module2;
    this.onSave = onSave;
  }
  onOpen() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
    const { contentEl } = this;
    contentEl.addClass("hb-modal");
    contentEl.createEl("h2", { text: "\u7F16\u8F91\u6A21\u5757" });
    new import_obsidian.Setting(contentEl).setName("\u6807\u9898").addText((text) => text.setValue(this.module.title).onChange((value) => this.module.title = value));
    if (this.module.kind === "markdown") {
      if (this.module.queryKind === "tasks" || this.module.queryKind === "dataview") {
        const isTasks = this.module.queryKind === "tasks";
        (_b = (_a = this.module).query) != null ? _b : _a.query = { limit: 8 };
        new import_obsidian.Setting(contentEl).setName(isTasks ? "\u4EFB\u52A1\u6765\u6E90\u76EE\u5F55" : "Dataview \u6765\u6E90\u76EE\u5F55").setDesc("\u7559\u7A7A\u5219\u67E5\u8BE2\u6574\u4E2A\u5E93\u3002").addText((text) => {
          var _a2, _b2;
          return text.setPlaceholder("\u4F8B\u5982\uFF1A06_Todo").setValue((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.path) != null ? _b2 : "").onChange((value) => {
            this.module.query.path = value.trim();
            this.module.markdown = isTasks ? taskMarkdown(this.module.query) : dataviewMarkdown(this.module.query);
          });
        });
        if (isTasks) {
          new import_obsidian.Setting(contentEl).setName("\u6807\u7B7E\u7B5B\u9009").setDesc("\u53EF\u9009\uFF0C\u4F8B\u5982\uFF1A#\u5DE5\u4F5C").addText((text) => {
            var _a2, _b2;
            return text.setValue((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.tag) != null ? _b2 : "").onChange((value) => {
              this.module.query.tag = value.trim();
              this.module.markdown = taskMarkdown(this.module.query);
            });
          });
          new import_obsidian.Setting(contentEl).setName("\u5B8C\u6210\u72B6\u6001").addDropdown((drop) => {
            var _a2, _b2;
            return drop.addOption("false", "\u4EC5\u672A\u5B8C\u6210").addOption("true", "\u5305\u542B\u5DF2\u5B8C\u6210").setValue(String((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.showCompleted) != null ? _b2 : false)).onChange((value) => {
              this.module.query.showCompleted = value === "true";
              this.module.markdown = taskMarkdown(this.module.query);
            });
          });
          new import_obsidian.Setting(contentEl).setName("\u5230\u671F\u65E5").addDropdown((drop) => {
            var _a2, _b2;
            return drop.addOption("any", "\u4E0D\u9650").addOption("today", "\u4ECA\u5929").addOption("overdue", "\u5DF2\u903E\u671F").addOption("today-or-overdue", "\u4ECA\u5929\u4E0E\u903E\u671F").addOption("future", "\u672A\u6765").setValue((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.due) != null ? _b2 : "any").onChange((value) => {
              this.module.query.due = value;
              this.module.markdown = taskMarkdown(this.module.query);
            });
          });
          new import_obsidian.Setting(contentEl).setName("\u4F18\u5148\u7EA7").addDropdown((drop) => {
            var _a2, _b2;
            return drop.addOption("any", "\u4E0D\u9650").addOption("highest", "\u6700\u9AD8").addOption("high", "\u9AD8").addOption("medium", "\u4E2D").addOption("low", "\u4F4E").addOption("lowest", "\u6700\u4F4E").setValue((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.priority) != null ? _b2 : "any").onChange((value) => {
              this.module.query.priority = value;
              this.module.markdown = taskMarkdown(this.module.query);
            });
          });
          new import_obsidian.Setting(contentEl).setName("\u6392\u5E8F").addDropdown((drop) => {
            var _a2, _b2;
            return drop.addOption("none", "\u9ED8\u8BA4").addOption("due", "\u5230\u671F\u65E5").addOption("priority", "\u4F18\u5148\u7EA7").addOption("created", "\u521B\u5EFA\u65F6\u95F4").addOption("path", "\u8DEF\u5F84").setValue((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.sort) != null ? _b2 : "none").onChange((value) => {
              this.module.query.sort = value;
              this.module.markdown = taskMarkdown(this.module.query);
            });
          });
          new import_obsidian.Setting(contentEl).setName("\u91CD\u590D\u4EFB\u52A1").addDropdown((drop) => {
            var _a2, _b2;
            return drop.addOption("any", "\u4E0D\u9650").addOption("only", "\u4EC5\u91CD\u590D\u4EFB\u52A1").addOption("exclude", "\u6392\u9664\u91CD\u590D\u4EFB\u52A1").setValue((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.recurring) != null ? _b2 : "any").onChange((value) => {
              this.module.query.recurring = value;
              this.module.markdown = taskMarkdown(this.module.query);
            });
          });
        } else {
          new import_obsidian.Setting(contentEl).setName("\u89C6\u56FE").addDropdown((drop) => {
            var _a2, _b2;
            return drop.addOption("table", "\u8868\u683C").addOption("list", "\u5217\u8868").addOption("task", "\u4EFB\u52A1").setValue((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.dataviewView) != null ? _b2 : "table").onChange((value) => {
              this.module.query.dataviewView = value;
              this.module.markdown = dataviewMarkdown(this.module.query);
            });
          });
          new import_obsidian.Setting(contentEl).setName("\u5E38\u7528\u9884\u8BBE").setDesc("\u9009\u4E2D\u540E\u53EF\u7EE7\u7EED\u4FEE\u6539\u6765\u6E90\u76EE\u5F55\u3002").addDropdown((drop) => {
            var _a2, _b2;
            return drop.addOption("", "\u4E0D\u4F7F\u7528").addOption("reading", "\u9605\u8BFB\u8FDB\u5EA6").addOption("assets", "\u6570\u5B57\u8D44\u4EA7").addOption("life", "\u751F\u6D3B\u8BB0\u5F55").addOption("aiusage", "AI \u7528\u91CF").addOption("calendar", "\u6700\u8FD1\u65E5\u8BB0").setValue((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.preset) != null ? _b2 : "").onChange((value) => {
              this.module.query.preset = value;
              if (value) this.module.markdown = presetMarkdown(value);
            });
          });
        }
        new import_obsidian.Setting(contentEl).setName("\u6700\u591A\u663E\u793A").addSlider((slider) => {
          var _a2, _b2;
          return slider.setLimits(1, 30, 1).setValue((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.limit) != null ? _b2 : 8).setDynamicTooltip().onChange((value) => {
            this.module.query.limit = value;
            this.module.markdown = isTasks ? taskMarkdown(this.module.query) : dataviewMarkdown(this.module.query);
          });
        });
        contentEl.createEl("p", { text: "\u8BE5\u6A21\u5757\u4ECD\u7531\u539F\u751F Tasks/Dataview \u63D2\u4EF6\u6E32\u67D3\uFF1B\u70B9\u51FB\u4FDD\u5B58\u540E\u53EF\u7ACB\u5373\u9884\u89C8\u3002", cls: "setting-item-description" });
      } else {
        new import_obsidian.Setting(contentEl).setName("\u67E5\u8BE2\u6216 Markdown").setDesc("\u53EF\u76F4\u63A5\u7C98\u8D34 Tasks\u3001Dataview \u6216 DataviewJS \u4EE3\u7801\u5757\u3002");
        const area = contentEl.createEl("textarea", { cls: "hb-textarea" });
        area.value = (_c = this.module.markdown) != null ? _c : "";
        area.oninput = () => this.module.markdown = area.value;
        new import_obsidian.Setting(contentEl).setName("\u5F15\u7528\u73B0\u6709\u67E5\u8BE2\u533A\u5757").setDesc("\u626B\u63CF\u5E93\u5185 Dataview\u3001DataviewJS \u548C Tasks \u4EE3\u7801\u5757\uFF1B\u5F15\u7528\u65F6\u590D\u5236\u4EE3\u7801\uFF0C\u4E0D\u4F1A\u4FEE\u6539\u539F\u7B14\u8BB0\u3002").addButton((button) => button.setButtonText("\u9009\u62E9\u67E5\u8BE2\u533A\u5757").onClick(() => new QueryBlockPickerModal(this.appRef, (markdown) => {
          this.module.markdown = markdown;
          area.value = markdown;
        }).open()));
      }
    } else if (this.module.kind === "text") {
      new import_obsidian.Setting(contentEl).setName("\u6B63\u6587");
      const area = contentEl.createEl("textarea", { cls: "hb-textarea" });
      area.value = (_d = this.module.text) != null ? _d : "";
      area.oninput = () => this.module.text = area.value;
    } else if (this.module.kind === "shortcuts") {
      new import_obsidian.Setting(contentEl).setName("\u5FEB\u6377\u94FE\u63A5").setDesc("\u6BCF\u884C\u683C\u5F0F\uFF1A\u663E\u793A\u540D\u79F0 | \u7B14\u8BB0\u8DEF\u5F84\u6216\u94FE\u63A5");
      const area = contentEl.createEl("textarea", { cls: "hb-textarea" });
      area.value = ((_e = this.module.shortcuts) != null ? _e : []).map((item) => `${item.label} | ${item.target}`).join("\n");
      area.oninput = () => {
        this.module.shortcuts = area.value.split("\n").map((line) => line.split("|").map((part) => part.trim())).filter(([label, target]) => label && target).map(([label, target]) => ({ label, target }));
      };
      new import_obsidian.Setting(contentEl).setName("\u4ECE\u5E93\u4E2D\u6DFB\u52A0").setDesc("\u9009\u62E9\u7B14\u8BB0\u6216\u6587\u4EF6\u5939\u540E\u4F1A\u8FFD\u52A0\u5230\u5FEB\u6377\u5165\u53E3\u3002").addButton((button) => button.setButtonText("\u9009\u62E9\u6587\u4EF6\u6216\u6587\u4EF6\u5939").onClick(() => new VaultPickerModal(this.appRef, "\u9009\u62E9\u5FEB\u6377\u5165\u53E3", "all", (path) => {
        var _a2, _b2, _c2;
        const label = ((_a2 = path.split("/").pop()) == null ? void 0 : _a2.replace(/\.md$/i, "")) || path;
        this.module.shortcuts = [...(_b2 = this.module.shortcuts) != null ? _b2 : [], { label, target: path, icon: "file-text" }];
        area.value = ((_c2 = this.module.shortcuts) != null ? _c2 : []).map((item) => `${item.label} | ${item.target}`).join("\n");
      }).open()));
      new import_obsidian.Setting(contentEl).setName("\u7EDF\u4E00\u8BBE\u7F6E\u56FE\u6807").setDesc("\u4E3A\u5F53\u524D\u5FEB\u6377\u5165\u53E3\u7EDF\u4E00\u8BBE\u7F6E Lucide \u56FE\u6807\uFF1B\u540E\u7EED\u53EF\u5728 JSON \u4E2D\u9010\u9879\u5FAE\u8C03\u3002").addDropdown((drop) => {
        var _a2, _b2, _c2;
        return drop.addOption("file-text", "\u7B14\u8BB0").addOption("folder", "\u6587\u4EF6\u5939").addOption("external-link", "\u5916\u94FE").addOption("calendar", "\u65E5\u5386").addOption("book-open", "\u9605\u8BFB").setValue((_c2 = (_b2 = (_a2 = this.module.shortcuts) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.icon) != null ? _c2 : "file-text").onChange((value) => {
          var _a3;
          this.module.shortcuts = ((_a3 = this.module.shortcuts) != null ? _a3 : []).map((item) => ({ ...item, icon: value }));
        });
      });
    } else if (this.module.kind === "calendar") {
      (_g = (_f = this.module).options) != null ? _g : _f.options = {};
      new import_obsidian.Setting(contentEl).setName("\u6BCF\u65E5\u7B14\u8BB0\u76EE\u5F55").setDesc("\u70B9\u51FB\u65E5\u671F\u65F6\u6253\u5F00\u8BE5\u76EE\u5F55\u4E0B\u7684 YYYY-MM-DD \u7B14\u8BB0\u3002").addText((text) => {
        var _a2, _b2;
        return text.setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.dailyFolder) != null ? _b2 : "02_\u65E5\u5386/\u6BCF\u65E5").onChange((value) => this.module.options.dailyFolder = value.trim());
      });
      new import_obsidian.Setting(contentEl).setName("\u9009\u62E9\u76EE\u5F55").addButton((button) => button.setButtonText("\u6D4F\u89C8\u5E93\u5185\u6587\u4EF6\u5939").onClick(() => new VaultPickerModal(this.appRef, "\u9009\u62E9\u6BCF\u65E5\u7B14\u8BB0\u76EE\u5F55", "folder", (path) => this.module.options.dailyFolder = path).open()));
    } else if (this.module.kind === "countdown") {
      (_i = (_h = this.module).options) != null ? _i : _h.options = {};
      new import_obsidian.Setting(contentEl).setName("\u8BF4\u660E").addText((text) => {
        var _a2, _b2;
        return text.setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.label) != null ? _b2 : "\u5012\u6570\u65E5").onChange((value) => this.module.options.label = value);
      });
      new import_obsidian.Setting(contentEl).setName("\u76EE\u6807\u65E5\u671F").setDesc("\u683C\u5F0F YYYY-MM-DD\u3002").addText((text) => {
        var _a2, _b2;
        return text.setPlaceholder("2026-12-31").setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.targetDate) != null ? _b2 : "").onChange((value) => this.module.options.targetDate = value.trim());
      });
    } else if (this.module.kind === "image") {
      (_k = (_j = this.module).options) != null ? _k : _j.options = {};
      new import_obsidian.Setting(contentEl).setName("\u56FE\u7247\u8DEF\u5F84\u6216 URL").addText((text) => {
        var _a2, _b2;
        return text.setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.imagePath) != null ? _b2 : "").onChange((value) => this.module.options.imagePath = value.trim());
      });
      new import_obsidian.Setting(contentEl).setName("\u9009\u62E9\u5E93\u5185\u56FE\u7247").addButton((button) => button.setButtonText("\u9009\u62E9\u56FE\u7247").onClick(() => new VaultPickerModal(this.appRef, "\u9009\u62E9\u56FE\u7247", "image", (path) => this.module.options.imagePath = path).open()));
      new import_obsidian.Setting(contentEl).setName("\u66FF\u4EE3\u6587\u5B57").addText((text) => {
        var _a2, _b2;
        return text.setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.imageAlt) != null ? _b2 : "").onChange((value) => this.module.options.imageAlt = value);
      });
      new import_obsidian.Setting(contentEl).setName("\u663E\u793A\u65B9\u5F0F").addDropdown((drop) => {
        var _a2, _b2;
        return drop.addOption("cover", "\u94FA\u6EE1\u88C1\u5207").addOption("contain", "\u5B8C\u6574\u663E\u793A").setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.imageFit) != null ? _b2 : "cover").onChange((value) => this.module.options.imageFit = value);
      });
    } else if (this.module.kind === "bookshelf" || this.module.kind === "assets" || this.module.kind === "aiusage") {
      (_m = (_l = this.module).options) != null ? _m : _l.options = {};
      const key = this.module.kind === "bookshelf" ? "shelfPath" : this.module.kind === "assets" ? "assetPath" : "usagePath";
      const fallback = this.module.kind === "bookshelf" ? "05_Books/epub-bookmarks" : this.module.kind === "assets" ? "09_\u6570\u5B57\u8D44\u4EA7/\u8D44\u4EA7" : "03_\u751F\u6D3B\u8BB0\u5F55/05_AI\u7528\u91CF";
      new import_obsidian.Setting(contentEl).setName("\u6765\u6E90\u76EE\u5F55").setDesc("\u8BE5\u6A21\u5757\u4ECD\u7531 Dataview \u539F\u751F\u6E32\u67D3\u3002").addText((text) => {
        var _a2, _b2;
        return text.setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2[key]) != null ? _b2 : fallback).onChange((value) => this.module.options[key] = value.trim());
      });
      new import_obsidian.Setting(contentEl).setName("\u9009\u62E9\u76EE\u5F55").addButton((button) => button.setButtonText("\u6D4F\u89C8\u5E93\u5185\u6587\u4EF6\u5939").onClick(() => new VaultPickerModal(this.appRef, "\u9009\u62E9\u6765\u6E90\u76EE\u5F55", "folder", (path) => this.module.options[key] = path).open()));
    } else if (this.module.kind === "weather") {
      (_o = (_n = this.module).options) != null ? _o : _n.options = {};
      new import_obsidian.Setting(contentEl).setName("\u5929\u6C14\u6765\u6E90").setDesc("\u81EA\u52A8\u6A21\u5F0F\u4EC5\u5728\u542F\u7528\u540E\u8BBF\u95EE Open-Meteo\uFF1B\u4E0D\u9700\u8981 API Key\u3002").addDropdown((drop) => {
        var _a2, _b2;
        return drop.addOption("manual", "\u624B\u52A8\u586B\u5199\uFF08\u4E0D\u8054\u7F51\uFF09").addOption("auto", "\u81EA\u52A8\u6293\u53D6\uFF08Open-Meteo\uFF09").setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.weatherMode) != null ? _b2 : "manual").onChange((value) => this.module.options.weatherMode = value);
      });
      new import_obsidian.Setting(contentEl).setName("\u57CE\u5E02").setDesc("\u81EA\u52A8\u6A21\u5F0F\u586B\u5199\u57CE\u5E02\u540D\uFF0C\u4F8B\u5982\uFF1A\u4E0A\u6D77\u3001Tokyo\u3002\u5B9A\u4F4D\u4F18\u5148\u4E8E\u57CE\u5E02\u3002").addText((text) => {
        var _a2, _b2;
        return text.setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.weatherCity) != null ? _b2 : "").onChange((value) => this.module.options.weatherCity = value.trim());
      });
      new import_obsidian.Setting(contentEl).setName("\u4F7F\u7528\u5F53\u524D\u5B9A\u4F4D").setDesc("\u4F1A\u8BF7\u6C42\u7CFB\u7EDF\u4F4D\u7F6E\u6743\u9650\uFF0C\u4EC5\u4FDD\u5B58\u7ECF\u7EAC\u5EA6\u5230\u6B64\u4E3B\u9875\u914D\u7F6E\u4E2D\u3002").addButton((button) => button.setButtonText("\u6388\u6743\u5B9A\u4F4D").onClick(() => {
        if (!navigator.geolocation) {
          new import_obsidian.Notice("\u5F53\u524D\u8BBE\u5907\u4E0D\u652F\u6301\u5B9A\u4F4D\u3002\u8BF7\u586B\u5199\u57CE\u5E02\u3002");
          return;
        }
        navigator.geolocation.getCurrentPosition((position) => {
          this.module.options.weatherLatitude = position.coords.latitude;
          this.module.options.weatherLongitude = position.coords.longitude;
          this.module.options.weatherLocation = "\u5F53\u524D\u5B9A\u4F4D";
          new import_obsidian.Notice("\u5DF2\u53D6\u5F97\u5F53\u524D\u4F4D\u7F6E\u3002\u4FDD\u5B58\u540E\u8FD4\u56DE\u4E3B\u9875\u5373\u53EF\u81EA\u52A8\u66F4\u65B0\u5929\u6C14\u3002");
        }, () => new import_obsidian.Notice("\u672A\u53D6\u5F97\u4F4D\u7F6E\u6743\u9650\u3002\u8BF7\u586B\u5199\u57CE\u5E02\u540E\u518D\u8BD5\u3002"), { enableHighAccuracy: false, timeout: 1e4, maximumAge: 30 * 60 * 1e3 });
      }));
      new import_obsidian.Setting(contentEl).setName("\u5730\u70B9\u663E\u793A\u540D").setDesc("\u624B\u52A8\u6A21\u5F0F\u53EF\u586B\u5199\uFF1B\u81EA\u52A8\u6A21\u5F0F\u4F1A\u5728\u9996\u6B21\u66F4\u65B0\u540E\u5199\u5165\u5339\u914D\u5730\u70B9\u3002").addText((text) => {
        var _a2, _b2;
        return text.setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.weatherLocation) != null ? _b2 : "").onChange((value) => this.module.options.weatherLocation = value);
      });
      new import_obsidian.Setting(contentEl).setName("\u5929\u6C14\u63CF\u8FF0").setDesc("\u4EC5\u624B\u52A8\u6A21\u5F0F\u4F7F\u7528\u3002").addText((text) => {
        var _a2, _b2;
        return text.setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.weatherText) != null ? _b2 : "").onChange((value) => this.module.options.weatherText = value);
      });
      new import_obsidian.Setting(contentEl).setName("\u6E29\u5EA6").setDesc("\u4EC5\u624B\u52A8\u6A21\u5F0F\u4F7F\u7528\u3002").addText((text) => {
        var _a2, _b2;
        return text.setPlaceholder("25\xB0").setValue((_b2 = (_a2 = this.module.options) == null ? void 0 : _a2.weatherTemperature) != null ? _b2 : "").onChange((value) => this.module.options.weatherTemperature = value);
      });
    }
    const actions = contentEl.createDiv({ cls: "modal-button-container" });
    new import_obsidian.ButtonComponent(actions).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian.ButtonComponent(actions).setButtonText("\u4FDD\u5B58").setCta().onClick(async () => {
      await this.onSave();
      this.close();
    });
  }
};
var ThemeModal = class extends import_obsidian.Modal {
  constructor(appRef, plugin) {
    super(appRef);
    this.appRef = appRef;
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("hb-modal");
    contentEl.createEl("h2", { text: "\u4E3B\u9875\u5916\u89C2" });
    new import_obsidian.Setting(contentEl).setName("\u80CC\u666F\u7C7B\u578B").addDropdown((drop) => drop.addOption("none", "\u8DDF\u968F Obsidian").addOption("color", "\u7EAF\u8272").addOption("gradient", "\u6E10\u53D8").addOption("image", "\u56FE\u7247\uFF08\u5E93\u5185\u6216 URL\uFF09").setValue(this.plugin.config.theme.backgroundType).onChange((value) => this.plugin.config.theme.backgroundType = value));
    new import_obsidian.Setting(contentEl).setName("\u80CC\u666F\u503C").setDesc("\u7EAF\u8272\u586B #1e1e2e\uFF1B\u6E10\u53D8\u586B linear-gradient(...)\uFF1B\u56FE\u7247\u53EF\u586B\u5E93\u5185\u8DEF\u5F84\u6216 URL\u3002").addText((text) => text.setValue(this.plugin.config.theme.backgroundValue).onChange((value) => this.plugin.config.theme.backgroundValue = value));
    new import_obsidian.Setting(contentEl).setName("\u9009\u62E9\u5E93\u5185\u80CC\u666F\u56FE").addButton((button) => button.setButtonText("\u9009\u62E9\u56FE\u7247").onClick(() => new VaultPickerModal(this.appRef, "\u9009\u62E9\u80CC\u666F\u56FE", "image", (path) => this.plugin.config.theme.backgroundValue = path).open()));
    new import_obsidian.Setting(contentEl).setName("\u5F3A\u8C03\u8272").addText((text) => text.setValue(this.plugin.config.theme.accent).onChange((value) => this.plugin.config.theme.accent = value));
    new import_obsidian.Setting(contentEl).setName("\u5361\u7247\u4E0D\u900F\u660E\u5EA6").addSlider((slider) => slider.setLimits(0.45, 1, 0.05).setValue(this.plugin.config.theme.cardOpacity).setDynamicTooltip().onChange((value) => this.plugin.config.theme.cardOpacity = value));
    const actions = contentEl.createDiv({ cls: "modal-button-container" });
    new import_obsidian.ButtonComponent(actions).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian.ButtonComponent(actions).setButtonText("\u4FDD\u5B58").setCta().onClick(async () => {
      await this.plugin.saveConfig();
      this.close();
    });
  }
};
var BannerModal = class extends import_obsidian.Modal {
  constructor(appRef, plugin) {
    super(appRef);
    this.appRef = appRef;
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    const banner = this.plugin.config.banner;
    contentEl.addClass("hb-modal");
    contentEl.createEl("h2", { text: "\u4E3B\u9875\u6A2A\u5E45" });
    new import_obsidian.Setting(contentEl).setName("\u542F\u7528\u6A2A\u5E45").setDesc("\u5173\u95ED\u540E\u4FDD\u7559\u666E\u901A\u4E3B\u9875\u6807\u9898\uFF0C\u4E0D\u52A0\u8F7D\u6A2A\u5E45\u56FE\u7247\u3002").addToggle((toggle) => toggle.setValue(banner.enabled).onChange((value) => banner.enabled = value));
    new import_obsidian.Setting(contentEl).setName("\u56FE\u7247\u8DEF\u5F84\u6216 URL").addText((text) => text.setValue(banner.imagePath).onChange((value) => banner.imagePath = value.trim()));
    new import_obsidian.Setting(contentEl).setName("\u9009\u62E9\u5E93\u5185\u56FE\u7247").addButton((button) => button.setButtonText("\u9009\u62E9\u56FE\u7247").onClick(() => new VaultPickerModal(this.appRef, "\u9009\u62E9\u6A2A\u5E45\u56FE\u7247", "image", (path) => banner.imagePath = path).open()));
    new import_obsidian.Setting(contentEl).setName("\u6807\u9898").setDesc("\u7559\u7A7A\u65F6\u4F7F\u7528\u4E3B\u9875\u540D\u79F0\u3002").addText((text) => text.setValue(banner.title).onChange((value) => banner.title = value));
    new import_obsidian.Setting(contentEl).setName("\u526F\u6807\u9898").addText((text) => text.setValue(banner.subtitle).onChange((value) => banner.subtitle = value));
    new import_obsidian.Setting(contentEl).setName("\u56FE\u7247\u66FF\u4EE3\u6587\u5B57").addText((text) => text.setValue(banner.alt).onChange((value) => banner.alt = value));
    new import_obsidian.Setting(contentEl).setName("\u6A2A\u5E45\u9AD8\u5EA6").addSlider((slider) => slider.setLimits(120, 420, 10).setValue(banner.height).setDynamicTooltip().onChange((value) => banner.height = value));
    new import_obsidian.Setting(contentEl).setName("\u6587\u5B57\u906E\u7F69").addSlider((slider) => slider.setLimits(0, 0.85, 0.05).setValue(banner.overlay).setDynamicTooltip().onChange((value) => banner.overlay = value));
    new import_obsidian.Setting(contentEl).setName("\u5706\u89D2").addToggle((toggle) => toggle.setValue(banner.rounded).onChange((value) => banner.rounded = value));
    const actions = contentEl.createDiv({ cls: "modal-button-container" });
    new import_obsidian.ButtonComponent(actions).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian.ButtonComponent(actions).setButtonText("\u4FDD\u5B58").setCta().onClick(async () => {
      await this.plugin.saveConfig("\u66F4\u65B0\u6A2A\u5E45");
      this.close();
    });
  }
};
var VaultPickerModal = class extends import_obsidian.Modal {
  constructor(appRef, titleText, mode, onPick) {
    super(appRef);
    this.appRef = appRef;
    this.titleText = titleText;
    this.mode = mode;
    this.onPick = onPick;
    this.query = "";
  }
  onOpen() {
    this.contentEl.addClass("hb-modal", "hb-picker-modal");
    this.contentEl.createEl("h2", { text: this.titleText });
    const input = this.contentEl.createEl("input", { type: "search", placeholder: "\u641C\u7D22\u8DEF\u5F84\u2026", cls: "hb-picker-search" });
    const list = this.contentEl.createDiv({ cls: "hb-picker-list" });
    const render = () => {
      list.empty();
      const lower = this.query.toLowerCase();
      const entries = this.mode === "folder" ? this.appRef.vault.getAllLoadedFiles().filter((item) => item instanceof import_obsidian.TFolder) : this.appRef.vault.getFiles().filter((file) => this.mode !== "image" || IMAGE_EXTENSIONS.has(file.extension.toLowerCase()));
      const filtered = entries.filter((item) => item.path.toLowerCase().includes(lower)).slice(0, 100);
      if (!filtered.length) list.createEl("p", { text: "\u6CA1\u6709\u5339\u914D\u9879\u3002", cls: "hb-muted" });
      for (const item of filtered) {
        const button = list.createEl("button", { text: item.path, cls: "hb-picker-item" });
        button.setAttribute("aria-label", `\u9009\u62E9 ${item.path}`);
        button.onclick = () => {
          this.onPick(item.path);
          this.close();
        };
      }
    };
    input.oninput = () => {
      this.query = input.value;
      render();
    };
    render();
  }
};
var QueryBlockPickerModal = class extends import_obsidian.Modal {
  constructor(appRef, onPick) {
    super(appRef);
    this.appRef = appRef;
    this.onPick = onPick;
  }
  async onOpen() {
    var _a, _b;
    this.contentEl.addClass("hb-modal", "hb-picker-modal");
    this.contentEl.createEl("h2", { text: "\u5F15\u7528\u5DF2\u6709\u67E5\u8BE2\u533A\u5757" });
    const list = this.contentEl.createDiv({ cls: "hb-picker-list" });
    const matches = [];
    for (const file of this.appRef.vault.getMarkdownFiles()) {
      const cached = this.appRef.metadataCache.getFileCache(file);
      const content = await this.appRef.vault.cachedRead(file);
      const contentLines = content.split("\n");
      const blocks = (_b = (_a = cached == null ? void 0 : cached.sections) == null ? void 0 : _a.filter((section) => {
        var _a2, _b2;
        return section.type === "code" && /^```(?:tasks|dataview|dataviewjs)\s*$/i.test((_b2 = (_a2 = contentLines[section.position.start.line]) == null ? void 0 : _a2.trim()) != null ? _b2 : "");
      })) != null ? _b : [];
      if (!blocks.length) continue;
      for (const block of blocks) {
        const lines = contentLines.slice(block.position.start.line, block.position.end.line + 1);
        const markdown = lines.join("\n");
        if (markdown.trim()) matches.push({ path: file.path, markdown });
      }
    }
    if (!matches.length) list.createEl("p", { text: "\u6CA1\u6709\u627E\u5230 Tasks\u3001Dataview \u6216 DataviewJS \u4EE3\u7801\u5757\u3002", cls: "hb-muted" });
    for (const item of matches.slice(0, 100)) {
      const button = list.createEl("button", { cls: "hb-picker-item" });
      button.createEl("strong", { text: item.path });
      button.createEl("small", { text: item.markdown.split("\n").slice(0, 2).join(" ") });
      button.onclick = () => {
        this.onPick(item.markdown);
        this.close();
      };
    }
  }
};
var NewHomeModal = class extends import_obsidian.Modal {
  constructor(appRef, plugin) {
    super(appRef);
    this.appRef = appRef;
    this.plugin = plugin;
    this.name = "";
  }
  onOpen() {
    this.contentEl.addClass("hb-modal");
    this.contentEl.createEl("h2", { text: "\u65B0\u5EFA\u4E3B\u9875" });
    this.contentEl.createEl("p", { text: "\u65B0\u4E3B\u9875\u4ECE\u8D77\u6B65\u6A21\u677F\u5F00\u59CB\uFF0C\u4E4B\u540E\u53EF\u5355\u72EC\u7F16\u8F91\u5E03\u5C40\u3001\u80CC\u666F\u4E0E\u6A21\u5757\u3002" });
    new import_obsidian.Setting(this.contentEl).setName("\u4E3B\u9875\u540D\u79F0").addText((text) => text.setPlaceholder("\u4F8B\u5982\uFF1A\u5DE5\u4F5C\u3001\u5B66\u4E60\u3001\u65C5\u884C").onChange((value) => this.name = value));
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    new import_obsidian.ButtonComponent(actions).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian.ButtonComponent(actions).setButtonText("\u65B0\u5EFA").setCta().onClick(async () => {
      await this.plugin.createPage(this.name);
      this.close();
    });
  }
};
var PageManagerModal = class _PageManagerModal extends import_obsidian.Modal {
  constructor(appRef, plugin) {
    super(appRef);
    this.appRef = appRef;
    this.plugin = plugin;
  }
  onOpen() {
    this.contentEl.addClass("hb-modal");
    this.contentEl.createEl("h2", { text: "\u7BA1\u7406\u4E3B\u9875" });
    new import_obsidian.Setting(this.contentEl).setName("\u5F53\u524D\u4E3B\u9875\u540D\u79F0").addText((text) => text.setValue(this.plugin.config.pageName).onChange((value) => this.plugin.config.pageName = value)).addButton((button) => button.setButtonText("\u4FDD\u5B58\u540D\u79F0").onClick(async () => {
      await this.plugin.renamePage(this.plugin.config.pageName);
      new import_obsidian.Notice("\u4E3B\u9875\u540D\u79F0\u5DF2\u66F4\u65B0\u3002");
    }));
    new import_obsidian.Setting(this.contentEl).setName("\u65B0\u5EFA\u4E3B\u9875").setDesc("\u4ECE\u8D77\u6B65\u6A21\u677F\u521B\u5EFA\u4E00\u5F20\u72EC\u7ACB\u4E3B\u9875\u3002").addButton((button) => button.setButtonText("\u65B0\u5EFA").setCta().onClick(() => {
      this.close();
      new NewHomeModal(this.appRef, this.plugin).open();
    }));
    new import_obsidian.Setting(this.contentEl).setName("\u590D\u5236\u5F53\u524D\u4E3B\u9875").setDesc("\u590D\u5236\u5E03\u5C40\u3001\u6A21\u5757\u3001\u4E3B\u9898\u548C\u6A2A\u5E45\u5230\u65B0\u4E3B\u9875\u3002").addButton((button) => button.setButtonText("\u590D\u5236").onClick(async () => {
      await this.plugin.duplicateActivePage();
      this.close();
    }));
    this.contentEl.createEl("h3", { text: "\u4E3B\u9875\u987A\u5E8F" });
    const pages = this.plugin.listPages();
    pages.forEach((page, index) => {
      new import_obsidian.Setting(this.contentEl).setName(page.name).setDesc(page.id === this.plugin.config.pageId ? "\u5F53\u524D\u4E3B\u9875" : "").addButton((button) => button.setIcon("arrow-up").setTooltip("\u4E0A\u79FB").setDisabled(index === 0).onClick(async () => {
        await this.plugin.movePage(page.id, -1);
        this.close();
        new _PageManagerModal(this.appRef, this.plugin).open();
      })).addButton((button) => button.setIcon("arrow-down").setTooltip("\u4E0B\u79FB").setDisabled(index === pages.length - 1).onClick(async () => {
        await this.plugin.movePage(page.id, 1);
        this.close();
        new _PageManagerModal(this.appRef, this.plugin).open();
      }));
    });
    new import_obsidian.Setting(this.contentEl).setName("\u5220\u9664\u5F53\u524D\u4E3B\u9875").setDesc("\u81F3\u5C11\u4F1A\u4FDD\u7559\u4E00\u5F20\u4E3B\u9875\u3002").addButton((button) => button.setButtonText("\u5220\u9664").setWarning().onClick(() => new ConfirmModal(this.appRef, "\u5220\u9664\u5F53\u524D\u4E3B\u9875\uFF1F", "\u6B64\u4E3B\u9875\u7684\u5E03\u5C40\u3001\u6A21\u5757\u548C\u4E3B\u9898\u8BBE\u7F6E\u5C06\u88AB\u5220\u9664\u3002", async () => {
      await this.plugin.deleteActivePage();
      this.close();
    }).open()));
  }
};
var TemplateModal = class extends import_obsidian.Modal {
  constructor(appRef, plugin) {
    super(appRef);
    this.appRef = appRef;
    this.plugin = plugin;
  }
  onOpen() {
    this.contentEl.addClass("hb-modal");
    this.contentEl.createEl("h2", { text: "\u9009\u62E9\u4E3B\u9875\u6A21\u677F" });
    const choices = [
      ["xiaoxin", "\u5C0F\u65B0\u77E5\u8BC6\u5E93", "\u5FEB\u6377\u5165\u53E3\u3001\u4ECA\u65E5\u5F85\u529E\u548C\u9605\u8BFB\u8FDB\u5EA6"],
      ["focus", "\u4E13\u6CE8\u6781\u7B80", "\u5927\u53F7\u4ECA\u65E5\u5F85\u529E\u4E0E\u5C11\u91CF\u5E38\u7528\u5165\u53E3"],
      ["blank", "\u7A7A\u767D\u4E3B\u9875", "\u4ECE\u96F6\u6DFB\u52A0\u81EA\u5DF1\u7684\u6A21\u5757"]
    ];
    for (const [id, title, description] of choices) {
      new import_obsidian.Setting(this.contentEl).setName(title).setDesc(description).addButton((button) => button.setButtonText("\u5E94\u7528").onClick(() => new ConfirmModal(this.appRef, `\u5E94\u7528\u201C${title}\u201D\u6A21\u677F\uFF1F`, "\u4F1A\u66FF\u6362\u5F53\u524D\u4E3B\u9875\u7684\u4E09\u7AEF\u6A21\u5757\u5E03\u5C40\u3002", async () => {
        await this.plugin.applyTemplate(id);
        this.close();
      }).open()));
    }
  }
};
var LayoutTransferModal = class extends import_obsidian.Modal {
  constructor(appRef, plugin, device) {
    super(appRef);
    this.appRef = appRef;
    this.plugin = plugin;
    this.device = device;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("hb-modal");
    contentEl.createEl("h2", { text: "\u6A21\u5757\u5BFC\u5165\u4E0E\u5BFC\u51FA" });
    contentEl.createEl("p", { text: "\u5BFC\u51FA\u5185\u5BB9\u53EF\u4EE5\u4FDD\u5B58\u5230\u4EFB\u610F\u7B14\u8BB0\u6216\u5206\u4EAB\u7ED9\u5176\u4ED6 Home Builder \u7528\u6237\uFF1B\u5BFC\u5165\u4F1A\u8FFD\u52A0\u5230\u5F53\u524D\u8BBE\u5907\u5E03\u5C40\u3002", cls: "setting-item-description" });
    const exported = contentEl.createEl("textarea", { cls: "hb-textarea" });
    exported.value = JSON.stringify(this.plugin.resolvedLayout(this.device).modules, null, 2);
    new import_obsidian.Setting(contentEl).setName("\u5BFC\u51FA\u5F53\u524D\u5E03\u5C40").addButton((button) => button.setButtonText("\u590D\u5236 JSON").onClick(async () => {
      var _a;
      await ((_a = navigator.clipboard) == null ? void 0 : _a.writeText(exported.value));
      new import_obsidian.Notice("\u6A21\u5757 JSON \u5DF2\u590D\u5236\u3002 ");
    }));
    contentEl.createEl("h3", { text: "\u5BFC\u5165\u6A21\u5757" });
    const imported = contentEl.createEl("textarea", { cls: "hb-textarea", placeholder: "\u7C98\u8D34 Home Builder \u6A21\u5757 JSON\u2026" });
    new import_obsidian.ButtonComponent(contentEl).setButtonText("\u5BFC\u5165\u5E76\u8FFD\u52A0\u6A21\u5757").setCta().onClick(async () => {
      try {
        const parsed = JSON.parse(imported.value);
        const modules = Array.isArray(parsed) ? parsed : parsed.modules;
        if (!Array.isArray(modules)) throw new Error("JSON \u4E2D\u6CA1\u6709 modules \u6570\u7EC4");
        this.plugin.resolvedLayout(this.device).modules.push(...clone(modules).map((item) => ({ ...item, id: newId() })));
        await this.plugin.saveConfig("\u5BFC\u5165\u6A21\u5757");
        new import_obsidian.Notice(`\u5DF2\u5BFC\u5165 ${modules.length} \u4E2A\u6A21\u5757\u3002`);
        this.close();
      } catch (error) {
        new import_obsidian.Notice(`\u65E0\u6CD5\u5BFC\u5165\uFF1A${String(error)}`);
      }
    });
  }
};
var ConfirmModal = class extends import_obsidian.Modal {
  constructor(appRef, titleText, description, confirm) {
    super(appRef);
    this.appRef = appRef;
    this.titleText = titleText;
    this.description = description;
    this.confirm = confirm;
  }
  onOpen() {
    this.contentEl.createEl("h2", { text: this.titleText });
    this.contentEl.createEl("p", { text: this.description });
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    new import_obsidian.ButtonComponent(actions).setButtonText("\u53D6\u6D88").onClick(() => this.close());
    new import_obsidian.ButtonComponent(actions).setButtonText("\u786E\u8BA4").setWarning().onClick(async () => {
      await this.confirm();
      this.close();
    });
  }
};
var HomeBuilderSettings = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Home Builder \u8BBE\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u914D\u7F6E\u6587\u4EF6\u8DEF\u5F84").setDesc("\u8BE5 JSON \u4F4D\u4E8E\u5E93\u5185\uFF0C\u53EF\u88AB Obsidian \u540C\u6B65\u65B9\u6848\u540C\u6B65\u3002\u4FEE\u6539\u540E\u4FDD\u5B58\u5373\u4F1A\u8FC1\u79FB\u5230\u65B0\u8DEF\u5F84\u3002").addText((text) => text.setValue(this.plugin.config.configPath).onChange((value) => this.plugin.config.configPath = value.trim() || DEFAULT_CONFIG_PATH));
    new import_obsidian.Setting(containerEl).setName("\u5E03\u5C40\u6A21\u5F0F").setDesc("\u72EC\u7ACB\uFF1A\u4E09\u7AEF\u5206\u522B\u7F16\u8F91\uFF1B\u5171\u4EAB\uFF1A\u7EDF\u4E00\u54CD\u5E94\u5F0F\uFF1B\u6DF7\u5408\uFF1A\u53EF\u4E3A\u8BBE\u5907\u4FDD\u7559\u8986\u5199\u3002").addDropdown((drop) => drop.addOption("independent", "\u72EC\u7ACB\u5E03\u5C40").addOption("shared", "\u5171\u4EAB\u54CD\u5E94\u5F0F\u5E03\u5C40").addOption("hybrid", "\u6DF7\u5408\u5E03\u5C40").setValue(this.plugin.config.layoutMode).onChange((value) => this.plugin.config.layoutMode = value));
    new import_obsidian.Setting(containerEl).setName("\u684C\u9762\u7F51\u683C\u5217\u6570").setDesc("\u624B\u673A\u59CB\u7EC8\u5355\u5217\uFF0CPad \u56FA\u5B9A\u53CC\u5217\uFF1B\u7535\u8111\u53EF\u9009 2\u30013 \u6216 4 \u5217\u3002").addDropdown((drop) => drop.addOption("2", "2 \u5217").addOption("3", "3 \u5217").addOption("4", "4 \u5217").setValue(String(this.plugin.config.settings.gridColumns)).onChange((value) => this.plugin.config.settings.gridColumns = Number(value)));
    new import_obsidian.Setting(containerEl).setName("\u542F\u52A8\u65F6\u6253\u5F00 Home Builder").setDesc("\u53EF\u9009\u3002\u5F00\u542F\u540E\u4F1A\u5728 Obsidian \u5E03\u5C40\u5C31\u7EEA\u65F6\u6253\u5F00\u6307\u5B9A\u4E3B\u9875\uFF1B\u4E0D\u4F1A\u4FEE\u6539 Homepage \u63D2\u4EF6\u7684\u914D\u7F6E\u3002").addToggle((toggle) => toggle.setValue(this.plugin.config.settings.openOnStartup).onChange((value) => this.plugin.config.settings.openOnStartup = value));
    new import_obsidian.Setting(containerEl).setName("\u542F\u52A8\u4E3B\u9875").setDesc("\u4EC5\u5728\u5F00\u542F\u542F\u52A8\u4E3B\u9875\u540E\u751F\u6548\u3002").addDropdown((drop) => {
      drop.addOption("", "\u5F53\u524D\u4E3B\u9875");
      for (const page of this.plugin.listPages()) drop.addOption(page.id, page.name);
      return drop.setValue(this.plugin.config.settings.startupPageId).onChange((value) => this.plugin.config.settings.startupPageId = value);
    });
    new import_obsidian.Setting(containerEl).setName("\u540C\u6B65\u51B2\u7A81\u5904\u7406").setDesc("\u5F53 S3 \u6216\u5176\u4ED6\u8BBE\u5907\u6539\u5199\u5E93\u5185 JSON \u65F6\uFF0C\u5148\u91CD\u65B0\u8BFB\u53D6\u6216\u4ECE\u5386\u53F2\u6062\u590D\uFF1B\u4E0D\u4F1A\u9759\u9ED8\u8986\u76D6\u3002").addButton((button) => button.setButtonText("\u91CD\u65B0\u8BFB\u53D6\u5E93\u5185\u914D\u7F6E").onClick(() => void this.plugin.reloadConfigFromVault())).addButton((button) => button.setButtonText("\u67E5\u770B\u5386\u53F2\u7248\u672C").onClick(() => new HistoryModal(this.app, this.plugin).open()));
    new import_obsidian.Setting(containerEl).addButton((button) => button.setButtonText("\u4FDD\u5B58\u8BBE\u7F6E").setCta().onClick(async () => {
      await this.plugin.saveConfig("\u66F4\u65B0\u8BBE\u7F6E");
      new import_obsidian.Notice("Home Builder \u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002");
    }));
  }
};
var HistoryModal = class extends import_obsidian.Modal {
  constructor(appRef, plugin) {
    super(appRef);
    this.appRef = appRef;
    this.plugin = plugin;
  }
  onOpen() {
    var _a;
    this.contentEl.addClass("hb-modal");
    this.contentEl.createEl("h2", { text: "\u4E3B\u9875\u914D\u7F6E\u5386\u53F2" });
    const entries = (_a = this.plugin.config.history) != null ? _a : [];
    if (!entries.length) this.contentEl.createEl("p", { text: "\u6682\u65E0\u5386\u53F2\u7248\u672C\u3002\u6BCF\u6B21\u4FDD\u5B58\u4E3B\u9875\u914D\u7F6E\u4F1A\u4FDD\u7559\u6700\u8FD1 10 \u6B21\u5FEB\u7167\u3002", cls: "hb-muted" });
    [...entries].reverse().forEach((entry, reverseIndex) => {
      const index = entries.length - 1 - reverseIndex;
      new import_obsidian.Setting(this.contentEl).setName(new Date(entry.at).toLocaleString()).setDesc(entry.reason).addButton((button) => button.setButtonText("\u6062\u590D\u6B64\u7248\u672C").setWarning().onClick(() => new ConfirmModal(this.appRef, "\u6062\u590D\u8FD9\u4E2A\u5386\u53F2\u7248\u672C\uFF1F", "\u4F1A\u66FF\u6362\u5F53\u524D\u4E3B\u9875\u914D\u7F6E\uFF0C\u5E76\u81EA\u52A8\u4FDD\u7559\u4E00\u4EFD\u65B0\u7684\u6062\u590D\u524D\u5FEB\u7167\u3002", async () => {
        await this.plugin.restoreHistory(index);
        this.close();
      }).open()));
    });
  }
};
