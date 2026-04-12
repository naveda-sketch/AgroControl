'use client';

import { useState, useEffect, useCallback } from 'react';

interface UndoToastProps {
  message: string;
  onUndo: () => Promise<void>;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({ message, onUndo, onDismiss, duration = 8000 }: UndoToastProps) {
  const [progress, setProgress] = useState(100);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p - (100 / (duration / 100));
        if (next <= 0) { onDismiss(); return 0; }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  const handleUndo = useCallback(async () => {
    setUndoing(true);
    await onUndo();
    onDismiss();
  }, [onUndo, onDismiss]);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 min-w-[300px] max-w-[90vw]">
        <p className="text-sm flex-1">{message}</p>
        <button
          onClick={handleUndo}
          disabled={undoing}
          className="text-amber-400 font-semibold text-sm hover:text-amber-300 whitespace-nowrap disabled:text-gray-500"
        >
          {undoing ? 'Restaurando...' : 'Deshacer'}
        </button>
        <button onClick={onDismiss} className="text-gray-500 hover:text-gray-300">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div className="h-0.5 bg-gray-700 rounded-full mt-1 mx-2 overflow-hidden">
        <div className="h-full bg-amber-400 transition-all duration-100 rounded-full" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// Hook for managing undo state
export function useUndo() {
  const [toast, setToast] = useState<{
    message: string;
    restoreData: any;
    table: string;
    id: string;
    idField: string;
  } | null>(null);

  const showUndo = (message: string, table: string, id: string, idField: string, restoreData: any) => {
    setToast({ message, table, id, idField, restoreData });
  };

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, showUndo, dismiss };
}
