---
name: Incident Copilot
description: A support case file on an off-white desk — paper panels, hairline borders, one violet for Investigate.
colors:
  case-violet: "oklch(0.44 0.15 292)"
  case-violet-ink: "oklch(0.99 0 0)"
  desk: "oklch(0.975 0.004 286)"
  ink: "oklch(0.2 0.012 286)"
  paper: "oklch(1 0 0)"
  wash: "oklch(0.96 0.006 286)"
  annotation: "oklch(0.44 0.014 286)"
  hairline: "oklch(0.905 0.008 286)"
  failure: "oklch(0.55 0.18 27)"
typography:
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  md: "0.4rem"
spacing:
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.case-violet}"
    textColor: "{colors.case-violet-ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "28px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "color-mix(in oklab, oklch(0.44 0.15 292) 80%, transparent)"
    textColor: "{colors.case-violet-ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "28px"
  button-outline:
    backgroundColor: "{colors.desk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "28px"
  button-outline-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "28px"
  paper-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  composer:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  evidence-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "10px 0"
  evidence-row-selected:
    backgroundColor: "color-mix(in oklab, oklch(0.44 0.15 292) 10%, transparent)"
    textColor: "{colors.ink}"
    padding: "10px 0"
  status-badge:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
    height: "20px"
    typography: "{typography.label}"
---

# Design System: Incident Copilot

## Overview

**Creative North Star: "The Support Case File"**

Incident Copilot is a restrained Operate console: an off-white desk holding white paper, not a chatbot and not a marketing landing page. The engineer types what the customer is seeing, runs one investigation, and reads the likely cause, ordered next checks, and cited incidents as a single case file. Density is high; decoration is near zero. Geist at 12–15px does all of the work.

The world is paper on a desk. Surfaces are white rectangles with a 1px hairline. A single Fireworks-inspired violet is the only chromatic accent, reserved for the Investigate action, selected evidence, the caret, and focus. Historical IDs and step numbers sit in system mono so they read as file marks, not UI chrome.

Confirmed visual rejections: chatbot bubbles, a hero or display type scale, a second accent, pill-shaped tags, and resting drop shadows on paper.

**Key Characteristics:**
- Off-white desk, white paper panels, 1px hairline borders
- Geist only; 15px semibold is the in-page title ceiling
- One violet, used as action and selection — never as a panel fill
- Flat paper at rest; a right sheet is the only lifted surface
- Compact product bar, composer first, two-column case file below

## Colors

A near-neutral paper palette with a cool violet bias in the desk, ink, and hairline, plus one saturated violet for action.

### Primary
- **Case Violet**: Investigate, selected incident IDs, caret, 3px focus rings, and text selection. Its job is to mark the one action and the one selected source.

### Neutral
- **Desk**: Page background. Cool off-white; the surface the paper sits on.
- **Paper**: Composer, case-file panel, error panel, and incident sheet. Literal white.
- **Ink**: Primary text on desk and paper.
- **Annotation**: Secondary copy, dates, empty-state notes, keyboard hint.
- **Wash**: Muted fills — evidence-column tint (`wash` at 30% over paper), hover on outline controls, skeleton pulse.
- **Hairline**: Every resting border and divider.

### Named Rules
**The One Violet Rule.** Case Violet is the only chromatic accent. It appears on Investigate, the selected evidence row, the caret, focus rings, and selection highlight. It does not fill headers, panels, or backgrounds.

## Typography

**Display Font:** Geist (with ui-sans-serif / system-ui)
**Body Font:** Geist (same face; there is no pairing)
**Label/Mono Font:** ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas (incident IDs and step indices)

**Character:** A single geometric sans at console sizes. No display cut. Weight contrast is regular vs semibold only.

### Hierarchy
- **Headline** (semibold, 15px, tight tracking): Product name and every in-page section title — Likely cause, What to check next, Supporting incidents.
- **Title** (semibold, 13px): Composer field label, sheet section labels (Summary, Symptoms, Root cause).
- **Body** (regular, 14px / 24px line-height, max 65ch): Assessment, plan steps, empty-state copy, sheet prose.
- **Label** (regular, 12px): Header subtitle, incident count, composer footer, dates, status meta. Keyboard hint drops to 11px tabular-nums.
- **Mono** (regular, 12px, tabular-nums): Incident IDs and zero-padded step indices (`01`, `02`).

Sheet overlay titles bump one pixel to 16px semibold; that bump stays in the sheet and is not an in-page display size.

### Named Rules
**The Console Scale Rule.** There is no display face. 15px semibold is the ceiling for titles on the desk. Body never exceeds 14px / 24px.

## Layout

The page is a single centered column, `1120px` max, `24px` horizontal and `20px` vertical padding. Vertical rhythm between the product bar, composer, and case file is `20px`.

The product bar is a compact header: mark, 15px name, 12px subtitle, incident count flush right, hairline underneath. The composer is the primary action and sits directly below. After a run, the case file is a two-column paper panel: likely cause and plan on the left (`1.15fr`), supporting incidents on the right (`minmax(260px, 0.85fr)`), splitting at `768px`. Below `768px` the evidence column stacks under the plan. Paper interiors pad `16px`. The inspect sheet is `32rem` wide on the right and does not replace the case.

