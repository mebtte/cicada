# Components

## Layers

- `src/components` is the design-system and app-shell layer. Components here
  must be reusable outside a single route.
- New components should live in their own directory:
  `src/components/<component>/index.tsx`. Related files such as stories,
  constants, helpers, and tests stay in that component directory.
- Put business-domain UI in `src/features/<domain>` when it is reused by more
  than one page or route.
- Keep route-only UI in `src/pages/<route>` when it is not reused elsewhere.
- Do not import `src/pages/*` from `src/components`.
- Prefer `src/components/app_*` only for application shell patterns such as
  drawers, async state, page frames, and other layout primitives that need PWA
  runtime concerns.

## Promotion Rules

- One page only: keep it near the page.
- Multiple pages in the same domain: move it to `src/features/<domain>`.
- Multiple domains but still business-shaped: move it to a shared feature.
- No business meaning and independently previewable: move it to
  `src/components`.

## Storybook

- Every component in `src/components` must add to Storybook.
- Feature components should add Storybook when their behavior or layout is not
  trivial.
