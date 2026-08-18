/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Notion-inspired paper canvas with one structural blue accent.
    text: '#000000',
    tint: '#0075de',

    // Core surfaces
    background: '#f6f5f4',
    foreground: '#000000',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#000000',

    // Primary action color (buttons, links, active states)
    primary: '#0075de',
    primaryActive: '#005bab',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#213183',
    secondaryForeground: '#ffffff',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#f6f5f4',
    mutedForeground: '#615d59',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#62aef0',
    accentForeground: '#000000',

    // Destructive actions (delete, error states)
    destructive: '#dd5b00',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e6e6e6',
    input: '#e6e6e6',

    success: '#1aae39',
    successSoft: '#e8f7ea',
    warning: '#dd5b00',
    warningSoft: '#fff1e8',
    navySoft: '#e7efff',
    inkSoft: '#31302e',
    inkFaint: '#a39e98',
    accentPurpleDeep: '#391c57',
    white: '#ffffff',
    purple: '#d6b6f6',
    teal: '#2a9d99',
    pink: '#ff64c8',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 12,
};

export default colors;
