export interface Runner {
  id: string;
  name: string;
  path: string;
  type: string;
}

export interface SkinLibraryItem {
  id: string;
  name: string;
  skinBase64: string;
}

import { ThemePalette } from "./theme";

export interface AppConfig {
  username: string;
  linuxRunner?: string;
  showClickParticles?: boolean;
  skinBase64?: string;
  skinLibrary?: SkinLibraryItem[];
  themeStyleId?: string;
  themePaletteId?: string;
}

export type { ThemePalette };

export interface InstalledStatus {
  [key: string]: boolean;
}

export interface ReinstallModalData {
  id: string;
  url: string;
}

export interface McNotification {
  t: string;
  m: string;
}
