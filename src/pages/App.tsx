import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HomeView from "../components/views/HomeView";
import SettingsView from "../components/views/SettingsView";
import VersionsView from "../components/views/VersionsView";
import ThemesView from "../components/views/ThemesView";
import SkinsView from "../components/views/SkinsView";
import WorkshopView from "../components/views/WorkshopView";
import SkinViewer from "../components/common/SkinViewer";
import TeamModal from "../components/modals/TeamModal";
import PanoramaBackground from "../components/common/PanoramaBackground";
import { ClickParticles } from "../components/common/ClickParticles";
import { AppHeader } from "../components/layout/AppHeader";
import { DownloadOverlay } from "../components/layout/DownloadOverlay";
import { AchievementToast } from "../components/common/AchievementToast";
import { useUI, useConfig, useAudio, useGame, useSkin } from "../context/LauncherContext";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TauriService } from "../services/TauriService";

const appWindow = getCurrentWindow();

export default function App() {
  const {
    showIntro, setShowIntro, logoAnimDone, setLogoAnimDone,
    activeView, setActiveView, isUiHidden, setIsUiHidden,
    showCredits, setShowCredits, focusSection,
    onNavigateToMenu, updateMessage, clearUpdateMessage
  } = useUI();

  const config = useConfig();
  const audio = useAudio();
  const game = useGame();
  const { skinUrl, setSkinUrl } = useSkin();

  const selectedEdition = game.editions.find((e: any) => e.id === config.profile);
  const selectedVersionName = selectedEdition?.name || "";

  useEffect(() => {
    appWindow.show();
    setTimeout(() => setShowIntro(false), 2400);
    setTimeout(() => setLogoAnimDone(true), 3400);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  const uiFade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <div
      data-tauri-drag-region
      className="w-screen h-screen overflow-hidden select-none flex flex-col relative bg-black text-white font-['Mojangles'] outline-none focus:outline-none"
    >
      <style>{`
        @keyframes splashPulse { 0% { transform: scale(0.95) rotate(-20deg); } 100% { transform: scale(1.08) rotate(-20deg); } }
        .mc-splash { animation: splashPulse 0.45s ease-in-out infinite alternate; transform-origin: center; }
        .mc-slider-custom { -webkit-appearance: none; appearance: none; background: transparent; height: 100%; outline: none; border: none; margin: 0; padding: 0; }
        .mc-slider-custom::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 44px; background: url('/images/Slider_Handle.png') no-repeat center; background-size: 100% 100%; cursor: pointer; position: relative; z-index: 30; }
        *:focus { outline: none !important; box-shadow: none !important; }
        button, input { border-radius: 0 !important; border: none !important; outline: none !important; box-shadow: none !important; }
        .mc-sq-btn { background: url('/images/Button_Square.png') no-repeat center; background-size: 100% 100%; image-rendering: pixelated; }
        .mc-sq-btn:hover { background: url('/images/Button_Square_Highlighted.png') no-repeat center; background-size: 100% 100%; }
      `}</style>

      <PanoramaBackground profile={config.profile} isDay={config.isDayTime} />
      {config.vfxEnabled && <ClickParticles />}

      <AnimatePresence>
        {showCredits && (
          <TeamModal
            isOpen={showCredits}
            onClose={() => setShowCredits(false)}
            playClickSound={audio.playClickSound}
            playSfx={audio.playSfx}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <DownloadOverlay
          downloadProgress={game.downloadProgress}
          downloadingId={game.downloadingId}
          editions={game.editions}
        />
      </AnimatePresence>

      <AchievementToast
        message={game.error}
        onClose={() => game.setError(null)}
      />

      <AchievementToast
        message={updateMessage}
        onClose={clearUpdateMessage}
        onClick={() => TauriService.openUrl("https://emerald-legacy-launcher.github.io/")}
        title="Update Available!"
        variant="update"
      />

      <AnimatePresence>
        {showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 items-center justify-center z-10 pointer-events-none"
          >
            <motion.img
              layoutId="mainLogo"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              src="/images/MenuTitle.png"
              className="w-3/4 max-w-3xl"
              style={{ imageRendering: "pixelated" }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full z-10 w-full relative"
          >
            <AnimatePresence>
              {logoAnimDone && <AppHeader playClickSound={audio.playClickSound} uiFade={uiFade} />}
            </AnimatePresence>

            <AnimatePresence>
              {logoAnimDone && (
                <>
                  {!config.legacyMode && (
                    <motion.div
                      key="hideBtn"
                      {...uiFade}
                      className="absolute top-14 left-8 z-50"
                    >
                      <button
                        onClick={() => {
                          audio.playClickSound();
                          setIsUiHidden(!isUiHidden);
                        }}
                        className="hover:scale-110 active:scale-95 transition-transform outline-none bg-transparent border-none"
                      >
                        <img
                          src={isUiHidden ? "/images/Unhide_UI_Button.png" : "/images/Hide_UI_Button.png"}
                          className="w-10 h-10 cursor-pointer object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </button>
                    </motion.div>
                  )}

                  {!config.legacyMode && (
                    <motion.div
                      key="dayToggle"
                      {...uiFade}
                      className="absolute bottom-6 right-8 z-50 flex items-center gap-3"
                    >
                      <span className="text-[#E0E0E0] text-[10px] mc-text-shadow tracking-widest uppercase opacity-70 mt-1">
                        {config.isDayTime ? "Day" : "Night"}
                      </span>
                      <button
                        onClick={() => {
                          audio.playClickSound();
                          config.setIsDayTime(!config.isDayTime);
                        }}
                        className="hover:scale-110 active:scale-95 transition-transform outline-none bg-transparent border-none"
                      >
                        <img
                          src={config.isDayTime ? "/images/Day_Toggle.png" : "/images/Night_Toggle.png"}
                          alt="Toggle Time"
                          className="w-12 h-12 cursor-pointer block object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>

            <div
              data-tauri-drag-region
              className="shrink-0 flex justify-center py-4 relative w-full pt-12"
            >
              <div className="relative w-full max-w-135 flex justify-center">
                <motion.img
                  layoutId="mainLogo"
                  src="/images/MenuTitle.png"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  className="w-full drop-shadow-[0_8px_6px_rgba(0,0,0,0.8)] pointer-events-none"
                  style={{ imageRendering: "pixelated" }}
                />
                <AnimatePresence>
                  {logoAnimDone && (
                    <>
                      <motion.div
                        key="splash"
                        {...uiFade}
                        className="absolute bottom-[20%] right-[5%] w-0 h-0 flex items-center justify-center"
                      >
                        <div
                          onClick={audio.cycleSplash}
                          data-tauri-no-drag
                          className="mc-splash text-[#FFFF55] text-[28px] z-100 cursor-pointer whitespace-nowrap"
                          style={{ textShadow: "2px 2px 0px #3F3F00" }}
                        >
                          {audio.splashIndex === -1
                            ? `Welcome ${config.username}!`
                            : audio.splashes[audio.splashIndex]}
                        </div>
                      </motion.div>
                      {activeView === "main" && (
                        <motion.div
                          key="tu-subtitle"
                          {...uiFade}
                          className="absolute -bottom-6 text-[#A0A0A0] text-sm mc-text-shadow tracking-widest uppercase opacity-80 font-['Mojangles']"
                        >
                          {selectedVersionName}
                        </motion.div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <main className="flex-1 w-full relative">
              <div
                className={`w-full h-full flex flex-col items-center justify-center ${!logoAnimDone || isUiHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
              >
                <AnimatePresence mode="wait">
                  {activeView === "main" && (
                    <SkinViewer
                      key="skin-viewer"
                      username={config.username}
                      setUsername={config.setUsername}
                      playClickSound={audio.playClickSound}
                      skinUrl={skinUrl}
                      setSkinUrl={setSkinUrl}
                      setActiveView={setActiveView}
                      isFocusedSection={focusSection === "skin"}
                      onNavigateRight={onNavigateToMenu}
                    />
                  )}
                </AnimatePresence>

                <div className="w-full max-w-4xl relative flex justify-center items-center">
                  <AnimatePresence mode="wait">
                    {activeView === "main" && (
                      <HomeView key="main-view" />
                    )}
                    {activeView === "settings" && (
                      <SettingsView key="settings-view" />
                    )}
                    {activeView === "versions" && (
                      <VersionsView key="versions-view" />
                    )}
                    {activeView === "workshop" && (
                      <WorkshopView key="workshop-view" />
                    )}
                    {activeView === "themes" && (
                      <ThemesView key="themes-view" />
                    )}
                    {activeView === "skins" && (
                      <SkinsView key="skins-view" />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </main>

            <AnimatePresence>
              {logoAnimDone && (
                <motion.footer
                  key="footer"
                  {...uiFade}
                  className="shrink-0 p-4 flex justify-between items-end text-[10px] text-[#A0A0A0] mc-text-shadow bg-gradient-to-t from-black/80 to-transparent uppercase tracking-widest opacity-60 font-['Mojangles']"
                  style={{ fontWeight: "normal" }}
                >
                  <div className="flex-1 text-left whitespace-nowrap">Version: 1.0.0</div>
                  <div className="flex-[2] text-center whitespace-nowrap">
                    Not affiliated with Mojang AB or Microsoft. "Minecraft" is a trademark of Mojang Synergies AB.
                  </div>
                  <div className="flex-1 text-right whitespace-nowrap">
                    {useUI().connected && "CONTROLLER CONNECTED"}
                  </div>
                </motion.footer>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
