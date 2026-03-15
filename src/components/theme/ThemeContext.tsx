import React, { createContext, useContext, useEffect, useState } from "react";
import { THEME_STYLES, THEME_PALETTES, ThemeStyle, ThemePalette } from "../../types/theme";
import { TauriService } from "../../services/tauri";

interface ThemeContextType {
  currentStyle: ThemeStyle;
  currentPalette: ThemePalette;
  availablePalettes: ThemePalette[];
  setStyle: (styleId: string) => void;
  setPalette: (paletteId: string) => void;
  refreshPalettes: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [styleId, setStyleId] = useState(localStorage.getItem("themeStyleId") || "legacy");
  const [paletteId, setPaletteId] = useState(localStorage.getItem("themePaletteId") || "emerald");
  const [externalPalettes, setExternalPalettes] = useState<ThemePalette[]>([]);

  const availablePalettes = [...THEME_PALETTES, ...externalPalettes];

  const currentStyle = THEME_STYLES.find((s) => s.id === styleId) || THEME_STYLES[0];
  const currentPalette = availablePalettes.find((p) => p.id === paletteId) || THEME_PALETTES[0];

  const refreshPalettes = async () => {
    try {
      const external = await TauriService.getExternalPalettes();
      setExternalPalettes(external);
    } catch (e) {
      console.error("Failed to load external themes", e);
    }
  };

  useEffect(() => {
    refreshPalettes();
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    // Apply Palette Colors
    Object.entries(currentPalette.colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply Style Properties
    Object.entries(currentStyle.properties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    localStorage.setItem("themeStyleId", styleId);
    localStorage.setItem("themePaletteId", paletteId);
  }, [currentStyle, currentPalette, styleId, paletteId]);

  const setStyle = (id: string) => {
    if (THEME_STYLES.some((s) => s.id === id)) {
      setStyleId(id);
    }
  };

  const setPalette = (id: string) => {
    if (availablePalettes.some((p) => p.id === id)) {
      setPaletteId(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentStyle, currentPalette, availablePalettes, setStyle, setPalette, refreshPalettes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
