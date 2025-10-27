<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'

interface Props {
  open: boolean
}

interface Emits {
  'update:open': [value: boolean]
  'add-tariff': [name: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tariffName = ref('')
const isSubmitting = ref(false)

const handleSubmit = async () => {
  if (!tariffName.value.trim()) return
  
  isSubmitting.value = true
  emit('add-tariff', tariffName.value.trim())
  
  // Reset form
  tariffName.value = ''
  isSubmitting.value = false
  emit('update:open', false)
}

const handleCancel = () => {
  tariffName.value = ''
  emit('update:open', false)
}

// Focus input when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      const input = document.querySelector('#tariff-name-input') as HTMLInputElement
      input?.focus()
    })
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Tariff</DialogTitle>
        <DialogDescription>
          Create a new tariff category. You can add pricing options after creating the tariff.
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label for="tariff-name-input" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Tariff Name
          </label>
          <Input
            id="tariff-name-input"
            v-model="tariffName"
            placeholder="Enter tariff name"
            :disabled="isSubmitting"
            required
          />
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="handleCancel"
            :disabled="isSubmitting"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!tariffName.trim() || isSubmitting"
          >
            {{ isSubmitting ? 'Creating...' : 'Create Tariff' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
