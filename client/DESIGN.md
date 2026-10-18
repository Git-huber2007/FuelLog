---
name: FuelLog
description: Food and training log for beginner lifters, read like a night scoreboard over a printed scorecard.
colors:
  brand-green: "#15683C"
  brand-green-dark: "#4ADE80"
  on-brand: "#FFFFFF"
  on-brand-dark: "#052E16"
  board-green: "#0C301F"
  board-green-dark: "#04100A"
  on-board: "#F0F3EB"
  board-muted: "#9CBAA7"
  board-muted-dark: "#8CAC98"
  board-line: "#24543C"
  board-line-dark: "#1C3C2B"
  scoreboard-yellow: "#FFCC29"
  scoreboard-yellow-dark: "#FFD23F"
  board-alert: "#FF8C78"
  scorecard: "#FFFFFF"
  scorecard-dark: "#0D2419"
  ground: "#EEF1ED"
  ground-dark: "#081810"
  ink: "#0E1E16"
  ink-dark: "#EAF0E5"
  muted-ink: "#46564D"
  muted-ink-dark: "#94AE9E"
  hairline: "#D4DCD6"
  hairline-dark: "#1E3E2D"
  field-line: "#7C8C83"
  field-line-dark: "#486C59"
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
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 75"
    fontFeature: "'tnum'"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 75"
  figure:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
    fontVariation: "'wdth' 75"
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
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 75"
rounded:
  sm: "2px"
  DEFAULT: "3px"
  md: "4px"
  lg: "6px"
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
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.scorecard}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.ground}"
  input:
    backgroundColor: "{colors.scorecard}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  chip:
    backgroundColor: "{colors.scorecard}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  segmented-option-selected:
    backgroundColor: "{colors.brand-green}"
    textColor: "{colors.on-brand}"
    rounded: "{rounded.sm}"
    height: "40px"
  card:
    backgroundColor: "{colors.scorecard}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  tile:
    rounded: "{rounded.sm}"
    padding: "12px"
  board:
    backgroundColor: "{colors.board-green}"
    textColor: "{colors.on-board}"
    rounded: "{rounded.md}"
    padding: "16px"
  board-figure:
    textColor: "{colors.scoreboard-yellow}"
    typography: "{typography.board-figure}"
  tab-active:
    textColor: "{colors.scoreboard-yellow}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "52px"
  sheet:
    backgroundColor: "{colors.scorecard}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: FuelLog

## Overview

**Creative North Star: "The Run Chase"**

Every day is a run chase: the target is set, and the board says what is still required. The app is built from two materials. The **night scoreboard** is deep scoreboard green with condensed yellow figures; it paints the shell bands (sticky header, tab bar or rail) and Today's calorie board, and stays dark in both themes. The **printed scorecard** is everything else: white panels on a pale green-grey ground in light mode, green-black panels in dark mode, ruled with hairlines, headed with condensed uppercase column heads, every number in tabular figures.

Density is dense but legible: tight cards (16px inside), ruled cells inside them, 44px+ targets for one-handed use in a gym. One typeface, Archivo variable, does all the work. Width 100 sets text. Width 75 (the condensed scoreboard cut) sets figures, card heads and column heads. Corners are near-square everywhere (2-6px). Depth is a short, soft shadow under panels, never glass or glow. Macro colours (protein pink, carbs blue, fat amber) appear only as data series, never as decoration.

The system rejects the fitness-app default, a near-black screen with a neon ring, glass pills and padded hero-metric cards. Green is the brand colour and the only interactive accent.

**Key Characteristics:**
- Two materials: dark scoreboard bands for the shell and Today's board, scorecard panels for content.
- One face at two widths: Archivo at wdth 100 for text, wdth 75 for figures and heads.
- Tabular numerals everywhere (set on `html`).
- Near-square corners: 4px panels, 2px cells, 6px sheets; full radius only for dots.
- Brand green is the only accent; scoreboard yellow lives only on the board.
- One authored motion: the board figure rolls up to its new value.

