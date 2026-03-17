import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface GamepadContextType {
  focusedElement: HTMLElement | null;
  setFocusedElement: (el: HTMLElement | null) => void;
  moveFocus: (dx: number, dy: number) => void;
}

const GamepadContext = createContext<GamepadContextType | undefined>(undefined);

export const GamepadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [focusedElement, setFocusedElementState] = useState<HTMLElement | null>(null);
  const focusedRef = useRef<HTMLElement | null>(null);

  const setFocusedElement = useCallback((el: HTMLElement | null) => {
    focusedRef.current = el;
    setFocusedElementState(el);
    if (el) {
      el.focus();
    }
  }, []);

  const moveFocus = useCallback((dx: number, dy: number) => {
    const current = focusedRef.current || document.activeElement as HTMLElement;
    const focusableElements = Array.from(
      document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
    }) as HTMLElement[];

    if (focusableElements.length === 0) return;

    if (!current || !focusableElements.includes(current)) {
      setFocusedElement(focusableElements[0]);
      return;
    }

    const currentRect = current.getBoundingClientRect();
    const currentCenterX = currentRect.left + currentRect.width / 2;
    const currentCenterY = currentRect.top + currentRect.height / 2;

    let bestElement: HTMLElement | null = null;
    let minDistance = Infinity;

    focusableElements.forEach(el => {
      if (el === current) return;

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = centerX - currentCenterX;
      const deltaY = centerY - currentCenterY;

      // Check if the element is in the correct direction
      // dx > 0: RIGHT, dx < 0: LEFT
      // dy > 0: UP, dy < 0: DOWN (to match user snippet: axisY < 0 ? 1 : -1)
      const isCorrectDirection = (dx > 0 && deltaX > Math.abs(deltaY)) ||
                                (dx < 0 && deltaX < -Math.abs(deltaY)) ||
                                (dy > 0 && deltaY < -Math.abs(deltaX)) ||
                                (dy < 0 && deltaY > Math.abs(deltaX));

      if (isCorrectDirection) {
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance < minDistance) {
          minDistance = distance;
          bestElement = el;
        }
      }
    });

    if (bestElement) {
      setFocusedElement(bestElement);
    }
  }, [setFocusedElement]);

  return (
    <GamepadContext.Provider value={{ focusedElement, setFocusedElement, moveFocus }}>
      {children}
    </GamepadContext.Provider>
  );
};

export const useGamepadContext = () => {
  const context = useContext(GamepadContext);
  if (!context) {
    throw new Error('useGamepadContext must be used within a GamepadProvider');
  }
  return context;
};
