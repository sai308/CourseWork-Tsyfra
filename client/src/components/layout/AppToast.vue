<script setup>
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

const typeConfig = {
  success: {
    icon: '✓',
    bg: 'bg-status-success/10',
    border: 'border-status-success/30',
    text: 'text-status-success',
    iconBg: 'bg-status-success/20',
  },
  error: {
    icon: '✕',
    bg: 'bg-status-error/10',
    border: 'border-status-error/30',
    text: 'text-status-error',
    iconBg: 'bg-status-error/20',
  },
  warning: {
    icon: '⚠',
    bg: 'bg-status-warning/10',
    border: 'border-status-warning/30',
    text: 'text-status-warning',
    iconBg: 'bg-status-warning/20',
  },
  info: {
    icon: 'ℹ',
    bg: 'bg-status-info/10',
    border: 'border-status-info/30',
    text: 'text-status-info',
    iconBg: 'bg-status-info/20',
  },
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col gap-3"
      >
        <div
          v-for="t in toast.toasts"
          :key="t.id"
          :class="[
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg shadow-black/30',
            'backdrop-blur-sm pointer-events-auto',
            typeConfig[t.type]?.bg,
            typeConfig[t.type]?.border,
          ]"
        >
          <!-- Icon -->
          <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm', typeConfig[t.type]?.iconBg, typeConfig[t.type]?.text]">
            {{ typeConfig[t.type]?.icon }}
          </div>

          <!-- Message -->
          <p class="flex-1 text-sm text-cream leading-relaxed pt-0.5">{{ t.message }}</p>

          <!-- Close Button -->
          <button
            @click="toast.remove(t.id)"
            class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-cream-faint hover:text-cream transition-colors duration-200"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  animation: slideInRight 0.3s ease-out;
}
.toast-leave-active {
  animation: slideOutRight 0.25s ease-in forwards;
}
.toast-move {
  transition: transform 0.3s ease;
}

@keyframes slideInRight {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes slideOutRight {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(110%); opacity: 0; }
}
</style>
