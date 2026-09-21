# Lexach / FindBaee Cinematic Redesign Contract

**Status:** Approved specification for future implementation  
**Scope of this file:** Design direction and implementation guidance only  
**Current implementation status:** No redesign described here is implemented by this document.

This document is the design contract for future edits to the existing Lexach / FindBaee React application. It defines how the public homepage and pricing experience should evolve while preserving the mature product behind them. It is **not** a request to implement those edits now.

---

## 1. Product and Experience Intent

Lexach / FindBaee is a co-founder discovery and collaboration platform, not a generic professional network or dating clone. Its public experience must communicate three ideas immediately:

1. **Founder discovery is rigorous:** profiles are evaluated through structured FounderSync compatibility signals rather than superficial similarity.
2. **A match becomes productive:** SparkMatch and Spark Rooms move founders from discovery into secure, focused collaboration.
3. **Trust is built into the journey:** existing authentication, plan access, mutual NDA, messaging, and profile workflows remain intact.

The redesign should feel like a premium editorial technology product: cinematic but disciplined, intelligent without “AI vapor,” and energetic without becoming game-like. The visual metaphor is **two independent trajectories becoming one high-signal venture path**.

### Brand naming

- Treat **Lexach** as the current platform brand when displayed in future public-facing copy.
- Treat **FindBaee** as the existing design-system/project lineage and preserve compatibility with current naming until product stakeholders finalize migration.
- Do not casually rename database concepts, routes, imported modules, analytics events, payment products, or established product features during visual implementation.

### Non-negotiable functional preservation rule

> The redesign must preserve all existing product functionality, routes, authentication, Supabase integration, pricing/checkout behavior, subscription gating, FounderSync logic, SparkMatch and Spark Room behavior, mutual-NDA flow, profile management, messaging, admin flows, analytics, and security controls. Public presentation changes must not break or bypass dashboard/application flows.

Existing routes—including `/`, `/about`, `/pricing`, `/login`, `/signup`, `/dashboard`, `/profile`, `/messages`, `/spark-rooms`, `/who-liked-you`, onboarding paths, and admin routes—remain behaviorally compatible. Existing return-to-pricing navigation and URL-persisted dashboard tabs must continue to work.

---

## 2. Creative Direction

### Visual thesis: “The Founders’ Observatory”

A dark, precise environment where founder profiles move like intelligent instruments through a field of signals. Electric violet denotes intent and decision; neon teal denotes compatibility and live connection. Warm editorial neutrals humanize portraits and prevent the interface from reading as a one-note cyberpunk theme.

### Emotional sequence

1. **Curiosity:** two founder cards float independently in a deep obsidian field.
2. **Recognition:** shared signals illuminate between them.
3. **Convergence:** the cards travel through controlled 3D depth and fuse into a central compatibility visualization.
4. **Confidence:** structured FounderSync evidence replaces visual spectacle with intelligible reasons.
5. **Momentum:** the story transitions into SparkMatch, Spark Rooms, secure collaboration, and a clear plan choice.

### Principles

- **Editorial over ornamental:** use large type, strong pacing, asymmetric composition, and meaningful whitespace.
- **Selective glass:** glass is reserved for floating product windows, navigation, and transient overlays—not every section or content block.
- **Real product evidence:** future mockups should be grounded in existing profile, matching, room, and dashboard concepts.
- **Controlled luminosity:** glow signals state or connection; it never decorates empty space.
- **Depth with purpose:** 3D movement clarifies convergence and hierarchy, not novelty.
- **Readable first:** all animation, imagery, and glow remain subordinate to copy and controls.

### Explicit visual exclusions

- No generic grid of repeated gradient cards.
- No decorative gradient orbs, bokeh blobs, or full-page violet wash.
- No glass-on-glass nesting.
- No illegible “sci-fi HUD” microtext.
- No stock-photo handshake imagery.
- No excessive pill-shaped containers.
- No abstract neural imagery that implies automated/AI matching logic. FounderSync matching remains deterministic and rule-based; AI is limited to existing explanatory summaries.

---

## 3. Exact Design Tokens

All implementation values must become semantic CSS variables in `src/index.css` and be mapped through `tailwind.config.ts`. Components must consume semantic classes rather than raw HEX, RGB, or HSL values. The HEX values below are the source-of-truth design values; future implementation may convert them to HSL triplets for the existing Tailwind token system.

### 3.1 Core color palette

| Token | HEX | Intended use |
|---|---:|---|
| `color-ink-950` | `#050507` | Page background, deepest scene |
| `color-ink-900` | `#09090D` | Primary surface band |
| `color-ink-850` | `#0E0E14` | Elevated solid surface |
| `color-ink-800` | `#15151E` | Interactive dark surface |
| `color-ink-700` | `#22222D` | Strong border / disabled surface |
| `color-paper-50` | `#F7F7FA` | Primary text |
| `color-paper-100` | `#ECECF2` | Secondary high-emphasis text |
| `color-paper-300` | `#B8B8C5` | Body / supporting text |
| `color-paper-500` | `#7D7D8C` | Captions / low-emphasis text |
| `color-violet-300` | `#C2A8FF` | Highlight text / soft data accent |
| `color-violet-400` | `#A67CFF` | Primary luminous accent |
| `color-violet-500` | `#8B5CF6` | Primary action / selection |
| `color-violet-600` | `#7040E8` | Pressed action / depth |
| `color-teal-300` | `#59F3D5` | High-signal compatibility accent |
| `color-teal-400` | `#20D9BB` | Connected/live state |
| `color-teal-500` | `#0FB89D` | Pressed/solid teal |
| `color-coral-400` | `#FF7C73` | Human warmth / warnings, sparingly |
| `color-gold-300` | `#E9C979` | Verified/premium detail only |
| `color-danger-400` | `#FF5D6C` | Errors / destructive state |
| `color-success-400` | `#35D39A` | Confirmed success |

### 3.2 Semantic roles

