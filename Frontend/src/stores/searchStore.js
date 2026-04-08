import { create } from "zustand";

export const useSearchStore = create((set, get) => ({
  selectedTask: null,  // Task selected from search to edit
  isModalOpen: false,   // Whether to show edit modal
  showRestoreConfirm: false, // Whether to show restore confirmation
  
  selectTask: (task) => {
    // If task is archived, show confirmation first
    if (task.archived) {
      set({ selectedTask: task, showRestoreConfirm: true, isModalOpen: false });
    } else {
      // If not archived, open edit modal directly
      set({ selectedTask: task, isModalOpen: true, showRestoreConfirm: false });
    }
  },
  closeModal: () => set({ selectedTask: null, isModalOpen: false, showRestoreConfirm: false }),
  openModal: () => set({ isModalOpen: true }),
  clearSelection: () => set({ selectedTask: null, isModalOpen: false, showRestoreConfirm: false }),
  confirmRestore: () => {
    // Keep the selectedTask but switch to edit mode
    set({ showRestoreConfirm: false, isModalOpen: true });
  },
  cancelRestore: () => set({ selectedTask: null, showRestoreConfirm: false }),
  
  // Get current selected task
  getSelectedTask: () => get().selectedTask,
}));