<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useProductsStore } from '@/stores/products'
import AuthModal from '@/components/auth/AuthModal.vue'

const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const productsStore = useProductsStore()

const showAuthModal = ref(false)
const showUserDropdown = ref(false)
const searchQuery = ref('')
let debounceTimer = null

function onSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    productsStore.filters.search = searchQuery.value
    productsStore.filters.page = 1
    productsStore.fetchProducts()
    if (router.currentRoute.value.name !== 'catalog') {
      router.push('/catalog')
    }
  }, 400)
}

function openCart() {
  cart.isOpen = true
}

function toggleDropdown() {
  if (auth.isAuthenticated) {
    showUserDropdown.value = !showUserDropdown.value
  } else {
    showAuthModal.value = true
  }
}

function closeDropdown() {
  showUserDropdown.value = false
}

function logout() {
  auth.logout()
  showUserDropdown.value = false
  router.push('/')
}

function goToDashboard() {
  showUserDropdown.value = false
  if (auth.isAdmin) {
    router.push('/admin')
  } else {
    router.push('/dashboard')
  }
}

async function scrollToSection(sectionId) {
  if (router.currentRoute.value.path !== '/') {
    await router.push('/')
    // Wait for DOM render after navigation
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  } else {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function goToOrders() {
  showUserDropdown.value = false
  router.push('/orders')
}

function goToAdmin() {
  showUserDropdown.value = false
  router.push('/admin')
}

const roleLabel = computed(() => {
  if (auth.isAdmin) return 'Адміністратор'
  if (auth.isMaker) return 'Майстер'
  return 'Покупець'
})

const roleColor = computed(() => {
  if (auth.isAdmin) return 'text-status-error bg-status-error/10 border-status-error/30'
  if (auth.isMaker) return 'text-accent bg-accent/10 border-accent/30'
  return 'text-status-info bg-status-info/10 border-status-info/30'
})
</script>

<template>
  <header class="sticky top-0 z-40 backdrop-blur-md bg-bg-primary/80 border-b border-border">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-4 h-16">

        <!-- Brand Logo -->
        <RouterLink to="/" class="flex-shrink-0 flex flex-col items-start group">
          <span class="font-brand text-2xl italic tracking-widest text-accent transition-colors duration-200 group-hover:text-accent-light leading-none">
            HANDMADE
          </span>
          <div class="w-full h-px bg-gradient-to-r from-accent/60 to-transparent mt-0.5"></div>
        </RouterLink>

        <!-- Desktop Nav -->
        <nav class="hidden lg:flex items-center gap-1 ml-4">
          <RouterLink
            to="/catalog"
            class="px-4 py-2 text-sm font-medium text-cream-muted hover:text-cream rounded-lg hover:bg-bg-surface transition-all duration-200"
            active-class="text-cream bg-bg-surface"
          >
            Каталог
          </RouterLink>
          <button
            @click="scrollToSection('about')"
            class="px-4 py-2 text-sm font-medium text-cream-muted hover:text-cream rounded-lg hover:bg-bg-surface transition-all duration-200"
          >
            Про нас
          </button>
          <button
            @click="scrollToSection('contact')"
            class="px-4 py-2 text-sm font-medium text-cream-muted hover:text-cream rounded-lg hover:bg-bg-surface transition-all duration-200"
          >
            Контакти
          </button>
        </nav>

        <!-- Search Input -->
        <div class="flex-1 min-w-0 mx-4">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              v-model="searchQuery"
              @input="onSearch"
              type="text"
              placeholder="Пошук виробів..."
              class="w-full bg-bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-cream placeholder-cream-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200"
            />
          </div>
        </div>

        <!-- Right Icons -->
        <div class="flex items-center gap-2 flex-shrink-0">

          <!-- Cart Button -->
          <button
            @click="openCart"
            class="relative flex items-center justify-center w-10 h-10 rounded-lg text-cream-muted hover:text-cream hover:bg-bg-surface transition-all duration-200"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <span
              v-if="cart.itemCount > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-accent text-bg-primary text-xs font-bold rounded-full flex items-center justify-center leading-none"
            >
              {{ cart.itemCount > 9 ? '9+' : cart.itemCount }}
            </span>
          </button>

          <!-- User Button -->
          <div class="relative">
            <button
              @click="toggleDropdown"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-cream-muted hover:text-cream hover:bg-bg-surface transition-all duration-200"
            >
              <div class="w-8 h-8 rounded-full bg-bg-surface border border-border flex items-center justify-center overflow-hidden">
                <span v-if="auth.isAuthenticated && auth.user?.name" class="text-sm font-semibold text-accent">
                  {{ auth.user.name.charAt(0).toUpperCase() }}
                </span>
                <svg v-else class="w-4 h-4 text-cream-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <span v-if="auth.isAuthenticated" class="hidden lg:block text-sm font-medium text-cream truncate max-w-24">
                {{ auth.user?.name }}
              </span>
            </button>

            <!-- User Dropdown -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-2"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-2"
            >
              <div
                v-if="showUserDropdown"
                class="absolute right-0 top-full mt-2 w-64 bg-bg-card border border-border rounded-xl shadow-xl shadow-black/40 overflow-hidden z-50 animate-fade-in"
              >
                <!-- User Info -->
                <div class="p-4 border-b border-border">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
                      <span class="text-lg font-bold text-accent">{{ auth.user?.name?.charAt(0)?.toUpperCase() }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-cream truncate">{{ auth.user?.name }}</p>
                      <p class="text-xs text-cream-muted truncate">{{ auth.user?.email }}</p>
                    </div>
                  </div>
                  <span :class="['mt-3 inline-block text-xs font-medium border px-2 py-0.5 rounded-full', roleColor]">
                    {{ roleLabel }}
                  </span>
                </div>

                <!-- Menu Items -->
                <div class="p-2">
                  <button
                    v-if="auth.isMaker || auth.isAdmin"
                    @click="goToDashboard"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cream-muted hover:text-cream hover:bg-bg-surface rounded-lg transition-all duration-200 text-left"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                    Панель управління
                  </button>
                  <button
                    v-if="auth.isAdmin"
                    @click="goToAdmin"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cream-muted hover:text-cream hover:bg-bg-surface rounded-lg transition-all duration-200 text-left"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    Адміністрування
                  </button>
                  <button
                    @click="goToOrders"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cream-muted hover:text-cream hover:bg-bg-surface rounded-lg transition-all duration-200 text-left"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    Мої замовлення
                  </button>
                  <button
                    @click="() => { showUserDropdown = false; router.push('/settings') }"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cream-muted hover:text-cream hover:bg-bg-surface rounded-lg transition-all duration-200 text-left"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    Налаштування
                  </button>

                  <div class="my-1 border-t border-border"></div>

                  <button
                    @click="logout"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-status-error hover:bg-status-error/10 rounded-lg transition-all duration-200 text-left"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Вийти
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Auth Modal -->
  <AuthModal v-if="showAuthModal" @close="showAuthModal = false" />

  <!-- Click outside overlay (invisible) -->
  <div
    v-if="showUserDropdown"
    class="fixed inset-0 z-30"
    @click="closeDropdown"
  ></div>
</template>
