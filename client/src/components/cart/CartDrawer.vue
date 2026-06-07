<script setup>
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useRouter } from 'vue-router'

const cart = useCartStore()
const router = useRouter()

function handleCheckout() {
  cart.isOpen = false
  router.push('/checkout')
}

const formattedTotal = computed(() => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0
  }).format(cart.total)
})

function formattedItemPrice(item) {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0
  }).format(item.price * item.quantity)
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="cart.isOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        @click="cart.isOpen = false"
      ></div>
    </Transition>

    <!-- Drawer -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="cart.isOpen"
        class="fixed right-0 top-0 h-full w-full sm:w-96 bg-bg-card border-l border-border z-50 flex flex-col shadow-2xl shadow-black/50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <h2 class="text-lg font-semibold text-cream">Кошик</h2>
            <span v-if="cart.itemCount > 0" class="text-xs font-medium bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
              {{ cart.itemCount }}
            </span>
          </div>
          <button
            @click="cart.isOpen = false"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-cream-faint hover:text-cream hover:bg-bg-surface transition-all duration-200"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto">
          <!-- Empty State -->
          <div v-if="!cart.items.length" class="flex flex-col items-center justify-center h-full text-center px-6">
            <div class="w-16 h-16 rounded-2xl bg-bg-surface border border-border flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-cream-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </div>
            <h3 class="text-base font-semibold text-cream mb-2">Кошик порожній</h3>
            <p class="text-sm text-cream-muted mb-6">Додайте товари з каталогу</p>
            <button
              @click="cart.isOpen = false; $router.push('/catalog')"
              class="btn-primary text-sm"
            >
              Перейти до каталогу
            </button>
          </div>

          <!-- Items List -->
          <div v-else class="p-4 space-y-3">
            <TransitionGroup name="cart-item" tag="div" class="space-y-3">
              <div
                v-for="item in cart.items"
                :key="item.productId"
                class="flex gap-3 p-3 bg-bg-surface border border-border rounded-xl"
              >
                <!-- Image -->
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-bg-card flex-shrink-0">
                  <img
                    v-if="item.imageUrl"
                    :src="item.imageUrl"
                    :alt="item.name"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-cream-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-cream leading-snug mb-1 line-clamp-2">{{ item.name }}</p>
                  <p class="text-sm font-bold text-accent">{{ new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(item.price * (item.qty || item.quantity)) }}</p>
                  <p class="text-xs text-cream-faint">{{ item.price }} грн × {{ item.qty || item.quantity }}</p>
                </div>

                <!-- Controls -->
                <div class="flex flex-col items-end gap-2 flex-shrink-0">
                  <button
                    @click="cart.removeItem(item.productId)"
                    class="w-6 h-6 flex items-center justify-center text-cream-faint hover:text-status-error transition-colors duration-200"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>

                  <div class="flex items-center gap-1">
                    <button
                      @click="cart.updateQuantity(item.id || item.productId, (item.qty || item.quantity) - 1)"
                      class="w-7 h-7 flex items-center justify-center rounded-lg bg-bg-card border border-border text-cream-muted hover:border-accent hover:text-accent transition-all duration-200 text-sm font-bold"
                    >−</button>
                    <span class="w-6 text-center text-sm font-semibold text-cream">{{ item.qty || item.quantity }}</span>
                    <button
                      @click="cart.updateQuantity(item.id || item.productId, (item.qty || item.quantity) + 1)"
                      :disabled="(item.qty || item.quantity) >= item.stock"
                      class="w-7 h-7 flex items-center justify-center rounded-lg bg-bg-card border border-border text-cream-muted hover:border-accent hover:text-accent transition-all duration-200 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                    >+</button>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="cart.items.length" class="border-t border-border px-6 py-4 space-y-4 flex-shrink-0">
          <div class="flex items-center justify-between">
            <span class="text-sm text-cream-muted">Разом:</span>
            <span class="text-xl font-bold text-cream">{{ formattedTotal }}</span>
          </div>
          <button
            @click="handleCheckout"
            class="btn-primary w-full justify-center flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Оформити замовлення
          </button>
          <button
            @click="cart.isOpen = false"
            class="btn-ghost w-full text-center text-sm"
          >
            Продовжити покупки
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.3s ease;
}
.cart-item-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
