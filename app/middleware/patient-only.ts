export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    const headers = useRequestHeaders(['cookie'])
    await authStore.fetchMe(headers)
  }

  if (!authStore.isAuthenticated) return navigateTo('/login')
  if (!authStore.isPatient) return navigateTo('/dashboard')
})
