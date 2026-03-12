import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useState, useEffect, useRef } from "react";
import "./App.css";

const Icons = {
  Discord: () => <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M6 6h20v4h2v12h-2v4h-4v-4h-8v4H6v-4H4V10h2V6zm4 6v4h4v-4h-4zm8 0v4h4v-4h-4z" /></svg>,
  Github: () => <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M12 4h8v4h4v4h4v8h-4v4h-4v4h-8v-4H8v-4H4v-8h4V8h4V4zm2 8v4h4v-4h-4z" /></svg>,
  Reddit: () => <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M10 4h12v4h4v4h2v12h-2v4H10v-4H4V12h2V8h4V4zm2 10v4h8v-4h-8z" /></svg>,
  Volume: ({ level }: { level: number }) => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M4 12h8l8-8v24l-8-8H4v-8z" />{level > 0 && <path d="M24 12h2v8h-2z" />}{level > 0.5 && <path d="M28 8h2v16h-2z" />}</svg>
  ),
  Linux: () => <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M16 4c-3.3 0-6 2.7-6 6 0 1.2.4 2.3 1 3.2C8.7 15.1 7 18.3 7 22h2c0-3.9 3.1-7 7-7s7 3.1 7 7h2c0-3.7-1.7-6.9-4-8.8.6-.9 1-2 1-3.2 0-3.3-2.7-6-6-6zm0 2c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4z" /></svg>
};

interface Runner {
  id: string;
  name: string;
  path: string;
  type: string;
}

interface AppConfig {
  username: string;
  linuxRunner?: string;
}

let audioCtx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
const buffers: Record<string, AudioBuffer> = {};

