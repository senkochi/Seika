# Seika Frontend Style Guide

This document defines the current visual and component conventions used in the Seika web frontend.
Use it as a single source of truth for collaboration so new UI work stays consistent.

## 1) Design Intent

- Brand mood: playful, energetic, gamified learning platform.
- Primary brand colors: purple + amber/yellow.
- Surface strategy:
  - Guest / Landing pages: more cinematic, expressive, and visually rich.
  - Dashboard pages (Student and future Teacher): simpler, calmer, and easier to scan.
- Core contrast pattern: dark gradient backgrounds + bright highlight actions.
- UI tone: rounded, soft, friendly, and high-contrast.
- Design rule: keep the same brand colors across pages, but vary saturation, motion, and visual density by page purpose.

## 2) Surface Modes

### Guest / Landing Pages

- Purpose: attract attention and communicate product value quickly.
- Style: bold gradients, floating decorative elements, larger hero typography, playful cards, and more visual layering.
- Example pages: Landing Page sections such as Navbar, Hero, Features, About, Contact, Footer.

### Dashboard Pages

- Purpose: support frequent use, fast scanning, and low cognitive load.
- Style: darker shell, more restrained decorative treatment, clearer hierarchy, and content-first cards.
- Example pages: Student Dashboard and future Teacher Dashboard.
- Rule: use the same purple/amber system, but prefer cleaner surfaces and less motion than Landing Page.

## 2) Tech and UI Stack

- Framework: React + TypeScript + Vite.
- Styling: Tailwind CSS v4 utility-first.
- Motion helpers: tw-animate-css + Tailwind animation utilities.
- Icon system: lucide-react, react-icons/lu.
- Component primitives: shadcn-style component set in src/components/ui (Radix + CVA + cn utility).

## 3) Typography

- Primary font family: Inter.
- Source: configured globally in src/index.css via --font-sans.
- Global smoothing: antialiased with optimizeLegibility.

### Type Scale Patterns in Existing UI

- Hero title: text-5xl md:text-6xl lg:text-7xl + font-black.
- Section title: text-4xl md:text-5xl + font-black.
- Feature card title: text-2xl to text-3xl + font-black.
- Body text: text-lg to text-xl.
- Supporting text: text-sm to text-xs.

### Weight Convention

- Strong display and CTA emphasis: font-black.
- Normal body and utility text: default/regular.

## 4) Color System

The current implementation is based on Tailwind color utilities rather than custom semantic tokens.
Keep using these classes to remain visually consistent.

### Primary Brand Family (Purple/Indigo)

- Dark surfaces/backgrounds:
  - indigo-950
  - violet-950
  - purple-900
  - violet-900
- Mid accents/borders:
  - violet-800
  - violet-700
  - violet-600
  - purple-700
  - purple-600
- Light-on-dark text:
  - violet-100
  - violet-200
  - violet-300
  - purple-100
  - purple-200

### Page-Specific Usage

- Landing Page:
  - Use deeper purple gradients and brighter amber accents.
  - Favor high-saturation highlights, glow blobs, and strong section separators.
- Dashboard pages:
  - Use the same base colors, but lower the visual noise.
  - Prefer semi-transparent dark shells, softer gradients, and simple readable cards.
  - Keep amber as the main action and reward color; keep purple as the base and supporting accent.

### Secondary Accent Family (Yellow/Amber)

- Primary highlight/action:
  - amber-300
  - amber-400
  - amber-500
  - yellow-300
  - yellow-400
  - yellow-500
- Usage:
  - CTA backgrounds and gradient text highlights.
  - Icon emphasis and reward/XP indicators.
  - Hover states on dark surfaces.

### Supporting Accent Colors (Use Sparingly)

- green-500 / emerald-600 for wallet/coins meaning.
- blue-500 / cyan-600 for notification or informational blocks.
- orange-500 / red-600 for competitive/leaderboard emphasis.

### Neutral Usage

- Base page background default from [src/index.css](src/index.css): dark purple gradient.
- Neutral content text on dashboard cards: violet-100 / violet-200 / muted-foreground tokens.
- Light card surfaces are allowed only in Landing Page feature blocks or when the content needs a bright contrast break.

## 5) Gradient Recipes

Use these exact recipes as the default style language.

### Dark Brand Background

- bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950
- Used in Landing hero, About, Footer, and the overall dashboard shell base.

### Gold Feature Section Background

- bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-500
- Used in features section.

### Primary CTA Gradient

- bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500
- Used for Register/Get Started style buttons and dashboard CTA buttons.

### Purple Feature Card Gradient

- bg-gradient-to-br from-purple-900 to-purple-800
- Used for high-emphasis feature cards.

### Dashboard Shell Background

- bg-[rgba(20,15,38,0.88)] for the sidebar shell.
- bg-[rgba(24,18,45,0.9)] for the top header shell.
- bg-[var(--card)] / bg-[var(--second-card)] for dashboard content cards.

### Accent Blob/Glow Elements

- Amber glow: bg-gradient-to-br from-amber-400 to-yellow-500 + blur-xl.
- Purple glow: bg-gradient-to-br from-violet-600 to-purple-700 + blur-xl.

### Existing Hardcoded SVG Gradient Reference

- Footer wave gradient currently uses:
  - #1e1b4b
  - #3e1b6d
  - #59168b

If adding custom SVG gradients, stay in this dark-indigo to deep-violet range.

## 6) Logo Guidelines

- Reusable component: src/components/logo/Logo.tsx.
- Asset source: PNG only from src/assets/logo.
- Preferred usage: use Logo component instead of hand-built icon+text blocks.
- Default composition:
  - Image size: w-10 h-10.
  - Brand text: Seika with text-2xl font-black.

## 7) Icon Guidelines

- Primary icon library: lucide-react.
- Commonly used icons in current UI:
  - Navigation: Menu, X.
  - Hero mood: Rocket, Star, Zap, SwatchBook, Award, PencilRuler.
  - Feature semantics: Brain, Store, CreditCard, Trophy, Bell.
  - Footer contact: Mail, Phone, MapPin.

### Icon Style Rules

- Typical sizes:
  - Small inline: w-4 h-4, w-5 h-5.
  - Feature/icon containers: w-8 h-8 in a 64x64 rounded tile.
- Container treatment:
  - Rounded-2xl, gradient background, slight rotation (rotate-6).
- Color logic:
  - On dark cards: white icons.
  - On amber/yellow tiles: purple-900 or purple-950 icon color.

## 8) Spacing and Layout

- Main content container width: max-w-7xl.
- Horizontal padding pattern: px-4 sm:px-6 lg:px-8.
- Section spacing:
  - Hero: pt-16 pb-16 plus internal py-20.
  - Features: pt-34 pb-48.
  - Footer: py-20.
- Grid patterns:
  - Responsive: grid-cols-1 -> md/grid variants.
  - Frequent gap sizes: gap-4, gap-6, gap-8, gap-12.

### Dashboard Layout Rules

- Student and Teacher dashboard shells should use a fixed viewport-height layout.
- Sidebar should be fixed-height and visually separate from main content.
- Main content should scroll independently from the sidebar.
- Dashboard pages should prefer denser card spacing than Landing Page, but keep the content breathable.
- Use clear section groupings and avoid oversized empty zones inside dashboards.

## 9) Shape Language

- Corners are intentionally rounded and playful:
  - rounded-full for chips/buttons.
  - rounded-2xl for icon tiles.
  - rounded-3xl for feature cards/visual blocks.
- Additional personality:
  - mild rotation classes (rotate-6, rotate-12, -rotate-12).
  - layered absolute decorative objects.

## 10) Motion and Interaction

### Existing Custom Animations

- animate-float-bag in src/index.css:
  - 7s ease-in-out infinite.
- animate-float-joystick in src/index.css:
  - 5.2s ease-in-out infinite with 0.8s delay.

### Existing Utility Animations

- animate-pulse, animate-bounce on decorative elements.
- Hover interactions:
  - hover:scale-105 for CTA and floating objects.
  - hover:scale-[1.02] for cards.
  - group-hover based icon rotation and image zoom.
- Transition pattern:
  - transition-all or transition-transform.
  - duration-500 for prominent animated blocks.

### Motion Principle

- Keep motion playful but non-distracting.
- Prefer gentle float/scale/rotate over heavy or continuous complex motion.

## 11) Buttons, Pills, and Chips

### Rounded CTA Buttons

- Primary CTA:
  - Rounded full, amber/yellow gradient, dark purple text, font-black.
- Secondary CTA:
  - Rounded full, translucent violet background, violet border.
- Dashboard CTA buttons:
  - Prefer the same amber/yellow gradient for key actions.
  - Keep labels short and action-oriented.
  - Avoid introducing a second unrelated button style on the same dashboard.

### Pills/Badges

