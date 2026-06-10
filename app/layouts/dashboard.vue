<script setup lang="ts">
const sidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-screen overflow-hidden" style="background: var(--surface-2)">

    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 lg:hidden"
        style="background: rgba(0,0,0,0.6); backdrop-filter: blur(2px)"
        @click="sidebarOpen = false"
      />
    </Transition>

    <AppSidebar :mobile-open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 overflow-auto p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