export default function App() {
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [installingInstance, setInstallingInstance] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [installedStatus, setInstalledStatus] = useState<Record<string, boolean>>({ vanilla_tu19: false, vanilla_tu24: false });
  const [selectedInstance, setSelectedInstance] = useState<string>("vanilla_tu19");
  const [reinstallModal, setReinstallModal] = useState<{ id: string, url: string } | null>(null);
  const [mcNotif, setMcNotif] = useState<{ t: string, m: string } | null>(null);
  const [availableRunners, setAvailableRunners] = useState<Runner[]>([]);
  const [selectedRunner, setSelectedRunner] = useState<string>("");
  const [isLinux, setIsLinux] = useState(false);

  const [musicVol, setMusicVol] = useState(parseFloat(localStorage.getItem("musicVol") || "0.4"));
  const [sfxVol, setSfxVol] = useState(parseFloat(localStorage.getItem("sfxVol") || "0.7"));
  const [isMuted, setIsMuted] = useState(localStorage.getItem("isMuted") === "true");

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const lastTrack = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem("musicVol", musicVol.toString());
    localStorage.setItem("sfxVol", sfxVol.toString());
    localStorage.setItem("isMuted", isMuted.toString());
    if (musicRef.current) musicRef.current.volume = isMuted ? 0 : musicVol;
  }, [musicVol, sfxVol, isMuted]);

  const ensureAudio = async () => {
    let currentCtx = audioCtx;
    if (!currentCtx) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const newCtx = new AC() as AudioContext;
      const newGain = newCtx.createGain();
      newGain.connect(newCtx.destination);
      audioCtx = newCtx; sfxGain = newGain; currentCtx = newCtx;
      const sounds = ['click.wav', 'orb.ogg', 'levelup.ogg', 'back.ogg', 'pop.wav', 'wood click.wav'];
      sounds.forEach(s => {
        fetch(`/sounds/${s}`).then(r => r.arrayBuffer()).then(b => newCtx.decodeAudioData(b)).then(buf => { if (buf) buffers[s] = buf; });
      });
    }
    if (currentCtx.state === 'suspended') await currentCtx.resume();
  };

  const playSfx = async (n: string, multiplier: number = 1.0) => {
    await ensureAudio();
    const currentCtx = audioCtx;
    const currentGain = sfxGain;
    if (!currentCtx || !currentGain || !buffers[n] || isMuted) return;
    const s = currentCtx.createBufferSource();
    s.buffer = buffers[n];
    const g = currentCtx.createGain();
    g.gain.value = sfxVol * multiplier;
    s.connect(g); g.connect(currentCtx.destination);
    s.start(0);
  };

  const playRandomMusic = () => {
    if (!musicRef.current) return;
    let track = Math.floor(Math.random() * 5) + 1;
    if (track === lastTrack.current) track = (track % 5) + 1;
    lastTrack.current = track;
    musicRef.current.src = `/music/music${track}.ogg`;
    musicRef.current.volume = isMuted ? 0 : musicVol;
    musicRef.current.play().catch(() => { });
  };

  const fadeAndLaunch = async () => {
    playSfx('levelup.ogg', 0.4);
    setIsRunning(true);
    if (musicRef.current && !isMuted) {
      const startVol = musicRef.current.volume;
      const steps = 20;
      let currentStep = 0;
      const fade = setInterval(() => {
        currentStep++;
        if (musicRef.current) musicRef.current.volume = Math.max(0, startVol * (1 - currentStep / steps));
        if (currentStep >= steps) { clearInterval(fade); if (musicRef.current) musicRef.current.pause(); }
      }, 50);
    }
    setTimeout(async () => {
      try {
        await invoke("launch_game", { instanceId: selectedInstance });
      } catch (e) {
        alert(`Failed to launch game: ${e}`);
      } finally {
        setIsRunning(false);
        if (musicRef.current) {
          musicRef.current.volume = isMuted ? 0 : musicVol;
          playRandomMusic();
        }
      }
    }, 1500);
  };

  const executeInstall = async (id: string, url: string) => {
    setInstallingInstance(id); setDownloadProgress(0);
    try {
      await invoke("download_and_install", { url, instanceId: id });
      setMcNotif({ t: "Success!", m: "Ready to play." }); playSfx('orb.ogg');
      setTimeout(() => setMcNotif(null), 4000);
      updateAllStatus();
    } catch (e) {
      console.error(e);
      alert("Error during installation: " + e);
    }
    setInstallingInstance(null);
  };

  const updateAllStatus = async () => {
    const v19 = await invoke<boolean>("check_game_installed", { instanceId: "vanilla_tu19" });
    const v24 = await invoke<boolean>("check_game_installed", { instanceId: "vanilla_tu24" });
    setInstalledStatus({ vanilla_tu19: v19, vanilla_tu24: v24 });
  };

  useEffect(() => {
    invoke("load_config").then((c) => {
      const config = c as AppConfig;
      if (config.username && config.username.trim() !== "") {
        setUsername(config.username);
        setIsFirstRun(false);
        setTimeout(playRandomMusic, 1000);
      }
      if (config.linuxRunner) setSelectedRunner(config.linuxRunner);
    });

    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes("linux")) {
      setIsLinux(true);
      invoke<Runner[]>("get_available_runners").then(runners => {
        setAvailableRunners(runners);
      });
    }

    updateAllStatus();
    const unlisten = listen<number>("download-progress", (e) => setDownloadProgress(Math.round(e.payload)));
    return () => { unlisten.then(f => f()); };
  }, []);

  if (isFirstRun) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white p-12 select-none" onContextMenu={e => e.preventDefault()}>
        <img src="/images/MenuTitle.png" className="w-[500px] mb-12" />
        <div className="bg-[#2a2a2a] p-10 border-4 border-black w-full max-w-2xl text-center shadow-[inset_4px_4px_#555,inset_-4px_-4px_#111]">
          <h2 className="text-4xl text-emerald-400 mb-4">Welcome to Emerald Legacy!</h2>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black border-4 border-emerald-900 p-4 text-3xl text-center mb-8 outline-none" placeholder="Username..." />
          <button onClick={() => { ensureAudio(); playSfx('click.wav'); invoke("save_config", { config: { username, linuxRunner: isLinux ? selectedRunner : undefined } }); setIsFirstRun(false); setTimeout(playRandomMusic, 500); }} disabled={!username.trim() || (isLinux && availableRunners.length === 0)} className="legacy-btn py-4 px-12 text-3xl w-full">Start Setup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex select-none overflow-hidden bg-black text-white" onContextMenu={e => e.preventDefault()}>
      <audio ref={musicRef} onEnded={playRandomMusic} />
      <aside className="w-64 bg-[#2a2a2a] border-r-4 border-black p-6 flex flex-col gap-2 z-20 shadow-[inset_-4px_0_#555]">
        <div className="mb-10 px-2">
          <img src="/images/logo.png" />
        </div>
        <nav className="flex flex-col gap-3">
          <button onClick={() => { playSfx('click.wav'); setActiveTab("home"); updateAllStatus(); }} className={`p-4 legacy-btn justify-start ${activeTab === "home" ? "active-tab" : ""}`}>HOME</button>
          <button onClick={() => { playSfx('click.wav'); setActiveTab("versions"); updateAllStatus(); }} className={`p-4 legacy-btn justify-start ${activeTab === "versions" ? "active-tab" : ""}`}>VERSIONS</button>
          <button onClick={() => { playSfx('click.wav'); setActiveTab("settings"); }} className={`p-4 legacy-btn justify-start ${activeTab === "settings" ? "active-tab" : ""}`}>SETTINGS</button>
        </nav>

        {installingInstance && (
          <div className="sidebar-progress mt-auto">
            <div className="flex justify-between mb-3 text-slate-300 font-bold text-[10px] uppercase tracking-widest px-1">
              <span>Installing</span>
              <button onClick={() => { playSfx('back.ogg'); invoke("cancel_download"); }} className="text-red-500 hover:underline">CANCEL</button>
            </div>
            <div className="mc-progress-container">
              <div className="mc-progress-bar transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
              <div className="mc-progress-text">{downloadProgress}%</div>
            </div>
          </div>
        )}

        <div onClick={() => { playSfx('click.wav'); openUrl("https://github.com/KayJannOnGit"); }} className={`${installingInstance ? "pt-6" : "mt-auto pt-6"} flex flex-col items-center border-t-4 border-black/30 cursor-pointer group`}>
          <span className="text-slate-500 text-[10px] uppercase">Developed by</span>
          <span className="text-emerald-500 text-sm font-bold group-hover:underline">KayJann</span>
        </div>
      </aside>

      <main className="flex-1 relative h-full">
        <div className="h-full flex flex-col items-center justify-center p-12 relative z-10">
          {activeTab === "home" && (
            <div className="flex flex-col items-center text-center animate-in fade-in">
              <div className="relative mb-12 flex flex-col items-center">
                <img src="/images/MenuTitle.png" className="w-[550px]" />
                <div className="splash-text absolute bottom-2 -right-12 text-3xl">Welcome, {username}!</div>
              </div>
              <div className="bg-black/80 p-8 border-4 border-black w-[550px] flex flex-col gap-6 mt-12">
                {installedStatus.vanilla_tu19 || installedStatus.vanilla_tu24 ? (
                  <>
                    <select value={selectedInstance} onChange={e => { playSfx('click.wav'); setSelectedInstance(e.target.value); }} className="w-full legacy-select p-3 text-2xl outline-none">
                      {installedStatus.vanilla_tu19 && <option value="vanilla_tu19">Vanilla Nightly (TU19)</option>}
                      {installedStatus.vanilla_tu24 && <option value="vanilla_tu24">Vanilla TU24</option>}
                    </select>
                    <button onClick={fadeAndLaunch} disabled={isRunning || !!installingInstance} className="legacy-btn py-4 text-6xl w-full">{installingInstance ? "WAITING..." : isRunning ? "RUNNING..." : "PLAY"}</button>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-2xl text-red-400 mb-6 font-bold uppercase">Game not installed</p>
                    <button onClick={() => { playSfx('click.wav'); setActiveTab("versions"); }} className="legacy-btn py-4 px-8 text-3xl w-full">Go to Versions</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "versions" && (
            <div className="w-full max-w-3xl bg-black/80 p-12 border-4 border-black h-full overflow-y-auto no-scrollbar animate-in fade-in">
              <h2 className="text-5xl mb-8 border-b-4 border-white/20 pb-4">Instances</h2>
              <div className="flex flex-col gap-6">

                {/* TU19 */}
                <div className="flex justify-between items-center bg-[#2a2a2a] border-4 border-black p-6">
                  <div><h3 className="text-2xl font-bold">Vanilla Nightly (TU19)</h3><p className="text-slate-400 text-sm">Leaked 4J Studios build.</p></div>
                  <div className="flex gap-2">
                    {installedStatus.vanilla_tu19 ? (
                      <>
                        <button onClick={() => { playSfx('pop.wav'); invoke("open_instance_folder", { instanceId: "vanilla_tu19" }); }} className="legacy-btn px-4 py-2 text-xl">Folder</button>
                        <button onClick={() => { playSfx('click.wav'); setReinstallModal({ id: "vanilla_tu19", url: "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu19_vanilla.zip" }); }} disabled={!!installingInstance} className="legacy-btn px-4 py-2 text-xl reinstall-btn">Reinstall</button>
                      </>
                    ) : (
                      <button onClick={() => { playSfx('click.wav'); executeInstall("vanilla_tu19", "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu19_vanilla.zip"); }} disabled={!!installingInstance} className="legacy-btn px-6 py-2 text-xl">INSTALL</button>
                    )}
                  </div>
                </div>

                {/* TU24 */}
                <div className="flex justify-between items-center bg-[#2a2a2a] border-4 border-black p-6">
                  <div><h3 className="text-2xl font-bold">Vanilla TU24</h3><p className="text-slate-400 text-sm">Horses and Wither update.</p></div>
                  <div className="flex gap-2">
                    {installedStatus.vanilla_tu24 ? (
                      <>
                        <button onClick={() => { playSfx('pop.wav'); invoke("open_instance_folder", { instanceId: "vanilla_tu24" }); }} className="legacy-btn px-4 py-2 text-xl">Folder</button>
                        <button onClick={() => { playSfx('click.wav'); setReinstallModal({ id: "vanilla_tu24", url: "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu24_vanilla.zip" }); }} disabled={!!installingInstance} className="legacy-btn px-4 py-2 text-xl reinstall-btn">Reinstall</button>
                      </>
                    ) : (
                      <button onClick={() => { playSfx('click.wav'); executeInstall("vanilla_tu24", "https://huggingface.co/datasets/KayJann/emerald-legacy-assets/resolve/main/emerald_tu24_vanilla.zip"); }} disabled={!!installingInstance} className="legacy-btn px-6 py-2 text-xl">INSTALL</button>
                    )}
                  </div>
                </div>

                {['TU75', 'TU9', 'Modded Pack'].map(v => (
                  <div key={v} className="flex justify-between items-center bg-[#1a1a1a] border-4 border-black p-6 opacity-50 grayscale">
                    <div><h3 className="text-2xl font-bold text-slate-500">Vanilla {v}</h3><p className="text-slate-600 text-sm">Legacy version.</p></div>
                    <span className="text-[#ffff55] text-2xl font-bold italic">SOON</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="w-full max-w-3xl bg-black/80 p-12 border-4 border-black h-full overflow-y-auto no-scrollbar animate-in fade-in">
              <h2 className="text-5xl mb-8 border-b-4 border-white/20 pb-4">Settings</h2>
              <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-4">
                  <label className="text-xl text-slate-400 italic">In-game Username</label>
                  <div className="flex gap-4">
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="flex-1 bg-black border-4 border-slate-700 p-4 text-3xl outline-none focus:border-emerald-500" />
                    <button onClick={() => { playSfx('wood click.wav'); invoke("save_config", { config: { username, linuxRunner: selectedRunner || undefined } }); }} className="legacy-btn px-8 text-2xl relative">Save</button>
                  </div>
                </div>

                {isLinux && (
                  <div className="flex flex-col gap-4">
                    <label className="text-xl text-slate-400 italic flex items-center gap-2"><Icons.Linux /> Linux Runner</label>
                    <div className="flex flex-col gap-2">
                      <select
                        value={selectedRunner}
                        onChange={e => { playSfx('click.wav'); setSelectedRunner(e.target.value); }}
                        className="w-full legacy-select p-4 text-2xl outline-none focus:border-emerald-500"
                      >
                        <option value="" disabled>Select a runner...</option>
                        {availableRunners.map(r => (
                          <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                        ))}
                      </select>
                      {availableRunners.length === 0 && (
                        <p className="text-red-500 text-sm">No Proton or Wine installations found. Please install Steam or Wine.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 bg-[#2a2a2a] p-6 border-4 border-black shadow-[inset_4px_4px_#555]">
                  <label className="text-xl flex items-center gap-4"><Icons.Volume level={musicVol} /> Audio Controls</label>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm uppercase opacity-50">Music {Math.round(musicVol * 100)}%</span>
                      <input type="range" min="0" max="1" step="0.01" value={musicVol} onChange={e => setMusicVol(parseFloat(e.target.value))} className="mc-range" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-sm uppercase opacity-50">SFX {Math.round(sfxVol * 100)}%</span>
                      <input type="range" min="0" max="1" step="0.01" value={sfxVol} onChange={e => setSfxVol(parseFloat(e.target.value))} className="mc-range" />
                    </div>
                  </div>
                  <button onClick={() => { setIsMuted(!isMuted); playSfx('pop.wav'); }} className="legacy-btn mt-4 py-2">{isMuted ? "UNMUTE ALL" : "MUTE ALL"}</button>
                </div>

                <div className="about-section border-4 border-black bg-[#2a2a2a] p-6 shadow-[inset_4px_4px_#555]">
                  <h3 className="text-2xl text-[#ffff55] mb-2 uppercase tracking-wide">About the project</h3>
                  <p className="text-xl text-white leading-relaxed mb-6 opacity-90">
                    I'm <span className="text-emerald-400">KayJann</span>, and I absolutely love this project! It's my very first one,
                    and my goal is to create a central hub for the LCE community to bring us all together.
                  </p>
                  <h3 className="text-sm text-slate-500 mb-4 uppercase tracking-widest">Social Links</h3>
                  <div className="flex gap-6">
                    <button onClick={() => openUrl("https://discord.gg/nzbxB8Hxjh")} className="social-btn btn-discord" title="Discord"><Icons.Discord /></button>
                    <button onClick={() => openUrl("https://github.com/KayJannOnGit")} className="social-btn btn-github" title="GitHub"><Icons.Github /></button>
                    <button onClick={() => openUrl("https://reddit.com/user/KayJann")} className="social-btn btn-reddit" title="Reddit"><Icons.Reddit /></button>
                  </div>                </div>
              </div>
            </div>
          )}
        </div>

        {reinstallModal && (
          <div className="absolute inset-0 bg-black/80 z-[200] flex items-center justify-center animate-in fade-in">
            <div className="bg-[#2a2a2a] border-4 border-black p-8 w-[600px] text-center shadow-[inset_4px_4px_#555,inset_-4px_-4px_#111]">
              <h3 className="text-4xl text-[#ff5555] mb-6 font-bold uppercase tracking-widest">Warning</h3>
              <p className="text-2xl mb-10 leading-relaxed text-white">Reinstalling will delete all data. Continue?</p>
              <div className="flex gap-6">
                <button onClick={() => { playSfx('back.ogg'); setReinstallModal(null); }} className="legacy-btn px-8 py-4 text-3xl w-1/2">Cancel</button>
                <button onClick={() => { playSfx('click.wav'); executeInstall(reinstallModal.id, reinstallModal.url); setReinstallModal(null); }} className="legacy-btn px-8 py-4 text-3xl w-1/2 confirm-red-btn">Confirm</button>
              </div>
            </div>
          </div>
        )}

        {mcNotif && (
          <div className="absolute top-6 right-6 bg-[#202020] border-2 border-black p-4 flex items-center gap-4 shadow-[5px_5px_15px_rgba(0,0,0,0.5)] z-[100] animate-in slide-in-from-right-10">
            <div className="w-12 h-12 bg-emerald-500 border-2 border-black flex items-center justify-center text-3xl font-bold">✓</div>
            <div className="flex flex-col"><span className="text-[#ffff55] text-2xl font-bold">{mcNotif.t}</span><span className="text-white text-xl">{mcNotif.m}</span></div>
          </div>
        )}
      </main>
    </div>
  );
}