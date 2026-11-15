import { useSyncExternalStore } from 'react';

import type { LookingFor } from './constants';

export type Filters = {
  level: number | null;
  programme: string;
  hall: string;
  lookingFor: LookingFor | null;
};

let state: Filters = { level: null, programme: '', hall: '', lookingFor: null };
const listeners = new Set<() => void>();

export function setFilters(next: Filters) {
  state = next;
  listeners.forEach((l) => l());
}

export function useFilters(): Filters {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export function activeFilterCount(f: Filters) {
  return [f.level, f.programme.trim(), f.hall.trim(), f.lookingFor].filter(Boolean).length;
}
