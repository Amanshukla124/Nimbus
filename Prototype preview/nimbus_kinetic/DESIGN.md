# Design System Specification: Atmospheric Intelligence

## 1. Overview & Creative North Star
**Creative North Star: "The Celestial Observer"**

This design system moves away from the static, boxy constraints of traditional SaaS platforms to embrace the fluid, expansive nature of flight. We are not building a dashboard; we are crafting a cockpit view from the edge of the atmosphere. 

To achieve a "High-End Editorial" feel, the layout must embrace **intentional asymmetry** and **tonal depth**. Elements should appear as if they are floating in a vacuum, layered through light and refraction rather than physical dividers. By leveraging a high-contrast typography scale (Space Grotesk for impact, Inter for utility), we create an authoritative yet futuristic reading experience that feels custom-tailored for elite intelligence.

---

## 2. Colors & Atmospheric Layering
Our palette is rooted in the deep void of high-altitude flight, using vibrant purples and blues to represent data energy.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Boundaries are defined solely through background color shifts or subtle tonal transitions. Use `surface_container_low` against `surface` to create natural compartmentalization.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of frosted glass.
- **Base Layer:** `surface` (#0b0e14)
- **Primary Content Areas:** `surface_container_low` (#10131a)
- **Nested Components:** `surface_container_high` (#1c2028)
- **Active/Hover States:** `surface_bright` (#282c36)

### The "Glass & Gradient" Rule
Floating elements (Modals, Popovers, Navigation) must utilize Glassmorphism.
- **Effect:** `surface_container_lowest` at 60% opacity + `backdrop-blur: 20px`.
- **Gradients:** Use `primary` (#97a9ff) to `secondary` (#b884ff) for CTAs and data highlights to provide a "soul" that flat colors cannot mimic.

---

## 3. Typography
The typography system balances the technical precision of a flight manifest with the bold editorial style of a luxury tech journal.

- **Display (Space Grotesk):** Large, aggressive scales (`display-lg`: 3.5rem) used for hero metrics or flight statuses. Use tight letter-spacing (-0.02em) to maintain a "machined" look.
- **Headlines (Space Grotesk):** Used for section titles. These provide the "Brutalist" anchor to the otherwise soft, glass-filled layout.
- **Body (Inter):** The workhorse for all data. Optimized for legibility at small sizes (`body-sm`: 0.75rem).
- **Labels (Inter):** All-caps with increased letter-spacing (+0.05em) for a high-tech, navigational aesthetic.

---

## 4. Elevation & Depth
In this system, "Up" is defined by light and transparency, not shadows.

### The Layering Principle
Depth is achieved by stacking surface tokens. For example, a `surface_container_highest` card sitting on a `surface_container_low` background creates a soft, natural lift.

### Ambient Shadows
Shadows are rarely used. When required for extreme focus (e.g., a critical alert popover), use:
- **Color:** A tinted version of `on_surface` (deep blue-tinted shadow).
- **Style:** `blur: 40px`, `spread: -10px`, `opacity: 8%`. 

### The "Ghost Border" Fallback
If accessibility requires a border, use a **Ghost Border**:
- **Token:** `outline_variant` at 15% opacity.
- **Constraint:** Never use 100% opaque borders for containers.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `secondary`). No border. `rounded-md` (0.375rem). Use a subtle `primary_dim` outer glow on hover.
- **Secondary:** Glass-filled (`surface_variant` at 40% opacity) with a `Ghost Border`.
- **Tertiary:** Text only, using `primary_fixed` color with an underline that appears on hover via a smooth 300ms transition.

### Cards & Lists
**Forbid the use of divider lines.** 
- Separate list items using vertical white space (16px - 24px).
- For cards, use a `surface_container_low` background and a `primary` top-accent glow (1px height) to denote priority.

### Flight Telemetry Chips
- **Selection:** `surface_container_highest` background with a `primary` 2px left-side "indicator" bar.
- **Status:** Use `tertiary` (#8ff5ff) for "On Time" and `error` (#ff6e84) for "Delayed," applied as a subtle text glow.

### Input Fields
- **Default:** `surface_container_lowest` background, `Ghost Border`.
- **Active:** Border transitions to `primary` at 50% opacity with a soft `primary_container` inner shadow to simulate depth.

### Signature Component: The "Horizon Gauge"
A custom real-time data visualization component using a semi-circular gradient stroke (`primary` to `tertiary`) with a `backdrop-blur` center, used for displaying altitude or fuel intelligence.

---

## 6. Do’s and Don’ts

### Do
- **DO** use overlapping elements. A glass card should slightly overlap a background map or image to showcase the blur effect.
- **DO** use asymmetric margins. For example, a wider left margin for headlines to create an editorial flow.
- **DO** use `tertiary` (#8ff5ff) as a "high-tech" accent for data points like coordinates or timestamps.

### Don't
- **DON'T** use pure black (#000000) for backgrounds. Stick to the deep blue-ink of `surface` (#0b0e14).
- **DON'T** use 1px solid white borders. It breaks the "Atmospheric" illusion and feels like a generic template.
- **DON'T** use standard easing. All transitions must be `cubic-bezier(0.22, 1, 0.36, 1)` (Quintic) for a "smooth-glide" feel.

---

## 7. Spacing & Rhythm
The system relies on a strict **8px grid**, but with **loose implementation**. Use large "breathing rooms" (64px, 80px, 96px) between major sections to ensure the platform feels premium and unhurried, despite the high-velocity nature of flight data.