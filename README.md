# Obsidian Home Builder

A mobile-first, visual home dashboard builder for Obsidian. Build a responsive homepage without hand-maintaining a large Markdown file.

## Capabilities

- Separate, shared, or hybrid layouts for phone, tablet, and desktop.
- Multiple named home pages, each with its own modules, layouts, and appearance.
- Visual shortcut, text, Markdown-query, calendar, countdown, image, bookshelf, digital-assets, AI-usage, and weather modules. Weather can remain fully manual or opt into Open-Meteo automatic updates by city or device location; no API key is required.
- Visual Tasks filtering for folder, tag, completion, due date, priority, repeating tasks, sorting, and limits.
- Dataview table/list/task builders, common presets, and a picker that can reuse a Tasks/Dataview/DataviewJS block from an existing note without editing that note.
- Vault pickers for shortcut destinations, background images, optional per-page banner images, and module images. Image values may also be external URLs.
- Optional per-page banner with title, subtitle, accessible alt text, overlay, height, and rounded/full-width presentation.
- Desktop/Pad drag reordering, touch-safe move controls, module duplication, page duplication/sorting, device-specific hiding, layout sync, 2–4 column desktop grids, and three starter templates.
- Module JSON import/export, the last 10 configuration snapshots with restore controls, automatic visible-dashboard refresh, and a non-destructive warning when the vault configuration changes externally.
- Optional startup opening for a selected dashboard page. This does not change the configuration of any separate Homepage plugin.
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
