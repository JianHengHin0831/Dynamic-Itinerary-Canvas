// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_KEY,
      apiBaseUrl: process.env.API_BASE_URL,
    },
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxtjs/supabase", "@nuxt/icon"],
  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: [],
    },
  },
});
