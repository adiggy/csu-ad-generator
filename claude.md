# CSU Social Media Asset Generator

## Overview

A browser-based design tool for Colorado State University's Inclusive Excellence and Student Success office to create on-brand social media promotional graphics for the "Find Your Energy" campaign.

## Tech Stack

- **HTML5/CSS3/Vanilla JavaScript** - No frameworks, pure static site
- **html2canvas v1.4.1** (CDN) - DOM-to-image export
- **Vercel** - Deployment platform with serverless functions
- **Neon PostgreSQL** - Serverless database for feedback storage

### Fonts
- DM Sans - UI typography
- Montserrat - Template headlines
- Open Sans - Body text

## Project Structure

```
csu-ad-generator/
├── index.html          # Main app interface
├── script.js           # Application logic (IIFE pattern)
├── styles.css          # Design system with CSS custom properties
├── schema.sql          # Database schema for feedback table
├── api/
│   └── feedback.js     # Vercel serverless function for feedback submissions
├── assets/             # Sample images
└── brand-guidelines/   # CSU branding assets
    ├── logos/          # White and color logo variants (no padding)
    └── textures/       # Photocopy texture, energy bars image
```

## Running Locally

```bash
npm install
npm start        # http://localhost:3000
```

Note: Feedback form submissions require `DATABASE_URL` environment variable to be set.

## Key Features

### Platform Options
- Instagram Post: 1080x1080px
- Twitter Card: 1600x900px

### Template Styles
- **Green Background** - Solid green content area with photo above, date badge straddles boundary
- **Energy Bars** - Uses energy-bars.jpg image asset; Instagram: horizontal bars below photo; Twitter: vertical bars rotated 90°

### Photo Effects
- None
- Photocopy Texture (uses CSU_FindYourEnergy_PhotocopyTexture_RGB.jpg)
- Green Duotone (grayscale + CSU green hard-light blend)
- Halftone (dot pattern overlay)

### Content Fields
- Headline (60 char limit)
- Sub-Headline (120 char limit)
- Date & Time (toggleable)
- Shortlink/CTA

### Photo Controls
- Drag-to-pan positioning
- Zoom slider (50%-200%, 100% = cover)
- Image quality warnings for low resolution

### Preview Controls
- Zoom slider to preview at different sizes
- Orange notch marks 100% (actual pixel size)

### Feedback Form
- Floating chat button in lower right corner
- Captures: feedback type, description, email (optional)
- Auto-captures: browser, OS, screen size, window size, current settings
- Stores submissions in Neon PostgreSQL database

## CSU Brand Colors

```css
--csu-green: #1E4D2B;      /* Primary */
--csu-lime: #C5E026;
--csu-orange: #E8734A;
--csu-purple: #8B6A96;
--csu-gold: #F9B233;
--csu-burnt-orange: #D2691E;
--csu-sage: #C8C372;
```

## Typography Guidelines for Social Media

**CRITICAL: Always design for actual export size, not the scaled preview.**

Social media images are viewed at reduced sizes:
- Instagram (1080x1080) → typically viewed at ~320-400px on mobile (3x reduction)
- Twitter (1600x900) → typically viewed at ~500-600px in feed (2.5-3x reduction)

### Minimum Font Sizes (at export resolution)

| Element | Instagram (1080px) | Twitter (1600px) |
|---------|-------------------|------------------|
| Headline | 100-120px | 70-80px |
| Subheadline | 40-50px | 32-38px |
| Date badge | 24-32px | 20-26px |
| CTA/URL | 32-40px | 28-34px |
| Logo height | 100-130px | 90-110px |

### Current Implementation Sizes

**Instagram Green Background:**
- Headline: 115px
- Subheadline: 44px
- Date: 28px
- CTA: 36px
- Logo: 120px

**Instagram Energy Bars:**
- Headline: 88px
- Subheadline: 36px
- Date: 22px (stacks to 2 lines)
- CTA: 32px
- Logo: 95px

**Twitter Green Background:**
- Headline: 76px
- Subheadline: 34px
- Date: 22px
- CTA: 32px
- Logo: 105px

