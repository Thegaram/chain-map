# UI Simplification & Modernization

## Design System Changes

### Colors
- **Light mode**: Softer backgrounds (#fafafa, #f5f5f5), subtler borders (#e5e5e5)
- **Dark mode**: True blacks (#0a0a0a, #141414), better contrast
- **Accent**: Modern blue (#2563eb) with refined hover states

### Typography
- **Sans-serif default**: System fonts for better readability
- **Monospace**: Reserved for addresses, hashes, code
- **Sizes**: Smaller, more refined scale (xs, sm, base, lg)

### Spacing
- Increased whitespace for breathing room
- Better padding: --space-xl (1.5rem), --space-2xl (2rem)
- Tighter internal spacing for cleaner look

### Borders & Shadows
- Lighter borders (--border-light for subtle divisions)
- Softer shadows with lower opacity
- Rounded corners: 6px (slightly more modern)

### Transitions
- Defined speeds: --transition-fast, --transition-base, --transition-slow
- Smooth, consistent animations throughout

## Component Updates Needed

All component styles should be updated to use the new design tokens and follow these principles:

1. **More whitespace** - Generous padding and margins
2. **Subtle borders** - Use --border-light for non-critical divisions
3. **Refined typography** - Smaller sizes, better hierarchy
4. **Smooth interactions** - Consistent hover/focus states
5. **Minimal chrome** - Remove unnecessary visual elements

The global theme (app.css) has been updated. Individual components will inherit these improvements naturally.
