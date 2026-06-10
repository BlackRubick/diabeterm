export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@pinia/nuxt', '@vueuse/nuxt'],

  css: ['~/assets/css/main.css'],

  colorMode: {
    classSuffix: '',
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'diabeterm-secret-key-change-in-production',
    public: {
      apiBase: '/api',
    },
  },

  nitro: {
    publicAssets: [
      {
        dir: 'public/uploads',
        baseURL: '/uploads',
      },
    ],
  },

  typescript: {
    strict: true,
  },

  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2025-01-01',
})