**Twitter Energy Bars:**
- Headline: 64px
- Subheadline: 30px
- Date: 20px
- CTA: 28px
- Logo: 85px

### Visual Hierarchy (in order of prominence)
1. **Headline** - Most prominent, bold, uppercase
2. **Subheadline** - Secondary, regular weight
3. **Date/Time** - Tertiary, badge format, should NOT compete with headline
4. **CTA/URL** - Call to action, prominent but not dominant
5. **Logo** - Branding, consistent size

### Testing Typography Changes

When modifying font sizes:
1. Export at actual size (not preview scale)
2. View in image editor at 100% zoom
3. Simulate mobile viewing by scaling to ~33% (Instagram) or ~35% (Twitter)
4. Text should remain readable at simulated viewing size

## Accessibility Reference

Refer to `brand-guidelines/CSU-Color-Accessibility-Chart.jpg` for WCAG-compliant color pairings.

### Key Accessible Combinations (from chart)
| Background | Accessible Text Colors |
|------------|------------------------|
| CSU Green (#1E4D2B) | White (AAA), Energy Green (AAA), Sunshine (AA), Primary Gold (AA) |
| White | Black (AAA), Primary Green (AAA), Stalwart Slate (AAA), Oval Green (AAA) |
| Energy Green (#C5E026) | Black (AAA), Primary Green (AA), Oval Green (AA) |
| Black | White (AAA), Energy Green (AAA), Aggie Orange (AA) |

### Implementation Notes
- Date badges use Energy Green background with Black text (AAA compliant)
- Avoid using orange text directly on white backgrounds (fails AA)
- When adding colored text, always verify against the accessibility chart

## Architecture Notes

### General
- Photos stored as base64 in memory
- Logos/textures preloaded as base64 for reliable export
- Desktop-only (shows message on mobile screens)
- Two-column layout: Controls (left) + Preview (right)
- Green Background template uses flexbox for dynamic content sizing
- Energy Bars template uses absolute positioning for split layout

### Floating Date Badge (Green Background Template)
The date badge straddles the boundary between photo and content areas. To prevent photo effects (which use `mix-blend-mode`) from affecting it:
- A separate `floating-date` element is positioned as a direct child of the template
- JavaScript calculates its position based on template-overlay location, accounting for preview scale
- During export, the date badge is hidden, effects applied, then date badge composited on top

### Photo Effects Export
CSS effects (`mix-blend-mode`, filters) don't export reliably with html2canvas. The export process:
1. Removes CSS effect classes before capture
2. Captures clean template with html2canvas
3. Applies effects manually via canvas operations (grayscale, blend modes, dot patterns)
4. Composites date badge on top (for gradient template)
5. Effects are clipped to photo area only using `getPhotoAreaDimensions()`

### Feedback System
- Frontend posts to `/api/feedback` serverless function
- Neon PostgreSQL stores submissions with system info
- Environment variable `DATABASE_URL` required in Vercel

## Development Guidelines

- Maintain WCAG AA contrast compliance
- Keep the app lightweight and dependency-minimal
- All state managed in JavaScript variables (no external state management)
- Preview auto-scales based on available screen space
- **Always test typography at actual export size, not preview size**
- **Always test exports (downloads), not just preview** - effects render differently
- Logo files have no built-in padding - size them directly

## Adding New Platforms/Sizes

When adding new social media platforms:

1. Add platform config in `script.js` under `config.platforms`
2. Add CSS class for dimensions (e.g., `.template.newplatform { width: Xpx; height: Ypx; }`)
3. Calculate appropriate typography sizes:
   - Determine typical viewing size on that platform
   - Calculate reduction ratio (export size ÷ viewing size)
   - Scale font sizes so they appear 12-16px minimum when viewed
4. Test at actual export size before finalizing

## Adding New Photo Effects

When adding new photo effects:

1. Add option to `#effect-select` dropdown in HTML
2. Add CSS class for preview (`.template.effect-neweffect`)
3. Add canvas-based implementation in `script.js` for export
4. Ensure effect is clipped to photo area only (use `getPhotoAreaDimensions()`)
5. Test both preview AND exported image
