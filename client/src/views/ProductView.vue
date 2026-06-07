<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const toast = useToastStore()

const product = ref(null)
const loading = ref(true)
const error = ref('')
const quantity = ref(1)

// Reviews
const reviews = ref([])
const avgRating = ref(0)
const reviewsLoading = ref(false)
const newReview = ref({ rating: 5, comment: '' })
const submittingReview = ref(false)
const showReviewForm = ref(false)

// Report modal
const showReportModal = ref(false)
const reportForm = ref({ reason: '', description: '' })
const submittingReport = ref(false)

const REPORT_REASONS = [
  'Шахрайство або обман',
  'Неправдива інформація про товар',
  'Образливий або невідповідний контент',
  'Порушення правил майданчика',
  'Підозрілий продавець',
  'Інше',
]

onMounted(async () => {
  await fetchProduct()
  await fetchReviews()
})

async function fetchProduct() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axios.get(`/api/products/${route.params.id}`)
    const p = data.product || data
    p.price = parseFloat(p.price)
    product.value = p
  } catch (err) {
    error.value = err.response?.status === 404
      ? 'Товар не знайдено'
      : 'Помилка завантаження товару'
  } finally {
    loading.value = false
  }
}

async function fetchReviews() {
  reviewsLoading.value = true
  try {
    const { data } = await axios.get(`/api/products/${route.params.id}/reviews`)
    reviews.value = data.reviews || []
    avgRating.value = data.avgRating || 0
  } catch { reviews.value = [] }
  finally { reviewsLoading.value = false }
}

async function submitReview() {
  if (!auth.isAuthenticated) {
    toast.error('Увійдіть в акаунт, щоб залишити відгук')
    return
  }
  if (!newReview.value.comment.trim()) {
    toast.error('Будь ласка, напишіть коментар')
    return
  }
  submittingReview.value = true
  try {
    const { data } = await axios.post(`/api/products/${route.params.id}/reviews`, {
      rating: newReview.value.rating,
      comment: newReview.value.comment.trim()
    })
    reviews.value.unshift(data.review)
    // Recalculate avg
    avgRating.value = parseFloat((reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length).toFixed(1))
    newReview.value = { rating: 5, comment: '' }
    showReviewForm.value = false
    toast.success('Відгук успішно додано!')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка додавання відгуку')
  } finally {
    submittingReview.value = false }
}

async function deleteReview(reviewId) {
  if (!confirm('Видалити ваш відгук?')) return
  try {
    await axios.delete(`/api/products/${route.params.id}/reviews/${reviewId}`)
    reviews.value = reviews.value.filter(r => r.id !== reviewId)
    toast.success('Відгук видалено')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка видалення')
  }
}

async function submitReport() {
  if (!reportForm.value.reason) {
    toast.error('Оберіть причину скарги')
    return
  }
  submittingReport.value = true
  try {
    const { data } = await axios.post('/api/reports', {
      targetType: 'product',
      targetId: route.params.id,
      reason: reportForm.value.reason,
      description: reportForm.value.description,
      productId: route.params.id
    })
    toast.success(data.message || 'Скаргу надіслано!')
    showReportModal.value = false
    reportForm.value = { reason: '', description: '' }
  } catch (err) {
    toast.error(err.response?.data?.error || 'Помилка надсилання скарги')
  } finally {
    submittingReport.value = false }
}

function addToCart() {
  if (!product.value) return
  cart.addItem(product.value, quantity.value)
}

function decrementQty() { if (quantity.value > 1) quantity.value-- }
function incrementQty() { if (product.value && quantity.value < product.value.stock) quantity.value++ }

const stockStatus = computed(() => {
  if (!product.value) return 'ok'
  if (product.value.stock === 0) return 'out'
  if (product.value.stock <= 5) return 'low'
  return 'ok'
})

const formattedPrice = computed(() => {
  if (!product.value) return ''
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(product.value.price)
})

const fmtDate = (d) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
const userAlreadyReviewed = computed(() => reviews.value.some(r => r.user?.id === auth.user?.id))

