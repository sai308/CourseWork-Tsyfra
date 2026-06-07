<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import AuthModal from '@/components/auth/AuthModal.vue'
import axios from 'axios'

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const toast = useToastStore()
const showAuthModal = ref(false)

const submitting = ref(false)
const step = ref(1)

const form = ref({
  fullName: '',
  phone: '',
  city: '',
  address: '',
  deliveryMethod: 'nova_poshta',
  paymentMethod: 'on_delivery',
  comment: ''
})

// Load saved address from settings
onMounted(() => {
  if (cart.items.length === 0) {
    router.push('/catalog')
    return
  }

  // Pre-fill from saved address
  const saved = localStorage.getItem(`delivery_address_${auth.user?.id}`)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      form.value.fullName = parsed.fullName || auth.user?.name || ''
      form.value.phone = parsed.phone || ''
      form.value.city = parsed.city || ''
      form.value.address = parsed.street || ''
      form.value.deliveryMethod = parsed.deliveryDefault || 'nova_poshta'
    } catch {}
  } else {
    form.value.fullName = auth.user?.name || ''
  }
})

const DELIVERY_LABELS = {
  nova_poshta: 'Нова Пошта',
  ukrposhta: 'Укрпошта',
  courier: "Кур'єр (по місту)"
}

const PAYMENT_LABELS = {
  on_delivery: 'Оплата при отриманні',
  card_online: 'Банківська картка онлайн',
  monobank: 'Monobank (QR-код)'
}

const fmtPrice = (v) =>
  new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(v || 0)

const totalPrice = computed(() =>
  cart.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
)

function validatePhone(phone) {
  const clean = phone.replace(/\s/g, '')
  return /^\+?380\d{9}$|^0\d{9}$/.test(clean)
}

function validateStep1() {
  if (!form.value.fullName.trim()) { toast.error("Введіть ваше ім'я"); return false }
  if (!form.value.phone.trim()) { toast.error('Введіть номер телефону'); return false }
  if (!validatePhone(form.value.phone)) {
    toast.error("Невірний формат телефону. Приклад: +380671234567 або 0671234567")
    return false
  }
  if (!form.value.city.trim()) { toast.error('Введіть місто'); return false }
  if (!form.value.address.trim() && form.value.deliveryMethod !== 'courier') {
    toast.error('Введіть номер відділення або адресу')
    return false
  }
  return true
}

function goToPayment() {
  if (validateStep1()) step.value = 2
}

