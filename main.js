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
function taskMarkdown(query) {
  const lines = ["not done"];
  if (query == null ? void 0 : query.path) lines.push(`path includes ${query.path}`);
  if (query == null ? void 0 : query.tag) lines.push(`tags include ${query.tag.startsWith("#") ? query.tag : `#${query.tag}`}`);
  if (query == null ? void 0 : query.limit) lines.push(`limit ${query.limit}`);
  return `\`\`\`tasks
${lines.join("\n")}
\`\`\``;
}
function dataviewMarkdown(query) {
  const source = (query == null ? void 0 : query.path) ? `FROM "${query.path}"` : 'FROM ""';
  const limit = (query == null ? void 0 : query.limit) ? `
LIMIT ${query.limit}` : "";
  return `\`\`\`dataview
TABLE WITHOUT ID file.link AS \u7B14\u8BB0
${source}
${limit.trim()}
\`\`\``;
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
    version: 1,
    layoutMode: "independent",
    configPath: DEFAULT_CONFIG_PATH,
    pageId: newId(),
    pageName: "\u4E3B\u9875",
    savedPages: [],
    theme: { backgroundType: "none", backgroundValue: "", accent: "#7c3aed", cardOpacity: 0.88 },
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
  }
  async onload() {
    await this.loadConfig();
    this.registerView(VIEW_TYPE_HOME_BUILDER, (leaf) => new HomeBuilderView(leaf, this));
    this.addRibbonIcon("layout-dashboard", "Open Home Builder", () => void this.openHome());
    this.addCommand({ id: "open-home", name: "Open Home Builder", callback: () => void this.openHome() });
    this.addCommand({ id: "new-home", name: "Create a new Home Builder page", callback: () => new NewHomeModal(this.app, this).open() });
    this.addSettingTab(new HomeBuilderSettings(this.app, this));
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
    return [{ id: this.config.pageId, name: this.config.pageName }, ...this.config.savedPages.map(({ id, name }) => ({ id, name }))];
  }
  activeSnapshot() {
    return {
      id: this.config.pageId,
      name: this.config.pageName,
      layoutMode: this.config.layoutMode,
      theme: clone(this.config.theme),
      layouts: clone(this.config.layouts)
    };
  }
  applySnapshot(page) {
    this.config.pageId = page.id;
    this.config.pageName = page.name;
    this.config.layoutMode = page.layoutMode;
    this.config.theme = clone(page.theme);
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
    this.config.layouts = fresh.layouts;
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
    const next = this.config.savedPages[0];
    this.config.savedPages = this.config.savedPages.slice(1);
    this.applySnapshot(next);
    await this.saveConfig();
    new import_obsidian.Notice("\u4E3B\u9875\u5DF2\u5220\u9664\u3002");
  }
  async syncLayoutFrom(device) {
    const source = clone(this.resolvedLayout(device));
    this.config.layouts = { mobile: clone(source), tablet: clone(source), desktop: clone(source) };
    await this.saveConfig();
    new import_obsidian.Notice("\u5DF2\u5C06\u5F53\u524D\u5E03\u5C40\u540C\u6B65\u5230\u624B\u673A\u3001Pad \u548C\u7535\u8111\u3002");
  }
  async loadConfig() {
    var _a, _b;
    const saved = await this.loadData();
    this.config = { ...defaultConfig(), ...saved, theme: { ...defaultConfig().theme, ...saved == null ? void 0 : saved.theme }, savedPages: (_a = saved == null ? void 0 : saved.savedPages) != null ? _a : [] };
    const path = (0, import_obsidian.normalizePath)(this.config.configPath || DEFAULT_CONFIG_PATH);
    try {
      if (await this.app.vault.adapter.exists(path)) {
        const fromVault = JSON.parse(await this.app.vault.adapter.read(path));
        this.config = { ...this.config, ...fromVault, theme: { ...this.config.theme, ...fromVault.theme }, savedPages: (_b = fromVault.savedPages) != null ? _b : [] };
      }
    } catch (error) {
      new import_obsidian.Notice(`Home Builder: \u65E0\u6CD5\u8BFB\u53D6\u4E3B\u9875\u914D\u7F6E\uFF1A${String(error)}`);
    }
  }
  async saveConfig() {
    this.config.savedPages = this.config.savedPages.filter((page) => page.id !== this.config.pageId);
    const path = (0, import_obsidian.normalizePath)(this.config.configPath || DEFAULT_CONFIG_PATH);
    const folder = path.split("/").slice(0, -1).join("/");
    if (folder && !this.app.vault.getAbstractFileByPath(folder)) await this.app.vault.createFolder(folder);
    await this.app.vault.adapter.write(path, JSON.stringify(this.config, null, 2));
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
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("home-builder-view");
    const theme = this.plugin.config.theme;
    contentEl.style.setProperty("--hb-accent", theme.accent);
    contentEl.style.setProperty("--hb-card-opacity", String(theme.cardOpacity));
    contentEl.removeClasses(["hb-bg-color", "hb-bg-image", "hb-bg-gradient"]);
    if (theme.backgroundType !== "none") {
      contentEl.addClass(`hb-bg-${theme.backgroundType}`);
      if (theme.backgroundType === "image") contentEl.style.backgroundImage = `linear-gradient(rgb(var(--background-primary-rgb) / .78), rgb(var(--background-primary-rgb) / .9)), url("${theme.backgroundValue}")`;
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
    new import_obsidian.ButtonComponent(actions).setButtonText(this.editing ? "\u5B8C\u6210" : "\u7F16\u8F91\u4E3B\u9875").setCta().onClick(async () => {
      this.editing = !this.editing;
      await this.render();
    });
    if (this.editing) this.renderEditorBar(contentEl);
    const grid = contentEl.createDiv({ cls: "hb-grid" });
    const layout = this.plugin.resolvedLayout(this.device());
    if (!layout.modules.length) {
      const empty = grid.createDiv({ cls: "hb-empty" });
      empty.createEl("p", { text: "\u8FD8\u6CA1\u6709\u6A21\u5757\u3002\u6DFB\u52A0\u4E00\u4E2A\u5FEB\u6377\u5165\u53E3\u6216\u67E5\u8BE2\u6A21\u5757\u5F00\u59CB\u5427\u3002" });
    }
    for (const module2 of layout.modules) await this.renderModule(grid, module2, layout);
  }
  renderEditorBar(container) {
    const bar = container.createDiv({ cls: "hb-editor-bar" });
    bar.createSpan({ text: "\u7F16\u8F91\u8BBE\u5907" });
    for (const device of ["mobile", "tablet", "desktop"]) {
      new import_obsidian.ButtonComponent(bar).setButtonText(device === "mobile" ? "\u624B\u673A" : device === "tablet" ? "Pad" : "\u7535\u8111").setClass(this.device() === device ? "mod-cta" : "").onClick(async () => {
        this.selectedDevice = device;
        await this.render();
      });
    }
    const add = new import_obsidian.ButtonComponent(bar).setButtonText("\u6DFB\u52A0\u6A21\u5757");
    add.onClick(() => this.openAddMenu(add.buttonEl));
    new import_obsidian.ButtonComponent(bar).setButtonText("\u540C\u6B65\u5E03\u5C40").setTooltip("\u5C06\u5F53\u524D\u7F16\u8F91\u8BBE\u5907\u7684\u5E03\u5C40\u590D\u5236\u7ED9\u5176\u4ED6\u8BBE\u5907").onClick(() => new ConfirmModal(this.app, "\u540C\u6B65\u5F53\u524D\u5E03\u5C40\uFF1F", "\u4F1A\u7528\u5F53\u524D\u8BBE\u5907\u7684\u6A21\u5757\u548C\u6392\u5E8F\u8986\u76D6\u5176\u4ED6\u8BBE\u5907\u5E03\u5C40\u3002", () => this.plugin.syncLayoutFrom(this.device())).open());
    new import_obsidian.ButtonComponent(bar).setButtonText("\u4E3B\u9898").onClick(() => new ThemeModal(this.app, this.plugin).open());
    new import_obsidian.ButtonComponent(bar).setButtonText("\u6A21\u677F").onClick(() => new TemplateModal(this.app, this.plugin).open());
  }
  openAddMenu(anchor) {
    const menu = document.createElement("div");
    menu.addClass("hb-add-menu");
    const choices = [
      ["\u5FEB\u6377\u5165\u53E3", "shortcuts", "\u94FE\u63A5\u4E0E\u5E38\u7528\u7B14\u8BB0\u5165\u53E3"],
      ["\u4EFB\u52A1\u6E05\u5355", "markdown", "\u53EF\u89C6\u5316\u751F\u6210 Tasks \u67E5\u8BE2", "tasks"],
      ["Dataview \u8868\u683C", "markdown", "\u53EF\u89C6\u5316\u751F\u6210\u6587\u4EF6\u5939\u8868\u683C", "dataview"],
      ["\u81EA\u5B9A\u4E49\u67E5\u8BE2", "markdown", "\u7C98\u8D34 Tasks\u3001Dataview \u6216 DataviewJS", "raw"],
      ["\u6587\u5B57\u6A21\u5757", "text", "\u6807\u9898\u3001\u8BF4\u660E\u6216\u63D0\u9192"]
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
    var _a, _b, _c, _d, _e;
    const card = grid.createDiv({ cls: `hb-module hb-span-${(_a = module2.span) != null ? _a : 1}` });
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
      new import_obsidian.ButtonComponent(controls).setIcon("pencil").setTooltip("\u7F16\u8F91\u6A21\u5757").onClick(() => this.openModuleEditor(module2));
      new import_obsidian.ButtonComponent(controls).setIcon("copy").setTooltip("\u590D\u5236\u6A21\u5757").onClick(async () => {
        const copy = clone(module2);
        copy.id = newId();
        copy.title = `${module2.title} \u526F\u672C`;
        layout.modules.splice(layout.modules.indexOf(module2) + 1, 0, copy);
        await this.plugin.saveConfig();
      });
      new import_obsidian.ButtonComponent(controls).setIcon("arrow-up").setTooltip("\u4E0A\u79FB").setDisabled(layout.modules.indexOf(module2) === 0).onClick(async () => {
        this.move(layout, module2, -1);
      });
      new import_obsidian.ButtonComponent(controls).setIcon("arrow-down").setTooltip("\u4E0B\u79FB").setDisabled(layout.modules.indexOf(module2) === layout.modules.length - 1).onClick(async () => {
        this.move(layout, module2, 1);
      });
      new import_obsidian.ButtonComponent(controls).setIcon("columns-2").setTooltip("\u5207\u6362\u5BBD\u5EA6").onClick(async () => {
        module2.span = module2.span === 2 ? 1 : 2;
        await this.plugin.saveConfig();
      });
      new import_obsidian.ButtonComponent(controls).setIcon("trash-2").setTooltip("\u5220\u9664\u6A21\u5757").onClick(() => new ConfirmModal(this.app, "\u5220\u9664\u8FD9\u4E2A\u6A21\u5757\uFF1F", "\u6A21\u5757\u7684\u6570\u636E\u548C\u5E03\u5C40\u5C06\u88AB\u79FB\u9664\u3002", async () => {
        layout.modules.splice(layout.modules.indexOf(module2), 1);
        await this.plugin.saveConfig();
      }).open());
    }
    const body = card.createDiv({ cls: "hb-module-body" });
    if (module2.kind === "shortcuts") {
      const shortcuts = body.createDiv({ cls: "hb-shortcuts" });
      for (const item of (_b = module2.shortcuts) != null ? _b : []) {
        const link = shortcuts.createEl("button", { text: item.label, cls: "hb-shortcut" });
        link.setAttribute("aria-label", `\u6253\u5F00 ${item.label}`);
        link.onclick = () => void this.openTarget(item.target);
      }
      if (!((_c = module2.shortcuts) == null ? void 0 : _c.length)) body.createEl("p", { text: "\u70B9\u7F16\u8F91\u6A21\u5757\u6DFB\u52A0\u94FE\u63A5\u3002", cls: "hb-muted" });
    } else if (module2.kind === "text") {
      body.createEl("p", { text: (_d = module2.text) != null ? _d : "", cls: "hb-text" });
    } else {
      try {
        await import_obsidian.MarkdownRenderer.render(this.app, (_e = module2.markdown) != null ? _e : "", body, this.plugin.config.configPath, this);
      } catch (error) {
        body.createEl("pre", { text: `\u67E5\u8BE2\u6E32\u67D3\u5931\u8D25\uFF1A${String(error)}`, cls: "hb-error" });
      }
    }
  }
  async openTarget(target) {
    const file = this.app.metadataCache.getFirstLinkpathDest(target, this.plugin.config.configPath);
    if (file instanceof import_obsidian.TFile) await this.app.workspace.getLeaf("tab").openFile(file);
    else new import_obsidian.Notice(`\u627E\u4E0D\u5230\u7B14\u8BB0\uFF1A${target}`);
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
    var _a, _b, _c, _d, _e;
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
        if (isTasks) new import_obsidian.Setting(contentEl).setName("\u6807\u7B7E\u7B5B\u9009").setDesc("\u53EF\u9009\uFF0C\u4F8B\u5982\uFF1A#\u5DE5\u4F5C").addText((text) => {
          var _a2, _b2;
          return text.setValue((_b2 = (_a2 = this.module.query) == null ? void 0 : _a2.tag) != null ? _b2 : "").onChange((value) => {
            this.module.query.tag = value.trim();
            this.module.markdown = taskMarkdown(this.module.query);
          });
        });
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
      }
    } else if (this.module.kind === "text") {
      new import_obsidian.Setting(contentEl).setName("\u6B63\u6587");
      const area = contentEl.createEl("textarea", { cls: "hb-textarea" });
      area.value = (_d = this.module.text) != null ? _d : "";
      area.oninput = () => this.module.text = area.value;
    } else {
      new import_obsidian.Setting(contentEl).setName("\u5FEB\u6377\u94FE\u63A5").setDesc("\u6BCF\u884C\u683C\u5F0F\uFF1A\u663E\u793A\u540D\u79F0 | \u7B14\u8BB0\u8DEF\u5F84\u6216\u94FE\u63A5");
      const area = contentEl.createEl("textarea", { cls: "hb-textarea" });
      area.value = ((_e = this.module.shortcuts) != null ? _e : []).map((item) => `${item.label} | ${item.target}`).join("\n");
      area.oninput = () => {
        this.module.shortcuts = area.value.split("\n").map((line) => line.split("|").map((part) => part.trim())).filter(([label, target]) => label && target).map(([label, target]) => ({ label, target }));
      };
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
    new import_obsidian.Setting(contentEl).setName("\u80CC\u666F\u7C7B\u578B").addDropdown((drop) => drop.addOption("none", "\u8DDF\u968F Obsidian").addOption("color", "\u7EAF\u8272").addOption("gradient", "\u6E10\u53D8").addOption("image", "\u56FE\u7247 URL").setValue(this.plugin.config.theme.backgroundType).onChange((value) => this.plugin.config.theme.backgroundType = value));
    new import_obsidian.Setting(contentEl).setName("\u80CC\u666F\u503C").setDesc("\u7EAF\u8272\u586B #1e1e2e\uFF1B\u6E10\u53D8\u586B linear-gradient(...)\uFF1B\u56FE\u7247\u586B URL\u3002").addText((text) => text.setValue(this.plugin.config.theme.backgroundValue).onChange((value) => this.plugin.config.theme.backgroundValue = value));
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
var PageManagerModal = class extends import_obsidian.Modal {
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
    new import_obsidian.Setting(containerEl).addButton((button) => button.setButtonText("\u4FDD\u5B58\u8BBE\u7F6E").setCta().onClick(async () => {
      await this.plugin.saveConfig();
      new import_obsidian.Notice("Home Builder \u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002");
    }));
  }
};
