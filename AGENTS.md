# Development workflow

- Before starting the Next.js development server, inspect the Codex app terminal and the current project processes for an existing `next dev` session.
- Reuse the existing development server whenever one is running. Do not start a second server or switch ports to work around an occupied port.
- Keep the development server alive while making and validating changes so Next.js Fast Refresh can update the existing preview.
- This app intentionally uses `.next-dev` for `next dev` and `.next` for production builds. Preserve that separation so `next build` cannot overwrite the running preview's output.
- Reuse the existing Codex browser tab for the local preview. Do not open duplicate preview tabs.
- If an existing server is unhealthy, diagnose it first. Restart it only when recovery requires a restart, and replace the old process rather than running another alongside it.

# Visual style guide

## Design philosophy

- Favor restraint, clarity, and confidence. The site should feel like a thoughtful personal workshop: technically precise, sophisticated, and human.
- Follow Column's typographic method rather than copying its appearance: use one primary family, create hierarchy through weight and scale, and reserve specialized type for specialized content.
- Let typography, spacing, color, and strong content create the visual identity. Avoid unnecessary cards, shadows, gradients, borders, decorative icons, and interface chrome.
- Prefer a few deliberate decisions repeated consistently over many novel treatments.

## Typography

- Hanken Grotesk is the single primary typeface for prose and interface text, including headings, navigation, labels, metadata, and controls.
- Use the system monospace stack only for code, technical values, machine output, or content whose structure benefits from fixed-width characters.
- Do not introduce another branded font without an explicit design decision from the user.
- Create hierarchy primarily with weight, size, line height, spacing, and color:
  - Body prose: 400.
  - Navigation, labels, metadata, and content titles: 500.
  - Section headings: 500–600.
  - Major page headings: 700.
- Use the fluid font-size tokens in `app/globals.css`. Do not add arbitrary page-specific font sizes when an existing token or semantic element is suitable.
- Keep large headings tightly led and slightly tracked; keep body copy open and comfortable. Preserve `--leading-tight`, `--leading-body`, and the `--measure` reading width.
- Use semantic HTML headings in order. Do not choose heading tags for their visual size.

## Color

- Use semantic color tokens from `app/globals.css`; do not add raw color values inside components or pages.
- White is the default background. Dark slate is the default prose color. Deep and primary blues establish hierarchy and interaction.
- Navigation links are near-black by default and primary blue when active or hovered. Do not underline navigation links.
- Use copper sparingly as an accent, not as a competing primary color.
- Muted text must remain readable. Preserve sufficient contrast for dates, labels, captions, and disabled states.

## Layout and spacing

- Use the global spacing scale rather than arbitrary pixel values.
- Keep general layouts inside `--content-width`; keep reading and index pages substantially narrower.
- Favor generous whitespace and clear alignment over containers and separators.
- Use consistent baselines for metadata and titles. The Content index uses an inline date/title row on larger screens and stacks on small screens.
- Prefer reusable global layout primitives for patterns shared across pages. Page-specific styles should describe composition, not redefine typography or colors.

## Components and interaction

- Keep navigation simple and text-led. The current page is communicated through color and `aria-current`, not decoration.
- Links and controls must have a visible `:focus-visible` state and a clear hover state.
- Preserve reduced-motion behavior. Any new animation should be subtle, purposeful, and disabled when `prefers-reduced-motion` is active.
- Use real text and semantic controls instead of decorative substitutes. Add accessible labels when the visible content does not describe an element's purpose.
- Images should support the content rather than fill empty space. Preserve their aspect ratios and provide meaningful alternative text unless an image is purely decorative.

## Responsive behavior

- Design from the content outward. Do not shrink desktop arrangements until they become cramped; change the composition at the appropriate breakpoint.
- Preserve readable line lengths, comfortable touch targets, and clear spacing on small screens.
- Shared two-column patterns may stack on narrow viewports. Do not require horizontal scrolling except for code and genuinely tabular data.

## Implementation rules

- Treat `app/globals.css` as the source of truth for palette, typography, spacing, resets, accessibility defaults, and shared layout primitives.
- Extend existing semantic tokens before inventing new ones. If a new token is necessary, name it by purpose rather than by a single page or component.
- Avoid inline presentation styles unless a value is genuinely dynamic.
- When changing the design system, check both `/` and `/content` so shared changes remain coherent.
