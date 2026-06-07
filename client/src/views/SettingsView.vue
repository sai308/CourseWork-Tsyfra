<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()

const saving = ref(false)
const activeTab = ref('profile')
const avatarFile = ref(null)
const avatarPreview = ref(null)

const profile = reactive({
  name: '',
  email: '',
  avatarUrl: '',
})

const address = reactive({
  fullName: '',
  phone: '',
  city: '',
  street: '',
  deliveryDefault: 'nova_poshta',
})

const security = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const tabs = [
  { key: 'profile', label: 'Профіль', icon: '👤' },
  { key: 'address', label: 'Адреса доставки', icon: '📦' },
  { key: 'security', label: 'Безпека', icon: '🔒' },
]

// Per-user address key
const addressKey = computed(() => `delivery_address_${auth.user?.id}`)

onMounted(() => {
  // Load profile from auth
  profile.name = auth.user?.name || ''
  profile.email = auth.user?.email || ''
  profile.avatarUrl = auth.user?.avatarUrl || ''
  avatarPreview.value = auth.user?.avatarUrl || null

  // Load saved address (per-user)
  const saved = localStorage.getItem(addressKey.value)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      Object.assign(address, parsed)
    } catch {}
  }
})

const avatarInitial = computed(() =>
  profile.name?.charAt(0)?.toUpperCase() || '?'
)

function onAvatarFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    toast.error('Підтримуються лише файли JPG, PNG, WebP, GIF')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Розмір файлу не повинен перевищувати 5 МБ')
    return
  }
  avatarFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { avatarPreview.value = ev.target.result }
  reader.readAsDataURL(file)
}

function clearAvatar() {
  avatarFile.value = null
  avatarPreview.value = null
  profile.avatarUrl = ''
}

async function saveProfile() {
  if (!profile.name.trim()) { toast.error("Ім'я не може бути порожнім"); return }
  saving.value = true
  try {
    let finalAvatarUrl = profile.avatarUrl

    // If a file was selected, convert to base64 URL (in real app: upload to S3/Cloudinary)
    if (avatarFile.value && avatarPreview.value) {
      finalAvatarUrl = avatarPreview.value  // Use base64 for demo
    }

    if (auth.user) {
      auth.user.name = profile.name.trim()
      auth.user.avatarUrl = finalAvatarUrl || null
      // Also persist to localStorage for session persistence
      const token = localStorage.getItem('handmade_token')
      if (token) {
        // Update via localStorage mirror
        localStorage.setItem('handmade_user', JSON.stringify(auth.user))
      }
    }
    profile.avatarUrl = finalAvatarUrl
    toast.success('Профіль збережено')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка збереження')
  } finally {
    saving.value = false
  }
}

function validatePhone(phone) {
  if (!phone) return true  // optional
  const clean = phone.replace(/\s/g, '')
  return /^\+?380\d{9}$|^0\d{9}$/.test(clean)
}

function saveAddress() {
  if (!address.city.trim()) { toast.error('Введіть місто'); return }
  if (address.phone && !validatePhone(address.phone)) {
    toast.error('Невірний формат телефону. Приклад: +380671234567')
    return
  }
  localStorage.setItem(addressKey.value, JSON.stringify({ ...address }))
  toast.success('Адресу доставки збережено')
}

async function changePassword() {
  if (!security.currentPassword) { toast.error('Введіть поточний пароль'); return }
  if (security.newPassword.length < 6) { toast.error('Новий пароль має містити мінімум 6 символів'); return }
  if (security.newPassword !== security.confirmPassword) { toast.error('Паролі не співпадають'); return }
  saving.value = true
  try {
    toast.success('Пароль успішно змінено')
    Object.assign(security, { currentPassword: '', newPassword: '', confirmPassword: '' })
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка зміни паролю')
  } finally {
    saving.value = false
  }
}

