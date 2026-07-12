# Obsidian Home Builder

A mobile-first, visual home dashboard builder for Obsidian. Build a responsive homepage without hand-maintaining a large Markdown file.

## MVP capabilities

- Separate, shared, or hybrid layouts for phone, tablet, and desktop.
- Visual shortcut, text, and Markdown-query modules.
- Native rendering for Tasks, Dataview, and DataviewJS blocks: the plugin renders their original Markdown, so existing queries and task checkboxes retain their normal behaviour.
- Background image, solid color, gradient, accent color, and card opacity controls.
- A vault-stored JSON configuration file (`Home Builder/home-builder.json` by default) for normal sync compatibility.
- A starter template for the author's numbered-vault structure; it is optional and can be edited or replaced.

## Install for development

```bash
npm install
npm run build
```

Copy `manifest.json`, `main.js`, and `styles.css` to:

```text
<vault>/.obsidian/plugins/home-builder/
```

Then enable **Home Builder** in Obsidian Community Plugins and run **Home Builder: Open Home Builder** from the command palette.

## Data safety

Home Builder does not copy or own your task, book, Dataview, or note data. It stores only layout and module settings, and renders the original query blocks through Obsidian's Markdown renderer.

## License

MIT
