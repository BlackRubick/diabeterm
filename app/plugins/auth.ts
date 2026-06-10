export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) {
    const headers = useRequestHeaders(['cookie'])
    await authStore.fetchMe(headers).catch(() => {})
  }
})
