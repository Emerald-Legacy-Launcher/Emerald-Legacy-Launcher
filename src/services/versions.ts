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
    desc: "Leaked 4J Studios build.",
    url: "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu19_vanilla.zip"
  },
  {
    id: "vanilla_tu24",
    name: "Vanilla TU24",
    desc: "Horses and Wither update.",
    url: "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu24_vanilla.zip",
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
