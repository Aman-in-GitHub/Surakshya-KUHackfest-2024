import { create } from 'zustand';

type IsSafeType = {
  isSafe: boolean;
  setIsSafe: (status: boolean) => void;
};

const useIsSafeStore = create<IsSafeType>((set) => ({
  isSafe: false,
  setIsSafe: (status) => set({ isSafe: status })
}));

export default useIsSafeStore;
