# Medialane-IO UI/UX Enhancement — Design Spec
**Date:** 2026-03-13
**Repo:** medialane-io (Next.js 15 + shadcn/ui + Tailwind + Framer Motion + ChipiPay)
**Status:** Approved for implementation planning

---

## Vision

Evolve medialane-io from a marketplace/ecommerce aesthetic to a **content-first, streaming-platform experience** where assets and creators are the heroes — not products on a shelf. The interaction model shifts from "browse and buy" to "discover and feel", taking cues from Netflix (immersive asset detail), Spotify (creator-as-artist), and premium editorial platforms.

The app should feel **simple, clean, and sophisticated** — vivid and creative without being loud, secure and immersive for users who may be new to Web3.

---

## Design Principles

1. **Content is the UI** — artwork, creator identity, and collection imagery drive the visual language of every page. The chrome (nav, buttons, labels) recedes.
2. **Dynamic theming** — the app skins itself around the dominant colors of the asset or collection being viewed. The palette follows the content, not the other way around.
3. **Intention-first** — surface the right action at the right moment. A collector sees "Buy". An owner sees "List" or "Transfer". An unsigned visitor sees "Sign in to collect". Context drives what is prominent.
4. **Immersive micro-interactions** — motion is purposeful and fast. Hover reveals, color transitions, scroll-driven effects. No idle animations that feel like loading spinners.
5. **Vivid brand** — Medialane's 5 brand colors (Blue 600, Navy 950, Rose 500, Purple 600, Orange 600) are woven into both light and dark themes as first-class tokens, replacing the current neutral-heavy palette.
6. **Motion accessibility** — every animation wraps `useReducedMotion()` from Framer Motion. When the user's system preference is `prefers-reduced-motion: reduce`, all animations are disabled or replaced with instant transitions. This applies to all phases without exception.

---

## Brand Color System

### Medialane Brand Palette (Tailwind references)

| Name | Tailwind | Hex |
|---|---|---|
| Blue | `blue-600` | `#2563EB` |
| Navy | `blue-950` | `#172554` |
| Rose | `rose-500` | `#F43F5E` |
| Purple | `purple-600` | `#9333EA` |
| Orange | `orange-600` | `#EA580C` |

### Theme Token Strategy

Replace the current neutral-dominant CSS variable set with vivid brand-aware tokens. All changes are **additive alongside existing shadcn tokens** — `--destructive` (rose) and `--price` (orange) are NOT replaced or renamed, they remain for shadcn component compatibility. New named brand tokens are additive aliases:

**New tokens in `globals.css`:**
```css
:root {
  --brand-blue: 221 83% 53%;      /* blue-600 */
  --brand-navy: 224 87% 20%;      /* blue-950 */
  --brand-rose: 350 89% 60%;      /* rose-500 — alias for --destructive */
  --brand-purple: 271 81% 56%;    /* purple-600 — alias for --primary */
  --brand-orange: 21 90% 44%;     /* orange-600 — alias for --price */
}
```

**Light mode updates:**
- `--primary`: shift to Purple 600 HSL (`271 81% 56%`)
- `--accent`: Blue 600 HSL (`221 83% 53%`)
- Background: keep `0 0% 99%`; foreground: keep dark blue-gray

**Dark mode updates:**
- `--background`: shift toward Navy hue (`222 87% 8%`) instead of generic dark
- `--primary`: Purple 600 lightened (`271 81% 65%`)
- `--accent`: Blue 600 lightened (`221 83% 65%`)
- `--border`: subtle Purple tint (`262 30% 18%`)
- Sidebar surface: deep Navy (`224 87% 6%`)

---

## Dynamic NFT Color Theming

### Library

**Package:** `fast-average-color` (npm: `fast-average-color`)
**React integration:** `@fast-average-color/react` — provides `useFastAverageColor()` hook

Install: `bun add fast-average-color @fast-average-color/react`

### `src/hooks/use-dominant-color.ts`

**Contract:**
```ts
interface DominantColorResult {
  hex: string;          // e.g. "#7c3aed"
  hsl: string;          // e.g. "271 81% 45%"  (no hsl() wrapper — for CSS var use)
  isDark: boolean;      // true if color is perceptually dark
  isReady: boolean;     // false until extraction completes
  error: boolean;       // true if extraction failed
}

function useDominantColor(imageUrl: string | null | undefined): DominantColorResult
```

