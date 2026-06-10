<script setup lang="ts">
const props = defineProps<{
  label: string
  tipoPie: 'DERECHO' | 'IZQUIERDO'
  modelValue?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'upload': [url: string, tipoPie: 'DERECHO' | 'IZQUIERDO']
}>()

const { uploading, uploadImage } = useUpload()
const toast = useToast()
const inputRef = ref<HTMLInputElement>()
const preview = ref(props.modelValue || '')
const dragging = ref(false)

watch(() => props.modelValue, v => { if (v) preview.value = v })

async function processFile(file: File) {
  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!ALLOWED.includes(file.type)) {
    toast.add({ title: 'Formato no permitido', description: 'Use JPG, PNG o WEBP', color: 'red' })
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.add({ title: 'Archivo muy grande', description: 'Máximo 10 MB', color: 'red' })
    return
  }
  try {
    const url = await uploadImage(file)
    preview.value = url
    emit('update:modelValue', url)
    emit('upload', url, props.tipoPie)
    toast.add({ title: 'Imagen cargada', color: 'green' })
  }
  catch {
    toast.add({ title: 'Error al subir imagen', color: 'red' })
  }
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function remove() {
  preview.value = ''
  emit('update:modelValue', '')
  if (inputRef.value) inputRef.value.value = ''
}

const sideLabel = computed(() => props.tipoPie === 'DERECHO' ? 'Pie Derecho' : 'Pie Izquierdo')
const sideColor = computed(() => props.tipoPie === 'DERECHO' ? '#0ea5e9' : '#8b5cf6')
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <div class="w-2.5 h-2.5 rounded-full" :style="`background: ${sideColor}`" />
      <span class="text-sm font-semibold" style="color: var(--text-1)">{{ sideLabel }}</span>
    </div>

    <div
      v-if="preview"
      class="relative rounded-2xl overflow-hidden group"
      style="border: 2px solid var(--surface-border); aspect-ratio: 4/3"
    >
      <img :src="preview" :alt="label" class="w-full h-full object-cover" />
      <div
        class="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
        style="background: rgba(0,0,0,0.55); backdrop-filter: blur(4px)"
      >
        <button
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
          style="background: rgba(14,165,233,0.8)"
          @click="inputRef?.click()"
        >
          <UIcon name="i-heroicons-arrow-path" />
          Reemplazar
        </button>
        <button
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
          style="background: rgba(239,68,68,0.8)"
          @click="remove"
        >
          <UIcon name="i-heroicons-trash" />
          Eliminar
        </button>
      </div>
      <div class="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
           style="background: #10b981">
        <UIcon name="i-heroicons-check" class="text-white text-sm" />
      </div>
    </div>

    <div
      v-else
      class="drop-zone flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-all duration-300 select-none"
      :class="dragging ? 'dragging' : ''"
      style="aspect-ratio: 4/3"
      @dragenter.prevent="dragging = true"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
      @click="inputRef?.click()"
    >
      <div
        class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
        :class="dragging ? 'scale-110' : ''"
        :style="`background: ${sideColor}15; color: ${sideColor}`"
      >
        <UIcon name="i-heroicons-arrow-up-tray" class="text-2xl" />
      </div>
      <div class="text-center">
        <p class="text-sm font-semibold" style="color: var(--text-1)">
          {{ dragging ? 'Suelta aquí...' : 'Arrastra o haz clic' }}
        </p>
        <p class="text-xs mt-0.5" style="color: var(--text-3)">JPG · PNG · WEBP · Máx 10 MB</p>
      </div>
    </div>

    <div v-if="uploading" class="flex items-center gap-2 text-xs font-medium" style="color: #0ea5e9">
      <div class="w-3.5 h-3.5 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
      Procesando imagen...
    </div>

    <input ref="inputRef" type="file" accept=".jpg,.jpeg,.png,.webp" class="hidden" @change="onFileChange" />
  </div>
</template>
