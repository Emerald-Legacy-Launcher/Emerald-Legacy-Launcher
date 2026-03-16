import { McServer } from "@/types/index";

export const PARTNER_SERVERS: McServer[] = [
  {
    name: "Kowhaifans Clubhouse",
    ip: "kowhaifan.ddns.net",
    port: 25565
  }
];

export interface GameVersion {
  id: string;
  name: string;
  desc: string;
  url: string;
  isComingSoon?: boolean;
}

export const GAME_VERSIONS: GameVersion[] = [
  {
    id: "vanilla_tu19",
    name: "Vanilla Nightly (TU19)",
    desc: "Leaked 4J Studios build. (smartcmd)",
    url: "https://github.com/smartcmd/MinecraftConsoles/releases/download/nightly/LCEWindows64.zip"
  },
  {
    id: "vanilla_tu24",
    name: "Vanilla TU24",
    desc: "Horses and Wither update.",
    url: "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu24_vanilla.zip",
  },
  {
    id: "legacy_evolved",
    name: "Legacy Evolved",
    desc: "Backporting the newer title updates back to the Minecraft: Legacy Console Edition Source Code Leak",
    url: "https://github.com/piebotc/LegacyEvolved/releases/download/nightly/LCEWindows64.zip"
  },
  {
    id: "vanilla_tu75",
    name: "Vanilla TU75",
    desc: "Legacy version.",
    url: "#",
    isComingSoon: true
  },
  {
    id: "vanilla_tu9",
    name: "Vanilla TU9",
    desc: "Legacy version.",
    url: "#",
    isComingSoon: true
  },
  {
    id: "modded_pack",
    name: "Legacy Modded Pack",
    desc: "Legacy version.",
    url: "#",
    isComingSoon: true
  }
];

export const getVersionById = (id: string) => GAME_VERSIONS.find(v => v.id === id);
