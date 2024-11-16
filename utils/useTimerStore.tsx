import { create } from 'zustand';

type TimerStoreType = {
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
};

const useTimerStore = create<TimerStoreType>((set) => ({
  timeRemaining: 0,
  setTimeRemaining: (time) => set({ timeRemaining: time })
}));

export default useTimerStore;
