import { create } from 'zustand';

/** Global command-query used by the TopBar to filter the Shipments page. */

interface SearchState {
  query: string;
  setQuery: (value: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
}));