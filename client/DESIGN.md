---
name: FuelLog
description: Calm, neutral food and training log for beginner lifters, with one dark-green scoreboard that says what is still to get.
colors:
  brand-green: "#15803D"
  brand-green-dark: "#4ADE80"
  on-brand: "#FFFFFF"
  on-brand-dark: "#052E16"
  board-green: "#0C301F"
  board-green-dark: "#0C2C1C"
  on-board: "#F0F3EB"
  board-muted: "#9CBAA7"
  board-muted-dark: "#96B6A2"
  board-line: "#24543C"
  board-line-dark: "#1E4A34"
  scoreboard-yellow: "#FFCC29"
  scoreboard-yellow-dark: "#FFD23F"
  board-alert: "#FF8C78"
  page-grey: "#F4F5F7"
  page-grey-dark: "#0E1116"
  surface: "#FFFFFF"
  surface-dark: "#161B22"
  field: "#F1F3F6"
  field-dark: "#1F2630"
  raised: "#FFFFFF"
  raised-dark: "#343D4B"
  ink: "#111418"
  ink-dark: "#F2F4F8"
  muted-ink: "#58606C"
  muted-ink-dark: "#9BA3B0"
  hairline: "#E4E7EC"
  hairline-dark: "#262C36"
  field-line: "#A0A6B0"
  field-line-dark: "#4A5260"
  danger: "#B91C1C"
  danger-dark: "#F87171"
  protein-pink: "#BE185D"
  protein-pink-dark: "#F472B6"
  carbs-blue: "#1D4ED8"
  carbs-blue-dark: "#60A5FA"
  fat-amber: "#B45309"
  fat-amber-dark: "#FB923C"
  pr-gold-dark: "#F59E0B"
typography:
  board-figure:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 800
    lineHeight: 0.85
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 75"
    fontFeature: "'tnum'"
  board-column:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    fontVariation: "'wdth' 75"
    fontFeature: "'tnum'"
  page-headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "'tnum'"
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum'"
  body-sm:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.06em"
rounded:
  sm: "4px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand-green}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.xl}"
    padding: "0 24px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.page-grey}"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "48px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "44px"
  segmented-track:
    backgroundColor: "{colors.field}"
    rounded: "{rounded.xl}"
    padding: "4px"
  segmented-option-selected:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  tile:
    backgroundColor: "{colors.field}"
    rounded: "{rounded.xl}"
    padding: "12px"
  action-tile:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px"
    height: "76px"
  board:
    backgroundColor: "{colors.board-green}"
    textColor: "{colors.on-board}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  board-figure:
    textColor: "{colors.scoreboard-yellow}"
    typography: "{typography.board-figure}"
  tab:
    textColor: "{colors.muted-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    height: "52px"
  tab-active:
    textColor: "{colors.brand-green}"
    rounded: "{rounded.xl}"
    height: "52px"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.3xl}"
    padding: "20px"
---

# Design System: FuelLog

## Overview

**Creative North Star: "The Calm Board"**

FuelLog is a calm, category-grade tracker with one signature. Everything a beginner touches is neutral: white cards on a light cool grey in light mode, charcoal cards on near-black in dark mode, a slightly deeper field tone for inputs and tracks, and a raised tone for the selected option. Against that quiet base sits one object, Today's scoreboard: a dark-green board with a monumental condensed yellow figure that says how many kilocalories are still to get, with Target, Eaten and Burned in ruled columns beneath. The mobile rest bar on Workout is cut from the same board.

Density is comfortable rather than tight: 20px inside cards, 12px inside tiles, 44px or larger targets for one-handed use between sets. One typeface, Archivo variable, does all the work; its condensed cut appears only on the board. Headings are sentence case and bold; uppercase is kept for small column labels. Corners are soft and consistent: 16px surfaces, 12px controls, pill chips. Depth is a hairline plus one short soft shadow, never glass or glow.

The system rejects two things the user has seen and turned down: the neon-ring dark fitness app, and a full-costume world where the theme green soaks every surface (the first Run Chase pass, rejected on 2026-10-18). Brand green is for actions, the active tab and done states, not for painting surfaces.

**Key Characteristics:**
- Neutral surfaces everywhere except the board; the board stays dark green in both themes.
- One face, Archivo variable; the condensed cut (wdth 75) only on board surfaces.
- Tabular numerals everywhere (set on `html`).
- Sentence-case bold headings; uppercase only for small column labels.
- 16px surfaces, 12px controls, 8px segmented options, 24px sheets, pill chips and bars.
- Brand green marks action, the active tab and done; scoreboard yellow lives on the board.
- One authored motion: the board figure rolls up to its new value.

