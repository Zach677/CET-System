# CET Workbench Design Direction

This project uses a Linear-inspired product workspace direction. Treat Linear as
the strongest visual reference for density, restraint, surface hierarchy, and
navigation shape, while keeping CET Workbench focused on study resources rather
than project management.

## Visual Thesis

CET Workbench should feel like a quiet product tool: dark canvas, left navigation,
compact resource rows, clear metadata, and minimal decoration. The UI should look
usable for repeated study sessions, not like a marketing homepage.

## Color Tokens

- Canvas: `#010102`
- Sidebar: `#08090b`
- Panel: `#0f1011`
- Raised panel: `#141516`
- Text: `#f7f8f8`
- Muted text: `#b9c0ca`
- Subtle text: `#858b96`
- Hairline: `#23252a`
- Strong hairline: `#34343a`
- Accent: `#5e6ad2`
- Accent hover: `#828fff`

Use the accent sparingly for the brand glyph, primary actions, active focus, and
selected states. Do not use gradients, glows, bright semantic palettes, or
decorative background effects.

## Typography

Use the platform UI stack:

```css
"SF Pro Text", "SF Pro Display", ui-sans-serif, system-ui, -apple-system,
BlinkMacSystemFont, "Segoe UI", sans-serif
```

Headings should be medium weight, never overly heavy. Keep letter spacing at `0`
to match the project rules. Small text should remain readable, especially Chinese
metadata and button labels.

## Layout

- Use a left app sidebar on desktop and iPad landscape widths.
- Collapse navigation to a top workspace bar only below compact tablet widths.
- Keep route headers compact. Avoid landing-page hero composition.
- Resource lists should read like product rows: title, year, source, tags, file
  count, and favorite action.
- Download actions stay on detail pages.
- Cards are only for repeated resources, bounded panels, and detail/action areas.
  Avoid card nesting.

## Components

- Buttons use `8px` radius, compact height, and no shadow.
- Panels use `8px` radius, hairline border, and background color steps for depth.
- Resource rows use border separation instead of shadows.
- Badges use small rectangular chips, not oversized pills.
- Theme toggle is a compact segmented control.

## Motion

Keep motion subtle and functional. Use short transitions for background, border,
color, and press scale only. Do not add decorative animation.

## Do

- Keep the app dark by default.
- Prefer normal document flow over absolute-positioned controls.
- Preserve link semantics with `Link` and `NavLink`.
- Keep Base UI as the accessibility primitive layer.
- Verify `/`, `/cet4/papers`, and `/resources/cet4-paper-2024-12-a` after UI
  changes.

## Do Not

- Do not rebuild this as a public landing page.
- Do not use heavy shadows, glassmorphism, decorative gradients, or nested cards.
- Do not make titles too bold.
- Do not make metadata text too faint on white or dark backgrounds.
- Do not move R2/download policy details into UI components.
