# Homepage fractal background implementation spec

Status: proposed implementation; documentation only. Application code has not been changed for this proposal.

## Intended experience

The fractal is a stationary background for the entire homepage. On arrival at the top, the visitor watches its existing growth animation through a clear opening section. Two seconds after the final frame appears, the page scrolls smoothly to “Hi, I'm Keith!” A translucent surface moves upward with that section, softening the fractal behind the text. Scrolling back to the top reveals the completed fractal again without replaying the animation or triggering another automatic scroll.

Keep the hamburger visible throughout. The proposed first version uses a small, softly fading frosted area around the control rather than a full-width top bar. This is the implementation default from the design discussion; the frosting can be adjusted during visual review.

## Current implementation

- `app/page.tsx` is a server component with a vertically stacked fractal and introduction, including LinkedIn and GitHub links.
- `app/home-fractal.tsx` decodes a prerecorded GIF onto a canvas and holds its last frame. It does not generate a fractal live. Light and dark themes use different assets, dimensions, and framing. Reduced motion and decoder failures use a static image.
- The playback loop explicitly detects the final frame via `index === count - 1`; this is the completion signal to extend.
- `app/home.module.css` contains a constrained image viewport and theme-specific scaling that compensates for blank margins in the source images.
- `app/navigation.tsx` is shared across routes. Its header currently participates in document flow; only its dropdown has a frosted surface.
- `app/globals.css` owns the theme, typography, spacing, and reduced-motion rules. The dark background deliberately matches the dark fractal asset.

## Layout and appearance

Use three layers, with explicit stacking inside an isolated homepage root:

1. A fixed, viewport-filling decorative background containing the existing fractal renderer and the theme background color.
2. Normal document flow containing a transparent opening section followed by the translucent introduction section.
3. The fixed homepage navigation above both layers, including its dropdown and theme toggle.

The background belongs only to `/` and disappears when that route unmounts. Avoid negative stacking that could place it behind the opaque body. The background must not intercept pointer events or enter the keyboard tab order.

The opening section occupies one stable viewport height (`100svh`). The background surface must cover the visible viewport as mobile browser chrome changes; size the artwork against the stable viewport so those changes do not repeatedly rescale it. Center the full fractal, retaining its aspect ratio and theme-specific compensation for source-image margins. Preserve the current approximate artwork scale as a starting point. A full-page background does not require stretching or cropping the artwork to fill the screen.

The introduction is full width and at least one stable viewport tall, allowing it to fully cover the opening view at the scroll destination. Center its content vertically with generous padding, keep the text left aligned in a narrow centered column, and allow the section to grow naturally on short screens or at increased text size. Keep the current introduction copy, social links, and heading accent.

Use a translucent theme-background surface over the entire introduction section, initially around 85% opacity, then tune through visual review. Light mode softens the fractal toward white; dark mode dims it toward the existing dark background. Keep the text itself fully opaque. The artwork should remain perceptible without interfering with reading; do not apply opacity to the section as a whole. Start without blur on the introduction.

Use existing font, spacing, and color tokens. Add any reusable overlay or navigation-surface tokens in `app/globals.css`, with semantic names and light/dark values where needed. Remove the existing homepage mobile `--fs-h1` override as part of the layout replacement so the title follows the shared heading scale.

## Navigation

- On `/`, fix the header at the top with the hamburger centered and the theme toggle at the right. Retain comfortable top and side spacing, including mobile safe areas.
- Keep both controls visible at every scroll position. Do not implement scroll-direction hiding.
- Give the hamburger a compact translucent background with backdrop blur and a soft fade at its edges. Use a decorative pseudo-element for the fade so the button and focus outline remain sharp. Provide equivalent contrast protection for the theme toggle.
- The fade is functional contrast protection, not a decorative gradient across the page. Avoid a border, shadow, or full-width bar in the first version.
- Preserve dropdown behavior, active-route indication, outside-click dismissal, Escape handling, and visible keyboard focus. Keep the dropdown above the frosted treatment and page content.
- Ensure readable control backgrounds when backdrop filtering is unavailable.
- Apply fixed positioning and new control frosting only on the homepage. Other routes retain their existing header composition.

## Playback and automatic scrolling

Keep rendering and scrolling responsibilities separate. The fractal renderer reports successful playback completion; a small homepage client component owns the introduction target, eligibility, timer, and scroll action. The page can remain a server component and pass its introduction markup as children.

The sequence is:

1. On a fresh homepage mount, allow an automatic scroll only if the page is at the top, has no URL hash target, and reduced motion is off. Browser history restoration must take precedence; a restored non-top position cancels eligibility.
2. Play the existing animation once. Emit completion only after the final frame has been drawn, never from asset download completion or an estimated animation duration.
3. When completion arrives and the page remains eligible, start a 2,000 ms delay.
4. Recheck eligibility at the end of the delay. Mark the automatic action consumed before issuing a smooth scroll to the introduction section's start.
5. Keep the completed canvas mounted and unchanged as the visitor scrolls in either direction.