## Colors

A neutral grey world with one dark-green object, brand green for intent, and bumper-plate colours for macro data. Every token has a light and a dark value (`-dark` keys) and switches with the system theme or a `.dark` / `.light` / `[data-theme]` class on the root.

### Primary
- **Brand Green** (brand-green / brand-green-dark): primary button fill, the active tab (text on a 10% wash), the done set row (10% wash, 30% border) and its filled check button, checked toggles in Daily check, `.action` icons and their pressed state, links, list markers, focus rings, input focus border, caret and native accent colour. In dark mode it brightens to a lit green with deep-green text on it (on-brand-dark). It is also the kcal data series.

### Secondary
- **Scoreboard Yellow** (scoreboard-yellow / -dark): the To get figure on Today's board, the running rest time and its pulse dot on the rest bar, and text selection (yellow on board green).
- **Board Alert** (board-alert): the board figure when the day is over target. One value, because the board is dark in both themes.

### Tertiary (data series)
- **Protein Pink**, **Carbs Blue**, **Fat Amber** (plus `-dark` values): macro bars, chart series and legend marks, taken from bumper plates. Fibre uses muted ink. Fat amber also marks a day over target on the 14-day calorie chart (other days are muted ink at 60%). **PR Gold** shares fat amber in light and is #F59E0B in dark; it marks personal records (the PR badge on a set row, PR points in exercise history).

### Neutral
- **Board Green** (board-green / -dark), **On-Board**, **Board Muted**, **Board Line**: the board surface, its figures, its labels and units, and its rules and edge.
- **Page Grey** (page-grey / -dark): the page behind the cards, and the phone header band.
- **Surface** (surface / -dark): cards, chips, secondary buttons, sheets, toasts, the tab bar and the inset header from 768px.
- **Field** (field / -dark): inputs, tiles, segmented tracks, action tiles and the nudge line inside a card.
- **Raised** (raised / -dark): the selected segmented option, lifted out of its field track. White in light; a lighter slate in dark.
- **Ink** / **Muted Ink**: primary and secondary text. Muted ink also carries labels, placeholders, inactive tabs and unit suffixes.
- **Hairline**: card edges, row rules, chip borders, bar tracks. **Field Line**: input borders (at 70%), chip hover border, unchecked control borders, the scrollbar.
- **Danger**: invalid-field borders and rings, field errors, destructive hovers.

### Named Rules
**The One Green Object Rule.** Board green paints only Today's scoreboard and the mobile rest bar. Every other surface is neutral; brand green never tints a card or a band.

**The Green Means Intent Rule.** Brand green appears where the user acts or has finished: a primary fill, the active tab, a done row, a checked toggle, focus. Data figures stay in neutral ink.

**The Plates Are Data Rule.** Protein pink, carbs blue and fat amber stand for their macros. Amber may also flag over target and gold marks a PR; none of them is used for buttons, borders or decoration.

## Typography

**Display Font:** Archivo Variable at wdth 75 (condensed cut; `.cond`), board surfaces only
**Body Font:** Archivo Variable at wdth 100 (with ui-sans-serif, system-ui, -apple-system, Segoe UI)

**Character:** One grotesque, plain at normal width for every heading, label and sentence, and condensed, heavy and yellow for the one figure that matters. `font-variant-numeric: tabular-nums` is global, so columns of numbers line up.

### Hierarchy
- **Board Figure** (800, 4.5rem, 5.25rem from 360px wide, line-height 0.85, -0.02em, condensed): only the To get / Over by figure on Today's board. Its kcal unit is condensed 1.125rem bold uppercase in board muted.
- **Board Column** (700, 1.5rem, line-height 1, condensed): Target / Eaten / Burned values; the rest timer uses the same cut at 1.25rem extrabold.
- **Page Headline** (800, 1.75rem, line-height 1.25, -0.02em, sentence case): the day's heading on Workout (the split name) and the Rest day card; at 700 it also sets the lead figure in the weekly summary.
- **Headline / Stat** (700, 2rem, line-height 1, -0.02em): headline figures inside cards; the unit beside it is 0.875rem / 500 in muted ink.
- **Title / Card Head** (700, 1.125rem, line-height 1.25, -0.01em, sentence case): every card heading (Add food, Eaten, Daily check). The header's page title on undated pages is 1.25rem bold. Base `h1`-`h3` are semibold with tight tracking and balanced wrapping.
- **Figure** (700, 1.25rem, line-height 1, -0.01em): tile values.
- **Body** (400, 1rem): inputs, buttons, food names. **Body Small** (0.875rem) is the most used size: chips, meta lines, field labels (500, muted), notes.
- **Label / Column Head** (600, 0.6875rem, uppercase, 0.06em, muted ink): macro names over their bars, tile labels, set-table column heads. On the board the labels are condensed bold 0.75-0.875rem at 0.08em in board muted. Tab labels share the size and weight in sentence case.

