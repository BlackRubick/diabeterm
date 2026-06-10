<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()

if (authStore.isDoctor) await navigateTo('/dashboard')
else if (authStore.isPatient) await navigateTo('/paciente')
</script>

<template>
  <div />
</template>
