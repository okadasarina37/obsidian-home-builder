import {
  App,
  ButtonComponent,
  ItemView,
  MarkdownRenderer,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  WorkspaceLeaf,
  normalizePath,
} from "obsidian";

const VIEW_TYPE_HOME_BUILDER = "home-builder-view";
const DEFAULT_CONFIG_PATH = "Home Builder/home-builder.json";

type Device = "mobile" | "tablet" | "desktop";
type LayoutMode = "independent" | "shared" | "hybrid";
type ModuleKind = "shortcuts" | "markdown" | "text";

interface Shortcut {
  label: string;
  target: string;
  icon?: string;
}

interface HomeModule {
  id: string;
  kind: ModuleKind;
  title: string;
  span?: 1 | 2;
  shortcuts?: Shortcut[];
  markdown?: string;
  text?: string;
  queryKind?: "raw" | "tasks" | "dataview";
  query?: { path?: string; tag?: string; limit?: number };
}

interface Layout {
  modules: HomeModule[];
}

interface HomeConfig {
  version: 1;
  layoutMode: LayoutMode;
  configPath: string;
  pageId: string;
  pageName: string;
  savedPages: SavedHomePage[];
  theme: {
    backgroundType: "none" | "color" | "image" | "gradient";
    backgroundValue: string;
    accent: string;
    cardOpacity: number;
  };
  layouts: Record<Device, Layout>;
}

interface SavedHomePage {
  id: string;
  name: string;
  layoutMode: LayoutMode;
  theme: HomeConfig["theme"];
  layouts: Record<Device, Layout>;
}

const newId = () => `hb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function taskMarkdown(query: HomeModule["query"]): string {
  const lines = ["not done"];
  if (query?.path) lines.push(`path includes ${query.path}`);
  if (query?.tag) lines.push(`tags include ${query.tag.startsWith("#") ? query.tag : `#${query.tag}`}`);
  if (query?.limit) lines.push(`limit ${query.limit}`);
  return `\`\`\`tasks\n${lines.join("\n")}\n\`\`\``;
}

function dataviewMarkdown(query: HomeModule["query"]): string {
  const source = query?.path ? `FROM \"${query.path}\"` : "FROM \"\"";
  const limit = query?.limit ? `\nLIMIT ${query.limit}` : "";
  return `\`\`\`dataview\nTABLE WITHOUT ID file.link AS 笔记\n${source}\n${limit.trim()}\n\`\`\``;
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
      markdown: "```dataview\nTABLE WITHOUT ID file.link AS 书籍, reading-progress AS 进度\nFROM \\\"05_Books/epub-bookmarks\\\"\nWHERE reading-progress\nSORT reading-progress DESC\nLIMIT 5\n```",
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
    version: 1,
    layoutMode: "independent",
    configPath: DEFAULT_CONFIG_PATH,
    pageId: newId(),
    pageName: "主页",
    savedPages: [],
    theme: { backgroundType: "none", backgroundValue: "", accent: "#7c3aed", cardOpacity: 0.88 },
    layouts: {
      mobile: { modules: starterModules() },
      tablet: { modules: starterModules() },
      desktop: { modules: starterModules() },
    },
  };
}

