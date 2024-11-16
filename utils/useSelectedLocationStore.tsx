import { create } from 'zustand';

type SelectedLocationType = {
  selectedLocation: string[];
  setSelectedLocation: (status: string[]) => void;
};

const useSelectedLocationStore = create<SelectedLocationType>((set) => ({
  selectedLocation: [],
  setSelectedLocation: (status) => set({ selectedLocation: status })
}));

export default useSelectedLocationStore;
