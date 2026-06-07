import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let counter = 0

  function push({ message, type = 'info', duration = 4000 }) {
    const id = ++counter
    toasts.value.push({ id, message, type })
    setTimeout(() => remove(id), duration)
  }

  function remove(id) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  const success = (msg) => push({ message: msg, type: 'success' })
  const error = (msg) => push({ message: msg, type: 'error' })
  const warning = (msg) => push({ message: msg, type: 'warning' })
  const info = (msg) => push({ message: msg, type: 'info' })

  return { toasts, push, remove, success, error, warning, info }
})
