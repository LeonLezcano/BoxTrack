# BoxTrack — Design System & Surface Specification

> **Mode:** Operate (High-clarity operational logistics, dispatch, and self-storage control)  
> **Dial:** `ENERGY 6 / RHYTHM 6 / MOTION 3`  
> **Primary Surface:** Industrial Night-Yard & Warehouse Dispatch Console (Single Low-Glare Dark Theme + High-Contrast Paper Print Styles)

---

## 1. Visual Identity & Scene Rationale

BoxTrack serves corporate moving crews, fleet dispatchers, forensic pre-damage inspectors, and self-storage facility operators working in loading docks, truck cabs, and warehouse yards. A low-glare graphite canvas (`#111317`) minimizes eye fatigue in dim loading bays and night operations while high-contrast safety amber (`#f59e0b`) and crisp tabular numerals surface cubic volume, QR package codes, SHA-256 seals, and dunning lockouts instantaneously.

Because physical manifests and QR bulto labels must be printed on paper, `@media print` explicitly overrides all dark surfaces to pure white (`#ffffff`) with dark ink (`#111827`) and solid borders.

---

## 2. Color Tokens (Strict Contrast >= 4.5:1 AA)

| Role | Token | Hex | Usage & Contrast |
|---|---|---|---|
| Canvas | `--bg-canvas` | `#111317` | Main viewport background |
| Surface | `--bg-surface` | `#181b22` | Cards, header, sidebar, modals |
| Input / Recessed | `--bg-input` | `#14161d` | Form inputs, selects, textareas |
| Border | `--border-subtle` | `#2b3140` | 1px structural dividers & card borders |
| Text Primary | `--text-primary` | `#f3f5f8` | Headings, values, active labels (15.8:1 on surface) |
| Text Secondary | `--text-secondary` | `#9aa4b5` | Field labels, addresses, metadata (6.6:1 on surface) |
| Accent Safety Amber | `--accent-amber` | `#f59e0b` | Primary CTAs with `#0f1115` dark ink (9.4:1) |
| Highlight Amber | `--accent-amber-text` | `#fbbf24` | Order IDs, active nav, volumetric totals (10.6:1 on surface) |
| Semantic Emerald | `--status-ok-bg` / `--status-ok-text` | `#047857` (btn w/ white 5.48:1) / `#34d399` | Delivered ePOD, active PIN access |
| Semantic Sky | `--status-info-bg` / `--status-info-text` | `#0369a1` (btn w/ white 5.93:1) / `#38bdf8` | Storage contracts, cubic fleet suggestions |
| Semantic Rose | `--status-danger-bg` / `--status-danger-text` | `#be123c` (btn w/ white 6.07:1) / `#fb7185` | Pre-damage acts, dunning lockouts, purge actions |

---

## 3. Typography Scale & Families

- **UI Sans:** `'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
- **Tabular / Forensic Mono:** `'Cascadia Mono', 'Consolas', ui-monospace, SFMono-Regular, monospace` (used strictly for order IDs, QR bulto codes, currency, `m³` measurements, dates, and SHA-256 hashes with `font-variant-numeric: tabular-nums`).

| Element | Size | Weight | Line Height |
|---|---|---|---|
| `h1` | `1.5rem` – `1.75rem` (`24px`–`28px`) | `800` | `1.2` |
| `h2` | `1.25rem` – `1.375rem` (`20px`–`22px`) | `800` | `1.25` |
| `h3` | `1rem` (`16px`) | `700` | `1.35` |
| `h4` | `0.875rem` (`14px`) | `700` | `1.4` |
| `body` | `0.875rem` (`14px`) | `400` | `1.5` |
| `meta / table` | `0.75rem` (`12px`) | `500` | `1.4` |

---

## 4. Layout Rhythm, Components & Accessibility

- **Zero Nested Cards:** Section headers sit directly on the canvas with a `1px` bottom border; cards render in flat responsive grids (`grid-cols-1 md:grid-cols-2`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) using internal horizontal dividers rather than nested bordered boxes.
- **No Side-Tabs or Glass Clutter:** Zero `border-l-4` decorative stripes, zero `backdrop-blur` layers, and zero decorative Unicode emojis in UI chrome (replaced with uniform `1.75px` stroke inline SVGs with `aria-hidden="true"`).
- **Touch Targets & Responsive:** All buttons, inputs, selects, close controls, and bottom-nav tabs enforce `min-h-[44px]` (`min-w-[44px]` for icon/nav controls). Mobile bottom bar includes all 5 views (`Métricas`, `Mudanzas`, `Pre-Daño`, `QR Bultos`, `Bauleras`).
- **Keyboard & Screen Readers:**
  - High-contrast `:focus-visible` ring (`2px solid #fbbf24`, `2px` offset).
  - Modals use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `Escape` dismissal, and `aria-label` on close buttons.
  - Tab bars use `role="tablist"`, `role="tab"`, and `aria-selected`.
  - Every `<label for="...">` binds to its control `id`.
  - Text selection is enabled on `<body>` so operators can copy IDs, addresses, and SHA-256 hashes.
- **Motion:** Subtle `150ms` hover/color transitions only; `@media (prefers-reduced-motion: reduce)` disables all transitions and transforms.
- **Honest Capability & Demo Policy:** Seeded sample data is explicitly tagged `[DEMO]`, persisted in `BoxTrackCacheService`, and can be permanently cleared via the UI **"Limpiar Demo"** control (respecting `boxtrack_demo_purged`). Network status reflects `navigator.onLine` events.