function starClass(star, rating) {
  return star <= rating ? 'text-amber-400' : 'text-cream-faint/30'
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Back Button -->
    <button @click="router.back()"
      class="flex items-center gap-2 text-sm text-cream-muted hover:text-accent transition-colors duration-200 mb-8 group">
      <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Назад до каталогу
    </button>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
      <div class="h-96 bg-bg-surface rounded-2xl"></div>
      <div class="space-y-4 pt-4">
        <div class="h-6 bg-bg-surface rounded w-1/3"></div>
        <div class="h-10 bg-bg-surface rounded w-2/3"></div>
        <div class="h-4 bg-bg-surface rounded w-full mt-6"></div>
        <div class="h-4 bg-bg-surface rounded w-5/6"></div>
        <div class="h-12 bg-bg-surface rounded w-1/3 mt-6"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-24 text-center">
      <h2 class="text-xl font-semibold text-cream mb-2">{{ error }}</h2>
      <RouterLink to="/catalog" class="btn-primary mt-4">До каталогу</RouterLink>
    </div>

    <!-- Product -->
    <div v-else-if="product">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

        <!-- Image -->
        <div class="relative">
          <div class="aspect-square rounded-2xl overflow-hidden bg-bg-surface border border-border">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="w-full h-full object-cover"/>
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-20 h-20 text-cream-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="flex flex-col gap-5">

          <!-- Category -->
          <span v-if="product.category" class="text-xs font-semibold text-accent uppercase tracking-[0.15em]">
            {{ product.category.name }}
          </span>

          <!-- Name -->
          <h1 class="font-brand text-4xl sm:text-5xl italic text-cream leading-tight">{{ product.name }}</h1>

          <!-- Rating summary -->
          <div v-if="reviews.length > 0" class="flex items-center gap-2">
            <div class="flex">
              <svg v-for="star in 5" :key="star" :class="['w-4 h-4 fill-current', starClass(star, Math.round(avgRating))]" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <span class="text-sm font-semibold text-cream">{{ avgRating }}</span>
            <span class="text-xs text-cream-faint">({{ reviews.length }} відгук{{ reviews.length === 1 ? '' : reviews.length < 5 ? 'и' : 'ів' }})</span>
          </div>

          <!-- Stock -->
          <div>
            <span v-if="stockStatus === 'low'" class="badge-warning">⚡ Залишилось лише {{ product.stock }} шт.</span>
            <span v-else-if="stockStatus === 'out'" class="badge-error">✕ Немає в наявності</span>
            <span v-else class="inline-flex items-center gap-1 text-xs font-medium bg-status-success/15 text-status-success border border-status-success/30 px-2 py-0.5 rounded-full">
              ✓ В наявності · {{ product.stock }} шт.
            </span>
          </div>

          <!-- Price -->
          <div class="flex items-baseline gap-3">
            <span class="text-4xl font-bold text-accent">{{ formattedPrice }}</span>
          </div>

          <!-- Description -->
          <div v-if="product.description" class="border-t border-border pt-5">
            <h3 class="text-sm font-semibold text-cream-muted uppercase tracking-wider mb-3">Опис</h3>
            <p class="text-cream-muted leading-relaxed text-sm">{{ product.description }}</p>
          </div>

          <!-- Quantity -->
          <div v-if="stockStatus !== 'out'" class="flex items-center gap-4">
            <span class="text-sm text-cream-muted">Кількість:</span>
            <div class="flex items-center gap-2">
              <button type="button" @click="decrementQty" :disabled="quantity <= 1"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-cream-muted hover:border-accent hover:text-accent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold">−</button>
              <span class="w-8 text-center text-base font-semibold text-cream">{{ quantity }}</span>
              <button type="button" @click="incrementQty" :disabled="quantity >= product.stock"
                class="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-cream-muted hover:border-accent hover:text-accent transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold">+</button>
            </div>
          </div>

          <!-- Add to Cart -->
          <button @click="addToCart" :disabled="stockStatus === 'out'"
            class="btn-primary flex items-center justify-center gap-3 text-base py-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            {{ stockStatus === 'out' ? 'Немає в наявності' : 'Додати до кошика' }}
          </button>

          <!-- Maker + Report -->
          <div v-if="product.maker" class="border-t border-border pt-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-semibold text-cream-faint uppercase tracking-wider">Майстер</h3>
              <button v-if="auth.isAuthenticated" type="button" @click="showReportModal = true"
                class="flex items-center gap-1.5 text-xs text-cream-faint hover:text-status-error transition-colors duration-200">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                </svg>
                Поскаржитись
              </button>
            </div>
            <div class="flex items-center gap-3 p-4 bg-bg-surface border border-border rounded-xl">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0">
                <img v-if="product.maker.avatarUrl" :src="product.maker.avatarUrl" :alt="product.maker.name" class="w-full h-full object-cover"/>
                <span v-else class="text-base font-bold text-accent">{{ product.maker.name?.charAt(0)?.toUpperCase() }}</span>
              </div>
              <div>
                <p class="text-sm font-semibold text-cream">{{ product.maker.name }}</p>
                <p class="text-xs text-cream-faint">Сертифікований майстер</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ─── REVIEWS SECTION ─── -->
      <div class="border-t border-border pt-12">
        <div class="flex items-center justify-between mb-8">
          <div>
            <div class="inline-flex items-center gap-2 mb-2">
              <div class="w-6 h-px bg-accent"></div>
              <span class="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Думки покупців</span>
            </div>
            <h2 class="font-brand text-3xl italic text-cream">Відгуки
              <span v-if="reviews.length" class="text-cream-faint text-2xl">({{ reviews.length }})</span>
            </h2>
          </div>
          <button v-if="auth.isAuthenticated && !userAlreadyReviewed && !showReviewForm" type="button"
            @click="showReviewForm = true"
            class="btn-primary text-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Написати відгук
          </button>
          <p v-else-if="!auth.isAuthenticated" class="text-xs text-cream-faint">
            <button type="button" class="text-accent underline underline-offset-2">Увійдіть</button>, щоб залишити відгук
          </p>
        </div>

        <!-- New Review Form -->
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
          <div v-if="showReviewForm" class="bg-bg-card border border-accent/30 rounded-2xl p-6 mb-8">
            <h3 class="text-base font-semibold text-cream mb-4">Ваш відгук</h3>

            <!-- Star Rating -->
            <div class="mb-4">
              <label class="block text-xs font-medium text-cream-muted mb-2">Оцінка</label>
              <div class="flex gap-1">
                <button v-for="star in 5" :key="star" type="button" @click="newReview.rating = star"
                  :class="['text-2xl transition-transform hover:scale-110 duration-100', star <= newReview.rating ? 'text-amber-400' : 'text-cream-faint/30']">
                  ★
                </button>
              </div>
            </div>

            <!-- Comment -->
            <div class="mb-4">
              <label class="block text-xs font-medium text-cream-muted mb-1.5">Коментар <span class="text-status-error">*</span></label>
              <textarea v-model="newReview.comment" rows="3" placeholder="Розкажіть про ваш досвід з цим товаром..."
                class="input-field resize-none"></textarea>
            </div>

            <div class="flex gap-3">
              <button type="button" @click="submitReview" :disabled="submittingReview" class="btn-primary text-sm flex items-center gap-2">
                <svg v-if="submittingReview" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ submittingReview ? 'Надсилаємо...' : 'Надіслати відгук' }}
              </button>
              <button type="button" @click="showReviewForm = false" class="btn-ghost text-sm">Скасувати</button>
            </div>
          </div>
        </Transition>

        <!-- Reviews List -->
        <div v-if="reviewsLoading" class="space-y-4">
          <div v-for="n in 2" :key="n" class="h-24 bg-bg-card border border-border rounded-xl animate-pulse"></div>
        </div>

        <div v-else-if="reviews.length === 0" class="text-center py-16 bg-bg-card border border-border rounded-2xl">
          <div class="text-4xl mb-3">💬</div>
          <h3 class="text-base font-semibold text-cream mb-1">Відгуків ще немає</h3>
          <p class="text-sm text-cream-faint">Будьте першими, хто поділиться враженнями!</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="review in reviews" :key="review.id"
            class="bg-bg-card border border-border rounded-xl p-5">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full overflow-hidden bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                  <img v-if="review.user?.avatarUrl" :src="review.user.avatarUrl" :alt="review.user.name" class="w-full h-full object-cover"/>
                  <span v-else class="text-sm font-bold text-accent">{{ review.user?.name?.charAt(0)?.toUpperCase() }}</span>
                </div>
                <div>
                  <p class="text-sm font-semibold text-cream">{{ review.user?.name }}</p>
                  <p class="text-xs text-cream-faint">{{ fmtDate(review.createdAt) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex">
                  <svg v-for="star in 5" :key="star" :class="['w-3.5 h-3.5 fill-current', starClass(star, review.rating)]" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <button v-if="review.user?.id === auth.user?.id || auth.isAdmin" type="button"
                  @click="deleteReview(review.id)"
                  class="text-xs text-cream-faint hover:text-status-error transition-colors duration-200 ml-1">✕</button>
              </div>
            </div>
            <p class="text-sm text-cream-muted leading-relaxed">{{ review.comment }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── REPORT MODAL ─── -->
    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100">
        <div v-if="showReportModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showReportModal = false">
          <div class="w-full max-w-md bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 class="text-base font-semibold text-cream flex items-center gap-2">
                <svg class="w-4 h-4 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                </svg>
                Поскаржитись на товар
              </h3>
              <button type="button" @click="showReportModal = false" class="w-8 h-8 flex items-center justify-center rounded-lg text-cream-faint hover:text-cream hover:bg-bg-surface transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-2">Причина скарги <span class="text-status-error">*</span></label>
                <div class="space-y-2">
                  <label v-for="reason in REPORT_REASONS" :key="reason"
                    :class="['flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 text-sm', reportForm.reason === reason ? 'border-status-error/50 bg-status-error/5 text-cream' : 'border-border bg-bg-surface text-cream-muted hover:border-border/80']">
                    <input type="radio" :value="reason" v-model="reportForm.reason" class="accent-red-500"/>
                    {{ reason }}
                  </label>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-cream-muted mb-1.5">Детальний опис (необов'язково)</label>
                <textarea v-model="reportForm.description" rows="3" placeholder="Додаткові деталі про порушення..." class="input-field resize-none"></textarea>
              </div>
              <div class="flex gap-3 pt-1">
                <button type="button" @click="showReportModal = false" class="btn-ghost flex-1 text-sm">Скасувати</button>
                <button type="button" @click="submitReport" :disabled="submittingReport"
                  class="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-status-error/80 hover:bg-status-error border border-status-error/50 rounded-xl transition-all duration-200 disabled:opacity-50">
                  {{ submittingReport ? 'Надсилаємо...' : 'Надіслати скаргу' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>
