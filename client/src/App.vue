<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppToast from '@/components/layout/AppToast.vue'
import CartDrawer from '@/components/cart/CartDrawer.vue'

const auth = useAuthStore()
onMounted(() => auth.hydrateSession())
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <AppHeader />
    <main>
      <RouterView />
    </main>
    <CartDrawer />
    <AppToast />
  </div>
</template>
