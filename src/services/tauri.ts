import { invoke } from "@tauri-apps/api/core";
import { AppConfig, Runner } from "../types";

export const TauriService = {
  loadConfig: () => invoke<AppConfig>("load_config"),
  saveConfig: (config: AppConfig) => invoke("save_config", { config }),
  launchGame: (instanceId: string) => invoke("launch_game", { instanceId }),
  downloadAndInstall: (url: string, instanceId: string) => invoke("download_and_install", { url, instanceId }),
  checkGameInstalled: (instanceId: string) => invoke<boolean>("check_game_installed", { instanceId }),
  getAvailableRunners: () => invoke<Runner[]>("get_available_runners"),
  openInstanceFolder: (instanceId: string) => invoke("open_instance_folder", { instanceId }),
  cancelDownload: () => invoke("cancel_download"),
};