## Colors

A green-on-green world: scoreboard green for the bands, brand green for action, yellow only for the figures the board shows, and plate colours kept for data. Every token has a light and a dark value (`-dark` keys) and switches with the system theme or a `.dark` / `[data-theme]` class on the root.

### Primary
- **Brand Green** (brand-green / brand-green-dark): primary buttons, the selected segmented option, links, focus rings, input focus border, the caret and native accent colour, `.action` icons and pressed state, list markers. In dark mode it brightens to a lit green with deep-green text on it (on-brand-dark). It is also the kcal data series.

### Secondary
- **Scoreboard Yellow** (scoreboard-yellow / -dark): the TO GET figure on Today's board, the active tab label and icon, and text selection (yellow on board green). It appears only on board surfaces.
- **Board Alert** (board-alert): the board figure when the day is over target. A single value, because the board is dark in both themes.

### Tertiary (data series)
- **Protein Pink**, **Carbs Blue**, **Fat Amber** (plus their `-dark` values): macro bars, chart series and legend marks only, taken from bumper plates. **PR Gold** is fat-amber in light and #F59E0B in dark; it marks personal-record points on charts.

### Neutral
- **Board Green** (board-green / -dark): the band and board surface. **On-Board** text, **Board Muted** for board labels and inactive tabs, **Board Line** for board rules and edges.
- **Scorecard** (scorecard / -dark): card, input, chip and sheet surface.
- **Ground** (ground / -dark): the page behind the cards. At 60% opacity it fills tiles, segmented tracks and action tiles inside a card.
- **Ink** / **Muted Ink**: primary and secondary text.
- **Hairline**: card edges, tile edges, row rules. **Field Line**: input and button borders (buttons at 60%), and the scrollbar.
- **Danger**: invalid-field borders, field errors, destructive hovers.

### Named Rules
**The Board Owns Yellow Rule.** Scoreboard yellow is used only on board-green surfaces: the board figure, the active tab, selection. It never sits on a scorecard.

**The Plates Are Data Rule.** Protein pink, carbs blue and fat amber stand for macros. They are never used for buttons, borders or decoration.

## Typography

**Display Font:** Archivo Variable at wdth 75 (condensed cut; `.cond`)
**Body Font:** Archivo Variable at wdth 100 (with ui-sans-serif, system-ui, Segoe UI)

**Character:** One grotesque at two widths. The condensed cut, set uppercase and heavy, reads like painted scoreboard figures and printed column heads; the normal width keeps food names and guidance plain. `font-variant-numeric: tabular-nums` is global, so columns of numbers line up.

### Hierarchy
- **Board Figure** (800, 4.5rem, 5.25rem from 360px wide, line-height 0.85, -0.02em, condensed): only the TO GET / OVER BY figure on Today's board.
- **Headline / Stat** (700, 2rem, line-height 1, -0.01em, condensed): headline figures in cards (rest timer, workout summary); the unit beside it is 0.875rem / 500 in muted ink at normal width.
- **Title / Card Head** (800, 1.25rem, uppercase, 0.02em, condensed): every card's heading (ADD FOOD, EATEN, DAILY CHECK), and the page title in the header band on undated pages.
- **Figure** (700, 1.5rem, line-height 1, condensed): tile values and the board's TARGET / EATEN / BURNED columns.
- **Body** (400, 1rem): inputs, buttons, food names. **Body Small** (0.875rem) is the most used size: chips, meta lines, labels, notes.
- **Label / Column Head** (700, 0.75rem, uppercase, 0.06em, condensed; 0.08em on the board): tile labels, set-table column heads, meal-slot heads, board labels, tab labels (0.04em).

### Named Rules
**The Two Widths Rule.** Numbers and heads are condensed; sentences are not. Never set a paragraph in the condensed cut, and never set a scoreboard figure at normal width.