async function placeOrder() {
  submitting.value = true
  try {
    // Use productId (not id) and quantity (not qty)
    const items = cart.items
      .filter(item => item.productId)
      .map(item => ({ productId: item.productId, quantity: item.quantity }))

    if (items.length === 0) {
      toast.error('Кошик порожній або товари не мають ідентифікаторів')
      return
    }

    await axios.post('/api/orders', { items })
    cart.clear()
    step.value = 3
  } catch (err) {
    const msg = err.response?.data?.error || 'Помилка оформлення замовлення. Спробуйте ще раз.'
    toast.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Not authenticated wall -->
    <div v-if="!auth.isAuthenticated" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-6">
        <svg class="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
      </div>
      <h1 class="font-brand text-4xl italic text-cream mb-3">Потрібна авторизація</h1>
      <p class="text-cream-muted mb-2 max-w-sm">Щоб оформити замовлення, увійдіть в акаунт або зареєструйтесь — це займе лише хвилину.</p>
      <div class="flex gap-3 mt-6">
        <button @click="showAuthModal = true" class="btn-primary px-6 py-3 text-base">
          Увійти / Зареєструватись
        </button>
        <button @click="router.push('/catalog')" class="btn-ghost">
          До каталогу
        </button>
      </div>
      <AuthModal v-if="showAuthModal" @close="showAuthModal = false" />
    </div>

    <!-- Success State -->
    <div v-else-if="step === 3" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-20 h-20 rounded-full bg-status-success/20 border-2 border-status-success flex items-center justify-center mb-6">
        <svg class="w-10 h-10 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h1 class="font-brand text-4xl italic text-cream mb-3">Замовлення прийнято!</h1>
      <p class="text-cream-muted mb-2">Дякуємо за покупку. Майстер отримав сповіщення і скоро зв'яжеться з вами.</p>
      <p class="text-sm text-cream-faint mb-8">Відстежуйте статус у розділі "Мої замовлення"</p>
      <div class="flex gap-3">
        <button @click="router.push('/orders')" class="btn-primary">Мої замовлення</button>
        <button @click="router.push('/catalog')" class="btn-ghost">До каталогу</button>
      </div>
    </div>

    <template v-else-if="auth.isAuthenticated">
      <!-- Header -->
      <div class="mb-8">
        <button @click="router.back()" class="flex items-center gap-2 text-sm text-cream-muted hover:text-accent mb-4 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Назад
        </button>
        <div class="inline-flex items-center gap-2 mb-2">
          <div class="w-6 h-px bg-accent"></div>
          <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Оформлення</span>
        </div>
        <h1 class="font-brand text-4xl italic text-cream">Оформлення замовлення</h1>
      </div>

      <!-- Progress Steps -->
      <div class="flex items-center gap-4 mb-10">
        <div v-for="(label, i) in ['Доставка', 'Оплата']" :key="i" class="flex items-center gap-2">
          <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300', step > i+1 ? 'bg-status-success text-white' : step === i+1 ? 'bg-accent text-bg-primary' : 'bg-bg-surface text-cream-faint border border-border']">
            <svg v-if="step > i+1" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            <span v-else>{{ i+1 }}</span>
          </div>
          <span :class="['text-sm font-medium', step === i+1 ? 'text-cream' : step > i+1 ? 'text-status-success' : 'text-cream-faint']">{{ label }}</span>
          <div v-if="i < 1" class="w-12 h-px bg-border mx-1"></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Form -->
        <div class="lg:col-span-2">

          <!-- Step 1: Delivery -->
          <div v-if="step === 1" class="bg-bg-card border border-border rounded-2xl p-6 space-y-5">
            <h2 class="text-lg font-semibold text-cream flex items-center gap-2"><span class="text-2xl">🚚</span> Дані доставки</h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Повне ім'я <span class="text-status-error">*</span></label>
                <input v-model="form.fullName" type="text" placeholder="Іван Іваненко" class="input-field"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Телефон <span class="text-status-error">*</span></label>
                <input v-model="form.phone" type="tel" placeholder="+380671234567"
                  @input="form.phone = form.phone.replace(/[^\d+\s()-]/g, '')"
                  class="input-field"/>
                <p class="text-xs text-cream-faint mt-1">Формат: +380671234567 або 0671234567</p>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Місто <span class="text-status-error">*</span></label>
              <input v-model="form.city" type="text" placeholder="Київ" class="input-field"/>
            </div>

            <div>
              <label class="block text-xs font-medium text-cream-muted mb-2">Спосіб доставки <span class="text-status-error">*</span></label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label v-for="(label, key) in DELIVERY_LABELS" :key="key"
                  :class="['flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200', form.deliveryMethod === key ? 'border-accent bg-accent/10' : 'border-border bg-bg-surface hover:border-accent/40']"
                >
                  <input type="radio" :value="key" v-model="form.deliveryMethod" class="accent-amber-500"/>
                  <span class="text-sm text-cream">{{ label }}</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">
                {{ form.deliveryMethod === 'courier' ? 'Адреса доставки' : 'Номер відділення або адреса' }}
                <span v-if="form.deliveryMethod !== 'courier'" class="text-status-error">*</span>
              </label>
              <input v-model="form.address" type="text"
                :placeholder="form.deliveryMethod === 'courier' ? 'вул. Хрещатик, 1, кв. 5' : 'Відділення №47 / вул. Шевченка 12'"
                class="input-field"/>
            </div>

            <div>
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Коментар до замовлення</label>
              <textarea v-model="form.comment" rows="2" placeholder="Побажання, час доставки..." class="input-field resize-none"></textarea>
            </div>

            <button @click="goToPayment" class="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2">
              Перейти до оплати
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <!-- Step 2: Payment -->
          <div v-if="step === 2" class="bg-bg-card border border-border rounded-2xl p-6 space-y-5">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-cream flex items-center gap-2"><span class="text-2xl">💳</span> Оплата</h2>
              <button @click="step = 1" class="text-sm text-accent hover:text-accent-light transition-colors">← Змінити доставку</button>
            </div>

            <div class="p-4 bg-bg-surface border border-border rounded-xl text-sm">
              <p class="text-cream-muted mb-1">Доставка: <span class="text-cream">{{ DELIVERY_LABELS[form.deliveryMethod] }}</span></p>
              <p class="text-cream-muted mb-1">Отримувач: <span class="text-cream">{{ form.fullName }}</span></p>
              <p class="text-cream-muted mb-1">Телефон: <span class="text-cream">{{ form.phone }}</span></p>
              <p class="text-cream-muted">Адреса: <span class="text-cream">{{ form.city }}{{ form.address ? ', ' + form.address : '' }}</span></p>
            </div>

            <div>
              <label class="block text-xs font-medium text-cream-muted mb-2">Спосіб оплати <span class="text-status-error">*</span></label>
              <div class="space-y-2">
                <label v-for="(label, key) in PAYMENT_LABELS" :key="key"
                  :class="['flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200', form.paymentMethod === key ? 'border-accent bg-accent/10' : 'border-border bg-bg-surface hover:border-accent/40']"
                >
                  <input type="radio" :value="key" v-model="form.paymentMethod" class="accent-amber-500"/>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-cream">{{ label }}</p>
                    <p class="text-xs text-cream-faint mt-0.5">
                      {{ key === 'on_delivery' ? "Готівкою або карткою кур'єру / на пошті" : key === 'card_online' ? 'Через захищений платіжний шлюз' : 'Скануйте QR-код у застосунку Monobank' }}
                    </p>
                  </div>
                  <span class="text-xl">{{ key === 'on_delivery' ? '🏧' : key === 'card_online' ? '💳' : '📱' }}</span>
                </label>
              </div>
            </div>

            <button @click="placeOrder" :disabled="submitting"
              class="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
              <svg v-if="submitting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ submitting ? 'Оформляємо...' : 'Підтвердити замовлення' }}
            </button>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="bg-bg-card border border-border rounded-2xl p-5 sticky top-20">
            <h3 class="text-base font-semibold text-cream mb-4">Ваше замовлення</h3>
            <div class="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
              <div v-for="item in cart.items" :key="item.productId" class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg overflow-hidden bg-bg-surface flex-shrink-0">
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="w-full h-full object-cover"/>
                  <div v-else class="w-full h-full flex items-center justify-center text-cream-faint text-lg">📦</div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-cream truncate">{{ item.name }}</p>
                  <p class="text-xs text-cream-faint">{{ item.quantity }} × {{ fmtPrice(item.price) }}</p>
                </div>
                <span class="text-sm font-semibold text-accent flex-shrink-0">{{ fmtPrice(item.price * item.quantity) }}</span>
              </div>
            </div>

            <div class="border-t border-border pt-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-cream-muted">Товарів:</span>
                <span class="text-cream">{{ cart.itemCount }} шт.</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-cream-muted">Доставка:</span>
                <span class="text-status-success text-sm font-medium">Безкоштовно</span>
              </div>
              <div class="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span class="text-cream">Разом:</span>
                <span class="text-accent text-lg">{{ fmtPrice(totalPrice) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