| Semantic token | Value |
|---|---|
| `background` | `#050507` |
| `foreground` | `#F7F7FA` |
| `surface-primary` | `#09090D` |
| `surface-elevated` | `#0E0E14` |
| `surface-interactive` | `#15151E` |
| `surface-glass` | `rgba(14, 14, 20, 0.68)` |
| `surface-glass-strong` | `rgba(9, 9, 13, 0.84)` |
| `text-primary` | `#F7F7FA` |
| `text-secondary` | `#B8B8C5` |
| `text-tertiary` | `#7D7D8C` |
| `primary` | `#8B5CF6` |
| `primary-hover` | `#A67CFF` |
| `primary-foreground` | `#F7F7FA` |
| `accent-signal` | `#20D9BB` |
| `border-subtle` | `rgba(247, 247, 250, 0.08)` |
| `border-default` | `rgba(247, 247, 250, 0.14)` |
| `border-strong` | `rgba(194, 168, 255, 0.34)` |
| `focus-ring` | `#59F3D5` |
| `selection-bg` | `rgba(139, 92, 246, 0.35)` |

### 3.3 Gradient tokens

Gradients are limited to state transitions, dimensional fields, and key display typography.

```text
gradient-brand: linear-gradient(110deg, #C2A8FF 0%, #8B5CF6 42%, #20D9BB 100%)
gradient-signal: linear-gradient(90deg, #8B5CF6 0%, #59F3D5 100%)
gradient-surface: linear-gradient(145deg, rgba(247,247,250,0.08), rgba(247,247,250,0.02))
gradient-hero-vignette: radial-gradient(circle at 50% 44%, rgba(139,92,246,0.13) 0%, rgba(5,5,7,0) 52%)
gradient-section-fade: linear-gradient(180deg, #050507 0%, #09090D 50%, #050507 100%)
```

Never place long body copy over `gradient-brand`. Never use gradients as generic section backgrounds when a solid obsidian surface provides better hierarchy.

### 3.4 Opacity scale

| Token | Value | Use |
|---|---:|---|
| `opacity-ghost` | `0.04` | Background network traces |
| `opacity-faint` | `0.08` | Hairlines / soft surface distinction |
| `opacity-subtle` | `0.14` | Default borders |
| `opacity-muted` | `0.38` | Disabled decorative elements |
| `opacity-secondary` | `0.68` | Supporting visuals |
| `opacity-strong` | `0.88` | Overlaid imagery / nav |
| `opacity-solid` | `1` | Text and active state |

### 3.5 Typography

#### Typeface contract

- **Display/editorial:** `Manrope`, weights 500–700. It supplies geometric authority without looking like a generic corporate sans.
- **Body/UI:** `IBM Plex Sans`, weights 400–600. It supports dense product information and readable controls.
- **Data/labels:** `IBM Plex Mono`, weights 400–500, only for scores, timestamps, plan metadata, and system labels.
- Fonts should be self-hosted as WOFF2 if licensing permits. If loaded externally, use document `<link>` elements, never CSS `@import`.
- System fallbacks: display `ui-sans-serif, system-ui, sans-serif`; body `ui-sans-serif, system-ui, sans-serif`; mono `ui-monospace, SFMono-Regular, Consolas, monospace`.
- Letter spacing is `0` for normal text. Only uppercase eyebrow and data labels may use `0.08em`.

#### Fluid type scale

| Token | Desktop | Tablet | Mobile | Line height | Weight |
|---|---:|---:|---:|---:|---:|
| `display-hero` | `80px` | `64px` | `44px` | `0.98` | 600 |
| `display-section` | `56px` | `46px` | `34px` | `1.04` | 600 |
| `heading-1` | `44px` | `38px` | `32px` | `1.10` | 600 |
| `heading-2` | `34px` | `30px` | `26px` | `1.15` | 600 |
| `heading-3` | `24px` | `22px` | `20px` | `1.25` | 600 |
| `body-xl` | `22px` | `20px` | `18px` | `1.55` | 400 |
| `body-lg` | `18px` | `18px` | `17px` | `1.60` | 400 |
| `body-md` | `16px` | `16px` | `16px` | `1.60` | 400 |
| `body-sm` | `14px` | `14px` | `14px` | `1.55` | 400 |
| `label` | `12px` | `12px` | `12px` | `1.35` | 500 |
| `data-lg` | `32px` | `28px` | `26px` | `1.00` | 500 |

Use `clamp()` between mobile and desktop endpoints rather than scaling directly with viewport width. Limit hero copy to approximately 11 words per line on wide screens and 8 words per line on mobile.

### 3.6 Spacing

Base unit: `4px`.

```text
space-0  0
space-1  4px
space-2  8px
space-3  12px
space-4  16px
space-5  20px
space-6  24px
space-8  32px
space-10 40px
space-12 48px
space-16 64px
space-20 80px
space-24 96px
space-30 120px
space-36 144px
space-44 176px
```

- Homepage section vertical padding: `144px` desktop, `96px` tablet, `72px` mobile.
- Pricing section vertical padding: `120px` desktop, `88px` tablet, `64px` mobile.
- Page gutters: `64px` desktop, `40px` tablet, `20px` mobile.
- Maximum editorial content width: `1280px`.
- Maximum reading column: `680px`.
- Maximum product showcase width: `1440px`.

### 3.7 Radii and borders

| Token | Value | Use |
|---|---:|---|
| `radius-xs` | `2px` | Hairline accents |
| `radius-sm` | `4px` | Data chips / compact controls |
| `radius-md` | `8px` | Buttons, fields, repeated items |
| `radius-lg` | `12px` | Product windows / dialogs |
| `radius-xl` | `20px` | Hero profile cards only |
| `radius-round` | `999px` | Avatars and status dots only |

- Hairline border: `1px solid rgba(247,247,250,0.08)`.
- Default border: `1px solid rgba(247,247,250,0.14)`.
- Active signal border: `1px solid rgba(89,243,213,0.52)`.
- Premium focus border: `1px solid rgba(194,168,255,0.68)`.
- Avoid thick outlines except intentional match/convergence moments.

### 3.8 Shadows, blur, and glow

```text
shadow-surface: 0 18px 60px rgba(0,0,0,0.34)
shadow-floating: 0 32px 96px rgba(0,0,0,0.52)
shadow-control: 0 8px 24px rgba(0,0,0,0.24)
shadow-inset: inset 0 1px 0 rgba(247,247,250,0.08)
glow-violet-sm: 0 0 24px rgba(139,92,246,0.20)
glow-violet-lg: 0 0 72px rgba(139,92,246,0.24)
glow-teal-sm: 0 0 24px rgba(32,217,187,0.20)
glow-teal-lg: 0 0 80px rgba(32,217,187,0.22)
blur-glass: 18px
blur-nav: 24px
blur-modal: 28px
```