**Implementation notes:**
- Accepts a gateway-resolved URL (already converted via `ipfsToHttp()`) — never a raw `ipfs://` URI
- Uses `useFastAverageColor(ref, options)` from `@fast-average-color/react` — the hook is **ref-based**, not URL-based. The library returns `{ result, isLoading, error }` where `result` is a `FastAverageColorResult | null`. Pattern:
  ```tsx
  const imgRef = useRef<HTMLImageElement>(null);
  const { result, isLoading, error } = useFastAverageColor(imgRef, { crossOrigin: 'anonymous' });
  // result?.hex      → e.g. "#7c3aed"
  // result?.hsl      → e.g. "hsl(271, 81%, 45%)"  (note: library wraps in hsl())
  // result?.isDark   → boolean
  // isLoading        → maps to our isReady = !isLoading && result !== null
  // Render a hidden <img> with the ref:
  <img ref={imgRef} src={imageUrl} crossOrigin="anonymous" aria-hidden style={{ display: 'none' }} />
  ```
  Note: `result.hsl` from the library includes the `hsl()` wrapper — strip it before storing as a bare HSL string for CSS variable injection (use a small regex or manual parse).
- The hidden `<img>` element is NOT Next.js `<Image>` (which proxies through `/_next/image` and cannot be used for canvas extraction). It is a plain `<img>` tag with `crossOrigin="anonymous"`.
- Pinata gateway (`NEXT_PUBLIC_PINATA_GATEWAY`) must be the image source — it returns `Access-Control-Allow-Origin: *`, making canvas reads safe
- Returns `{ hex: "#9333ea", hsl: "271 81% 56%", isDark: true, isReady: false, error: false }` defaults while loading

### `src/lib/theme-utils.ts`

**Contract:**
```ts
// Convert fast-average-color result to CSS-injectable dynamic theme tokens
function buildDynamicTheme(
  hex: string,
  isDark: boolean,
  userIsDarkMode: boolean
): {
  '--dynamic-primary': string;   // HSL string for CSS var
  '--dynamic-accent': string;    // a lighter/desaturated variant
  '--dynamic-glow': string;      // very low opacity version for shadows/glows
} | null                         // null = fallback to brand purple (no injection)
```

**Processing order inside `buildDynamicTheme` (must follow this sequence):**
1. Parse hex → HSL (H, S, L values)
2. **Clamp first** (light mode only): if `!userIsDarkMode && L < 40`, set `L = 55` and `S = max(0, S - 15)`
3. **Contrast check second** (against clamped value): compute contrast ratio of the (possibly clamped) color against `#ffffff`. If ratio < 3.0, return `null` (fall back to brand purple). Using clamped value for the check ensures a dark color that would pass after clamping isn't incorrectly rejected.
4. Derive accent and glow from the final primary HSL values
5. Return the token map

**Contrast gate (WCAG AA):** `getContrastRatio(hex, against: '#ffffff' | '#000000'): number` utility in `theme-utils.ts`. Formula: `(L1 + 0.05) / (L2 + 0.05)` where L = relative luminance. Threshold: **3.0:1** (large UI elements — buttons, tab indicators). If below threshold, `buildDynamicTheme` returns `null`.

**Deriving accent and glow from primary:**
- `--dynamic-accent` = same H, `max(0, S−20)`, L+15 (lighter desaturated variant — floor S at 0 to prevent invalid negative saturation). Injected as bare HSL string `"H S% L%"`, used as `hsl(var(--dynamic-accent))` at call sites.
- `--dynamic-glow` = same H and S, L = 70%, alpha = 0.2. Injected as `"H S% 70% / 0.2"`, used as `hsl(var(--dynamic-glow))` at call sites (four-value hsl() — valid CSS Color Level 4). Used exclusively for `box-shadow` glow effects, never for text.

**CSS variable usage convention:** All three tokens are bare HSL strings (no `hsl()` wrapper). Every usage site wraps them: `hsl(var(--dynamic-primary))`, `hsl(var(--dynamic-accent))`, `hsl(var(--dynamic-glow))`. This is consistent with how shadcn's own tokens work (e.g. `hsl(var(--primary))`). Document this at the top of every file that uses these vars.

