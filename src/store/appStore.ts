import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User } from "@/types";

interface AppState {
  user: User | null;
  sidebarOpen: boolean;
  notificationPanelOpen: boolean;
  setUser: (user: User | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setNotificationPanelOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleNotificationPanel: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      user: null,
      sidebarOpen: true,
      notificationPanelOpen: false,
      setUser: (user) => set({ user }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleNotificationPanel: () =>
        set((state) => ({
          notificationPanelOpen: !state.notificationPanelOpen,
        })),
    }),
    { name: "BidIQ" }
  )
);
