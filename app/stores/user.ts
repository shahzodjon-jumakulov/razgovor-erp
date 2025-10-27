// stores/user.ts
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as null | { id: string; email: string; role: string },
  }),
  actions: {
    loginMock(role: string) {
      this.user = { id: '1', email: `${role}@example.com`, role }
    },
    logout() {
      this.user = null
    },
  },
  persist: true,
})
