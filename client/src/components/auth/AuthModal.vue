<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useRouter } from 'vue-router'

const emit = defineEmits(['close'])
const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const activeTab = ref('login')
const loading = ref(false)
const error = ref('')

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({ name: '', email: '', password: '', role: 'BUYER' })

async function handleLogin() {
  if (!loginForm.email || !loginForm.password) {
    error.value = 'Будь ласка, заповніть всі поля'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await auth.login(loginForm.email, loginForm.password)
    toast.success(`Ласкаво просимо, ${auth.user?.name}!`)
    emit('close')
  } catch (err) {
    error.value = err.response?.data?.error || 'Невірна електронна пошта або пароль'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!registerForm.name || !registerForm.email || !registerForm.password) {
    error.value = 'Будь ласка, заповніть всі поля'
    return
  }
  if (registerForm.password.length < 6) {
    error.value = 'Пароль повинен містити мінімум 6 символів'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await auth.register(registerForm.name, registerForm.email, registerForm.password, registerForm.role)
    toast.success(`Вітаємо, ${auth.user?.name}! Реєстрація успішна.`)
    emit('close')
  } catch (err) {
    error.value = err.response?.data?.error || 'Помилка реєстрації. Спробуйте ще раз.'
  } finally {
    loading.value = false
  }
}

function switchTab(tab) {
  activeTab.value = tab
  error.value = ''
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      @click.self="emit('close')"
    >
      <!-- Modal -->
      <div class="w-full max-w-md bg-bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-slide-up">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 pt-6 pb-0">
          <div>
            <span class="font-brand text-2xl italic text-accent tracking-widest">HANDMADE</span>
            <p class="text-xs text-cream-faint mt-0.5">Маркетплейс унікальних виробів</p>
          </div>
          <button
            @click="emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-cream-faint hover:text-cream hover:bg-bg-surface transition-all duration-200"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 mx-6 mt-6 p-1 bg-bg-surface rounded-xl">
          <button
            @click="switchTab('login')"
            :class="[
              'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              activeTab === 'login'
                ? 'bg-accent text-bg-primary shadow-sm'
                : 'text-cream-muted hover:text-cream'
            ]"
          >
            Увійти
          </button>
          <button
            @click="switchTab('register')"
            :class="[
              'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              activeTab === 'register'
                ? 'bg-accent text-bg-primary shadow-sm'
                : 'text-cream-muted hover:text-cream'
            ]"
          >
            Реєстрація
          </button>
        </div>

        <!-- Forms -->
        <div class="px-6 py-6">
          <!-- Error -->
          <div
            v-if="error"
            class="mb-4 flex items-start gap-2 p-3 bg-status-error/10 border border-status-error/30 rounded-lg"
          >
            <svg class="w-4 h-4 text-status-error mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm text-status-error">{{ error }}</p>
          </div>

          <!-- Login Form -->
          <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="space-y-4" novalidate>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Електронна пошта</label>
              <input
                v-model="loginForm.email"
                type="email"
                placeholder="your@email.com"
                autocomplete="email"
                class="input-field"
                :disabled="loading"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Пароль</label>
              <input
                v-model="loginForm.password"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
                class="input-field"
                :disabled="loading"
              />
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ loading ? 'Вхід...' : 'Увійти' }}
            </button>
          </form>

          <!-- Register Form -->
          <form v-else @submit.prevent="handleRegister" class="space-y-4" novalidate>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Ім'я</label>
              <input
                v-model="registerForm.name"
                type="text"
                placeholder="Ваше ім'я"
                autocomplete="name"
                class="input-field"
                :disabled="loading"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Електронна пошта</label>
              <input
                v-model="registerForm.email"
                type="email"
                placeholder="your@email.com"
                autocomplete="email"
                class="input-field"
                :disabled="loading"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Пароль</label>
              <input
                v-model="registerForm.password"
                type="password"
                placeholder="Мінімум 6 символів"
                autocomplete="new-password"
                class="input-field"
                :disabled="loading"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Тип акаунту</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="registerForm.role = 'BUYER'"
                  :class="[
                    'flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all duration-200',
                    registerForm.role === 'BUYER'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-cream-muted hover:border-accent/50'
                  ]"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  Покупець
                </button>
                <button
                  type="button"
                  @click="registerForm.role = 'MAKER'"
                  :class="[
                    'flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-all duration-200',
                    registerForm.role === 'MAKER'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-cream-muted hover:border-accent/50'
                  ]"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                  </svg>
                  Майстер
                </button>
              </div>
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ loading ? 'Реєстрація...' : 'Зареєструватись' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
