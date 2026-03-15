export interface ThemeColors {
  "--bg-primary": string;
  "--bg-secondary": string;
  "--bg-tertiary": string;
  "--accent-primary": string;
  "--accent-secondary": string;
  "--text-primary": string;
  "--text-secondary": string;
  "--border-primary": string;
  "--border-secondary": string;
  "--btn-bg": string;
  "--btn-shadow-light": string;
  "--btn-shadow-dark": string;
  "--btn-text": string;
  "--focus-outline": string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const THEMES: Theme[] = [
  {
    id: "emerald",
    name: "Emerald (Default)",
    colors: {
      "--bg-primary": "#0c0a09",
      "--bg-secondary": "#1c1917",
      "--bg-tertiary": "#292524",
      "--accent-primary": "#55FF55",
      "--accent-secondary": "#00AA00",
      "--text-primary": "#ffffff",
      "--text-secondary": "#d0d0d0",
      "--border-primary": "#000000",
      "--border-secondary": "#555555",
      "--btn-bg": "#bebebe",
      "--btn-shadow-light": "#ffffff",
      "--btn-shadow-dark": "#555555",
      "--btn-text": "#3e3e3e",
      "--focus-outline": "#55FF55",
    },
  },
  {
    id: "classic",
    name: "Classic Legacy",
    colors: {
      "--bg-primary": "#4e4e4e",
      "--bg-secondary": "#2a2a2a",
      "--bg-tertiary": "#3a3a3a",
      "--accent-primary": "#ffffff",
      "--accent-secondary": "#bebebe",
      "--text-primary": "#ffffff",
      "--text-secondary": "#aaaaaa",
      "--border-primary": "#000000",
      "--border-secondary": "#555555",
      "--btn-bg": "#bebebe",
      "--btn-shadow-light": "#ffffff",
      "--btn-shadow-dark": "#555555",
      "--btn-text": "#3e3e3e",
      "--focus-outline": "#ffffff",
    },
  },
  {
    id: "dark",
    name: "Midnight",
    colors: {
      "--bg-primary": "#000000",
      "--bg-secondary": "#111111",
      "--bg-tertiary": "#222222",
      "--accent-primary": "#777777",
      "--accent-secondary": "#444444",
      "--text-primary": "#ffffff",
      "--text-secondary": "#888888",
      "--border-primary": "#333333",
      "--border-secondary": "#111111",
      "--btn-bg": "#222222",
      "--btn-shadow-light": "#444444",
      "--btn-shadow-dark": "#000000",
      "--btn-text": "#ffffff",
      "--focus-outline": "#777777",
    },
  },
  {
    id: "high_contrast",
    name: "High Contrast",
    colors: {
      "--bg-primary": "#000000",
      "--bg-secondary": "#000000",
      "--bg-tertiary": "#000000",
      "--accent-primary": "#ffffff",
      "--accent-secondary": "#ffffff",
      "--text-primary": "#ffffff",
      "--text-secondary": "#ffffff",
      "--border-primary": "#ffffff",
      "--border-secondary": "#ffffff",
      "--btn-bg": "#000000",
      "--btn-shadow-light": "#ffffff",
      "--btn-shadow-dark": "#ffffff",
      "--btn-text": "#ffffff",
      "--focus-outline": "#ffffff",
    },
  },
];
