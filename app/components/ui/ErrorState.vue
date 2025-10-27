<script setup lang="ts">
import { Button } from '~/components/ui/button'

interface Props {
  title?: string
  message: string
  showRetry?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Error',
  showRetry: true
})

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="text-center">
      <div class="text-red-600 mb-2">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-1">{{ title }}</h3>
      <p class="text-sm text-gray-500 mb-4">{{ message }}</p>
      <Button 
        v-if="showRetry"
        @click="emit('retry')"
        class="inline-flex items-center"
      >
        Try Again
      </Button>
    </div>
  </div>
</template>
