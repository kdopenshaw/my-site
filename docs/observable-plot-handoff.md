# Handoff: set up Observable Plot

Set up Observable Plot as the shared chart renderer for this Next.js app. Stop when a future page can import that renderer and pass it plot options. Do not create a chart, a sample dataset, a demo route, or a gallery. Do not change the stock backtester.

Read `AGENTS.md` before editing. `app/globals.css` is the source of truth for color, type, and spacing. The stock backtester chart at `app/projects/stock-backtester/chart.tsx` uses `plotly.js-basic-dist-min`. Leave that dependency and those files alone.

## Install

From the repo root:

```sh
npm install @observablehq/plot
```

Use the current release on npm. The package ships TypeScript types. Import it as `import * as Plot from "@observablehq/plot"`. Docs for the renderer: https://observablehq.com/plot/features/plots

## What to add

Add two files:

- `components/ui/plot.tsx`
- `components/ui/plot.module.css`

Shared UI already lives in `components/ui/` (`slider.tsx`, `questionnaire.tsx`). This renderer is shared the same way. Do not put it under a page folder.

`plot.tsx` is a client component (`"use client"`). `Plot.plot` creates DOM nodes, so it cannot run during server render. Export:

1. A `plotColors` object of site tokens, for any later mark fill or stroke.
2. A `PlotFigure` component that renders one plot into a container.

No other exports. No chart-specific helpers.

### `plotColors`

Map these tokens and nothing else. Values are the CSS variables themselves, not colors read from `getComputedStyle`.

| Key | Token |
| --- | --- |
| `text` | `--color-text` |
| `heading` | `--color-heading` |
| `muted` | `--color-text-muted` |
| `primary` | `--color-primary` |
| `accent` | `--color-accent` |
| `border` | `--color-border` |
| `surface` | `--color-surface` |
| `gain` | `--color-gain` |
| `loss` | `--color-loss` |

Constant fills and strokes in later charts should use these variables, for example `plotColors.primary`. SVG presentation attributes accept `var(--color-primary)`, and the theme on `document.documentElement` updates them without a redraw.

A sequential or diverging color ramp cannot interpolate `var()`. If a later chart needs one, that chart reads the computed token at render time and redraws when the theme changes. Do not add a ramp, or a helper for one, in this setup.

### `PlotFigure`

Props:

- `options: Plot.PlotOptions`, required. The caller owns marks, scales, facets, and size.
- `label: string`, required. This is the accessible name and the visible caption.

Render a `figure` containing a `figcaption` and a `div` the plot mounts into. Use `useId` so `aria-labelledby` on the mount node points at the caption. Give the mount node `role="img"`.

On mount, and whenever `options` changes, call `Plot.plot` and replace the mount node’s children with the returned element. On cleanup, empty the mount node. Plot returns an `SVGSVGElement`, or an `HTMLElement` figure when the options include a legend. Mount whichever comes back.

Merge site defaults under the caller’s options. The caller wins on conflict.

- `style` is an object, merged key by key. Defaults:
  - `background`: `"transparent"` so light and dark page backgrounds show through
  - `color`: `plotColors.text`, which axes and ticks inherit through `currentColor`
  - `fontFamily`: `"var(--font-primary)"` (Source Serif 4, set in `app/layout.tsx` and `app/globals.css`)
  - `fontSize`: `"var(--fs-small)"`
- If `options.style` is a string, ignore the string and keep the object defaults. Callers pass `style` as an object so the merge stays reliable.
- Width is the mount node’s `clientWidth`. If that is 0, skip rendering. A `ResizeObserver` on the mount node redraws when the width changes. Do not hardcode 640, which is Plot’s default width.
- Do not set margins, marks, scales, grids, or legends in the defaults.

Redraw when the window fires `site-theme-change`. `app/theme-toggle.tsx` already dispatches that event, and the inline script in `app/layout.tsx` sets `document.documentElement.dataset.theme` before paint. Redrawing covers plots that bake a computed color. Plots that only use `var()` would update on their own. One path handles both.

`options` will often be a new object every render. Depend on a stable serialization, or document that the caller memoizes `options`. Functions inside `PlotOptions` (`tickFormat`, reducers) do not survive `JSON.stringify`. Keep the dependency honest: if you serialize, strip or replace functions in a way that still changes when their identity changes, or take a `revision` string prop the caller bumps. Prefer a `revision` string prop over a lossy serializer. Do not pull in a new dependency for this.

Plot options that contain functions must be built in a client component. A server component cannot pass those functions across the client boundary. `PlotFigure` is that boundary. Do not add a second API that accepts only JSON.

### CSS

`plot.module.css` uses the global tokens. No raw colors, no new font, no new spacing scale.

- The figure is `min-width: 0` and fills its container. Plot’s SVG is `display: block; width: 100%; height: auto`.
- The caption uses `--font-display`, weight 500, `--fs-small`, and `--color-heading`. Match the caption treatment already used by `.chart figcaption` in `app/projects/stock-backtester/backtester.module.css`. Do not restyle `h1`–`h6`.
- Leave a small gap between caption and plot using `--spacing-xs`.
- Do not draw a card, border, or shadow around the figure. The style guide avoids chrome that the content does not need.
- Respect `prefers-reduced-motion`. The global rule in `app/globals.css` already shortens transitions. Do not add animation here.

Plot’s own axis text uses the `color` and `font-family` set above. Do not fight that with a broad `svg text { fill: ... }` rule. If a default grid color is a hardcoded gray, do not “fix” it until a chart turns a grid on. When that happens, the grid stroke is `plotColors.border`.

## Leave unchanged

- `plotly.js-basic-dist-min`, `app/projects/stock-backtester/chart.tsx`, and `plotly.d.ts`.
- The Content-Security-Policy in `next.config.ts`. Plot renders inline SVG and does not need a new script host.
- `app/globals.css`, unless a token is genuinely missing. None is required for this setup.
- Routes, navigation, and page copy.

## Check

The app has no frontend test runner. After the files typecheck, stop.

```sh
npx tsc --noEmit
```

Do not add a page to look at an empty figure. Visual checks belong to the first real chart, which is out of scope here.

## Done when

- `@observablehq/plot` is in `package.json`.
- `components/ui/plot.tsx` exports `plotColors` and `PlotFigure`.
- `components/ui/plot.module.css` styles the figure and caption with existing tokens.
- `npx tsc --noEmit` succeeds.
- No route renders a plot.