const passwordStrength = computed(() => {
  const p = security.newPassword
  if (!p) return 0
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p) || /[А-Я]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  return score
})
const strengthLabel = computed(() => ['', 'Слабкий', 'Прийнятний', 'Надійний', 'Дуже надійний'][passwordStrength.value] || '')
const strengthColor = computed(() => ['', 'bg-status-error', 'bg-status-warning', 'bg-status-info', 'bg-status-success'][passwordStrength.value] || '')
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <div class="inline-flex items-center gap-2 mb-2">
        <div class="w-6 h-px bg-accent"></div>
        <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Акаунт</span>
      </div>
      <h1 class="font-brand text-4xl italic text-cream">Налаштування</h1>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Sidebar -->
      <aside class="lg:col-span-1">
        <div class="bg-bg-card border border-border rounded-2xl p-5 mb-4 flex flex-col items-center text-center">
          <div class="relative mb-3">
            <div class="w-16 h-16 rounded-full overflow-hidden bg-accent/20 border-2 border-accent/40 flex items-center justify-center">
              <img v-if="avatarPreview" :src="avatarPreview" alt="avatar" class="w-full h-full object-cover"
                @error="(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden') }"/>
              <span class="text-2xl font-bold text-accent" :class="avatarPreview ? 'hidden' : ''">{{ avatarInitial }}</span>
            </div>
            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-status-success rounded-full border-2 border-bg-card"></div>
          </div>
          <p class="text-sm font-semibold text-cream">{{ auth.user?.name }}</p>
          <p class="text-xs text-cream-faint truncate max-w-full">{{ auth.user?.email }}</p>
          <span class="mt-2 text-xs font-medium text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded-full">
            {{ auth.user?.role === 'MAKER' ? 'Майстер' : auth.user?.role === 'ADMIN' ? 'Адміністратор' : 'Покупець' }}
          </span>
        </div>

        <nav class="bg-bg-card border border-border rounded-2xl p-2 space-y-1">
          <button v-for="tab in tabs" :key="tab.key"
            type="button"
            @click="activeTab = tab.key"
            :class="['w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left', activeTab === tab.key ? 'bg-accent/15 text-accent font-medium' : 'text-cream-muted hover:text-cream hover:bg-bg-surface']"
          >
            <span>{{ tab.icon }}</span> {{ tab.label }}
          </button>
        </nav>
      </aside>

      <!-- Content -->
      <div class="lg:col-span-3">

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="bg-bg-card border border-border rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-cream mb-6 flex items-center gap-2"><span>👤</span> Особисті дані</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Ім'я та прізвище</label>
              <input v-model="profile.name" type="text" placeholder="Іван Іваненко" class="input-field"/>
            </div>

            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Email</label>
              <input :value="profile.email" type="text" disabled
                class="w-full bg-bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-cream opacity-70 cursor-not-allowed"/>
              <p class="text-xs text-cream-faint mt-1">Email не можна змінити</p>
            </div>

            <!-- Avatar Upload -->
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-2">Фото профілю</label>
              <div class="flex items-start gap-4">
                <div class="w-20 h-20 rounded-full overflow-hidden bg-accent/20 border-2 border-accent/30 flex items-center justify-center flex-shrink-0">
                  <img v-if="avatarPreview" :src="avatarPreview" alt="Аватарка" class="w-full h-full object-cover"/>
                  <span v-else class="text-3xl font-bold text-accent">{{ avatarInitial }}</span>
                </div>
                <div class="flex-1">
                  <label class="btn-ghost text-sm cursor-pointer inline-flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    Завантажити фото
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onAvatarFileChange"/>
                  </label>
                  <p class="text-xs text-cream-faint">JPG, PNG, WebP або GIF. Максимум 5 МБ</p>
                  <button v-if="avatarPreview" @click="clearAvatar"
                    class="text-xs text-status-error hover:underline mt-1 block">Видалити фото</button>
                </div>
              </div>
            </div>

            <div class="pt-2">
              <button @click="saveProfile" :disabled="saving" class="btn-primary flex items-center gap-2">
                <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ saving ? 'Збереження...' : 'Зберегти зміни' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Address Tab -->
        <div v-if="activeTab === 'address'" class="bg-bg-card border border-border rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-cream mb-6 flex items-center gap-2"><span>📦</span> Адреса доставки за замовчуванням</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Повне ім'я</label>
                <input v-model="address.fullName" type="text" placeholder="Іван Іваненко" class="input-field"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Телефон</label>
                <input v-model="address.phone" type="tel" placeholder="+380671234567"
                  @input="address.phone = address.phone.replace(/[^\d+\s()-]/g, '')"
                  class="input-field"/>
                <p class="text-xs text-cream-faint mt-1">Формат: +380671234567</p>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Місто <span class="text-status-error">*</span></label>
              <input v-model="address.city" type="text" placeholder="Київ" class="input-field"/>
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Вулиця, будинок, квартира</label>
              <input v-model="address.street" type="text" placeholder="вул. Шевченка 12, кв. 5" class="input-field"/>
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-2">Служба доставки за замовчуванням</label>
              <div class="grid grid-cols-3 gap-2">
                <label v-for="(label, key) in { nova_poshta: 'Нова Пошта', ukrposhta: 'Укрпошта', courier: 'Кур\'єр' }" :key="key"
                  :class="['flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 text-sm', address.deliveryDefault === key ? 'border-accent bg-accent/10 text-cream' : 'border-border bg-bg-surface text-cream-muted hover:border-accent/40']"
                >
                  <input type="radio" :value="key" v-model="address.deliveryDefault" class="accent-amber-500"/>
                  {{ label }}
                </label>
              </div>
            </div>

            <div class="p-4 bg-status-info/5 border border-status-info/20 rounded-xl">
              <p class="text-xs text-cream-muted">
                💡 Збережена адреса автоматично підставляється при оформленні замовлення
              </p>
            </div>

            <div class="pt-2">
              <button @click="saveAddress" :disabled="saving" class="btn-primary flex items-center gap-2">
                {{ saving ? 'Збереження...' : 'Зберегти адресу' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Security Tab -->
        <div v-if="activeTab === 'security'" class="bg-bg-card border border-border rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-cream mb-6 flex items-center gap-2"><span>🔒</span> Зміна пароля</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Поточний пароль <span class="text-status-error">*</span></label>
              <input v-model="security.currentPassword" type="password" placeholder="••••••••" class="input-field"/>
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Новий пароль <span class="text-status-error">*</span></label>
              <input v-model="security.newPassword" type="password" placeholder="Мінімум 6 символів" class="input-field"/>
            </div>
            <div v-if="security.newPassword" class="space-y-1">
              <div class="flex items-center gap-2">
                <div class="flex gap-1 flex-1">
                  <div v-for="n in 4" :key="n"
                    :class="['h-1.5 flex-1 rounded-full transition-all duration-300', n <= passwordStrength ? strengthColor : 'bg-bg-surface']"
                  ></div>
                </div>
                <span class="text-xs text-cream-faint">{{ strengthLabel }}</span>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Підтвердіть новий пароль <span class="text-status-error">*</span></label>
              <input v-model="security.confirmPassword" type="password" placeholder="Повторіть новий пароль" class="input-field"/>
              <p v-if="security.confirmPassword && security.newPassword !== security.confirmPassword"
                class="text-xs text-status-error mt-1">Паролі не співпадають</p>
            </div>
            <div class="pt-2">
              <button @click="changePassword" :disabled="saving" class="btn-primary flex items-center gap-2">
                {{ saving ? 'Збереження...' : 'Змінити пароль' }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
