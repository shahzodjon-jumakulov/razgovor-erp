<script setup lang="ts">
interface Props {
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Loading...'
})
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="animate-pulse">
      <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div class="space-y-3">
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
</template>
