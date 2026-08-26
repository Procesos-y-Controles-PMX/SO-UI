# `@promexma/ui`

Shared UI primitives for the SO Promexma suite (Portal, Cotizador, Permisos, Carta Responsiva, Equipo Móvil).

## Install

```bash
npm install github:Procesos-y-Controles-PMX/SO-UI#main
```

Peer dependencies (already in each app): `react`, `react-dom`, `motion`.

## Next.js

```js
// next.config.js
transpilePackages: ["@promexma/ui"]
```

```css
/* globals.css */
@import "tailwindcss";
@import "@promexma/ui/clay.css"; /* tokens, .neu-* primitives, clay radii */
@source "../node_modules/@promexma/ui/src";
```

(Adjust the `@source` path if `globals.css` is not next to `app/`.)

`clay.css` is the suite neomorphism layer: canvas-colored surfaces, paired light/dark shadows, `.neu-raised` / `.neu-pressed` / `.neu-button` / `.neu-field` / `.neu-sidebar`, and the clay radius scale. Apps should not redeclare those tokens.

Class-string helpers (`PANEL_CARD`, `FIELD_INPUT`, `SIDEBAR_SHELL`, …) are exported from the package entry.

## Usage

```tsx
import {
  NumberTicker,
  InteractiveGridPattern,
  Terminal,
  TypingAnimation,
  AnimatedSpan,
} from "@promexma/ui";

// Login / hero backdrop with ambient red wave, cursor trail, + hover
<InteractiveGridPattern cellSize={40} skewY={6} wave trail />
```

## Develop

Edit here once → bump / push → apps pick up on next install (or pin a tag).