export default class HomeBuilderPlugin extends Plugin {
  config: HomeConfig = defaultConfig();

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
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_HOME_BUILDER)[0]
      ?? this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE_HOME_BUILDER, active: true });
    this.app.workspace.revealLeaf(leaf);
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
    return [{ id: this.config.pageId, name: this.config.pageName }, ...this.config.savedPages.map(({ id, name }) => ({ id, name }))];
  }

  private activeSnapshot(): SavedHomePage {
    return {
      id: this.config.pageId,
      name: this.config.pageName,
      layoutMode: this.config.layoutMode,
      theme: clone(this.config.theme),
      layouts: clone(this.config.layouts),
    };
  }

  private applySnapshot(page: SavedHomePage) {
    this.config.pageId = page.id;
    this.config.pageName = page.name;
    this.config.layoutMode = page.layoutMode;
    this.config.theme = clone(page.theme);
    this.config.layouts = clone(page.layouts);
  }

  async createPage(name: string) {
    const cleanName = name.trim() || "新主页";
    this.config.savedPages = [...this.config.savedPages.filter((page) => page.id !== this.config.pageId), this.activeSnapshot()];
    const fresh = defaultConfig();
    fresh.pageName = cleanName;
    this.config.pageId = fresh.pageId;
    this.config.pageName = fresh.pageName;
    this.config.layoutMode = fresh.layoutMode;
    this.config.theme = fresh.theme;
    this.config.layouts = fresh.layouts;
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
    const next = this.config.savedPages[0];
    this.config.savedPages = this.config.savedPages.slice(1);
    this.applySnapshot(next);
    await this.saveConfig();
    new Notice("主页已删除。");
  }

  async syncLayoutFrom(device: Device) {
    const source = clone(this.resolvedLayout(device));
    this.config.layouts = { mobile: clone(source), tablet: clone(source), desktop: clone(source) };
    await this.saveConfig();
    new Notice("已将当前布局同步到手机、Pad 和电脑。");
  }

  async loadConfig() {
    const saved = await this.loadData() as Partial<HomeConfig> | null;
    this.config = { ...defaultConfig(), ...saved, theme: { ...defaultConfig().theme, ...saved?.theme }, savedPages: saved?.savedPages ?? [] };
    const path = normalizePath(this.config.configPath || DEFAULT_CONFIG_PATH);
    try {
      if (await this.app.vault.adapter.exists(path)) {
        const fromVault = JSON.parse(await this.app.vault.adapter.read(path)) as HomeConfig;
        this.config = { ...this.config, ...fromVault, theme: { ...this.config.theme, ...fromVault.theme }, savedPages: fromVault.savedPages ?? [] };
      }
    } catch (error) {
      new Notice(`Home Builder: 无法读取主页配置：${String(error)}`);
    }
  }

  async saveConfig() {
    this.config.savedPages = this.config.savedPages.filter((page) => page.id !== this.config.pageId);
    const path = normalizePath(this.config.configPath || DEFAULT_CONFIG_PATH);
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

  constructor(leaf: WorkspaceLeaf, private plugin: HomeBuilderPlugin) {
    super(leaf);
  }

  getViewType() { return VIEW_TYPE_HOME_BUILDER; }
  getDisplayText() { return "Home Builder"; }
  getIcon() { return "layout-dashboard"; }

  async onOpen() { await this.render(); }

  private device() { return this.selectedDevice ?? this.plugin.getDevice(); }

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
    heading.createEl("span", { text: this.editing ? "编辑中" : "Home Builder", cls: "hb-status" });
    const actions = header.createDiv({ cls: "hb-actions" });
    const pageSelect = actions.createEl("select", { cls: "hb-page-select", attr: { "aria-label": "切换主页" } });
    for (const page of this.plugin.listPages()) pageSelect.createEl("option", { text: page.name, value: page.id });
    pageSelect.value = this.plugin.config.pageId;
    pageSelect.onchange = async () => { await this.plugin.switchPage(pageSelect.value); };
    new ButtonComponent(actions).setIcon("plus").setTooltip("新建主页").onClick(() => new NewHomeModal(this.app, this.plugin).open());
    new ButtonComponent(actions).setIcon("settings-2").setTooltip("管理主页").onClick(() => new PageManagerModal(this.app, this.plugin).open());
    new ButtonComponent(actions).setButtonText(this.editing ? "完成" : "编辑主页").setCta().onClick(async () => {
      this.editing = !this.editing;
      await this.render();
    });
    if (this.editing) this.renderEditorBar(contentEl);

    const grid = contentEl.createDiv({ cls: "hb-grid" });
    const layout = this.plugin.resolvedLayout(this.device());
    if (!layout.modules.length) {
      const empty = grid.createDiv({ cls: "hb-empty" });
      empty.createEl("p", { text: "还没有模块。添加一个快捷入口或查询模块开始吧。" });
    }
    for (const module of layout.modules) await this.renderModule(grid, module, layout);
  }

  private renderEditorBar(container: HTMLElement) {
    const bar = container.createDiv({ cls: "hb-editor-bar" });
    bar.createSpan({ text: "编辑设备" });
    for (const device of ["mobile", "tablet", "desktop"] as Device[]) {
      new ButtonComponent(bar).setButtonText(device === "mobile" ? "手机" : device === "tablet" ? "Pad" : "电脑")
        .setClass(this.device() === device ? "mod-cta" : "").onClick(async () => { this.selectedDevice = device; await this.render(); });
    }
    const add = new ButtonComponent(bar).setButtonText("添加模块");
    add.onClick(() => this.openAddMenu(add.buttonEl));
    new ButtonComponent(bar).setButtonText("同步布局").setTooltip("将当前编辑设备的布局复制给其他设备").onClick(() => new ConfirmModal(this.app, "同步当前布局？", "会用当前设备的模块和排序覆盖其他设备布局。", () => this.plugin.syncLayoutFrom(this.device())).open());
    new ButtonComponent(bar).setButtonText("主题").onClick(() => new ThemeModal(this.app, this.plugin).open());
    new ButtonComponent(bar).setButtonText("模板").onClick(() => new TemplateModal(this.app, this.plugin).open());
  }

  private openAddMenu(anchor: HTMLElement) {
    const menu = document.createElement("div");
    menu.addClass("hb-add-menu");
    const choices: Array<[string, ModuleKind, string, HomeModule["queryKind"]?]> = [
      ["快捷入口", "shortcuts", "链接与常用笔记入口"],
      ["任务清单", "markdown", "可视化生成 Tasks 查询", "tasks"],
      ["Dataview 表格", "markdown", "可视化生成文件夹表格", "dataview"],
      ["自定义查询", "markdown", "粘贴 Tasks、Dataview 或 DataviewJS", "raw"],
      ["文字模块", "text", "标题、说明或提醒"],
    ];
    for (const [label, kind, description, queryKind] of choices) {
      const option = menu.createEl("button", { text: label });
      option.createEl("small", { text: description });
      option.onclick = async () => {
        menu.remove();
        const created: HomeModule = { id: newId(), kind, title: label, span: 1, queryKind };
        if (kind === "shortcuts") created.shortcuts = [];
        if (queryKind === "tasks") { created.query = { limit: 8 }; created.markdown = taskMarkdown(created.query); }
        else if (queryKind === "dataview") { created.query = { limit: 8 }; created.markdown = dataviewMarkdown(created.query); }
        else if (kind === "markdown") created.markdown = "```tasks\nnot done\n```";
        if (kind === "text") created.text = "写一点提示或说明。";
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

  private async renderModule(grid: HTMLElement, module: HomeModule, layout: Layout) {
    const card = grid.createDiv({ cls: `hb-module hb-span-${module.span ?? 1}` });
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
      const controls = titleRow.createDiv({ cls: "hb-module-controls" });
      new ButtonComponent(controls).setIcon("pencil").setTooltip("编辑模块").onClick(() => this.openModuleEditor(module));
      new ButtonComponent(controls).setIcon("copy").setTooltip("复制模块").onClick(async () => {
        const copy = clone(module);
        copy.id = newId();
        copy.title = `${module.title} 副本`;
        layout.modules.splice(layout.modules.indexOf(module) + 1, 0, copy);
        await this.plugin.saveConfig();
      });
      new ButtonComponent(controls).setIcon("arrow-up").setTooltip("上移").setDisabled(layout.modules.indexOf(module) === 0).onClick(async () => { this.move(layout, module, -1); });
      new ButtonComponent(controls).setIcon("arrow-down").setTooltip("下移").setDisabled(layout.modules.indexOf(module) === layout.modules.length - 1).onClick(async () => { this.move(layout, module, 1); });
      new ButtonComponent(controls).setIcon("columns-2").setTooltip("切换宽度").onClick(async () => { module.span = module.span === 2 ? 1 : 2; await this.plugin.saveConfig(); });
      new ButtonComponent(controls).setIcon("trash-2").setTooltip("删除模块").onClick(() => new ConfirmModal(this.app, "删除这个模块？", "模块的数据和布局将被移除。", async () => { layout.modules.splice(layout.modules.indexOf(module), 1); await this.plugin.saveConfig(); }).open());
    }
    const body = card.createDiv({ cls: "hb-module-body" });
    if (module.kind === "shortcuts") {
      const shortcuts = body.createDiv({ cls: "hb-shortcuts" });
      for (const item of module.shortcuts ?? []) {
        const link = shortcuts.createEl("button", { text: item.label, cls: "hb-shortcut" });
        link.setAttribute("aria-label", `打开 ${item.label}`);
        link.onclick = () => void this.openTarget(item.target);
      }
      if (!(module.shortcuts?.length)) body.createEl("p", { text: "点编辑模块添加链接。", cls: "hb-muted" });
    } else if (module.kind === "text") {
      body.createEl("p", { text: module.text ?? "", cls: "hb-text" });
    } else {
      try {
        await MarkdownRenderer.render(this.app, module.markdown ?? "", body, this.plugin.config.configPath, this);
      } catch (error) {
        body.createEl("pre", { text: `查询渲染失败：${String(error)}`, cls: "hb-error" });
      }
    }
  }

  private async openTarget(target: string) {
    const file = this.app.metadataCache.getFirstLinkpathDest(target, this.plugin.config.configPath);
    if (file instanceof TFile) await this.app.workspace.getLeaf("tab").openFile(file);
    else new Notice(`找不到笔记：${target}`);
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
        if (isTasks) new Setting(contentEl).setName("标签筛选").setDesc("可选，例如：#工作").addText((text) => text.setValue(this.module.query?.tag ?? "").onChange((value) => {
          this.module.query!.tag = value.trim();
          this.module.markdown = taskMarkdown(this.module.query);
        }));
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
      }
    } else if (this.module.kind === "text") {
      new Setting(contentEl).setName("正文");
      const area = contentEl.createEl("textarea", { cls: "hb-textarea" });
      area.value = this.module.text ?? "";
      area.oninput = () => this.module.text = area.value;
    } else {
      new Setting(contentEl).setName("快捷链接").setDesc("每行格式：显示名称 | 笔记路径或链接");
      const area = contentEl.createEl("textarea", { cls: "hb-textarea" });
      area.value = (this.module.shortcuts ?? []).map((item) => `${item.label} | ${item.target}`).join("\n");
      area.oninput = () => {
        this.module.shortcuts = area.value.split("\n").map((line) => line.split("|").map((part) => part.trim()))
          .filter(([label, target]) => label && target).map(([label, target]) => ({ label, target }));
      };
    }
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
      .addOption("none", "跟随 Obsidian")
      .addOption("color", "纯色")
      .addOption("gradient", "渐变")
      .addOption("image", "图片 URL")
      .setValue(this.plugin.config.theme.backgroundType)
      .onChange((value) => this.plugin.config.theme.backgroundType = value as HomeConfig["theme"]["backgroundType"]));
    new Setting(contentEl).setName("背景值").setDesc("纯色填 #1e1e2e；渐变填 linear-gradient(...)；图片填 URL。").addText((text) => text.setValue(this.plugin.config.theme.backgroundValue).onChange((value) => this.plugin.config.theme.backgroundValue = value));
    new Setting(contentEl).setName("强调色").addText((text) => text.setValue(this.plugin.config.theme.accent).onChange((value) => this.plugin.config.theme.accent = value));
    new Setting(contentEl).setName("卡片不透明度").addSlider((slider) => slider.setLimits(.45, 1, .05).setValue(this.plugin.config.theme.cardOpacity).setDynamicTooltip().onChange((value) => this.plugin.config.theme.cardOpacity = value));
    const actions = contentEl.createDiv({ cls: "modal-button-container" });
    new ButtonComponent(actions).setButtonText("取消").onClick(() => this.close());
    new ButtonComponent(actions).setButtonText("保存").setCta().onClick(async () => { await this.plugin.saveConfig(); this.close(); });
  }
}

class NewHomeModal extends Modal {
  private name = "";
  constructor(private appRef: App, private plugin: HomeBuilderPlugin) { super(appRef); }
  onOpen() {
    this.contentEl.addClass("hb-modal");
    this.contentEl.createEl("h2", { text: "新建主页" });
    this.contentEl.createEl("p", { text: "新主页从起步模板开始，之后可单独编辑布局、背景与模块。" });
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
    new Setting(this.contentEl).setName("新建主页").setDesc("从起步模板创建一张独立主页。").addButton((button) => button.setButtonText("新建").setCta().onClick(() => {
      this.close();
      new NewHomeModal(this.appRef, this.plugin).open();
    }));
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
    new Setting(containerEl).addButton((button) => button.setButtonText("保存设置").setCta().onClick(async () => { await this.plugin.saveConfig(); new Notice("Home Builder 设置已保存。"); }));
  }
}