### CSS Injection Pattern

Dynamic tokens are injected via `style` prop on a **wrapper div inside `<SidebarInset>`**, scoped to the content area only:

```tsx
<div style={dynamicTheme ? {
  '--dynamic-primary': dynamicTheme['--dynamic-primary'],
  '--dynamic-accent': dynamicTheme['--dynamic-accent'],
  '--dynamic-glow': dynamicTheme['--dynamic-glow'],
} as React.CSSProperties : {}}>
  {children}
</div>
```

**Important — Radix portal gap:** Radix UI dialogs, dropdowns, and tooltips render in portals attached to `document.body`, outside this wrapper. They do NOT inherit `--dynamic-primary`. Therefore: dialog components (`PurchaseDialog`, `ListingDialog`, etc.) must **not** use `--dynamic-primary` for their primary button color — they continue using `--primary` (brand purple). Dynamic theming applies only to: background tints, tab indicators, hover glows, and stat accent numbers — all of which render inside the page wrapper.

**Scope of dynamic theming:**
- Asset page: hero background tint, tab active indicator, price accent glow
- Collection page: banner gradient overlay, stats accent, tab indicator
- Creator page: avatar ring color, stat highlight, banner tint
- Sidebar, global nav, portfolio pages: **not affected** — the sidebar lives outside `<SidebarInset>` in `providers.tsx` and will never inherit these variables. No extra isolation work needed.

### Graceful degradation

If extraction fails (network error, CORS issue, unsupported format): `buildDynamicTheme` returns `null`, no `style` prop is injected, and the page falls back to brand Purple/Blue seamlessly.

---

## Phase 1a — Dynamic Color Infrastructure

**Scope:** New hook + utility only. No layout changes.

**Deliverables:**
1. `bun add fast-average-color @fast-average-color/react`
2. `src/hooks/use-dominant-color.ts` — per spec above
3. `src/lib/theme-utils.ts` — per spec above (HSL parsing, clamping, contrast check, `buildDynamicTheme`)
4. Wire `useDominantColor` + `buildDynamicTheme` into the **existing** asset page wrapper only — inject dynamic tokens into the wrapper div
5. Verify: open an asset page, inspect element, confirm `--dynamic-primary` appears on the wrapper div with a color derived from the token image

**No layout changes in this phase.** The visual impact is: background tint color and tab indicator shift to match the asset image. Everything else unchanged.

---

## Phase 1b — Asset Detail Page Layout & Micro-interactions

### Current State
- 2-column sticky layout (image left, details right)
- Blurred image background already present (good foundation)
- Tabs: Details | Listings | History
- Action buttons: Buy / List / Transfer / Cancel listing
- Incoming offers section

### Target State: "Film Detail on Netflix"

**Layout changes:**
- Full-viewport hero: image bleeds to the top of the page, blurred + darkened as an immersive backdrop. The actual asset image renders crisp in the left column at ~40% width on desktop.
- Remove horizontal divider between image and detail — let content float over the atmospheric background.
- Right column: creator line (avatar + name → `/creator/[address]`), collection breadcrumb, title large, price prominent, action buttons stack clearly.
- Mobile: image fills top 40vh, details scroll below with a **sticky "Buy for X" bar at bottom of viewport** when an active listing exists and user is not the owner.

**Dynamic theming wired in (from Phase 1a):**
- Background blur tint uses `--dynamic-primary` at 15% opacity
- Tab active indicator uses `--dynamic-primary`
- Buy button uses `--dynamic-primary` when `buildDynamicTheme` returns non-null (the contrast check is already baked into `buildDynamicTheme` — if it returned tokens, they passed); no second check needed at the component level

**Micro-interactions (all wrapped in `useReducedMotion` — skip if reduced):**
- Image: scale 1.0 → 1.02 on load (600ms ease-out, `Framer Motion` `initial`/`animate`)
- Buy button: single pulse glow on page-load (`animate={{ boxShadow: [...] }}`), runs once, stops
- Offer rows in incoming-offers section: hover reveals Accept / Decline buttons via `AnimatePresence` + opacity transition
- History tab entries: staggered `FadeIn` (existing `motion-primitives.tsx` component) on tab activation, 60ms stagger between items

