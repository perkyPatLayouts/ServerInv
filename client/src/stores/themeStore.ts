import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  theme: "dark" | string;
  setTheme: (theme: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => {
        document.documentElement.className = theme;
        set({ theme });
      },
    }),
    {
      name: "serverinv-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.className = state.theme;
        }
      },
    }
  )
);
