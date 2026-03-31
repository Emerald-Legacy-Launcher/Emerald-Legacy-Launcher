import { useState, useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import { TauriService } from "../../services/TauriService";
import CustomTUModal from "../modals/CustomTUModal";
import { useUI, useConfig, useAudio, useGame } from "../../context/LauncherContext";

const VersionsView = memo(function VersionsView() {
  const { setActiveView } = useUI();
  const { profile: selectedProfile, setProfile: setSelectedProfile } = useConfig();
  const { playClickSound, playBackSound, playSfx } = useAudio();
  const { editions, installs: installedVersions, toggleInstall, handleUninstall: onUninstall, deleteCustomEdition: onDeleteEdition, addCustomEdition: onAddEdition, updateCustomEdition: onUpdateEdition, downloadingId } = useGame();

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
          const edition = editions[focusRow];
          const isInstalled = installedVersions.includes(edition.id);
          const isCustom = edition.id.startsWith("custom_");
          const hasCredits = !isCustom && edition.credits;

          let maxCol = 1;
          if (isInstalled) maxCol = 3;
          if (isCustom) maxCol = isInstalled ? 5 : 3;
          if (hasCredits) maxCol = Math.max(maxCol, 0); // credits button is at col -1

          setFocusCol((prev) => (prev < maxCol ? prev + 1 : prev));
        }
      } else if (e.key === "ArrowLeft") {
        if (focusRow < editions.length) {
          const edition = editions[focusRow];
          const isCustom = edition.id.startsWith("custom_");
          const hasCredits = !isCustom && edition.credits;

          if (hasCredits && focusCol > -1) {
            setFocusCol(-1);
          } else if (focusCol > 0) {
            setFocusCol((prev) => prev - 1);
          }
        } else {
          setFocusCol((prev) => (prev > 0 ? prev - 1 : prev));
        }
      } else if (e.key === "Enter") {
        if (focusRow < editions.length) {
          const edition = editions[focusRow];
          const isInstalled = installedVersions.includes(edition.id);
          const isCustom = edition.id.startsWith("custom_");

          if (focusCol === -1) {
            // Credits button
            if (edition.credits) {
              playClickSound();
              window.open(edition.credits.url, '_blank');
            }
          } else if (focusCol === 1) {
            if (!downloadingId) {
              playClickSound();
              toggleInstall(edition.id);
            }
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
  }, [editions, focusRow, focusCol, downloadingId, installedVersions, onUninstall, onDeleteEdition, ITEM_COUNT]);

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
        <div
          className="w-full p-6"
          style={{
            backgroundImage: "url('/images/frame_background.png')",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
            minHeight: "340px",
          }}
        >
          <div className="flex flex-col gap-3">
            {editions.map((edition: any, i: number) => {
              const isInstalled = installedVersions.includes(edition.id);
              const isSelected = selectedProfile === edition.id;
              const isRowFocused = focusRow === i;
              const isCustom = edition.id.startsWith("custom_");
              const isPlaceholder = edition.id === "lmrp_placeholder";

              return (
                <div
                  key={edition.id}
                  className={`w-full p-4 flex items-center transition-all border-none outline-none overflow-hidden relative ${isPlaceholder ? 'bg-gray-800/50 border-2 border-gray-600 opacity-50' : isSelected ? 'bg-[#50C878]/20 border-2 border-[#50C878]' :
                    isRowFocused ? 'bg-white/5 border-2 border-white/50' :
                      'bg-black/30 border-2 border-transparent hover:bg-white/5'
                    }`}
                  onMouseEnter={() => {
                    if (!isPlaceholder) {
                      setFocusRow(i);
                      setFocusCol(0);
                    }
                  }}
                  onClick={() => {
                    if (!isPlaceholder && isInstalled) {
                      playClickSound();
                      setSelectedProfile(edition.id);
                    }
                  }}
                  style={{
                    backdropFilter: 'blur(4px)',
                    cursor: isPlaceholder ? 'not-allowed' : isInstalled ? 'pointer' : 'default',
                    imageRendering: 'pixelated',
                    borderRadius: '0'
                  }}
                >
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className={`text-xl mc-text-shadow ${isSelected ? "text-[#50C878]" : "text-white"}`}
                        style={{ imageRendering: 'pixelated' }}
                      >
                        {edition.name}
                      </span>
                      {isCustom && (
                        <span
                          className="text-[10px] bg-[#50C878] text-black px-1 font-bold uppercase mc-text-shadow-none"
                          style={{ imageRendering: 'pixelated' }}
                        >
                          Custom
                        </span>
                      )}
                      {edition.id === "revelations_edition" && (
                        <>
                          <span
                            className="text-[10px] bg-[#50C878] text-white px-1 font-bold uppercase mc-text-shadow-none"
                            style={{ imageRendering: 'pixelated' }}
                          >
                            New
                          </span>
                          <span
                            className="text-[10px] bg-[#FFD700] text-black px-1 font-bold uppercase mc-text-shadow-none"
                            style={{ imageRendering: 'pixelated' }}
                          >
                            Recommended
                          </span>
                        </>
                      )}
                      {edition.id === "360revived" && (
                        <span
                          className="text-[10px] bg-[#50C878] text-white px-1 font-bold uppercase mc-text-shadow-none"
                          style={{ imageRendering: 'pixelated' }}
                        >
                          New
                        </span>
                      )}
                      {edition.id === "lmrp_placeholder" && (
                        <span
                          className="text-[10px] bg-gray-500 text-white px-1 font-bold uppercase mc-text-shadow-none"
                          style={{ imageRendering: 'pixelated' }}
                        >
                          Coming Soon
                        </span>
                      )}
                      {!isCustom && edition.credits && (
                        <span
                          className="text-xs text-[#B0B0B0] mc-text-shadow"
                          style={{ imageRendering: 'pixelated' }}
                        >
                          by {edition.credits.developer}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-sm text-[#E0E0E0] mc-text-shadow"
                      style={{ imageRendering: 'pixelated' }}
                    >
                      {edition.desc}
                    </div>
                  </div>

                  {!isPlaceholder && (
                    <div className="flex items-center gap-2">
                      {!isCustom && edition.credits && (
                        <button
                          data-row={i}
                          data-col={-1}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            setFocusRow(i);
                            setFocusCol(-1);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickSound();
                            window.open(edition.credits.url, '_blank');
                          }}
                          className={`mc-sq-btn w-8 h-8 flex items-center justify-center outline-none border-none transition-all`}
                          style={{
                            backgroundImage:
                              isRowFocused && focusCol === -1
                                ? "url('/images/Button_Square_Highlighted.png')"
                                : "url('/images/Button_Square.png')",
                            backgroundSize: "100% 100%",
                            imageRendering: "pixelated",
                          }}
                          title={`Credits: ${edition.credits.developer} (${edition.credits.platform})`}
                        >
                          {edition.credits?.platform === "codeberg" ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="text-white drop-shadow-md"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white drop-shadow-md"
                            >
                              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                            </svg>
                          )}
                        </button>
                      )}

                      {!isInstalled ? (
                        <button
                          data-row={i}
                          data-col={1}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
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
                          className={`mc-sq-btn w-8 h-8 flex items-center justify-center outline-none border-none transition-all ${downloadingId === edition.id ? "opacity-100" : downloadingId ? "opacity-50" : ""}`}
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
                            <img
                              src="/images/loading.gif"
                              alt="Loading"
                              className="w-6 h-6 object-contain pointer-events-none drop-shadow-md"
                              style={{ imageRendering: "pixelated" }}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <img
                              src="/images/Download_Icon.png"
                              alt="Download"
                              className="w-6 h-6 object-contain pointer-events-none drop-shadow-md"
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
                            data-col={2}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              setFocusRow(i);
                              setFocusCol(2);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              playClickSound();
                              TauriService.openInstanceFolder(edition.id);
                            }}
                            className="mc-sq-btn w-8 h-8 flex items-center justify-center outline-none border-none transition-all"
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
                              className="w-6 h-6 object-contain pointer-events-none drop-shadow-md"
                              style={{ imageRendering: "pixelated" }}
                              loading="lazy"
                              decoding="async"
                            />
                          </button>
                          <button
                            data-row={i}
                            data-col={3}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              setFocusRow(i);
                              setFocusCol(3);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              playBackSound();
                              onUninstall(edition.id);
                            }}
                            className="mc-sq-btn w-8 h-8 flex items-center justify-center outline-none border-none transition-all"
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
                              width="18"
                              height="18"
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
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              setFocusRow(i);
                              setFocusCol(isInstalled ? 4 : 2);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              playClickSound();
                              setEditingEdition(edition);
                              setIsImportModalOpen(true);
                            }}
                            className="mc-sq-btn w-8 h-8 flex items-center justify-center outline-none border-none transition-all"
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
                              width="18"
                              height="18"
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
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              setFocusRow(i);
                              setFocusCol(isInstalled ? 5 : 3);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              playBackSound();
                              onDeleteEdition(edition.id);
                            }}
                            className="mc-sq-btn w-8 h-8 flex items-center justify-center outline-none border-none transition-all"
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
                              width="20"
                              height="20"
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
                  )}
                </div>
              );
            })}
          </div>
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
          className={`w-72 h-14 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none ${focusRow === editions.length ? "text-[#50C878]" : "text-white"}`}
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
          className={`w-72 h-14 flex items-center justify-center transition-colors text-2xl mc-text-shadow outline-none border-none ${focusRow === editions.length + 1 ? "text-[#50C878]" : "text-white"}`}
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