---

## Phase 1c — Asset Detail Code Audit

**Audit checklist:**
- [ ] Verify all 5 intention-first states render without overlap:
  - Not signed in → "Sign in to collect"
  - Signed in, not owner, listing exists → "Buy for X" primary, "Make offer" secondary
  - Signed in, owner, no listing → "List for sale" primary, "Transfer" secondary
  - Signed in, owner, listing active → "Cancel listing" primary; transfer available
  - Signed in, owner, incoming offers → badge count on Offers tab
- [ ] Confirm `useToken`, `useTokenListings`, `useUserOrders` data is non-redundant (no double-fetching)
- [ ] Mobile layout: breadcrumb hidden on mobile, no layout shift
- [ ] OG metadata (`generateMetadata`) pulls correct image + description from API
- [ ] Offer accept flow end-to-end: accept button → PinDialog → TX → success state
- [ ] `TxStatus` component used consistently (not mixed with inline `Loader2`)
- [ ] `refreshInterval` on listing/offer hooks active (orders update without page reload)

---

## Phase 2 — Collection Page (`/collections/[contract]`)

### Current State
- Banner image + glass overlay
- Stats bar: floor price, volume, items, verified badge
- Tabs: Items | Listings | Offers

### Target State: "Album Detail on Streaming"

**Layout changes:**
- Full-bleed collection image banner: full width, ~50vh tall, blurred + gradient overlay shifted by `--dynamic-primary`
- Collection name large and bold over banner, verified badge inline
- Stats strip below banner: 4 bold metrics — Items, Owners, Floor, Volume — tabular, high contrast. Floor price number uses `--dynamic-primary` color
- Creator row below stats: avatar + "by [Creator Name]" → links to `/creator/[address]`
- Tabs become sticky (via `position: sticky; top: 0` on the tab strip) as user scrolls past banner

**DOM structure for sticky tabs (important for scroll math):**
```
<article>                          /* full page wrapper, dynamic theme here */
  <div class="banner">             /* ~50vh, parallax image inside */
    <img class="parallax-img">     /* translateY at 0.5x scroll speed */
    <div class="overlay">          /* gradient + text overlay */
  </div>
  <div class="sticky-tabs">        /* position: sticky; top: 0; z-index: 10 */
    <Tabs />
  </div>
  <div class="tab-content">        /* scrollable content below tabs */
  </div>
</article>
```

The parallax image is inside the banner div, NOT the sticky container — so sticky tab math is correct. Parallax implemented via Framer Motion `useScroll` + `useTransform` (not scroll event listener, not `background-attachment: fixed`).

**Dynamic theming:** `useDominantColor` on collection image → inject tokens on page wrapper.

**Micro-interactions (all behind `useReducedMotion`):**
- Banner parallax: image moves at 0.5x scroll speed (`useScroll` + `useTransform`)
- Stats numbers: count-up animation **only after hydration and only when scrolled into view** (`useInView` from Framer Motion). Initial render value = real value (no SSR flash). `useEffect` + `useInView` starts animation from 0 only after mount + in-view confirmed. **Under `prefers-reduced-motion`**: `shouldReduce = useReducedMotion()` → skip the count-up entirely, render the final value statically from mount. No counter state, no animation loop.
- TokenCard hover: scale 1.02 + `--dynamic-primary` box-shadow glow

**Code audit:**
- [ ] Items / Listings / Offers tabs all load data correctly
- [ ] `useCollectionTokens` and `useOrders` (filtered by collection) working
- [ ] `metadataStatus=PENDING` spinner shows on cards correctly
- [ ] Floor price, volume, total supply values correct from API
- [ ] Load-more pagination on Items tab functional
- [ ] Verified badge shows only for `isKnown=true` collections

---

## Phase 3 — Creator Profile (`/creator/[address]`)

### Current State
- Address-derived deterministic gradient avatar
- Blurred banner from latest token image
- Activity timeline

### Target State: "Artist Page on Spotify"

