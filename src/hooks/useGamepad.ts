import { useEffect, useRef, useState } from 'react';
export const useGamepad = (
  activeTab: string,
  setActiveTab: (tab: string) => void,
  playSfx: (name: string, multiplier?: number) => void
) => {
  const [connected, setConnected] = useState(false);
  const requestRef = useRef<number>(null);
  const lastButtons = useRef<Record<number, boolean>>({});
  const lastAxes = useRef<Record<number, number>>({});
  const activeTabRef = useRef(activeTab);
  const tabs = ['home', 'versions', 'settings'];
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const moveFocus = (direction: number) => {
    const focusable = Array.from(document.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.closest('aside')) as HTMLElement[];

    if (focusable.length === 0) return;
    if (!document.activeElement || document.activeElement === document.body) {
      focusable[0].focus();
      playSfx('wood click.wav', 0.5);
      return;
    }

    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = focusable.length - 1;
    if (nextIndex >= focusable.length) nextIndex = 0;

    focusable[nextIndex].focus();
    playSfx('wood click.wav', 0.5);
  };

  const update = () => {
    const gamepads = navigator.getGamepads();
    let anyConnected = false;
    for (const gp of gamepads) {
      if (!gp) continue;
      anyConnected = true;
      const tab = activeTabRef.current;
      const btnVal = (i: number): number =>
        typeof gp.buttons[i] === 'object' ? gp.buttons[i].value : gp.buttons[i] ?? 0;

      const justPressed = (i: number) => btnVal(i) > 0.5 && !lastButtons.current[i];
      if (justPressed(1)) { // A
        const active = document.activeElement as HTMLElement;
        if (active?.click) active.click();
      }

      if (justPressed(2)) { // B
        if (tab !== 'home') {
          setActiveTab('home');
          playSfx('back.ogg');
        }
      }

      if (justPressed(7)) { // L1
        const idx = tabs.indexOf(tab);
        setActiveTab(idx > 0 ? tabs[idx - 1] : tabs[tabs.length - 1]);
        playSfx('click.wav');
      }

      if (justPressed(8)) { // R1
        const idx = tabs.indexOf(tab);
        setActiveTab(idx < tabs.length - 1 ? tabs[idx + 1] : tabs[0]);
        playSfx('click.wav');
      }

      const newButtons: Record<number, boolean> = {};
      gp.buttons.forEach((btn, i) => {
        newButtons[i] = (typeof btn === 'object' ? btn.value : btn) > 0.5;
      });
      lastButtons.current = newButtons;
      const axisY = gp.axes[2] ?? 0; // LS (Y)
      const prevY = lastAxes.current[2] ?? 0;
      const deadzone = 0.5;
      if (Math.abs(axisY) > deadzone && Math.abs(prevY) <= deadzone) {
        moveFocus(axisY < 0 ? 1 : -1);
      }
      lastAxes.current[2] = axisY;
      const axisX = gp.axes[1] ?? 0; // LS (X)
      const prevX = lastAxes.current[1] ?? 0;
      if (Math.abs(axisX) > deadzone && Math.abs(prevX) <= deadzone) {
        moveFocus(axisX > 0 ? 1 : -1);
      }
      lastAxes.current[1] = axisX;
    }

    if (anyConnected !== connected) setConnected(anyConnected);
    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return { connected };
};