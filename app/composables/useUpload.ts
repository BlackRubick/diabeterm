export function useUpload() {
  const uploading = ref(false)

  async function uploadImage(file: File): Promise<string> {
    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await $fetch<{ success: boolean; data: { url: string } }>('/api/upload', {
        method: 'POST',
        body: formData,
      })

      return data.url
    }
    finally {
      uploading.value = false
    }
  }

  return { uploading, uploadImage }
}