**Layout changes:**
- Banner: full-viewport-width, ~55vh tall. Latest or highest-value asset image, blurred + `--dynamic-primary` tint overlay.
- Creator identity block: large avatar (asset thumbnail if available, gradient fallback), display name or shortened address, wallet copy button, join date, total volume sold.
- Stats row: Assets created | Collections | Total volume | Offers received
- Tabbed content below identity:
  - **Works** (default): grid of `TokenCard` for creator's assets (`useTokensByOwner`)
  - **Collections**: creator's deployed collections as `CollectionCard` (`useCollectionsByOwner`)
  - **Activity**: existing activity timeline (`useActivitiesByAddress`)
  - These three hooks serve distinct tabs — they are not redundant. Audit: confirm each hook is called only when its tab is active (lazy loading, not eager).
- "Share profile" button: copies current URL to clipboard, shows a toast "Link copied"
- "Follow" button (UI only): for **signed-in users** → shows "Following" state with a filled heart icon (persisted via a small Zustand store with `persist` middleware, key `medialane-io-follows`, consistent with the existing cart pattern in `use-cart.ts`). For **signed-out users** → tooltip "Sign in to follow", no sign-in prompt triggered.

**Dynamic theming:** `useDominantColor` on banner image → inject tokens. Avatar ring: `border-[--dynamic-primary]`. Volume stat: `color: --dynamic-primary`.

**Micro-interactions (all behind `useReducedMotion`):**
- Avatar ring: rotating gradient animation on hover (CSS `animation: spin 3s linear infinite` on hover, stopped otherwise)
- Works grid: staggered `FadeIn` on mount (40ms stagger)
- Stats: count-up on scroll-into-view, post-hydration only (same pattern as Phase 2)

**Code audit:**
- [ ] Creator address from URL param resolves correctly
- [ ] `useTokensByOwner` only called when Works tab active
- [ ] `useCollectionsByOwner` only called when Collections tab active
- [ ] `useActivitiesByAddress` only called when Activity tab active
- [ ] Activity timeline events render with correct icons and links
- [ ] Mobile: banner + identity block stacks gracefully, stats wrap to 2×2 grid

---

## Phase 4 — Discover / Home (`/discover`, `/`)

### Current State
- Hero with kinetic text + CTAs
- Bento grid: 4 quick-action cells + featured collections
- Feed section: recent listings + activity rows
- Homepage auto-swaps to discover on 2026-03-14 (via `LAUNCH_DATE` constant, evaluated at request time — confirmed correct with `force-dynamic` on root layout)

### Target State: "Editorial Front Page"

**Layout changes:**
- Hero: keep kinetic text. Add a **horizontally scrolling live asset strip** below CTAs — shows the 5 most recently listed assets (image + name + price). Minimum threshold: if fewer than 3 listings exist, the strip is hidden entirely (render `null`). Strip auto-scrolls at 30px/s, pauses on hover. Implemented with CSS `animation: scroll linear infinite` (not JS scroll listener). On mobile: standard horizontal scroll (no auto-scroll, touch-native).
- Bento section: 4 quick-action cells unchanged. Replace featured collections grid with **Featured Drops**: large cards (full image, collection name, floor, item count), curated via `isKnown=true`. Each card uses `--dynamic-primary` from its own image (local `useDominantColor` per card, not page-level).
- Feed section (desktop): two-column layout — left "Recent listings" (with asset image thumbnails, not just text), right "Live activity"
- Feed section (mobile): single column, listings first then activity, no column split
- Live activity feed: **simple animated list** using Framer Motion `AnimatePresence` — new items slide in from top, max 20 items displayed, older items pushed out bottom. Items keyed by `id`. **Marked as stretch goal** — if `AnimatePresence` causes layout instability with SWR polling, fall back to a static table with 30s refresh and no animation.
- Horizontal asset strip mobile override: the CSS auto-scroll animation must be disabled on touch devices. Use `@media (hover: none) { animation: none; overflow-x: auto; }` — this correctly targets touch-primary devices without requiring JS detection. The strip becomes a native-scroll horizontal rail on mobile.
- Footer strip: Medialane brand bar — logo, tagline ("Create, license & trade IP on Starknet"), links (Trade / Launch / X)

**Code audit:**
- [ ] `LAUNCH_DATE` gate: verify `new Date() >= LAUNCH_DATE` evaluates correctly at request time
- [ ] `isKnown=true` filter returns expected collections from API
- [ ] All CTA links correct (Mint → `/create/asset`, Collections → `/collections`, etc.)
- [ ] Activity feed 30s refresh doesn't cause layout shift
- [ ] Auto-scroll strip pause-on-hover works (CSS `animation-play-state: paused` via `:hover`)

