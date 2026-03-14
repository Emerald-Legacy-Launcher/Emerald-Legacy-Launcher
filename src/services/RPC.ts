import { setActivity, start } from "tauri-plugin-drpc";
import { Activity, ActivityType } from "tauri-plugin-drpc/activity";

class RPC {
  private startTime: number = Date.now();
  private initializationPromise: Promise<void> | null = null;
  private initialized: boolean = false;

  public async StartRPC() {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        await start("1482504445152460871");
        this.initialized = true;
      } catch (e) {
        console.error("Failed to start RPC:", e);
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  public async updateActivity(details: string, state: string, isPlaying: boolean = false) {
    if (!this.initialized) {
      await this.StartRPC();
      if (!this.initialized) return;
    }

    const activityPayload = {
      details,
      state,
      type: ActivityType.Playing,
      activity_type: ActivityType.Playing,
      assets: {
        large_image: "logo",
        large_text: "Emerald Legacy",
        small_image: "app-icon",
        small_text: isPlaying ? "Playing" : "In Menus"
      },
      timestamps: {
        start: this.startTime
      },
      buttons: [
        { label: "Discord", url: "https://discord.gg/RHGRUwpmVc" },
        { label: "GitHub", url: "https://github.com/Emerald-Legacy-Launcher/Emerald-Legacy-Launcher" }
      ]
    };

    try {
      await setActivity({
        toString: () => JSON.stringify(activityPayload)
      } as any);
    } catch (e) {
      console.error("Failed to set RPC activity:", e);
    }
  }
}

export default new RPC();