**The Label Is a Column Head Rule.** Uppercase condensed labels name the figure or column directly below them. They are not decorative lines above headings.

## Layout

Single column on phones with 16px page gutters (24px from 768px). The shell is capped at 1120px and centred. Below 1024px the header band is flush to the top edge and the tab bar is flush to the bottom edge, both respecting safe-area insets. From 768px the header band is inset (12px top, 24px sides) with 4px corners. From 1024px the tab bar becomes a vertical rail on the left (64px wide items, 96px shell padding), pinned to the edge of the 1120px column; wide pages pack into a main column plus a narrower aside.

Rhythm comes from a 4px base: 8px and 12px gaps inside rows and grids, 12px inside tiles, 16px inside cards, 12-20px between stacked cards. Scroll padding (5rem top, 7rem bottom on phones) keeps focused fields clear of the bands. Everything must work at 320px.

**Known gaps in the shipped build.** On desktop the left rail runs flush from the viewport top while the header band is inset 12px, so their top edges do not align; treat the inset band as the intended form. The Landing page (marketing surface) is outside this world: it inherits the tokens but still carries older radial glow washes and decorative uppercase labels above its tile titles. Neither is a pattern to copy.

## Elevation & Depth

Mostly flat with one soft tier. Scorecard panels have a hairline edge plus a short, soft shadow whose strength is a themed token (`--shadow`: 0.12 light, 0.5 dark). Board bands carry a slightly deeper shadow to read as raised signage. Tiles inside cards are tonal (ground at 60%) with no shadow. Overlays (sheets, toasts) use Tailwind's large shadows. Dialog backdrops are board green at 60%.

