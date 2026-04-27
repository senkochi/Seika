# Seika Frontend Style Guide

This document defines the current visual and component conventions used in the Seika web frontend.
Use it as a single source of truth for collaboration so new UI work stays consistent.

## 1) Design Intent

- Brand mood: playful, energetic, gamified learning platform.
- Visual direction: bold purple base with warm yellow/amber accents.
- Core contrast pattern: dark gradient backgrounds + bright highlight actions.
- UI tone: rounded, soft, friendly, and high-contrast.

## 2) Tech and UI Stack

- Framework: React + TypeScript + Vite.
- Styling: Tailwind CSS v4 utility-first.
- Motion helpers: tw-animate-css + Tailwind animation utilities.
- Icon system: lucide-react.
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

- Base page background default from src/index.css: white.
- Neutral content text on light cards: gray-700.
- Light card surfaces: white/95 with backdrop blur in feature cards.

## 5) Gradient Recipes

Use these exact recipes as the default style language.

### Dark Brand Background

- bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950
- Used in hero and footer sections.

### Gold Feature Section Background

- bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-500
- Used in features section.

### Primary CTA Gradient

- bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500
- Used for Register/Get Started style buttons.

### Purple Feature Card Gradient

- bg-gradient-to-br from-purple-900 to-purple-800
- Used for high-emphasis feature cards.

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

### Do Not

- Introduce a new primary color family that competes with purple/yellow.
- Replace Inter with another default font.
- Mix multiple button visual systems in the same screen.
- Add overly aggressive animations that reduce readability.

## 17) Quick Copy Recipes

### Main dark hero/footer background

- bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950

### Main primary button

- px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-purple-950 rounded-full font-black shadow-xl hover:shadow-2xl hover:scale-105 transition-all

### Standard feature card shell

- bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all

### Standard icon tile

- w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg rotate-6 group-hover:rotate-12 transition-transform