Glows must be attached to a meaningful node, line, score, active selection, or CTA. Do not blur text. Glass surfaces need an opaque fallback for unsupported backdrop filters.

### 3.9 Glass and material specifications

Glass is a **material for floating layers**, not a surface style for content. It is permitted only where a layer genuinely floats above changing scene content.

#### Glass recipes

| Material | Background | Backdrop filter | Border | Top highlight | Shadow |
|---|---|---|---|---|---|
| `glass-standard` | `rgba(14, 14, 20, 0.68)` | `blur(18px) saturate(1.15)` | `1px solid rgba(247,247,250,0.10)` | `inset 0 1px 0 rgba(247,247,250,0.10)` | `shadow-surface` |
| `glass-strong` (navigation) | `rgba(9, 9, 13, 0.84)` | `blur(24px) saturate(1.2)` | `1px solid rgba(247,247,250,0.08)` | `inset 0 1px 0 rgba(247,247,250,0.08)` | `0 8px 32px rgba(0,0,0,0.36)` |
| `glass-modal` | `rgba(9, 9, 13, 0.90)` | `blur(28px) saturate(1.2)` | `1px solid rgba(194,168,255,0.24)` | `inset 0 1px 0 rgba(247,247,250,0.12)` | `shadow-floating` |
| `glass-signal` (active/fused state only) | `rgba(20, 20, 30, 0.72)` | `blur(18px)` | `1px solid rgba(89,243,213,0.52)` | `inset 0 1px 0 rgba(89,243,213,0.14)` | `glow-teal-sm` |

Material rules:

- Translucency range is `0.68–0.90` alpha. Never below `0.68`: text over glass must hold `4.5:1` contrast against the worst-case scene behind it.
- Every glass surface must include the inset top highlight — it is what separates "glass" from "gray box."
- Opaque fallback: `@supports not (backdrop-filter: blur(1px))` renders `surface-elevated` (`#0E0E14`) with the same border and shadow.
- Maximum **one** glass layer visible per viewport region. Glass behind glass is forbidden.
- Glass panels never exceed `480px` in their longest dimension except navigation and modals.
- Radius must match the content it contains: `radius-lg` (12px) for product windows and dialogs; `radius-round` pill only for transient status chips.
- Frosted content beneath glass must be non-essential: never place the only copy of an instruction, price, or score under a blurred region.

#### When NOT to use glass

- **Body-copy sections.** Editorial text sits on solid obsidian (`ink-900`/`ink-950`) with hairline borders — glass behind paragraphs kills scanning rhythm.
- **Pricing plan columns and the comparison matrix.** These use solid elevated surfaces; glass is reserved for the single active/current-plan overlay.
- **Repeated cards.** A grid or list of glass cards is explicitly banned (see visual exclusions in §2). If more than two glass panels would appear in one section, none of them may be glass.
- **Data-dense tables, forms, and dashboard/application surfaces.** The product UI keeps solid surfaces for legibility and existing theme compatibility.
- **Over gradients.** Glass over `gradient-brand` or busy constellation fields produces mud; place glass only over calm, dark, low-frequency backgrounds.
- **Low-power/reduced-motion contexts.** If backdrop filters are disabled by capability heuristics, the opaque fallback is the final state — never degrade to translucent-without-blur.

### 3.10 Z-index layers

```text
z-base: 0
z-background-field: 5
z-section-art: 10
z-content: 20
z-floating-preview: 30
z-sticky-story: 40
z-navigation: 50
z-dropdown: 60
z-dialog-backdrop: 70
z-dialog: 80
z-toast: 90
z-loader: 100
```

Do not introduce arbitrary values outside this scale without documenting the collision being solved.

### 3.11 Breakpoints