Numbered lists use a `20px` mono index column and `8px` row gap. Evidence rows divide with hairlines and `10px` vertical padding.

## Elevation & Depth

Resting surfaces are flat. Depth is a 1px hairline on white paper against the desk, plus a light wash (`wash` at 30%) on the evidence column so the two sides of the case file read as adjacent sheets, not a shadowed card.

The only lifted object is the incident sheet: a soft large shadow, a 10% black overlay, and a 4px backdrop blur. Focus uses a 3px Case Violet ring (20% on the composer, 50% on buttons) rather than a drop shadow.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): Incident inspect sheet only.
- **Focus ring** (`0 0 0 3px` Case Violet at 20–50%): Composer focus-within and control focus-visible.

### Named Rules
**The Hairline Paper Rule.** Paper is flat at rest. Do not add drop shadows to the composer, case file, or error panel. Lift is reserved for the inspect sheet.

## Shapes

Paper, composer, outline controls, and status badges share a modest corner (`0.4rem` / `rounded-md`). Borders are 1px hairline, never 2px, never dashed. The evidence list is a hairline-divided stack, not cards-in-cards. Status and tag badges are rounded rectangles, not pills. The product mark is a `24px` paper square with a `5px` corner — a stamp, not a glossy app icon.

## Components

### Buttons
- **Shape:** Modest corners (`0.4rem`), 28px tall, 10px horizontal padding, 12–13px medium type.
- **Primary:** Case Violet fill, near-white label. This is Investigate, and only Investigate. Hover drops the fill to 80%. Disabled is 50% opacity. Active nudges 1px down.
- **Outline:** Desk fill, hairline border, ink label, regular weight when used as example prompts. Hover washes to muted. Retry after failure uses the same outline treatment.
- **Focus:** 3px Case Violet ring at 50%, 2px offset.

### Chips
Not a separate control. Example prompts and incident tags reuse the outline button and outline badge at modest radius and regular weight. Do not introduce pill chips.

### Cards / Containers
- **Corner Style:** Modest (`0.4rem`)
- **Background:** Paper white on the desk
- **Shadow Strategy:** None at rest (see Elevation)
- **Border:** 1px hairline
- **Internal Padding:** `16px` on the case file; composer field `10px 12px` with a hairline footer bar
- **Evidence column:** Paper tinted with wash at 30%

Error panels use the same paper recipe with a failure hairline at 30%.

### Inputs / Fields
- **Style:** The composer is a paper panel, not a naked textarea. Transparent field, no inner border, `14px / 24px` body, `104px` minimum height, no resize handle. Footer bar holds helper copy, the keyboard hint, and Investigate.
- **Focus:** The panel, not the textarea, takes the ring — hairline shifts to Case Violet plus a 3px ring at 20%.
- **Caret / selection:** Caret is Case Violet; selection is Case Violet mixed 22% with white.

### Navigation
Compact product bar. Hairline bottom border, no tabs, no sidebar. Name at 15px semibold; subtitle and corpus count at 12px annotation.

### Case File (signature)
Two-column paper after a successful run. Left: provenance-separated sections — Historically grounded assessment, Relevant historical analog, or No historical match; then General technical assessment only when it adds a labeled hypothesis; then a numbered plan titled “What to check next.” Status copy is Strong historical support, Relevant historical analog, No historical match, or Insufficient information. Ungrounded cases caption the general section “Not grounded in internal incident history.” Analogous cases caption “Similar internal case with important differences.” Right: historical evidence (or analogs) as full-width rows — mono ID, tabular date, truncated 13px title, Inspect affordance; empty state explains that the internal corpus has no supporting case. External references sit below as domain / title / relevance rows with an Open affordance, or an honest unavailable/empty note. Selected incident row washes with Case Violet at 10% and paints the ID in Case Violet. Inspect opens the source record in a right sheet without leaving the case.

### Incident Sheet (signature)
Right sheet, paper fill, `32rem` at `640px+`. Header is a hairline-separated block: mono ID, 16px title. Body is a two-column definition list (`72px` labels) then hairline-separated sections. Symptom bullets are 4px annotation dots, not icons.

### Loading skeleton
Same two-column paper as the case file. A 12px annotation status line sits on a hairline header. Pulse bars use wash. No spinner, no skeleton on the composer.

## Do's and Don'ts

### Do:
- **Do** sit white paper on the off-white desk with a 1px hairline and `0.4rem` corners.
- **Do** keep titles at 15px semibold and body at 14px / 24px, wrapping assessment copy at 65ch.
- **Do** reserve Case Violet for Investigate, selected evidence, caret, and focus.
- **Do** mark incident IDs and step indices in 12px tabular mono.
- **Do** inspect a cited incident in a right sheet; keep the case file on screen.

### Don't:
- **Don't** use chatbot bubbles, a hero, or any type larger than 16px.
- **Don't** introduce a second accent or fill chrome with Case Violet.
- **Don't** drop-shadow resting paper (composer, case file, error panel).
- **Don't** use pill badges; tags and status stay modest-radius rectangles.
- **Don't** ship a dark invert; the shipped world is the light desk.
