# `@promexma/ui`

Shared UI for the SO Promexma suite (Portal, Cotizador, Permisos, Carta Responsiva, Equipo Móvil, Tickets).

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

`clay.css` is the suite neomorphism layer: canvas-colored surfaces, paired light/dark shadows, `.neu-raised` / `.neu-pressed` / `.neu-button` / `.neu-field` / `.neu-sidebar` / `.neu-popover` / `.neu-option`, and the clay radius scale. Apps should not redeclare those tokens.

Class-string helpers (`PANEL_CARD`, `FIELD_INPUT`, `SIDEBAR_SHELL`, `FILTER_CONTROL_CLASS`, …) are exported from the package entry.

## Catalog

Tokens and motion stay the base layer. These React controls are the shared form/filter catalog — do not copy FilterSelect / MultiSearchSelect / AnimatedFilterDropdown into apps.

| Export | Use |
| --- | --- |
| `Select` / `FilterSelect` | Single value, optional search (`searchable="auto"` past 6 options), portaled combobox. Tab / Shift+Tab close and leave; options are not tab stops (`aria-activedescendant`) |
| `FormSelect` | Same menu, field-height trigger for forms |
| `MultiSelect` | Checkboxes. `searchPlacement="trigger"` is the sucursal type-to-filter field |
| `MultiSearchSelect` | Equipo alias: string options, search in the trigger, clear chip |
| `FilterMultiSelect` | Cotizador alias: `null` = all selected |
| `SearchInput` | Filter search field |
| `Dropdown` | Menu shell if you compose custom rows |
| `Field` / `Input` / `Textarea` | Label + clay fields |
| `NativeSelect` | OS `<select>` fallback — prefer `Select` |
| `Modal` / `PendingButton` / `RefreshButton` | Existing suite primitives |

```tsx
import { Field, FormSelect, MultiSearchSelect } from "@promexma/ui";
import { Building2 } from "lucide-react";

<Field label="Sucursal">
  <FormSelect
    value={sucursal}
    onChange={setSucursal}
    options={sucursales.map((name) => ({ value: name, label: name }))}
  />
</Field>

<MultiSearchSelect
  values={sucursales}
  onChange={setSucursales}
  options={sucursalOptions}
  placeholder="Buscar sucursal..."
  emptyLabel="Todas las sucursales"
  icon={Building2}
/>
```

Decorative pieces (`NoiseField`, `InteractiveGridPattern`, `NumberTicker`, theme toggles) stay exported as before.

## Develop

Edit here once → bump / push → apps pick up on next install (or pin a SHA).