---

## Phase 5 — Global Consistency Pass

### Skeleton standardization
`src/components/ui/content-skeleton.tsx` is a **thin wrapper** around the existing shadcn `Skeleton` component — it adds a branded Purple shimmer via CSS animation override. It does NOT replace `skeleton.tsx`. API:
```tsx
<ContentSkeleton className="h-48 w-full rounded-xl" />
// → renders <Skeleton> with purple shimmer instead of gray
```
Apply to: asset page image placeholder, collection banner placeholder, marketplace grid cards, portfolio table rows. Existing per-page skeletons (`TokenCardSkeleton`, etc.) are updated to use `ContentSkeleton` internally.

### Empty states
`EmptyOrError` component already exists (`src/components/ui/empty-or-error.tsx`). Audit and standardize its usage across all pages. Per-page messages:
- Assets portfolio: "No assets yet — start creating" + CTA to `/create/asset`
- Listings portfolio: "No active listings" + CTA to portfolio assets
- Offers sent: "No offers sent yet" + CTA to `/marketplace`
- Received offers: "No offers received yet"
- Collection items: "No items minted yet" + CTA to `/create/asset`
- Marketplace: "No listings match your filters" + clear-filters button

### Session expiry banner
Move from `sticky top-12` (overlaps content) to a **bottom-right fixed banner** styled like a toast. Dismissible: clicking X hides it for the remainder of the session (state stored in `sessionStorage` keyed `session-banner-dismissed`). Shows "Session expires in X min" with a "Renew" button. Update `providers.tsx` to remove the `sticky top-12` wrapper and render the banner at the bottom of the page. Update **both** locations in CLAUDE.md that document the old position: (1) the app shell ASCII diagram line `├─ SessionExpiryBanner (sticky top-12)` and (2) the Key rules block entry `SessionExpiryBanner uses sticky top-12 (header is h-12 = 48px, was top-16 when header was h-16)`.

### Mobile polish
- Portfolio subnav: `overflow-x: auto; scrollbar-width: none` on screens < 640px — horizontally scrollable, no visible scrollbar
- Marketplace filter toolbar: same treatment
- Collection page: stats wrap to 2×2 grid on mobile

### Cart preview enhancement
Cart items in Zustand store (`CartItem`) currently persist `orderHash`, `nftContract`, `nftTokenId`, and price. To show name and image in the cart drawer: **add `name` and `image` fields to `CartItem`** at add-time (the `addItem` call site already has access to `order.token.name` and `order.token.image` from the `batchTokenMeta` enrichment). Update `use-cart.ts` `CartItem` type and all `addItem` call sites. The drawer then renders thumbnail + name without any additional fetch.

---

## Implementation Order

```
Phase 1a → Phase 1b → Phase 1c → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

Each phase is independently shippable and testable. The user tests after each phase before the next begins. Phase 5 can partially overlap with Phase 4 (the global pass items are independent of discover page work).

---

## Cross-Cutting Requirements (all phases)

1. **`prefers-reduced-motion`**: every Framer Motion animation uses `const shouldReduce = useReducedMotion()` and skips or simplifies the animation when `true`. This is not optional.
2. **`bun run build` clean**: must pass with 0 TypeScript errors and 0 Next.js build errors after each phase before the next begins.
3. **No ChipiPay/Clerk integration changes**: wallet, session, and signing flows are untouched.
4. **No new routes**: all work is within existing routes and components.
5. **IPFS image handling**: color extraction always uses gateway-resolved URLs (`ipfsToHttp()`), never raw `ipfs://` URIs. The extraction `<img>` element always has `crossOrigin="anonymous"`.
6. **Radix portal isolation**: `--dynamic-primary` and related tokens are scoped to the page content wrapper. Dialog/dropdown/tooltip components use `--primary` (brand purple) for their own styling — never the dynamic tokens.
7. **Complexity gate**: if any feature proves disproportionately complex or causes performance/jank issues (e.g. parallax on low-end mobile), it is dropped in favor of a simpler alternative without blocking the phase.
