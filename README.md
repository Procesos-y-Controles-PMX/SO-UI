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
/* globals.css — so Tailwind v4 sees utility classes inside the package */
@source "../node_modules/@promexma/ui/src";
```

(Adjust the relative path if `globals.css` is not next to `app/`.)

## Usage

```tsx
import {
  NumberTicker,
  InteractiveGridPattern,
  Terminal,
  TypingAnimation,
  AnimatedSpan,
} from "@promexma/ui";
```

## Develop

Edit here once → bump / push → apps pick up on next install (or pin a tag).
