import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

type ToastState = {
  message: string | null;
  tone: ToastTone;
  /** Bumps when a new toast is shown so the viewport timer restarts. */
  _version: number;
  show: (message: string, tone?: ToastTone) => void;
  dismiss: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  tone: 'success',
  _version: 0,
  show: (message, tone = 'success') =>
    set((s) => ({
      message,
      tone,
      _version: s._version + 1,
    })),
  dismiss: () => set({ message: null }),
}));

/** App-wide toast (same surface as auth alerts). Safe to call outside React. */
export function toast(message: string, tone: ToastTone = 'success') {
  useToastStore.getState().show(message, tone);
}
