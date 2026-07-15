# Changelog

All notable user-facing changes are documented here.

## 0.5.3

- Fixes a mobile startup failure that could occur after reopening Obsidian while the vault file index was still catching up with the `Home Builder` folder.
- Home page index generation is now best-effort: it never prevents the saved home configuration from loading or saving.

## 0.5.2

- Activity heatmap cell-size options: automatic, small `10px`, standard `12px`, and large `16px`.
- Automatic cell size uses `12px` on phone, `14px` on tablet, and `16px` on desktop, then recalculates visible weeks for the available module width.

## 0.5.1

- Activity heatmap treats the selected duration as a minimum, adds weeks when space permits, and centers the grid.
- Adds visible `Home Builder/主页索引.md` with dashboard links and configuration location.
- Clarifies multi-dashboard ordering and adds a delete control to every dashboard row.

## 0.5.0

- Adds the Activity Heatmap module.
- Supports all-vault or folder-scoped Markdown activity, automatic/YAML/filename/created/modified date sources, 16/26/52-week windows, week start, color, active-day count, and streak summary.

## 0.4.4

- Tablet grids now support automatic, fixed 2-column, and fixed 3-column modes.
- Large mobile-app screens are recognized as tablet layouts.

## 0.4.3

- Adds left, right, row-up, and row-down module controls for tablet and desktop multi-column layouts.

## 0.4.2

- Calendar no-background modes now remove all date-cell backgrounds, borders, shadows, and focus blocks.

## 0.4.1

- Clarifies calendar style names and adds copyable hex color values.
- Adds module “no card background” control and clearer banner setup guidance.

## 0.4.0

- Adds visual theme controls for page background, accent, card opacity, and banner.
- Adds per-module appearance controls.
- Adds calendar layout, week start, accent, and date-shape controls.

## 0.3.17

- Adds a real mobile scroll spacer so the last module can scroll above Obsidian's bottom bar.

## 0.3.15

- Shows the actual plugin version in the Home Builder title and improves rendering error diagnostics on iOS.

## 0.3.13

- Restores the reliable in-page module picker for mobile and refreshes the editor after module creation.
