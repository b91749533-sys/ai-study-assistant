'use client';

import * as React from 'react';

/**
 * Registers a keyboard shortcut handler.
 */
export function useKeyboardShortcut(key: string, callback: () => void, ctrlOrMeta: boolean = true) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const matchKey = e.key.toLowerCase() === key.toLowerCase();
      const matchModifier = ctrlOrMeta ? (e.ctrlKey || e.metaKey) : true;

      if (matchKey && matchModifier) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrlOrMeta]);
}
