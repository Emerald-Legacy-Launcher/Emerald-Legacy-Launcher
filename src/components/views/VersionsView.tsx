import { useState, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import { TauriService } from "../../services/TauriService";
import CustomTUModal from "../modals/CustomTUModal";
import { useUI, useConfig, useAudio, useGame } from "../../context/LauncherContext";

const VersionsView = memo(function VersionsView() {
  const { setActiveView } = useUI();
  const { profile: selectedProfile, setProfile: setSelectedProfile } = useConfig();
  const { playClickSound, playBackSound, playSfx } = useAudio();
  const { editions, installs: installedVersions, toggleInstall, handleUninstall: onUninstall, deleteCustomEdition: onDeleteEdition, addCustomEdition: onAddEdition, updateCustomEdition: onUpdateEdition, downloadingId, downloadProgress } = useGame();

  const [focusRow, setFocusRow] = useState<number>(0);
  const [focusCol, setFocusCol] = useState<number>(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingEdition, setEditingEdition] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ITEM_COUNT = editions.length + 2;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "Escape" || e.key === "Backspace") {
        playBackSound();
        setActiveView("main");
        return;
      }

      if (e.key === "ArrowDown") {
        setFocusRow((prev) => (prev >= ITEM_COUNT - 1 ? 0 : prev + 1));
        setFocusCol(0);
      } else if (e.key === "ArrowUp") {
        setFocusRow((prev) => (prev <= 0 ? ITEM_COUNT - 1 : prev - 1));
        setFocusCol(0);
      } else if (e.key === "ArrowRight") {
        if (focusRow < editions.length) {
          const id = editions[focusRow].id;
          const isInstalled = installedVersions.includes(id);
          const isCustom = id.startsWith("custom_");
          let maxCol = 1;
          if (isInstalled) maxCol = 3;
          if (isCustom) maxCol = isInstalled ? 5 : 3;

          setFocusCol((prev) => (prev < maxCol ? prev + 1 : prev));
        }
      } else if (e.key === "ArrowLeft") {
        setFocusCol((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        if (focusRow < editions.length) {
          const edition = editions[focusRow];
          const isInstalled = installedVersions.includes(edition.id);
          const isCustom = edition.id.startsWith("custom_");

          if (focusCol === 0) {
            if (isInstalled) {
              playClickSound();
              setSelectedProfile(edition.id);
            } else if (!downloadingId) {
              playClickSound();
              toggleInstall(edition.id);
            }
          } else if (focusCol === 1 && !downloadingId) {
            playClickSound();
            toggleInstall(edition.id);
          } else if (focusCol === 2) {
            if (isInstalled) {
              playClickSound();
              TauriService.openInstanceFolder(edition.id);
            } else if (isCustom) {
              playClickSound();
              setEditingEdition(edition);
              setIsImportModalOpen(true);
            }
          } else if (focusCol === 3) {
            if (isInstalled) {
              playBackSound();
              onUninstall(edition.id);
            } else if (isCustom) {
              playBackSound();
              onDeleteEdition(edition.id);
            }
          } else if (focusCol === 4) {
            if (isCustom) {
              playClickSound();
              setEditingEdition(edition);
              setIsImportModalOpen(true);
            }
          } else if (focusCol === 5) {
            if (isCustom) {
              playBackSound();
              onDeleteEdition(edition.id);
            }
          }
        } else if (focusRow === editions.length) {
          playClickSound();
          setIsImportModalOpen(true);
        } else {
          playBackSound();
          setActiveView("main");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    focusRow,
    focusCol,
    editions,
    installedVersions,
    playClickSound,
    playBackSound,
    setSelectedProfile,
    setActiveView,
    toggleInstall,
    onUninstall,
    onDeleteEdition,
    ITEM_COUNT,
  ]);

  useEffect(() => {
    const el = containerRef.current?.querySelector(
      `[data-row="${focusRow}"][data-col="${focusCol}"]`,
    ) as HTMLElement;
    if (el) el.focus();
  }, [focusRow, focusCol]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: useConfig().animationsEnabled ? 0.3 : 0 }}
      className="flex flex-col items-center w-full max-w-4xl outline-none"
    >
      <h2 className="text-2xl text-white mc-text-shadow mt-2 mb-4 border-b-2 border-[#373737] pb-2 w-[40%] max-w-[200px] text-center tracking-widest uppercase opacity-80 font-bold">
        Versions
      </h2>

      <div className="w-full max-w-[740px] h-[380px] overflow-y-auto mb-6 p-6 relative">
        <div className="flex flex-col gap-3">
          {editions.map((edition: any, i: number) => {
            const isInstalled = installedVersions.includes(edition.id);
            const isSelected = selectedProfile === edition.id;
            const isRowFocused = focusRow === i;
            const isCustom = edition.id.startsWith("custom_");

            return (
              <div
                key={edition.id}
                className={`w-full flex items-center transition-all border-none outline-none overflow-hidden`}
                style={{
                  backgroundImage:
                    isSelected || (isRowFocused && focusCol === 0)
                      ? "url('/images/button_highlighted.png')"
                      : "url('/images/Button_Background.png')",
                  backgroundSize: "100% 100%",
                  imageRendering: "pixelated",
                }}
              >
                <div
                  data-row={i}
                  data-col={0}
                  tabIndex={0}
                  onMouseEnter={() => {
                    setFocusRow(i);
                    setFocusCol(0);
                  }}
                  onClick={() => {
                    if (isInstalled) {
                      playClickSound();
                      setSelectedProfile(edition.id);
                    } else {
                      toggleInstall(edition.id);
                    }
                  }}
                  className="flex-1 p-4 flex items-center cursor-pointer outline-none pl-6 text-left relative"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-2xl mc-text-shadow ${isSelected || (isRowFocused && focusCol === 0) ? "text-[#FFFF55]" : "text-white"}`}
                      >
                        {edition.name}
                      </span>
                      {isCustom && (
                        <span className="text-[10px] bg-[#FFFF55] text-black px-1 font-bold uppercase mc-text-shadow-none">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="text-base text-[#E0E0E0] mc-text-shadow truncate w-full">
                      {edition.desc}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 pr-6">
                  {!isInstalled ? (
                    <button
                      data-row={i}
                      data-col={1}
                      onMouseEnter={() => {
                        setFocusRow(i);
                        setFocusCol(1);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!downloadingId) {
                          playClickSound();
                          toggleInstall(edition.id);
                        }
                      }}
                      className={`mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all ${downloadingId === edition.id ? "opacity-100" : downloadingId ? "opacity-50" : ""}`}
                      style={{
                        backgroundImage:
                          isRowFocused && focusCol === 1
                            ? "url('/images/Button_Square_Highlighted.png')"
                            : "url('/images/Button_Square.png')",
                        backgroundSize: "100% 100%",
                        imageRendering: "pixelated",
                      }}
                    >
                      {downloadingId === edition.id ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[10px] text-white font-bold leading-none">
                            {Math.floor(downloadProgress || 0)}%
                          </span>
                        </div>
                      ) : (
                        <img
                          src="/images/Download_Icon.png"
                          alt="Download"
                          className="w-8 h-8 object-contain pointer-events-none drop-shadow-md"
                          style={{ imageRendering: "pixelated" }}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        data-row={i}
                        data-col={1}
                        onMouseEnter={() => {
                          setFocusRow(i);
                          setFocusCol(1);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!downloadingId) {
                            playClickSound();
                            toggleInstall(edition.id);
                          }
                        }}
                        className={`mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all ${downloadingId === edition.id ? "opacity-100" : downloadingId ? "opacity-50" : ""}`}
                        style={{
                          backgroundImage:
                            isRowFocused && focusCol === 1
                              ? "url('/images/Button_Square_Highlighted.png')"
                              : "url('/images/Button_Square.png')",
                          backgroundSize: "100% 100%",
                          imageRendering: "pixelated",
                        }}
                      >
                        {downloadingId === edition.id ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[10px] text-white font-bold leading-none">
                              {Math.floor(downloadProgress || 0)}%
                            </span>
                          </div>
                        ) : (
                          <img
                            src="/images/Update_Icon.png"
                            alt="Update"
                            className="w-8 h-8 object-contain pointer-events-none drop-shadow-md"
                            style={{ imageRendering: "pixelated" }}
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                      </button>
                      <button
                        data-row={i}
                        data-col={2}
                        onMouseEnter={() => {
                          setFocusRow(i);
                          setFocusCol(2);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          TauriService.openInstanceFolder(edition.id);
                        }}
                        className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all"
                        style={{
                          backgroundImage:
                            isRowFocused && focusCol === 2
                              ? "url('/images/Button_Square_Highlighted.png')"
                              : "url('/images/Button_Square.png')",
                          backgroundSize: "100% 100%",
                          imageRendering: "pixelated",
                        }}
                      >
                        <img
                          src="/images/Folder_Icon.png"
                          alt="Folder"
                          className="w-8 h-8 object-contain pointer-events-none drop-shadow-md"
                          style={{ imageRendering: "pixelated" }}
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                      <button
                        data-row={i}
                        data-col={3}
                        onMouseEnter={() => {
                          setFocusRow(i);
                          setFocusCol(3);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          playBackSound();
                          onUninstall(edition.id);
                        }}
                        className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all"
                        style={{
                          backgroundImage:
                            isRowFocused && focusCol === 3
                              ? "url('/images/Button_Square_Highlighted.png')"
                              : "url('/images/Button_Square.png')",
                          backgroundSize: "100% 100%",
                          imageRendering: "pixelated",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="square"
                          className="text-white drop-shadow-md"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </>
                  )}
                  {isCustom && (
                    <>
                      <button
                        data-row={i}
                        data-col={isInstalled ? 4 : 2}
                        onMouseEnter={() => {
                          setFocusRow(i);
                          setFocusCol(isInstalled ? 4 : 2);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          setEditingEdition(edition);
                          setIsImportModalOpen(true);
                        }}
                        className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all"
                        style={{
                          backgroundImage:
                            isRowFocused && focusCol === (isInstalled ? 4 : 2)
                              ? "url('/images/Button_Square_Highlighted.png')"
                              : "url('/images/Button_Square.png')",
                          backgroundSize: "100% 100%",
                          imageRendering: "pixelated",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="square"
                          className="text-white drop-shadow-md"
                        >
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </button>
                      <button
                        data-row={i}
                        data-col={isInstalled ? 5 : 3}
                        onMouseEnter={() => {
                          setFocusRow(i);
                          setFocusCol(isInstalled ? 5 : 3);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          playBackSound();
                          onDeleteEdition(edition.id);
                        }}
                        className="mc-sq-btn w-10 h-10 flex items-center justify-center outline-none border-none transition-all"
                        style={{
                          backgroundImage:
                            isRowFocused && focusCol === (isInstalled ? 5 : 3)
                              ? "url('/images/Button_Square_Highlighted.png')"
                              : "url('/images/Button_Square.png')",
                          backgroundSize: "100% 100%",
                          imageRendering: "pixelated",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="square"
                          className="text-red-500 drop-shadow-md"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          data-row={editions.length}
          data-col={0}
          onMouseEnter={() => {
            setFocusRow(editions.length);
            setFocusCol(0);
          }}
          onClick={() => {
            playClickSound();
            setIsImportModalOpen(true);
          }}
          className={`w-72 h-14 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none ${focusRow === editions.length ? "text-[#FFFF55]" : "text-white"}`}
          style={{
            backgroundImage:
              focusRow === editions.length
                ? "url('/images/button_highlighted.png')"
                : "url('/images/Button_Background.png')",
            backgroundSize: "100% 100%",
            imageRendering: "pixelated",
          }}
        >
          Import Custom TU
        </button>

        <button
          data-row={editions.length + 1}
          data-col={0}
          onMouseEnter={() => {
            setFocusRow(editions.length + 1);
            setFocusCol(0);
          }}
          onClick={() => {
            playBackSound();
            setActiveView("main");
          }}
          className={`w-72 h-14 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none ${focusRow === editions.length + 1 ? "text-[#FFFF55]" : "text-white"}`}
          style={{
            backgroundImage:
              focusRow === editions.length + 1
                ? "url('/images/button_highlighted.png')"
                : "url('/images/Button_Background.png')",
            backgroundSize: "100% 100%",
            imageRendering: "pixelated",
          }}
        >
          Back
        </button>
      </div>

      <CustomTUModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setEditingEdition(null);
        }}
        onImport={(ed: any) => {
          if (editingEdition) {
            onUpdateEdition(editingEdition.id, ed);
          } else {
            const id = onAddEdition(ed);
            setSelectedProfile(id);
          }
        }}
        playSfx={playSfx}
        editingEdition={editingEdition}
      />
    </motion.div>
  );
});

export default VersionsView;