Cancel the pending automatic action for the remainder of that homepage mount when the visitor scrolls manually, uses a wheel or touch gesture, presses a navigation/scroll key, moves focus with Tab, or activates a control or link. Pointer movement alone should not cancel it, but opening the hover menu should. Opening the menu or changing the theme must prevent a later surprise scroll. Detect scrollbar dragging and restored scroll positions through scroll-position observation as well as input events.

Cancellation does not stop fractal playback. Once canceled or consumed, completion callbacks, theme changes, resizing, and scrolling back to the top cannot re-arm the action. A fresh navigation to `/` may start a new sequence if it opens at the top and satisfies the same conditions.

If the document becomes hidden before the automatic scroll, cancel the pending action rather than allowing a delayed jump when the visitor returns. Use native smooth scrolling so ordinary user input can interrupt it; do not run a custom animation that fights the visitor's scroll.

Do not move keyboard focus when scrolling automatically. Account for the fixed controls with section padding so the introduction heading is never obscured.

## Fallbacks and accessibility

- Reduced motion: display the existing static final image and skip automatic scrolling entirely. A runtime change to reduced motion cancels pending scrolling.
- Unsupported decoder, fetch failure, or decode failure: retain the existing static-image fallback and skip automatic scrolling. If that image also fails, preserve a usable page with the theme background and readable content.
- Include a discreet “About me” anchor in the opening section that links to the introduction. It provides an explicit route past the opening view, works without playback completion, and remains usable with reduced motion. Use a real text link and visible focus style; reduced motion makes its navigation immediate.
- Remove the current whole-fractal link to `/fractals` when the renderer becomes decorative. Add an explicit “Explore the fractal generator” link to the introduction instead, using a plain anchor.
- Preserve one `h1`, semantic section labeling, social-link accessible names, and decorative treatment for the canvas/static background image.
- Keep content available in normal document flow regardless of JavaScript or image loading. Do not hide or gate the introduction until playback finishes.
- Avoid scroll snapping, scroll locking, parallax, replay on scroll, or announcements for the decorative animation.

## Planned file changes

| File | Responsibility |
| --- | --- |
| `app/page.tsx` | Compose the homepage experience, preserve introduction content, add explicit introduction and generator links. |
| `app/home-experience.tsx` (new) | Client wrapper for background/opening/content composition, completion callback, one-time scroll eligibility, cancellation, and timer cleanup. |
| `app/home-fractal.tsx` | Preserve GIF decoding and theme behavior; report successful final-frame completion and replace the interactive image wrapper with decorative markup. |
| `app/home.module.css` | Replace the stacked media layout with fixed background, transparent opening, translucent introduction, responsive framing, and narrow content composition. |
| `app/navigation.tsx` | Apply a homepage-specific header modifier and expose menu-open interaction to the homepage cancellation logic if required. |
| `app/navigation.module.css` | Homepage fixed positioning, compact frosted control surfaces, safe-area spacing, and dropdown layering. |
| `app/globals.css` | Add semantic surface tokens only where needed; retain shared typography and reduced-motion behavior. |

Prefer a narrowly scoped homepage interaction event for hover-menu cancellation if document input listeners cannot observe that transition. Do not add global scroll state or refactor the shared shell just to coordinate this interaction. Preserve stable callback identities so callback changes do not restart the renderer effect. Clean up timers, event listeners, decoder resources, and animation work on unmount; verify React development effect replay cannot produce duplicate scrolling.

No new runtime dependency, generated fractal asset, backend change, or route is expected. Preserve `.next-dev` for development and `.next` for production builds.

## Validation and acceptance criteria

Before starting a server, inspect the Codex app terminal and project processes. Reuse the existing Next.js development server and preview tab, keep the server alive during changes, and diagnose any unhealthy instance before replacing it.

Verify the following during implementation:

- A fresh, untouched visit plays once, holds the last frame for approximately two seconds, and scrolls the introduction into view exactly once.
- The fractal stays stationary throughout the scroll; the translucent section visibly moves over it.
- Returning to the top reveals the held final frame and causes neither replay nor another automatic scroll.
- Manual scrolling, keyboard interaction, theme changes, menu opening, hidden tabs, and history restoration suppress the pending automatic action. Test interaction both during playback and during the two-second delay.
- Reduced motion and decoder/network failures preserve readable content and manual navigation without automatic scrolling.
- The hamburger and theme toggle stay visible and readable, the dropdown works with pointer and keyboard, and focus outlines remain unclipped.
- Both themes work on desktop, narrow mobile, and short landscape viewports, with mobile browser controls and enlarged text. No distorted fractal, unintended clipping of its shape, horizontal page overflow, or hidden introduction content.
- Readability is checked against the actual final fractal in both themes, including text and focus contrast over the translucent surfaces.
- Check `/content` as well as `/` because navigation and global tokens are shared. Verify leaving the homepage removes its fixed background and navigation treatment.
- Run TypeScript checking and a production build using the repository's existing tooling. Add focused behavior tests for scroll eligibility/cancellation if practical in the available test setup; do not add a test framework solely for cosmetic checks.
- Review the diff to ensure unrelated working-tree changes remain untouched.

Visual review may tune artwork scale, introduction opacity, and the frosted fade extent. The interaction contract above should remain stable while those values are adjusted.
