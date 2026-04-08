import { create } from 'zustand'

const usePresenceStore = create((set) => ({
  onlineUsers: new Set(),

  setOnline: (userId) => {
    set((state) => {
      const updated = new Set(state.onlineUsers)
      updated.add(userId)
      return { onlineUsers: updated }
    })
  },

  setOffline: (userId) => {
    set((state) => {
      const updated = new Set(state.onlineUsers)
      updated.delete(userId)
      return { onlineUsers: updated }
    })
  },

  setMultipleOnline: (userIds) => {
    set({ onlineUsers: new Set(userIds) })
  },

  isOnline: (userId) => {
    // called outside component — use getState
    return usePresenceStore.getState().onlineUsers.has(userId)
  },
}))

export default usePresenceStore