### Shadow Vocabulary
- **Scorecard** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.05), 0 10px 20px -16px rgb(0 0 0 / var(--shadow))`): every `.card`.
- **Board** (`box-shadow: 0 12px 24px -16px rgb(0 0 0 / 0.55)`): header band, tab bar or rail, Today's board.
- **Overlay** (Tailwind `shadow-2xl` / `shadow-xl`): sheets and toasts only.

### Named Rules
**The No Glass, No Glow Rule.** Surfaces are opaque. No backdrop blur on panels or bands, and no coloured glows or radial light behind content.

**The One Surface Rule.** Never nest a card inside a card. Use a tile (ruled cell, ground fill) for structure inside a card.

## Shapes

One corner language: near-square. Panels, buttons, inputs, chips and the board use 4px. Cells inside panels (tiles, segmented options, tab items) use 2px. Sheets use 6px (top corners only on phones). The Tailwind radius scale is overridden so `xl` and `2xl` also resolve to 4px and `3xl` to 6px, which means no class can produce a soft pill. Full radius is reserved for dots and other round marks. Edges are 1px hairlines; list markers are 6px squares in brand green, not round bullets. Photos get a 1px inset outline at 10% ink so they do not bleed into the card.

## Components

### Buttons
Firm and plain.
- **Shape:** gently squared (4px), at least 44px by 44px.
- **Primary:** brand green fill, on-brand text, 1rem bold, 24px side padding. Hover brightens 10%; press scales to 0.97 on the spring curve (150ms).
- **Secondary:** scorecard fill, ink text, 1rem semibold, field line border at 60%, 20px side padding. Hover fills with ground.
- **Icon button:** borderless 44px square, muted ink icon (20px), hover tints with 6% ink. On board bands the icon is board muted and hovers to on-board.
- **Disabled:** 50% opacity, no pointer events.
- **Focus:** a 2px brand green outline at 2px offset, everywhere.

### Chips
- **Style:** scorecard fill, hairline border, 0.875rem medium text, 44px tall, 4px corners. Used for recent foods, saved meals and muscle tags.
- **State:** hover darkens the border to field line; press scales to 0.97.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** scorecard.
- **Shadow Strategy:** the Scorecard shadow (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal Padding:** 16px. Heads use the Card Head style.
- **Tile:** a ruled cell inside a card, 2px corners, hairline edge, ground at 60%, 12px padding, a Label above a Figure.
- **Action tile:** a secondary action shown as a tile, at least 76px tall, brand green icon (22px) above a 0.875rem semibold label; hover shifts the border to brand green at 50%; pressed state fills brand green at 10% with a full brand green border.

### Inputs / Fields
- **Style:** 48px tall, scorecard fill, 1px field line border, 4px corners, 16px side padding, muted placeholder. Labels sit above in 0.875rem medium muted ink.
- **Focus:** border turns brand green with a 3px brand green ring at 20%.
- **Error / Disabled:** `aria-invalid` turns the border and ring danger; field errors are 0.875rem danger text below. Disabled is 50% opacity. Selects share one chevron in field line grey.

### Segmented Control
A track of ground at 60% with a hairline edge and 4px padding; options are 40px tall, 2px corners, 0.875rem semibold muted ink. The checked option is filled brand green with on-brand text in both themes. Used for meal slot, units and similar single choices.

### Navigation
- **Header band:** a board band at least 56px tall. On Today and Workout it carries the date switcher (the page name is screen-reader only); elsewhere it shows the page title in the Card Head style.
- **Tab bar / rail:** a board band with four tabs (icon above a condensed uppercase 0.75rem label, 22px stroked icons at 1.5px). Inactive tabs are board muted and hover to on-board; the active tab is scoreboard yellow on a 10% on-board fill with 2px corners. Tabs are 52px tall, 64px on the rail.

### Sheet
A dialog surface: a bottom sheet on phones (6px top corners, up to 90% of the viewport height), a centred modal from 640px. Scorecard fill, hairline edge, 20px padding, overlay shadow. Opens with a 320ms rise on the expo-out curve over a board-green backdrop at 60%.

### Scoreboard (signature)
Today's calorie board. A board-green panel (4px corners, 16px padding, board shadow). The top row has the board label (TO GET, or OVER BY) and the streak at the right in condensed uppercase board muted, with the streak count in on-board. Below is the Board Figure in scoreboard yellow (board alert when over) with a condensed KCAL unit. Under a board-line rule are three ruled columns, TARGET / EATEN / BURNED, each a board-muted label over an on-board Figure. When the figure changes it rolls up into its new value (420ms, translate 45% plus a 2px blur, `cubic-bezier(0.16, 1, 0.3, 1)`). This is the system's only authored motion.

### Motion
Interactive transitions use one spring curve (`cubic-bezier(0.32, 0.72, 0, 1)`) at 150-200ms, and presses scale to 0.97. Pages fade in as a whole (240ms); individual sections do not each animate in. Reduced-motion users get instant transitions.

## Do's and Don'ts

### Do:
- **Do** paint the shell bands and Today's board with board green and keep them dark in both themes.
- **Do** set every number, card head and column head in Archivo's condensed cut (wdth 75), and every sentence at normal width.
- **Do** keep corners at 4px for panels and controls, 2px for cells, 6px for sheets.
- **Do** structure the inside of a card with ruled tiles (hairline, ground at 60%) rather than nested cards.
- **Do** use brand green for every interactive accent: primary fill, selected option, focus ring, links.
- **Do** keep touch targets at 44px or more (48px inputs, 52px tabs).
- **Do** use the spring curve and a 0.97 press scale for interactive feedback.

### Don't:
- **Don't** put scoreboard yellow on a scorecard surface.
- **Don't** use the macro plate colours for anything but their macro data.
- **Don't** use glass (backdrop blur), coloured glows or radial light washes on panels, bands or page backgrounds.
- **Don't** use pill shapes or large radii; full radius is only for dots.
- **Don't** nest a card inside a card.
- **Don't** add a calorie ring or a neon hero metric; the board's figure and columns carry the day.
- **Don't** add an uppercase label above a heading as decoration; uppercase condensed labels only name the figure or column below them.
- **Don't** add new entrance animations per section; the board's digit roll is the only authored motion.
