import { defineStore } from 'pinia'

export interface AuthUser {
  sub: string
  email: string
  role: 'DOCTOR' | 'PATIENT'
  nombre: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isAuthenticated = computed(() => !!user.value)
  const isDoctor = computed(() => user.value?.role === 'DOCTOR')
  const isPatient = computed(() => user.value?.role === 'PATIENT')

  function setUser(u: AuthUser | null) {
    user.value = u
  }

  async function fetchMe(headers?: Record<string, string>) {
    try {
      const { data } = await $fetch<{ success: boolean; data: { user: AuthUser } }>('/api/auth/me', {
        headers: headers ?? {},
      })
      user.value = data.user
    }
    catch {
      user.value = null
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  return { user, isAuthenticated, isDoctor, isPatient, setUser, fetchMe, logout }
})