- Use rounded-full with subtle border and translucent violet background.
- Common for small labels like Features and Learning Made Fun.

## 12) Card Patterns

- Card base on light sections:
  - bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl.
- Interactive behavior:
  - hover:shadow-2xl + small scale-up.
- Dark emphasis cards:
  - purple gradient background + yellow text accents.

### Dashboard Cards

- Use translucent dark-purple cards with border and backdrop blur.
- Prefer readable text hierarchy over decoration.
- Reserve bright yellow/amber fills for reward cards, balance cards, and primary actions.
- Keep card content compact and scannable.

## 13) Section Pattern Library (Current)

### Navbar

- Fixed top bar.
- Dark translucent background + backdrop blur.
- Desktop links + mobile collapsible panel.

### Hero

- Full-height dark gradient canvas.
- Decorative floating icon field.
- Strong gradient headline.
- Two-CTA pattern (primary/secondary).
- Layered 3D visuals with float motion.

### Features

- Bright yellow/amber section for contrast break.
- Mixed card mosaic with image and content blocks.
- Rotated icon tiles and hover micro-interactions.

### Footer

- Dark gradient close section.
- Top wave divider SVG.
- Contact + links + social icon buttons.

### Student Dashboard

- Dark purple application shell with fixed sidebar and top header.
- Cards use translucent dark surfaces with amber as the main highlight.
- Content pages such as Dashboard, Learning Hub, Marketplace, and Wallet should feel cleaner and more utilitarian than the Landing Page.
- Use shared components for repeated CTAs and badges.

### Future Teacher Dashboard

- Reuse the Student Dashboard shell language unless a teacher-specific workflow requires a different emphasis.
- Keep the same sidebar/header structure, spacing logic, and card language.
- Shift only the content semantics and any role-specific actions, not the whole visual system.
- This is the default direction for future agentic UI work so Teacher and Student dashboards remain visually consistent.

## 14) Component Library Usage (shadcn-style)

The project contains a full reusable component set under src/components/ui.
Use these as first choice before building one-off primitives.

### Important Conventions

- Use cn from src/components/ui/utils.ts for class merging.
- Use class-variance-authority variants for scalable style variants.
- Follow the existing data-slot and variant APIs where present.

### Common Available Primitives

- Form/input controls: input, textarea, checkbox, radio-group, select, switch, slider, form, label.
- Navigation: navigation-menu, menubar, breadcrumb, pagination, tabs.
- Overlays: dialog, alert-dialog, popover, dropdown-menu, tooltip, sheet, drawer.
- Layout/display: accordion, card, table, carousel, chart, separator, sidebar, skeleton, scroll-area.

## 15) Accessibility and UX Baselines

- Keep text contrast high on dark backgrounds.
- Preserve keyboard/focus behavior from shadcn/Radix primitives.
- Maintain touch-friendly tap areas on mobile menus and buttons.
- Ensure hover-only meaning is never the sole signal for important actions.

## 16) Collaboration Rules (Do / Do Not)

### Do

- Reuse existing gradient and color classes before introducing new ones.
- Use Inter and current heading weight rhythm.
- Reuse Logo component and ui primitives.
- Keep rounded, playful, slightly dynamic visuals.
- Treat Guest/Landing pages and Dashboard pages differently in density and motion, but keep them in the same brand family.
- Keep dashboard patterns reusable so a future Teacher Dashboard can mirror Student Dashboard quickly.

### Do Not

- Introduce a new primary color family that competes with purple/yellow.
- Replace Inter with another default font.
- Mix multiple button visual systems in the same screen.
- Add overly aggressive animations that reduce readability.
- Make dashboard screens as decorative as the Landing Page.
- Assume a dashboard should use the same amount of motion or glow as the guest experience.

## 17) Quick Copy Recipes

### Main dark hero/footer background

- bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950

### Main primary button

- px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-purple-950 rounded-full font-black shadow-xl hover:shadow-2xl hover:scale-105 transition-all

### Standard feature card shell

- bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all

### Standard icon tile

- w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg rotate-6 group-hover:rotate-12 transition-transform

### Dashboard shell

- min-h-[100dvh] w-full overflow-hidden bg-[var(--background)]

### Fixed dashboard sidebar

- fixed inset-y-0 left-0 w-64 bg-[rgba(20,15,38,0.88)] border-r border-[var(--border)] backdrop-blur-xl

### Dashboard content rail

- ml-64 flex min-h-[100dvh] min-w-0 flex-col overflow-hidden
