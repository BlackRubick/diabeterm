<script setup lang="ts">
const colorMode = useColorMode()
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage :transition="{
        name: 'page',
        mode: 'out-in',
      }" />
    </NuxtLayout>
  </UApp>
</template>
