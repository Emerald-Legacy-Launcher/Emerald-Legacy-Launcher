export interface Runner {
  id: string;
  name: string;
  path: string;
  type: string;
}

export interface AppConfig {
  username: string;
  linuxRunner?: string;
  showClickParticles?: boolean;
}

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
