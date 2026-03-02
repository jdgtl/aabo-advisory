/** Design tokens extracted from JSX prototypes — canonical source of truth */

export const colors = {
  primary: "#0F1B2D",
  secondary: "#1A2D47",
  text: "#1A1A1A",
  accent: "#B8965A",
  accentLight: "#D4B87A",
  warm: "#C8B89A",
  mid: "#E8DFD0",
  light: "#F5F0E8",
  canvas: "#FAF8F5",
  green: "#4A7C59",
  red: "#8B3A3A",
} as const;

export const fonts = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', sans-serif",
} as const;

export const site = {
  name: "AABO Advisory",
  tagline: "Diplomatic Real Estate Advisory",
  url: "https://aaboadvisory.com",
} as const;
