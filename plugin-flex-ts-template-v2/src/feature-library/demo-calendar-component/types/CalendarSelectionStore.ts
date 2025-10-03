// src/state/calendarSelectionStore.ts
export type SlotSelection = {
  start: string;
  end: string;
  dayIndex: number;
  hour: number;
  events: any[];
} | null;

type Listener = (sel: SlotSelection) => void;

let currentSelection: SlotSelection = null;
const listeners: Set<Listener> = new Set();

export const getSelection = (): SlotSelection => currentSelection;

export const setSelection = (sel: SlotSelection) => {
  currentSelection = sel;
  listeners.forEach((l) => {
    try {
      l(currentSelection);
    } catch (err) {
      /* swallow handler errors */
    }
  });
};

export const clearSelection = () => setSelection(null);

export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  // immediately send current value so subscriber can render initial state
  listener(currentSelection);

  // return a cleanup function that returns void
  return () => {
    listeners.delete(listener); // ignore the boolean return value
  };
};
