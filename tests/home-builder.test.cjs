const assert = require("node:assert/strict");
const Module = require("node:module");
const test = require("node:test");

class MockPlugin {
  constructor(app) { this.app = app; }
  async loadData() { return null; }
  async saveData() {}
}

class EmptyComponent {}

const obsidianMock = {
    Plugin: MockPlugin,
    ItemView: EmptyComponent,
    Modal: EmptyComponent,
    PluginSettingTab: EmptyComponent,
    Setting: EmptyComponent,
    ButtonComponent: EmptyComponent,
    Notice: class {},
    Platform: { isMobileApp: true },
    normalizePath: (path) => path.replace(/\\/g, "/"),
    MarkdownRenderer: {},
};
const originalLoad = Module._load;
Module._load = (request, parent, isMain) => request === "obsidian"
  ? obsidianMock
  : originalLoad(request, parent, isMain);
try {
  const HomeBuilderPlugin = require("../main.js").default;

  test("loadConfig continues when the index folder exists on disk before Vault indexes it", async () => {
    const writes = [];
    const app = {
      vault: {
        adapter: {
          exists: async (path) => path === "Home Builder",
          write: async (path, content) => writes.push({ path, content }),
        },
        getAbstractFileByPath: () => null,
        createFolder: async () => { throw new Error("Folder already exists"); },
      },
    };
    const plugin = new HomeBuilderPlugin(app);

    await plugin.loadConfig();

    assert.equal(writes.length, 1);
    assert.equal(writes[0].path, "Home Builder/主页索引.md");
  });

  test("openConfiguredStartupPage prefers the mobile startup page on a phone", async () => {
    global.window = { innerWidth: 390, innerHeight: 844 };
    const plugin = new HomeBuilderPlugin({});
    const selected = [];
    plugin.config = {
      pageId: "current",
      savedPages: [{ id: "shared", name: "统一主页" }, { id: "phone", name: "手机主页" }],
      settings: {
        startupPageId: "shared",
        mobileStartupPageId: "phone",
      },
    };
    plugin.switchPage = async (id) => selected.push(id);
    plugin.openHome = async () => {};

    await plugin.openConfiguredStartupPage();

    assert.deepEqual(selected, ["phone"]);
  });
} finally {
  Module._load = originalLoad;
};
