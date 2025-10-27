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

interface Tariff {
  id: string
  name: string
  created_at: string
}

interface Props {
  open: boolean
  tariffs: Tariff[]
  preselectedTariffId?: string
}

interface Emits {
  'update:open': [value: boolean]
  'add-price': [tariffId: string, name: string, discount: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedTariffId = ref('')
const priceName = ref('')
const discount = ref(0)
const isSubmitting = ref(false)

const handleSubmit = async () => {
  if (!selectedTariffId.value || !priceName.value.trim()) return
  
  isSubmitting.value = true
  emit('add-price', selectedTariffId.value, priceName.value.trim(), discount.value)
  
  // Reset form
  selectedTariffId.value = ''
  priceName.value = ''
  discount.value = 0
  isSubmitting.value = false
  emit('update:open', false)
}

const handleCancel = () => {
  selectedTariffId.value = ''
  priceName.value = ''
  discount.value = 0
  emit('update:open', false)
}

// Handle modal opening and preselection
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Set preselected tariff if provided
    if (props.preselectedTariffId) {
      selectedTariffId.value = props.preselectedTariffId
    }
    
    nextTick(() => {
      // Focus the appropriate input based on whether tariff is preselected
      if (props.preselectedTariffId) {
        const nameInput = document.querySelector('#price-name-input') as HTMLInputElement
        nameInput?.focus()
      } else {
        const select = document.querySelector('#tariff-select') as HTMLSelectElement
        select?.focus()
      }
    })
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Tariff Price</DialogTitle>
        <DialogDescription>
          Add a pricing option to an existing tariff. You can set a discount percentage (0% for no discount).
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label for="tariff-select" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Select Tariff
          </label>
          <select 
            id="tariff-select"
            v-model="selectedTariffId"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSubmitting"
            required
          >
            <option value="">Choose a tariff...</option>
            <option v-for="tariff in tariffs" :key="tariff.id" :value="tariff.id">
              {{ tariff.name }}
            </option>
          </select>
        </div>
        
        <div class="space-y-2">
          <label for="price-name-input" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Price Name
          </label>
          <Input
            id="price-name-input"
            v-model="priceName"
            placeholder="e.g., Standard, Premium, Student"
            :disabled="isSubmitting"
            required
          />
        </div>
        
        <div class="space-y-2">
          <label for="discount-input" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Discount Percentage
          </label>
          <Input
            id="discount-input"
            v-model.number="discount"
            type="number"
            placeholder="0"
            min="0"
            max="100"
            :disabled="isSubmitting"
          />
          <p class="text-xs text-muted-foreground">Enter 0 for no discount</p>
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
            :disabled="!selectedTariffId || !priceName.trim() || isSubmitting"
          >
            {{ isSubmitting ? 'Adding...' : 'Add Price' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