```text
xs:  360px
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

Primary behavioral modes:

- **Mobile:** `< 768px`
- **Tablet:** `768px–1023px`
- **Desktop:** `>= 1024px`
- **Wide cinematic:** `>= 1440px` within the `2xl` range

---

## 4. Motion System

Motion should feel synchronized, weighted, and cinematic—not springy or playful. Every movement must communicate entry, relationship, state, or spatial continuity.

### 4.1 Motion tokens

| Token | Value | Use |
|---|---:|---|
| `duration-instant` | `100ms` | Press feedback |
| `duration-fast` | `180ms` | Hover, tooltip, icon state |
| `duration-base` | `280ms` | Controls, accordion |
| `duration-slow` | `480ms` | Section elements, drawers |
| `duration-cinematic` | `900ms` | Major scene transitions |
| `duration-ambient` | `6000ms` | Subtle idle drift |
| `stagger-tight` | `45ms` | Small list reveals |
| `stagger-default` | `80ms` | Headlines / feature sequence |
| `stagger-editorial` | `140ms` | Major narrative items |

```text
ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1)
ease-enter: cubic-bezier(0.16, 1, 0.3, 1)
ease-exit: cubic-bezier(0.7, 0, 0.84, 0)
ease-cinematic: cubic-bezier(0.65, 0, 0.15, 1)
ease-linear: linear
```

### 4.2 Interaction behavior

- **Button hover:** translate `0 -2px`, shadow increases one level, duration `180ms`.
- **Button press:** translate `0 1px`, scale `0.985`, duration `100ms`.
- **Icon button hover:** scale `1.04`; do not rotate unless the icon represents refresh/reset.
- **Founder card hover:** translate `0 -6px`, rotateX up to `1.5deg`, rotateY up to `2deg`; disable pointer-follow tilt for touch and reduced motion.
- **Link hover:** color shift plus a 1px underline growing from left; no layout shift.
- **Pricing selection:** border and internal signal line brighten; card never enlarges enough to shift neighbors.
- **Press-and-hold profile behavior:** preserve existing progress/haptic behavior in application surfaces.

### 4.3 Parallax limits

- Background constellation: `-18px` to `+18px` maximum.
- Midground neural lines: `-32px` to `+32px` maximum.
- Profile cards: `-72px` to `+72px` vertical and `-5deg` to `+5deg` rotation maximum.
- Foreground micro-labels: `-12px` to `+12px` maximum.
- Never animate large blurred layers continuously; use static fields with transform-only offsets.

### 4.4 Homepage hero scroll choreography

Hero scene occupies approximately `220vh` desktop, `180vh` tablet, and a non-sticky `auto` sequence on mobile. A sticky visual stage remains fixed for the desktop/tablet scroll interval.

| Scroll progress | Visual state | Text state |
|---|---|---|
| `0.00–0.12` | Obsidian field fades in; constellation at 30% visibility | Eyebrow and headline reveal in two lines |
| `0.12–0.28` | Founder A enters from `x:-34vw, y:8vh, z:-120px`, rotation `-5deg`; Founder B from `x:32vw, y:-4vh, z:-160px`, rotation `4deg` | Opening proposition remains anchored; supporting copy appears |
| `0.28–0.44` | Cards drift to readable positions; profile facts resolve from blur `8px` to `0` | Copy transitions from discovery to compatibility |
| `0.44–0.62` | Shared skill/stage/working-style nodes illuminate; 3–5 connecting lines draw between cards | FounderSync evidence captions synchronize with each line |
| `0.62–0.78` | Cards converge toward center; depth approaches `z:0`; portraits remain individually visible | “Signals align. Partnership becomes legible.” replaces prior copy |
| `0.78–0.90` | Cards lock into a fused match visualization with central compatibility score and dual-avatar identity | CTA and concise trust line appear |
| `0.90–1.00` | Fused visualization lifts `-32px`; lower edge reveals the next editorial section | Scroll cue dissolves; CTA remains accessible |

Implementation expectations:

- Derive animation from a normalized scroll progress value; avoid dozens of independent scroll listeners.
- Use transform and opacity for most interpolation.
- Keep profile names, scores, and core CTA as DOM, never baked into canvas.
- The “fusion” means visual composition, not merging identities: both founders remain distinct and named.
- On mobile, show a staged stacked sequence: founder A, shared-signal line, founder B, then match visualization. No scroll trapping.

### 4.5 Synchronized storytelling

Each long-form section has one clear visual beat and one text beat. Use Intersection Observer to activate scenes near 30% viewport entry. On desktop, split-screen sections can pin the product visual for up to `130vh`, while two or three short text chapters advance. On mobile, chapters become normal flow with visuals between copy blocks.

### 4.6 Reduced motion

Honor `prefers-reduced-motion: reduce` without requiring a separate user setting.

- Replace sticky scroll choreography with a static final hero composition.
- Remove parallax, 3D rotation, pointer tracking, animated network particles, line-drawing loops, and ambient drift.
- Use cross-fades no longer than `180ms` for necessary state changes.
- Keep accordions and dialogs functional with immediate or short opacity transitions.
- Never auto-scroll or auto-cycle content.
- Preserve all visual information: compatibility lines become static, cards remain readable, and match state is visible without animation.

---

## 5. Homepage Architecture

The public homepage remains the `/` route and should evolve from the current `Navigation → Hero → Features → MatchPreview → Footer` structure without changing application routing.

### 5.1 Global navigation

**Purpose:** quiet, persistent access to product information and entry points.

- Initially transparent over hero; transitions to `surface-glass-strong` after 48px scroll.
- Height: `72px` desktop, `64px` tablet, `56px` mobile.
- Left: Lexach wordmark at clear first-viewport prominence.
- Center desktop: Product, FounderSync, Spark Rooms, Pricing, About.
- Right: Log in secondary action and “Find a co-founder” primary action.
- Authenticated state must preserve current dashboard/profile navigation behavior.
- Mobile uses a familiar menu icon and full-height sheet; do not compress all links into tiny text.
- Glass is appropriate here because navigation floats above changing scenes.

### 5.2 Hero — Founder convergence

**Component concept:** `CinematicHero`

- Full-width, minimum first scene height `calc(100svh - nav)`, followed by sticky scroll runway.
- H1 should be literal and product-led: **“Find the co-founder your venture can grow with.”** Final copy can be revised, but must not be an abstract slogan alone.
- Supporting text explains structured compatibility and secure collaboration in no more than 28 words.
- Primary CTA uses existing signup/auth destination; secondary CTA scrolls to FounderSync story.
- Floating founder profile cards use representative but plausible fields already present in the product: role, stage, skills, location, working style, and compatibility signals.
- End state is a fused match module, not a decorative orb.
- Keep a visible hint of the next section at all common viewport heights.

### 5.3 Editorial proof strip — From profile to partnership

**Component concept:** `OutcomeProofRail`

A narrow full-width band, not a card, that shows the journey:

```text
Structured profile → FounderSync signals → SparkMatch → Mutual NDA → Spark Room
```

- Five steps separated by fine animated lines.
- Each label has one factual sentence or metric-sized keyword.
- On mobile, this becomes a horizontally scrollable snap rail with visible next-item affordance.
- Avoid invented usage metrics unless sourced from real analytics.

### 5.4 FounderSync — Compatibility becomes visible

**Component concepts:** `FounderSyncStory`, `CompatibilityConstellation`, `SignalInspector`

- Alternating split screen: editorial copy left / visualization right on desktop; reverse on the following chapter.
- Visual is a deterministic compatibility constellation with named dimensions such as ambition, commitment, execution style, risk, role complementarity, and conflict approach, aligned with actual FounderSync data structures.
- Show “why this match” with traceable rules and weighted signals; do not imply that AI decides matches.
- A moving inspection line may reveal how two founders align across dimensions.
- Use violet for intent/input and teal for aligned/output signals.
- Include a compact product preview inspired by existing `FounderSync`, `FounderSyncBanner`, `FounderSyncHistory`, and `CompatibilityBreakdown` concepts.
- Copy should frame FounderSync as an **intelligent compatibility engine** while accurately stating that matching is structured and rule-based.

### 5.5 SparkMatch — Decision with context

**Component concepts:** `SparkMatchShowcase`, `FounderProfileStack`, `MatchSignalPanel`

- Full-bleed product showcase with one primary profile—not a grid of feature cards.
- Profile photo is intentionally smaller than the detail body so role, stage, skills, location, needs, and compatibility are visible without scrolling, consistent with the existing product requirement.
- A comparison panel dynamically aligns “What I bring” and “What I need.”
- Demonstrate like/pass and advanced filtering states without making the public demo interactive enough to conflict with authentication.
- Preserve language around Free/Starter/Pro capabilities and route locked actions to pricing in actual product implementation.

### 5.6 Trust transition — Mutual NDA

**Component concept:** `TrustProtocolBand`

- Restrained solid section with warm paper typography and a thin gold verification accent.
- Show two signature traces resolving into one “Mutual NDA complete” state.
- Emphasize that chat unlocks after both founders sign, matching current product rules.
- No legal guarantees or invented compliance certifications.

### 5.7 Spark Rooms — Live collaborative digital room

**Component concepts:** `SparkRoomStage`, `LivePresenceRail`, `RoomActivityLayer`

- Darker immersive band with a floating dashboard preview spanning most of the viewport width.
- Room preview should feel live: participant presence, topic/context header, chat stream, shared decisions, typing state, and compact activity cues grounded in existing `SparkRoomChat`, `SparkRoomInfoDialog`, messaging, presence, and media capabilities.
- Use teal for live presence, violet for authored actions, and warm neutral portraits for humanity.
- Avoid faking complex project-management features that do not exist.
- Desktop: room window floats at `3deg` perspective before leveling as it enters.
- Tablet: reduced perspective and simplified side rail.
- Mobile: full-width room preview with one visible conversation column; supplementary panels become tabs or sheets.

### 5.8 Dynamic plan comparison

**Component concept:** `PlanSignalComparison`

- A full-width comparison narrative before the final CTA.
- Start with what Free enables, then visually reveal Starter and Pro capability layers.
- Features must reflect actual current plan logic and `usePlan`/backend authorization, not aspirational access.
- Use aligned rows, check/status icons, and selective highlight—not nested cards.
- Link to `/pricing` while preserving the current return-path behavior for authenticated users.

### 5.9 Final invitation

**Component concept:** `FounderCallToAction`

- Large editorial line over a restrained match-network horizon.
- Primary signup CTA and secondary login action.
- Existing authenticated visitors should receive an appropriate dashboard action instead of signup.
- Keep footer visible below; no giant empty ending scene.

### 5.10 Footer

- Structured into Product, Company, Legal, and Account groups.
- Preserve existing links and destinations.
- Include concise brand statement and actual domain/social links only when verified.
- No newsletter capture unless a real subscription workflow is implemented separately.

---

## 6. Pricing Page Architecture

The `/pricing` route remains functionally connected to existing authentication, Dodo checkout, plan selection, return navigation, and plan activation. Current prices and billing terms must come from the existing pricing/business source of truth at implementation time; never duplicate stale amounts across unrelated components.

### 6.1 Pricing introduction

**Component concept:** `PricingIntro`

- Compact first viewport, not a marketing hero.
- H1: literal plan-selection language.
- Supporting line explains that users can begin free and upgrade when deeper discovery or collaboration is needed.
- If authenticated, show current plan status and any relevant swipe balance using existing hooks.
- Back action returns users to the origin stored by current pricing navigation behavior.

### 6.2 Plan selector

**Component concepts:** `PricingPlanMatrix`, `PlanColumn`, `CurrentPlanMarker`

- Desktop: three aligned plan columns (Free, Starter, Pro) in one comparison surface with shared row structure.
- Tablet: selected plan summary above a horizontally scrollable comparison table.
- Mobile: a segmented plan selector swaps one plan detail panel at a time; feature comparison remains available below as rows.
- Starter/Pro checkout buttons retain existing Dodo flow, loading, success, failure, and authentication handling.
- Use selective glass only for the active plan or current-plan overlay; the matrix itself uses solid elevated surfaces.
- Avoid scaling the “recommended” plan; use border, label, and signal line so columns stay aligned.

### 6.3 Capability groups

Group actual features into scannable categories:

1. **Discovery:** daily/unlimited swipes, match visibility, queue priority.
2. **FounderSync:** basic matches, test access, compatibility depth.
3. **Insight:** AI summaries according to current plan behavior.
4. **Collaboration:** Spark Rooms and messaging-related capabilities.
5. **Identity and support:** badge, support level, and applicable limits.

Each row must distinguish:

- Included
- Limited with an exact limit
- Locked / requires upgrade
- Not applicable

Tooltips may explain plan terminology, but primary access facts must be visible without hover.

### 6.4 Upgrade context

**Component concept:** `UpgradeContextBanner`

When arriving from a gated action, show one concise contextual line—such as remaining swipes or the locked capability count—using existing return-state and query information. Do not reveal sensitive user data in the URL.

### 6.5 Payment confidence band

**Component concept:** `CheckoutConfidenceBand`

- Explain cancellation, access activation, supported payment processor, and invoice/GST handling only according to verified business behavior.
- Never display unsupported assurances, refund promises, or security certifications.
- Checkout remains hosted through the configured payment provider; do not collect raw card data in the app.

### 6.6 FAQ

**Component concept:** existing accessible accordion, visually restyled.

Required topics already present in product intent:

- Refunds
- Cancellation
- What happens to matches after downgrade
- GST and invoicing

Accordion triggers must be keyboard operable, expose expanded state, and preserve readable content when JavaScript motion is reduced.

### 6.7 Pricing final CTA

- Signed-out: account creation action.
- Free authenticated user: upgrade action.
- Paid authenticated user: return-to-dashboard / manage-plan action according to existing functionality.
- Never create a dead-end success state.

---

## 7. Responsive Behavior

### Desktop (`>=1024px`)

- Use full editorial split screens, sticky visuals, wider negative space, and complete hero convergence choreography.
- Constrain copy columns; let visual stages reach `1440px` maximum.
- Navigation displays full links.
- Product windows may overlap section boundaries by up to `64px` where reading order remains clear.
- Pointer tilt is permitted within specified limits.

### Tablet (`768px–1023px`)

- Retain split screens only where each side remains at least `340px` wide.
- Hero cards travel shorter paths and use fewer constellation nodes.
- Sticky sequences may be reduced to `140–180vh` to avoid scroll fatigue.
- Product previews use shallower depth and fewer overlapping panels.
- Pricing comparison supports horizontal overflow with a sticky first column where appropriate.

### Mobile (`<768px`)

- Single-column document flow; no content is hidden solely because desktop animation is unavailable.
- No pinned multi-screen hero. Render sequential founder cards and a final match panel.
- Page gutters `20px`; minimum control height `44px`.
- Navigation becomes a menu sheet with clear authenticated/signed-out actions.
- Product windows occupy `calc(100vw - 40px)` and never extend beyond viewport.
- Split-screen alternation becomes a consistent sequence: heading → copy → visual → supporting proof.
- Network visual density is reduced by at least 60%.
- Pricing plans use a segmented selector plus one stable-height detail region when possible; long feature lists expand naturally rather than clipping.
- Safe-area insets apply to sticky bottom actions.

### Small mobile (`<360px`)

- Hero type uses the mobile endpoint without further viewport-proportional scaling.
- Long plan names and actions wrap to two lines.
- Data rows stack label over value if less than `300px` content width remains.
- Decorative previews may simplify to the core state; never shrink important text below `12px`.

---

## 8. Accessibility Contract

Target WCAG 2.2 AA for public and application-adjacent surfaces.

- Body text contrast: minimum `4.5:1`; large text: minimum `3:1`; interactive boundaries and focus indicators: minimum `3:1` against adjacent colors.
- Violet and teal are never the only distinction between two states; pair with icon, label, line style, or shape.
- Every interactive control has a visible keyboard focus ring using `focus-ring` and at least `2px` visual thickness with `2px` offset.
- Use semantic landmarks (`header`, `nav`, `main`, `section`, `footer`) and a skip-to-content link.
- Heading hierarchy is sequential and does not follow visual size blindly.
- Founder profile images have concise identity/context alt text; decorative constellations are `aria-hidden`.
- Canvas/WebGL scenes require a DOM text equivalent and never contain the only CTA or explanation.
- All actions meet a `44×44px` minimum touch target on mobile.
- Hover-only details must also open via keyboard focus/tap.
- Pricing comparisons use actual table semantics on desktop where tabular comparison is shown.
- Dialog focus is trapped and restored to its trigger; Escape closes dismissible dialogs.
- Live presence and typing indicators avoid noisy screen-reader announcements. Only meaningful status changes enter a polite live region.
- Toasts must not be the sole record of payment or plan state; provide persistent page feedback.
- Respect reduced motion and high-contrast/forced-color modes.
- Do not auto-play audio or video.

---

## 9. Performance and Rendering Guidance

### 9.1 Performance budgets

- Public initial JavaScript, gzip: target `<180KB` excluding essential existing shared vendor code; any animation/WebGL bundle must be route- and section-lazy-loaded.
- Largest Contentful Paint: target `<2.5s` on a mid-tier mobile device over simulated 4G.
- Cumulative Layout Shift: target `<0.05`.
- Interaction to Next Paint: target `<200ms`.
- Hero still image/portrait payload above the fold: target `<450KB` total mobile and `<900KB` desktop.
- Maintain 60fps for primary transforms; tolerate 30fps only for nonessential canvas ambience on constrained devices, then degrade automatically.

### 9.2 Animation implementation

- Prefer CSS transforms and opacity; animate `transform: translate3d(...)`, `scale`, `rotate`, and opacity.
- Do not animate layout properties (`top`, `left`, `width`, `height`) during continuous scroll.
- Apply `will-change` only shortly before an animation and remove it afterward.
- Use a single `requestAnimationFrame` scheduler for scroll-derived motion.
- Read layout once, batch writes, and avoid state updates per frame in broad React trees.
- Use Intersection Observer to pause offscreen sequences.
- Use CSS custom properties for scroll progress when practical, keeping React state out of frame-by-frame interpolation.
- Avoid animating large box shadows or blur radii continuously. Cross-fade precomposed glow layers instead.

### 9.3 Images

- Use AVIF with WebP/JPEG fallback where the asset pipeline allows.
- Explicitly set width, height, and aspect ratio to prevent layout shift.
- Provide portrait crops suitable for `4:5`, `1:1`, and mobile `3:4` contexts.
- Use responsive `srcset`/`sizes` and cap rendered dimensions to actual need.
- Eager-load only the primary visible hero portraits; lazy-load all below-fold imagery.
- Apply `fetchpriority="high"` only to the single likely LCP image.
- Avoid loading desktop cinematic crops on mobile.

### 9.4 Canvas / WebGL

- Use Canvas 2D or SVG for modest constellation networks; introduce Three.js/WebGL only if profiling proves it materially improves the hero fusion scene.
- Any WebGL scene must be dynamically imported after initial text and CTA render.
- Cap device pixel ratio at `1.5` desktop and `1.25` mobile.
- Pause rendering when the tab is hidden or the scene is offscreen.
- Avoid post-processing bloom on mobile; use DOM/CSS glow layers or low-cost shader alternatives.
- Keep particle/node count approximately: desktop `<=120`, tablet `<=70`, mobile static `<=24`.
- Provide a static DOM/SVG fallback for WebGL failure, low-memory devices, `saveData`, and reduced motion.
- Dispose geometries, materials, textures, observers, and animation frames on unmount.

### 9.5 Lazy loading and code splitting

- Keep navigation, primary hero copy, and first visual shell in the initial route chunk.
- Lazy-load FounderSync constellation logic, Spark Room preview enhancement, and below-fold imagery when their section approaches within `400px` of the viewport.
- Pricing must not load homepage animation modules.
- Application/dashboard routes must not inherit public cinematic bundles.
- Prefetch `/signup` or `/dashboard` only after intent (CTA hover/focus) and only when network conditions permit.

### 9.6 Device adaptation

- Respect `navigator.connection.saveData` where available.
- Use static scenes on low-power heuristics instead of reducing text/content.
- Test memory cleanup through repeated `/` ↔ `/pricing` ↔ `/dashboard` navigation.
- Ensure the existing wireframe loader does not delay access to critical homepage content; future redesign should prefer progressive rendering over a fixed multi-second gate.

---

## 10. Proposed Component Architecture

The implementation should extend the current repository rather than rewrite unrelated product code. Existing components may be visually adapted or wrapped; established logic remains in place.

### 10.1 Naming conventions

- Public storytelling sections: PascalCase noun + purpose, e.g. `FounderSyncStory`.
- Scene-only visual layers: suffix `Scene`, `Field`, `Constellation`, or `Stage`.
- Product previews: suffix `Preview` or `Showcase`; they are presentational and must not fork core business logic.
- Animation hooks: `use` + behavior, e.g. `useScrollProgress`.
- Token and content modules: kebab-case files under `src/content` or clear camelCase TypeScript modules under `src/lib`.

### 10.2 Proposed future file tree

This is a proposal for implementation—not a file creation request in this turn.

```text
src/
├── assets/
│   └── cinematic/
│       ├── founders/                 # optimized generated/editorial portraits
│       ├── textures/                 # subtle grain only, compressed
│       └── fallbacks/                # static hero/network fallbacks
├── components/
│   ├── cinematic/
│   │   ├── CinematicHero.tsx
│   │   ├── FounderConvergenceScene.tsx
│   │   ├── FounderProfileCard.tsx
│   │   ├── MatchFusionVisualization.tsx
│   │   ├── ConstellationField.tsx
│   │   ├── ScrollStoryFrame.tsx
│   │   └── StaticHeroFallback.tsx
│   ├── landing/
│   │   ├── LandingNavigation.tsx      # preserve current auth-aware destinations
│   │   ├── OutcomeProofRail.tsx
│   │   ├── FounderSyncStory.tsx
│   │   ├── CompatibilityConstellation.tsx
│   │   ├── SignalInspector.tsx
│   │   ├── SparkMatchShowcase.tsx
│   │   ├── TrustProtocolBand.tsx
│   │   ├── SparkRoomStage.tsx
│   │   ├── PlanSignalComparison.tsx
│   │   ├── FounderCallToAction.tsx
│   │   └── LandingFooter.tsx
│   ├── pricing/
│   │   ├── PricingIntro.tsx
│   │   ├── PricingPlanMatrix.tsx
│   │   ├── PlanColumn.tsx
│   │   ├── CapabilityRow.tsx
│   │   ├── UpgradeContextBanner.tsx
│   │   ├── CheckoutConfidenceBand.tsx
│   │   └── PricingFAQ.tsx
│   ├── previews/
│   │   ├── SparkMatchPreview.tsx      # presentation adapter around real concepts
│   │   ├── SparkRoomPreview.tsx
│   │   ├── DashboardFloatingPreview.tsx
│   │   └── FounderSyncPreview.tsx
│   ├── motion/
│   │   ├── MotionProvider.tsx
│   │   ├── Reveal.tsx
│   │   ├── ParallaxLayer.tsx
│   │   └── ReducedMotionBoundary.tsx
│   └── ui/                            # existing shadcn primitives retained
├── content/
│   ├── landingContent.ts
│   └── pricingContent.ts              # labels only; access truth remains existing logic
├── hooks/
│   ├── useScrollProgress.ts
│   ├── useReducedMotion.ts
│   ├── useInViewScene.ts
│   └── useDeviceCapability.ts
├── lib/
│   ├── motionTokens.ts
│   └── visualPerformance.ts
├── pages/
│   ├── Index.tsx                      # compose redesigned public sections
│   └── Pricing.tsx                    # compose redesigned pricing sections
└── index.css                          # semantic design and motion tokens
```

### 10.3 Relationship to existing files

- `src/pages/Index.tsx` remains the homepage route composer.
- `src/pages/Pricing.tsx` remains the pricing route and must keep checkout/return logic.
- Existing `Hero`, `Features`, `MatchPreview`, `Navigation`, and `Footer` should be incrementally replaced or adapted, not deleted until route parity is verified.
- Existing `FounderSync`, `SparkMatch`, `SwipeCard`, `LiveMatchmaking`, `SparkRoomChat`, `CompatibilityBreakdown`, and related application components remain functional sources of truth. Public previews should not duplicate their data rules.
- Existing UI primitives under `src/components/ui` remain the accessible base for buttons, accordions, dialogs, tabs, tooltips, and forms.
- Existing hooks for authentication, plans, checkout, pricing return paths, daily swipes, realtime matches, presence, and admin guards must remain authoritative.
- Do not import public animation scenes into dashboard or authentication bundles.

---

## 11. Premium Founder and Editorial Imagery

### 11.1 Art direction

Use original, premium editorial portraits of diverse startup founders. Images should feel commissioned for a technology and culture publication—not generic corporate stock photography.

- Natural facial texture, confident but unforced expressions.
- Modern founder wardrobe: understated technical, creative, or professional clothing without visible brand logos.
- Dark studio or real working environments with controlled practical light.
- Violet and teal edge light may connect imagery to the interface, but skin tones remain natural.
- Compose with enough negative space for UI metadata.
- Represent varied genders, skin tones, roles, and ages appropriate to early-stage entrepreneurship.
- Never generate identifiable real people, public figures, deceptive testimonials, fake company logos, or fabricated customer quotes.
- Treat generated people as illustrative profiles and avoid presenting them as actual members.

### 11.2 Image-generation prompt templates

No asset is claimed to have been generated yet. These prompts guide future generation and should be adapted into a coherent set with consistent lighting, lens, grading, and art direction.

#### Founder portrait — product card

```text
Premium editorial portrait of a fictional early-stage startup founder, [role and domain], direct but warm expression, photographed waist-up in a refined dark studio workspace, deep obsidian background, soft neutral key light with subtle electric-violet rim light and restrained teal practical light, natural skin texture, understated modern clothing without logos, authentic startup editorial photography, 85mm lens look, shallow but readable depth of field, clean negative space around shoulders for interface overlay, high dynamic range, realistic, no text, no logos, no holograms, no exaggerated cyberpunk styling, vertical 4:5 composition
```

#### Paired founders — convergence narrative

```text
Two fictional startup founders photographed separately but with matched editorial lighting and perspective, complementary roles, each facing slightly toward the composition center, deep obsidian environment, one with a subtle violet edge light and one with a subtle teal edge light, natural expressions suggesting thoughtful collaboration, premium technology magazine photography, restrained cinematic contrast, realistic skin and fabric, clear subject separation, generous central negative space for a compatibility visualization, no text, no logos, no handshake pose, no sci-fi costume, wide 16:9 composition
```

#### Spark Room environment

```text
A small diverse founding team in a contemporary collaborative workspace during a focused working session, candid editorial moment, screens present but without legible brand UI, dark architectural materials, practical warm light balanced by subtle teal and violet screen reflections, energetic but calm, premium documentary technology photography, authentic posture and interaction, no staged celebration, no text, no logos, wide 16:9 composition with negative space for a floating product interface
```

#### Abstract fallback texture

```text
Minimal premium dark material texture, deep obsidian paper and smoked glass, extremely subtle fine grain, sparse precise violet and teal light traces suggesting connected trajectories, no blobs, no bokeh, no text, no logos, no central object, seamless cinematic background, restrained contrast, 16:9
```

### 11.3 Asset QA

- Review every portrait at mobile crop and desktop crop.
- Check hands, eyes, jewelry, laptop edges, and background text for artifacts.
- Remove accidental logos and unreadable pseudo-text.
- Validate that overlaid text maintains contrast without darkening faces into obscurity.
- Store optimized originals in the project asset flow; never hotlink generated outputs.
- Document model, prompt, generation date, usage rights, and edits outside user-facing UI as appropriate.

---

## 12. Content and Product Accuracy

- Explain FounderSync as structured compatibility intelligence based on the existing assessment and deterministic matching rules.
- AI language is permitted only for the existing plan-based match explanation/summaries. Never say AI chooses or ranks co-founders if it does not.
- “Secure” language must refer to real controls such as authentication, gated access, mutual NDA, and current security measures; avoid absolute guarantees such as “unhackable.”
- Pricing features and limits must be sourced from current production plan logic before launch.
- Do not invent member counts, match rates, testimonials, company logos, awards, response times, or compliance claims.
- Use `₹` consistently for Indian Rupees unless checkout/localization requirements dictate otherwise.
- Keep product names consistent: FounderSync, SparkMatch, Spark Rooms, and Mutual NDA.

---

## 13. Phased Implementation Plan

Future implementation should proceed in these phases, with route and functional checks after each phase.

### Phase 1 — Design system

- Introduce semantic dark-theme color, typography, spacing, radius, shadow, blur, z-index, and motion tokens.
- Add approved font loading with fallbacks and no CSS URL imports.
- Update shared button, focus, accordion, tooltip, and surface variants while preserving current component APIs.
- Establish reduced-motion and static-scene utilities.
- Create Storybook-like isolated preview routes only if they do not alter production routing; otherwise test components locally in existing pages behind temporary development composition.
- Verify contrast, keyboard focus, dark surfaces, and authenticated navigation parity.

**Exit criteria:** tokens are centralized; shared controls remain functional; no application route visually regresses unintentionally.

### Phase 2 — Homepage

- Build the static homepage composition first: navigation, hero final state, editorial sections, FounderSync story, SparkMatch showcase, trust band, Spark Rooms, plan comparison, CTA, and footer.
- Connect every CTA to existing routes and auth-aware destinations.
- Add optimized illustrative imagery with explicit dimensions and fallbacks.
- Validate desktop, tablet, and mobile layouts before introducing complex motion.

**Exit criteria:** the full story works with JavaScript animation disabled and preserves all links/flows.

### Phase 3 — Pricing

- Restyle `/pricing` around the plan matrix and capability groups.
- Preserve existing plan data, user status, swipe context, Dodo checkout, return-to-origin behavior, loading states, error handling, and FAQ content.
- Verify Free, Starter, Pro, signed-out, loading, checkout-success, checkout-failure, and downgrade-related states.

**Exit criteria:** visual redesign does not alter authorization or payment behavior; all state combinations remain legible.

### Phase 4 — Motion polish

- Add hero scroll choreography and FounderSync/Spark Room synchronized reveals.
- Implement a single scroll-progress system, GPU-friendly transforms, offscreen pausing, and static fallbacks.
- Profile runtime cost on mid-tier mobile and constrain WebGL/canvas use.
- Tune copy transitions so no text overlaps or disappears before the replacement is readable.

**Exit criteria:** smooth at target devices, no scroll trapping, no animation-dependent information, no layout shift.

### Phase 5 — Responsive and accessibility

- Test all target widths, short laptop heights, landscape mobile, browser zoom to 200%, keyboard-only use, screen-reader structure, reduced motion, and forced colors.
- Simplify visual density by breakpoint rather than merely shrinking desktop scenes.
- Confirm touch targets, reading order, alt text, focus management, and pricing table accessibility.

**Exit criteria:** WCAG 2.2 AA target met; mobile experience is purpose-built rather than a compressed desktop version.

### Phase 6 — QA and release readiness

- Regression-test routes, auth, signup/login captcha, profile, dashboard tabs/cache, pricing return paths, checkout, plan gating, daily swipes, Who Liked You, FounderSync, SparkMatch, mutual NDA, messaging, Spark Rooms, notifications, and admin flows.
- Check console/runtime/network errors and current build output.
- Run security/dependency checks without weakening existing controls.
- Audit bundle split, LCP assets, CLS, animation frame rate, memory cleanup, and lazy-loading thresholds.
- Verify all copy, prices, plan limits, legal links, and business claims with stakeholders.
- Roll out progressively where possible and retain the previous homepage composition until acceptance criteria pass.

**Exit criteria:** no functional regression, no critical accessibility issue, no security-control regression, and measured performance within agreed budgets.

---

## 14. Implementation Acceptance Checklist

### Visual

- [ ] Deep obsidian is the dominant base, with violet and teal reserved for signal and action.
- [ ] Typography reads as premium editorial, with clear headline/body/data roles.
- [ ] Glass appears only in navigation, floating previews, and appropriate overlays.
- [ ] Hero cards visibly converge into a match visualization while retaining both founder identities.
- [ ] FounderSync appears intelligible, deterministic, and evidence-based.
- [ ] Spark Rooms appears live and collaborative without inventing unavailable features.
- [ ] Sections alternate composition and pacing instead of repeating identical cards.

### Functional

- [ ] Existing routes and deep links still resolve.
- [ ] Authenticated and signed-out navigation remains correct.
- [ ] Dashboard/application flows are unaffected by public animation bundles.
- [ ] Pricing return path and dashboard tab state remain intact.
- [ ] Checkout, subscription activation, feature gating, and backend authorization remain unchanged unless separately specified.
- [ ] Mutual NDA still gates chat as currently designed.

### Responsive and accessible

- [ ] Desktop, tablet, mobile, and small-mobile compositions are verified.
- [ ] Reduced motion presents a complete static experience.
- [ ] Keyboard, focus, touch target, contrast, semantic structure, and screen-reader behavior pass review.
- [ ] Text never overlaps imagery, controls, or adjacent sections.

### Performance

- [ ] Below-fold scenes and heavy libraries are lazy-loaded.
- [ ] Images are responsive, dimensioned, optimized, and locally served.
- [ ] Continuous motion uses transform/opacity and pauses offscreen.
- [ ] Canvas/WebGL has static fallbacks and cleans up resources.
- [ ] Public cinematic code does not inflate dashboard/auth route bundles.

---

## 15. Contract Governance

This specification governs future visual redesign work for the Lexach / FindBaee public homepage and pricing page. When implementation details conflict with existing production behavior, **existing secure functionality and product rules win** unless a separate approved requirement explicitly changes them.

Any future deviation from the exact tokens, motion ranges, section architecture, accessibility rules, or preservation requirements should be documented and approved before implementation. This file does not authorize changes to business logic, routes, authentication, subscription enforcement, database policies, payments, or application workflows.

**This is the design contract for future edits, not a request to implement those edits now.**
