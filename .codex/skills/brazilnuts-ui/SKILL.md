---
name: brazilnuts-ui
description: "Create or update BrazilNuts application screens while preserving the existing visual language, layout patterns, shadcn/ui components, and responsive behavior. Use for new dashboard sections, customer/reception flows, campaign panels, or related UI work in this repository."
---

# BrazilNuts UI

Maintain the visual and interaction language established in `src/main.tsx`, `src/components/campaign-panel.tsx`, and `src/index.css`.

## Required workflow

1. Inspect the existing screen and reuse its primitives before adding new ones. Prefer the components in `src/components/ui/` and the aliases configured in `components.json`.
2. Use the shadcn MCP for component discovery before creating a new UI primitive. Search for the needed pattern, inspect examples when useful, and use the MCP-provided add command if a missing component should be installed. Do not replace an existing local component with a registry copy without checking for regressions.
3. Implement the screen as part of the existing dashboard. Preserve the shared sidebar, topbar, card, badge, button, input, slider, and Lucide icon conventions.
4. Verify desktop and mobile widths. Keep the current responsive behavior and collapse multi-column layouts to one column on narrow screens.
5. Run `pnpm build` and, when behavior or shared components changed, `pnpm test`.

## Visual language to preserve

- Mood: calm, operational, premium restaurant workspace; restrained green, cream, white, and neutral gray palette.
- Page background: `#f7f8f5`; cards: white; primary: `#234f3c`; foreground: `#24392e`.
- Secondary surfaces use pale tones such as `#dfe8dc`, `#e7eddc`, and `#f0f5ea`; use red only for destructive/error states.
- Typography uses Inter/system sans-serif. Keep headings compact and confident; supporting text is small, muted, and high line-height.
- Cards use subtle borders, low-contrast shadows, rounded corners, and compact internal padding. Avoid loud shadows, dense decoration, or unrelated colors.
- Use Lucide icons at the small sizes already established. Icons clarify status or action rather than acting as decoration.
- Preserve the hierarchy: status/metrics first, operational controls second, customer experience third, history and explanations last.

## Layout patterns

- Use the existing `SidebarProvider`/`SidebarInset` shell for dashboard screens.
- Use `Card` + `CardContent` for panels. Give each panel a clear title, short muted description, and at most one primary action.
- Use grids for panels and metrics, with a deliberate wide/compact relationship. On mobile, stack panels and keep controls touch-friendly.
- Reuse `.panel-title`, metric cards, badges, and the activity/event pattern when their semantics match. Extend CSS locally and intentionally instead of adding broad global rules.
- Keep navigation labels and UI copy in Portuguese, use Brazilian currency formatting, and label simulated behavior explicitly.

## shadcn MCP rules

When the MCP is available, consult it for missing shadcn patterns such as dialogs, sheets, tabs, tables, forms, or empty states. Search first; then inspect the item/example before installing. Keep `components.json` as the registry source of truth. After adding a component, run the shadcn audit checklist and project build. If no registry is configured, use the standard local primitives and report that registry lookup was unavailable; do not initialize a new design system without the user's request.

## Avoid

- Do not introduce another color palette, typography system, navigation shell, or component library.
- Do not put business rules, prices, discounts, stock, or authoritative terms in generated UI copy; read them from application state.
- Do not make real WhatsApp, payment, or customer-data integrations as part of a visual screen task.
- Do not remove or overwrite existing components merely to match a registry example.
