import { useEffect, useRef, useState, useCallback } from 'react';
import { useGamepadContext } from '../components/common/GamepadContext';

export interface UseGamepadProps {
  activeTab: string;
  tabs: string[];
  setActiveTab: (tab: string) => void;
  playSfx: (file: string) => void;
}

export const useGamepad = ({ activeTab, tabs, setActiveTab, playSfx }: UseGamepadProps) => {
  const { moveFocus } = useGamepadContext();
  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);
  const requestRef = useRef<number | undefined>(undefined);
  const lastButtons = useRef<Record<number, boolean>>({});
  const lastAxes = useRef<Record<number, number>>({});

  const stateRef = useRef({
    activeTab,
    tabs,
    setActiveTab,
    playSfx,
    moveFocus
  });

  useEffect(() => {
    stateRef.current = { activeTab, tabs, setActiveTab, playSfx, moveFocus };
  }, [activeTab, tabs, setActiveTab, playSfx, moveFocus]);

  const update = useCallback(() => {
    const { activeTab: tab, tabs: tabsList, setActiveTab: setTab, playSfx: play, moveFocus: move } = stateRef.current;

    let anyConnected = false;
    try {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : null;
      if (gamepads) {
        const gpArray = Array.from(gamepads);
        for (const gp of gpArray) {
          if (!gp) continue;
          anyConnected = true;

          const btnVal = (i: number): number => {
            const btn = gp.buttons[i];
            if (!btn) return 0;
            return typeof btn === "object" ? btn.value : (btn as any) ?? 0;
          };

          const justPressed = (i: number) => btnVal(i) > 0.5 && !lastButtons.current[i];

          if (justPressed(1)) { // A
            const active = document.activeElement as HTMLElement;
            if (active?.click) active.click();
          }

          if (justPressed(2)) { // B
            if (tab !== "main") {
              setTab("main");
              play("back_click.ogg");
            }
          }

          if (justPressed(7)) { // L1
            const idx = tabsList.indexOf(tab);
            const nextIdx = idx > 0 ? idx - 1 : tabsList.length - 1;
            setTab(tabsList[nextIdx]);
            play("click.wav");
          }

          if (justPressed(8)) { // R1
            const idx = tabsList.indexOf(tab);
            const nextIdx = idx < tabsList.length - 1 ? idx + 1 : 0;
            setTab(tabsList[nextIdx]);
            play("click.wav");
          }

          const newButtons: Record<number, boolean> = {};
          gp.buttons.forEach((btn, i) => {
            newButtons[i] = (typeof btn === "object" ? btn.value : btn) > 0.5;
          });
          lastButtons.current = newButtons;

          const rawAxisY = gp.axes[2] ?? 0;
          const prevY = lastAxes.current[2] ?? 0;
          const deadzone = 0.5;

          if (Math.abs(rawAxisY) > deadzone && Math.abs(prevY) <= deadzone) {
            move(0, rawAxisY > 0 ? 1 : -1);
          }
          lastAxes.current[2] = rawAxisY;

          const axisX = gp.axes[1] ?? 0; // LS (X)
          const prevX = lastAxes.current[1] ?? 0;
          if (Math.abs(axisX) > deadzone && Math.abs(prevX) <= deadzone) {
            move(axisX > 0 ? 1 : -1, 0);
          }
          lastAxes.current[1] = axisX;
        }
      }
    } catch (e) {
      console.error("Gamepad error:", e);
    }

    if (anyConnected !== connectedRef.current) {
      connectedRef.current = anyConnected;
      setConnected(anyConnected);
    }
    requestRef.current = requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  return { connected };
};