### Named Rules
**The Condensed Belongs to the Board Rule.** The condensed cut sets board figures, board labels and the rest bar. Nothing on a neutral surface is condensed.

**The Label Names What Is Below Rule.** Uppercase is reserved for small labels that name the figure, bar or column directly below or beside them. Headings are sentence case; nothing uppercase sits above a heading as decoration.

## Layout

Single column on phones with 16px page gutters (24px from 768px); the shell is capped at 1120px and centred. Below 768px the header band is flush to the top on page grey with a hairline under it, and the tab bar is flush to the bottom, both respecting safe-area insets. From 768px the header becomes an inset surface card (12px top, 24px sides, 16px corners). From 1024px the tab bar becomes a vertical rail on the left (64px items), and wide pages pack into a main column plus a narrower aside.

Rhythm comes from a 4px base: 8px and 12px gaps inside rows and grids, 12px inside tiles, 20px inside cards and the board, 12-20px between stacked cards. Scroll padding (5rem top, 7rem bottom on phones; 6rem left and 2rem bottom from 1024px) keeps focused fields clear of the header and tab bar. Everything must work at 320px; set rows tighten their grid below 380px.

## Elevation & Depth

Mostly flat with one soft tier. Cards have a hairline edge and a short, soft shadow whose strength is a themed token (`--shadow`: 0.12 light, 0.5 dark). The board carries a slightly deeper shadow so it reads as a raised object. Tiles, tracks and inputs inside a card are tonal (field) with no shadow; the selected segmented option is the one control that lifts. Overlays (sheets, toasts) use large shadows. Dialog backdrops are a near-black green at 60%.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.05), 0 10px 20px -16px rgb(0 0 0 / var(--shadow))`): every card.
- **Board** (`box-shadow: 0 12px 24px -16px rgb(0 0 0 / 0.55)`): Today's scoreboard and the rest bar.
- **Lifted option** (`box-shadow: 0 1px 3px rgb(0 0 0 / 0.18)`): the selected segmented option.
- **Overlay** (`shadow-2xl` / `shadow-xl`): sheets and toasts only.

### Named Rules
**The No Glass, No Glow Rule.** Panels, bands and pages are opaque, with no coloured glow or radial light behind content. The one blur is a small black scrim under a control laid over a photo, where it keeps the icon legible.

**The One Surface Rule.** Never nest a card inside a card. Structure the inside of a card with field-toned tiles, rules and spacing.

## Shapes

One soft corner language on the Tailwind default scale. Surfaces (cards, the board, the rest bar, set rows, the nudge line, the inset header) use 16px. Controls (buttons, inputs, tiles, action tiles, segmented tracks, tabs, toasts) use 12px. Segmented options use 8px inside their 12px track. Sheets use 24px (top corners only on phones). Chips, icon buttons, progress bars and status dots are fully round. The only 4px corner is the small PR badge. Edges are 1px hairlines; list markers are 6px brand-green squares. Photos get a 1px inset outline at 10% ink so they do not bleed into the card.

## Components

### Buttons
Plain, firm and finger-sized.
- **Shape:** gently rounded (12px), at least 44px by 44px.
- **Primary:** brand green fill, on-brand text, 1rem bold, 24px side padding. Hover brightens 10%; press scales to 0.97 on the spring curve (150ms).
- **Secondary:** surface fill, hairline border, ink text, 1rem semibold, 20px side padding. Hover fills with page grey.
- **Icon button:** borderless 44px circle, muted ink icon (20px), hover tints with 6% ink and darkens the icon to ink.
- **Disabled:** 50% opacity, no pointer events.
- **Focus:** a 2px brand green outline at 2px offset, everywhere.

### Chips
- **Style:** surface fill, hairline border, pill shape, 0.875rem medium ink, 44px tall, 16px side padding; a trailing muted figure (kcal) when it logs food. Used for recent foods and saved meals.
- **State:** hover darkens the border to field line; press scales to 0.97.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** surface.
- **Shadow Strategy:** the Card shadow (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal Padding:** 20px. Heads use the Card Head style.
- **Tile:** a recessed field-toned cell inside a card, 12px corners, 12px padding, a Label above a Figure.
- **Action tile:** a secondary action as a tile (Scan barcode, Custom food, Describe meal, Photo of meal), at least 76px tall, field fill with a hairline, a 22px brand green icon above a 0.875rem semibold label; hover shifts the border to brand green at 50%; pressed fills brand green at 10% with a full brand green border.

### Inputs / Fields
- **Style:** 48px tall, field fill, field line border at 70%, 12px corners, 16px side padding, muted placeholder. Labels sit above in 0.875rem medium muted ink.
- **Focus:** border turns brand green with a 3px brand green ring at 20%.
- **Error / Disabled:** `aria-invalid` turns the border and ring danger; field errors are 0.875rem danger text below. Disabled is 50% opacity. Selects share one chevron.

### Segmented Control
A field-toned track (12px corners, 4px padding, 4px gaps). Options are 40px tall, 8px corners, 0.875rem semibold muted ink; the checked option lifts out as a raised card in ink with the Lifted option shadow. Used for meal slot, units and similar single choices.

### Set Row
A 16px-corner row in a set table under small uppercase column heads (Set, Prev, Reps, kg). Pending rows have a faint hairline and a 44px outlined check button; a done row washes brand green at 10% with a 30% border and its check fills brand green. A new PR shows a small gold badge under the set number.

### Navigation
- **Header band:** at least 56px. On a phone it is page grey with a hairline below; from 768px it is an inset surface card. On Today and Workout it carries the date switcher (the page name is screen-reader only); elsewhere it shows the page title.
- **Tab bar / rail:** a surface band with a hairline edge and four tabs, each a 22px stroked icon (1.5px) above a 0.6875rem semibold sentence-case label. Inactive tabs are muted ink and hover to ink; the active tab is brand green text on a 10% brand green wash, 12px corners. Tabs are 52px tall, 64px on the rail.

### Sheet
A dialog surface: a bottom sheet on phones (24px top corners, up to 90% of the viewport height), a centred modal from 640px. Surface fill, hairline edge, 20px padding, overlay shadow. Opens with a 320ms rise on the expo-out curve over the dark backdrop.

### Scoreboard (signature)
Today's calorie board, the first thing on the page. A board-green panel (16px corners, 20px padding, board shadow, board-line edge). The top row holds the board label (To get, or Over by) and the streak at the right, both condensed bold uppercase in board muted, with the streak count in on-board. Below is the Board Figure in scoreboard yellow (board alert when over) with its condensed kcal unit. Under a board-line rule are three columns divided by board-line rules, Target / Eaten / Burned, each a board-muted label over an on-board Board Column value. When the figure changes it rolls up into its new value (420ms, translate 45% plus a 2px blur, `cubic-bezier(0.16, 1, 0.3, 1)`).

**Rest bar.** On phones during a workout, the same board surface floats above the tab bar: idle it is a small 16px-corner Rest button in condensed uppercase; running it shows a pulsing yellow dot and the yellow condensed time, the set count in board muted, and a round +30s button on a 10% on-board wash.

### Motion
Interactive transitions use one spring curve (`cubic-bezier(0.32, 0.72, 0, 1)`) at 150-200ms, and presses scale to 0.97 (0.96 on tabs and small buttons). Macro and water bars fill over 500ms. Pages fade in as a whole (240ms); sections do not each animate in. The board's digit roll is the one authored motion. Reduced-motion users get instant transitions.

## Do's and Don'ts

### Do:
- **Do** keep every surface neutral (page grey, surface, field, raised) and let the board be the only dark-green object, in both themes.
- **Do** use brand green for intent: primary fill, active tab, done rows, checked toggles, focus, links.
- **Do** set headings in sentence case and bold, and keep uppercase for small labels naming the figure or column below.
- **Do** keep corners at 16px for surfaces, 12px for controls, 8px for segmented options, 24px for sheets, and full round for chips and bars.
- **Do** structure the inside of a card with field-toned tiles rather than nested cards.
- **Do** keep touch targets at 44px or more (48px inputs, 52px tabs).
- **Do** use the spring curve and a 0.97 press scale for interactive feedback.

### Don't:
- **Don't** tint cards, bands or page backgrounds with brand green or board green.
- **Don't** use the condensed cut or scoreboard yellow off the board.
- **Don't** use the macro plate colours for anything but their macro data, the over-target mark and PRs.
- **Don't** use glass, coloured glows or radial light washes on panels, bands or page backgrounds.
- **Don't** nest a card inside a card.
- **Don't** add a calorie ring or a neon hero metric; the board's figure and columns carry the day.
- **Don't** put an uppercase label above a heading as decoration.
- **Don't** add new entrance animations per section; the board's digit roll is the only authored motion.
